import type { DataFrame, GrafanaTheme2, ThresholdsConfig } from '@grafana/data';

import { cloneResolvedGroup, resolveFeatureGroup } from '../../editor/Groups/data/group-resolve';
import type { Rule } from '../../editor/Groups/ruleTypes';
import { findField } from '../../grafana_core/app/features/dimensions';
import { FeatSource, getNodeData, type Graph } from '../main';
import type { StyleConfig, StyleConfigState } from '../../style/types';
import { resolveStyleConfigState } from '../../style/utils';
import { colTypes, type BiColProps, type RGBAColor } from '../../types';
import { getStyleDimension } from '../../utils/geomap_utils';
import { toRGB4Array } from '../../deckLayers/utils/color';
import type {
  GraphBuiltState,
  GraphEdgeUnitVisualRecord,
  GraphEdgeVisualMetrics,
  GraphFrameSnapshot,
  GraphNodeRecord,
  GraphNodeVisualRecord,
  GraphResolvedArcStyle,
  GraphResolvedVisualGroup,
  GraphResolvedVisualStyle,
  GraphRowRef,
  GraphStageResult,
  GraphVisualConfig,
  GraphVisualInput,
  GraphVisualState,
} from './types';
import { PACKED_INVALID_REF } from './packedRelations';

interface PreparedStyle {
  readonly state: StyleConfigState;
  readonly dimensions: Map<number, ReturnType<typeof getStyleDimension>>;
}

interface PreparedVisuals {
  readonly node: PreparedStyle;
  readonly edge: PreparedStyle;
  readonly nodeArcs: Map<number, Array<ReturnType<typeof getStyleDimension>>>;
  readonly sideA: PreparedStyle;
  readonly sideB: PreparedStyle;
}

interface PreparedLayerVisuals {
  readonly input: GraphVisualInput;
  readonly prepared: PreparedVisuals;
  readonly featSource: FeatSource;
  readonly ruleFields: readonly string[];
}

function prepareStyle(style: StyleConfig, theme: GrafanaTheme2): PreparedStyle {
  return {
    state: resolveStyleConfigState(style, theme),
    dimensions: new Map(),
  };
}

function dimensionsFor(prepared: PreparedStyle, frame: DataFrame, frameIndex: number, theme: GrafanaTheme2) {
  let dimensions = prepared.dimensions.get(frameIndex);
  if (!dimensions) {
    dimensions = getStyleDimension(frame, prepared.state, theme);
    prepared.dimensions.set(frameIndex, dimensions);
  }
  return dimensions;
}

function rowFrame(input: GraphVisualInput, row: GraphRowRef): DataFrame | undefined {
  return input.data.series[row.frameIndex];
}

function rowValue(frame: DataFrame, rowIndex: number, fieldName?: string): unknown {
  return fieldName ? findField(frame, fieldName)?.values[rowIndex] : undefined;
}

function cloneRule(rule: Rule, groupIdx: number): Rule {
  const overrides = Array.isArray(rule.overrides)
    ? rule.overrides.map((override) => ({
        ...override,
        value: Array.isArray(override.value) ? [...override.value] : override.value,
      }))
    : rule.overrides
      ? {
          ...rule.overrides,
          overrideField: {
            ...rule.overrides.overrideField,
            value: Array.isArray(rule.overrides.overrideField.value)
              ? [...rule.overrides.overrideField.value]
              : rule.overrides.overrideField.value,
          },
        }
      : undefined;
  return {
    ...rule,
    groupIdx,
    overrides,
  };
}

function prepareGroups(config: GraphVisualConfig, allGroups: Rule[]): FeatSource {
  const offset = config.groupIndexOffset ?? allGroups.length;
  const layerGroups = (config.groups ?? []).map((rule, index) => cloneRule(rule, rule.groupIdx ?? offset + index));
  const featSource = new FeatSource(colTypes.Markers, config.layerName);
  featSource.setGroups(layerGroups);
  allGroups.push(...layerGroups);
  return featSource;
}

function configuredRuleFields(groups: readonly Rule[], locationField: string): readonly string[] {
  return Array.from(
    new Set([
      ...groups.flatMap((group) =>
        Array.isArray(group.overrides) ? group.overrides.map((override) => override.name) : []
      ),
      locationField,
    ])
  );
}

