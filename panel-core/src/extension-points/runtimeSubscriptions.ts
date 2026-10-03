import type { RuntimeSubscription, RuntimeSubscriptionContext, RuntimeSubscriptionProvider } from './contracts';
export const noopRuntimeSubscriptionProvider: RuntimeSubscriptionProvider = {
  id: 'core.noop-runtime-subscription',
  isEnabled: () => false,
  start: () => ({
    dispose: () => undefined,
  }),
};

export class RuntimeSubscriptionController<C extends RuntimeSubscriptionContext = RuntimeSubscriptionContext> {
  private subscriptions: Array<RuntimeSubscription<C>> = [];
  private generation?: AbortController;
  private update?: AbortController;
  private ready = false;
  private pendingDataChange?: C;

  constructor(private readonly providers: Array<RuntimeSubscriptionProvider<C>>) {}

  async start(context: C): Promise<void> {
    this.dispose();
    const generation = new AbortController();
    this.generation = generation;
    const scoped = this.scope(context, generation.signal);
    try {
      for (const provider of this.providers) {
        if (generation.signal.aborted) {
          return;
        }
        if (provider.isEnabled && !provider.isEnabled(scoped)) {
          continue;
        }
        const subscription = await provider.start(scoped);
        if (generation.signal.aborted) {
          subscription.dispose();
          return;
        }
        this.subscriptions.push(subscription);
      }
      if (generation.signal.aborted) {
        return;
      }
      this.ready = true;
      const pending = this.pendingDataChange;
      this.pendingDataChange = undefined;
      if (pending) {
        this.dispatchDataChange(pending);
      }
    } catch (error) {
      if (generation.signal.aborted) {
        return;
      }
      this.dispose();
      throw error;
    }
  }

  onDataChange(context: C): void {
    if (!this.generation || this.generation.signal.aborted) {
      return;
    }
    if (!this.ready) {
      this.pendingDataChange = context;
      return;
    }
    this.dispatchDataChange(context);
  }

  private scope(context: C, signal: AbortSignal): C {
    return {
      ...context,
      signal,
      publish: (event) => {
        if (!signal.aborted) {
          context.publish(event);
        }
      },
    };
  }

  private dispatchDataChange(context: C): void {
    this.update?.abort();
    this.update = new AbortController();
    const scoped = this.scope(context, this.update.signal);
    this.subscriptions.forEach((subscription) => subscription.onDataChange?.(scoped));
  }

  dispose(): void {
    this.generation?.abort();
    this.update?.abort();
    this.ready = false;
    this.pendingDataChange = undefined;
    const subscriptions = this.subscriptions;
    this.subscriptions = [];
    // Dispose every resource even when one provider has a faulty cleanup.
    const errors: unknown[] = [];
    subscriptions.forEach((subscription) => {
      try {
        subscription.dispose();
      } catch (error) {
        errors.push(error);
      }
    });
    if (errors.length) {
      console.error('Runtime subscription cleanup failed', errors);
    }
  }
}
