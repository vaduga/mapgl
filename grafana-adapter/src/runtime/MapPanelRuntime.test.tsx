jest.mock('../render/index', () => ({ updateThresholdColor: jest.fn() }));
import { MapPanelRuntime } from './MapPanelRuntime';
import { metricGraphInput, metricGraphSource } from '../../../panel-core/examples/neutral';
import { getNodeData } from '@vaduga/mapgl-core/graph/main';

class TestPanel extends MapPanelRuntime {
  readonly mapLayerRegistry = {} as any;
  readonly orthoBasemapConfig = {} as any;
  protected renderMap() {
    return null;
  }
}

function panelProps() {
  return {
    id: 1,
    options: { dataLayers: [], common: {}, view: {} },
    data: { series: [] },
    eventBus: { publish: jest.fn(), subscribe: () => ({ unsubscribe: jest.fn() }) },
    replaceVariables: (value: string) => value,
    onOptionsChange: jest.fn(),
    width: 800,
    height: 600,
  } as any;
}

it.each([true, false])(
  'hydrates node styles when metric updates retain topology and layout (logic: %s)',
  async (isLogic) => {
    const panel = new TestPanel(panelProps());
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

it('recreates disposed integration resources during setup/cleanup/setup before viewport attachment', async () => {
  const panel = new TestPanel(panelProps());
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
  class PendingPanel extends TestPanel {
    protected initializeIntegration() {
      return new Promise<void>((resolve) => {
        release = resolve;
      });
    }
  }
  const panel = new PendingPanel(panelProps());
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

it('prepares consumers after resolved metrics are attached', async () => {
  class ConsumerPanel extends TestPanel {
    protected prepareGraphCommit(state: any) {
      expect(state.graph.state.edgeIndex.getRecordMetrics(0).sideB).toBe(8);
      return super.prepareGraphCommit(state);
    }
  }
  const panel = new ConsumerPanel(panelProps());
  await panel.controller.update(metricGraphInput(metricGraphSource('prepared', [8, 21])));
  panel.componentWillUnmount();
});
