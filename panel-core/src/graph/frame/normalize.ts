import type { Field } from '@grafana/data';

import { decodeGeohash } from '../../grafana_core/app/features/geo/format/geohash';
import { CMN_NAMESPACE } from '../../types/defaults';
import { GraphDiagnosticCollector } from './diagnostics';
import {
  PACKED_MAX_REF,
  PackedGraphRelationsBuilder,
  PackedRelationCapacityError,
  isPackedRelationCapacityError,
} from './packedRelations';
import { createGraphRowRef, resolveGraphFrames, selectGraphFrames } from './selection';
import { createGraphGeometrySignature, createGraphTopologySignature } from './signature';
import type {
  GraphFrameOptions,
  GraphFrameRef,
  GraphFrameSnapshot,
  GraphNodeRecord,
  GraphNormalizationInput,
  GraphPosition,
  GraphResolvedFrame,
  GraphRowRef,
  GraphStageResult,
} from './types';

interface MutableNode {
  key: string;
  id: string;
  namespaceId: string;
  primaryRow: GraphRowRef;
  rows: GraphRowRef[];
  position?: GraphPosition;
}

interface ResolvedLayer {
  readonly layerIndex?: number;
  readonly options: GraphFrameOptions;
  readonly selections: ReturnType<typeof selectGraphFrames>;
  readonly frames: readonly GraphResolvedFrame[];
}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function normalizeId(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length ? normalized : undefined;
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  return undefined;
}

function graphNodeKey(namespaceId: string, id: string): string {
  return JSON.stringify([namespaceId, id]);
}

function graphEdgeKey(sourceNamespaceId: string, id: string): string {
  return JSON.stringify([sourceNamespaceId, id]);
}

function positionFromCoordinates(value: unknown): GraphPosition | undefined {
  if (!Array.isArray(value) || !isFiniteNumber(value[0]) || !isFiniteNumber(value[1])) {
    return undefined;
  }
  return Object.freeze([value[0], value[1]]) as GraphPosition;
}

function positionFromGeoJSON(value: unknown): GraphPosition | undefined {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return undefined;
  }

  const object = parsed as {
    type?: string;
    coordinates?: unknown;
    geometry?: { type?: string; coordinates?: unknown };
  };
  const geometry = object.type === 'Feature' ? object.geometry : object;
  if (geometry?.type !== 'Point') {
    return undefined;
  }
  return positionFromCoordinates(geometry.coordinates);
}

function positionAt(frame: GraphResolvedFrame, rowIndex: number, isLogic: boolean): GraphPosition | undefined {
  if (isLogic) {
    return Object.freeze([7, 7]) as GraphPosition;
  }

  const location = frame.location;
  if (location.geojson) {
    return positionFromGeoJSON(location.geojson.values[rowIndex]);
  }
  if (location.geo) {
    return positionFromGeoJSON(location.geo.values[rowIndex]);
  }
  if (location.longitude && location.latitude) {
    const longitude = location.longitude.values[rowIndex];
    const latitude = location.latitude.values[rowIndex];
    return isFiniteNumber(longitude) && isFiniteNumber(latitude)
      ? (Object.freeze([longitude, latitude]) as GraphPosition)
      : undefined;
  }
  if (location.geohash) {
    const value = location.geohash.values[rowIndex];
    const position = typeof value === 'string' ? decodeGeohash(value) : undefined;
    return position ? (Object.freeze(position) as GraphPosition) : undefined;
  }
  if (location.lookup && location.findLookup) {
    const value = normalizeId(location.lookup.values[rowIndex]);
    const position = value ? location.findLookup(value) : undefined;
    return position ? (Object.freeze([...position]) as GraphPosition) : undefined;
  }
  return undefined;
}

