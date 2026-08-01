import { GraphDiagnosticCollector } from './diagnostics';
import {
  PACKED_INVALID_REF,
  PACKED_ROUTE_COORDINATE_TAG,
  PackedGraphRelationsBuilder,
  PackedRelationCapacityError,
  PackedRelationFlags,
  assertPackedGraphRelations,
  decodeRouteRef,
  encodeCoordinateToken,
  isCoordinateToken,
} from './packedRelations';
import type { GraphRowRef } from './types';

const namespace = 'external';
const key = (id: string) => JSON.stringify([namespace, id]);
const nodeIds = ['A', 'B', 'C', 'D'];
const nodeRefByKey = new Map(nodeIds.map((id, index) => [key(id), index] as const));
const nodeIdAt = (nodeRef: number) => nodeIds[nodeRef];

function row(rowIndex: number): GraphRowRef {
  return { frameIndex: 0, frameRefId: 'Packed', rowIndex };
}

function begin(
  builder: PackedGraphRelationsBuilder,
  {
    relationKey,
    id,
    source,
    target,
    rowIndex,
    explicitId,
  }: {
    relationKey: string;
    id: string;
    source: string;
    target: string;
    rowIndex: number;
    explicitId: boolean;
  }
) {
  builder.beginUnit({
    key: relationKey,
    id,
    sourceKey: key(source),
    targetKey: key(target),
    targetId: target,
    row: row(rowIndex),
    explicitId,
    diagnosticContext: {
      layerName: 'packed test',
      frameIndex: 0,
      frameRefId: 'Packed',
      fieldName: 'target',
      rowIndex,
    },
  });
}

describe('packed relation token encoding', () => {
  it('distinguishes coordinate and node references without losing the payload', () => {
    const token = encodeCoordinateToken(42);

    expect((token & PACKED_ROUTE_COORDINATE_TAG) >>> 0).toBe(PACKED_ROUTE_COORDINATE_TAG);
    expect(isCoordinateToken(token)).toBe(true);
    expect(decodeRouteRef(token)).toBe(42);
    expect(isCoordinateToken(42)).toBe(false);
    expect(decodeRouteRef(42)).toBe(42);
    expect(PACKED_INVALID_REF).toBe(0xffffffff);
  });
});

