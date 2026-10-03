import type { Node } from '@msagl/core';
import type { GraphEdgeIndex } from '@vaduga/mapgl-core/graph/main';
import { setGrafanaAnnotations, type GrafanaAnnotation } from '../types/annotations';
export function syncGraphNodeAnnotationsToEdges(
  edgeIndex: GraphEdgeIndex | undefined,
  node: Node,
  annotations: GrafanaAnnotation[]
): void {
  if (!edgeIndex) {
    return;
  }

  edgeIndex.forEachEdge((edge) => {
    if (edge.source === node && edge.data?.dataRecord) {
      setGrafanaAnnotations(edge.data.dataRecord, annotations);
    }
  });
}
