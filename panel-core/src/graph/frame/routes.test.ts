import { arrayColumn } from '../../data';
import { GraphHighlighter } from '../../deckLayers/GraphHighlighter';
import { getEdgesGeometry } from '../utils';
import { buildGraphFromSnapshot } from './buildGraph';
import { normalizeGraphSources } from './normalizeSources';

it('renders and highlights a multi-hop relation with endpoint arrows and one adjacency', async () => {
  const result = await normalizeGraphSources({
    layers: [
      {
        options: { isLogic: false },
        sources: [
          {
            revision: 'route',
            key: 'route',
            index: 0,
            rowCount: 3,
            nodeId: arrayColumn('id', ['A', 'B', 'C']),
            target: arrayColumn('target', [['A', 'B', 'C'], null, null]),
            edgeId: arrayColumn('edge', ['route-1', null, null]),
            position: (row) =>
              [
                [10, 50],
                [15, 55],
                [20, 60],
              ][row] as [number, number],
            value: () => undefined,
          },
        ],
      },
    ],
  });
  if (!result.ok) {
    throw new Error('normalization failed');
  }
  const built = buildGraphFromSnapshot(result.value);
  if (!built.ok) {
    throw new Error('build failed');
  }
  const graph = built.value;
  const edges = [...graph.edgeIndex.recordEdges(0)];
  expect(edges.map(({ id, data }) => [id, data.arrowPlacement])).toEqual([
    ['route-1', 'start'],
    ['route-1--1', 'end'],
  ]);
  expect(graph.edgeIndex.getRecordVertexView(0)).toEqual(Int32Array.of(0, 1, 2));
  edges.forEach((edge, edgeRef) => {
    expect(graph.edgeIndex.getEdge(edgeRef)).toBe(edge);
    expect(edge.data).toMatchObject({ edgeRef, recordRef: 0, unitRef: graph.edgeIndex.getEdgeUnitRef(edgeRef) });
  });
  const { routed, mappings } = getEdgesGeometry({
    ...graph,
    snapshot: result.value,
    visibleNamespaces: [graph.graph.id],
    layout: { curveGroups: new Map(), edgeIndexes: new Map(), arrowTips: new Map() },
    layoutReady: false,
    layoutIncludesProjection: false,
    edgeOffsetStrategies: [],
    terminalGeometryStrategies: [],
    isLogic: false,
    layerShift: {},
    projection: { contractsHiddenNamespaces: false },
  } as any);
  expect(
    routed[graph.graph.id].map(({ edgeRef, lineId, edgeId, geometry }) => [
      edgeRef,
      lineId,
      edgeId,
      geometry.coordinates,
    ])
  ).toEqual([
    [
      0,
      0,
      'route-1',
      [
        [10, 50],
        [15, 55],
      ],
    ],
    [
      1,
      1,
      'route-1--1',
      [
        [15, 55],
        [20, 60],
      ],
    ],
  ]);
  expect(mappings.map((mapping) => mapping?.lineId)).toEqual([0, 1]);
  const highlighter = new GraphHighlighter();
  highlighter.setGraph(graph.graph, { edgeIndex: graph.edgeIndex, mappings });
  const ids = (groups) => groups.map((group) => group.map(({ id }) => id));
  expect(ids(highlighter.getOutEdgeGroups(graph.graph.findNode('A')))).toEqual([['route-1', 'route-1--1']]);
  expect(ids(highlighter.getInEdgeGroups(graph.graph.findNode('C')))).toEqual([['route-1', 'route-1--1']]);
  highlighter.update({ sourceId: 'A', graphId: graph.graph.id, maxDepth: 1 });
  expect(Array.from(highlighter.getConnectedNodeIds(), (key) => key.split('\u0000').at(-1)).sort()).toEqual(['A', 'C']);
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