describe('packed graph relation builder and readers', () => {
  it('compacts interleaved units by first-seen record and preserves engine ordinals', () => {
    const builder = new PackedGraphRelationsBuilder();

    begin(builder, {
      relationKey: 'trace-key',
      id: 'trace',
      source: 'A',
      target: 'B',
      rowIndex: 0,
      explicitId: true,
    });
    builder.pushNodeKey(key('A'), 'A');
    builder.pushCoordinate(15, 55, { elevation: 0, commentText: 'handoff', iconColor: 'green' });
    builder.pushNodeKey(key('B'), 'B');
    builder.finishUnit();

    begin(builder, {
      relationKey: 'parallel-key',
      id: 'parallel',
      source: 'A',
      target: 'B',
      rowIndex: 1,
      explicitId: true,
    });
    builder.pushNodeKey(key('A'), 'A');
    builder.pushNodeKey(key('B'), 'B');
    builder.finishUnit();

    begin(builder, {
      relationKey: 'trace-key',
      id: 'trace',
      source: 'B',
      target: 'C',
      rowIndex: 2,
      explicitId: true,
    });
    builder.pushNodeKey(key('B'), 'B');
    builder.pushNodeKey(key('C'), 'C');
    builder.finishUnit();

    const store = builder.finalize({ nodeRefByKey });

    expect(store.recordCount).toBe(2);
    expect(store.unitCount).toBe(3);
    expect(store.getRecordKey(0)).toBe('trace-key');
    expect(store.getRecordKey(1)).toBe('parallel-key');
    expect(store.getRecordSourceNodeRef(0)).toBe(0);
    expect(store.getRecordTargetNodeRef(0)).toBe(2);
    expect(store.getRecordUnitStart(0)).toBe(0);
    expect(store.getRecordUnitCount(0)).toBe(2);
    expect(store.getRecordUnitStart(1)).toBe(2);
    expect(store.getRecordUnitCount(1)).toBe(1);
    expect([0, 1, 2].map((unitRef) => store.getUnitRow(unitRef).rowIndex)).toEqual([0, 2, 1]);
    expect(store.getRecordFlags(0) & PackedRelationFlags.explicitId).toBeTruthy();

    expect(store.materializeRecordRoute(0, nodeIdAt)).toEqual(['A', [15, 55, 0, 'handoff', 'green'], 'B', 'C']);
    expect(store.materializeUnitRoute(0, nodeIdAt)).toEqual(['A', [15, 55, 0, 'handoff', 'green'], 'B']);
    expect(store.materializeUnitRoute(1, nodeIdAt)).toEqual(['B', 'C']);
    expect(store.materializeUnitRoute(2, nodeIdAt)).toEqual(['A', 'B']);
    expect(store.coordinateCount).toBe(1);
    expect(store.annotationCount).toBe(1);
    expect(store.getCoordinateAnnotationRef(0)).toBe(0);
    expect(store.getAnnotationText(0)).toBe('handoff');
    expect(store.getAnnotationColor(0)).toBe('green');

    const cursor = store.createRouteCursor().resetToRecord(0);
    const items: Array<[number, number | undefined, number | undefined]> = [];
    while (cursor.moveNext()) {
      items.push([cursor.itemIndex, cursor.nodeRef, cursor.coordinateRef]);
    }
    expect(items).toEqual([
      [0, 0, undefined],
      [1, undefined, 0],
      [2, 1, undefined],
      [3, 2, undefined],
    ]);
    expect(store.getRecordRefsById('trace')).toEqual(new Uint32Array([0]));
    expect(store.findRecordByKey('parallel-key')).toBe(1);
    assertPackedGraphRelations(store, nodeIds.length);

    const first = store.materializeRecordRoute(0, nodeIdAt);
    const second = store.materializeRecordRoute(0, nodeIdAt);
    expect(second).not.toBe(first);
    (first[1] as unknown[])[0] = 999;
    expect(store.materializeRecordRoute(0, nodeIdAt)[1]).toEqual([15, 55, 0, 'handoff', 'green']);
  });

  it('retains a primary implicit route and reports a conflicting unit', () => {
    const builder = new PackedGraphRelationsBuilder();
    const diagnostics = new GraphDiagnosticCollector();

    for (const [rowIndex, longitude] of [15, 16].entries()) {
      begin(builder, {
        relationKey: 'implicit-key',
        id: 'A-B',
        source: 'A',
        target: 'B',
        rowIndex,
        explicitId: false,
      });
      builder.pushNodeKey(key('A'), 'A');
      builder.pushCoordinate(longitude, 55);
      builder.pushNodeKey(key('B'), 'B');
      builder.finishUnit();
    }

    const store = builder.finalize({ nodeRefByKey, diagnostics });

    expect(store.recordCount).toBe(1);
    expect(store.getRecordUnitCount(0)).toBe(2);
    expect(store.materializeRecordRoute(0, nodeIdAt)).toEqual(['A', [15, 55], 'B']);
    expect(diagnostics.result()).toContainEqual(
      expect.objectContaining({
        code: 'conflicting-edge',
        message: 'Repeated implicit edge has a conflicting route; the primary route is retained',
        count: 1,
      })
    );
  });

  it('omits unresolved intermediate nodes and drops unresolved endpoints', () => {
    const builder = new PackedGraphRelationsBuilder();
    const diagnostics = new GraphDiagnosticCollector();

    begin(builder, {
      relationKey: 'partial-key',
      id: 'partial',
      source: 'A',
      target: 'B',
      rowIndex: 0,
      explicitId: true,
    });
    builder.pushNodeKey(key('A'), 'A');
    builder.pushNodeKey(key('missing'), 'missing');
    builder.pushNodeKey(key('B'), 'B');
    builder.finishUnit();

    begin(builder, {
      relationKey: 'dangling-key',
      id: 'dangling',
      source: 'A',
      target: 'missing',
      rowIndex: 1,
      explicitId: true,
    });
    builder.pushNodeKey(key('A'), 'A');
    builder.pushNodeKey(key('missing'), 'missing');
    builder.finishUnit();

    const store = builder.finalize({ nodeRefByKey, diagnostics });

    expect(store.recordCount).toBe(1);
    expect(store.materializeRecordRoute(0, nodeIdAt)).toEqual(['A', 'B']);
    expect(diagnostics.result()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'invalid-path',
          count: 1,
          examples: [expect.objectContaining({ value: 'missing' })],
        }),
        expect.objectContaining({
          code: 'dangling-target',
          count: 1,
          examples: [expect.objectContaining({ value: 'missing' })],
        }),
      ])
    );
  });

  it('retains non-contiguous explicit units without extending the primary route', () => {
    const builder = new PackedGraphRelationsBuilder();
    const diagnostics = new GraphDiagnosticCollector();

    begin(builder, {
      relationKey: 'shared-key',
      id: 'shared',
      source: 'A',
      target: 'B',
      rowIndex: 0,
      explicitId: true,
    });
    builder.pushNodeKey(key('A'), 'A');
    builder.pushNodeKey(key('B'), 'B');
    builder.finishUnit();

    begin(builder, {
      relationKey: 'shared-key',
      id: 'shared',
      source: 'C',
      target: 'D',
      rowIndex: 1,
      explicitId: true,
    });
    builder.pushNodeKey(key('C'), 'C');
    builder.pushNodeKey(key('D'), 'D');
    builder.finishUnit();

    const store = builder.finalize({ nodeRefByKey, diagnostics });

    expect(store.materializeRecordRoute(0, nodeIdAt)).toEqual(['A', 'B']);
    expect(store.materializeUnitRoute(1, nodeIdAt)).toEqual(['C', 'D']);
    expect(diagnostics.result()).toContainEqual(
      expect.objectContaining({
        code: 'conflicting-edge',
        message: 'Repeated explicit edge ID is not a tail-contiguous fragment; the fragment is retained separately',
        count: 1,
      })
    );
  });

  it('fails safely when a configured packed cardinality is exceeded', () => {
    const builder = new PackedGraphRelationsBuilder({ maxRef: 2 });

    expect(() =>
      begin(builder, {
        relationKey: 'capacity-key',
        id: 'capacity',
        source: 'A',
        target: 'B',
        rowIndex: 0,
        explicitId: true,
      })
    ).toThrow(PackedRelationCapacityError);
  });
});
