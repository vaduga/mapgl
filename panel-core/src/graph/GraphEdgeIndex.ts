import type { Edge } from './structs/edge';

export const INVALID_VERTEX_REF = -1;

export interface GraphEdgeIndexUnitInput {
  readonly unitRef: number;
  readonly edges: readonly Edge[];
}

export interface GraphEdgeIndexRecordInput {
  readonly recordRef: number;
  readonly units: readonly GraphEdgeIndexUnitInput[];
  readonly vertexRefs: ReadonlyArray<number | undefined>;
  readonly layerIndex: number;
  readonly wrap: number;
  readonly metrics?: {
    readonly primary?: number;
    readonly sideA?: number;
    readonly sideB?: number;
  };
}

export class GraphEdgeIndex {
  private edgePool: Edge[] = [];
  private stagedRecordUnitOffsets: number[] = [0];
  private stagedUnitOffsets: number[] = [0];
  private stagedEdgeRecordRefs: number[] = [];
  private stagedEdgeUnitRefs: number[] = [];
  private stagedVertexOffsets: number[] = [0];
  private stagedVertexRefs: number[] = [];
  private stagedLayoutValues: number[] = [];
  private stagedMetrics: number[] = [];

  private recordUnitOffsets = new Uint32Array([0]);
  private unitOffsets = new Uint32Array([0]);
  private edgeRecordRefs = new Uint32Array();
  private edgeUnitRefs = new Uint32Array();
  private vertexOffsets = new Uint32Array([0]);
  private vertexRefs = new Int32Array();
  private layoutValues = new Int32Array();
  private metrics = new Float64Array();
  private edgeRefs = new WeakMap<Edge, number>();
  private finalized = false;

  get recordCount(): number {
    return (this.finalized ? this.recordUnitOffsets : this.stagedRecordUnitOffsets).length - 1;
  }

  get unitCount(): number {
    return (this.finalized ? this.unitOffsets : this.stagedUnitOffsets).length - 1;
  }

  get edgeCount(): number {
    return this.edgePool.length;
  }

  appendRecord(input: GraphEdgeIndexRecordInput): void {
    if (this.finalized) {
      throw new Error('Cannot append to a finalized graph edge index');
    }
    if (input.recordRef !== this.recordCount) {
      throw new Error(`Expected recordRef ${this.recordCount}, received ${input.recordRef}`);
    }

    for (const unit of input.units) {
      if (unit.unitRef !== this.unitCount) {
        throw new Error(`Expected unitRef ${this.unitCount}, received ${unit.unitRef}`);
      }
      unit.edges.forEach((edge) => {
        this.stagedEdgeRecordRefs.push(input.recordRef);
        this.stagedEdgeUnitRefs.push(unit.unitRef);
        this.edgePool.push(edge);
      });
      this.stagedUnitOffsets.push(this.edgePool.length);
    }

    this.stagedRecordUnitOffsets.push(this.unitCount);
    for (const vertexRef of input.vertexRefs) {
      this.stagedVertexRefs.push(vertexRef ?? INVALID_VERTEX_REF);
    }
    this.stagedVertexOffsets.push(this.stagedVertexRefs.length);
    this.stagedLayoutValues.push(input.layerIndex, input.wrap);
    this.stagedMetrics.push(
      input.metrics?.primary ?? 0,
      input.metrics?.sideA ?? Number.NaN,
      input.metrics?.sideB ?? Number.NaN
    );
  }

  finalize(): this {
    if (this.finalized) {
      return this;
    }
    this.recordUnitOffsets = Uint32Array.from(this.stagedRecordUnitOffsets);
    this.unitOffsets = Uint32Array.from(this.stagedUnitOffsets);
    this.edgeRecordRefs = Uint32Array.from(this.stagedEdgeRecordRefs);
    this.edgeUnitRefs = Uint32Array.from(this.stagedEdgeUnitRefs);
    this.vertexOffsets = Uint32Array.from(this.stagedVertexOffsets);
    this.vertexRefs = Int32Array.from(this.stagedVertexRefs);
    this.layoutValues = Int32Array.from(this.stagedLayoutValues);
    this.metrics = Float64Array.from(this.stagedMetrics);
    this.edgeRefs = new WeakMap(this.edgePool.map((edge, edgeRef) => [edge, edgeRef] as const));
    this.releaseStaging();
    this.finalized = true;
    return this;
  }

  getRecordRange(recordRef: number): readonly [number, number] {
    this.assertRecordRef(recordRef);
    const recordOffsets = this.finalized ? this.recordUnitOffsets : this.stagedRecordUnitOffsets;
    const unitOffsets = this.finalized ? this.unitOffsets : this.stagedUnitOffsets;
    return [unitOffsets[recordOffsets[recordRef]], unitOffsets[recordOffsets[recordRef + 1]]];
  }

  getUnitRange(unitRef: number): readonly [number, number] {
    this.assertUnitRef(unitRef);
    const offsets = this.finalized ? this.unitOffsets : this.stagedUnitOffsets;
    return [offsets[unitRef], offsets[unitRef + 1]];
  }

