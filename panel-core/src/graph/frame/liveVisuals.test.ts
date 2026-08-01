import type { Node } from '@msagl/core';

import type { BiColProps } from '../../types';
import type { Edge } from '../main';
import { GraphEdgeIndex } from '../GraphEdgeIndex';
import { syncGraphEdgeGroupOverrides, syncGraphNodeAnnotationsToEdges } from './liveVisuals';
import type { GraphResolvedVisualGroup } from './types';

function edge(source: Node, feature: BiColProps): Edge {
  return {
    source,
    data: { dataRecord: feature },
  } as Edge;
}

function feature(group?: GraphResolvedVisualGroup): BiColProps {
  return {
    id: 0,
    locName: 'A',
    layerName: 'test',
    frameRefId: 'A',
    rowIndex: 0,
    featSource: {} as BiColProps['featSource'],
    style: {},
    edgeStyle: group ? { group } : {},
    arcStyle: {},
  };
}

describe('live graph visual synchronization', () => {
  it('refreshes only edges configured with a matching node color group override', () => {
    const source = {} as Node;
    const sharedEdgeGroup = {
      label: 'old',
      color: [1, 2, 3, 255],
      groupIdx: 1,
    } as GraphResolvedVisualGroup;
    const overridden = feature(sharedEdgeGroup);
    const independent = feature();
    const edgeIndex = new GraphEdgeIndex();
    edgeIndex.appendRecord({
      recordRef: 0,
      units: [{ unitRef: 0, edges: [edge(source, overridden)] }],
      vertexRefs: [],
      layerIndex: 0,
      wrap: 0,
    });
    edgeIndex.appendRecord({
      recordRef: 1,
      units: [{ unitRef: 1, edges: [edge(source, independent)] }],
      vertexRefs: [],
      layerIndex: 0,
      wrap: 0,
    });
    edgeIndex.finalize();

    const nextGroup = {
      label: 'updated',
      color: [10, 20, 30, 255],
      groupIdx: 2,
    } as GraphResolvedVisualGroup;
    syncGraphEdgeGroupOverrides(edgeIndex, [0, 1], nextGroup);

    expect(overridden.edgeStyle.group).toBe(sharedEdgeGroup);
    expect(overridden.edgeStyle.group).toMatchObject(nextGroup);
    expect(independent.edgeStyle.group).toBeUndefined();
  });

  it('propagates node annotations only to edges originating at that node', () => {
    const source = {} as Node;
    const other = {} as Node;
    const outgoing = feature();
    const incoming = feature();
    const edgeIndex = new GraphEdgeIndex();
    edgeIndex.appendRecord({
      recordRef: 0,
      units: [{ unitRef: 0, edges: [edge(source, outgoing)] }],
      vertexRefs: [],
      layerIndex: 0,
      wrap: 0,
    });
    edgeIndex.appendRecord({
      recordRef: 1,
      units: [{ unitRef: 1, edges: [edge(other, incoming)] }],
      vertexRefs: [],
      layerIndex: 0,
      wrap: 0,
    });
    edgeIndex.finalize();
    const annotations = [
      {
        alertName: 'node alert',
        newState: 'Alerting',
        instance: 'A',
        timeEnd: 1,
        data: {},
      },
    ];

    syncGraphNodeAnnotationsToEdges(edgeIndex, source, annotations);

    expect(outgoing.all_annots).toBe(annotations);
    expect(incoming.all_annots).toBeUndefined();
  });
});
