import { getGrafanaAnnotations } from '../../types/annotations';
import type { Node } from '@msagl/core';

import type { BiColProps } from '../../types/index';
import { type Edge, GraphEdgeIndex } from '@vaduga/mapgl-core/graph/main';

import { syncGraphNodeAnnotationsToEdges } from '../../runtime/annotationEdges';

function edge(source: Node, feature: BiColProps): Edge {
  return {
    source,
    data: { dataRecord: feature },
  } as Edge;
}

function feature(): BiColProps {
  return {
    id: 0,
    locName: 'A',
    layerName: 'test',
    frameRefId: 'A',
    rowIndex: 0,

    featSource: {} as BiColProps['featSource'],
    style: {},
    edgeStyle: {},
    arcStyle: {},
  };
}

describe('live graph visual synchronization', () => {
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
      nest: false,
    });
    edgeIndex.appendRecord({
      recordRef: 1,
      units: [{ unitRef: 1, edges: [edge(other, incoming)] }],
      vertexRefs: [],
      layerIndex: 0,
      wrap: 0,
      nest: false,
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

    expect(getGrafanaAnnotations(outgoing)).toBe(annotations);
    expect(getGrafanaAnnotations(incoming)).toBeUndefined();
  });
});
