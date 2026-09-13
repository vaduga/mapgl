import type { RuntimeSubscription, RuntimeSubscriptionContext, RuntimeSubscriptionProvider } from './contracts';
import { ALERTING_NUMS, ALERTING_STATES } from '../types/defaults';
import { syncGraphNodeAnnotationsToEdges } from '@mapgl/panel-core/graph/frame';
import { getGraphNodeMap, getNodeData } from '@mapgl/panel-core/graph';

export const noopRuntimeSubscriptionProvider: RuntimeSubscriptionProvider = {
  id: 'core.noop-runtime-subscription',
  isEnabled: () => false,
  start: () => ({
    dispose: () => undefined,
  }),
};

export const annotationTimeRuntimeSubscriptionProvider: RuntimeSubscriptionProvider = {
  id: 'core.annotation-time-runtime-subscription',
  isEnabled: (context) => Boolean(context.data?.annotations?.length),
  start: () => ({
    dispose: () => undefined,
    onDataChange: (context) => {
      applyAnnotationTimeUpdate(context);
    },
  }),
};

export async function applyAnnotationTimeUpdate(context: RuntimeSubscriptionContext): Promise<void> {
  const time = context.time;
  const annotationTables = context.annotationTables;
  const graphs = context.annotationGraphs;
  const annotationBuffer = context.annotationBuffer;

  if (!time || !annotationTables?.length || !graphs?.length || !annotationBuffer) {
    return;
  }

  const { op, escape } = await import('arquero');
  if (context.signal?.aborted) {
    return;
  }
  let activeAnnotations: any[] = [];
  annotationTables.forEach(([annotTable, annotByInstance]) => {
    const filteredTable = annotByInstance.filter(escape((row) => row.timeEnd <= time));
    const summary = filteredTable.rollup({
      timeEnd: op.max('timeEnd'),
    });
    const annotations = annotTable.semijoin(summary).objects();
    if (annotations.length) {
      activeAnnotations = activeAnnotations.concat(annotations);
    }
  });

  graphs.forEach((graph) => {
    activeAnnotations.forEach(({ alertName, instance, data, newState, timeEnd }) => {
      const node = getGraphNodeMap(graph)?.get(instance);
      const feature = node ? getNodeData(node)?.feature : undefined;
      if (!node || !feature) {
        return;
      }

      const newAnnotation = { alertName, newState, instance, timeEnd, data };
      const allAnnotations = feature.all_annots;
      if ((allAnnotations?.length && allAnnotations.length === annotationTables.length) || !allAnnotations) {
        feature.all_annots = [newAnnotation];
      } else {
        feature.all_annots = [...allAnnotations, newAnnotation];
      }
      feature.all_annots = sortRuntimeAnnotations(feature.all_annots ?? []);
      syncGraphNodeAnnotationsToEdges(context.edgeIndex, node, feature.all_annots);

      const annotationState = feature.all_annots?.[0]?.newState;
      const stateKey = Object.keys(ALERTING_STATES).find((state) => annotationState?.startsWith(state));
      if (stateKey) {
        const [, , stateRGBArray] = ALERTING_NUMS[stateKey];
        annotationBuffer.set(stateRGBArray, feature.id * 4);
      }
    });
  });

  context.onAnnotationsApplied?.();
}

function sortRuntimeAnnotations(annotations: any[]): any[] {
  const stateOrder = { Alerting: 1, Pending: 2, Normal: 3 };

  return annotations.sort((a, b) => {
    const stateA = a.newState.startsWith('Alerting')
      ? 'Alerting'
      : a.newState.startsWith('Pending')
        ? 'Pending'
        : 'Normal';
    const stateB = b.newState.startsWith('Alerting')
      ? 'Alerting'
      : b.newState.startsWith('Pending')
        ? 'Pending'
        : 'Normal';

    return stateOrder[stateA] - stateOrder[stateB];
  });
}

export class RuntimeSubscriptionController {
  private subscriptions: RuntimeSubscription[] = [];
  private generation?: AbortController;
  private update?: AbortController;
  private ready = false;
  private pendingDataChange?: RuntimeSubscriptionContext;

  constructor(private readonly providers: RuntimeSubscriptionProvider[]) {}

  async start(context: RuntimeSubscriptionContext): Promise<void> {
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

  onDataChange(context: RuntimeSubscriptionContext): void {
    if (!this.generation || this.generation.signal.aborted) {
      return;
    }
    if (!this.ready) {
      this.pendingDataChange = context;
      return;
    }
    this.dispatchDataChange(context);
  }

  private scope(context: RuntimeSubscriptionContext, signal: AbortSignal): RuntimeSubscriptionContext {
    return {
      ...context,
      signal,
      publish: (event) => {
        if (!signal.aborted) {
          context.publish(event);
        }
      },
      onAnnotationsApplied: () => {
        if (!signal.aborted) {
          context.onAnnotationsApplied?.();
        }
      },
    };
  }

  private dispatchDataChange(context: RuntimeSubscriptionContext): void {
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
