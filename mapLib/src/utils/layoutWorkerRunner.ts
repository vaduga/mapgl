import {
  Arrowhead,
  BezierSeg,
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
} from './layoutWorkerTypes';

const CURVE_TYPE_LINE = 0;
const CURVE_TYPE_BEZIER = 1;
const CURVE_TYPE_ARC = 2;
const SOURCE_ARROW_FLAG = 1;
const TARGET_ARROW_FLAG = 2;
const MAX_CURVE_RESOLUTION = 64;
const MIN_CURVE_RESOLUTION = 12;

type SnapshotNode = Node & { parent?: Graph; id: string; wasmId?: number };
type SnapshotEdge = CoreEdge & { id?: string };

export function configureLayout(rootGraph: GeomGraph, routing: LayoutRequest['routing']): void {
  const edgeRoutingMode = routing === 'Rectilinear' ? EdgeRoutingMode.Rectilinear : EdgeRoutingMode.SugiyamaSplines;

  const settings = new SugiyamaLayoutSettings();
  settings.layerDirection = LayerDirectionEnum.RL;
  settings.LayerSeparation = 60;
  settings.commonSettings.NodeSeparation = 40;
  settings.commonSettings.edgeRoutingSettings.EdgeRoutingMode = edgeRoutingMode;
  rootGraph.layoutSettings = settings;
}

export function getLayoutResult(request: LayoutRequest): LayoutResult {
  const graph = buildGraphFromSnapshot(request);
  const rootGraph = GeomGraph.getGeom(graph);

  configureLayout(rootGraph, request.routing);
  layoutGeomGraph(rootGraph);

  return extractLayoutResult(request.requestId, rootGraph, request.positionsLength, request.nodes, request.edges);
}

function buildGraphFromSnapshot(request: LayoutRequest): Graph {
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
  for (const item of request.nodes) {
    const parent = graphs.get(item.graphId);
    if (!parent) {
      continue;
    }
    const node = new Node(item.id) as SnapshotNode;
    node.wasmId = item.wasmId;
    parent.addNode(node);
    const geomNode = new GeomNode(node);
    geomNode.boundaryCurve = CurveFactory.mkCircle(item.radius ?? 12.5, new Point(0, 0));
    nodes.set(nodeKey(item.graphId, item.id), node);
  }

  for (const item of request.edges) {
    const source = nodes.get(nodeKey(item.sourceGraphId, item.sourceId));
    const target = nodes.get(nodeKey(item.targetGraphId, item.targetId));
    if (!source || !target) {
      continue;
    }
    const edge = new CoreEdge(source, target) as SnapshotEdge;
    edge.id = item.id;
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

function extractLayoutResult(
  requestId: number,
  rootGraph: GeomGraph,
  requestedPositionsLength: number,
  sourceNodes: LayoutNodeSnapshot[],
  sourceEdges: LayoutRequest['edges']
): LayoutResult {
  const maxWasmPositionsLength = sourceNodes.reduce((length, node) => Math.max(length, (node.wasmId + 1) * 2), 0);
  const positions = new Float64Array(Math.max(requestedPositionsLength, maxWasmPositionsLength));
  for (const geomNode of rootGraph.nodesBreadthFirst) {
    const node = geomNode.node as SnapshotNode;
    if (node.wasmId !== undefined) {
      positions[node.wasmId * 2] = geomNode.center.x;
      positions[node.wasmId * 2 + 1] = geomNode.center.y;
    }
  }

  return {
    requestId,
    graphs: extractGraphBounds(rootGraph),
    positions,
    arrows: extractArrowTips(rootGraph, sourceEdges),
    curveGroups: extractCurveGroups(rootGraph, sourceEdges),
  };
}

function extractArrowTips(rootGraph: GeomGraph, sourceEdges: LayoutRequest['edges']): LayoutArrowResult {
  const edgeIndexes = createEdgeIndexes(sourceEdges);
  const resultEdgeIndexes: number[] = [];
  const flags: number[] = [];
  const sourceTips: number[] = [];
  const targetTips: number[] = [];

  for (const geomEdge of rootGraph.deepEdges as Iterable<GeomEdge>) {
    const edge = geomEdge.edge as SnapshotEdge;
    if (!edge.id) {
      continue;
    }
    const edgeIndex = edgeIndexes.get(edgeKey((edge.source.parent as Graph)?.id, edge.id));
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

function extractGraphBounds(rootGraph: GeomGraph): LayoutGraphResult[] {
  const graph = rootGraph.graph as Graph;
  const graphs = [graph].concat(Array.from(graph.subgraphsBreadthFirst() as Iterable<Graph>));

  return graphs
    .map((graph) => {
      const box = GeomGraph.getGeom(graph)?.getPumpedGraphWithMarginsBox();
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

function extractCurveGroups(rootGraph: GeomGraph, sourceEdges: LayoutRequest['edges']): LayoutCurveGroup[] {
  const edgeIndexes = createEdgeIndexes(sourceEdges);

  const segmentsByEdge: Array<Array<{ type: number; controlPoints: number[]; segment: [number, number] }>> =
    sourceEdges.map(() => []);

  for (const geomEdge of rootGraph.deepEdges as Iterable<GeomEdge>) {
    const edge = geomEdge.edge as SnapshotEdge;
    if (!edge.id) {
      continue;
    }
    const edgeIndex = edgeIndexes.get(edgeKey((edge.source.parent as Graph)?.id, edge.id));
    if (edgeIndex === undefined) {
      continue;
    }
    addCurveSegments(segmentsByEdge[edgeIndex], geomEdge.curve);
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
  curve
): void {
  if (!curve) {
    return;
  }

  if (curve instanceof Curve) {
    for (const seg of curve.segs) {
      addCurveSegments(segments, seg);
    }
    return;
  }

  if (curve instanceof LineSegment) {
    pushSegment(
      segments,
      CURVE_TYPE_LINE,
      [...pointToArray(curve.start), ...pointToArray(curve.end), 0, 0, 0, 0],
      1
    );
    return;
  }

  if (curve instanceof BezierSeg) {
    const controlPoints = [0, 1, 2, 3].flatMap((i) => pointToArray(curve.B(i)));
    pushSegment(segments, CURVE_TYPE_BEZIER, controlPoints, curveResolution(curve));
    return;
  }

  if (curve instanceof Ellipse) {
    pushSegment(
      segments,
      CURVE_TYPE_ARC,
      [...pointToArray(curve.center), ...pointToArray(curve.aAxis), ...pointToArray(curve.bAxis), 0, 0],
      curveResolution(curve),
      [curve.parStart, curve.parEnd]
    );
    return;
  }

  if (curve instanceof Polyline) {
    const points = Array.from(curve).map(pointToArray);
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

function pointToArray(point): [number, number] {
  return [point.x, point.y];
}

function curveResolution(curve): number {
  if (curve instanceof LineSegment) {
    return 1;
  }

  const length = typeof curve.length === 'number' && Number.isFinite(curve.length) ? curve.length : 0;
  return Math.max(MIN_CURVE_RESOLUTION, Math.min(MAX_CURVE_RESOLUTION, Math.ceil(length / 20)));
}
