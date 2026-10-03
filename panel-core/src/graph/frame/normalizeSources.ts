import { CMN_NAMESPACE } from '../../types/defaults';
import { getNsPrefixes, joinNsParts } from '../utils/utils.graph';
import { GraphDiagnosticCollector } from './diagnostics';
import {
  PACKED_MAX_REF,
  PackedGraphRelationsBuilder,
  PackedRelationCapacityError,
  isPackedRelationCapacityError,
} from './packedRelations';
import { createGraphGeometrySignature, createGraphTopologySignature } from './signature';
import type {
  GraphFrameOptions,
  GraphFrameRef,
  GraphFrameSnapshot,
  GraphNodeRecord,
  GraphPosition,
  GraphRowRef,
  GraphStageResult,
} from './types';

import type { GraphSource, ValueColumn } from '../../data';

interface MutableNode {
  key: string;
  id: string;
  namespaceId: string;
  primaryRow: GraphRowRef;
  rows: GraphRowRef[];
  position?: GraphPosition;
}

export interface GraphBoundLayer {
  readonly layerIndex?: number;
  readonly options: GraphFrameOptions;
  readonly sources: readonly GraphSource[];
}

export interface GraphSourceNormalizationInput {
  readonly layers: readonly GraphBoundLayer[];
  readonly diagnostics?: ReadonlyArray<import('./types').GraphFrameDiagnostic>;
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

function namespaceSeparator(value: string | undefined): string {
  return value && Array.from(value).length <= 2 ? value : '.';
}

function normalizeNamespace(value: unknown, fallback: string, separator: string | undefined) {
  const label = normalizeId(value) ?? fallback;
  const resolvedSeparator = namespaceSeparator(separator);
  const parts = label.split(resolvedSeparator);
  const id = joinNsParts(parts);
  const prefixes = getNsPrefixes(id);
  return {
    id,
    labels: prefixes.map((prefix, index) => [prefix, parts.slice(0, index + 1).join(resolvedSeparator)] as const),
  };
}

function graphEdgeKey(sourceNamespaceId: string, id: string): string {
  return JSON.stringify([sourceNamespaceId, id]);
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

function fieldValue(field: ValueColumn | undefined, rowIndex: number): unknown {
  return field?.get(rowIndex);
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

export async function normalizeGraphSources(
  input: GraphSourceNormalizationInput,
  internalOptions: { readonly packedMaxRef?: number } = {}
): Promise<GraphStageResult<GraphFrameSnapshot>> {
  const diagnostics = new GraphDiagnosticCollector(input.layers[0]?.options.diagnosticExampleLimit);
  diagnostics.addAll(input.diagnostics ?? []);
  if (diagnostics.hasFatal()) {
    return Object.freeze({ ok: false, diagnostics: diagnostics.result() });
  }
  const resolvedLayers = input.layers;

  const nodeBuilders = new Map<string, MutableNode>();
  const namespaces = new Set<string>();
  const namespaceLabels = new Map<string, string>();
  const maximum = internalOptions.packedMaxRef ?? PACKED_MAX_REF;
  const relationBuilder = new PackedGraphRelationsBuilder({ maxRef: maximum });
  let packedCapacityError: PackedRelationCapacityError | undefined;

  for (const layer of resolvedLayers) {
    const { options } = layer;
    const defaultNamespace = options.isLogic ? (options.defaultNamespace ?? CMN_NAMESPACE) : CMN_NAMESPACE;

    for (const resolved of layer.sources) {
      const rowCount = resolved.rowCount;

      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const row: GraphRowRef = Object.freeze({
          sourceIndex: resolved.index,
          sourceKey: resolved.key,
          rowIndex,
          revision: resolved.revision,
          ...(layer.layerIndex !== undefined && { layerIndex: layer.layerIndex }),
        });
        const nodeIdValue = resolved.nodeId.get(rowIndex);
        const nodeId = normalizeId(nodeIdValue);
        const context = {
          layerName: options.layerName,
          ...(layer.layerIndex !== undefined && { layerIndex: layer.layerIndex }),
          sourceIndex: resolved.index,
          sourceKey: resolved.key,
          fieldName: resolved.nodeId.key,
          rowIndex,
        };
        if (!nodeId) {
          diagnostics.add('invalid-node-id', 'warning', 'Row has an invalid node ID', context, nodeIdValue);
          continue;
        }

        const sourceNamespace = options.isLogic
          ? normalizeNamespace(
              fieldValue(resolved.sourceNamespace, rowIndex),
              defaultNamespace,
              options.namespaceSeparator
            )
          : { id: defaultNamespace, labels: [[defaultNamespace, defaultNamespace] as const] };
        const targetNamespace = options.isLogic
          ? normalizeNamespace(
              fieldValue(resolved.targetNamespace, rowIndex),
              defaultNamespace,
              options.namespaceSeparator
            )
          : { id: defaultNamespace, labels: [[defaultNamespace, defaultNamespace] as const] };
        const sourceNamespaceId = sourceNamespace.id;
        const targetNamespaceId = targetNamespace.id;
        for (const [id, label] of [...sourceNamespace.labels, ...targetNamespace.labels]) {
          if (!namespaceLabels.has(id)) {
            namespaceLabels.set(id, label);
          }
        }
        const nodeKey = graphNodeKey(sourceNamespaceId, nodeId);
        const position = options.isLogic ? Object.freeze([7, 7] as const) : resolved.position(rowIndex);
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
              fieldName: resolved.target?.key,
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
                fieldName: resolved.target?.key,
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
      layer.sources.map((source) =>
        Object.freeze({
          sourceIndex: source.index,
          sourceKey: source.key,
          rowCount: source.rowCount,
          revision: source.revision,
          ...(layer.layerIndex !== undefined && { layerIndex: layer.layerIndex }),
        })
      )
    )
  );
  const resultDiagnostics = diagnostics.result();

  if (!nodes.length && frames.length) {
    diagnostics.add('empty-graph', 'info', 'Selected graph frames contain no valid node rows', {
      layerName: input.layers[0]?.options.layerName,
    });
  }

  const topologySignature = createGraphTopologySignature({
    nodes,
    namespaces: Array.from(namespaces),
    namespaceLabels,
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
    namespaceLabels,
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
