import { Edge } from '@msagl/core';

export type EdgeTuple = [Array<number | undefined>, number, number, number, number?, number?];

export class GraphEdgeIndex {
  wasm2Edges: Edge[][] = [];
  edgeVerticeIds: EdgeTuple[] = [];

  reset() {
    this.wasm2Edges = [];
    this.edgeVerticeIds = [];
  }
}