function rulePoint(frame: DataFrame, row: GraphRowRef, fields: readonly string[], thresholdColor?: string) {
  const point: Record<string, unknown> = {};
  for (const field of fields) {
    point[field] = rowValue(frame, row.rowIndex, field);
  }
  if (thresholdColor !== undefined) {
    point.thrColor = thresholdColor;
  }
  return point;
}

function resolveSymbol(style: StyleConfig, frame: DataFrame, row: GraphRowRef): string | undefined {
  const value = rowValue(frame, row.rowIndex, style.symbol?.field);
  return typeof value === 'string' && value.length ? value : style.symbol?.fixed;
}

function resolveGroup(args: {
  frame: DataFrame;
  row: GraphRowRef;
  fields: readonly string[];
  style: StyleConfigState;
  dimensions: ReturnType<typeof getStyleDimension>;
  featSource: FeatSource;
  allGroups: Rule[];
  theme: GrafanaTheme2;
  locationField: string;
  fallbackName: string;
}): {
  group: GraphResolvedVisualGroup;
  color: RGBAColor;
  thresholdColor?: string;
} {
  const { field: metricField, fixed } = args.style.config.color ?? {};
  const isFixed = !metricField && Boolean(fixed);
  const baseColor = args.style.base.color as string;
  const fixedColor = fixed ? (args.theme.visualization.getColorByName(fixed) ?? baseColor) : baseColor;
  const hexColor = args.dimensions.color?.get(args.row.rowIndex) ?? fixedColor;
  const thresholdColor = isFixed ? undefined : hexColor;
  const point = rulePoint(args.frame, args.row, args.fields, thresholdColor);
  const locName = String(rowValue(args.frame, args.row.rowIndex, args.locationField) ?? args.fallbackName);
  const color = toRGB4Array(hexColor);
  const { group } = resolveFeatureGroup({
    feature: point,
    featSource: args.featSource,
    allGroups: args.allGroups,
    theme: args.theme,
    isFixed,
    locField: args.locationField,
    locName,
    hexColor,
    rgba: color,
  });
  const cloned = cloneResolvedGroup(group);
  const symbol = resolveSymbol(args.style.config, args.frame, args.row);
  if (symbol && !cloned.iconName) {
    cloned.iconName = symbol;
  }
  return { group: cloned, color, thresholdColor };
}

function baseStyle(state: StyleConfigState): GraphResolvedVisualStyle {
  return {
    ...state.base,
    color: toRGB4Array(state.base.color as string),
  };
}

function resolvedNodeStyle(
  input: GraphVisualInput,
  prepared: PreparedVisuals,
  frame: DataFrame,
  row: GraphRowRef,
  dimensions: ReturnType<typeof dimensionsFor>,
  resolved: ReturnType<typeof resolveGroup>
): GraphResolvedVisualStyle {
  const values: GraphResolvedVisualStyle = {
    ...baseStyle(prepared.node.state),
    color: resolved.color,
    group: resolved.group,
    ...(dimensions.size && { size: dimensions.size.get(row.rowIndex) }),
    ...(dimensions.text && { text: dimensions.text.get(row.rowIndex) }),
  };
  let style: GraphResolvedVisualStyle = {
    ...values,
    ...(resolved.group.size !== undefined && { size: resolved.group.size }),
  };

  if (input.config.style.arcs?.length) {
    let arcDimensions = prepared.nodeArcs.get(row.frameIndex);
    if (!arcDimensions) {
      arcDimensions = input.config.style.arcs.map((arc) =>
        getStyleDimension(frame, prepared.node.state, input.theme, { color: arc })
      );
      prepared.nodeArcs.set(row.frameIndex, arcDimensions);
    }
    style = {
      ...style,
      arcs: arcDimensions.map((arc) => arc.color?.get(row.rowIndex)),
    };
  }

  return style;
}

