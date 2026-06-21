import { Edge } from './structs/edge';

export type EdgeTuple = [Array<number | undefined>, number, number, number, number?, number?];

export class GraphEdgeIndex {
  wasm2Edges: Edge[][] = [];
  edgeVerticeIds: EdgeTuple[] = [];

  reset() {
    this.wasm2Edges = [];
    this.edgeVerticeIds = [];
  }
}
