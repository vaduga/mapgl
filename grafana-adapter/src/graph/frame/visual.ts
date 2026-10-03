import {
  FieldColorModeId,
  ThresholdsMode,
  formattedValueToString,
  getDisplayProcessor,
  getFieldColorModeForField,
  getFieldConfigWithMinMax,
  getScaleCalculator,
  type DataFrame,
  type Field,
  type GrafanaTheme2,
  type ThresholdsConfig,
} from '@grafana/data';

import {
  type GraphStyleChannels,
  type GraphResolvedNodeGauge,
  type GraphVisualConfig,
  resolveGraphVisuals as composeGraphVisuals,
} from '@vaduga/mapgl-core/graph/frame';
import { toRGB4Array } from '@vaduga/mapgl-core/deckLayers/utils';
import { isMetricDrivenArc, resolveArcOptions } from '@vaduga/mapgl-core/style';
import { resolveStyleConfigState } from '../../style/utils';
import { getStyleDimension } from '../../utils/geomap_utils';
import { findField } from '../../grafana_core/app/features/dimensions/index';

import type { StyleConfig } from '../../style/types';
import type { GrafanaGraphVisualConfig, GrafanaGraphVisualInput } from './types';
import type { SourceView } from '@vaduga/mapgl-core/data';
const GAUGE_COLOR_SAMPLE_COUNT = 16;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const toSingleLineGaugeText = (value: string): string => value.replace(/\s*[\r\n]+\s*/g, ' ').trim();

function effectiveNumericField(field: Field): Field {
  const config = getFieldConfigWithMinMax(field, true);
  if (config === field.config) {
    return field;
  }
  return getFieldColorModeForField(field).isByValue ? { ...field, config, state: undefined } : { ...field, config };
}

const finiteConfigNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

function resolveGaugeStops(field: Field, theme: GrafanaTheme2): GraphResolvedNodeGauge['stops'] {
  const mode = getFieldColorModeForField(field);
  const scale = getScaleCalculator(field, theme);
  const min = finiteConfigNumber(field.config.min);
  const max = finiteConfigNumber(field.config.max);
  const delta = min !== undefined && max !== undefined ? max - min : Number.NaN;

  if (min === undefined || max === undefined || delta <= 0) {
    const color = toRGB4Array(scale(min ?? 0).color);
    return [
      { color, endFraction: 0 },
      { color, endFraction: 1 },
    ];
  }

  const colorAt = (fraction: number) => toRGB4Array(scale(min + delta * clamp01(fraction)).color);

  if (mode.id !== FieldColorModeId.Thresholds) {
    if (!mode.isByValue) {
      const color = colorAt(0);
      return [
        { color, endFraction: 0 },
        { color, endFraction: 1 },
      ];
    }
    return Array.from({ length: GAUGE_COLOR_SAMPLE_COUNT }, (_, index) => {
      const endFraction = index / (GAUGE_COLOR_SAMPLE_COUNT - 1);
      return { color: colorAt(endFraction), endFraction };
    });
  }

  const thresholds = field.config.thresholds;
  const fractions = (thresholds?.steps ?? [])
    .map((step, index) => {
      if (index === 0 || step.value === null || !Number.isFinite(Number(step.value))) {
        return 0;
      }
      return thresholds?.mode === ThresholdsMode.Percentage
        ? clamp01(Number(step.value) / 100)
        : clamp01((Number(step.value) - min) / delta);
    })
    .filter((fraction, index, values) => index === 0 || fraction !== values[index - 1]);
  const positions = Array.from(new Set([0, ...fractions, 1])).sort((left, right) => left - right);
  return positions.map((endFraction) => ({ color: colorAt(endFraction), endFraction }));
}

