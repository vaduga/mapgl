import { Edge } from './edge';
import { Graph } from './graph';
import { Node } from './node';
import { resetGraphState } from './graphState';
import { AttributeRegistry } from './attributeRegistry';

const edgeMaps = new WeakMap<object, Record<string, Edge>>();

function getEdgeMap(graph: Graph): Record<string, Edge> {
  let edgeMap = edgeMaps.get(graph);
  if (!edgeMap) {
    edgeMap = {};
    edgeMaps.set(graph, edgeMap);
  }
  return edgeMap;
}

export function getGraphNodeCollection(graph: Graph): any {
  return (graph as any).nodeCollection;
}

export function getGraphNodeMap(graph: Graph): Map<string, Node> {
  const nodeCollection = getGraphNodeCollection(graph);
  return (nodeCollection as any).getNodeMap ?? (nodeCollection as any).nodeMap;
}

export function getGraphEdges(graph: Graph): IterableIterator<Edge> {
  return getGraphNodeCollection(graph).edges as IterableIterator<Edge>;
}

export function getGraphNodes(graph: Graph): IterableIterator<Node | Graph> {
  return getGraphNodeCollection(graph).nodesShallow as IterableIterator<Node | Graph>;
}

export function getGraphData(graph: Graph): any {
  return graph.getAttr(AttributeRegistry.NodeDataIndex);
}

export function setGraphData(graph: Graph, data: any): void {
  graph.setAttr(AttributeRegistry.NodeDataIndex, data);
}

export function findEdge(graph: Graph, edgeId: string | number): Edge | undefined {
  return getEdgeMap(graph)[edgeId];
}

export function setEdge(
  graph: Graph,
  id: string,
  sourceId: string,
  targetId: string,
  targetGraph?: Graph
): Edge | undefined {
  const source = getGraphNodeCollection(graph).findShallow(sourceId);
  if (!source) {
    return;
  }

  const targetCollection = targetGraph ? getGraphNodeCollection(targetGraph) : getGraphNodeCollection(graph);
  const target = targetCollection.findShallow(targetId);
  if (!target) {
    return;
  }

  const edge = new Edge(id, source, target);
  getEdgeMap(graph)[id] = edge;
  return edge;
}

export function resetGraphNodes(graph: Graph): void {
  const NodeCollection = getGraphNodeCollection(graph).constructor;
  (graph as any).nodeCollection = new NodeCollection();
  edgeMaps.delete(graph);
  resetGraphState(graph);
}

export function resetGraph(graph: Graph): void {
  resetGraphNodes(graph);
}
