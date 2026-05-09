import type { Edge, Graph, Node } from 'mapLib';

export type ConnectedEdgeIndex = {
  graphId: string;
  lineId?: number;
  arcId?: number;
  depth?: number;
  edge: Edge;
};

type AdjacentItem = {
  nodeId: string;
  edges: Edge[];
};

type EdgeHighlightItem = {
  nodeIds: string[];
  edgeIds: string[];
};

export class GraphHighlighter {
  private graph?: Graph;
  private graphVersion?: number;
  private nodeMap = new Map<string, Node>();
  private outgoingAdjacency = new Map<string, AdjacentItem[]>();
  private incomingAdjacency = new Map<string, AdjacentItem[]>();
  private edgeIndexes = new Map<string, ConnectedEdgeIndex>();
  private edgeHighlights = new Map<string, EdgeHighlightItem>();
  private lastSourceId?: string | null;
  private lastEdgeId?: string | null;
  private lastMaxDepth = 1;
  private lastIsDefDir = true;
  private connectedNodeIds = new Set<string>();
  private connectedEdgeIndexes: ConnectedEdgeIndex[] = [];
  private connectedNodeDepths = new Map<string, number>();

  setGraph(graph: Graph, opts?: { force?: boolean }) {
    if (!opts?.force && this.graph === graph && this.graphVersion === graph.getVersion) {
      return;
    }

    this.graph = graph;
    this.graphVersion = graph.getVersion;
    this.lastSourceId = undefined;
    this.nodeMap.clear();
    this.outgoingAdjacency.clear();
    this.incomingAdjacency.clear();
    this.edgeIndexes.clear();
    this.edgeHighlights.clear();
    this.connectedNodeIds.clear();
    this.connectedNodeDepths.clear();
    this.connectedEdgeIndexes = [];

    for (const node of graph.nodesBreadthFirst) {
      this.nodeMap.set(node.id, node);
      this.outgoingAdjacency.set(node.id, []);
      this.incomingAdjacency.set(node.id, []);
    }

    const hyperedgeFragmentIds = new Set<string>();
    for (const edges of graph.getWasmId2Edges ?? []) {
      if (!edges?.length) {
        continue;
      }

      for (const edge of edges) {
        hyperedgeFragmentIds.add(edge.id);
      }

      const firstEdge = edges[0];
      const lastEdge = edges[edges.length - 1];
      const edgeIds = edges.map((edge) => edge.id);
      const nodeIds = [firstEdge.source.id, lastEdge.target.id];

      this.addDirectedAdjacent(firstEdge.source, lastEdge.target, edges);

      for (const edge of edges) {
        this.addEdgeIndex(edge, {
          graphId: String((firstEdge.source.parent as Graph)?.id ?? ''),
          lineId: edge.lineId,
          arcId: firstEdge.arcId,
        });
        this.edgeHighlights.set(edge.id, { nodeIds, edgeIds });
      }
    }

    for (const edge of graph.deepEdges) {
      if (hyperedgeFragmentIds.has(edge.id)) {
        continue;
      }

      this.addDirectedAdjacent(edge.source, edge.target, [edge]);

      this.addEdgeIndex(edge);
      this.edgeHighlights.set(edge.id, {
        nodeIds: [edge.source.id, edge.target.id],
        edgeIds: [edge.id],
      });
    }

    this.update({ sourceId: null });
  }

