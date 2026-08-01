import type { DataFrame, ScopedVars } from '@grafana/data';

import type { BiColProps } from '../../types';
import type { GraphBuiltState, GraphFrameSnapshot, GraphNodeRecord, GraphRowRef } from './types';

export interface GraphInteractionValues {
  readonly nodeId?: string;
  readonly edgeId?: string;
  readonly sourceId?: string;
  readonly targetId?: string;
  readonly namespaceId?: string;
}

interface GraphInteractionBase {
  readonly key: string;
  readonly primaryRow: GraphRowRef;
  readonly row: GraphRowRef;
  readonly rows: readonly GraphRowRef[];
  readonly values: GraphInteractionValues;
}

export interface GraphNodeInteraction extends GraphInteractionBase {
  readonly kind: 'node';
  readonly record: GraphNodeRecord;
}

export interface GraphEdgeInteractionRecord {
  readonly recordRef: number;
  readonly key: string;
  readonly id: string;
  readonly sourceKey: string;
  readonly targetKey: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly sourceNamespaceId: string;
  readonly targetNamespaceId: string;
  readonly primaryRow: GraphRowRef;
  readonly rows: readonly GraphRowRef[];
}

export interface GraphEdgeInteraction extends GraphInteractionBase {
  readonly kind: 'edge';
  readonly record: GraphEdgeInteractionRecord;
  readonly runtimeId?: string;
  readonly edgeRef?: number;
  readonly unitRow?: GraphRowRef;
}

export type GraphInteraction = GraphNodeInteraction | GraphEdgeInteraction;

export interface GraphInteractionState {
  readonly snapshot?: GraphFrameSnapshot;
  readonly graph?: Pick<GraphBuiltState, 'edgeIndex'>;
  readonly features?: readonly BiColProps[];
}

export interface GraphInteractionRow {
  readonly frame: DataFrame;
  readonly frameIndex: number;
  readonly rowIndex: number;
  readonly row: GraphRowRef;
}

type GraphInteractionPanel = {
  readonly features?: readonly BiColProps[];
  readonly graphFrameRuntime?: {
    readonly snapshot?: GraphFrameSnapshot;
    readonly graph?: {
      readonly state?: GraphBuiltState;
    };
    readonly render?: {
      readonly state?: {
        readonly features?: readonly BiColProps[];
      };
    };
  };
};

function integer(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function rowRef(value: unknown): GraphRowRef | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Partial<GraphRowRef>;
  return integer(candidate.frameIndex) !== undefined && integer(candidate.rowIndex) !== undefined
    ? (value as GraphRowRef)
    : undefined;
}

function existingInteraction(info: any): GraphInteraction | undefined {
  const interaction =
    info?.graphInteraction ?? info?.object?.graphInteraction ?? info?.object?.properties?.graphInteraction;
  if (
    interaction &&
    (interaction.kind === 'node' || interaction.kind === 'edge') &&
    interaction.record &&
    rowRef(interaction.primaryRow) &&
    rowRef(interaction.row)
  ) {
    return interaction as GraphInteraction;
  }
  return undefined;
}

function graphMetadata(
  value: any
): { key?: string; primaryRow?: GraphRowRef; rows?: readonly GraphRowRef[] } | undefined {
  const metadata = value?.graphFrame;
  return metadata && typeof metadata === 'object' ? metadata : undefined;
}

function pickedEdgeRef(info: any, object: any): number | undefined {
  const feature = object?.feature;
  return integer(object?.edgeRef) ?? integer(feature?.edgeRef) ?? integer(info?.edgeRef);
}

function edgeRecordRef(
  snapshot: GraphFrameSnapshot,
  graph: GraphInteractionState['graph'],
  info: any,
  object: any,
  properties: any
): number | undefined {
  const feature = object?.feature;
  const metadata =
    graphMetadata(object) ?? graphMetadata(properties) ?? graphMetadata(feature) ?? graphMetadata(feature?.properties);
  const edgeRef = pickedEdgeRef(info, object);
  if (edgeRef !== undefined && graph && edgeRef < graph.edgeIndex.edgeCount) {
    return graph.edgeIndex.getEdgeRecordRef(edgeRef);
  }
  const index = integer(properties?.id) ?? integer(feature?.properties?.id);
  const byKey = metadata?.key ? snapshot.relations.findRecordByKey(metadata.key) : undefined;
  if (byKey !== undefined) {
    return byKey;
  }
  if (index !== undefined && index < snapshot.relations.recordCount) {
    return index;
  }

  const id = object?.edgeId ?? feature?.edgeId ?? properties?.edgeId;
  const records = id !== undefined ? snapshot.relations.getRecordRefsById(String(id)) : undefined;
  return records?.length === 1 ? records[0] : undefined;
}

function materializeInteractionRecord(snapshot: GraphFrameSnapshot, recordRef: number): GraphEdgeInteractionRecord {
  const source = snapshot.nodes[snapshot.relations.getRecordSourceNodeRef(recordRef)];
  const target = snapshot.nodes[snapshot.relations.getRecordTargetNodeRef(recordRef)];
  const primaryRow = snapshot.relations.getRecordPrimaryRow(recordRef);
  const unitStart = snapshot.relations.getRecordUnitStart(recordRef);
  const unitCount = snapshot.relations.getRecordUnitCount(recordRef);
  return Object.freeze({
    recordRef,
    key: snapshot.relations.getRecordKey(recordRef),
    id: snapshot.relations.getRecordId(recordRef),
    sourceKey: source.key,
    targetKey: target.key,
    sourceId: source.id,
    targetId: target.id,
    sourceNamespaceId: source.namespaceId,
    targetNamespaceId: target.namespaceId,
    primaryRow,
    rows: Object.freeze(
      Array.from({ length: unitCount }, (_, unitOffset) => snapshot.relations.getUnitRow(unitStart + unitOffset))
    ),
  });
}

