import { GraphScene } from './GraphScene';
import { PanelController } from './PanelController';
import {
  createGraphPanelRenderState,
  type GraphPanelLayoutState,
  type GraphPanelRenderState,
} from '../graph/frame/graphPanelRuntime';
import { metricGraphInput, metricGraphSource } from '../../examples/neutral';

function runtime() {
  const scene = new GraphScene();
  let fail = false;
  const controller = new PanelController(
    {
      layout: (context) => {
        if (fail) {
          throw new Error('layout failed');
        }
        return {
          positions: context.graph.positions,
          graphBounds: new Map(),
          curveGroups: new Map(),
          edgeIndexes: new Map(),
          edgeKeys: [],
          arrowTips: new Map(),
        };
      },
      render: createGraphPanelRenderState,
    },
    scene
  );
  return {
    scene,
    controller,
    fail: () => {
      fail = true;
    },
  };
}

it('keeps the baseline distinct from effective edits and rejects edits from replaced generations', async () => {
  const { scene, controller } = runtime();
  await controller.update(metricGraphInput(metricGraphSource('first', [0, 100])));
  const baselinePositions = scene.baseline!.render.state.positions;
  const generation = scene.version;
  const positions = new Float64Array([10, 20, 30, 40]);
  expect(scene.update({ positions }, generation)).toBe(true);
  expect(scene.render.positions).toBe(positions);
  expect(scene.baseline!.render.state.positions).toBe(baselinePositions);
  await controller.update(metricGraphInput(metricGraphSource('second', [100, 0])));
  const accepted = scene.render;
  expect(scene.update({ positions }, generation)).toBe(false);
  expect(scene.render).toBe(accepted);
  controller.dispose();
});

it('publishes positions and routing together and retains rendering after a failed candidate', async () => {
  const { scene, controller, fail } = runtime();
  await controller.update(metricGraphInput(metricGraphSource('first', [0, 100])));
  const observed: unknown[] = [];
  const unsubscribe = scene.subscribe(() => observed.push(scene.render));
  const positions = new Float64Array([10, 20, 30, 40]);
  const curveGroups = new Map();
  scene.transaction(() => {
    scene.update({ positions });
    scene.update({ curveGroups });
  });
  expect(observed).toHaveLength(1);
  expect(observed[0]).toMatchObject({ positions, curveGroups });
  const accepted = scene.render;
  fail();
  controller.invalidateGeometry();
  await expect(controller.update(metricGraphInput(metricGraphSource('second', [1, 2])))).rejects.toThrow(
    'layout failed'
  );
  expect(scene.render).toBe(accepted);
  scene.clear();
  expect(scene.render.edgeIndex.recordCount).toBe(0);
  expect(scene.render.positions).toHaveLength(0);
  expect(scene.baseline).toBeUndefined();
  unsubscribe();
  controller.dispose();
});
