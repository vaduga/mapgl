import { Graph } from '@mapgl/panel-core/graph';

export function parseRoute(dsTarget: unknown) {
  if (typeof dsTarget === 'string' && (dsTarget.startsWith('[') || !parseInt(dsTarget, 10))) {
    try {
      return JSON.parse(dsTarget) ?? dsTarget;
    } catch (error) {
      return dsTarget ?? null;
    }
  }

  return dsTarget ?? null;
}

export function findSubgraphById(graph: Graph, id: string): Graph | undefined {
  if (graph.id === id) {
    return graph;
  }

  for (const sub of graph.graphs()) {
    const found = findSubgraphById(sub, id);
    if (found) {
      return found;
    }
  }

  return undefined;
}
