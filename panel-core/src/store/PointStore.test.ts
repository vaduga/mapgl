import { PanelController } from '../runtime/PanelController';
import { applyGraphVisualState } from '../graph/frame/visualState';
import { getGraphData, Graph, setGraphData } from '../graph/main';
import { colTypes } from '../types';
import { metricGraphInput, metricGraphSource } from '../../examples/neutral';

it('owns direction, semantic focus, selected indexes and graph replacement without a host bridge', async () => {
  const runtime = new PanelController({});
  await runtime.update(metricGraphInput(metricGraphSource('first', [0, 50, 100])));
  const store = runtime.stores.pointStore;
  const node = [...runtime.state!.graph.state.nodeByKey.values()][1];
  const edgeIndex = runtime.state!.graph.state.edgeIndex;
  edgeIndex.forEachEdge((edge, ref) => edge.setLineId(10 + ref));
  store.setSelectedNode(node);
  expect(store.getSelectedIdxs.get(colTypes.Edges)).toEqual({ [String((node.parent as Graph).id)]: [11] });
  expect(store.getSelEdges).toHaveLength(1);
  expect(store.getHasFocusHighlight).toBe(true);
  expect(store.getSelectedIdxs.get(colTypes.Nodes)).toEqual({ [String((node.parent as Graph).id)]: [1] });
  store.setEdgeListed(true);
  store.setIsDefDir(false);
  store.setSelectedNode(node);
  expect(store.getSelEdges[0].target.id).toBe(node.id);
  const edgeId = store.getSelEdges[0].id;
  store.focus({ kind: 'edge', id: edgeId, namespaceId: String((node.parent as Graph).id) });
  expect(store.focusedEdgeId).toBe(edgeId);
  await runtime.update(metricGraphInput(metricGraphSource('replacement', [1, 2, 3])));
  expect(store.getSelectedNode?.id).toBe(node.id);
  expect(store.getSelectedNode).not.toBe(node);
  expect(store.getSelEdges[0].target).toBe(store.getSelectedNode);
  expect(store.getFocusedConnectedNodeIds.size).toBeGreaterThan(0);
  store.focus();
  expect(store.getHasFocusHighlight).toBe(false);
  runtime.dispose();
});

it('resolves namespace polygon selection indexes from neutral graph metadata', async () => {
  const runtime = new PanelController();
  await runtime.update(metricGraphInput(metricGraphSource('first', [0])));
  const graph = runtime.state!.graph.state.graph;
  const namespace = new Graph('rack');
  graph.addNode(namespace);
  setGraphData(namespace, { ...getGraphData(namespace), idx: 4, feature: { type: 'Polygon' } } as any);
  runtime.stores.pointStore.setSelectedNode(namespace);
  expect(runtime.stores.pointStore.getSelectedIdxs.get(colTypes.Bboxes)).toEqual([4]);
  runtime.dispose();
});
