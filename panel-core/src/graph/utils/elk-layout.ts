import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkExtendedEdge, ElkNode, ElkPoint } from 'elkjs/lib/elk-api';
import { roundedPolyline } from './rounded-polyline';
import { NS_PADDING } from '../../types/defaults';
import { DEFAULT_LAYOUT_NODE_RADIUS } from './layout-geometry';
import { createCurveGroups, curveResolutionForLength, pushCurveSegments, type CurveSegment } from './layout-result';
import {
  nodeKey,
  type LayoutArrowResult,
  type LayoutGraphResult,
  type LayoutRequest,
  type LayoutResult,
} from './layout-worker-types';

// ELK layered with INCLUDE_CHILDREN lays out the whole graph at once, so nodes inside a namespace box
// take part in the left-to-right flow instead of being packed as separate components (MSAGL).
// ELK and mapgl's graph view both have y pointing down, so coordinates pass through unchanged.

const BOX_TITLE = 22; // room above a box's nodes for its title
const BEZIER = 1;
const MAX_CORNER_RADIUS = 8;
const SOURCE_ARROW_FLAG = 1;
const TARGET_ARROW_FLAG = 2;

const DIRECTION: Record<LayoutRequest['direction'], string> = { LR: 'RIGHT', RL: 'LEFT', TB: 'DOWN', BT: 'UP' };

type Point = { x: number; y: number };
type Box = { x: number; y: number; width: number; height: number };

let elk: InstanceType<typeof ELK> | undefined;

export async function getElkLayoutResult(request: LayoutRequest): Promise<LayoutResult> {
  elk ??= createElk();
  if (request.compoundPorts?.size) {
    const laid = await elk.layout(buildElkGraph(request, true));
    return { ...toLayoutResult(request, laid, true), nativeNamespacePorts: true };
  }
  const laid = await elk.layout(buildElkGraph(request));
  return toLayoutResult(request, laid);
}

/**
 * elk.bundled.js loads its layout code inside `new ELK()`. With no `document` but a `self` (a web worker,
 * like mapgl's layout worker) that code takes over self.onmessage instead of running in this thread,
 * and layout() never resolves. A stub `document` while it loads keeps it in-thread.
 */
function createElk(): InstanceType<typeof ELK> {
  const scope = globalThis as { document?: unknown };
  const stub = typeof scope.document === 'undefined';
  if (stub) {
    scope.document = {};
  }
  try {
    return new ELK();
  } finally {
    if (stub) {
      delete scope.document;
    }
  }
}

