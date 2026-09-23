import { EdgeRoutingMode, GeomEdge, GeomGraph, Graph, layoutGeomGraph } from '@msagl/core';
import type { LayoutArrowResult, LayoutNodeSnapshot, LayoutRequest, LayoutResult } from './layout-worker-types';
import { edgeKey, nodeKey } from './layout-worker-types';
import {
  addCurveSegments,
  addSnapshotEdge,
  addSnapshotNode,
  configureLayout,
  createCurveGroups,
  createEdgeIndexes,
  createGraphHierarchy,
  extractGraphBounds,
  getRoutingMode,
  refreshGraphBoundsAfterLayout,
  type CurveSegment,
  type SnapshotEdge,
  type SnapshotNode,
} from './layout-worker-helpers';

const SOURCE_ARROW_FLAG = 1;
const TARGET_ARROW_FLAG = 2;

export function getLayoutResult(request: LayoutRequest): LayoutResult {
  const layoutGraph = createIntegratedLayoutGraphWithFallback(request);
  const edgeIndexes = createEdgeIndexes(request.edges);
  const segmentsByEdge: CurveSegment[][] = request.edges.map(() => []);
  for (const geomEdge of layoutGraph.deepEdges as Iterable<GeomEdge>) {
    const edge = geomEdge.edge as SnapshotEdge;
    if (!edge.id) {
      continue;
    }
    const edgeIndex = edgeIndexes.get(edgeKey(edge.sourceGraphId, edge.id));
    if (edgeIndex !== undefined) {
      addCurveSegments(segmentsByEdge[edgeIndex], geomEdge.curve);
    }
  }
  return {
    requestId: request.requestId,
    graphs: extractGraphBounds(layoutGraph),
    positions: extractNodePositions(layoutGraph, request.positionsLength, request.nodes),
    arrows: extractArrowTips(layoutGraph, edgeIndexes),
    curveGroups: createCurveGroups(request.edges, segmentsByEdge),
  };
}

function createIntegratedLayoutGraphWithFallback(request: LayoutRequest): GeomGraph {
  let routingMode = getRoutingMode(request.routing);
  let rootGraph = createAndLayoutGraph(request, routingMode);
  if (!rootGraph && request.routing === 'Rectilinear') {
    routingMode = EdgeRoutingMode.SugiyamaSplines;
    rootGraph = createAndLayoutGraph(request, routingMode);
  }
  if (!rootGraph) {
    throw new Error('MSAGL graph layout failed');
  }
  return rootGraph;
}

function createAndLayoutGraph(request: LayoutRequest, routingMode: EdgeRoutingMode): GeomGraph | undefined {
  const graph = buildGraphFromSnapshot(request);
  const rootGraph = GeomGraph.getGeom(graph);
  configureLayout(rootGraph, request, routingMode);
  try {
    layoutGeomGraph(rootGraph);
    refreshGraphBoundsAfterLayout(rootGraph);
    return rootGraph;
  } catch (error) {
    if (routingMode !== EdgeRoutingMode.Rectilinear) {
      throw error;
    }
    return undefined;
  }
}

function buildGraphFromSnapshot(request: LayoutRequest): Graph {
  const { rootGraph, graphs } = createGraphHierarchy(request.rootGraphId, request.graphs);
  const nodes = new Map<string, SnapshotNode>();
  for (const item of request.nodes) {
    const parent = graphs.get(item.graphId);
    if (parent) {
      nodes.set(nodeKey(item.graphId, item.id), addSnapshotNode(item, parent));
    }
  }
  for (const item of request.edges) {
    const source = nodes.get(nodeKey(item.sourceGraphId, item.sourceId));
    const target = nodes.get(nodeKey(item.targetGraphId, item.targetId));
    if (source && target && source !== target) {
      addSnapshotEdge(item, source, target);
    }
  }
  return rootGraph;
}

function extractNodePositions(
  rootGraph: GeomGraph,
  requestedPositionsLength: number,
  sourceNodes: LayoutNodeSnapshot[]
): Float64Array {
  const maxWasmPositionsLength = sourceNodes.reduce((length, node) => Math.max(length, (node.wasmId + 1) * 2), 0);
  const positions = new Float64Array(Math.max(requestedPositionsLength, maxWasmPositionsLength));
  for (const geomNode of rootGraph.nodesBreadthFirst) {
    const node = geomNode.node as SnapshotNode;
    if (node.wasmId !== undefined) {
      positions[node.wasmId * 2] = geomNode.center.x;
      positions[node.wasmId * 2 + 1] = geomNode.center.y;
    }
  }
  return positions;
}

function extractArrowTips(rootGraph: GeomGraph, edgeIndexes: ReadonlyMap<string, number>): LayoutArrowResult {
  const resultEdgeIndexes: number[] = [];
  const flags: number[] = [];
  const sourceTips: number[] = [];
  const targetTips: number[] = [];
  for (const geomEdge of rootGraph.deepEdges as Iterable<GeomEdge>) {
    const edge = geomEdge.edge as SnapshotEdge;
    if (!edge.id) {
      continue;
    }
    const edgeIndex = edgeIndexes.get(edgeKey(edge.sourceGraphId, edge.id));
    if (edgeIndex === undefined) {
      continue;
    }
    const sourceTip = geomEdge.sourceArrowhead?.tipPosition;
    const targetTip = geomEdge.targetArrowhead?.tipPosition;
    let flag = 0;
    if (sourceTip) {
      flag |= SOURCE_ARROW_FLAG;
    }
    if (targetTip) {
      flag |= TARGET_ARROW_FLAG;
    }
    resultEdgeIndexes.push(edgeIndex);
    flags.push(flag);
    sourceTips.push(sourceTip?.x ?? 0, sourceTip?.y ?? 0);
    targetTips.push(targetTip?.x ?? 0, targetTip?.y ?? 0);
  }
  return {
    edgeIndexes: Int32Array.from(resultEdgeIndexes),
    flags: Uint8Array.from(flags),
    sourceTips: Float64Array.from(sourceTips),
    targetTips: Float64Array.from(targetTips),
  };
}