function parseTargetValue(value: unknown): { value?: unknown; malformed?: boolean } {
  if (typeof value !== 'string') {
    return { value };
  }

  const trimmed = value.trim();
  if (!trimmed.length) {
    return {};
  }
  if (!trimmed.startsWith('[') && !trimmed.startsWith('"')) {
    return { value: trimmed };
  }

  try {
    return { value: JSON.parse(trimmed) };
  } catch {
    return { malformed: true };
  }
}

function normalizePath(
  rawTarget: unknown,
  sourceId: string,
  sourceNamespaceId: string,
  targetNamespaceId: string,
  isLogic: boolean
):
  | {
      rawPath: readonly unknown[];
      targetId: string;
      targetKey: string;
    }
  | undefined {
  const parsed = parseTargetValue(rawTarget);
  if (parsed.malformed || parsed.value == null) {
    return undefined;
  }

  let rawPath = Array.isArray(parsed.value) ? [...parsed.value] : [parsed.value];
  if (rawPath.length === 1 || normalizeId(rawPath[0]) !== sourceId) {
    rawPath = [sourceId, ...rawPath];
  }
  if (rawPath.length < 2) {
    return undefined;
  }

  const targetId = normalizeId(rawPath.at(-1));
  if (!targetId) {
    return undefined;
  }

  let itemCount = 0;
  rawPath.forEach((item) => {
    const id = normalizeId(item);
    if (id) {
      itemCount++;
      return;
    }
    if (!isLogic && Array.isArray(item) && isFiniteNumber(item[0]) && isFiniteNumber(item[1])) {
      itemCount++;
    }
  });

  if (itemCount < 2 || normalizeId(rawPath[0]) !== sourceId || normalizeId(rawPath.at(-1)) !== targetId) {
    return undefined;
  }

  return {
    rawPath: Object.freeze(rawPath),
    targetId,
    targetKey: graphNodeKey(targetNamespaceId, targetId),
  };
}

function fieldValue(field: Field | undefined, rowIndex: number): unknown {
  return field?.values[rowIndex];
}

function samePosition(left?: GraphPosition, right?: GraphPosition): boolean {
  return left?.[0] === right?.[0] && left?.[1] === right?.[1];
}

function freezeNode(node: MutableNode, index: number): GraphNodeRecord {
  return Object.freeze({
    index,
    key: node.key,
    id: node.id,
    namespaceId: node.namespaceId,
    primaryRow: node.primaryRow,
    rows: Object.freeze([...node.rows]),
  });
}

