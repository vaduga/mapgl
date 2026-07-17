import { getGraphVersion, type Edge, type Graph, type GraphEdgeIndex, type Node } from '@mapgl/panel-core/graph';

export type ConnectedEdgeIndex = {
  graphId: string;
  lineId?: number;
  arcId?: number;
  depth?: number;
};

type AdjacentItem = {
  nodeKey: string;
  edges: Edge[];
  edgeKeys: string[];
};

type EdgeHighlightItem = {
  nodeKeys: string[];
  edgeKeys: string[];
};

export class GraphHighlighter {
  private graph?: Graph;
  private edgeIndex?: GraphEdgeIndex;
  private graphVersion?: number;
  private nodeMap = new Map<string, Node>();
  private outgoingAdjacency = new Map<string, AdjacentItem[]>();
  private incomingAdjacency = new Map<string, AdjacentItem[]>();
  private edgeIndexes = new Map<string, ConnectedEdgeIndex>();
  private edgeHighlights = new Map<string, EdgeHighlightItem>();
  private nodeKeysById = new Map<string, string[]>();
  private edgeKeysById = new Map<string, string[]>();
  private lastSourceKey?: string | null;
  private lastEdgeKey?: string | null;
  private lastMaxDepth = 1;
  private lastIsDefDir: boolean | null = true;
  private connectedNodeIds = new Set<string>();
  private connectedEdgeIndexes: ConnectedEdgeIndex[] = [];
  private connectedNodeDepths = new Map<string, number>();

  setGraph(graph: Graph, opts?: { force?: boolean; edgeIndex?: GraphEdgeIndex }) {
    const edgeIndex = opts?.edgeIndex ?? this.edgeIndex;
    const graphVersion = getGraphVersion(graph);
    if (!opts?.force && this.graph === graph && this.edgeIndex === edgeIndex && this.graphVersion === graphVersion) {
      return;
    }

    this.graph = graph;
    this.edgeIndex = edgeIndex;
    this.graphVersion = graphVersion;
    this.lastSourceKey = undefined;
    this.nodeMap.clear();
    this.outgoingAdjacency.clear();
    this.incomingAdjacency.clear();
    this.edgeIndexes.clear();
    this.edgeHighlights.clear();
    this.nodeKeysById.clear();
    this.edgeKeysById.clear();
    this.connectedNodeIds.clear();
    this.connectedNodeDepths.clear();
    this.connectedEdgeIndexes = [];

    for (const node of graph.nodesBreadthFirst) {
      const nodeKey = getNodeKey(node);
      this.nodeMap.set(nodeKey, node);
      this.addLookupKey(this.nodeKeysById, node.id, nodeKey);
      this.outgoingAdjacency.set(nodeKey, []);
      this.incomingAdjacency.set(nodeKey, []);
    }

    const multiHopEdgeFragments = new Set<Edge>();
    for (const edges of edgeIndex?.wasm2Edges ?? []) {
      if (!edges?.length) {
        continue;
      }

      const firstEdge = edges[0];
      const lastEdge = edges[edges.length - 1];
      const graphId = String((firstEdge.source.parent as Graph)?.id ?? '');
      const edgeKeys = edges.map((edge) => makeScopedKey(graphId, edge.id));
      const nodeKeys = [getNodeKey(firstEdge.source), getNodeKey(lastEdge.target)];

      for (const edge of edges) {
        multiHopEdgeFragments.add(edge);
      }

      this.addDirectedAdjacent(firstEdge.source, lastEdge.target, edges, edgeKeys);

      for (const edge of edges) {
        const edgeKey = makeScopedKey(graphId, edge.id);
        this.addEdgeIndex(edge, {
          graphId,
          lineId: edge.lineId,
          arcId: firstEdge.arcId,
        });
        this.edgeHighlights.set(edgeKey, { nodeKeys, edgeKeys });
        this.addLookupKey(this.edgeKeysById, edge.id, edgeKey);
      }
    }

    for (const edge of graph.deepEdges) {
      if (multiHopEdgeFragments.has(edge)) {
        continue;
      }

      this.addDirectedAdjacent(edge.source, edge.target, [edge]);

      this.addEdgeIndex(edge);
      const edgeKey = getEdgeKey(edge);
      this.edgeHighlights.set(edgeKey, {
        nodeKeys: [getNodeKey(edge.source), getNodeKey(edge.target)],
        edgeKeys: [edgeKey],
      });
      this.addLookupKey(this.edgeKeysById, edge.id, edgeKey);
    }

    this.update({ sourceId: null });
  }

