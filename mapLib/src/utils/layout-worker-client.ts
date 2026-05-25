import { locationService } from '@grafana/runtime';

import { Graph } from '../structs/graph';
import { getNodeData } from '../structs/graphOps';
import type { Edge } from '../structs/edge';
import { SOURCE_ARROW_FLAG, TARGET_ARROW_FLAG } from './layout-worker-types';
import type {
  LayoutEdgeSnapshot,
  LayoutCurveGroup,
  LayoutGraphResult,
  LayoutGraphSnapshot,
  LayoutNodeSnapshot,
  LayoutRequest,
  LayoutResult,
} from './layout-worker-types';

type PanelLike = {
  graph: Graph;
  positions: Float64Array;
  layerShift?: Record<string, [number, number]>;
  layoutGraphBounds?: Map<string, LayoutGraphResult>;
  layoutCurveGroups?: Map<string, LayoutCurveGroup>;
  layoutEdgeIndexes?: Map<string, number>;
  layoutEdgeKeys?: string[];
  layoutArrowTips?: Map<string, LayoutArrowTips>;
  props?: { options?: { common?: { edgeRouting?: 'Splines' | 'Rectilinear' } } };
  edgeRoutingOverride?: 'Splines' | 'Rectilinear';
};

interface LayoutAppliedCallback {
  (applied: boolean): void;
}

export type LayoutArrowTips = {
  start?: [number, number];
  end?: [number, number];
};

export type LayoutCache = {
  nodes: Map<string, { x: number; y: number }>;
  graphBounds: Map<string, LayoutGraphResult>;
  curveGroups: Map<string, LayoutCurveGroup>;
  edgeIndexes: Map<string, number>;
  edgeKeys: string[];
  arrowTips: Map<string, LayoutArrowTips>;
};

declare const __webpack_public_path__: string;

const DEFAULT_NODE_RADIUS = 12.5;

let worker: Worker | undefined;
let workerObjectUrl: string | undefined;
let nextRequestId = 0;
const latestRequestByPanel = new WeakMap<PanelLike, number>();
const pendingRequests = new Map<
  number,
  { panel: PanelLike; edgeIndexes: Map<string, number>; edgeKeys: string[]; onApplied?: LayoutAppliedCallback }
>();

export function scheduleLayout(panel: PanelLike, onApplied?: LayoutAppliedCallback): boolean {
  const request = createLayoutRequest(panel);
  latestRequestByPanel.set(panel, request.requestId);

  const layoutWorker = getWorker();
  if (!layoutWorker) {
    return false;
  }

  const edgeIndex = createEdgeIndex(request);
  pendingRequests.set(request.requestId, { panel, ...edgeIndex, onApplied });
  layoutWorker.postMessage(request);
  return true;
}

export function captureLayoutCache(panel: PanelLike): LayoutCache {
  const { graph, positions } = panel;
  const nodes = new Map<string, { x: number; y: number }>();

  for (const graphItem of collectGraphs(graph)) {
    const liveGraph = graphItem.id === graph.id ? graph : findGraphById(graph, graphItem.id);
    if (!liveGraph) {
      continue;
    }
    for (const node of liveGraph.shallowNodes as Iterable<any>) {
      if (node instanceof Graph) {
        continue;
      }
      const nodeData = getNodeData(node);
      if (!nodeData) {
        continue;
      }
      nodes.set(nodeKey(liveGraph.id, node.id), {
        x: positions[nodeData.wasmId * 2],
        y: positions[nodeData.wasmId * 2 + 1],
      });
    }
  }

  return {
    nodes,
    graphBounds: new Map(panel.layoutGraphBounds),
    curveGroups: new Map(panel.layoutCurveGroups),
    edgeIndexes: new Map(panel.layoutEdgeIndexes),
    edgeKeys: [...(panel.layoutEdgeKeys ?? [])],
    arrowTips: new Map(panel.layoutArrowTips),
  };
}

