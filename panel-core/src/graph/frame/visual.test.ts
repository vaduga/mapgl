import { createTheme, FieldColorModeId, FieldType, MappingType, ThresholdsMode, toDataFrame } from '@grafana/data';
import { ResourceDimensionMode, TextDimensionMode } from '@grafana/schema';

import type { Rule } from '../../editor/Groups/ruleTypes';
import { getNodeData } from '../main';
import { toRGB4Array } from '../../deckLayers/utils/color';
import { buildGraphFromSnapshot } from './buildGraph';
import { normalizeGraphFrames } from './normalize';
import type {
  GraphBuiltState,
  GraphFrameSnapshot,
  GraphStageResult,
  GraphVisualConfig,
  GraphVisualState,
} from './types';
import { resolveGraphVisuals } from './visual';

const theme = createTheme();

function value<T>(result: GraphStageResult<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('Expected a successful graph-frame stage');
  }
  return result.value;
}

async function normalizeAndBuild(frame): Promise<{ snapshot: GraphFrameSnapshot; graph: GraphBuiltState }> {
  const snapshot = value(
    await normalizeGraphFrames({
      data: { series: [frame] },
      options: {
        layerName: 'visual test',
        nodeIdField: 'source',
        targetField: 'target',
        edgeIdField: 'edgeId',
        isLogic: true,
      },
    })
  );
  return {
    snapshot,
    graph: value(buildGraphFromSnapshot(snapshot)),
  };
}

function visualConfig(overrides: Partial<GraphVisualConfig> = {}): GraphVisualConfig {
  return {
    layerName: 'visual test',
    locationField: 'source',
    isLogic: true,
    style: {
      color: { fixed: 'green' },
      size: { fixed: 20, min: 5, max: 30 },
      opacity: 0.5,
    },
    edgeStyle: {
      color: { fixed: 'blue' },
      size: { fixed: 2, min: 1, max: 10 },
    },
    arcStyle: {
      sideA: {
        color: { fixed: 'blue' },
        size: { fixed: 2, min: 1, max: 10 },
      },
      sideB: {
        color: { fixed: 'blue' },
        size: { fixed: 2, min: 1, max: 10 },
      },
    },
    arcConfig: {
      height: 0.5,
      tiltIncrement: 7,
      capacity: { fixed: 1 },
    },
    ...overrides,
  };
}

async function visuals(frame, config: GraphVisualConfig): Promise<{ state: GraphVisualState; graph: GraphBuiltState }> {
  const built = await normalizeAndBuild(frame);
  const state = value(
    resolveGraphVisuals({
      data: { series: [frame] },
      snapshot: built.snapshot,
      graph: built.graph,
      config,
      theme,
    })
  );
  return { state, graph: built.graph };
}

