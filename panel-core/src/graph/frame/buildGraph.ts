import { Graph, GraphEdgeIndex, Node, setEdge, setGraphNsLabel, setNodeData, setGraphPositionRanges } from '../main';
import { AttributeRegistry } from '../structs/attributeRegistry';
import type { Edge } from '../structs/edge';
import { CMN_NAMESPACE } from '../../types/defaults';
import { joinNsParts, splitNsId } from '../utils/utils.graph';
import type { CoordRef, NodeData } from '../../types';
import { PackedRelationFlags, decodeRouteRef, isCoordinateToken } from './packedRelations';
import type {
  GraphBuildOptions,
  GraphBuiltState,
  GraphEntityRowMetadata,
  GraphFrameSnapshot,
  GraphStageResult,
} from './types';

type RuntimeNodeData = NodeData & {
  graphFrame: GraphEntityRowMetadata;
};

function ensureNamespace(
  root: Graph,
  namespaces: Map<string, Graph>,
  namespaceId: string,
  namespaceLabels?: ReadonlyMap<string, string>
): Graph {
  if (!namespaceId || namespaceId === CMN_NAMESPACE) {
    return root;
  }

  let parent = root;
  const parts = splitNsId(namespaceId);
  const path: string[] = [];
  for (const part of parts) {
    path.push(part);
    const id = joinNsParts(path);
    let graph = namespaces.get(id);
    if (!graph) {
      graph = new Graph(id);
      parent.addNode(graph);
      namespaces.set(id, graph);
    }
    setGraphNsLabel(graph, namespaceLabels?.get(id) ?? id);
    parent = graph;
  }
  return parent;
}

function createUnitEdges(
  snapshot: GraphFrameSnapshot,
  recordRef: number,
  unitRef: number,
  unitOffset: number,
  graphByNamespace: ReadonlyMap<string, Graph>,
  expandHop?: (source: Node, target: Node, offset: number) => Node[]
) {
  const { relations } = snapshot;
  const routeStart = relations.getUnitRouteStart(unitRef);
  const routeLength = relations.getUnitRouteLength(unitRef);
  const nodeRefs: number[] = [];
  for (let tokenIndex = routeStart; tokenIndex < routeStart + routeLength; tokenIndex++) {
    const token = relations.getRouteToken(tokenIndex);
    if (!isCoordinateToken(token)) {
      nodeRefs.push(token);
    }
  }
  const row = relations.getUnitRow(unitRef);
  const recordId = relations.getRecordId(recordRef);
  const path: Node[] = [];
  const segmentSuffixes: string[] = [];
  for (const [ordinal, ref] of nodeRefs.entries()) {
    const record = snapshot.nodes[ref];
    const node = record && graphByNamespace.get(record.namespaceId)?.findNode(record.id);
    if (!node) {
      return [];
    }
    const previous = path.at(-1);
    if (previous) {
      const ports = previous.parent !== node.parent ? (expandHop?.(previous, node, path.length - 1) ?? []) : [];
      path.push(...ports);
      const hop = ordinal - 1;
      for (let fragment = 0; fragment <= ports.length; fragment++) {
        segmentSuffixes.push(fragment === 0 ? (hop === 0 ? '' : `--${hop}`) : `--hop-${hop}-port-${fragment}`);
      }
    }
    path.push(node);
  }

  const edges: Edge[] = [];

  for (let segmentIndex = 0; segmentIndex + 1 < path.length; segmentIndex++) {
    const source = path[segmentIndex];
    const target = path[segmentIndex + 1];
    const sourceGraph = source.parent as Graph;
    const targetGraph = target.parent as Graph;

    const segmentSuffix = segmentSuffixes[segmentIndex];
    const unitSuffix = unitOffset ? `--dup-${unitOffset}` : '';
    const edge = setEdge(sourceGraph, `${recordId}${unitSuffix}${segmentSuffix}`, source.id, target.id, targetGraph);
    if (!edge) {
      continue;
    }
    edge.setAttr(AttributeRegistry.EdgeDataIndex, {
      edgeId: recordId,
      dataRecord: {
        frameRefId: row.sourceKey,
        rowIndex: row.rowIndex,
      },
      namespacePortPath: path.length !== nodeRefs.length,
      arrowPlacement:
        path.length === 2 ? 'both' : segmentIndex === 0 ? 'start' : segmentIndex === path.length - 2 ? 'end' : 'none',
    });
    edges.push(edge);
  }

  return edges;
}

type AddPathNode = (owner: Graph, id: string, data: Partial<NodeData>) => Node;

