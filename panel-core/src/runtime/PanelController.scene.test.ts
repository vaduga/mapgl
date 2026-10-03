import { GraphScene } from './GraphScene';
import { PanelController } from './PanelController';
import {
  createGraphPanelRenderState,
  type GraphPanelLayoutState,
  type GraphPanelRenderState,
} from '../graph/frame/graphPanelRuntime';
import { createVisibility } from '../store';
import { colTypes } from '../types';
import { metricGraphInput, metricGraphSource } from '../../examples/neutral';
import { getNodeData } from '../graph/main';

it('reconciles visibility before a refreshed graph is projected or published', async () => {
  const scene = new GraphScene();
  const project = jest.fn(() => scene.visibility.getVisState(null, colTypes.SVG, colTypes.SVG));
  const controller = new PanelController(
    {
      layout: (context) => ({
        positions: context.graph.positions,
        graphBounds: new Map(),
        curveGroups: new Map(),
        edgeIndexes: new Map(),
        edgeKeys: [],
        arrowTips: new Map(),
      }),
      render: createGraphPanelRenderState,
      prepareCommit: (state) => ({
        visibility: createVisibility({
          graph: state.render.state.graph,
          groupCount: 1,
          isLogic: false,
          isRouted: true,
          dataLayers: [{ name: 'nodes', type: colTypes.Markers }],
        }),
        project,
      }),
    },
    scene
  );
  await controller.update(metricGraphInput(metricGraphSource('first', [0, 100])));
  scene.visibility.setVisible(null, colTypes.SVG, colTypes.SVG, false);
  const observed: boolean[] = [];
  const unsubscribe = scene.subscribe(() => {
    if (scene.view.phase === 'ready') {
      observed.push(scene.visibility.getVisState(null, colTypes.SVG, colTypes.SVG)[0]);
    }
  });
  await controller.update(metricGraphInput(metricGraphSource('second', [100, 0])));
  expect(project).toHaveBeenCalledTimes(2);
  expect(project.mock.results[1].value).toEqual([false, false]);
  expect(observed).toEqual([false]);
  unsubscribe();
  controller.dispose();
});