function nodeVisual(
  input: GraphVisualInput,
  prepared: PreparedVisuals,
  record: GraphNodeRecord,
  index: number,
  featSource: FeatSource,
  allGroups: Rule[],
  ruleFields: readonly string[]
): GraphNodeVisualRecord | undefined {
  const frame = rowFrame(input, record.primaryRow);
  const node = input.graph.nodeByKey.get(record.key);
  if (!frame || !node) {
    return undefined;
  }
  const dimensions = dimensionsFor(prepared.node, frame, record.primaryRow.frameIndex, input.theme);
  const resolved = resolveGroup({
    frame,
    row: record.primaryRow,
    fields: ruleFields,
    style: prepared.node.state,
    dimensions,
    featSource,
    allGroups,
    theme: input.theme,
    locationField: input.config.locationField,
    fallbackName: record.id,
  });
  const style = resolvedNodeStyle(input, prepared, frame, record.primaryRow, dimensions, resolved);

  const nodeData = getNodeData(node);
  const id = nodeData?.wasmId ?? index;
  const feature: BiColProps = {
    id,
    layerName: input.config.layerName,
    ...(input.config.layerIndex !== undefined && { layerIdx: input.config.layerIndex }),
    frameRefId: record.primaryRow.frameRefId,
    rowIndex: record.primaryRow.rowIndex,
    featSource,
    graph: node.parent as Graph,
    locName: record.id,
    ...(resolved.thresholdColor !== undefined && { thrColor: resolved.thresholdColor }),
    style,
    edgeStyle: {},
    arcStyle: {},
  };
  return Object.freeze({
    key: record.key,
    index: id,
    row: record.primaryRow,
    style,
    feature,
  });
}

function sideStyle(args: {
  prepared: PreparedStyle;
  frame: DataFrame;
  row: GraphRowRef;
  theme: GrafanaTheme2;
  edge: GraphResolvedVisualStyle;
  edgeMetricField?: string;
  showStat2: boolean;
}): GraphResolvedVisualStyle & { colorField?: string } {
  if (!args.showStat2) {
    return args.edge;
  }
  const dimensions = dimensionsFor(args.prepared, args.frame, args.row.frameIndex, args.theme);
  const fixed = args.prepared.state.config.color?.fixed;
  const colorName =
    dimensions.color?.get(args.row.rowIndex) ?? (fixed && args.theme.visualization.getColorByName(fixed));
  const colorField = args.prepared.state.config.color?.field;
  return {
    ...baseStyle(args.prepared.state),
    ...(colorName && { color: toRGB4Array(colorName) }),
    ...(colorField && { colorField }),
    ...(dimensions.size && { size: dimensions.size.get(args.row.rowIndex) }),
    ...(dimensions.text && { text: dimensions.text.get(args.row.rowIndex) }),
    ...(colorField === args.edgeMetricField && { group: args.edge.group }),
  };
}