export async function normalizeGraphFrames(
  input: GraphNormalizationInput,
  internalOptions: { readonly packedMaxRef?: number } = {}
): Promise<GraphStageResult<GraphFrameSnapshot>> {
  const layerInputs = input.normalizationLayers?.length
    ? input.normalizationLayers
    : Object.freeze([{ layerIndex: undefined, options: input.options }]);
  const diagnostics = new GraphDiagnosticCollector(input.options.diagnosticExampleLimit);
  const resolvedLayers: ResolvedLayer[] = [];

  for (const layer of layerInputs) {
    const selections = selectGraphFrames(input.data.series, layer.options.query);
    if (!selections.length) {
      diagnostics.add('no-matching-frames', 'info', 'No data frames matched the configured graph layer', {
        layerName: layer.options.layerName,
        ...(layer.layerIndex !== undefined && { layerIndex: layer.layerIndex }),
      });
    }

    const resolvedResult = await resolveGraphFrames(selections, layer.options);
    diagnostics.addAll(resolvedResult.diagnostics);
    if (resolvedResult.ok) {
      resolvedLayers.push({
        layerIndex: layer.layerIndex,
        options: layer.options,
        selections,
        frames: resolvedResult.value,
      });
    }
  }

  if (diagnostics.hasFatal()) {
    return Object.freeze({
      ok: false,
      diagnostics: diagnostics.result(),
    });
  }

  const nodeBuilders = new Map<string, MutableNode>();
  const namespaces = new Set<string>();
  const maximum = internalOptions.packedMaxRef ?? PACKED_MAX_REF;
  const relationBuilder = new PackedGraphRelationsBuilder({ maxRef: maximum });
  let packedCapacityError: PackedRelationCapacityError | undefined;

  for (const layer of resolvedLayers) {
    const { options } = layer;
    const defaultNamespace = options.defaultNamespace ?? CMN_NAMESPACE;

    for (const resolved of layer.frames) {
      const frame = resolved.selection.frame;
      const rowCount = frame.length ?? resolved.nodeId.values.length;

      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const row = createGraphRowRef(resolved.selection, rowIndex, layer.layerIndex);
        const nodeIdValue = resolved.nodeId.values[rowIndex];
        const nodeId = normalizeId(nodeIdValue);
        const context = {
          layerName: options.layerName,
          ...(layer.layerIndex !== undefined && { layerIndex: layer.layerIndex }),
          frameIndex: resolved.selection.frameIndex,
          frameRefId: frame.refId,
          fieldName: resolved.nodeId.name,
          rowIndex,
        };
        if (!nodeId) {
          diagnostics.add('invalid-node-id', 'warning', 'Row has an invalid node ID', context, nodeIdValue);
          continue;
        }

        const sourceNamespaceId = normalizeId(fieldValue(resolved.sourceNamespace, rowIndex)) ?? defaultNamespace;
        const targetNamespaceId = normalizeId(fieldValue(resolved.targetNamespace, rowIndex)) ?? defaultNamespace;
        const nodeKey = graphNodeKey(sourceNamespaceId, nodeId);
        const position = positionAt(resolved, rowIndex, options.isLogic);
        let node = nodeBuilders.get(nodeKey);

        if (!position && !options.isLogic && !node) {
          diagnostics.add(
            'invalid-coordinate',
            'warning',
            'Geographic node row has no valid point location',
            context,
            nodeIdValue
          );
          continue;
        }

        if (!node) {
          node = {
            key: nodeKey,
            id: nodeId,
            namespaceId: sourceNamespaceId,
            primaryRow: row,
            rows: [row],
            ...(position ? { position } : {}),
          };
          nodeBuilders.set(nodeKey, node);
          namespaces.add(sourceNamespaceId);
        } else {
          node.rows.push(row);
          if (position && node.position && !samePosition(position, node.position)) {
            diagnostics.add(
              'conflicting-node',
              'warning',
              'Repeated node row has a conflicting point location; the primary row is retained',
              context,
              {
                primary: node.position,
                next: position,
              }
            );
          }
        }

        const targetValue = fieldValue(resolved.target, rowIndex);
        if (targetValue == null || targetValue === '') {
          continue;
        }

        const normalizedPath = normalizePath(
          targetValue,
          nodeId,
          sourceNamespaceId,
          targetNamespaceId,
          options.isLogic
        );
        if (!normalizedPath) {
          diagnostics.add(
            'invalid-path',
            'warning',
            'Row has an invalid target or routed path',
            {
              ...context,
              fieldName: resolved.target?.name,
            },
            targetValue
          );
          continue;
        }

        const explicitValue = normalizeId(fieldValue(resolved.edgeId, rowIndex));
        const edgeId = explicitValue ?? `${nodeId}-${normalizedPath.targetId}`;
        if (!packedCapacityError) {
          try {
            relationBuilder.beginUnit({
              explicitId: explicitValue !== undefined,
              id: edgeId,
              key: graphEdgeKey(sourceNamespaceId, edgeId),
              sourceKey: nodeKey,
              targetKey: normalizedPath.targetKey,
              targetId: normalizedPath.targetId,
              row,
              diagnosticContext: {
                ...context,
                fieldName: resolved.target?.name,
              },
            });
            normalizedPath.rawPath.forEach((item, index) => {
              const id = normalizeId(item);
              if (id) {
                const namespaceId = index === normalizedPath.rawPath.length - 1 ? targetNamespaceId : sourceNamespaceId;
                relationBuilder.pushNodeKey(graphNodeKey(namespaceId, id), id);
                return;
              }
              if (!options.isLogic && Array.isArray(item) && isFiniteNumber(item[0]) && isFiniteNumber(item[1])) {
                relationBuilder.pushCoordinate(item[0], item[1], {
                  ...(isFiniteNumber(item[2]) ? { elevation: item[2] } : {}),
                  ...(typeof item[3] === 'string' ? { commentText: item[3] } : {}),
                  ...(typeof item[4] === 'string' ? { iconColor: item[4] } : {}),
                });
              }
            });
            relationBuilder.finishUnit();
          } catch (error) {
            if (!isPackedRelationCapacityError(error)) {
              throw error;
            }
            packedCapacityError = error;
          }
        }
      }
    }
  }

  if (packedCapacityError) {
    return packedCapacityFailure(diagnostics, packedCapacityError);
  }

  const nodeBuildersInOrder = Array.from(nodeBuilders.values());
  const nodes = Object.freeze(nodeBuildersInOrder.map(freezeNode));
  const positions = new Float64Array(nodes.length * 2);
  nodeBuildersInOrder.forEach((node, index) => {
    positions[index * 2] = node.position?.[0] ?? 7;
    positions[index * 2 + 1] = node.position?.[1] ?? 7;
  });
  nodeBuilders.clear();
  nodeBuildersInOrder.length = 0;
  if (nodes.length - 1 > maximum) {
    return packedCapacityFailure(diagnostics, new PackedRelationCapacityError('node', nodes.length - 1, maximum));
  }
  let relations;
  try {
    relations = relationBuilder.finalize({
      nodeRefByKey: new Map(nodes.map(({ key, index }) => [key, index] as const)),
      diagnostics,
    });
  } catch (error) {
    if (!isPackedRelationCapacityError(error)) {
      throw error;
    }
    return packedCapacityFailure(diagnostics, error);
  }
  const nodeByKey = new Map(nodes.map((node) => [node.key, node] as const));

  const frames: readonly GraphFrameRef[] = Object.freeze(
    resolvedLayers.flatMap((layer) =>
      layer.selections.map((selection) =>
        Object.freeze({
          frameIndex: selection.frameIndex,
          frameRefId: selection.frame.refId,
          rowCount: selection.frame.length,
          ...(layer.layerIndex !== undefined && { layerIndex: layer.layerIndex }),
        })
      )
    )
  );
  const resultDiagnostics = diagnostics.result();

  if (!nodes.length && frames.length) {
    diagnostics.add('empty-graph', 'info', 'Selected graph frames contain no valid node rows', {
      layerName: input.options.layerName,
    });
  }

  const topologySignature = createGraphTopologySignature({
    nodes,
    namespaces: Array.from(namespaces),
    relations,
  });
  const geometrySignature = createGraphGeometrySignature({ nodes, positions, relations });
  const finalDiagnostics = nodes.length ? resultDiagnostics : diagnostics.result();
  const snapshot: GraphFrameSnapshot = Object.freeze({
    frames,
    nodes,
    positions,
    relations,
    namespaces: Object.freeze(Array.from(namespaces)),
    nodeByKey,
    diagnostics: finalDiagnostics,
    topologySignature,
    geometrySignature,
  });

  return Object.freeze({
    ok: true,
    value: snapshot,
    diagnostics: finalDiagnostics,
    empty: nodes.length === 0,
  });
}

function packedCapacityFailure(
  diagnostics: GraphDiagnosticCollector,
  error: PackedRelationCapacityError
): GraphStageResult<GraphFrameSnapshot> {
  diagnostics.add(
    'pipeline-failed',
    'fatal',
    'Graph cardinality exceeds the packed relation encoding capacity',
    {},
    error.message
  );
  return Object.freeze({ ok: false, diagnostics: diagnostics.result() });
}

export const graphFrameKey = Object.freeze({
  node: graphNodeKey,
  edge: graphEdgeKey,
});
