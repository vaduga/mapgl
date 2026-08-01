import type { Node } from '@msagl/core';

import type { BiColProps } from '../../types';
import type { GraphEdgeIndex } from '../GraphEdgeIndex';
import type { GraphResolvedVisualGroup } from './types';

export function syncGraphEdgeGroupOverrides(
  edgeIndex: GraphEdgeIndex | undefined,
  edgeIds: Iterable<number>,
  group: GraphResolvedVisualGroup | undefined
): void {
  if (!edgeIndex || !group) {
    return;
  }

  for (const edgeId of edgeIds) {
    edgeIndex.forEachRecordEdge(edgeId, (edge) => {
      const edgeGroup = edge.data?.dataRecord?.edgeStyle?.group as GraphResolvedVisualGroup | undefined;
      if (edgeGroup) {
        Object.assign(edgeGroup, group);
      }
    });
  }
}

export function syncGraphNodeAnnotationsToEdges(
  edgeIndex: GraphEdgeIndex | undefined,
  node: Node,
  annotations: BiColProps['all_annots']
): void {
  if (!edgeIndex) {
    return;
  }

  edgeIndex.forEachEdge((edge) => {
    if (edge.source === node && edge.data?.dataRecord) {
      edge.data.dataRecord.all_annots = annotations;
    }
  });
}
