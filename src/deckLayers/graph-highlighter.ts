import type { Edge, Graph, Node } from 'mapLib';

export type ConnectedEdgeIndex = {
  graphId: string;
  lineId?: number;
  arcId?: number;
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
  private adjacency = new Map<string, AdjacentItem[]>();
  private edgeIndexes = new Map<string, ConnectedEdgeIndex>();
  private edgeHighlights = new Map<string, EdgeHighlightItem>();
  private lastSourceId?: string | null;
  private lastEdgeId?: string | null;
  private lastMaxDepth = 1;
  private connectedNodeIds = new Set<string>();
  private connectedEdgeIndexes: ConnectedEdgeIndex[] = [];

  setGraph(graph: Graph, opts?: { force?: boolean }) {
    if (!opts?.force && this.graph === graph && this.graphVersion === graph.getVersion) {
      return;
    }

    this.graph = graph;
    this.graphVersion = graph.getVersion;
    this.lastSourceId = undefined;
    this.nodeMap.clear();
    this.adjacency.clear();
    this.edgeIndexes.clear();
    this.edgeHighlights.clear();
    this.connectedNodeIds.clear();
    this.connectedEdgeIndexes = [];

    for (const node of graph.nodesBreadthFirst) {
      this.nodeMap.set(node.id, node);
      this.adjacency.set(node.id, []);
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

      this.addAdjacent(firstEdge.source, lastEdge.target, edges);
      if (firstEdge.source !== lastEdge.target) {
        this.addAdjacent(lastEdge.target, firstEdge.source, edges);
      }

      for (const edge of edges) {
        this.addEdgeIndex(edge);
        this.edgeHighlights.set(edge.id, { nodeIds, edgeIds });
      }
    }

    for (const edge of graph.deepEdges) {
      if (hyperedgeFragmentIds.has(edge.id)) {
        continue;
      }

      this.addAdjacent(edge.source, edge.target, [edge]);
      if (edge.source !== edge.target) {
        this.addAdjacent(edge.target, edge.source, [edge]);
      }

      this.addEdgeIndex(edge);
      this.edgeHighlights.set(edge.id, {
        nodeIds: [edge.source.id, edge.target.id],
        edgeIds: [edge.id],
      });
    }

    this.update({ sourceId: null });
  }

  update(opts: { sourceId: string | null; maxDepth?: number }) {
    const { sourceId, maxDepth = 1 } = opts;
    if (sourceId === this.lastSourceId && maxDepth === this.lastMaxDepth) {
      return;
    }

    this.lastSourceId = sourceId;
    this.lastEdgeId = null;
    this.lastMaxDepth = maxDepth;
    this.connectedNodeIds = new Set<string>();
    const connectedEdgeIds = new Set<string>();

    if (!sourceId || !this.nodeMap.has(sourceId) || maxDepth < 1) {
      this.connectedEdgeIndexes = [];
      return;
    }

    this.connectedNodeIds.add(sourceId);
    const visited = new Set<string>([sourceId]);
    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: sourceId, depth: 0 }];

    for (let cursor = 0; cursor < queue.length; cursor++) {
      const current = queue[cursor];
      if (current.depth >= maxDepth) {
        continue;
      }

      for (const item of this.adjacency.get(current.nodeId) ?? []) {
        for (const edge of item.edges) {
          connectedEdgeIds.add(edge.id);
        }
        this.connectedNodeIds.add(item.nodeId);

        if (!visited.has(item.nodeId)) {
          visited.add(item.nodeId);
          queue.push({ nodeId: item.nodeId, depth: current.depth + 1 });
        }
      }
    }

    this.connectedEdgeIndexes = Array.from(connectedEdgeIds)
      .map((edgeId) => this.edgeIndexes.get(edgeId))
      .filter((item): item is ConnectedEdgeIndex => Boolean(item));
  }

  updateEdge(opts: { edgeId: string | null }) {
    const { edgeId } = opts;
    if (edgeId === this.lastEdgeId) {
      return;
    }

    this.lastEdgeId = edgeId;
    this.lastSourceId = null;
    this.connectedNodeIds = new Set<string>();

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
    this.connectedEdgeIndexes = item.edgeIds
      .map((id) => this.edgeIndexes.get(id))
      .filter((edgeIndex): edgeIndex is ConnectedEdgeIndex => Boolean(edgeIndex));
  }

  getConnectedNodeIds(): Set<string> {
    return this.connectedNodeIds;
  }

  getConnectedEdgeIndexes(): ConnectedEdgeIndex[] {
    return this.connectedEdgeIndexes;
  }

  getNode(id: string): Node | undefined {
    return this.nodeMap.get(id);
  }

  private addAdjacent(source: Node, target: Node, edges: Edge[]) {
    const items = this.adjacency.get(source.id);
    if (items) {
      items.push({ nodeId: target.id, edges });
    }
  }

  private addEdgeIndex(edge: Edge) {
    if (edge.lineId === undefined && edge.arcId === undefined) {
      return;
    }

    const graphId = String((edge.source.parent as Graph)?.id ?? '');
    this.edgeIndexes.set(edge.id, { graphId, lineId: edge.lineId, arcId: edge.arcId, edge });
  }
}