  update(opts: { sourceId: string | null; graphId?: string | null; maxDepth?: number; isDefDir?: boolean | null }) {
    const { sourceId, graphId, maxDepth = 1, isDefDir = true } = opts;
    const sourceKey = sourceId ? this.resolveNodeKey(sourceId, graphId) : null;
    if (sourceKey === this.lastSourceKey && maxDepth === this.lastMaxDepth && isDefDir === this.lastIsDefDir) {
      return;
    }

    this.lastSourceKey = sourceKey;
    this.lastEdgeKey = null;
    this.lastMaxDepth = maxDepth;
    this.lastIsDefDir = isDefDir;
    this.connectedNodeIds = new Set<string>();
    this.connectedNodeDepths = new Map<string, number>();
    const connectedEdgeIds = new Set<string>();
    const connectedEdgeDepths = new Map<string, number>();

    if (!sourceKey || !this.nodeMap.has(sourceKey) || maxDepth < 1) {
      this.connectedEdgeIndexes = [];
      return;
    }

    this.connectedNodeIds.add(sourceKey);
    this.connectedNodeDepths.set(sourceKey, 0);
    const visited = new Set<string>([sourceKey]);
    const queue: Array<{ nodeKey: string; depth: number }> = [{ nodeKey: sourceKey, depth: 0 }];

    for (let cursor = 0; cursor < queue.length; cursor++) {
      const current = queue[cursor];
      if (current.depth >= maxDepth) {
        continue;
      }

      const adjacencyMaps =
        isDefDir === null
          ? [this.outgoingAdjacency, this.incomingAdjacency]
          : [isDefDir ? this.outgoingAdjacency : this.incomingAdjacency];
      for (const adjacency of adjacencyMaps) {
        for (const item of adjacency.get(current.nodeKey) ?? []) {
          const nextDepth = current.depth + 1;
          for (const edgeKey of item.edgeKeys) {
            connectedEdgeIds.add(edgeKey);
            const prevDepth = connectedEdgeDepths.get(edgeKey);
            if (prevDepth === undefined || nextDepth < prevDepth) {
              connectedEdgeDepths.set(edgeKey, nextDepth);
            }
          }
          this.connectedNodeIds.add(item.nodeKey);
          const prevNodeDepth = this.connectedNodeDepths.get(item.nodeKey);
          if (prevNodeDepth === undefined || nextDepth < prevNodeDepth) {
            this.connectedNodeDepths.set(item.nodeKey, nextDepth);
          }

          if (!visited.has(item.nodeKey)) {
            visited.add(item.nodeKey);
            queue.push({ nodeKey: item.nodeKey, depth: nextDepth });
          }
        }
      }
    }

    this.connectedEdgeIndexes = Array.from(connectedEdgeIds).reduce<ConnectedEdgeIndex[]>((acc, edgeKey) => {
      const item = this.edgeIndexes.get(edgeKey);
      if (item) {
        acc.push({ ...item, depth: connectedEdgeDepths.get(edgeKey) });
      }
      return acc;
    }, []);
  }

  updateEdge(opts: { edgeId: string | null; graphId?: string | null }) {
    const { edgeId, graphId } = opts;
    const edgeKey = edgeId ? this.resolveEdgeKey(edgeId, graphId) : null;
    if (edgeKey === this.lastEdgeKey) {
      return;
    }

    this.lastEdgeKey = edgeKey;
    this.lastSourceKey = null;
    this.connectedNodeIds = new Set<string>();
    this.connectedNodeDepths = new Map<string, number>();

    if (!edgeKey) {
      this.connectedEdgeIndexes = [];
      return;
    }

    const item = this.edgeHighlights.get(edgeKey);
    if (!item) {
      this.connectedEdgeIndexes = [];
      return;
    }

    this.connectedNodeIds = new Set(item.nodeKeys);
    item.nodeKeys.forEach((nodeKey) => this.connectedNodeDepths.set(nodeKey, 0));
    this.connectedEdgeIndexes = item.edgeKeys
      .map((key) => this.edgeIndexes.get(key))
      .filter((edgeIndex): edgeIndex is ConnectedEdgeIndex => Boolean(edgeIndex))
      .map((edgeIndex) => ({ ...edgeIndex, depth: 0 }));
  }

