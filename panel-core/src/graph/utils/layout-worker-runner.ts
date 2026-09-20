import {
  Arrowhead,
  BezierSeg,
  CancelToken,
  CurveFactory,
  Curve,
  Edge as CoreEdge,
  EdgeRoutingMode,
  Ellipse,
  GeomEdge,
  GeomGraph,
  GeomNode,
  Graph,
  LayerDirectionEnum,
  LineSegment,
  Node,
  Point,
  Polyline,
  SugiyamaLayoutSettings,
  layoutGeomGraph,
  routeEdges,
} from '@msagl/core';
import {
  LayoutArrowResult,
  LayoutCurveGroup,
  LayoutGraphResult,
  LayoutNodeSnapshot,
  LayoutRequest,
  LayoutResult,
  edgeKey,
  nodeKey,
} from './layout-worker-types';
import { DEFAULT_LAYOUT_NODE_RADIUS } from './layout-geometry';

const CURVE_TYPE_LINE = 0;
const CURVE_TYPE_BEZIER = 1;
const CURVE_TYPE_ARC = 2;
const SOURCE_ARROW_FLAG = 1;
const TARGET_ARROW_FLAG = 2;
const MAX_CURVE_RESOLUTION = 64;
const MIN_CURVE_RESOLUTION = 12;
const DEFAULT_LAYER_SEPARATION = 60;
const DEFAULT_NODE_SEPARATION = 40;
const CONTRACTED_NODE_RADIUS = 0.01;

type SnapshotNode = Node & { parent?: Graph; id: string; wasmId?: number; graphId?: string };
type SnapshotEdge = CoreEdge & {
  id?: string;
  sourceGraphId?: string;
  targetGraphId?: string;
  sourceWasmId?: number;
  targetWasmId?: number;
  sourceContracted?: boolean;
  targetContracted?: boolean;
};

type LayoutGeometryContext = {
  readonly graphShifts: ReadonlyMap<string, readonly [number, number]>;
  readonly positions?: Float64Array;
  readonly contractedNodeWasmIds: ReadonlySet<number>;
};

type ShiftVector = readonly [number, number];

type ShiftedLayoutResult = {
  readonly graph: GeomGraph;
  readonly positions: Float64Array;
  readonly graphBounds: LayoutGraphResult[];
};

export function configureLayout(
  rootGraph: GeomGraph,
  request: LayoutRequest,
  routingMode: EdgeRoutingMode = getRoutingMode(request.routing)
): void {
  const settings = new SugiyamaLayoutSettings();
  settings.layerDirection = getLayerDirection(request.direction);
  settings.LayerSeparation = getPositiveNumber(request.layerSeparation, DEFAULT_LAYER_SEPARATION);
  settings.commonSettings.NodeSeparation = getPositiveNumber(request.nodeSeparation, DEFAULT_NODE_SEPARATION);
  settings.commonSettings.edgeRoutingSettings.EdgeRoutingMode = routingMode;
  rootGraph.layoutSettings = settings;
}

export function getLayoutResult(request: LayoutRequest): LayoutResult {
  const geometry = createGeometryContext(request);

  if (request.operation === 'reroute') {
    const reroutedGraph = createRoutedGraphWithFallback(request, geometry);
    return extractLayoutResult(request, request.positions, extractGraphBounds(reroutedGraph), reroutedGraph, geometry);
  }

  if (!hasEffectiveGraphShift(request)) {
    const layoutGraph = createIntegratedLayoutGraphWithFallback(request, geometry);
    return extractLayoutResult(
      request,
      extractNodePositions(layoutGraph, request.positionsLength, request.nodes),
      extractGraphBounds(layoutGraph),
      layoutGraph,
      geometry
    );
  }

  const shiftedLayout = createShiftedLayoutWithFallback(request, geometry);
  return extractLayoutResult(
    request,
    shiftedLayout.positions,
    shiftedLayout.graphBounds,
    shiftedLayout.graph,
    geometry
  );
}

function createGeometryContext(request: LayoutRequest): LayoutGeometryContext {
  return {
    graphShifts: new Map(request.graphs.map((graph) => [graph.id, [graph.shiftX ?? 0, graph.shiftY ?? 0] as const])),
    positions: request.operation === 'reroute' ? request.positions : undefined,
    contractedNodeWasmIds: request.operation === 'reroute' ? new Set(request.contractedNodeWasmIds) : new Set<number>(),
  };
}