  getEdge(edgeRef: number): Edge {
    this.assertEdgeRef(edgeRef);
    return this.edgePool[edgeRef];
  }

  getEdgeRef(edge: Edge): number | undefined {
    this.ensureFinalized();
    return this.edgeRefs.get(edge);
  }

  getEdgeRecordRef(edgeRef: number): number {
    this.assertEdgeRef(edgeRef);
    return (this.finalized ? this.edgeRecordRefs : this.stagedEdgeRecordRefs)[edgeRef];
  }

  getEdgeUnitRef(edgeRef: number): number {
    this.assertEdgeRef(edgeRef);
    return (this.finalized ? this.edgeUnitRefs : this.stagedEdgeUnitRefs)[edgeRef];
  }

  getEdgeSegmentOrdinal(edgeRef: number): number {
    this.assertEdgeRef(edgeRef);
    const unitRef = this.getEdgeUnitRef(edgeRef);
    const [unitStart] = this.getUnitRange(unitRef);
    return edgeRef - unitStart;
  }

  getFirstRecordEdge(recordRef: number): Edge | undefined {
    const [start, end] = this.getRecordRange(recordRef);
    return start < end ? this.edgePool[start] : undefined;
  }

  getLastRecordEdge(recordRef: number): Edge | undefined {
    const [start, end] = this.getRecordRange(recordRef);
    return start < end ? this.edgePool[end - 1] : undefined;
  }

  getRecordEdge(recordRef: number, offset: number): Edge | undefined {
    const [start, end] = this.getRecordRange(recordRef);
    const edgeRef = start + offset;
    return Number.isInteger(offset) && offset >= 0 && edgeRef < end ? this.edgePool[edgeRef] : undefined;
  }

  forEachEdge(callback: (edge: Edge, edgeRef: number) => void): void {
    this.edgePool.forEach(callback);
  }

  forEachRecordEdge(recordRef: number, callback: (edge: Edge, edgeRef: number) => void): void {
    const [start, end] = this.getRecordRange(recordRef);
    for (let edgeRef = start; edgeRef < end; edgeRef++) {
      callback(this.edgePool[edgeRef], edgeRef);
    }
  }

  forEachUnitEdge(unitRef: number, callback: (edge: Edge, edgeRef: number) => void): void {
    const [start, end] = this.getUnitRange(unitRef);
    for (let edgeRef = start; edgeRef < end; edgeRef++) {
      callback(this.edgePool[edgeRef], edgeRef);
    }
  }

  *recordEdges(recordRef: number): IterableIterator<Edge> {
    const [start, end] = this.getRecordRange(recordRef);
    for (let edgeRef = start; edgeRef < end; edgeRef++) {
      yield this.edgePool[edgeRef];
    }
  }

  getRecordVertexView(recordRef: number): Int32Array {
    this.ensureFinalized();
    this.assertRecordRef(recordRef);
    return this.vertexRefs.subarray(this.vertexOffsets[recordRef], this.vertexOffsets[recordRef + 1]);
  }

  replaceRecordVertexRefs(recordRef: number, vertexRefs: ReadonlyArray<number | undefined>): Int32Array {
    this.ensureFinalized();
    this.assertRecordRef(recordRef);
    const start = this.vertexOffsets[recordRef];
    const end = this.vertexOffsets[recordRef + 1];
    const replacement = Int32Array.from(vertexRefs, (vertexRef) => vertexRef ?? INVALID_VERTEX_REF);
    const next = new Int32Array(this.vertexRefs.length - (end - start) + replacement.length);
    next.set(this.vertexRefs.subarray(0, start));
    next.set(replacement, start);
    next.set(this.vertexRefs.subarray(end), start + replacement.length);
    const delta = replacement.length - (end - start);
    for (let nextRecordRef = recordRef + 1; nextRecordRef < this.vertexOffsets.length; nextRecordRef++) {
      this.vertexOffsets[nextRecordRef] += delta;
    }
    this.vertexRefs = next;
    return this.getRecordVertexView(recordRef);
  }

  replaceUnitEdges(unitRef: number, edges: readonly Edge[]): readonly [number, number] {
    this.ensureFinalized();
    this.assertUnitRef(unitRef);
    const [start, end] = this.getUnitRange(unitRef);
    const recordRef = this.findUnitRecordRef(unitRef);
    const replacement = [...edges];
    const delta = replacement.length - (end - start);

    this.edgePool = [...this.edgePool.slice(0, start), ...replacement, ...this.edgePool.slice(end)];
    this.edgeRecordRefs = replaceUint32Range(
      this.edgeRecordRefs,
      start,
      end,
      replacement.map(() => recordRef)
    );
    this.edgeUnitRefs = replaceUint32Range(
      this.edgeUnitRefs,
      start,
      end,
      replacement.map(() => unitRef)
    );
    for (let nextUnitRef = unitRef + 1; nextUnitRef < this.unitOffsets.length; nextUnitRef++) {
      this.unitOffsets[nextUnitRef] += delta;
    }
    this.edgeRefs = new WeakMap(this.edgePool.map((edge, edgeRef) => [edge, edgeRef] as const));
    return [start, start + replacement.length];
  }