  update(opts: { sourceId: string | null; maxDepth?: number; isDefDir?: boolean }) {
    const { sourceId, maxDepth = 1, isDefDir = true } = opts;
    if (sourceId === this.lastSourceId && maxDepth === this.lastMaxDepth && isDefDir === this.lastIsDefDir) {
      return;
    }

    this.lastSourceId = sourceId;
    this.lastEdgeId = null;
    this.lastMaxDepth = maxDepth;
    this.lastIsDefDir = isDefDir;
    this.connectedNodeIds = new Set<string>();
    this.connectedNodeDepths = new Map<string, number>();
    const connectedEdgeIds = new Set<string>();
    const connectedEdgeDepths = new Map<string, number>();

    if (!sourceId || !this.nodeMap.has(sourceId) || maxDepth < 1) {
      this.connectedEdgeIndexes = [];
      return;
    }

    this.connectedNodeIds.add(sourceId);
    this.connectedNodeDepths.set(sourceId, 0);
    const visited = new Set<string>([sourceId]);
    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: sourceId, depth: 0 }];

    for (let cursor = 0; cursor < queue.length; cursor++) {
      const current = queue[cursor];
      if (current.depth >= maxDepth) {
        continue;
      }

      const adjacency = isDefDir ? this.outgoingAdjacency : this.incomingAdjacency;
      for (const item of adjacency.get(current.nodeId) ?? []) {
        const nextDepth = current.depth + 1;
        for (const edge of item.edges) {
          connectedEdgeIds.add(edge.id);
          const prevDepth = connectedEdgeDepths.get(edge.id);
          if (prevDepth === undefined || nextDepth < prevDepth) {
            connectedEdgeDepths.set(edge.id, nextDepth);
          }
        }
        this.connectedNodeIds.add(item.nodeId);
        const prevNodeDepth = this.connectedNodeDepths.get(item.nodeId);
        if (prevNodeDepth === undefined || nextDepth < prevNodeDepth) {
          this.connectedNodeDepths.set(item.nodeId, nextDepth);
        }

        if (!visited.has(item.nodeId)) {
          visited.add(item.nodeId);
          queue.push({ nodeId: item.nodeId, depth: nextDepth });
        }
      }
    }

    this.connectedEdgeIndexes = Array.from(connectedEdgeIds)
      .map((edgeId) => this.edgeIndexes.get(edgeId))
      .filter((item): item is ConnectedEdgeIndex => Boolean(item))
      .map((item) => ({ ...item, depth: connectedEdgeDepths.get(item.edge.id) }));
  }

  updateEdge(opts: { edgeId: string | null }) {
    const { edgeId } = opts;
    if (edgeId === this.lastEdgeId) {
      return;
    }

    this.lastEdgeId = edgeId;
    this.lastSourceId = null;
    this.connectedNodeIds = new Set<string>();
    this.connectedNodeDepths = new Map<string, number>();

    if (!edgeId) {
      this.connectedEdgeIndexes = [];
      return;
    }

    const item = this.edgeHighlights.get(edgeId);
    if (!item) {
      this.connectedEdgeIndexes = [];
      return;
    }

    this.connectedNodeIds = new Set(item.nodeIds);
    item.nodeIds.forEach((nodeId) => this.connectedNodeDepths.set(nodeId, 0));
    this.connectedEdgeIndexes = item.edgeIds
      .map((id) => this.edgeIndexes.get(id))
      .filter((edgeIndex): edgeIndex is ConnectedEdgeIndex => Boolean(edgeIndex))
      .map((edgeIndex) => ({ ...edgeIndex, depth: 0 }));
  }

  getConnectedNodeIds(): Set<string> {
    return this.connectedNodeIds;
  }

  getConnectedNodeDepths(): Map<string, number> {
    return this.connectedNodeDepths;
  }

  getConnectedEdgeIndexes(): ConnectedEdgeIndex[] {
    return this.connectedEdgeIndexes;
  }

  getNode(id: string): Node | undefined {
    return this.nodeMap.get(id);
  }

  private addDirectedAdjacent(source: Node, target: Node, edges: Edge[]) {
    const outgoingItems = this.outgoingAdjacency.get(source.id);
    if (outgoingItems) {
      outgoingItems.push({ nodeId: target.id, edges });
    }

    if (source === target) {
      return;
    }

    const incomingItems = this.incomingAdjacency.get(target.id);
    if (incomingItems) {
      incomingItems.push({ nodeId: source.id, edges });
    }
  }

  private addEdgeIndex(edge: Edge, opts?: { graphId?: string; lineId?: number; arcId?: number }) {
    const lineId = opts?.lineId ?? edge.lineId;
    const arcId = opts?.arcId ?? edge.arcId;

    if (lineId === undefined && arcId === undefined) {
      return;
    }

    const graphId = opts?.graphId ?? String((edge.source.parent as Graph)?.id ?? '');
    this.edgeIndexes.set(edge.id, { graphId, lineId, arcId, edge });
  }
}
