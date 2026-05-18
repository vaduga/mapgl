import { Graph as MSGraph } from '@msagl/core';
import type { Node } from '@msagl/core';
import type { Edge } from './edge';

export type Graph = Node & {
  id: string;
  addNode(n: Node | Graph): Node | Graph;
  deepEdges: IterableIterator<Edge>;
  edgeCount: number;
  findNode(id: string): Node | Graph | undefined;
  findNodeRecursive(id: string): Node | Graph | undefined;
  graphs(): IterableIterator<Graph>;
  nodesBreadthFirst: IterableIterator<Node | Graph>;
  shallowEdges: IterableIterator<Edge>;
  shallowNodes: IterableIterator<Node | Graph>;
  subgraphsBreadthFirst(): IterableIterator<Graph>;
  remove(node: Node | Graph): void;
  removeNode(node: Node | Graph): void;
  nodeCollection: any;
  getNodes: IterableIterator<Node | Graph>;
};

export const Graph = MSGraph as unknown as {
  new (id?: string): Graph;
  prototype: Graph;
};