function edgeUnitRow(
  snapshot: GraphFrameSnapshot,
  graph: GraphInteractionState['graph'],
  edgeRef: number | undefined
): GraphRowRef | undefined {
  if (!graph || edgeRef === undefined || edgeRef >= graph.edgeIndex.edgeCount) {
    return undefined;
  }
  const unitRef = graph.edgeIndex.getEdgeUnitRef(edgeRef);
  return unitRef < snapshot.relations.unitCount ? snapshot.relations.getUnitRow(unitRef) : undefined;
}

function resolveEdgeInteraction(
  state: GraphInteractionState,
  info: any,
  object: any,
  properties: any
): GraphEdgeInteraction | undefined {
  const snapshot = state.snapshot;
  if (!snapshot) {
    return undefined;
  }

  const edgeRef = pickedEdgeRef(info, object);
  const recordRef = edgeRecordRef(snapshot, state.graph, info, object, properties);
  if (recordRef === undefined) {
    return undefined;
  }
  const record = materializeInteractionRecord(snapshot, recordRef);

  const unitRow = edgeUnitRow(snapshot, state.graph, edgeRef);
  const runtimeId = object?.edgeId ?? object?.feature?.edgeId ?? properties?.edgeId;
  return Object.freeze({
    kind: 'edge',
    key: record.key,
    record,
    primaryRow: record.primaryRow,
    row: unitRow ?? record.primaryRow,
    rows: record.rows,
    ...(edgeRef !== undefined && { edgeRef }),
    ...(unitRow && { unitRow }),
    ...(runtimeId !== undefined && { runtimeId: String(runtimeId) }),
    values: Object.freeze({
      edgeId: record.id,
      sourceId: record.sourceId,
      targetId: record.targetId,
      namespaceId: record.sourceNamespaceId,
    }),
  });
}

function pickedNodeFeature(state: GraphInteractionState, info: any, properties: any): BiColProps | undefined {
  const points = info?.sourceLayer?.props?.data?.points ?? info?.layer?.props?.data?.points;
  const isBinaryPoint =
    points && (info?.featureType === 'points' || info?.viewport?.id === '3d-scene') && info?.index !== -1;
  if (isBinaryPoint) {
    const featureIndex = integer(points.featureIds?.value?.[info.index]);
    return featureIndex !== undefined ? state.features?.[featureIndex] : undefined;
  }
  return properties;
}

function resolveNodeInteraction(
  state: GraphInteractionState,
  info: any,
  object: any,
  properties: any
): GraphNodeInteraction | undefined {
  const snapshot = state.snapshot;
  if (!snapshot) {
    return undefined;
  }

  const feature = pickedNodeFeature(state, info, properties);
  const metadata = graphMetadata(feature) ?? graphMetadata(object) ?? graphMetadata(properties);
  const index = integer(feature?.id) ?? integer(properties?.id);
  const record =
    (metadata?.key ? snapshot.nodeByKey.get(metadata.key) : undefined) ??
    (index !== undefined ? snapshot.nodes[index] : undefined);
  if (!record) {
    return undefined;
  }

  return Object.freeze({
    kind: 'node',
    key: record.key,
    record,
    primaryRow: record.primaryRow,
    row: record.primaryRow,
    rows: record.rows,
    values: Object.freeze({
      nodeId: record.id,
      namespaceId: record.namespaceId,
    }),
  });
}

export function resolveGraphInteraction(state: GraphInteractionState, info: any): GraphInteraction | undefined {
  const existing = existingInteraction(info);
  if (existing) {
    return existing;
  }

  const object = info?.object;
  const properties = object?.properties ?? object;
  const feature = object?.feature;
  const looksLikeEdge =
    object?.edgeId !== undefined ||
    feature?.edgeId !== undefined ||
    object?.edgeRef !== undefined ||
    feature?.edgeRef !== undefined;

  return looksLikeEdge
    ? resolveEdgeInteraction(state, info, object, properties)
    : resolveNodeInteraction(state, info, object, properties);
}

export function resolvePanelGraphInteraction(
  panel: GraphInteractionPanel | undefined,
  info: any
): GraphInteraction | undefined {
  const runtime = panel?.graphFrameRuntime;
  return resolveGraphInteraction(
    {
      snapshot: runtime?.snapshot,
      graph: runtime?.graph?.state,
      features: panel?.features ?? runtime?.render?.state?.features,
    },
    info
  );
}

export function resolveGraphInteractionRow(
  series: readonly DataFrame[],
  interaction: GraphInteraction
): GraphInteractionRow | undefined {
  const row = interaction.row;
  let frame: DataFrame | undefined = series[row.frameIndex];
  const matchesRef = (candidate: DataFrame | undefined) =>
    Boolean(candidate && (!row.frameRefId || candidate.refId === row.frameRefId || candidate.name === row.frameRefId));

  if (!matchesRef(frame) && row.frameRefId) {
    frame = series.find((candidate) => candidate.refId === row.frameRefId || candidate.name === row.frameRefId);
  }
  if (!frame || row.rowIndex < 0 || row.rowIndex >= frame.length) {
    return undefined;
  }

  return {
    frame,
    frameIndex: series.indexOf(frame),
    rowIndex: row.rowIndex,
    row,
  };
}

export function getGraphInteractionScopedVars(interaction: GraphInteraction): ScopedVars {
  return Object.fromEntries(
    Object.entries(interaction.values)
      .filter((entry): entry is [string, string] => entry[1] !== undefined)
      .map(([name, value]) => [name, { text: value, value }])
  );
}