export function buildElkGraph(request: LayoutRequest, nativePorts = false): ElkNode {
  const edgeRouting = request.routing === 'Rectilinear' ? 'ORTHOGONAL' : 'SPLINES';
  const padding = `[top=${NS_PADDING + BOX_TITLE},left=${NS_PADDING},bottom=${NS_PADDING},right=${NS_PADDING}]`;
  const spacing = {
    'elk.layered.spacing.nodeNodeBetweenLayers': String(request.layerSeparation),
    'elk.spacing.nodeNode': String(request.nodeSeparation),
  };
  const root: ElkNode = {
    id: graphElkId(request.rootGraphId),
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': DIRECTION[request.direction] ?? 'RIGHT',
      'elk.hierarchyHandling': nativePorts ? 'SEPARATE_CHILDREN' : 'INCLUDE_CHILDREN',
      ...(nativePorts && { 'elk.json.edgeCoords': 'ROOT' }),
      'elk.edgeRouting': edgeRouting,
      ...spacing,
      'elk.spacing.componentComponent': String(request.nodeSeparation),
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      // A hub with many callers would put them all in one column, far taller than the panel is wide:
      // cap a column's height so they spread over a few columns.
      'elk.layered.layering.strategy': 'COFFMAN_GRAHAM',
      'elk.layered.layering.coffmanGraham.layerBound': String(layerBound(request.nodes.length)),
      // Network simplex becomes very expensive with the dummy nodes introduced by bounded layers.
      // Brandes-Köpf keeps the global namespace flow without that optimization cost.
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
    },
    children: [],
    edges: [],
  };
  const graphs = new Map<string, ElkNode>([[request.rootGraphId, root]]);
  for (const graph of request.graphs) {
    if (graph.id === request.rootGraphId || !graph.parentId) {
      continue;
    }
    // Spacing is read per box, not inherited from the root.
    const box: ElkNode = {
      id: graphElkId(graph.id),
      layoutOptions: { 'elk.padding': padding, 'elk.edgeRouting': edgeRouting, ...spacing },
      children: [],
    };
    graphs.set(graph.id, box);
  }
  // Parents may come after children in the snapshot: attach once all boxes exist.
  for (const graph of request.graphs) {
    const box = graphs.get(graph.id);
    const parent = graph.parentId ? graphs.get(graph.parentId) : undefined;
    if (box && parent && box !== root) {
      parent.children!.push(box);
    }
  }
  for (const node of request.nodes) {
    const parent = graphs.get(node.graphId);
    if (!parent) {
      continue;
    }
    const side = nativePorts && request.compoundPorts?.get(nodeKey(node.graphId, node.id));
    if (side && parent !== root) {
      const id = nodeElkId(node.graphId, node.id);
      // ELK determines the ratio from the input dimensions, then applies it to the final box.
      parent.width = 100;
      parent.height = 100;
      parent.layoutOptions!['elk.portConstraints'] = 'FIXED_RATIO';
      (parent.ports ??= []).push({
        id,
        width: 0,
        height: 0,
        x: side === 'EAST' ? 100 : side === 'WEST' ? 0 : 50,
        y: side === 'SOUTH' ? 100 : side === 'NORTH' ? 0 : 50,
        layoutOptions: { 'elk.port.side': side },
      });
      continue;
    }
    const size = (node.radius ?? DEFAULT_LAYOUT_NODE_RADIUS) * 2;
    if (request.cards && node.width && node.height) {
      parent.children!.push({ id: nodeElkId(node.graphId, node.id), width: node.width, height: node.height });
      continue;
    }
    // The label box (layout-geometry getLayoutNodeBox) is centred on the node; the label itself sits below it.
    const label =
      node.width && node.height ? [{ text: ' ', width: node.width, height: (node.height - size) / 2 }] : undefined;
    parent.children!.push({
      id: nodeElkId(node.graphId, node.id),
      width: size,
      height: size,
      labels: label,
      layoutOptions: { 'elk.nodeLabels.placement': 'OUTSIDE V_BOTTOM H_CENTER' },
    });
  }
  const known = new Set(request.nodes.map((node) => nodeElkId(node.graphId, node.id)));
  const parents = new Map(nativePorts ? request.graphs.map((graph) => [graph.id, graph.parentId]) : []);
  request.edges.forEach((edge, index) => {
    const source = nodeElkId(edge.sourceGraphId, edge.sourceId);
    const target = nodeElkId(edge.targetGraphId, edge.targetId);
    if (source !== target && known.has(source) && known.has(target)) {
      const ownerId = edge.sourceGraphId === edge.targetGraphId ? edge.sourceGraphId : parents.get(edge.sourceGraphId);
      const owner = nativePorts && ownerId ? (graphs.get(ownerId) ?? root) : root;
      (owner.edges ??= []).push({ id: `e${index}`, sources: [source], targets: [target] });
    }
  });
  return root;
}

