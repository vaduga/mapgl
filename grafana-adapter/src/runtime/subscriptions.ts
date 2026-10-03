import { RuntimeSubscriptionController } from '@vaduga/mapgl-core/featureContracts';
import type {
  GrafanaPanelBinding,
  GrafanaRuntimeSubscriptionContext,
  GrafanaRuntimeSubscriptionProvider,
} from './contracts';

/** Host providers share the core cancellation lifecycle without converting their context. */
export class GrafanaRuntimeSubscriptions {
  private readonly controller: RuntimeSubscriptionController<GrafanaRuntimeSubscriptionContext>;
  private readonly bindings = new Map<string, { keys: readonly unknown[]; dispose: () => void; release: () => void }>();
  private readonly transports = new Map<
    string,
    {
      key: unknown;
      eventBus: GrafanaRuntimeSubscriptionContext['eventBus'];
      controller: RuntimeSubscriptionController<GrafanaRuntimeSubscriptionContext>;
      current: GrafanaRuntimeSubscriptionContext;
    }
  >();
  private readonly panelProviders: readonly GrafanaRuntimeSubscriptionProvider[];
  constructor(providers: readonly GrafanaRuntimeSubscriptionProvider[]) {
    this.panelProviders = providers.filter((provider) => provider.lifetime === 'panel');
    this.controller = new RuntimeSubscriptionController<GrafanaRuntimeSubscriptionContext>(
      providers
        .filter((provider) => provider.lifetime !== 'panel')
        .map((provider) => ({
          id: provider.id,
          isEnabled: (context) => provider.isEnabled?.(this.guardAnnotations(context)) ?? true,
          start: async (context) => {
            const subscription = await provider.start(this.guardAnnotations(context));
            return {
              dispose: () => subscription.dispose(),
              onDataChange: (context) => subscription.onDataChange?.(this.guardAnnotations(context)),
            };
          },
        }))
    );
  }
  /** Panel bindings reconcile synchronously, independently of asynchronous transports. */
  bindPanel(binding: GrafanaPanelBinding): () => void {
    const previous = this.bindings.get(binding.id);
    if (
      previous &&
      previous.keys.length === binding.keys.length &&
      previous.keys.every((key, index) => Object.is(key, binding.keys[index]))
    ) {
      return previous.release;
    }
    previous?.dispose();
    this.bindings.delete(binding.id);
    const lifetime = new AbortController();
    const cleanup = binding.start(lifetime.signal);
    const entry = {
      keys: [...binding.keys],
      dispose: () => {
        lifetime.abort();
        cleanup();
      },
      release: () => this.releaseBinding(binding.id, entry),
    };
    this.bindings.set(binding.id, entry);
    return entry.release;
  }
  private releaseBinding(id: string, entry: { dispose: () => void }): void {
    if (this.bindings.get(id) === entry) {
      this.bindings.delete(id);
      entry.dispose();
    }
  }
  private syncTransports(context: GrafanaRuntimeSubscriptionContext): void {
    for (const provider of this.panelProviders) {
      const previous = this.transports.get(provider.id);
      const enabled = provider.isEnabled?.(context) ?? true;
      const key = provider.connectionKey?.(context);
      if (previous && enabled && previous.eventBus === context.eventBus && Object.is(previous.key, key)) {
        previous.current = context;
        continue;
      }
      previous?.controller.dispose();
      this.transports.delete(provider.id);
      if (!enabled) {
        continue;
      }
      const entry = {
        key,
        eventBus: context.eventBus,
        current: context,
        controller: new RuntimeSubscriptionController<GrafanaRuntimeSubscriptionContext>([]),
      };
      entry.controller = new RuntimeSubscriptionController<GrafanaRuntimeSubscriptionContext>([
        {
          id: provider.id,
          start: async (scope) => {
            const signal = scope.signal;
            const subscription = await provider.start({
              ...entry.current,
              signal,
              publish: (event) => {
                if (!signal?.aborted) {
                  entry.current.publish(event);
                }
              },
            });
            return { dispose: () => subscription.dispose() };
          },
        },
      ]);
      this.transports.set(provider.id, entry);
      void entry.controller.start(context).catch((error) => console.error('Panel transport failed', error));
    }
  }
  private guardAnnotations(context: GrafanaRuntimeSubscriptionContext): GrafanaRuntimeSubscriptionContext {
    return {
      ...context,
      onAnnotationsApplied: () => {
        if (!context.signal?.aborted) {
          context.onAnnotationsApplied?.();
        }
      },
    };
  }
  updatePanel(context: GrafanaRuntimeSubscriptionContext): void {
    this.syncTransports(context);
  }
  start(context: GrafanaRuntimeSubscriptionContext): Promise<void> {
    this.syncTransports(context);
    return this.controller.start(context);
  }
  onDataChange(context: GrafanaRuntimeSubscriptionContext): void {
    this.syncTransports(context);
    this.controller.onDataChange(context);
  }
  dispose(): void {
    this.controller.dispose();
    this.transports.forEach((entry) => entry.controller.dispose());
    this.transports.clear();
    const bindings = [...this.bindings.values()];
    this.bindings.clear();
    bindings.forEach((entry) => {
      try {
        entry.dispose();
      } catch (error) {
        console.error('Panel binding cleanup failed', error);
      }
    });
  }
}