it('coordinates loading, effective commit, retained failure and reconnect without duplicate subscriptions', async () => {
  const scene = new GraphScene();
  let fail = false;
  const controller = new PanelController(
    {
      layout: (context) => {
        if (fail) {
          throw new Error('failed layout');
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
      prepareCommit: (state) => ({
        visibility: createVisibility({
          graph: state.render.state.graph,
          groupCount: 1,
          isLogic: true,
          isRouted: true,
          dataLayers: [],
        }),
      }),
    },
    scene
  );
  const statuses: string[] = [];
  const accepted: unknown[][] = [];
  const dispose = scene.subscribe(() => {
    statuses.push(scene.view.phase);
    if (scene.view.phase === 'ready') {
      accepted.push([controller.state, scene.baseline]);
    }
  });
  await controller.update(metricGraphInput(metricGraphSource('first', [0, 100])));
  expect(statuses).toEqual(['loading', 'ready']);
  expect(accepted[0][0]).toBe(accepted[0][1]);
  expect(controller.stores.pointStore.graphHighlighter).toBeDefined();
  const lastRender = scene.render;
  const generation = scene.version;
  scene.transaction(() => {
    scene.setLayerShift('rack', [10, 20], generation);
    scene.setReadiness(false, true, generation);
  });
  expect(statuses).toHaveLength(3);
  fail = true;
  controller.invalidateGeometry();
  await expect(controller.update(metricGraphInput(metricGraphSource('second', [1, 2])))).rejects.toThrow(
    'failed layout'
  );
  expect(scene.render).toBe(lastRender);
  expect(scene.view.phase).toBe('fatal');
  expect(scene.pending).toBe(false);
  controller.clear();
  expect(scene.layerShift).toEqual({});
  expect(scene.setLayerShift('rack', [30, 40], generation)).toBe(false);
  expect(scene.setReadiness(true, true, generation)).toBe(false);
  expect(scene.publishProjection({ rendererFiltering: 'none' }, lastRender.positions, generation)).toBe(false);
  controller.dispose();
  dispose();
});

it.each([true, false])(
  'patches an individual node and matching edge metric without layout or projection reset (match: %s)',
  async (matchingMetric) => {
    const scene = new GraphScene();
    const layout = jest.fn((context) => ({
      positions: context.graph.positions,
      graphBounds: new Map(),
      curveGroups: new Map(),
      edgeIndexes: new Map(),
      edgeKeys: [],
      arrowTips: new Map(),
    }));
    const prepare = jest.fn((state) => ({
      visibility: createVisibility({
        graph: state.render.state.graph,
        groupCount: state.render.state.groups.length + 1,
        isLogic: true,
        isRouted: true,
        dataLayers: [],
      }),
    }));
    const controller = new PanelController(
      {
        isolateGraph: true,
        layout,
        render: createGraphPanelRenderState,
        prepareCommit: prepare,
      },
      scene
    );
    const base = metricGraphInput(metricGraphSource('first', [0, 100, 50]));
    const evaluateVisuals = (sources) => {
      const config = base.evaluateVisuals!(sources)[0];
      return [
        {
          ...config,
          node: (index) => ({
            ...config.node(index),
            color: {
              get: (row) => (sources[0].value('metric', row) === 75 ? '#0000ff' : config.node(index).color!.get(row)),
            },
          }),
          edge: (index) => ({ ...config.edge(index), colorKey: matchingMetric ? 'metric' : 'other' }),
        },
      ];
    };
    const input = {
      ...base,
      layers: base.layers.map((layer) => ({ ...layer, visualConfig: evaluateVisuals(layer.sources)[0] })),
      evaluateVisuals,
    };
    await controller.update(input);
    const before = controller.state!;
    const graph = scene.render.graph;
    const edgeIndex = scene.render.edgeIndex.clone();
    const positions = new Float64Array([10, 20, 30, 40, 50, 60]);
    const curveGroups = new Map();
    scene.update({ positions, curveGroups, edgeIndex });
    scene.setLayerShift('rack', [4, 5]);
    scene.publishProjection({ rendererFiltering: 'deck-category-filter' }, positions);
    scene.setLayoutProjected(true);
    const visibility = scene.visibility;
    const projection = scene.projection;
    const active = visibility.getActiveGroups().slice();
    active[0] = 0;
    active[before.visual.state.groups.length] = 0;
    visibility.setActiveGroups(active);
    const generation = scene.version;
    const observed: unknown[] = [];
    const unsubscribe = scene.subscribe(() =>
      observed.push([controller.state, scene.baseline, scene.render.positions])
    );
    const row = before.snapshot.nodes[0].primaryRow;
    const result = await controller.patchMetrics([{ row, propertyKey: 'metric', value: 75 }]);
    expect(result?.ok).toBe(true);
    expect(layout).toHaveBeenCalledTimes(1);
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(controller.state!.graph).toBe(before.graph);
    expect(controller.state!.layout.state).toBe(before.layout.state);
    expect(scene.render.graph).toBe(graph);
    expect(scene.render.edgeIndex).toBe(edgeIndex);
    expect(scene.render.positions).toBe(positions);
    expect(scene.render.curveGroups).toBe(curveGroups);
    expect(scene.version).toBe(generation);
    expect(scene.visibility).toBe(visibility);
    expect(scene.projection).toBe(projection);
    expect(scene.layerShift).toEqual({ rack: [4, 5] });
    expect(scene.layoutIncludesProjection).toBe(true);
    expect(scene.pending).toBe(false);
    const colors = visibility.getActiveGroups();
    expect(colors[0]).toBe(0);
    expect(colors[before.visual.state.groups.length]).toBe(1);
    expect(colors[controller.state!.visual.state.groups.length]).toBe(0);
    expect(controller.state!.visual.state.nodes[0].style.color).toEqual([0, 0, 255, 255]);
    const updatedNode = controller.state!.visual.state.nodes[0];
    const attachedFeature = getNodeData(scene.readGraph()!.nodeByKey.get(updatedNode.key)!)?.feature;
    expect(controller.state!.snapshot).toBe(before.snapshot);
    expect(attachedFeature).toBe(updatedNode.feature);
    expect(attachedFeature?.style.color).toEqual([0, 0, 255, 255]);
    expect(attachedFeature?.style.size).toBe(7.5);
    expect(attachedFeature?.style.size).not.toBe(before.visual.state.nodes[0].style.size);
    expect(controller.state!.visual.state.nodes[0]).not.toBe(before.visual.state.nodes[0]);
    expect(controller.state!.visual.state.nodes[1]).toBe(before.visual.state.nodes[1]);
    expect(controller.state!.visual.state.nodes[2]).toBe(before.visual.state.nodes[2]);
    expect(controller.state!.visual.state.edgeUnits[0] === before.visual.state.edgeUnits[0]).toBe(!matchingMetric);
    expect(controller.state!.visual.state.edgeUnits[1]).toBe(before.visual.state.edgeUnits[1]);
    expect(observed).toEqual([[controller.state, scene.baseline, positions]]);
    unsubscribe();
    controller.dispose();
  }
);