export function hasEffectiveGraphShift(request: LayoutRequest): boolean {
  return request.graphs.some((graph) => Boolean(graph.shiftX || graph.shiftY));
}

function createIntegratedLayoutGraphWithFallback(request: LayoutRequest, geometry: LayoutGeometryContext): GeomGraph {
  let routingMode = getRoutingMode(request.routing);
  let rootGraph = createAndLayoutGraph(request, geometry, routingMode);
  if (!rootGraph && request.routing === 'Rectilinear') {
    routingMode = EdgeRoutingMode.SugiyamaSplines;
    rootGraph = createAndLayoutGraph(request, geometry, routingMode);
  }
  if (!rootGraph) {
    throw new Error('MSAGL graph layout failed');
  }
  return rootGraph;
}

function createAndLayoutGraph(
  request: LayoutRequest,
  geometry: LayoutGeometryContext,
  routingMode: EdgeRoutingMode
): GeomGraph | undefined {
  const graph = buildGraphFromSnapshot(request, geometry, false);
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

function createRoutedGraphWithFallback(request: LayoutRequest, geometry: LayoutGeometryContext): GeomGraph {
  let rootGraph = createAndRerouteGraph(request, geometry, getRoutingMode(request.routing));
  if (!rootGraph && request.routing === 'Rectilinear') {
    rootGraph = createAndRerouteGraph(request, geometry, EdgeRoutingMode.SugiyamaSplines);
  }
  if (!rootGraph) {
    throw new Error('MSAGL graph routing failed');
  }
  return rootGraph;
}

function createShiftedLayoutWithFallback(request: LayoutRequest, geometry: LayoutGeometryContext): ShiftedLayoutResult {
  let result = createAndRouteShiftedLayout(request, geometry, getRoutingMode(request.routing));
  if (!result && request.routing === 'Rectilinear') {
    result = createAndRouteShiftedLayout(request, geometry, EdgeRoutingMode.SugiyamaSplines);
  }
  if (!result) {
    throw new Error('MSAGL graph routing failed');
  }
  return result;
}

function createAndRouteShiftedLayout(
  request: LayoutRequest,
  geometry: LayoutGeometryContext,
  routingMode: EdgeRoutingMode
): ShiftedLayoutResult | undefined {
  const rootGraph = createAndLayoutGraph(request, geometry, routingMode);
  if (!rootGraph) {
    return undefined;
  }

  const positions = extractNodePositions(rootGraph, request.positionsLength, request.nodes);
  const graphBounds = extractGraphBounds(rootGraph);
  applyNodePositions(rootGraph, positions, geometry.graphShifts);
  refreshGraphBoundsAfterLayout(rootGraph);

  const edgesToRoute = selectInterNamespaceEdges(rootGraph);
  translatePreservedEdges(rootGraph, geometry.graphShifts, new Set(edgesToRoute));

  if (!routeEdgeSubset(rootGraph, edgesToRoute, routingMode)) {
    return undefined;
  }
  return { graph: rootGraph, positions, graphBounds };
}

function createAndRerouteGraph(
  request: LayoutRequest,
  geometry: LayoutGeometryContext,
  routingMode: EdgeRoutingMode
): GeomGraph | undefined {
  const graph = buildGraphFromSnapshot(request, geometry, request.operation === 'reroute');
  const rootGraph = GeomGraph.getGeom(graph);
  return routeGraph(rootGraph, request, routingMode) ? rootGraph : undefined;
}

function routeGraph(rootGraph: GeomGraph, request: LayoutRequest, routingMode: EdgeRoutingMode): boolean {
  configureLayout(rootGraph, request, routingMode);
  refreshGraphBoundsAfterLayout(rootGraph);
  try {
    routeEdges(rootGraph, Array.from(rootGraph.deepEdges as Iterable<GeomEdge>), new CancelToken());
    return true;
  } catch (error) {
    if (routingMode !== EdgeRoutingMode.Rectilinear) {
      throw error;
    }
    return false;
  }
}

function routeEdgeSubset(rootGraph: GeomGraph, edgesToRoute: GeomEdge[], routingMode: EdgeRoutingMode): boolean {
  if (!edgesToRoute.length) {
    return true;
  }
  try {
    routeEdges(rootGraph, edgesToRoute, new CancelToken());
    return true;
  } catch (error) {
    if (routingMode !== EdgeRoutingMode.Rectilinear) {
      throw error;
    }
    return false;
  }
}

function selectInterNamespaceEdges(rootGraph: GeomGraph): GeomEdge[] {
  const interNamespaceEdges: GeomEdge[] = [];
  for (const geomEdge of rootGraph.deepEdges as Iterable<GeomEdge>) {
    const edge = geomEdge.edge as SnapshotEdge;
    if (edge.sourceGraphId !== edge.targetGraphId) {
      interNamespaceEdges.push(geomEdge);
    }
  }
  return interNamespaceEdges;
}

function translatePreservedEdges(
  rootGraph: GeomGraph,
  graphShifts: ReadonlyMap<string, ShiftVector>,
  edgesToRoute: ReadonlySet<GeomEdge>
): void {
  for (const geomEdge of rootGraph.deepEdges as Iterable<GeomEdge>) {
    if (edgesToRoute.has(geomEdge)) {
      continue;
    }
    const edge = geomEdge.edge as SnapshotEdge;
    const [shiftX, shiftY] = getGraphShift(graphShifts, edge.sourceGraphId);
    geomEdge.translate(new Point(shiftX, shiftY));
  }
}

function getGraphShift(graphShifts: ReadonlyMap<string, ShiftVector>, graphId?: string): ShiftVector {
  return (graphId && graphShifts.get(graphId)) || [0, 0];
}

/**
 * Recalculate nested graph bounds from the geometry left by the completed
 * layout. MSAGL includes a child graph's existing bounding box while pumping
 * its parent, so stale child bounds can otherwise survive alongside the final
 * node positions and leave empty space in the reported boundary.
 */
export function refreshGraphBoundsAfterLayout(rootGraph: GeomGraph): void {
  const graphs = [rootGraph, ...Array.from(rootGraph.subgraphs())];
  for (let index = graphs.length - 1; index >= 0; index--) {
    graphs[index].pumpTheBoxToTheGraphWithMargins();
  }
}

function buildGraphFromSnapshot(
  request: LayoutRequest,
  geometry: LayoutGeometryContext,
  collapseContractedNodes: boolean
): Graph {
  const graphs = new Map<string, Graph>();
  const rootGraph = new Graph(request.rootGraphId);
  new GeomGraph(rootGraph);
  graphs.set(rootGraph.id, rootGraph);

  for (const item of request.graphs) {
    if (item.id === rootGraph.id || graphs.has(item.id)) {
      continue;
    }
    graphs.set(item.id, new Graph(item.id));
  }

  for (const item of request.graphs) {
    if (item.id === rootGraph.id || !item.parentId) {
      continue;
    }
    const graph = graphs.get(item.id);
    const parent = graphs.get(item.parentId);
    if (graph && parent) {
      GeomGraph.getGeom(parent).addNode(new GeomGraph(graph));
    }
  }

  const nodes = new Map<string, SnapshotNode>();
  const contractedNodes = new Map<string, SnapshotNode>();
  const nodeWasmIds = new Map(request.nodes.map((node) => [nodeKey(node.graphId, node.id), node.wasmId]));
  for (const item of request.nodes) {
    const parent = graphs.get(item.graphId);
    if (!parent) {
      continue;
    }
    const contracted = collapseContractedNodes && geometry.contractedNodeWasmIds.has(item.wasmId);
    const existingContractedNode = contracted ? contractedNodes.get(item.graphId) : undefined;
    if (existingContractedNode) {
      nodes.set(nodeKey(item.graphId, item.id), existingContractedNode);
      continue;
    }
    const node = new Node(item.id) as SnapshotNode;
    node.wasmId = item.wasmId;
    node.graphId = item.graphId;
    parent.addNode(node);
    const geomNode = new GeomNode(node);
    const center = getPosition(item.wasmId, item.graphId, geometry);
    geomNode.boundaryCurve = CurveFactory.mkCircle(
      contracted ? CONTRACTED_NODE_RADIUS : (item.radius ?? DEFAULT_LAYOUT_NODE_RADIUS),
      center ?? new Point(0, 0)
    );
    nodes.set(nodeKey(item.graphId, item.id), node);
    if (contracted) {
      contractedNodes.set(item.graphId, node);
    }
  }

  for (const item of request.edges) {
    const source = nodes.get(nodeKey(item.sourceGraphId, item.sourceId));
    const target = nodes.get(nodeKey(item.targetGraphId, item.targetId));
    if (!source || !target || source === target) {
      continue;
    }
    const edge = new CoreEdge(source, target) as SnapshotEdge;
    edge.id = item.id;
    edge.sourceGraphId = item.sourceGraphId;
    edge.targetGraphId = item.targetGraphId;
    edge.sourceWasmId = nodeWasmIds.get(nodeKey(item.sourceGraphId, item.sourceId));
    edge.targetWasmId = nodeWasmIds.get(nodeKey(item.targetGraphId, item.targetId));
    edge.sourceContracted = edge.sourceWasmId !== undefined && geometry.contractedNodeWasmIds.has(edge.sourceWasmId);
    edge.targetContracted = edge.targetWasmId !== undefined && geometry.contractedNodeWasmIds.has(edge.targetWasmId);
    const geomEdge = new GeomEdge(edge);
    if (item.sourceArrowLength) {
      geomEdge.sourceArrowhead = Object.assign(new Arrowhead(), { length: item.sourceArrowLength });
    }
    if (item.targetArrowLength) {
      geomEdge.targetArrowhead = Object.assign(new Arrowhead(), { length: item.targetArrowLength });
    }
  }

  return rootGraph;
}

function getPosition(wasmId: number, graphId: string, geometry: LayoutGeometryContext): Point | undefined {
  if (!geometry.positions) {
    return undefined;
  }
  const offset = wasmId * 2;
  const [shiftX, shiftY] = geometry.graphShifts.get(graphId) ?? [0, 0];
  return new Point(geometry.positions[offset] + shiftX, geometry.positions[offset + 1] + shiftY);
}

function applyNodePositions(
  rootGraph: GeomGraph,
  positions: Float64Array,
  graphShifts: ReadonlyMap<string, readonly [number, number]>
): void {
  for (const geomNode of rootGraph.nodesBreadthFirst) {
    if (geomNode instanceof GeomGraph) {
      continue;
    }
    const node = geomNode.node as SnapshotNode;
    if (node.wasmId === undefined || !node.graphId) {
      continue;
    }
    const offset = node.wasmId * 2;
    const [shiftX, shiftY] = graphShifts.get(node.graphId) ?? [0, 0];
    geomNode.center = new Point(positions[offset] + shiftX, positions[offset + 1] + shiftY);
  }
}

function getLayerDirection(direction: LayoutRequest['direction']): LayerDirectionEnum {
  switch (direction) {
    case 'TB':
      return LayerDirectionEnum.TB;
    case 'LR':
      return LayerDirectionEnum.LR;
    case 'BT':
      return LayerDirectionEnum.BT;
    case 'RL':
    default:
      return LayerDirectionEnum.RL;
  }
}

function getPositiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function getRoutingMode(routing: LayoutRequest['routing']): EdgeRoutingMode {
  return routing === 'Rectilinear' ? EdgeRoutingMode.Rectilinear : EdgeRoutingMode.SugiyamaSplines;
}

function extractLayoutResult(
  request: LayoutRequest,
  positions: Float64Array,
  graphs: LayoutGraphResult[],
  routedGraph: GeomGraph,
  geometry: LayoutGeometryContext
): LayoutResult {
  const edgeIndexes = createEdgeIndexes(request.edges);

  return {
    requestId: request.requestId,
    graphs,
    positions,
    arrows: extractArrowTips(routedGraph, request.edges, edgeIndexes, geometry),
    curveGroups: extractCurveGroups(routedGraph, request.edges, edgeIndexes, geometry),
  };
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

function extractArrowTips(
  rootGraph: GeomGraph,
  sourceEdges: LayoutRequest['edges'],
  edgeIndexes: ReadonlyMap<string, number>,
  geometry: LayoutGeometryContext
): LayoutArrowResult {
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

    const sourceEdge = sourceEdges[edgeIndex];
    const routedSourceTip = geomEdge.sourceArrowhead?.tipPosition;
    const routedTargetTip = geomEdge.targetArrowhead?.tipPosition;
    const sourceTip = edge.sourceContracted
      ? getPosition(edge.sourceWasmId!, edge.sourceGraphId!, geometry)
      : routedSourceTip;
    const targetTip = edge.targetContracted
      ? getPosition(edge.targetWasmId!, edge.targetGraphId!, geometry)
      : routedTargetTip;
    let flag = 0;
    if (sourceTip) {
      flag |= SOURCE_ARROW_FLAG;
    }
    if (targetTip) {
      flag |= TARGET_ARROW_FLAG;
    }
    const [shiftX, shiftY] = geometry.graphShifts.get(sourceEdge.sourceGraphId) ?? [0, 0];

    resultEdgeIndexes.push(edgeIndex);
    flags.push(flag);
    sourceTips.push(sourceTip ? sourceTip.x - shiftX : 0, sourceTip ? sourceTip.y - shiftY : 0);
    targetTips.push(targetTip ? targetTip.x - shiftX : 0, targetTip ? targetTip.y - shiftY : 0);
  }

  return {
    edgeIndexes: Int32Array.from(resultEdgeIndexes),
    flags: Uint8Array.from(flags),
    sourceTips: Float64Array.from(sourceTips),
    targetTips: Float64Array.from(targetTips),
  };
}

function extractGraphBounds(rootGraph: GeomGraph): LayoutGraphResult[] {
  const graph = rootGraph.graph as Graph;
  const graphs = [graph].concat(Array.from(graph.subgraphsBreadthFirst() as Iterable<Graph>));

  return graphs
    .map((graph) => {
      const box = GeomGraph.getGeom(graph)?.boundingBox;
      if (!box) {
        return undefined;
      }
      return {
        id: graph.id,
        minX: box.left_,
        minY: box.bottom_,
        maxX: box.right_,
        maxY: box.top_,
      };
    })
    .filter((box): box is LayoutGraphResult => !!box);
}

function extractCurveGroups(
  rootGraph: GeomGraph,
  sourceEdges: LayoutRequest['edges'],
  edgeIndexes: ReadonlyMap<string, number>,
  geometry: LayoutGeometryContext
): LayoutCurveGroup[] {
  const segmentsByEdge: Array<Array<{ type: number; controlPoints: number[]; segment: [number, number] }>> =
    sourceEdges.map(() => []);

  for (const geomEdge of rootGraph.deepEdges as Iterable<GeomEdge>) {
    const edge = geomEdge.edge as SnapshotEdge;
    if (!edge.id) {
      continue;
    }
    const edgeIndex = edgeIndexes.get(edgeKey(edge.sourceGraphId, edge.id));
    if (edgeIndex === undefined) {
      continue;
    }
    const sourceEdge = sourceEdges[edgeIndex];
    const [shiftX, shiftY] = geometry.graphShifts.get(sourceEdge.sourceGraphId) ?? [0, 0];
    const curve = geomEdge.curve;
    if (curve && edge.sourceContracted) {
      const sourceCenter = getPosition(edge.sourceWasmId!, edge.sourceGraphId!, geometry);
      const sourceTip = geomEdge.sourceArrowhead?.tipPosition;
      if (sourceCenter) {
        const sourceBase = sourceTip ? curve.start.add(sourceCenter.sub(sourceTip)) : sourceCenter;
        addCurveSegments(segmentsByEdge[edgeIndex], LineSegment.mkPP(sourceBase, curve.start), shiftX, shiftY);
      }
    }
    addCurveSegments(segmentsByEdge[edgeIndex], curve, shiftX, shiftY);
    if (curve && edge.targetContracted) {
      const targetCenter = getPosition(edge.targetWasmId!, edge.targetGraphId!, geometry);
      const targetTip = geomEdge.targetArrowhead?.tipPosition;
      if (targetCenter) {
        const targetBase = targetTip ? curve.end.add(targetCenter.sub(targetTip)) : targetCenter;
        addCurveSegments(segmentsByEdge[edgeIndex], LineSegment.mkPP(curve.end, targetBase), shiftX, shiftY);
      }
    }
  }

  const edgeIndexesByGraph = new Map<string, number[]>();
  sourceEdges.forEach((edge, index) => {
    if (!segmentsByEdge[index].length) {
      return;
    }
    const indexes = edgeIndexesByGraph.get(edge.sourceGraphId) ?? [];
    indexes.push(index);
    edgeIndexesByGraph.set(edge.sourceGraphId, indexes);
  });

  return Array.from(edgeIndexesByGraph, ([graphId, edgeIndexes]) => {
    const edgeSegmentOffsets = new Int32Array(edgeIndexes.length + 1);
    let segmentCount = 0;
    edgeIndexes.forEach((edgeIndex, localIndex) => {
      edgeSegmentOffsets[localIndex] = segmentCount;
      segmentCount += segmentsByEdge[edgeIndex].length;
    });
    edgeSegmentOffsets[edgeIndexes.length] = segmentCount;

    const types = new Uint8Array(segmentCount);
    const controlPoints = new Float32Array(segmentCount * 8);
    const segments = new Float32Array(segmentCount * 2);

    let segmentIndex = 0;
    for (const edgeIndex of edgeIndexes) {
      for (const segment of segmentsByEdge[edgeIndex]) {
        types[segmentIndex] = segment.type;
        controlPoints.set(segment.controlPoints, segmentIndex * 8);
        segments.set(segment.segment, segmentIndex * 2);
        segmentIndex++;
      }
    }

    return {
      graphId,
      edgeIndexes: Int32Array.from(edgeIndexes),
      edgeSegmentOffsets,
      types,
      controlPoints,
      segments,
    };
  });
}

function createEdgeIndexes(sourceEdges: LayoutRequest['edges']): Map<string, number> {
  const edgeIndexes = new Map<string, number>();
  sourceEdges.forEach((edge, index) => {
    edgeIndexes.set(edgeKey(edge.sourceGraphId, edge.id), index);
  });
  return edgeIndexes;
}

function addCurveSegments(
  segments: Array<{ type: number; controlPoints: number[]; segment: [number, number] }>,
  curve,
  shiftX = 0,
  shiftY = 0
): void {
  if (!curve) {
    return;
  }

  if (curve instanceof Curve) {
    for (const seg of curve.segs) {
      addCurveSegments(segments, seg, shiftX, shiftY);
    }
    return;
  }

  if (curve instanceof LineSegment) {
    pushSegment(
      segments,
      CURVE_TYPE_LINE,
      [...pointToArray(curve.start, shiftX, shiftY), ...pointToArray(curve.end, shiftX, shiftY), 0, 0, 0, 0],
      1
    );
    return;
  }

  if (curve instanceof BezierSeg) {
    const controlPoints = [0, 1, 2, 3].flatMap((i) => pointToArray(curve.B(i), shiftX, shiftY));
    pushSegment(segments, CURVE_TYPE_BEZIER, controlPoints, curveResolution(curve));
    return;
  }

  if (curve instanceof Ellipse) {
    pushSegment(
      segments,
      CURVE_TYPE_ARC,
      [...pointToArray(curve.center, shiftX, shiftY), ...pointToArray(curve.aAxis), ...pointToArray(curve.bAxis), 0, 0],
      curveResolution(curve),
      [curve.parStart, curve.parEnd]
    );
    return;
  }

  if (curve instanceof Polyline) {
    const points = Array.from(curve).map((point) => pointToArray(point, shiftX, shiftY));
    for (let i = 0; i < points.length - 1; i++) {
      pushSegment(segments, CURVE_TYPE_LINE, [...points[i], ...points[i + 1], 0, 0, 0, 0], 1);
    }
  }
}

function pushSegment(
  segments: Array<{ type: number; controlPoints: number[]; segment: [number, number] }>,
  type: number,
  controlPoints: number[],
  resolution: number,
  range: [number, number] = [0, 1]
): void {
  const res = Math.max(1, Math.ceil(resolution));
  const step = (range[1] - range[0]) / res;

  for (let i = 0; i < res; i++) {
    segments.push({
      type,
      controlPoints,
      segment: [range[0] + step * i, step],
    });
  }
}

function pointToArray(point, shiftX = 0, shiftY = 0): [number, number] {
  return [point.x - shiftX, point.y - shiftY];
}

function curveResolution(curve): number {
  if (curve instanceof LineSegment) {
    return 1;
  }

  const length = typeof curve.length === 'number' && Number.isFinite(curve.length) ? curve.length : 0;
  return Math.max(MIN_CURVE_RESOLUTION, Math.min(MAX_CURVE_RESOLUTION, Math.ceil(length / 20)));
}
