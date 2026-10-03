import { Graph } from '../structs/graph';
import { getNodeData } from '../structs/graphOps';
import type { Edge } from '../structs/edge';
import { getLayoutNodeRadius, resolveLayoutArrowLengths } from './layout-geometry';
import {
  SOURCE_ARROW_FLAG,
  TARGET_ARROW_FLAG,
  type EdgeRoutingConfig,
  type LayoutEdgeSnapshot,
  type LayoutCurveGroup,
  type LayoutDirectionConfig,
  type LayoutGraphResult,
  type LayoutGraphSnapshot,
  type LayoutNodeSnapshot,
  type LayoutRequest,
  type LayoutResult,
} from './layout-worker-types';

export type LayoutArrowTips = {
  start?: [number, number];
  end?: [number, number];
};

export interface GraphLayoutRequestInput {
  readonly signal?: AbortSignal;
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

const DEFAULT_LAYOUT_DIRECTION: LayoutDirectionConfig = 'RL';
const DEFAULT_LAYER_SEPARATION = 60;
const DEFAULT_NODE_SEPARATION = 40;

export type AutolayoutOptions = {
  edgeRouting?: EdgeRoutingConfig;
  layoutDirection?: LayoutDirectionConfig;
  layerSeparation?: number;
  nodeSeparation?: number;
};

let nextRequestId = 0;
export interface LayoutWorkerResource {
  readonly worker: Worker;
  dispose(): void;
}
export type LayoutWorkerFactory = () => LayoutWorkerResource | undefined;

/** One client owns one worker and all pending requests for a panel/controller. */
export class LayoutWorkerClient {
  private resource?: LayoutWorkerResource;
  private disposed = false;
  private readonly pending = new Map<
    number,
    {
      edgeIndexes: Map<string, number>;
      edgeKeys: string[];
      resolve(result: GraphLayoutWorkerResult | undefined): void;
      reject(error: Error): void;
    }
  >();
  constructor(private readonly createWorker: LayoutWorkerFactory) {}
  requestLayout(input: GraphLayoutRequestInput): Promise<GraphLayoutWorkerResult | undefined> {
    return this.post(createLayoutRequest(input), input.signal);
  }
  post<T extends Pick<LayoutRequest, 'requestId' | 'edges'>>(
    request: T,
    signal?: AbortSignal
  ): Promise<GraphLayoutWorkerResult | undefined> {
    if (this.disposed || signal?.aborted) {
      return Promise.resolve(undefined);
    }
    if (!this.resource) {
      this.resource = this.createWorker();
      if (this.resource) {
        this.resource.worker.onmessage = ({
          data,
        }: MessageEvent<LayoutResult | { type: 'error'; requestId: number; message: string }>) => {
          const pending = this.pending.get(data.requestId);
          this.pending.delete(data.requestId);
          if (!pending) {
            return;
          }
          if ('type' in data && data.type === 'error') {
            pending.reject(new Error(`MSAGL layout worker failed: ${data.message}`));
            return;
          }
          if ('positions' in data && 'arrows' in data) {
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
        this.resource.worker.onerror = (event) => {
          for (const pending of this.pending.values()) {
            pending.reject(new Error(event.message || 'Layout worker failed'));
          }
          this.pending.clear();
          this.resource?.dispose();
          this.resource = undefined;
        };
      }
    }
    if (!this.resource) {
      return Promise.resolve(undefined);
    }
    const worker = this.resource.worker;
    return new Promise((resolve, reject) => {
      const cancel = () => {
        this.pending.delete(request.requestId);
        finish(undefined);
      };
      const finish = (result: GraphLayoutWorkerResult | undefined) => {
        signal?.removeEventListener('abort', cancel);
        resolve(result);
      };
      const fail = (error: Error) => {
        signal?.removeEventListener('abort', cancel);
        reject(error);
      };
      signal?.addEventListener('abort', cancel, { once: true });
      this.pending.set(request.requestId, { ...createEdgeIndex(request), resolve: finish, reject: fail });
      try {
        worker.postMessage(request);
      } catch (error) {
        this.pending.delete(request.requestId);
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
  dispose(): void {
    this.disposed = true;
    this.resource?.dispose();
    this.resource = undefined;
    for (const pending of this.pending.values()) {
      pending.resolve(undefined);
    }
    this.pending.clear();
  }
}

function createLayoutArrowTips(result: LayoutResult, edgeKeys: string[]): Map<string, LayoutArrowTips> {
  const tips = new Map<string, LayoutArrowTips>();

  result.arrows.edgeIndexes.forEach((edgeIndex, resultIndex) => {
    const key = edgeKeys[edgeIndex];
    if (!key) {
      return;
    }

    const flags = result.arrows.flags[resultIndex];
    if (!flags) {
      return;
    }
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

function createEdgeIndex(request: Pick<LayoutRequest, 'edges'>): {
  edgeIndexes: Map<string, number>;
  edgeKeys: string[];
} {
  const indexes = new Map<string, number>();
  const edgeKeys: string[] = [];
  request.edges.forEach((edge, index) => {
    const key = edgeKey(edge.sourceGraphId, edge.id);
    indexes.set(key, index);
    edgeKeys[index] = key;
  });
  return { edgeIndexes: indexes, edgeKeys };
}

export function createLayoutRequest(input: GraphLayoutRequestInput): LayoutRequest {
  const graph = input.graph;
  const graphs = collectGraphs(graph);
  const nodes = collectNodes(graph);
  const edges = collectEdges(graph);
  const autolayout = input.autolayout ?? {};

  return {
    requestId: ++nextRequestId,
    operation: 'layout',
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
      nodes.push({
        id: node.id,
        graphId: graph.id,
        wasmId: nodeData.wasmId,
        radius: getLayoutNodeRadius(nodeData.feature?.style?.size),
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
