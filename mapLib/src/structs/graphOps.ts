import { Edge, Graph, type Node } from '@msagl/core';
import type { EdgeData, NodeData } from '../utils/interfaces';
import { resetGraphState } from './graphState';
import { AttributeRegistry } from './attributeRegistry';

const edgeMaps = new WeakMap<object, Record<string, Edge>>();
const edgeLineIds = new WeakMap<Edge, number>();
const edgeArcIds = new WeakMap<Edge, number>();
const edgeTilts = new WeakMap<Edge, { tiltDist: number; isOutgoing: boolean }>();

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

export function getGraphNodes(graph: Graph): IterableIterator<Node> {
  return getGraphNodeCollection(graph).nodesShallow as IterableIterator<Node>;
}

export function getGraphData(graph: Graph): any {
  return graph.getAttr(AttributeRegistry.NodeDataIndex);
}

export function setGraphData(graph: Graph, data: any): void {
  graph.setAttr(AttributeRegistry.NodeDataIndex, data);
}

export function getNodeData(node: Node): NodeData | undefined {
  return node.getAttr(AttributeRegistry.NodeDataIndex);
}

export function setNodeData(node: Node, data: NodeData): void {
  node.setAttr(AttributeRegistry.NodeDataIndex, data);
}

export function setEntityAttrProp(entity: { getAttr(position: number): any }, position: number, key: string, val: any): void {
  const attributes = entity.getAttr(position);
  if (attributes) {
    attributes[key] = val;
  }
}

export function getEdgeId(edge: Edge): string {
  const data = getEdgeData(edge);
  return data?.id ?? data?.edgeId ?? edge.toString();
}

export function getEdgeData(edge: Edge): EdgeData | undefined {
  return edge.getAttr(AttributeRegistry.EdgeDataIndex);
}

function setEdgeData(edge: Edge, data: EdgeData): void {
  edge.setAttr(AttributeRegistry.EdgeDataIndex, data);
}

export function getEdgeLineId(edge: Edge): number | undefined {
  return edgeLineIds.get(edge);
}

export function setEdgeLineId(edge: Edge, lineId: number | undefined): void {
  if (lineId === undefined) {
    edgeLineIds.delete(edge);
  } else {
    edgeLineIds.set(edge, lineId);
  }
}

export function getEdgeArcId(edge: Edge): number | undefined {
  return edgeArcIds.get(edge);
}

export function setEdgeArcId(edge: Edge, arcId: number | undefined): void {
  if (arcId === undefined) {
    edgeArcIds.delete(edge);
  } else {
    edgeArcIds.set(edge, arcId);
  }
}

export function getEdgeTilt(edge: Edge): { tiltDist: number; isOutgoing: boolean } | undefined {
  return edgeTilts.get(edge);
}

export function setEdgeTilt(edge: Edge, tiltDist: number, isOutgoing: boolean): void {
  edgeTilts.set(edge, { tiltDist, isOutgoing });
}

export function findEdge(graph: Graph, edgeId: string | number): Edge | undefined {
  return getEdgeMap(graph)[edgeId];
}

export function setEdge(
  graph: Graph,
  id: string,
  sourceId: string,
  targetId: string,
  data: EdgeData,
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

  const edge = new Edge(source, target);
  setEdgeData(edge, { ...data, id });
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