export function restoreLayoutCache(cache: LayoutCache | undefined, panel: PanelLike): boolean {
  if (!cache) {
    return false;
  }

  const { graph, positions } = panel;
  let restoredNodes = 0;
  let totalNodes = 0;
  for (const graphItem of collectGraphs(graph)) {
    const liveGraph = graphItem.id === graph.id ? graph : findGraphById(graph, graphItem.id);
    if (!liveGraph) {
      continue;
    }
    for (const node of liveGraph.shallowNodes as Iterable<any>) {
      if (node instanceof Graph) {
        continue;
      }
      const preserved = cache.nodes.get(nodeKey(liveGraph.id, node.id));
      const nodeData = getNodeData(node);
      if (!nodeData) {
        continue;
      }
      totalNodes++;
      if (!preserved || !Number.isFinite(preserved.x) || !Number.isFinite(preserved.y)) {
        continue;
      }
      positions[nodeData.wasmId * 2] = preserved.x;
      positions[nodeData.wasmId * 2 + 1] = preserved.y;
      restoredNodes++;
    }
  }

  const restored = restoredNodes > 0 && restoredNodes === totalNodes;
  if (restored) {
    panel.layoutGraphBounds = new Map(cache.graphBounds);
    panel.layoutCurveGroups = new Map(cache.curveGroups);
    panel.layoutEdgeIndexes = new Map(cache.edgeIndexes);
    panel.layoutEdgeKeys = [...cache.edgeKeys];
    panel.layoutArrowTips = new Map(cache.arrowTips);
  }

  return restored;
}

function applyLayoutIfCurrent(
  panel: PanelLike,
  result: LayoutResult,
  edgeIndexes: Map<string, number>,
  edgeKeys: string[],
  onApplied?: LayoutAppliedCallback
): void {
  if (latestRequestByPanel.get(panel) !== result.requestId) {
    return;
  }
  panel.positions = result.positions;
  panel.layoutGraphBounds = new Map(result.graphs.map((graph) => [graph.id, graph]));
  panel.layoutCurveGroups = new Map((result.curveGroups ?? []).map((group) => [group.graphId, group]));
  panel.layoutEdgeIndexes = edgeIndexes;
  panel.layoutEdgeKeys = edgeKeys;
  panel.layoutArrowTips = createLayoutArrowTips(result, edgeKeys);
  onApplied?.(true);
}

function createLayoutArrowTips(result: LayoutResult, edgeKeys: string[]): Map<string, LayoutArrowTips> {
  const tips = new Map<string, LayoutArrowTips>();

  result.arrows.edgeIndexes.forEach((edgeIndex, resultIndex) => {
    const key = edgeKeys[edgeIndex];
    if (!key) {
      return;
    }

    const flags = result.arrows.flags[resultIndex];
    const edgeTips: LayoutArrowTips = {};
    if (flags & SOURCE_ARROW_FLAG) {
      edgeTips.start = [result.arrows.sourceTips[resultIndex * 2], result.arrows.sourceTips[resultIndex * 2 + 1]];
    }
    if (flags & TARGET_ARROW_FLAG) {
      edgeTips.end = [result.arrows.targetTips[resultIndex * 2], result.arrows.targetTips[resultIndex * 2 + 1]];
    }
    tips.set(key, edgeTips);
  });

  return tips;
}

function getWorker(): Worker | undefined {
  if (typeof Worker === 'undefined') {
    return undefined;
  }
  if (!worker) {
    const publicPath = new URL(__webpack_public_path__, locationService.getLocation().href);
    const workerUrl = new URL('layoutWorker.js', publicPath);
    workerObjectUrl = URL.createObjectURL(
      new Blob(
        [
          `
self.define = function (factory) {
  factory();
};
importScripts(${JSON.stringify(workerUrl.href)});
`,
        ],
        { type: 'text/javascript' }
      )
    );
    worker = new Worker(workerObjectUrl);
    worker.onmessage = ({
      data,
    }: MessageEvent<LayoutResult | { type: 'error'; requestId: number; message: string }>) => {
      const pending = pendingRequests.get(data.requestId);
      pendingRequests.delete(data.requestId);

      if ('type' in data && data.type === 'error') {
        if (pending && latestRequestByPanel.get(pending.panel) === data.requestId) {
          console.error('MSAGL layout worker failed', data.message);
          pending.onApplied?.(false);
        }
        return;
      }
      if (pending && 'positions' in data && 'arrows' in data) {
        applyLayoutIfCurrent(pending.panel, data, pending.edgeIndexes, pending.edgeKeys, pending.onApplied);
      }
    };
  }
  return worker;
}