function edgeUnitVisual(
  input: GraphVisualInput,
  prepared: PreparedVisuals,
  index: number,
  unitRef: number,
  row: GraphRowRef,
  sourceKey: string,
  sourceId: string,
  featSource: FeatSource,
  allGroups: Rule[],
  ruleFields: readonly string[]
): GraphEdgeUnitVisualRecord | undefined {
  const frame = rowFrame(input, row);
  const sourceNode = input.graph.nodeByKey.get(sourceKey);
  if (!frame || !sourceNode) {
    return undefined;
  }
  const dimensions = dimensionsFor(prepared.edge, frame, row.frameIndex, input.theme);
  const groupDimensions = dimensionsFor(prepared.node, frame, row.frameIndex, input.theme);
  const resolvedGroup = resolveGroup({
    frame,
    row,
    fields: ruleFields,
    style: prepared.node.state,
    dimensions: groupDimensions,
    featSource,
    allGroups,
    theme: input.theme,
    locationField: input.config.locationField,
    fallbackName: sourceId,
  });
  const group = resolvedGroup.group;
  const sourceStyle = resolvedNodeStyle(input, prepared, frame, row, groupDimensions, resolvedGroup);
  const fixed = prepared.edge.state.config.color?.fixed;
  const colorName =
    dimensions.color?.get(row.rowIndex) ??
    (fixed && input.theme.visualization.getColorByName(fixed)) ??
    (prepared.edge.state.base.color as string);
  const edgeMetricField = prepared.edge.state.config.color?.field;
  const nodeMetricField = prepared.node.state.config.color?.field;
  const style: GraphResolvedVisualStyle = {
    ...baseStyle(prepared.edge.state),
    color: toRGB4Array(colorName),
    ...(edgeMetricField && edgeMetricField === nodeMetricField && { group }),
    ...(dimensions.size && { size: dimensions.size.get(row.rowIndex) }),
    ...(dimensions.text && { text: dimensions.text.get(row.rowIndex) }),
    ...(group.width !== undefined && { size: group.width }),
    ...(group.isDashed !== undefined && { isDashed: group.isDashed }),
  };
  const sideA = sideStyle({
    prepared: prepared.sideA,
    frame,
    row,
    theme: input.theme,
    edge: style,
    edgeMetricField,
    showStat2: Boolean(input.config.showStat2),
  });
  const sideB = sideStyle({
    prepared: prepared.sideB,
    frame,
    row,
    theme: input.theme,
    edge: style,
    edgeMetricField,
    showStat2: Boolean(input.config.showStat2),
  });
  const arcStyle: GraphResolvedArcStyle = {
    arcConfig: input.config.arcConfig,
    sideA,
    sideB,
  };
  const metrics: GraphEdgeVisualMetrics = {
    color: rowValue(frame, row.rowIndex, edgeMetricField),
    sideA: rowValue(frame, row.rowIndex, prepared.sideA.state.config.color?.field),
    sideB: rowValue(frame, row.rowIndex, prepared.sideB.state.config.color?.field),
    capacity: rowValue(
      frame,
      row.rowIndex,
      input.config.showStat2 ? input.config.arcConfig.capacity.field : prepared.edge.state.config.capacity?.field
    ),
  };
  const feature: BiColProps = {
    id: index,
    layerName: input.config.layerName,
    ...(input.config.layerIndex !== undefined && { layerIdx: input.config.layerIndex }),
    frameRefId: row.frameRefId,
    rowIndex: row.rowIndex,
    featSource,
    graph: sourceNode.parent as Graph,
    locName: sourceId,
    ...(resolvedGroup.thresholdColor !== undefined && { thrColor: resolvedGroup.thresholdColor }),
    style: sourceStyle,
    edgeStyle: style,
    arcStyle,
  };
  return Object.freeze({
    unitRef,
    row,
    group,
    style,
    arcStyle,
    metrics,
    feature,
  });
}

function nodeThresholds(
  input: GraphVisualInput,
  prepared: PreparedStyle,
  records: readonly GraphNodeRecord[]
): ThresholdsConfig | undefined {
  if (!prepared.state.config.color?.field && prepared.state.config.color?.fixed) {
    return undefined;
  }
  for (const record of records) {
    const frame = rowFrame(input, record.primaryRow);
    if (!frame) {
      continue;
    }
    const dimensions = dimensionsFor(prepared, frame, record.primaryRow.frameIndex, input.theme);
    const fieldThresholds = dimensions.color?.field?.config.thresholds;
    const configured = prepared.state.config.color?.thresholds;
    if (configured || fieldThresholds) {
      return (configured ?? fieldThresholds) as ThresholdsConfig;
    }
  }
  return undefined;
}

function prepareLayerVisuals(
  input: GraphVisualInput,
  config: GraphVisualConfig,
  allGroups: Rule[]
): PreparedLayerVisuals {
  const layerInput: GraphVisualInput = {
    ...input,
    config,
    configs: undefined,
  };
  const edge = prepareStyle(config.edgeStyle, input.theme);
  const prepared: PreparedVisuals = {
    node: prepareStyle(config.style, input.theme),
    edge,
    nodeArcs: new Map(),
    sideA: config.showStat2
      ? prepareStyle(
          {
            ...config.arcStyle.sideA,
            capacity: config.arcConfig.capacity,
          },
          input.theme
        )
      : edge,
    sideB: config.showStat2
      ? prepareStyle(
          {
            ...config.arcStyle.sideB,
            capacity: config.arcConfig.capacity,
          },
          input.theme
        )
      : edge,
  };
  const featSource = prepareGroups(config, allGroups);
  return {
    input: layerInput,
    prepared,
    featSource,
    ruleFields: configuredRuleFields(featSource.getGroups, config.locationField),
  };
}

