import { toDataFrame } from '@grafana/data';

import { GraphHighlighter } from '../../deckLayers/GraphHighlighter';
import { buildMapglFeatureServices, setMapglFeatureServices } from '../../extension-points/featureContracts';
import { getEdgesGeometry } from '../utils/utils.graph-geom';
import { getNodeData } from '../main';
import { buildGraphFromSnapshot } from './buildGraph';
import { normalizeGraphFrames } from './normalize';
import type { GraphFrameOptions, GraphStageResult } from './types';

const options: GraphFrameOptions = {
  layerName: 'runtime compatibility baseline',
  nodeIdField: 'source',
  targetField: 'target',
  edgeIdField: 'edgeId',
  isLogic: false,
};

function success<T>(result: GraphStageResult<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('Expected successful graph stage');
  }
  return result.value;
}

async function routedState() {
  const frame = toDataFrame({
    refId: 'RuntimeRoute',
    fields: [
      { name: 'source', values: ['A', 'B', 'C'] },
      { name: 'target', values: ['["A","B","C"]', null, null] },
      { name: 'edgeId', values: ['route-1', null, null] },
      { name: 'longitude', values: [10, 15, 20] },
      { name: 'latitude', values: [50, 55, 60] },
    ],
  });
  const snapshot = success(await normalizeGraphFrames({ data: { series: [frame] }, options }));
  const graph = success(buildGraphFromSnapshot(snapshot));
  const panel = {
    graph: graph.graph,
    graphEdgeIndex: graph.edgeIndex,
    graphFrameRuntime: { snapshot },
    positions: graph.positions,
    visLayers: { getCategories: () => [[], [graph.graph.id]] },
    isLogic: false,
    layerShift: {},
    namespaceProjection: { contractsHiddenNamespaces: false },
  };
  return { graph, panel };
}

describe('multi-hop runtime compatibility baseline', () => {
  beforeEach(() => {
    setMapglFeatureServices(buildMapglFeatureServices({ edition: 'oss' }));
  });

  it('preserves route segments, arrow placement, line identity, and geometry', async () => {
    const { graph, panel } = await routedState();
    const runtimeEdges = [...graph.edgeIndex.recordEdges(0)];

    expect(runtimeEdges.map(({ id }) => id)).toEqual(['route-1', 'route-1--1']);
    expect(runtimeEdges.map(({ data }) => data.arrowPlacement)).toEqual(['start', 'end']);
    expect(
      runtimeEdges.map((edge) => graph.edgeIndex.getEdgeSegmentOrdinal(graph.edgeIndex.getEdgeRef(edge)!))
    ).toEqual([0, 1]);
    expect(graph.edgeIndex.getRecordVertexView(0)).toEqual(new Int32Array([0, 1, 2]));
    panel.graphFrameRuntime.snapshot.nodes.forEach((record) => {
      const nodeRef = getNodeData(graph.nodeByKey.get(record.key)!)?.wasmId;
      expect(nodeRef).toBe(record.index);
      expect(graph.positions[record.index * 2]).toBeDefined();
      expect(graph.positions[record.index * 2 + 1]).toBeDefined();
    });
    runtimeEdges.forEach((edge) => {
      const edgeRef = graph.edgeIndex.getEdgeRef(edge)!;
      expect(graph.edgeIndex.getEdge(edgeRef)).toBe(edge);
      expect(graph.edgeIndex.getEdgeRecordRef(edgeRef)).toBe(0);
      expect(edge.data.recordRef).toBe(0);
      expect(edge.data.edgeRef).toBe(edgeRef);
      expect(edge.data.unitRef).toBe(graph.edgeIndex.getEdgeUnitRef(edgeRef));
    });

    const [features] = getEdgesGeometry(panel);
    const lines = features[graph.graph.id];
    expect(
      lines.map(({ edgeRef, lineId, edgeId, geometry }) => ({
        edgeRef,
        lineId,
        edgeId,
        coordinates: geometry.coordinates,
      }))
    ).toEqual([
      {
        edgeRef: 0,
        lineId: 0,
        edgeId: 'route-1',
        coordinates: [
          [10, 50],
          [15, 55],
        ],
      },
      {
        edgeRef: 1,
        lineId: 1,
        edgeId: 'route-1--1',
        coordinates: [
          [15, 55],
          [20, 60],
        ],
      },
    ]);
    expect(runtimeEdges.map(({ lineId }) => lineId)).toEqual([0, 1]);
  });

  it('treats a multi-hop route as one adjacency while highlighting every rendered segment', async () => {
    const { graph, panel } = await routedState();
    getEdgesGeometry(panel);
    const highlighter = new GraphHighlighter();
    highlighter.setGraph(graph.graph, { edgeIndex: graph.edgeIndex });
    const nodeA = graph.graph.findNode('A');
    const nodeC = graph.graph.findNode('C');

    expect(highlighter.getOutEdgeGroups(nodeA).map((group) => group.map(({ id }) => id))).toEqual([
      ['route-1', 'route-1--1'],
    ]);
    expect(highlighter.getInEdgeGroups(nodeC).map((group) => group.map(({ id }) => id))).toEqual([
      ['route-1', 'route-1--1'],
    ]);

    highlighter.update({ sourceId: 'A', graphId: graph.graph.id, maxDepth: 1 });
    expect(Array.from(highlighter.getConnectedNodeIds(), (key) => key.split('\u0000').at(-1)).sort()).toEqual([
      'A',
      'C',
    ]);
    expect(highlighter.getConnectedEdgeIndexes().map(({ lineId, depth }) => [lineId, depth])).toEqual([
      [0, 1],
      [1, 1],
    ]);

    highlighter.updateEdge({ edgeId: 'route-1--1', graphId: graph.graph.id });
    expect(highlighter.getConnectedEdgeIndexes().map(({ lineId, depth }) => [lineId, depth])).toEqual([
      [0, 0],
      [1, 0],
    ]);
  });
});
