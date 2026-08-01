import { Graph, GraphEdgeIndex, Node, setEdge, setNodeData, setGraphPositionRanges } from '../main';
import { AttributeRegistry } from '../structs/attributeRegistry';
import type { Edge } from '../structs/edge';
import { CMN_NAMESPACE, NS_SEPARATOR } from '../../types/defaults';
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

function ensureNamespace(root: Graph, namespaces: Map<string, Graph>, namespaceId: string): Graph {
  if (!namespaceId || namespaceId === CMN_NAMESPACE) {
    return root;
  }

  let parent = root;
  const parts = namespaceId.split(NS_SEPARATOR);
  const path: string[] = [];
  for (const part of parts) {
    path.push(part);
    const id = path.join(NS_SEPARATOR);
    let graph = namespaces.get(id);
    if (!graph) {
      graph = new Graph(id);
      parent.addNode(graph);
      namespaces.set(id, graph);
    }
    parent = graph;
  }
  return parent;
}

function createUnitEdges(
  snapshot: GraphFrameSnapshot,
  recordRef: number,
  unitRef: number,
  unitOffset: number,
  graphByNamespace: ReadonlyMap<string, Graph>
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
  const edges: Edge[] = [];

  for (let segmentIndex = 0; segmentIndex + 1 < nodeRefs.length; segmentIndex++) {
    const source = snapshot.nodes[nodeRefs[segmentIndex]];
    const target = snapshot.nodes[nodeRefs[segmentIndex + 1]];
    const sourceGraph = graphByNamespace.get(source?.namespaceId ?? '');
    const targetGraph = graphByNamespace.get(target?.namespaceId ?? '');
    if (!sourceGraph || !targetGraph) {
      continue;
    }

    const segmentSuffix = segmentIndex ? `--${segmentIndex}` : '';
    const unitSuffix = unitOffset ? `--dup-${unitOffset}` : '';
    const edge = setEdge(sourceGraph, `${recordId}${unitSuffix}${segmentSuffix}`, source.id, target.id, targetGraph);
    if (!edge) {
      continue;
    }
    edge.setAttr(AttributeRegistry.EdgeDataIndex, {
      edgeId: recordId,
      dataRecord: {
        frameRefId: row.frameRefId,
        rowIndex: row.rowIndex,
      },
      arrowPlacement:
        nodeRefs.length === 2
          ? 'both'
          : segmentIndex === 0
            ? 'start'
            : segmentIndex === nodeRefs.length - 2
              ? 'end'
              : 'none',
    });
    edges.push(edge);
  }

  return edges;
}

export function buildGraphFromSnapshot(
  snapshot: GraphFrameSnapshot,
  options: GraphBuildOptions = {}
): GraphStageResult<GraphBuiltState> {
  const graph = new Graph(CMN_NAMESPACE);
  const graphByNamespace = new Map<string, Graph>([[CMN_NAMESPACE, graph]]);
  for (const namespaceId of snapshot.namespaces) {
    ensureNamespace(graph, graphByNamespace, namespaceId);
  }

  const positions = snapshot.positions.slice();
  const nodeByKey = new Map<string, Node>();
  const localNodeCounts = new Map<Graph, number>();
  const positionRanges: Array<{ namespaceId: string; start: number; end: number }> = [];
  let currentRange: { namespaceId: string; start: number; end: number } | undefined;

  snapshot.nodes.forEach((record) => {
    const { index } = record;
    const parent = ensureNamespace(graph, graphByNamespace, record.namespaceId);
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

  for (const [namespaceId, namespaceGraph] of graphByNamespace) {
    setGraphPositionRanges(
      namespaceGraph,
      positionRanges.filter((range) => range.namespaceId === namespaceId).map(({ start, end }) => [start, end])
    );
  }

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
          ? createUnitEdges(snapshot, recordRef, unitStart + unitOffset, unitOffset, graphByNamespace)
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

  const state: GraphBuiltState = Object.freeze({
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