export function resolveGraphVisuals(input: GraphVisualInput): GraphStageResult<GraphVisualState> {
  const configs = input.configs?.length ? input.configs : [input.config];
  const allGroups: Rule[] = [];
  const layers = configs.map((config) => prepareLayerVisuals(input, config, allGroups));
  const getLayer = (row: GraphRowRef) => layers[row.layerIndex ?? 0] ?? layers[0];
  const nodes = input.snapshot.nodes.flatMap((record, index) => {
    const layer = getLayer(record.primaryRow);
    const visual = nodeVisual(
      layer.input,
      layer.prepared,
      record,
      index,
      layer.featSource,
      allGroups,
      layer.ruleFields
    );
    return visual ? [visual] : [];
  });
  const edgeUnits: Array<GraphEdgeUnitVisualRecord | undefined> = Array.from({
    length: input.snapshot.relations.unitCount,
  });
  const edgePrimaryUnitRefs = new Uint32Array(input.snapshot.relations.recordCount).fill(PACKED_INVALID_REF);
  for (let index = 0; index < input.snapshot.relations.recordCount; index++) {
    const unitStart = input.snapshot.relations.getRecordUnitStart(index);
    const unitCount = input.snapshot.relations.getRecordUnitCount(index);
    const primaryRow = input.snapshot.relations.getRecordPrimaryRow(index);
    for (let unitOffset = 0; unitOffset < unitCount; unitOffset++) {
      const unitRef = unitStart + unitOffset;
      const row = input.snapshot.relations.getUnitRow(unitRef);
      const source = input.snapshot.nodes[input.snapshot.relations.getUnitSourceNodeRef(unitRef)];
      const layer = getLayer(row);
      const visual = edgeUnitVisual(
        layer.input,
        layer.prepared,
        index,
        unitRef,
        row,
        source?.key ?? '',
        source?.id ?? '',
        layer.featSource,
        allGroups,
        layer.ruleFields
      );
      edgeUnits[unitRef] = visual;
      if (
        visual &&
        row.frameIndex === primaryRow.frameIndex &&
        row.rowIndex === primaryRow.rowIndex &&
        row.layerIndex === primaryRow.layerIndex
      ) {
        edgePrimaryUnitRefs[index] = unitRef;
      }
    }
  }

  const colors = new Uint8Array(input.snapshot.nodes.length * 4);
  const muted = new Uint8Array(input.snapshot.nodes.length * 4);
  const annotations = new Uint8Array(input.snapshot.nodes.length * 4);
  const groupIndices = new Uint8Array(input.snapshot.nodes.length);
  for (const node of nodes) {
    const group = node.style.group;
    if (!group) {
      continue;
    }
    const color = [...group.color] as RGBAColor;
    const mutedColor = [...color] as RGBAColor;
    const alpha = mutedColor[3] ?? 255;
    mutedColor[3] = node.style.opacity !== undefined ? Math.round(alpha * node.style.opacity) : alpha;
    colors.set(color, node.index * 4);
    muted.set(mutedColor, node.index * 4);
    annotations.set(mutedColor, node.index * 4);
    if (typeof group.groupIdx === 'number') {
      groupIndices[node.index] = group.groupIdx;
    }
  }

  layers.forEach((layer, layerIndex) => {
    const layerNodes = nodes.filter((node) => (node.row.layerIndex ?? 0) === layerIndex);
    const layerRecords = input.snapshot.nodes.filter((node) => (node.primaryRow.layerIndex ?? 0) === layerIndex);
    const thresholds = nodeThresholds(layer.input, layer.prepared.node, layerRecords);
    layer.featSource.setThresholds(thresholds);
    layer.featSource.setFeatures(
      layerNodes.map((node) => node.feature),
      layerNodes[0]?.row.frameRefId
    );
    layer.featSource.setPositionRanges(layerNodes.map((node) => [node.index, node.index + 1]));
  });
  const featureSources = Object.freeze(layers.map((layer) => layer.featSource));

  const state: GraphVisualState = Object.freeze({
    featureSources,
    nodes: Object.freeze(nodes),
    edgeUnits: Object.freeze(edgeUnits),
    edgePrimaryUnitRefs,
    features: Object.freeze(nodes.map((node) => node.feature)),
    colors,
    muted,
    annotations,
    groupIndices,
    groups: Object.freeze(allGroups),
  });
  return Object.freeze({
    ok: true,
    value: state,
    diagnostics: input.snapshot.diagnostics,
    empty: input.snapshot.nodes.length === 0,
  });
}