  getRecordLayerIndex(recordRef: number): number {
    this.assertRecordRef(recordRef);
    return (this.finalized ? this.layoutValues : this.stagedLayoutValues)[recordRef * 2];
  }

  getRecordWrap(recordRef: number): number {
    this.assertRecordRef(recordRef);
    return (this.finalized ? this.layoutValues : this.stagedLayoutValues)[recordRef * 2 + 1];
  }

  getRecordMetrics(recordRef: number): Readonly<{ primary: number; sideA?: number; sideB?: number }> {
    this.assertRecordRef(recordRef);
    const metrics = this.finalized ? this.metrics : this.stagedMetrics;
    const offset = recordRef * 3;
    return Object.freeze({
      primary: metrics[offset],
      ...(!Number.isNaN(metrics[offset + 1]) && { sideA: metrics[offset + 1] }),
      ...(!Number.isNaN(metrics[offset + 2]) && { sideB: metrics[offset + 2] }),
    });
  }

  setRecordMetrics(recordRef: number, primary: number, sideA?: number, sideB?: number): void {
    this.ensureFinalized();
    this.assertRecordRef(recordRef);
    const offset = recordRef * 3;
    this.metrics[offset] = primary;
    this.metrics[offset + 1] = sideA ?? Number.NaN;
    this.metrics[offset + 2] = sideB ?? Number.NaN;
  }

  clone(): GraphEdgeIndex {
    this.ensureFinalized();
    const clone = new GraphEdgeIndex();
    clone.edgePool = [...this.edgePool];
    clone.recordUnitOffsets = this.recordUnitOffsets.slice();
    clone.unitOffsets = this.unitOffsets.slice();
    clone.edgeRecordRefs = this.edgeRecordRefs.slice();
    clone.edgeUnitRefs = this.edgeUnitRefs.slice();
    clone.vertexOffsets = this.vertexOffsets.slice();
    clone.vertexRefs = this.vertexRefs.slice();
    clone.layoutValues = this.layoutValues.slice();
    clone.metrics = this.metrics.slice();
    clone.edgeRefs = new WeakMap(clone.edgePool.map((edge, edgeRef) => [edge, edgeRef] as const));
    clone.releaseStaging();
    clone.finalized = true;
    return clone;
  }

  reset(): void {
    this.edgePool = [];
    this.stagedRecordUnitOffsets = [0];
    this.stagedUnitOffsets = [0];
    this.stagedEdgeRecordRefs = [];
    this.stagedEdgeUnitRefs = [];
    this.stagedVertexOffsets = [0];
    this.stagedVertexRefs = [];
    this.stagedLayoutValues = [];
    this.stagedMetrics = [];
    this.recordUnitOffsets = new Uint32Array([0]);
    this.unitOffsets = new Uint32Array([0]);
    this.edgeRecordRefs = new Uint32Array();
    this.edgeUnitRefs = new Uint32Array();
    this.vertexOffsets = new Uint32Array([0]);
    this.vertexRefs = new Int32Array();
    this.layoutValues = new Int32Array();
    this.metrics = new Float64Array();
    this.edgeRefs = new WeakMap();
    this.finalized = false;
  }

  private ensureFinalized(): void {
    if (!this.finalized) {
      this.finalize();
    }
  }

  private assertRecordRef(recordRef: number): void {
    if (!Number.isInteger(recordRef) || recordRef < 0 || recordRef >= this.recordCount) {
      throw new RangeError(`Record reference ${recordRef} is out of range`);
    }
  }

  private assertUnitRef(unitRef: number): void {
    if (!Number.isInteger(unitRef) || unitRef < 0 || unitRef >= this.unitCount) {
      throw new RangeError(`Unit reference ${unitRef} is out of range`);
    }
  }

  private assertEdgeRef(edgeRef: number): void {
    if (!Number.isInteger(edgeRef) || edgeRef < 0 || edgeRef >= this.edgePool.length) {
      throw new RangeError(`Edge reference ${edgeRef} is out of range`);
    }
  }

  private findUnitRecordRef(unitRef: number): number {
    let low = 0;
    let high = this.recordCount;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (this.recordUnitOffsets[middle + 1] <= unitRef) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    return low;
  }

  private releaseStaging(): void {
    this.stagedRecordUnitOffsets = [];
    this.stagedUnitOffsets = [];
    this.stagedEdgeRecordRefs = [];
    this.stagedEdgeUnitRefs = [];
    this.stagedVertexOffsets = [];
    this.stagedVertexRefs = [];
    this.stagedLayoutValues = [];
    this.stagedMetrics = [];
  }
}

function replaceUint32Range(
  source: Uint32Array<ArrayBuffer>,
  start: number,
  end: number,
  replacement: readonly number[]
): Uint32Array<ArrayBuffer> {
  const next = new Uint32Array(source.length - (end - start) + replacement.length);
  next.set(source.subarray(0, start));
  next.set(replacement, start);
  next.set(source.subarray(end), start + replacement.length);
  return next;
}
