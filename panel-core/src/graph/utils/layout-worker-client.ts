import { locationService } from '@grafana/runtime';

import { Graph } from '../structs/graph';
import { getNodeData } from '../structs/graphOps';
import type { Edge } from '../structs/edge';
import { getLayoutNodeRadius, resolveLayoutArrowLengths } from './layout-geometry';
import { SOURCE_ARROW_FLAG, TARGET_ARROW_FLAG } from './layout-worker-types';
import type {
  EdgeRoutingConfig,
  LayoutEdgeSnapshot,
  LayoutCurveGroup,
  LayoutDirectionConfig,
  LayoutGraphResult,
  LayoutGraphSnapshot,
  LayoutNodeSnapshot,
  LayoutRequest,
  LayoutResult,
} from './layout-worker-types';

export type LayoutArrowTips = {
  start?: [number, number];
  end?: [number, number];
};

export interface GraphLayoutRequestInput {
  readonly graph: Graph;
  readonly positionsLength: number;
  readonly autolayout?: AutolayoutOptions;
}

export interface GraphLayoutWorkerResult {
  readonly positions: Float64Array;
  readonly graphBounds: ReadonlyMap<string, LayoutGraphResult>;
  readonly curveGroups: ReadonlyMap<string, LayoutCurveGroup>;
  readonly edgeIndexes: ReadonlyMap<string, number>;
  readonly edgeKeys: readonly string[];
  readonly arrowTips: ReadonlyMap<string, LayoutArrowTips>;
}

declare const __webpack_public_path__: string;

const DEFAULT_LAYOUT_DIRECTION: LayoutDirectionConfig = 'RL';
const DEFAULT_LAYER_SEPARATION = 60;
const DEFAULT_NODE_SEPARATION = 40;

export type AutolayoutOptions = {
  edgeRouting?: EdgeRoutingConfig;
  layoutDirection?: LayoutDirectionConfig;
  layerSeparation?: number;
  nodeSeparation?: number;
};

let worker: Worker | undefined;
let nextRequestId = 0;
const pendingRequests = new Map<
  number,
  {
    edgeIndexes: Map<string, number>;
    edgeKeys: string[];
    resolve: (result: GraphLayoutWorkerResult) => void;
    reject: (error: Error) => void;
  }
>();

export function requestGraphLayout(input: GraphLayoutRequestInput): Promise<GraphLayoutWorkerResult | undefined> {
  const layoutWorker = getWorker();
  if (!layoutWorker) {
    return Promise.resolve(undefined);
  }

  const request = createLayoutRequest(input);
  const edgeIndex = createEdgeIndex(request);
  return new Promise((resolve, reject) => {
    pendingRequests.set(request.requestId, { ...edgeIndex, resolve, reject });
    try {
      layoutWorker.postMessage(request);
    } catch (error) {
      pendingRequests.delete(request.requestId);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
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
    const workerUrl = new URL('layout-worker.js', publicPath);
    const workerObjectUrl = URL.createObjectURL(
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
        pending?.reject(new Error(`MSAGL layout worker failed: ${data.message}`));
        return;
      }
      if (pending && 'positions' in data && 'arrows' in data) {
        pending.resolve({
          positions: data.positions,
          graphBounds: new Map(data.graphs.map((graph) => [graph.id, graph])),
          curveGroups: new Map((data.curveGroups ?? []).map((group) => [group.graphId, group])),
          edgeIndexes: pending.edgeIndexes,
          edgeKeys: Object.freeze([...pending.edgeKeys]),
          arrowTips: createLayoutArrowTips(data, pending.edgeKeys),
        });
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

function createLayoutRequest(input: GraphLayoutRequestInput): LayoutRequest {
  const graph = input.graph;
  const graphs = collectGraphs(graph);
  const nodes = collectNodes(graph);
  const edges = collectEdges(graph);
  const autolayout = input.autolayout ?? {};

  return {
    requestId: ++nextRequestId,
    routing: autolayout.edgeRouting ?? 'Splines',
    direction: autolayout.layoutDirection ?? DEFAULT_LAYOUT_DIRECTION,
    layerSeparation: getPositiveNumber(autolayout.layerSeparation, DEFAULT_LAYER_SEPARATION),
    nodeSeparation: getPositiveNumber(autolayout.nodeSeparation, DEFAULT_NODE_SEPARATION),
    rootGraphId: graph.id,
    positionsLength: input.positionsLength,
    graphs,
    nodes,
    edges,
  };
}

function getPositiveNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function collectGraphs(root: Graph): LayoutGraphSnapshot[] {
  return [root].concat(Array.from(root.subgraphsBreadthFirst() as Iterable<Graph>)).map((graph) => ({
    id: graph.id,
    parentId: (graph.parent as Graph | undefined)?.id,
  }));
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
        radius: getLayoutNodeRadius(nodeSize),
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
    const placement = edgeData?.arrowPlacement ?? 'both';
    const arrowLengths = resolveLayoutArrowLengths(arrow, edgeData?.dataRecord?.edgeStyle?.size, placement);
    edges.push({
      id: edge.id,
      sourceId: edge.source.id,
      sourceGraphId: (edge.source.parent as Graph)?.id,
      targetId: edge.target.id,
      targetGraphId: (edge.target.parent as Graph)?.id,
      sourceArrowLength: arrowLengths.start,
      targetArrowLength: arrowLengths.end,
    });
  }
  return edges;
}

function edgeKey(graphId: string | undefined, edgeId: string): string {
  return `${graphId ?? ''}:${edgeId}`;
}