export function buildGraphFromSnapshot(
  snapshot: GraphFrameSnapshot,
  options: GraphBuildOptions = {},
  expandHop?: (source: Node, target: Node, layer: GraphBuildOptions | undefined, addNode: AddPathNode, unitRef: number, offset: number) => Node[]
): GraphStageResult<GraphBuiltState> {
  const graph = new Graph(CMN_NAMESPACE);
  const graphByNamespace = new Map<string, Graph>([[CMN_NAMESPACE, graph]]);
  for (const namespaceId of snapshot.namespaces) {
    ensureNamespace(graph, graphByNamespace, namespaceId, snapshot.namespaceLabels);
  }

  let positions = snapshot.positions.slice();
  const nodeByKey = new Map<string, Node>();
  const localNodeCounts = new Map<Graph, number>();
  const positionRanges: Array<{ namespaceId: string; start: number; end: number }> = [];
  let currentRange: { namespaceId: string; start: number; end: number } | undefined;

  snapshot.nodes.forEach((record) => {
    const { index } = record;
    const parent = ensureNamespace(graph, graphByNamespace, record.namespaceId, snapshot.namespaceLabels);
    const node = new Node(record.id);
    const metadata = Object.freeze({
      key: record.key,
      primaryRow: record.primaryRow,
      rows: record.rows,
    });
    const localIndex = localNodeCounts.get(parent) ?? 0;
    const data: RuntimeNodeData = {
      wasmId: index,
      idx: localIndex,
      graphFrame: metadata,
    };
    setNodeData(node, data);
    parent.addNode(node);
    localNodeCounts.set(parent, localIndex + 1);
    nodeByKey.set(record.key, node);
    if (!currentRange || currentRange.namespaceId !== record.namespaceId) {
      currentRange = {
        namespaceId: record.namespaceId,
        start: index,
        end: index + 1,
      };
      positionRanges.push(currentRange);
    } else {
      currentRange.end = index + 1;
    }
  });

  let addedNodeCount = 0;
  const addNode: AddPathNode = (namespace, id, data) => {
    const node = new Node(id);
    const wasmId = positions.length / 2 + addedNodeCount++;
    const idx = localNodeCounts.get(namespace) ?? 0;
    setNodeData(node, { ...data, wasmId, idx });
    namespace.addNode(node);
    localNodeCounts.set(namespace, idx + 1);
    positionRanges.push({ namespaceId: namespace.id, start: wasmId, end: wasmId + 1 });
    return node;
  };

  const edgeIndex = new GraphEdgeIndex();
  for (let recordRef = 0; recordRef < snapshot.relations.recordCount; recordRef++) {
    const primaryRow = snapshot.relations.getRecordPrimaryRow(recordRef);
    const layerOptions = primaryRow.layerIndex !== undefined ? options.layers?.[primaryRow.layerIndex] : undefined;
    const unitStart = snapshot.relations.getRecordUnitStart(recordRef);
    const unitCount = snapshot.relations.getRecordUnitCount(recordRef);
    const explicit = Boolean(snapshot.relations.getRecordFlags(recordRef) & PackedRelationFlags.explicitId);
    const runtimeUnitCount = explicit ? unitCount : Math.min(unitCount, 1);
    const units = Array.from({ length: unitCount }, (_, unitOffset) => ({
      unitRef: unitStart + unitOffset,
      edges:
        unitOffset < runtimeUnitCount
          ? createUnitEdges(
              snapshot,
              recordRef,
              unitStart + unitOffset,
              unitOffset,
              graphByNamespace,
              expandHop && ((source, target, offset) => expandHop(source, target, layerOptions, addNode, unitStart + unitOffset, offset))
            )
          : [],
    }));
    const routeStart = snapshot.relations.getRecordRouteStart(recordRef);
    const routeLength = snapshot.relations.getRecordRouteLength(recordRef);
    const vertexIds = Array.from({ length: routeLength }, (_, itemOffset) => {
      const token = snapshot.relations.getRouteToken(routeStart + itemOffset);
      return isCoordinateToken(token) ? undefined : decodeRouteRef(token);
    });
    edgeIndex.appendRecord({
      recordRef,
      units,
      vertexRefs: vertexIds,
      layerIndex: layerOptions?.layerIndex ?? options.layerIndex ?? 0,
      wrap: layerOptions?.wrap ?? options.wrap ?? 0,
      nest: layerOptions?.nest ?? options.nest ?? false,
    });
    for (const { unitRef } of units) {
      edgeIndex.forEachUnitEdge(unitRef, (edge, edgeRef) => {
        edge.setAttr(AttributeRegistry.EdgeDataIndex, {
          ...edge.data,
          edgeRef,
          recordRef,
          unitRef,
        });
      });
    }
  }
  edgeIndex.finalize();

  if (addedNodeCount) {
    const expanded = new Float64Array(positions.length + addedNodeCount * 2);
    expanded.set(positions);
    positions = expanded;
  }
  for (const [namespaceId, namespaceGraph] of graphByNamespace) {
    setGraphPositionRanges(
      namespaceGraph,
      positionRanges.filter((range) => range.namespaceId === namespaceId).map(({ start, end }) => [start, end])
    );
  }

  const state: GraphBuiltState = Object.freeze({
    buildOptions: options,
    graph,
    edgeIndex,
    positions,
    positionRanges: Object.freeze(positionRanges.map((range) => Object.freeze({ ...range }))),
    nodeByKey,
  });

  return Object.freeze({
    ok: true,
    value: state,
    diagnostics: snapshot.diagnostics,
    empty: snapshot.nodes.length === 0,
  });
}
