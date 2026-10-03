jest.mock('../render/index', () => ({ updateThresholdColor: jest.fn() }));
import { MapPanelRuntime } from './MapPanelRuntime';
import { metricGraphInput, metricGraphSource } from '../../../panel-core/examples/neutral';
import { getNodeData } from '@vaduga/mapgl-core/graph/main';
import type { GraphPanelPipelineState } from '@vaduga/mapgl-core/graph/frame';

it.each([true, false])(
  'hydrates node styles when metric updates retain topology and layout (logic: %s)',
  async (isLogic) => {
    class TestPanel extends MapPanelRuntime {
      readonly mapLayerRegistry = {} as any;
      readonly orthoBasemapConfig = {} as any;
      protected renderMap() {
        return null;
      }
    }
    const panel = new TestPanel({
      id: 1,
      options: { dataLayers: [], common: {}, view: {} },
      data: { series: [] },
      eventBus: { publish: jest.fn(), subscribe: () => ({ unsubscribe: jest.fn() }) },
      replaceVariables: (value: string) => value,
      onOptionsChange: jest.fn(),
      width: 800,
      height: 600,
    } as any);
    panel.isLogic = isLogic;
    const layout = jest.spyOn(panel.layoutWorker, 'requestLayout').mockResolvedValue(undefined);
    const input = (revision: string, metrics: number[]) => {
      const base = metricGraphInput(metricGraphSource(revision, metrics), false);
      return {
        ...base,
        layers: base.layers.map((layer) => ({ ...layer, options: { ...layer.options, isLogic } })),
      };
    };
    const attached = () => {
      const state = panel.controller.state!;
      return getNodeData(state.graph.state.nodeByKey.get(state.visual.state.nodes[0].key)!)?.feature;
    };

    await panel.controller.update(input('first', [0, 100, 50]));
    const first = panel.controller.state!;
    const firstFeature = attached();
    expect(firstFeature?.style.color).toEqual([0, 128, 0, 255]);

    await panel.controller.update(input('second', [75, 100, 50]));
    const refreshed = panel.controller.state!;
    expect(refreshed.snapshot.topologySignature).toBe(first.snapshot.topologySignature);
    expect(refreshed.snapshot.geometrySignature).toBe(first.snapshot.geometrySignature);
    expect(refreshed.layout.reused).toBe(true);
    expect(attached()).not.toBe(firstFeature);
    expect(attached()).toBe(refreshed.visual.state.nodes[0].feature);
    expect(attached()?.style.color).toEqual([255, 0, 0, 255]);

    const result = await panel.controller.patchMetrics([
      { row: refreshed.snapshot.nodes[0].primaryRow, propertyKey: 'metric', value: 0 },
    ]);
    expect(result?.ok).toBe(true);
    const updated = panel.controller.state!;
    expect(updated.snapshot).toBe(refreshed.snapshot);
    expect(updated.graph.state).toBe(refreshed.graph.state);
    expect(updated.layout.state).toBe(refreshed.layout.state);
    expect(updated.layout.reused).toBe(true);
    expect(panel.scene.render.graph).toBe(updated.graph.state.graph);
    expect(attached()).toBe(updated.visual.state.nodes[0].feature);
    expect(attached()?.style.color).toEqual([0, 128, 0, 255]);
    expect(layout).toHaveBeenCalledTimes(isLogic ? 1 : 0);
    panel.componentWillUnmount();
  }
);

it('hydrates Geo edge metrics before preparing an engine after a wrap edit reuses layout', async () => {
  class TestPanel extends MapPanelRuntime {
    readonly mapLayerRegistry = {} as any;
    readonly orthoBasemapConfig = {} as any;
    readonly preparedEdges: Array<{ wrap: number; colorMetric: number | undefined }> = [];

    protected renderMap() {
      return null;
    }

    protected prepareGraphCommit(state: GraphPanelPipelineState) {
      const edgeIndex = state.graph.state.edgeIndex;
      this.preparedEdges.push({
        wrap: edgeIndex.getRecordWrap(0),
        colorMetric: edgeIndex.getRecordMetrics(0).sideB,
      });
      return super.prepareGraphCommit(state);
    }
  }

  const panel = new TestPanel({
    id: 1,
    options: { dataLayers: [], common: {}, view: {} },
    data: { series: [] },
    eventBus: { publish: jest.fn(), subscribe: () => ({ unsubscribe: jest.fn() }) },
    replaceVariables: (value: string) => value,
    onOptionsChange: jest.fn(),
    width: 800,
    height: 600,
  } as any);
  panel.isLogic = false;
  const source = metricGraphSource('geo-wrap-edit', [8, 21, 0]);
  const input = (wrap: number) => {
    const base = metricGraphInput(source, false);
    return {
      ...base,
      layers: base.layers.map((layer) => ({
        ...layer,
        options: { ...layer.options, isLogic: false },
        graphOptions: { wrap },
      })),
    };
  };

  await panel.controller.update(input(0));
  const first = panel.controller.state!;
  await panel.controller.update(input(1));
  const edited = panel.controller.state!;

  expect(edited.layout.reused).toBe(true);
  expect(edited.graph.state).not.toBe(first.graph.state);
  expect(panel.preparedEdges).toEqual([
    { wrap: 0, colorMetric: 8 },
    { wrap: 1, colorMetric: 8 },
  ]);
  panel.componentWillUnmount();
});

