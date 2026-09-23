import {
  Arrowhead,
  BezierSeg,
  Curve,
  CurveFactory,
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
} from '@msagl/core';
import type {
  EdgeRoutingConfig,
  LayoutDirectionConfig,
  LayoutEdgeSnapshot,
  LayoutGraphResult,
  LayoutGraphSnapshot,
  LayoutNodeSnapshot,
  LayoutCurveGroup,
} from './layout-worker-types';
import { edgeKey, nodeKey } from './layout-worker-types';
export { edgeKey, nodeKey } from './layout-worker-types';
import { DEFAULT_LAYOUT_NODE_RADIUS } from './layout-geometry';

const CURVE_TYPE_LINE = 0;
const CURVE_TYPE_BEZIER = 1;
const CURVE_TYPE_ARC = 2;
const MAX_CURVE_RESOLUTION = 64;
const MIN_CURVE_RESOLUTION = 12;
const DEFAULT_LAYER_SEPARATION = 60;
const DEFAULT_NODE_SEPARATION = 40;

export type SnapshotNode = Node & { parent?: Graph; id: string; wasmId?: number; graphId?: string };
export type SnapshotEdge = CoreEdge & { id?: string; sourceGraphId?: string; targetGraphId?: string };
export type CurveSegment = { type: number; controlPoints: number[]; segment: [number, number] };

export type LayoutSettings = {
  routing: EdgeRoutingConfig;
  direction: LayoutDirectionConfig;
  layerSeparation: number;
  nodeSeparation: number;
};

export function getRoutingMode(routing: EdgeRoutingConfig): EdgeRoutingMode {
  return routing === 'Rectilinear' ? EdgeRoutingMode.Rectilinear : EdgeRoutingMode.SugiyamaSplines;
}

export function configureLayout(
  rootGraph: GeomGraph,
  settingsInput: LayoutSettings,
  routingMode: EdgeRoutingMode = getRoutingMode(settingsInput.routing)
): void {
  const settings = new SugiyamaLayoutSettings();
  settings.layerDirection = getLayerDirection(settingsInput.direction);
  settings.LayerSeparation = getPositiveNumber(settingsInput.layerSeparation, DEFAULT_LAYER_SEPARATION);
  settings.commonSettings.NodeSeparation = getPositiveNumber(settingsInput.nodeSeparation, DEFAULT_NODE_SEPARATION);
  settings.commonSettings.edgeRoutingSettings.EdgeRoutingMode = routingMode;
  rootGraph.layoutSettings = settings;
}

export function createGraphHierarchy(
  rootGraphId: string,
  snapshots: readonly LayoutGraphSnapshot[]
): {
  rootGraph: Graph;
  graphs: Map<string, Graph>;
} {
  const graphs = new Map<string, Graph>();
  const rootGraph = new Graph(rootGraphId);
  new GeomGraph(rootGraph);
  graphs.set(rootGraph.id, rootGraph);

  for (const item of snapshots) {
    if (item.id !== rootGraph.id && !graphs.has(item.id)) {
      graphs.set(item.id, new Graph(item.id));
    }
  }
  for (const item of snapshots) {
    if (item.id === rootGraph.id || !item.parentId) {
      continue;
    }
    const graph = graphs.get(item.id);
    const parent = graphs.get(item.parentId);
    if (graph && parent) {
      GeomGraph.getGeom(parent).addNode(new GeomGraph(graph));
    }
  }
  return { rootGraph, graphs };
}

export function addSnapshotNode(
  item: LayoutNodeSnapshot,
  parent: Graph,
  center: Point = new Point(0, 0),
  radius: number = item.radius ?? DEFAULT_LAYOUT_NODE_RADIUS
): SnapshotNode {
  const node = new Node(item.id) as SnapshotNode;
  node.wasmId = item.wasmId;
  node.graphId = item.graphId;
  parent.addNode(node);
  const geomNode = new GeomNode(node);
  geomNode.boundaryCurve = CurveFactory.mkCircle(radius, center);
  return node;
}

export function addSnapshotEdge(item: LayoutEdgeSnapshot, source: SnapshotNode, target: SnapshotNode): SnapshotEdge {
  const edge = new CoreEdge(source, target) as SnapshotEdge;
  edge.id = item.id;
  edge.sourceGraphId = item.sourceGraphId;
  edge.targetGraphId = item.targetGraphId;
  const geomEdge = new GeomEdge(edge);
  if (item.sourceArrowLength) {
    geomEdge.sourceArrowhead = Object.assign(new Arrowhead(), { length: item.sourceArrowLength });
  }
  if (item.targetArrowLength) {
    geomEdge.targetArrowhead = Object.assign(new Arrowhead(), { length: item.targetArrowLength });
  }
  return edge;
}