  updateEdges(edges: Edge[]) {
    this.lastEdgeKey = null;
    this.lastSourceKey = null;
    this.connectedNodeIds = new Set<string>();
    this.connectedNodeDepths = new Map<string, number>();

    if (!edges.length) {
      this.connectedEdgeIndexes = [];
      return;
    }

    const connectedEdgeKeys = new Set<string>();
    for (const edge of edges) {
      const item = this.edgeHighlights.get(getEdgeKey(edge));
      if (!item) {
        continue;
      }

      item.nodeKeys.forEach((nodeKey) => {
        this.connectedNodeIds.add(nodeKey);
        this.connectedNodeDepths.set(nodeKey, 0);
      });
      item.edgeKeys.forEach((edgeKey) => connectedEdgeKeys.add(edgeKey));
    }

    this.connectedEdgeIndexes = Array.from(connectedEdgeKeys)
      .map((key) => this.edgeIndexes.get(key))
      .filter((edgeIndex): edgeIndex is ConnectedEdgeIndex => Boolean(edgeIndex))
      .map((edgeIndex) => ({ ...edgeIndex, depth: 0 }));
  }

  getConnectedNodeIds(): Set<string> {
    return this.connectedNodeIds;
  }

  getConnectedEdgeIndexes(): ConnectedEdgeIndex[] {
    return this.connectedEdgeIndexes;
  }

  getInEdges(node: Node | undefined | null): Edge[] {
    return this.getInEdgeGroups(node).flat();
  }

  getOutEdges(node: Node | undefined | null): Edge[] {
    return this.getOutEdgeGroups(node).flat();
  }

  getInEdgeGroups(node: Node | undefined | null): Edge[][] {
    return this.getAdjacentEdgeGroups(node, this.incomingAdjacency);
  }

  getOutEdgeGroups(node: Node | undefined | null): Edge[][] {
    return this.getAdjacentEdgeGroups(node, this.outgoingAdjacency);
  }

  private addDirectedAdjacent(source: Node, target: Node, edges: Edge[], edgeKeys = edges.map((edge) => getEdgeKey(edge))) {
    const sourceKey = getNodeKey(source);
    const targetKey = getNodeKey(target);
    const outgoingItems = this.outgoingAdjacency.get(sourceKey);
    if (outgoingItems) {
      outgoingItems.push({ nodeKey: targetKey, edges, edgeKeys });
    }

    if (source === target) {
      return;
    }

    const incomingItems = this.incomingAdjacency.get(targetKey);
    if (incomingItems) {
      incomingItems.push({ nodeKey: sourceKey, edges, edgeKeys });
    }
  }

  private addEdgeIndex(edge: Edge, opts?: { graphId?: string; lineId?: number; arcId?: number }) {
    const lineId = opts?.lineId ?? edge.lineId;
    const arcId = opts?.arcId ?? edge.arcId;

    if (lineId === undefined && arcId === undefined) {
      return;
    }

    const graphId = opts?.graphId ?? getEdgeGraphId(edge);
    this.edgeIndexes.set(makeScopedKey(graphId, edge.id), { graphId, lineId, arcId });
  }

  private addLookupKey(map: Map<string, string[]>, id: string, key: string) {
    const keys = map.get(id);
    if (keys) {
      keys.push(key);
    } else {
      map.set(id, [key]);
    }
  }

  private getAdjacentEdgeGroups(node: Node | undefined | null, adjacency: Map<string, AdjacentItem[]>): Edge[][] {
    if (!node) {
      return [];
    }

    return adjacency.get(getNodeKey(node))?.map((item) => item.edges) ?? [];
  }

  private resolveNodeKey(id: string, graphId?: string | null): string {
    if (graphId) {
      return makeScopedKey(graphId, id);
    }
    return this.nodeKeysById.get(id)?.[0] ?? id;
  }

  private resolveEdgeKey(id: string, graphId?: string | null): string {
    if (graphId) {
      return makeScopedKey(graphId, id);
    }
    return this.edgeKeysById.get(id)?.[0] ?? id;
  }
}

const KEY_SEPARATOR = '\u0000';

export function makeScopedKey(graphId: string, id: string): string {
  return `${graphId}${KEY_SEPARATOR}${id}`;
}

function getNodeGraphId(node: Node): string {
  return String((node.parent as Graph)?.id ?? '');
}

function getEdgeGraphId(edge: Edge): string {
  return String((edge.source.parent as Graph)?.id ?? '');
}

function getNodeKey(node: Node): string {
  return makeScopedKey(getNodeGraphId(node), node.id);
}

function getEdgeKey(edge: Edge): string {
  return makeScopedKey(getEdgeGraphId(edge), edge.id);
}