it('recreates disposed integration resources during setup/cleanup/setup before viewport attachment', async () => {
  class TestPanel extends MapPanelRuntime {
    readonly mapLayerRegistry = {} as any;
    readonly orthoBasemapConfig = {} as any;
    protected renderMap() {
      return null;
    }
  }
  const panel = new TestPanel({
    id: 1,
    options: { dataLayers: [], common: {}, view: {} },
    data: { series: [] },
    eventBus: { publish: jest.fn(), subscribe: () => ({ unsubscribe: jest.fn() }) },
    replaceVariables: (value: string) => value,
    onOptionsChange: jest.fn(),
    width: 800,
    height: 600,
  } as any);
  const initialize = jest.fn().mockResolvedValue(undefined);
  (panel as any).initializeLayers = initialize;
  const original = panel.controller;
  await panel.componentDidMount();
  expect(initialize).toHaveBeenCalledTimes(1);
  expect(panel.map).toBeUndefined();
  panel.componentWillUnmount();
  await panel.componentDidMount();
  expect(panel.controller).not.toBe(original);
  expect(initialize).toHaveBeenCalledTimes(2);
  expect(panel.map).toBeUndefined();
  panel.componentWillUnmount();
});

it('waits for edition integration and ignores a mount disposed while integration is pending', async () => {
  let release!: () => void;
  class TestPanel extends MapPanelRuntime {
    readonly mapLayerRegistry = {} as any;
    readonly orthoBasemapConfig = {} as any;
    protected renderMap() {
      return null;
    }
    protected initializeIntegration() {
      return new Promise<void>((resolve) => {
        release = resolve;
      });
    }
  }
  const panel = new TestPanel({
    id: 1,
    options: { dataLayers: [], common: {}, view: {} },
    data: { series: [] },
    eventBus: { publish: jest.fn(), subscribe: () => ({ unsubscribe: jest.fn() }) },
    replaceVariables: (value: string) => value,
    onOptionsChange: jest.fn(),
    width: 800,
    height: 600,
  } as any);
  const initialize = jest.fn().mockResolvedValue(undefined);
  (panel as any).initializeLayers = initialize;
  const mount = panel.componentDidMount();
  expect(initialize).not.toHaveBeenCalled();
  panel.componentWillUnmount();
  release();
  await mount;
  expect(initialize).not.toHaveBeenCalled();
  const remount = panel.componentDidMount();
  expect(initialize).not.toHaveBeenCalled();
  release();
  await remount;
  expect(initialize).toHaveBeenCalledTimes(1);
  panel.componentWillUnmount();
});

it('updates native configuration without overwriting a user cluster setting on scene refresh', async () => {
  class TestPanel extends MapPanelRuntime {
    readonly mapLayerRegistry = {} as any;
    readonly orthoBasemapConfig = {} as any;
    configuredZoom = 6;
    protected get resolvedClusterMaxZoom() {
      return this.configuredZoom;
    }
    protected get resolvedEditable() {
      return true;
    }
    protected renderMap() {
      return null;
    }
  }
  const panel = new TestPanel({
    id: 1,
    options: { dataLayers: [], common: {}, view: {} },
    data: { series: [] },
    eventBus: { publish: jest.fn(), subscribe: () => ({ unsubscribe: jest.fn() }) },
    replaceVariables: (value: string) => value,
    onOptionsChange: jest.fn(),
    width: 800,
    height: 600,
  } as any);
  (panel as any).initializeLayers = jest.fn().mockResolvedValue(undefined);
  await panel.componentDidMount();
  const store = panel.controller.stores;
  expect(store.pointStore.getEditable).toBe(true);
  expect(store.viewStore.getClusterMaxZoom).toBe(6);
  store.viewStore.setClusterMaxZoom(1);
  panel.scene.update({ positions: new Float64Array(2) });
  expect(panel.controller.stores).toBe(store);
  expect(store.viewStore.getClusterMaxZoom).toBe(1);
  panel.configuredZoom = 8;
  panel.scene.update({ positions: new Float64Array(4) });
  expect(store.viewStore.getClusterMaxZoom).toBe(8);
  panel.componentWillUnmount();
});
