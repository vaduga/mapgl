import { type DataFrame } from '@grafana/data';

import { normalizeGraphFrames } from './normalize';
import { PackedRelationFlags } from './packedRelations';
import { createGraphCompatibilityFixtures } from './testFixtures';
import type { GraphFrameOptions, GraphFrameSnapshot } from './types';

const logicOptions: GraphFrameOptions = {
  layerName: 'compatibility baseline',
  nodeIdField: 'source',
  targetField: 'target',
  edgeIdField: 'edgeId',
  isLogic: true,
};

function records(snapshot: GraphFrameSnapshot) {
  const { relations } = snapshot;
  const nodeIdAt = (nodeRef: number) => snapshot.nodes[nodeRef]?.id;
  return Array.from({ length: relations.recordCount }, (_, recordRef) => {
    const unitStart = relations.getRecordUnitStart(recordRef);
    const unitCount = relations.getRecordUnitCount(recordRef);
    return {
      id: relations.getRecordId(recordRef),
      rows: Array.from({ length: unitCount }, (_, offset) => relations.getUnitRow(unitStart + offset)),
      route: relations.materializeRecordRoute(recordRef, nodeIdAt),
      unitRoutes: Array.from({ length: unitCount }, (_, offset) =>
        relations.materializeUnitRoute(unitStart + offset, nodeIdAt)
      ),
    };
  });
}

function expectPackedRelationsToBeConsistent(snapshot: GraphFrameSnapshot): void {
  const { relations } = snapshot;
  const nodeIdAt = (nodeRef: number) => snapshot.nodes[nodeRef]?.id;

  snapshot.nodes.forEach((node, nodeRef) => {
    expect(node.index).toBe(nodeRef);
    expect(snapshot.positions[nodeRef * 2]).toBeDefined();
    expect(snapshot.positions[nodeRef * 2 + 1]).toBeDefined();
  });

  for (let recordRef = 0; recordRef < relations.recordCount; recordRef++) {
    const unitStart = relations.getRecordUnitStart(recordRef);
    const unitCount = relations.getRecordUnitCount(recordRef);
    expect(relations.getRecordSourceNodeRef(recordRef)).toBeLessThan(snapshot.nodes.length);
    expect(relations.getRecordTargetNodeRef(recordRef)).toBeLessThan(snapshot.nodes.length);
    expect(relations.materializeRecordRoute(recordRef, nodeIdAt).length).toBeGreaterThanOrEqual(2);
    expect(relations.getRecordFlags(recordRef) & PackedRelationFlags.explicitId).toBeGreaterThanOrEqual(0);
    for (let unitOffset = 0; unitOffset < unitCount; unitOffset++) {
      const unitRef = unitStart + unitOffset;
      expect(unitRef).toBeGreaterThanOrEqual(unitStart);
      expect(unitRef).toBeLessThan(unitStart + unitCount);
      expect(relations.materializeUnitRoute(unitRef, nodeIdAt).length).toBeGreaterThanOrEqual(2);
    }
  }
}

async function normalize(frame: DataFrame, options: GraphFrameOptions = logicOptions): Promise<GraphFrameSnapshot> {
  const result = await normalizeGraphFrames({ data: { series: [frame] }, options });
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('Expected compatibility fixture to normalize');
  }
  expectPackedRelationsToBeConsistent(result.value);
  return result.value;
}

