import { PanelController } from './PanelController';
import { resolveSelection, selectionViewport } from './selection';
import { Graph } from '../graph/main';
import { metricGraphInput, metricGraphSource } from '../../examples/neutral';

it('completes selection and focus before notifying a host without an event echo', async () => {
  const runtime = new PanelController();
  await runtime.update(metricGraphInput(metricGraphSource('graph', [0, 10])));
  const node = [...runtime.state!.graph.state.nodeByKey.values()][0];
  const edge = [...runtime.state!.graph.state.graph.deepEdges][0];
  const listener = jest.fn(() => ({
    node: runtime.stores.pointStore.getSelectedNode,
    edges: runtime.stores.pointStore.getSelEdges,
    focusedEdge: runtime.stores.pointStore.focusedEdgeId,
  }));
  runtime.subscribe(listener);
  runtime.select({ id: node.id, namespaceId: (node.parent as Graph).id }, 'user', [edge]);
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener.mock.results[0].value).toEqual({ node, edges: [edge], focusedEdge: edge.id });
  const resolved = resolveSelection(runtime.state!.graph.state.graph, { nodeId: node.id, edgeId: edge.id });
  expect(resolved).toEqual({ node, edge });
  runtime.dispose();
});

it('navigates to zero coordinates and rejects missing positions', () => {
  expect(selectionViewport({ coordinates: [0, 0], zoomIn: true }, undefined, [], true, 4)).toMatchObject({
    longitude: 0,
    latitude: 0,
    zoom: 1.5,
    target: [0, 0, 0],
  });
  expect(selectionViewport({ coordinates: [0, 0] }, undefined, [], false, 4)).toMatchObject({
    zoom: 4,
    target: [0, 0, 4],
  });
  expect(selectionViewport({}, undefined, [], true)).toBeUndefined();
});