export function refreshGraphBoundsAfterLayout(rootGraph: GeomGraph): void {
  const graphs = [rootGraph, ...Array.from(rootGraph.subgraphs())];
  for (let index = graphs.length - 1; index >= 0; index--) {
    graphs[index].pumpTheBoxToTheGraphWithMargins();
  }
}

export function extractGraphBounds(rootGraph: GeomGraph): LayoutGraphResult[] {
  const graph = rootGraph.graph as Graph;
  const graphs = [graph].concat(Array.from(graph.subgraphsBreadthFirst() as Iterable<Graph>));
  return graphs
    .map((item) => {
      const box = GeomGraph.getGeom(item)?.boundingBox;
      if (!box) {
        return undefined;
      }
      return { id: item.id, minX: box.left_, minY: box.bottom_, maxX: box.right_, maxY: box.top_ };
    })
    .filter((box): box is LayoutGraphResult => !!box);
}

export function createEdgeIndexes(sourceEdges: readonly LayoutEdgeSnapshot[]): Map<string, number> {
  const indexes = new Map<string, number>();
  sourceEdges.forEach((edge, index) => indexes.set(edgeKey(edge.sourceGraphId, edge.id), index));
  return indexes;
}

export function createCurveGroups(
  sourceEdges: readonly LayoutEdgeSnapshot[],
  segmentsByEdge: readonly CurveSegment[][]
): LayoutCurveGroup[] {
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
    return { graphId, edgeIndexes: Int32Array.from(edgeIndexes), edgeSegmentOffsets, types, controlPoints, segments };
  });
}

export function addCurveSegments(segments: CurveSegment[], curve, originX = 0, originY = 0): void {
  if (!curve) {
    return;
  }
  if (curve instanceof Curve) {
    for (const segment of curve.segs) {
      addCurveSegments(segments, segment, originX, originY);
    }
    return;
  }
  if (curve instanceof LineSegment) {
    pushSegment(
      segments,
      CURVE_TYPE_LINE,
      [...pointToArray(curve.start, originX, originY), ...pointToArray(curve.end, originX, originY), 0, 0, 0, 0],
      1
    );
    return;
  }
  if (curve instanceof BezierSeg) {
    const controlPoints = [0, 1, 2, 3].flatMap((index) => pointToArray(curve.B(index), originX, originY));
    pushSegment(segments, CURVE_TYPE_BEZIER, controlPoints, curveResolution(curve));
    return;
  }
  if (curve instanceof Ellipse) {
    pushSegment(
      segments,
      CURVE_TYPE_ARC,
      [
        ...pointToArray(curve.center, originX, originY),
        ...pointToArray(curve.aAxis),
        ...pointToArray(curve.bAxis),
        0,
        0,
      ],
      curveResolution(curve),
      [curve.parStart, curve.parEnd]
    );
    return;
  }
  if (curve instanceof Polyline) {
    const points = Array.from(curve).map((point) => pointToArray(point, originX, originY));
    for (let index = 0; index < points.length - 1; index++) {
      pushSegment(segments, CURVE_TYPE_LINE, [...points[index], ...points[index + 1], 0, 0, 0, 0], 1);
    }
  }
}

function getLayerDirection(direction: LayoutDirectionConfig): LayerDirectionEnum {
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

function pushSegment(
  segments: CurveSegment[],
  type: number,
  controlPoints: number[],
  resolution: number,
  range: [number, number] = [0, 1]
): void {
  const res = Math.max(1, Math.ceil(resolution));
  const step = (range[1] - range[0]) / res;
  for (let index = 0; index < res; index++) {
    segments.push({ type, controlPoints, segment: [range[0] + step * index, step] });
  }
}

function pointToArray(point, originX = 0, originY = 0): [number, number] {
  return [point.x - originX, point.y - originY];
}

function curveResolution(curve): number {
  if (curve instanceof LineSegment) {
    return 1;
  }
  const length = typeof curve.length === 'number' && Number.isFinite(curve.length) ? curve.length : 0;
  return Math.max(MIN_CURVE_RESOLUTION, Math.min(MAX_CURVE_RESOLUTION, Math.ceil(length / 20)));
}