function compileStyle(
  style: StyleConfig,
  frame: DataFrame,
  theme: GrafanaTheme2,
  sourceIndex: number,
  revision: string
): GraphStyleChannels {
  const state = resolveStyleConfigState(style, theme);
  const dimensions = getStyleDimension(frame, state, theme);
  const arcs = style.arcs?.map((arc) => getStyleDimension(frame, state, theme, { color: arc }).color);
  const thresholds = style.color?.thresholds as ThresholdsConfig | undefined;
  const colorLegend = (thresholds ?? dimensions.color?.field?.config.thresholds)?.steps.map((step) => ({
    value: step.value,
    color: theme.visualization.getColorByName(step.color),
  }));
  const gaugeField = isMetricDrivenArc(style.arcs)
    ? (arcs?.[0]?.field ?? findField(frame, style.arcs![0].field))
    : undefined;
  const effectiveGauge = gaugeField && effectiveNumericField(gaugeField);
  const stops = effectiveGauge && resolveGaugeStops(effectiveGauge, theme);
  const display = gaugeField && (gaugeField.display ?? getDisplayProcessor({ field: gaugeField, theme }));
  return Object.freeze({
    scope: { revision, sourceIndex, sourceKey: frame.refId ?? frame.name ?? `source-${sourceIndex}` },
    base: Object.freeze({ ...state.base }),
    colorKey: style.color?.field,
    capacityKey: style.capacity?.field,
    isFixed: !style.color?.field && Boolean(style.color?.fixed),
    color: dimensions.color && { get: (rowIndex: number) => dimensions.color!.get(rowIndex) },
    size: dimensions.size && { get: (rowIndex: number) => dimensions.size!.get(rowIndex) },
    text: dimensions.text && { get: (rowIndex: number) => dimensions.text!.get(rowIndex) },
    symbol: {
      get: (rowIndex: number) => {
        const value = style.symbol?.field ? findField(frame, style.symbol.field)?.values[rowIndex] : undefined;
        return typeof value === 'string' && value.length ? value : style.symbol?.fixed;
      },
    },
    arcs: arcs?.map((arc) => ({ get: (rowIndex: number) => arc?.get(rowIndex) })),
    arcOptions: arcs?.length ? resolveArcOptions(style.arcOptions) : undefined,
    gauge: isMetricDrivenArc(style.arcs)
      ? {
          get: (rowIndex: number) => {
            if (!gaugeField || !effectiveGauge || !display || !stops) {
              const color = toRGB4Array(arcs?.[0]?.get(rowIndex) ?? '#808080');
              return {
                colorMode: 'missing-field',
                displayText: '',
                fillFraction: -1,
                stops: [
                  { color, endFraction: 0 },
                  { color, endFraction: 1 },
                ],
              };
            }
            const { min, max } = effectiveGauge.config;
            const value = gaugeField.values[rowIndex];
            return {
              colorMode: getFieldColorModeForField(effectiveGauge).id,
              displayText: toSingleLineGaugeText(formattedValueToString(display(value))),
              fillFraction:
                typeof value === 'number' &&
                Number.isFinite(value) &&
                typeof min === 'number' &&
                typeof max === 'number' &&
                max > min
                  ? clamp01((value - min) / (max - min))
                  : -1,
              stops,
            };
          },
        }
      : undefined,
    colorLegend,
  });
}

export function compileGraphVisualConfig(
  config: GrafanaGraphVisualConfig,
  frames: readonly DataFrame[],
  theme: GrafanaTheme2,
  revision: string
): GraphVisualConfig {
  const compile = (style: StyleConfig) => {
    const channels = frames.map((frame, index) => compileStyle(style, frame, theme, index, revision));
    return (sourceIndex: number) => channels[sourceIndex];
  };
  const edge = compile(config.edgeStyle);
  const resolveColor = (color: string) => theme.visualization.getColorByName(color);
  return Object.freeze({
    layerName: config.layerName,
    layerIndex: config.layerIndex,
    locationField: config.locationField,
    isLogic: config.isLogic,
    node: compile(config.style),
    edge,
    sideA: config.showStat2 ? compile({ ...config.arcStyle.sideA, capacity: config.arcConfig.capacity }) : edge,
    sideB: config.showStat2 ? compile({ ...config.arcStyle.sideB, capacity: config.arcConfig.capacity }) : edge,
    arcConfig: config.arcConfig,
    groupIndexOffset: config.groupIndexOffset,
    showStat2: config.showStat2,
    groups: config.groups?.map((rule) => ({
      ...rule,
      color: rule.color ? resolveColor(rule.color) : rule.color,
      overrides: Array.isArray(rule.overrides)
        ? rule.overrides.map((override) => ({
            ...override,
            value:
              override.name === 'thrColor' && Array.isArray(override.value)
                ? override.value.map((color) => (color === 'Fixed' ? color : resolveColor(color)))
                : override.value,
          }))
        : rule.overrides,
    })),
  });
}

export function visualSources(frames: readonly DataFrame[], revision = ''): readonly SourceView[] {
  return frames.map((frame, index) => {
    const columns = new Map(frame.fields.map((field) => [field.name, field.values]));
    return {
      revision,
      key: frame.refId ?? frame.name ?? `source-${index}`,
      index,
      rowCount: frame.length,
      value: (key: string, rowIndex: number) => columns.get(key)?.[rowIndex],
    };
  });
}

export function resolveGraphVisuals(input: GrafanaGraphVisualInput) {
  return composeGraphVisuals({
    sources: visualSources(input.data.series).map((source) => ({
      ...source,
      revision: input.snapshot.frames.find((frame) => frame.sourceIndex === source.index)?.revision ?? '',
    })),
    snapshot: input.snapshot,
    graph: input.graph,
    configs: (input.configs ?? [input.config]).map((config) =>
      compileGraphVisualConfig(config, input.data.series, input.theme, input.snapshot.frames[0]?.revision ?? '')
    ),
  });
}