function toLayoutResult(request: LayoutRequest, laid: ElkNode, rootEdgeCoords = false): LayoutResult {
  const offsets = new Map<string, Point>(); // absolute top-left of every ELK node
  const boxes = new Map<string, Box>();
  const walk = (node: ElkNode, parent: Point) => {
    const at = { x: parent.x + (node.x ?? 0), y: parent.y + (node.y ?? 0) };
    offsets.set(node.id, at);
    boxes.set(node.id, { ...at, width: node.width ?? 0, height: node.height ?? 0 });
    node.ports?.forEach((port) =>
      boxes.set(port.id, {
        x: at.x + (port.x ?? 0),
        y: at.y + (port.y ?? 0),
        width: port.width ?? 0,
        height: port.height ?? 0,
      })
    );
    node.children?.forEach((child) => walk(child, at));
  };
  walk(laid, { x: -(laid.x ?? 0), y: -(laid.y ?? 0) });

  const centre = (id: string): Point | undefined => {
    const box = boxes.get(id);
    return box && { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };

  const positionsLength = request.nodes.reduce(
    (length, node) => Math.max(length, (node.wasmId + 1) * 2),
    request.positionsLength
  );
  const positions = new Float64Array(positionsLength);
  for (const node of request.nodes) {
    const c = centre(nodeElkId(node.graphId, node.id));
    if (c) {
      positions[node.wasmId * 2] = c.x;
      positions[node.wasmId * 2 + 1] = c.y;
    }
  }

  const graphs: LayoutGraphResult[] = request.graphs
    .map((graph) => {
      const box = boxes.get(graphElkId(graph.id));
      return box && { id: graph.id, minX: box.x, minY: box.y, maxX: box.x + box.width, maxY: box.y + box.height };
    })
    .filter((box): box is LayoutGraphResult => !!box);

  const radius = new Map(
    request.nodes.map((node) => [nodeElkId(node.graphId, node.id), node.radius ?? DEFAULT_LAYOUT_NODE_RADIUS])
  );
  const laidEdges = new Map<string, ElkExtendedEdge>();
  const collect = (node: ElkNode) => {
    node.edges?.forEach((edge) => laidEdges.set(edge.id, edge));
    node.children?.forEach(collect);
  };
  collect(laid);

  const segmentsByEdge: CurveSegment[][] = request.edges.map(() => []);
  const arrowEdges: number[] = [];
  const flags: number[] = [];
  const sourceTips: number[] = [];
  const targetTips: number[] = [];
  request.edges.forEach((edge, index) => {
    const laidEdge = laidEdges.get(`e${index}`);
    const section = laidEdge?.sections?.[0];
    if (!laidEdge || !section) {
      return;
    }
    const origin = offsets.get(rootEdgeCoords ? laid.id : (laidEdge.container ?? laid.id)) ?? { x: 0, y: 0 };
    const abs = (p: ElkPoint): Point => ({ x: p.x + origin.x, y: p.y + origin.y });
    const points = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint].map(abs);
    const sourceId = nodeElkId(edge.sourceGraphId, edge.sourceId);
    const targetId = nodeElkId(edge.targetGraphId, edge.targetId);
    // ELK ends edges on the node's box: right for cards, mapgl's circle needs them moved onto it.
    if (!request.cards) {
      points[0] = toCircle(centre(sourceId)!, points[0], radius.get(sourceId)!);
      points[points.length - 1] = toCircle(centre(targetId)!, points[points.length - 1], radius.get(targetId)!);
    }
    const sourceTip = points[0];
    const targetTip = points[points.length - 1];
    if (edge.sourceArrowLength) {
      points[0] = moveTowards(points[0], points[1], edge.sourceArrowLength);
    }
    if (edge.targetArrowLength) {
      const last = points.length - 1;
      points[last] = moveTowards(points[last], points[last - 1], edge.targetArrowLength);
    }
    const cornerRadius = Math.min(MAX_CORNER_RADIUS, request.nodeSeparation / 4);
    segmentsByEdge[index] =
      request.routing === 'Rectilinear'
        ? roundedPolyline(points, cornerRadius)
        : toSplineSegments(points, cornerRadius);
    const flag = (edge.sourceArrowLength ? SOURCE_ARROW_FLAG : 0) | (edge.targetArrowLength ? TARGET_ARROW_FLAG : 0);
    if (flag) {
      arrowEdges.push(index);
      flags.push(flag);
      sourceTips.push(sourceTip.x, sourceTip.y);
      targetTips.push(targetTip.x, targetTip.y);
    }
  });

  const arrows: LayoutArrowResult = {
    edgeIndexes: Int32Array.from(arrowEdges),
    flags: Uint8Array.from(flags),
    sourceTips: Float64Array.from(sourceTips),
    targetTips: Float64Array.from(targetTips),
  };
  return {
    requestId: request.requestId,
    engine: 'ELK',
    routing: request.routing,
    graphs,
    positions,
    arrows,
    curveGroups: createCurveGroups(request.edges, segmentsByEdge),
  };
}

/** ELK spline sections are cubic Béziers when the points after the start come in threes; else a polyline. */
function toSplineSegments(points: Point[], cornerRadius: number): CurveSegment[] {
  if ((points.length - 1) % 3 !== 0) {
    // A compound route can concatenate legs and insert hierarchy joins. Its
    // flattened point list may no longer describe a single cubic chain.
    return roundedPolyline(points, cornerRadius);
  }

  const segments: CurveSegment[] = [];
  for (let i = 0; i + 3 < points.length; i += 3) {
    const cubic = points.slice(i, i + 4);
    const length = cubic
      .slice(1)
      .reduce((sum, point, j) => sum + Math.hypot(point.x - cubic[j].x, point.y - cubic[j].y), 0);
    pushCurveSegments(
      segments,
      BEZIER,
      cubic.flatMap(({ x, y }) => [x, y]),
      curveResolutionForLength(length)
    );
  }
  return segments;
}

function toCircle(c: Point, p: Point, r: number): Point {
  const d = Math.hypot(p.x - c.x, p.y - c.y);
  return d > 0 ? { x: c.x + ((p.x - c.x) * r) / d, y: c.y + ((p.y - c.y) * r) / d } : p;
}

function moveTowards(p: Point, towards: Point, length: number): Point {
  const d = Math.hypot(towards.x - p.x, towards.y - p.y);
  const t = d > 0 ? Math.min(length, d / 2) / d : 0;
  return { x: p.x + (towards.x - p.x) * t, y: p.y + (towards.y - p.y) * t };
}

/** Nodes per column: the square root of the node count, so a hub's callers fill a panel-shaped (wide) grid. */
export function layerBound(nodes: number): number {
  return Math.max(4, Math.ceil(Math.sqrt(nodes)));
}

function graphElkId(id: string): string {
  return `g:${id}`;
}

function nodeElkId(graphId: string, id: string): string {
  return `n:${nodeKey(graphId, id)}`;
}
