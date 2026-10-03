import { GraphScene } from './GraphScene';
import { PanelController } from './PanelController';
import { resolvePickingFocus } from './picking';
import { createGraphPanelRenderState } from '../graph/frame/graphPanelRuntime';
import { emptyGraphLayout, metricGraphInput, metricGraphSource } from '../../examples/neutral';

it('resolves binary node and runtime edge picks and rejects picks from replaced query snapshots', async () => {
  const scene = new GraphScene();
  const controller = new PanelController(
    {
      layout: (context) => emptyGraphLayout(context.graph.positions),
      render: createGraphPanelRenderState,
    },
    scene
  );
  await controller.update(metricGraphInput(metricGraphSource('first', [0, 100])));
  const pick = {
    picked: true,
    index: 0,
    featureType: 'points',
    sourceLayer: {
      props: {
        data: {
          points: { featureIds: { value: new Uint32Array([1, 0]) } },
        },
      },
    },
  };
  const record = controller.state!.snapshot.nodes[1];
  expect(resolvePickingFocus(scene, pick)).toEqual({ kind: 'node', id: record.id, namespaceId: record.namespaceId });
  const edge = [...scene.render.graph.deepEdges][0];
  expect(
    resolvePickingFocus(scene, {
      picked: true,
      object: { edgeId: edge.id, edgeRef: scene.render.edgeIndex.getEdgeRef(edge) },
    })
  ).toMatchObject({ kind: 'edge', id: edge.id });
  const oldFeature = { ...scene.render.features[1], graphFrame: { key: record.key, primaryRow: record.primaryRow } };
  await controller.update(metricGraphInput(metricGraphSource('second', [100, 0])));
  expect(
    resolvePickingFocus(scene, { picked: true, object: { pointIndex: 1, properties: oldFeature } })
  ).toBeUndefined();
  expect(resolvePickingFocus(scene, { ...pick, picked: false })).toBeUndefined();
  expect(resolvePickingFocus(scene, { ...pick, index: -1 })).toBeUndefined();
  controller.dispose();
});