describe('graph visual stage', () => {
  it('resolves fixed node and edge channels into stage-owned records and buffers', async () => {
    const frame = toDataFrame({
      refId: 'Fixed',
      fields: [
        { name: 'source', values: ['A', 'B'] },
        { name: 'target', values: ['B', null] },
      ],
    });
    const config = visualConfig({
      style: {
        color: { fixed: 'red' },
        size: { fixed: 24, min: 5, max: 30 },
        symbol: { fixed: 'router', mode: ResourceDimensionMode.Fixed },
        opacity: 0.5,
      },
      edgeStyle: {
        color: { fixed: 'blue' },
        size: { fixed: 3, min: 1, max: 10 },
        text: { fixed: 'link', mode: TextDimensionMode.Fixed },
        arrow: 1,
      },
    });
    const { state, graph } = await visuals(frame, config);

    expect(state.nodes).toHaveLength(2);
    expect(state.edgeUnits).toHaveLength(1);
    expect(state.nodes[0].style).toMatchObject({
      size: 24,
      opacity: 0.5,
      group: { iconName: 'router' },
    });
    expect(state.nodes[0].style.color).toEqual(toRGB4Array(theme.visualization.getColorByName('red')));
    expect(state.edgeUnits[0]!.style).toMatchObject({ size: 3, text: 'link', arrow: 1 });
    expect(state.edgeUnits[0]!.feature.style.group).toBe(state.edgeUnits[0]!.group);
    expect(state.edgeUnits[0]!.arcStyle.sideA).toMatchObject({ size: 3, text: 'link', arrow: 1 });
    expect(Array.from(state.colors.slice(0, 4))).toEqual(state.nodes[0].style.group?.color);
    expect(state.muted[3]).toBe(128);
    expect(state.annotations).toEqual(state.muted);
    expect(state.features).toEqual(state.nodes.map(({ feature }) => feature));

    expect(getNodeData(graph.nodeByKey.get(state.nodes[0].key)!)?.feature).toBeUndefined();
  });

  it('uses node and logical-edge primary rows and preserves group priority and overrides', async () => {
    const frame = toDataFrame({
      refId: 'PrimaryRows',
      fields: [
        { name: 'source', values: ['A', 'A', 'B'] },
        { name: 'target', values: [null, 'B', null] },
        { name: 'nodeMetric', values: [0, 100, 50] },
        { name: 'edgeMetric', values: [0, 100, 50] },
        { name: 'nodeLabel', values: ['first node row', 'repeat node row', 'node B'] },
        { name: 'edgeLabel', values: ['not an edge', 'edge primary row', 'not an edge'] },
        { name: 'role', values: ['db', 'db', 'app'] },
      ],
    });
    const groups: Rule[] = [
      {
        label: 'generic database',
        color: 'blue',
        size: 40,
        overrides: [{ name: 'role', type: FieldType.enum, value: ['db'] }],
      },
      {
        label: 'node A',
        color: 'orange',
        iconName: 'server',
        size: 33,
        width: 7,
        isDashed: true,
        overrides: [{ name: 'source', type: FieldType.string, value: 'A' }],
      },
    ];
    const config = visualConfig({
      groups,
      style: {
        color: { fixed: 'green' },
        size: { field: 'nodeMetric', fixed: 10, min: 10, max: 20 },
        text: { field: 'nodeLabel', fixed: '', mode: TextDimensionMode.Field },
      },
      edgeStyle: {
        color: { fixed: 'purple' },
        size: { field: 'edgeMetric', fixed: 5, min: 9, max: 1 },
        text: { field: 'edgeLabel', fixed: '', mode: TextDimensionMode.Field },
      },
    });
    const { state } = await visuals(frame, config);
    const nodeA = state.nodes.find(({ feature }) => feature.locName === 'A')!;
    const nodeB = state.nodes.find(({ feature }) => feature.locName === 'B')!;
    const edge = state.edgeUnits[0]!;

    expect(nodeA.row.rowIndex).toBe(0);
    expect(nodeA.style).toMatchObject({
      size: 33,
      text: 'first node row',
      group: { label: 'node A', iconName: 'server' },
    });
    expect(nodeB.style.size).toBe(15);
    expect(edge.row.rowIndex).toBe(1);
    expect(edge.style).toMatchObject({
      size: 7,
      text: 'edge primary row',
      isDashed: true,
    });
    expect(edge.group).toMatchObject({ label: 'node A' });
    expect(groups.every((group) => group.groupIdx === undefined)).toBe(true);
  });

  it('resolves repeated explicit edge units from their own span rows', async () => {
    const frame = toDataFrame({
      refId: 'TraceSpans',
      fields: [
        { name: 'source', values: ['A', 'B', 'C'] },
        { name: 'target', values: ['B', 'C', null] },
        { name: 'edgeId', values: ['trace-1', 'trace-1', null] },
        { name: 'spanLabel', values: ['first span', 'second span', 'node C'] },
        { name: 'spanWidth', values: [1, 9, 1] },
      ],
    });
    const config = visualConfig({
      edgeStyle: {
        color: { fixed: 'blue' },
        size: { field: 'spanWidth', fixed: 2, min: 1, max: 9 },
        text: { field: 'spanLabel', fixed: '', mode: TextDimensionMode.Field },
      },
    });
    const { state } = await visuals(frame, config);

    const edgeUnits = state.edgeUnits.filter((unit) => unit !== undefined);
    expect(edgeUnits).toHaveLength(2);
    expect(state.edgePrimaryUnitRefs).toEqual(new Uint32Array([0]));
    expect(edgeUnits.map(({ row }) => row.rowIndex)).toEqual([0, 1]);
    expect(edgeUnits.map(({ feature }) => feature.locName)).toEqual(['A', 'B']);
    expect(edgeUnits.map(({ style }) => style.text)).toEqual(['first span', 'second span']);
    expect(edgeUnits.map(({ style }) => style.size)).toEqual([1, 9]);
    expect('unitVisuals' in state).toBe(false);
  });

  it('preserves value mappings, threshold colors, display text, and descending scales', async () => {
    const frame = toDataFrame({
      refId: 'GrafanaFields',
      fields: [
        { name: 'source', values: ['A', 'B'] },
        { name: 'target', values: ['B', null] },
        {
          name: 'status',
          values: ['ok', 'warn'],
          config: {
            mappings: [
              {
                type: MappingType.ValueToText,
                options: {
                  ok: { text: 'Healthy', color: '#00ff00' },
                  warn: { text: 'Warning', color: '#ff0000' },
                },
              },
            ],
          },
        },
        {
          name: 'edgeMetric',
          values: [75, 0],
          config: {
            color: { mode: FieldColorModeId.Thresholds },
            thresholds: {
              mode: ThresholdsMode.Absolute,
              steps: [
                { color: 'green', value: null },
                { color: 'red', value: 50 },
              ],
            },
          },
        },
        {
          name: 'displayMetric',
          values: [1, 0],
          config: {
            mappings: [
              {
                type: MappingType.ValueToText,
                options: {
                  '0': { text: 'Down' },
                  '1': { text: 'Up' },
                },
              },
            ],
          },
        },
      ],
    });
    const config = visualConfig({
      style: {
        color: { field: 'status', fixed: 'gray' },
        size: { field: 'edgeMetric', fixed: 10, min: 20, max: 5 },
        text: { field: 'displayMetric', fixed: '', mode: TextDimensionMode.Field },
      },
      edgeStyle: {
        color: { field: 'edgeMetric', fixed: 'gray' },
        size: { field: 'edgeMetric', fixed: 5, min: 10, max: 2 },
      },
    });
    const { state } = await visuals(frame, config);

    expect(state.nodes[0].style.color).toEqual(toRGB4Array('#00ff00'));
    expect(state.nodes[1].style.color).toEqual(toRGB4Array('#ff0000'));
    expect(state.nodes.map(({ style }) => style.text)).toEqual(['Up', 'Down']);
    expect(state.nodes.map(({ style }) => style.size)).toEqual([5, 20]);
    expect(state.edgeUnits[0]!.style.color).toEqual(toRGB4Array(theme.visualization.getColorByName('red')));
    expect(state.edgeUnits[0]!.style.size).toBe(2);
  });

  it('resolves node arc sections in geo mode', async () => {
    const frame = toDataFrame({
      refId: 'GeoArcs',
      fields: [
        { name: 'source', values: ['A', 'B'] },
        { name: 'target', values: ['B', null] },
      ],
    });
    const config = visualConfig({
      isLogic: false,
      style: {
        color: { fixed: 'red' },
        size: { fixed: 24, min: 5, max: 30 },
        opacity: 0.5,
        arcs: [{ fixed: 'blue' }, { fixed: 'green' }],
      },
    });

    const { state } = await visuals(frame, config);

    expect(state.nodes[0].style.arcs).toHaveLength(2);
    expect(state.nodes[0].style.arcs?.every(Boolean)).toBe(true);
    expect(state.nodes[0].style.gauge).toBeUndefined();
  });

  it('resolves a single metric arc as a threshold gradient gauge', async () => {
    const frame = toDataFrame({
      refId: 'ThresholdGauge',
      fields: [
        { name: 'source', values: ['A', 'B', 'C'] },
        {
          name: 'load',
          values: [-10, 50, 110],
          config: {
            min: 0,
            max: 100,
            color: { mode: FieldColorModeId.Thresholds },
            thresholds: {
              mode: ThresholdsMode.Absolute,
              steps: [
                { color: 'green', value: null },
                { color: 'red', value: 50 },
              ],
            },
          },
        },
      ],
    });
    const { state } = await visuals(
      frame,
      visualConfig({
        style: {
          ...visualConfig().style,
          arcs: [{ field: 'load', fixed: '' }],
          arcOptions: {
            barWidthFactor: 0.7,
            segments: 24,
            segmentSpacing: 0.2,
            showThresholds: false,
            gradient: false,
          },
        },
      })
    );

    expect(state.nodes.map(({ style }) => style.gauge?.fillFraction)).toEqual([0, 0.5, 1]);
    expect(state.nodes[0].style.arcOptions).toEqual({
      barWidthFactor: 0.7,
      segments: 24,
      segmentSpacing: 0.2,
      showThresholds: false,
      gradient: false,
    });
    expect(state.nodes[1].style.gauge).toMatchObject({
      colorMode: FieldColorModeId.Thresholds,
      stops: [
        { endFraction: 0, color: toRGB4Array(theme.visualization.getColorByName('green')) },
        { endFraction: 0.5, color: toRGB4Array(theme.visualization.getColorByName('red')) },
        { endFraction: 1, color: toRGB4Array(theme.visualization.getColorByName('red')) },
      ],
    });
  });

  it('formats gauge center values with the native Grafana display processor', async () => {
    const frame = toDataFrame({
      refId: 'FormattedGauge',
      fields: [
        { name: 'source', values: ['A', 'B'] },
        {
          name: 'load',
          values: [0.425, null],
          config: { min: 0, max: 1, unit: 'percentunit', decimals: 1, noValue: 'No data' },
        },
      ],
    });
    const { state } = await visuals(
      frame,
      visualConfig({ style: { ...visualConfig().style, arcs: [{ field: 'load', fixed: '' }] } })
    );

    expect(state.nodes.map(({ style }) => style.gauge?.displayText)).toEqual(['42.5%', 'No data']);
  });

  it('reuses an existing field display processor and normalizes its output to one line', async () => {
    const display = jest.fn(() => ({ text: '42\nms', prefix: '~', suffix: ' total' }));
    const frame = toDataFrame({
      refId: 'ExistingGaugeDisplay',
      fields: [
        { name: 'source', values: ['A'] },
        { name: 'load', values: [42], config: { min: 0, max: 100 }, display },
      ],
    });
    const { state } = await visuals(
      frame,
      visualConfig({ style: { ...visualConfig().style, arcs: [{ field: 'load', fixed: '' }] } })
    );

    expect(display).toHaveBeenCalledWith(42);
    expect(state.nodes[0].style.gauge?.displayText).toBe('~42 ms total');
  });

  it('resolves continuous and solid Grafana field color schemes', async () => {
    const continuous = toDataFrame({
      refId: 'ContinuousGauge',
      fields: [
        { name: 'source', values: ['A'] },
        {
          name: 'load',
          values: [25],
          config: { min: 0, max: 100, color: { mode: FieldColorModeId.ContinuousGrYlRd } },
        },
      ],
    });
    const solid = toDataFrame({
      refId: 'SolidGauge',
      fields: [
        { name: 'source', values: ['A'] },
        {
          name: 'load',
          values: [75],
          config: { min: 0, max: 100, color: { mode: FieldColorModeId.Fixed, fixedColor: 'blue' } },
        },
      ],
    });
    const config = visualConfig({ style: { ...visualConfig().style, arcs: [{ field: 'load', fixed: '' }] } });
    const continuousState = (await visuals(continuous, config)).state;
    const solidState = (await visuals(solid, config)).state;

    expect(continuousState.nodes[0].style.gauge).toMatchObject({
      colorMode: FieldColorModeId.ContinuousGrYlRd,
      fillFraction: 0.25,
    });
    expect(continuousState.nodes[0].style.gauge?.stops).toHaveLength(16);
    expect(solidState.nodes[0].style.gauge).toMatchObject({ colorMode: FieldColorModeId.Fixed, fillFraction: 0.75 });
    expect(solidState.nodes[0].style.gauge?.stops[0].color).toEqual(solidState.nodes[0].style.gauge?.stops[1].color);
  });

  it('leaves invalid gauge values empty and preserves fixed arc fallback', async () => {
    const frame = toDataFrame({
      refId: 'InvalidGauge',
      fields: [
        { name: 'source', values: ['A', 'B'] },
        { name: 'load', values: [null, 5], config: { min: 0, max: 10 } },
      ],
    });
    const metricState = (
      await visuals(frame, visualConfig({ style: { ...visualConfig().style, arcs: [{ field: 'load', fixed: '' }] } }))
    ).state;
    const fixedState = (
      await visuals(frame, visualConfig({ style: { ...visualConfig().style, arcs: [{ fixed: 'blue' }] } }))
    ).state;

    expect(metricState.nodes.map(({ style }) => style.gauge?.fillFraction)).toEqual([-1, 0.5]);
    expect(fixedState.nodes[0].style.gauge).toBeUndefined();
  });

  it('normalizes percentage thresholds and leaves invalid ranges or missing fields as tracks', async () => {
    const frame = toDataFrame({
      refId: 'GaugeEdgeCases',
      fields: [
        { name: 'source', values: ['A'] },
        {
          name: 'percentageLoad',
          values: [100],
          config: {
            min: 0,
            max: 200,
            color: { mode: FieldColorModeId.Thresholds },
            thresholds: {
              mode: ThresholdsMode.Percentage,
              steps: [
                { color: 'green', value: null },
                { color: 'red', value: 50 },
              ],
            },
          },
        },
        { name: 'flatLoad', values: [5], config: { min: 5, max: 5 } },
      ],
    });
    const percentageState = (
      await visuals(
        frame,
        visualConfig({ style: { ...visualConfig().style, arcs: [{ field: 'percentageLoad', fixed: '' }] } })
      )
    ).state;
    const flatState = (
      await visuals(
        frame,
        visualConfig({ style: { ...visualConfig().style, arcs: [{ field: 'flatLoad', fixed: '' }] } })
      )
    ).state;
    const missingState = (
      await visuals(
        frame,
        visualConfig({ style: { ...visualConfig().style, arcs: [{ field: 'missingLoad', fixed: '' }] } })
      )
    ).state;

    expect(percentageState.nodes[0].style.gauge?.stops.map(({ endFraction }) => endFraction)).toEqual([0, 0.5, 1]);
    expect(flatState.nodes[0].style.gauge).toMatchObject({ fillFraction: -1 });
    expect(flatState.nodes[0].style.gauge?.stops).toHaveLength(2);
    expect(missingState.nodes[0].style.gauge).toMatchObject({
      colorMode: 'missing-field',
      displayText: '',
      fillFraction: -1,
    });
  });

  it('resolves capacity-relative arc channels, arrows, and edge metrics', async () => {
    const frame = toDataFrame({
      refId: 'Arcs',
      fields: [
        { name: 'source', values: ['A', 'B'] },
        { name: 'target', values: ['B', null] },
        { name: 'sideA', values: [50, 0] },
        { name: 'sideB', values: [25, 0] },
        { name: 'capacity', values: [100, 100] },
      ],
    });
    const config = visualConfig({
      showStat2: true,
      arcConfig: {
        height: 0.75,
        tiltIncrement: 9,
        capacity: { field: 'capacity', fixed: 100 },
      },
      arcStyle: {
        sideA: {
          color: { field: 'sideA', fixed: 'green' },
          size: { field: 'sideA', fixed: 4, min: 2, max: 10 },
          arrow: 1,
        },
        sideB: {
          color: { field: 'sideB', fixed: 'blue' },
          size: { field: 'sideB', fixed: 4, min: 2, max: 10 },
          arrow: -1,
        },
      },
    });
    const { state } = await visuals(frame, config);
    const edge = state.edgeUnits[0]!;

    expect(edge.arcStyle.arcConfig).toEqual(config.arcConfig);
    expect(edge.arcStyle.sideA).toMatchObject({ size: 6, arrow: 1, colorField: 'sideA' });
    expect(edge.arcStyle.sideB).toMatchObject({ size: 4, arrow: -1, colorField: 'sideB' });
    expect(edge.metrics).toMatchObject({ sideA: 50, sideB: 25, capacity: 100 });
  });
});
