import { sameMetricRow } from '../../data/metricOverlays';
import type { SourceView } from '../../data/sources';
import { cloneResolvedGroup, resolveFeatureGroup } from '../../style/groups/group-resolve';
import type { Rule } from '../../style/groups/ruleTypes';
import { FeatSource, getNodeData, type Graph } from '../main';
import { colTypes, type BiColProps, type RGBAColor } from '../../types';
import { toRGB4Array } from '../../deckLayers/utils/color';
import type {
  GraphStyleChannels,
  GraphEdgeUnitVisualRecord,
  GraphEdgeVisualMetrics,
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

type LayerVisualInput = Omit<GraphVisualInput, 'configs'> & { readonly config: GraphVisualConfig };

interface PreparedLayerVisuals {
  readonly input: LayerVisualInput;

  readonly featSource: FeatSource;
  readonly ruleFields: readonly string[];
}

function rowFrame(input: LayerVisualInput, row: GraphRowRef): SourceView | undefined {
  return input.sources.find(
    (source) => source.index === row.sourceIndex && source.key === row.sourceKey && source.revision === row.revision
  );
}
function rowValue(source: SourceView, rowIndex: number, fieldName?: string): unknown {
  return fieldName ? source.value(fieldName, rowIndex) : undefined;
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

function rulePoint(frame: SourceView, row: GraphRowRef, fields: readonly string[], thresholdColor?: string) {
  const point: Record<string, unknown> = {};
  for (const field of fields) {
    point[field] = rowValue(frame, row.rowIndex, field);
  }
  if (thresholdColor !== undefined) {
    point.thrColor = thresholdColor;
  }
  return point;
}

function resolveGroup(args: {
  frame: SourceView;
  row: GraphRowRef;
  fields: readonly string[];
  style: GraphStyleChannels;
  featSource: FeatSource;
  allGroups: Rule[];
  locationField: string;
  fallbackName: string;
}): {
  group: GraphResolvedVisualGroup;
  color: RGBAColor;
  thresholdColor?: string;
} {
  const scope = args.style.scope;
  if (
    scope.revision !== args.row.revision ||
    scope.sourceIndex !== args.row.sourceIndex ||
    scope.sourceKey !== args.row.sourceKey
  ) {
    throw new Error('Visual channel source revision does not match its row');
  }
  const isFixed = args.style.isFixed;
  const baseColor = args.style.base.color as string;
  const hexColor = args.style.color?.get(args.row.rowIndex) ?? baseColor;
  const thresholdColor = isFixed ? undefined : hexColor;
  const point = rulePoint(args.frame, args.row, args.fields, thresholdColor);
  const locName = String(rowValue(args.frame, args.row.rowIndex, args.locationField) ?? args.fallbackName);
  const color = toRGB4Array(hexColor);
  const { group } = resolveFeatureGroup({
    feature: point,
    featSource: args.featSource,
    allGroups: args.allGroups,
    isFixed,
    locField: args.locationField,
    locName,
    hexColor,
    rgba: color,
  });
  const cloned = cloneResolvedGroup(group);
  const symbol = args.style.symbol?.get(args.row.rowIndex);
  if (symbol && !cloned.iconName) {
    cloned.iconName = symbol;
  }
  return { group: cloned, color, thresholdColor };
}

function baseStyle(state: GraphStyleChannels): GraphResolvedVisualStyle {
  return {
    ...state.base,
    color: toRGB4Array(state.base.color as string),
  };
}

function resolvedNodeStyle(
  channels: GraphStyleChannels,
  row: GraphRowRef,
  resolved: ReturnType<typeof resolveGroup>
): GraphResolvedVisualStyle {
  return {
    ...baseStyle(channels),
    color: resolved.color,
    group: resolved.group,
    ...(channels.size && { size: channels.size.get(row.rowIndex) }),
    ...(channels.text && { text: channels.text.get(row.rowIndex) }),
    ...(resolved.group.size !== undefined && { size: resolved.group.size }),
    ...(channels.arcOptions && { arcOptions: channels.arcOptions }),
    ...(channels.arcs && { arcs: channels.arcs.map((arc) => arc.get(row.rowIndex)) }),
    ...(channels.gauge && { gauge: channels.gauge.get(row.rowIndex) }),
  };
}

function nodeVisual(
  input: LayerVisualInput,
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
  const channels = input.config.node(record.primaryRow.sourceIndex);
  const resolved = resolveGroup({
    frame,
    row: record.primaryRow,
    fields: ruleFields,
    style: channels,
    featSource,
    allGroups,
    locationField: input.config.locationField,
    fallbackName: record.id,
  });
  const style = resolvedNodeStyle(channels, record.primaryRow, resolved);

  const nodeData = getNodeData(node);
  const id = nodeData?.wasmId ?? index;
  const feature: BiColProps = {
    id,
    layerName: input.config.layerName,
    ...(input.config.layerIndex !== undefined && { layerIdx: input.config.layerIndex }),
    frameRefId: record.primaryRow.sourceKey,
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

function sideStyle(
  channels: GraphStyleChannels,
  row: GraphRowRef,
  edge: GraphResolvedVisualStyle,
  edgeMetricField: string | undefined,
  showStat2: boolean
): GraphResolvedVisualStyle & { colorField?: string } {
  if (!showStat2) {
    return edge;
  }
  return {
    ...baseStyle(channels),
    ...(channels.color && { color: toRGB4Array(channels.color.get(row.rowIndex)) }),
    ...(channels.colorKey && { colorField: channels.colorKey }),
    ...(channels.size && { size: channels.size.get(row.rowIndex) }),
    ...(channels.text && { text: channels.text.get(row.rowIndex) }),
    ...(channels.colorKey === edgeMetricField && { group: edge.group }),
  };
}

function edgeUnitVisual(
  input: LayerVisualInput,
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
  const dimensions = input.config.edge(row.sourceIndex);
  const nodeChannels = input.config.node(row.sourceIndex);
  const sideAChannels = input.config.sideA(row.sourceIndex);
  const sideBChannels = input.config.sideB(row.sourceIndex);
  const resolvedGroup = resolveGroup({
    frame,
    row,
    fields: ruleFields,
    style: nodeChannels,
    featSource,
    allGroups,
    locationField: input.config.locationField,
    fallbackName: sourceId,
  });
  const group = resolvedGroup.group;
  const sourceStyle = resolvedNodeStyle(nodeChannels, row, resolvedGroup);
  const colorName = dimensions.color?.get(row.rowIndex) ?? (dimensions.base.color as string);
  const edgeMetricField = dimensions.colorKey;
  const nodeMetricField = nodeChannels.colorKey;
  const style: GraphResolvedVisualStyle = {
    ...baseStyle(dimensions),
    color: toRGB4Array(colorName),
    ...(edgeMetricField && edgeMetricField === nodeMetricField && { group }),
    ...(dimensions.size && { size: dimensions.size.get(row.rowIndex) }),
    ...(dimensions.text && { text: dimensions.text.get(row.rowIndex) }),
    ...(group.width !== undefined && { size: group.width }),
    ...(group.isDashed !== undefined && { isDashed: group.isDashed }),
  };
  const sideA = sideStyle(sideAChannels, row, style, edgeMetricField, Boolean(input.config.showStat2));
  const sideB = sideStyle(sideBChannels, row, style, edgeMetricField, Boolean(input.config.showStat2));
  const arcStyle: GraphResolvedArcStyle = {
    arcConfig: input.config.arcConfig,
    sideA,
    sideB,
  };
  const metrics: GraphEdgeVisualMetrics = {
    color: rowValue(frame, row.rowIndex, edgeMetricField),
    sideA: rowValue(frame, row.rowIndex, sideAChannels.colorKey),
    sideB: rowValue(frame, row.rowIndex, sideBChannels.colorKey),
    capacity: rowValue(
      frame,
      row.rowIndex,
      input.config.showStat2 ? input.config.arcConfig.capacity.field : dimensions.capacityKey
    ),
  };
  const feature: BiColProps = {
    id: index,
    layerName: input.config.layerName,
    ...(input.config.layerIndex !== undefined && { layerIdx: input.config.layerIndex }),
    frameRefId: row.sourceKey,
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

function prepareLayerVisuals(
  input: GraphVisualInput,
  config: GraphVisualConfig,
  allGroups: Rule[]
): PreparedLayerVisuals {
  const featSource = prepareGroups(config, allGroups);
  return {
    input: { ...input, config },
    featSource,
    ruleFields: configuredRuleFields(featSource.getGroups, config.locationField),
  };
}

export function resolveGraphVisuals(input: GraphVisualInput): GraphStageResult<GraphVisualState> {
  const configs = input.configs;
  const patch = input.metricPatch;
  const allGroups: Rule[] = patch
    ? patch.previous.groups.map((group, index) => cloneRule(group, group.groupIdx ?? index))
    : [];
  const layers = configs.map((config, index) => {
    if (!patch) {
      return prepareLayerVisuals(input, config, allGroups);
    }
    const featSource = new FeatSource(colTypes.Markers, config.layerName);
    featSource.setGroups(
      patch.previous.featureSources[index].getGroups.map((group) =>
        allGroups.find((candidate) => candidate.groupIdx === group.groupIdx)!
      )
    );
    featSource.useMockData = patch.previous.featureSources[index].useMockData;
    return {
      input: { ...input, config },
      featSource,
      ruleFields: configuredRuleFields(featSource.getGroups, config.locationField),
    };
  });
  const updated = (row: GraphRowRef, propertyKey?: string) =>
    !patch ||
    patch.updates.some(
      (update) => sameMetricRow(update.row, row) && (propertyKey === undefined || propertyKey === update.propertyKey)
    );
  const previousNodes = new Map(patch?.previous.nodes.map((record) => [record.key, record]));
  const getLayer = (row: GraphRowRef) => layers[row.layerIndex ?? 0] ?? layers[0];
  const nodes = input.snapshot.nodes.flatMap((record, index) => {
    const layer = getLayer(record.primaryRow);
    const previous = previousNodes.get(record.key);
    if (patch && !updated(record.primaryRow)) {
      return previous ? [previous] : [];
    }
    let visual = nodeVisual(layer.input, record, index, layer.featSource, allGroups, layer.ruleFields);
    if (visual && previous) {
      visual = Object.freeze({ ...visual, feature: { ...previous.feature, ...visual.feature } });
    }
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
      const nodeMetric = layer.input.config.node(row.sourceIndex).colorKey;
      const edgeMetric = layer.input.config.edge(row.sourceIndex).colorKey;
      const previous = patch?.previous.edgeUnits[unitRef];
      const eligible = !patch || (Boolean(nodeMetric) && nodeMetric === edgeMetric && updated(row, nodeMetric));
      let visual = eligible
        ? edgeUnitVisual(
            layer.input,
            index,
            unitRef,
            row,
            source?.key ?? '',
            source?.id ?? '',
            layer.featSource,
            allGroups,
            layer.ruleFields
          )
        : previous;
      if (eligible && visual && previous) {
        visual = Object.freeze({ ...visual, feature: { ...previous.feature, ...visual.feature } });
      }
      edgeUnits[unitRef] = visual;
      if (
        visual &&
        row.sourceIndex === primaryRow.sourceIndex &&
        row.rowIndex === primaryRow.rowIndex &&
        row.layerIndex === primaryRow.layerIndex
      ) {
        edgePrimaryUnitRefs[index] = unitRef;
      }
    }
  }

  const colors = patch?.previous.colors.slice() ?? new Uint8Array(input.snapshot.nodes.length * 4);
  const muted = patch?.previous.muted.slice() ?? new Uint8Array(input.snapshot.nodes.length * 4);
  const annotations = patch?.previous.annotations.slice() ?? new Uint8Array(input.snapshot.nodes.length * 4);
  const groupIndices = patch?.previous.groupIndices.slice() ?? new Uint8Array(input.snapshot.nodes.length);
  for (const node of nodes) {
    if (patch && !updated(node.row)) {
      continue;
    }
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
    const sourceIndex = layerRecords[0]?.primaryRow.sourceIndex;
    layer.featSource.setColorLegend(
      sourceIndex === undefined ? undefined : layer.input.config.node(sourceIndex).colorLegend
    );
    layer.featSource.setFeatures(
      layerNodes.map((node) => node.feature),
      layerNodes[0]?.row.sourceKey
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