describe('graph relation normalization compatibility baseline', () => {
  const fixtures = createGraphCompatibilityFixtures();

  it('preserves direct edges and array-valued routes', async () => {
    const direct = await normalize(fixtures.directEdge);
    const arrayRoute = await normalize(fixtures.pathArray, { ...logicOptions, isLogic: false });

    expect(records(direct).map(({ id, route }) => ({ id, route }))).toEqual([{ id: 'A-B', route: ['A', 'B'] }]);
    expect(records(arrayRoute).map(({ id, route }) => ({ id, route }))).toEqual([
      { id: 'array-route', route: ['A', [15, 55], 'B'] },
    ]);
  });

  it('preserves JSON path strings, coordinate metadata, and comments', async () => {
    const result = await normalize(fixtures.jsonCoordinatePath, { ...logicOptions, isLogic: false });

    expect(records(result).map(({ id, route }) => ({ id, route }))).toEqual([
      { id: 'json-route', route: ['A', [15, 55, 0, 'handoff', 'green'], 'B'] },
    ]);
  });

  it('preserves implicit duplicates, explicit continuation, and parallel edge IDs', async () => {
    const implicit = await normalize(fixtures.implicitEdges);
    const explicit = await normalize(fixtures.explicitUnits);

    expect(
      records(implicit).map((record) => ({
        id: record.id,
        rows: record.rows.map((row) => row.rowIndex),
        route: record.route,
      }))
    ).toEqual([
      { id: 'A-B', rows: [0, 2], route: ['A', 'B'] },
      { id: 'C-B', rows: [3], route: ['C', 'B'] },
    ]);
    expect(
      records(explicit).map((record) => ({
        id: record.id,
        rows: record.rows.map((row) => row.rowIndex),
        unitRoutes: record.unitRoutes,
        route: record.route,
      }))
    ).toEqual([
      {
        id: 'trace-1',
        rows: [0, 1],
        unitRoutes: [
          ['A', 'B'],
          ['B', 'C'],
        ],
        route: ['A', 'B', 'C'],
      },
      { id: 'parallel-a', rows: [2], unitRoutes: [['A', 'B']], route: ['A', 'B'] },
      { id: 'parallel-b', rows: [3], unitRoutes: [['A', 'B']], route: ['A', 'B'] },
    ]);
  });

  it('retains conflicting same-ID units without changing the primary route', async () => {
    const result = await normalizeGraphFrames({
      data: { series: [fixtures.conflictingExplicitUnits] },
      options: logicOptions,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected conflicting fixture to retain a graph snapshot');
    }
    expectPackedRelationsToBeConsistent(result.value);

    expect(records(result.value).map(({ route }) => route)).toEqual([['A', 'B']]);
    expect(records(result.value)[0].unitRoutes).toEqual([
      ['A', 'B'],
      ['C', 'D'],
    ]);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'conflicting-edge', count: 1 }));
  });

  it('fails normalization before committing an out-of-range packed reference', async () => {
    const result = await normalizeGraphFrames(
      { data: { series: [fixtures.directEdge] }, options: logicOptions },
      { packedMaxRef: 1 }
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual({
      code: 'pipeline-failed',
      severity: 'fatal',
      message: 'Graph cardinality exceeds the packed relation encoding capacity',
      count: 1,
      examples: [
        {
          context: {},
          value: expect.stringMatching(/^Packed \w+ cardinality \d+ exceeds 1$/),
        },
      ],
    });
  });
});

