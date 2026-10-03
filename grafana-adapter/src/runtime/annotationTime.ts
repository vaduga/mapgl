import { getGrafanaAnnotations, setGrafanaAnnotations, ALERTING_NUMS, ALERTING_STATES } from '../types/annotations';
import type { GrafanaRuntimeSubscriptionContext, GrafanaRuntimeSubscriptionProvider } from './contracts';

import { syncGraphNodeAnnotationsToEdges } from './annotationEdges';

import { getGraphNodeMap, getNodeData } from '@vaduga/mapgl-core/graph/main';
export const annotationTimeRuntimeSubscriptionProvider: GrafanaRuntimeSubscriptionProvider = {
  id: 'grafana.annotation-time-runtime-subscription',
  isEnabled: (context) => Boolean(context.data?.annotations?.length),
  start: () => ({
    dispose: () => undefined,
    onDataChange: (context) => {
      applyAnnotationTimeUpdate(context);
    },
  }),
};

export async function applyAnnotationTimeUpdate(context: GrafanaRuntimeSubscriptionContext): Promise<void> {
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
      const allAnnotations = getGrafanaAnnotations(feature);
      if ((allAnnotations?.length && allAnnotations.length === annotationTables.length) || !allAnnotations) {
        setGrafanaAnnotations(feature, [newAnnotation]);
      } else {
        setGrafanaAnnotations(feature, [...allAnnotations, newAnnotation]);
      }
      setGrafanaAnnotations(feature, sortRuntimeAnnotations(getGrafanaAnnotations(feature) ?? []));
      syncGraphNodeAnnotationsToEdges(context.edgeIndex, node, getGrafanaAnnotations(feature) ?? []);

      const annotationState = getGrafanaAnnotations(feature)?.[0]?.newState;
      const stateKey = Object.keys(ALERTING_STATES).find((state) => annotationState?.startsWith(state));
      if (stateKey) {
        const [, , stateRGBArray] = ALERTING_NUMS[stateKey];
        annotationBuffer.set(stateRGBArray, feature.id * 4);
      }
    });
  });

  if (!context.signal?.aborted) {
    context.onAnnotationsApplied?.();
  }
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