function createEdgeIndex(request: LayoutRequest): { edgeIndexes: Map<string, number>; edgeKeys: string[] } {
  const indexes = new Map<string, number>();
  const edgeKeys: string[] = [];
  request.edges.forEach((edge, index) => {
    const key = edgeKey(edge.sourceGraphId, edge.id);
    indexes.set(key, index);
    edgeKeys[index] = key;
  });
  return { edgeIndexes: indexes, edgeKeys };
}

function createLayoutRequest(panel: PanelLike): LayoutRequest {
  const graph = panel.graph;
  const graphs = collectGraphs(graph);
  const nodes = collectNodes(graph);
  const edges = collectEdges(graph);
  const routing = panel.edgeRoutingOverride ?? panel.props?.options?.common?.edgeRouting ?? 'Splines';

  return {
    requestId: ++nextRequestId,
    routing,
    rootGraphId: graph.id,
    positionsLength: panel.positions.length,
    graphs,
    nodes,
    edges,
  };
}

function collectGraphs(root: Graph): LayoutGraphSnapshot[] {
  return [root].concat(Array.from(root.subgraphsBreadthFirst() as Iterable<Graph>)).map((graph) => ({
    id: graph.id,
    parentId: (graph.parent as Graph | undefined)?.id,
  }));
}

function findGraphById(root: Graph, graphId: string): Graph | undefined {
  return Array.from(root.subgraphsBreadthFirst() as Iterable<Graph>).find((graph) => graph.id === graphId);
}

function collectNodes(root: Graph): LayoutNodeSnapshot[] {
  const nodes: LayoutNodeSnapshot[] = [];
  for (const graph of [root].concat(Array.from(root.subgraphsBreadthFirst() as Iterable<Graph>))) {
    for (const node of graph.shallowNodes as Iterable<any>) {
      if (node instanceof Graph) {
        continue;
      }
      const nodeData = getNodeData(node);
      if (!nodeData) {
        continue;
      }
      const nodeSize = nodeData.feature?.style?.size;
      nodes.push({
        id: node.id,
        graphId: graph.id,
        wasmId: nodeData.wasmId,
        radius: typeof nodeSize === 'number' ? nodeSize / 2 : DEFAULT_NODE_RADIUS,
      });
    }
  }
  return nodes;
}

function collectEdges(root: Graph): LayoutEdgeSnapshot[] {
  const edges: LayoutEdgeSnapshot[] = [];
  for (const edge of root.deepEdges as Iterable<Edge>) {
    const edgeData = edge.data;
    const arrow = edgeData?.dataRecord?.edgeStyle?.arrow ?? 0;
    const arrowLength = getEdgeArrowLength(edgeData?.dataRecord?.edgeStyle?.size);
    const placement = edgeData?.arrowPlacement ?? 'both';
    const hasSourceArrow = (arrow === -1 || arrow === 2) && (placement === 'start' || placement === 'both');
    const hasTargetArrow = (arrow === 1 || arrow === 2) && (placement === 'end' || placement === 'both');
    edges.push({
      id: edge.id,
      sourceId: edge.source.id,
      sourceGraphId: (edge.source.parent as Graph)?.id,
      targetId: edge.target.id,
      targetGraphId: (edge.target.parent as Graph)?.id,
      sourceArrowLength: hasSourceArrow ? arrowLength : undefined,
      targetArrowLength: hasTargetArrow ? arrowLength : undefined,
    });
  }
  return edges;
}

function getEdgeArrowLength(edgeSize: number | undefined): number {
  if (typeof edgeSize === 'number') {
    const scaled = edgeSize * 6;
    return Math.max(8, Math.min(24, scaled));
  }
  return 12;
}

function nodeKey(graphId: string | undefined, nodeId: string): string {
  return `${graphId ?? ''}:${nodeId}`;
}

function edgeKey(graphId: string | undefined, edgeId: string): string {
  return `${graphId ?? ''}:${edgeId}`;
}