describe('graph relation diagnostic compatibility baseline', () => {
  const fixtures = createGraphCompatibilityFixtures();

  it('drops a malformed path while retaining valid nodes', async () => {
    const frame = fixtures.directEdge;
    frame.fields.find(({ name }) => name === 'target')!.values[0] = '[broken';
    const result = await normalizeGraphFrames({ data: { series: [frame] }, options: logicOptions });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected malformed route fixture to retain a graph snapshot');
    }
    expect(result.value.nodes.map(({ id }) => id)).toEqual(['A', 'B']);
    expect(result.value.relations.recordCount).toBe(0);
    expect(result.diagnostics).toContainEqual({
      code: 'invalid-path',
      severity: 'warning',
      message: 'Row has an invalid target or routed path',
      count: 1,
      examples: [
        {
          context: {
            layerName: 'compatibility baseline',
            frameIndex: 0,
            frameRefId: 'DirectEdge',
            fieldName: 'target',
            rowIndex: 0,
          },
          value: '[broken',
        },
      ],
    });
  });

  it('drops a dangling relation while retaining its valid source nodes', async () => {
    const frame = fixtures.directEdge;
    frame.fields.find(({ name }) => name === 'target')!.values[0] = 'missing';
    const result = await normalizeGraphFrames({ data: { series: [frame] }, options: logicOptions });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected dangling route fixture to retain a graph snapshot');
    }
    expect(result.value.nodes.map(({ id }) => id)).toEqual(['A', 'B']);
    expect(result.value.relations.recordCount).toBe(0);
    expect(result.diagnostics).toContainEqual({
      code: 'dangling-target',
      severity: 'warning',
      message: 'Edge target does not resolve to a normalized node',
      count: 1,
      examples: [
        {
          context: {
            layerName: 'compatibility baseline',
            frameIndex: 0,
            frameRefId: 'DirectEdge',
            fieldName: 'target',
            rowIndex: 0,
          },
          value: 'missing',
        },
      ],
    });
  });

  it('omits an unresolved intermediate node while retaining the relation', async () => {
    const frame = fixtures.directEdge;
    frame.fields.find(({ name }) => name === 'target')!.values[0] = '["A","missing","B"]';
    const result = await normalizeGraphFrames({ data: { series: [frame] }, options: logicOptions });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected partial route fixture to retain a graph snapshot');
    }
    expect(records(result.value).map(({ route }) => route)).toEqual([['A', 'B']]);
    expect(result.diagnostics).toContainEqual({
      code: 'invalid-path',
      severity: 'warning',
      message: 'Routed path contains an unresolved intermediate node; the node was skipped',
      count: 1,
      examples: [
        {
          context: {
            layerName: 'compatibility baseline',
            frameIndex: 0,
            frameRefId: 'DirectEdge',
            fieldName: 'target',
            rowIndex: 0,
          },
          value: 'missing',
        },
      ],
    });
  });

  it('keeps the primary implicit route and diagnoses a conflicting duplicate', async () => {
    const result = await normalizeGraphFrames({
      data: { series: [fixtures.conflictingImplicitRoutes] },
      options: { ...logicOptions, isLogic: false },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected conflicting implicit fixture to retain a graph snapshot');
    }
    expect(records(result.value).map(({ route }) => route)).toEqual([['A', [15, 55], 'B']]);
    expect(records(result.value)[0].rows.map(({ rowIndex }) => rowIndex)).toEqual([0, 1]);
    expect(result.diagnostics).toContainEqual({
      code: 'conflicting-edge',
      severity: 'warning',
      message: 'Repeated implicit edge has a conflicting route; the primary route is retained',
      count: 1,
      examples: [
        {
          context: {
            layerName: 'compatibility baseline',
            frameIndex: 0,
            frameRefId: 'ConflictingImplicit',
            fieldName: 'target',
            rowIndex: 1,
          },
          value: 'A-B',
        },
      ],
    });
  });

  it('retains non-contiguous explicit units and diagnoses their grouping conflict', async () => {
    const result = await normalizeGraphFrames({
      data: { series: [fixtures.conflictingExplicitUnits] },
      options: logicOptions,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected conflicting explicit fixture to retain a graph snapshot');
    }
    expect(records(result.value)[0].unitRoutes).toEqual([
      ['A', 'B'],
      ['C', 'D'],
    ]);
    expect(result.diagnostics).toContainEqual({
      code: 'conflicting-edge',
      severity: 'warning',
      message: 'Repeated explicit edge ID is not a tail-contiguous fragment; the fragment is retained separately',
      count: 1,
      examples: [
        {
          context: {
            layerName: 'compatibility baseline',
            frameIndex: 0,
            frameRefId: 'ConflictingExplicit',
            fieldName: 'target',
            rowIndex: 1,
          },
          value: 'shared',
        },
      ],
    });
  });
});
