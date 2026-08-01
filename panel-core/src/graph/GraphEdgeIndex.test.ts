import { GraphEdgeIndex, INVALID_VERTEX_REF } from './GraphEdgeIndex';
import type { Edge } from './structs/edge';

const edge = (id: string) => ({ id }) as Edge;

describe('flat graph edge index', () => {
  it('tracks flat record, unit, edge-owner, segment, vertex, layout, and metric ranges', () => {
    const a = edge('a');
    const b = edge('b');
    const c = edge('c');
    const index = new GraphEdgeIndex();
    index.appendRecord({
      recordRef: 0,
      units: [
        { unitRef: 0, edges: [a, b] },
        { unitRef: 1, edges: [] },
      ],
      vertexRefs: [0, undefined, 1],
      layerIndex: 4,
      wrap: -1,
    });
    index.appendRecord({
      recordRef: 1,
      units: [{ unitRef: 2, edges: [c] }],
      vertexRefs: [2, 3],
      layerIndex: 5,
      wrap: 2,
      metrics: { primary: 7, sideA: 8, sideB: 9 },
    });
    index.finalize();

    expect(index.recordCount).toBe(2);
    expect(index.unitCount).toBe(3);
    expect(index.edgeCount).toBe(3);
    expect(index.getRecordRange(0)).toEqual([0, 2]);
    expect(index.getUnitRange(1)).toEqual([2, 2]);
    expect([...index.recordEdges(0)]).toEqual([a, b]);
    expect(index.getFirstRecordEdge(1)).toBe(c);
    expect(index.getLastRecordEdge(0)).toBe(b);
    expect(index.getEdgeRecordRef(2)).toBe(1);
    expect(index.getEdgeUnitRef(1)).toBe(0);
    expect(index.getEdgeSegmentOrdinal(1)).toBe(1);
    expect(index.getEdgeRef(c)).toBe(2);
    expect(index.getRecordVertexView(0)).toEqual(new Int32Array([0, INVALID_VERTEX_REF, 1]));
    expect(index.getRecordLayerIndex(0)).toBe(4);
    expect(index.getRecordWrap(0)).toBe(-1);
    expect(index.getRecordMetrics(1)).toEqual({ primary: 7, sideA: 8, sideB: 9 });
    expect(index).not.toHaveProperty('wasm2Edges');
    expect(index).not.toHaveProperty('edgeVerticeIds');
  });

  it('isolates mutable typed state when cloning and fully resets', () => {
    const index = new GraphEdgeIndex();
    index.appendRecord({
      recordRef: 0,
      units: [{ unitRef: 0, edges: [edge('a')] }],
      vertexRefs: [0, 1],
      layerIndex: 0,
      wrap: 0,
    });
    const clone = index.finalize().clone();

    clone.setRecordMetrics(0, 3, 4, 5);
    clone.replaceRecordVertexRefs(0, [0, undefined, 2, 3]);
    expect(index.getRecordMetrics(0)).toEqual({ primary: 0 });
    expect(clone.getRecordMetrics(0)).toEqual({ primary: 3, sideA: 4, sideB: 5 });
    expect(index.getRecordVertexView(0)).toEqual(new Int32Array([0, 1]));
    expect(clone.getRecordVertexView(0)).toEqual(new Int32Array([0, INVALID_VERTEX_REF, 2, 3]));

    clone.reset();
    expect(clone.recordCount).toBe(0);
    expect(clone.unitCount).toBe(0);
    expect(clone.edgeCount).toBe(0);
    expect(index.recordCount).toBe(1);
  });

  it('replaces one finalized unit while keeping flat owners and offsets reversible', () => {
    const first = edge('first');
    const second = edge('second');
    const third = edge('third');
    const fourth = edge('fourth');
    const replacementA = edge('replacement-a');
    const replacementB = edge('replacement-b');
    const index = new GraphEdgeIndex();
    index.appendRecord({
      recordRef: 0,
      units: [
        { unitRef: 0, edges: [first] },
        { unitRef: 1, edges: [second] },
      ],
      vertexRefs: [0, 1],
      layerIndex: 0,
      wrap: 0,
    });
    index.appendRecord({
      recordRef: 1,
      units: [{ unitRef: 2, edges: [third, fourth] }],
      vertexRefs: [2, 3, 4],
      layerIndex: 0,
      wrap: 0,
    });
    index.finalize();

    expect(index.replaceUnitEdges(1, [replacementA, replacementB])).toEqual([1, 3]);
    expect(index.getRecordRange(0)).toEqual([0, 3]);
    expect(index.getRecordRange(1)).toEqual([3, 5]);
    expect(index.getUnitRange(1)).toEqual([1, 3]);
    expect(index.getUnitRange(2)).toEqual([3, 5]);
    expect(index.getEdgeRef(replacementA)).toBe(1);
    expect(index.getEdgeRef(third)).toBe(3);
    expect(index.getEdgeRecordRef(2)).toBe(0);
    expect(index.getEdgeUnitRef(2)).toBe(1);
    expect(index.getEdgeSegmentOrdinal(2)).toBe(1);
    expect(index.getEdgeRecordRef(3)).toBe(1);
    expect(index.getEdgeUnitRef(3)).toBe(2);

    expect(index.replaceUnitEdges(0, [])).toEqual([0, 0]);
    expect(index.getRecordRange(0)).toEqual([0, 2]);
    expect(index.getUnitRange(0)).toEqual([0, 0]);
    expect(index.getUnitRange(1)).toEqual([0, 2]);
    expect(index.getEdgeRef(replacementA)).toBe(0);
  });
});
