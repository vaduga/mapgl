import { toDataFrame } from '@grafana/data';

import { graphFrameKey, normalizeGraphFrames } from './normalize';
import { decodeRouteRef, isCoordinateToken } from './packedRelations';
import { createGraphCompatibilityFixtures, getGraphNodePosition } from './testFixtures';
import type { GraphFrameOptions, GraphFrameSnapshot, GraphStageResult } from './types';

let backendResults: unknown = {};

jest.mock('@grafana/runtime', () => ({
  ...(jest.requireActual('@grafana/runtime') as object),
  getBackendSrv: () => ({
    get: jest.fn().mockImplementation(async () => backendResults),
  }),
}));

const logicOptions: GraphFrameOptions = {
  layerName: 'test graph',
  nodeIdField: 'source',
  targetField: 'target',
  edgeIdField: 'edgeId',
  isLogic: true,
};

function snapshot(result: GraphStageResult<GraphFrameSnapshot>): GraphFrameSnapshot {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('Expected successful graph normalization');
  }
  return result.value;
}

function nodeIds(result: GraphFrameSnapshot) {
  return result.nodes.map(({ id }) => id);
}

function pathNodeIds(result: GraphFrameSnapshot, edgeIndex = 0) {
  const start = result.relations.getRecordRouteStart(edgeIndex);
  const length = result.relations.getRecordRouteLength(edgeIndex);
  return Array.from({ length }, (_, offset) => result.relations.getRouteToken(start + offset)).flatMap((token) =>
    isCoordinateToken(token) ? [] : [result.nodes[token].id]
  );
}

function recordRefs(result: GraphFrameSnapshot): number[] {
  return Array.from({ length: result.relations.recordCount }, (_, recordRef) => recordRef);
}

function recordRows(result: GraphFrameSnapshot, recordRef: number) {
  const start = result.relations.getRecordUnitStart(recordRef);
  const count = result.relations.getRecordUnitCount(recordRef);
  return Array.from({ length: count }, (_, offset) => result.relations.getUnitRow(start + offset));
}

describe('graph frame normalization', () => {
  it('normalizes node-only rows with logic placeholders', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const result = snapshot(
      await normalizeGraphFrames({ data: { series: [fixtures.nodeOnly] }, options: logicOptions })
    );

    expect(nodeIds(result)).toEqual(['A', 'B', 'C']);
    expect(result.relations.recordCount).toBe(0);
    expect(result.nodes.map(({ primaryRow }) => primaryRow.rowIndex)).toEqual([0, 1, 2]);
    expect(result.positions).toEqual(new Float64Array([7, 7, 7, 7, 7, 7]));
    expect(result.nodes.map(({ index }) => index)).toEqual([0, 1, 2]);
  });

  it('coalesces implicit identities and retains contributing source rows', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const result = snapshot(
      await normalizeGraphFrames({ data: { series: [fixtures.implicitEdges] }, options: logicOptions })
    );

    expect(nodeIds(result)).toEqual(['A', 'B', 'C']);
    expect(recordRefs(result).map((ref) => result.relations.getRecordId(ref))).toEqual(['A-B', 'C-B']);
    expect(recordRefs(result).map((ref) => result.relations.getRecordPrimaryRow(ref).rowIndex)).toEqual([0, 3]);
    expect(recordRefs(result).map((ref) => recordRows(result, ref).map(({ rowIndex }) => rowIndex))).toEqual([
      [0, 2],
      [3],
    ]);
  });

  it('appends tail-contiguous explicit units and keeps parallel IDs separate', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const result = snapshot(
      await normalizeGraphFrames({ data: { series: [fixtures.explicitUnits] }, options: logicOptions })
    );

    expect(recordRefs(result).map((ref) => result.relations.getRecordId(ref))).toEqual([
      'trace-1',
      'parallel-a',
      'parallel-b',
    ]);
    expect(recordRefs(result).map((ref) => recordRows(result, ref).map(({ rowIndex }) => rowIndex))).toEqual([
      [0, 1],
      [2],
      [3],
    ]);
    expect(recordRefs(result).map((index) => pathNodeIds(result, index))).toEqual([
      ['A', 'B', 'C'],
      ['A', 'B'],
      ['A', 'B'],
    ]);
    expect(result.relations.getRecordUnitCount(0)).toBe(2);
    expect(result.relations.getRecordRefsById('trace-1')).toEqual(new Uint32Array([0]));
  });

  it('retains a non-contiguous explicit unit and diagnoses the conflict', async () => {
    const frame = toDataFrame({
      refId: 'Disjoint',
      fields: [
        { name: 'source', values: ['A', 'C', 'B', 'D'] },
        { name: 'target', values: ['B', 'D', null, null] },
        { name: 'edgeId', values: ['shared', 'shared', null, null] },
      ],
    });
    const result = await normalizeGraphFrames({ data: { series: [frame] }, options: logicOptions });
    const value = snapshot(result);

    expect(value.relations.recordCount).toBe(1);
    expect(pathNodeIds(value)).toEqual(['A', 'B']);
    expect(value.relations.getRecordUnitCount(0)).toBe(2);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'conflicting-edge', count: 1 }));
  });

  it('keeps equal local IDs distinct across namespaces', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const options: GraphFrameOptions = {
      ...logicOptions,
      sourceNamespaceField: 'sourceNs',
      targetNamespaceField: 'targetNs',
    };
    const result = snapshot(await normalizeGraphFrames({ data: { series: [fixtures.namespaces] }, options }));

    expect(result.nodes.map(({ namespaceId, id }) => [namespaceId, id])).toEqual([
      ['site.one', 'A'],
      ['site.one', 'B'],
      ['site.two', 'A'],
      ['site.two', 'B'],
    ]);
    expect(recordRefs(result).map((ref) => result.relations.getRecordId(ref))).toEqual(['A-B', 'A-B']);
    expect(recordRefs(result).map((ref) => result.relations.getRecordKey(ref))).toHaveLength(2);
    expect(result.relations.getRecordRefsById('A-B')).toEqual(new Uint32Array([0, 1]));
  });

  it('uses one shared external namespace in Geo mode even when namespace fields are configured', async () => {
    const frame = toDataFrame({
      refId: 'GeoNamespaces',
      fields: [
        { name: 'source', values: ['A', 'B'] },
        { name: 'target', values: ['B', null] },
        { name: 'sourceNs', values: ['site.one', 'site.two'] },
        { name: 'targetNs', values: ['site.one', 'site.two'] },
        { name: 'longitude', values: [104.28, 104.31] },
        { name: 'latitude', values: [52.29, 52.31] },
      ],
    });
    const result = snapshot(
      await normalizeGraphFrames({
        data: { series: [frame] },
        options: {
          ...logicOptions,
          sourceNamespaceField: 'sourceNs',
          targetNamespaceField: 'targetNs',
          defaultNamespace: 'configured-default',
          isLogic: false,
        },
      })
    );

    expect(result.namespaces).toEqual(['external']);
    expect(result.nodes.map(({ namespaceId, id }) => [namespaceId, id])).toEqual([
      ['external', 'A'],
      ['external', 'B'],
    ]);
    expect(result.relations.recordCount).toBe(1);
  });

  it('merges multiple frames in order and preserves primary and contributing rows', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const result = snapshot(
      await normalizeGraphFrames({ data: { series: fixtures.multipleFrames }, options: logicOptions })
    );
    const nodeA = result.nodeByKey.get(graphFrameKey.node('external', 'A'));

    expect(result.frames.map(({ frameRefId }) => frameRefId)).toEqual(['MultiNodes', 'MultiEdges']);
    expect(nodeA?.primaryRow).toEqual({ frameIndex: 0, frameRefId: 'MultiNodes', rowIndex: 0 });
    expect(nodeA?.rows).toEqual([
      { frameIndex: 0, frameRefId: 'MultiNodes', rowIndex: 0 },
      { frameIndex: 1, frameRefId: 'MultiEdges', rowIndex: 0 },
      { frameIndex: 1, frameRefId: 'MultiEdges', rowIndex: 1 },
    ]);
    expect(recordRefs(result).map((ref) => result.relations.getRecordId(ref))).toEqual(['A-B', 'A-C']);
  });

  it('normalizes coordinate, GeoJSON, and geohash locations through existing helpers', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const result = snapshot(
      await normalizeGraphFrames({
        data: { series: fixtures.geographic },
        options: { ...logicOptions, isLogic: false },
      })
    );

    expect(nodeIds(result)).toEqual(['geo-a', 'geo-b', 'geo-c', 'geo-d']);
    expect(getGraphNodePosition(result, result.nodes[0])).toEqual([10, 50]);
    expect(getGraphNodePosition(result, result.nodes[1])).toEqual([20, 60]);
    expect(getGraphNodePosition(result, result.nodes[2])).toEqual([30, 70]);
    expect(getGraphNodePosition(result, result.nodes[3])[0]).toBeCloseTo(10.40744, 4);
    expect(getGraphNodePosition(result, result.nodes[3])[1]).toBeCloseTo(57.64911, 4);
  });

  it('preserves supported coordinate waypoints and their metadata in routed paths', async () => {
    const frame = toDataFrame({
      refId: 'Route',
      fields: [
        { name: 'source', values: ['A', 'B'] },
        { name: 'target', values: ['["A",[15,55,0,"handoff"],"B"]', null] },
        { name: 'longitude', values: [10, 20] },
        { name: 'latitude', values: [50, 60] },
      ],
    });
    const value = snapshot(
      await normalizeGraphFrames({
        data: { series: [frame] },
        options: { ...logicOptions, isLogic: false },
      })
    );
    const coordinateRef = decodeRouteRef(value.relations.getRouteToken(value.relations.getRecordRouteStart(0) + 1));
    const annotationRef = value.relations.getCoordinateAnnotationRef(coordinateRef);

    expect([
      value.relations.getCoordinateLongitude(coordinateRef),
      value.relations.getCoordinateLatitude(coordinateRef),
      value.relations.getCoordinateElevation(coordinateRef),
      annotationRef === undefined ? undefined : value.relations.getAnnotationText(annotationRef),
    ]).toEqual([15, 55, 0, 'handoff']);
  });

  it('ignores geographic waypoints in logic paths while retaining their node endpoints', async () => {
    const frame = toDataFrame({
      refId: 'Logic route',
      fields: [
        { name: 'source', values: ['10.250.2.24', 'external2'] },
        { name: 'target', values: ['["10.250.2.24",[37.558399,55.551787],"external2"]', null] },
      ],
    });
    const value = snapshot(
      await normalizeGraphFrames({
        data: { series: [frame] },
        options: logicOptions,
      })
    );

    expect(pathNodeIds(value)).toEqual(['10.250.2.24', 'external2']);
    expect(value.relations.coordinateCount).toBe(0);
    expect(value.relations.materializeUnitRoute(0, (ref) => value.nodes[ref]?.id)).toEqual(
      value.relations.materializeRecordRoute(0, (ref) => value.nodes[ref]?.id)
    );
  });

  it('keeps a routed edge while skipping unresolved intermediate nodes', async () => {
    const frame = toDataFrame({
      refId: 'Partial route',
      fields: [
        { name: 'source', values: ['A', 'B'] },
        { name: 'target', values: ['["A","missing","B"]', null] },
      ],
    });
    const result = await normalizeGraphFrames({ data: { series: [frame] }, options: logicOptions });
    const value = snapshot(result);

    expect(value.relations.recordCount).toBe(1);
    expect(pathNodeIds(value)).toEqual(['A', 'B']);
    expect(value.relations.materializeUnitRoute(0, (ref) => value.nodes[ref]?.id)).toEqual(['A', 'B']);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'invalid-path',
        count: 1,
        examples: [
          expect.objectContaining({
            value: 'missing',
          }),
        ],
      })
    );
  });

  it('normalizes configured lookup locations through the existing gazetteer helper', async () => {
    backendResults = {
      type: 'FeatureCollection',
      features: [
        {
          id: 'HQ',
          geometry: { type: 'Point', coordinates: [33, 44] },
        },
      ],
    };
    const frame = toDataFrame({
      refId: 'Lookup',
      fields: [
        { name: 'source', values: ['lookup-node'] },
        { name: 'place', values: ['HQ'] },
      ],
    });
    const result = snapshot(
      await normalizeGraphFrames({
        data: { series: [frame] },
        options: {
          ...logicOptions,
          isLogic: false,
          location: {
            mode: 'lookup',
            lookup: 'place',
            gazetteer: 'graph-frame-lookup-test',
          },
        },
      })
    );

    expect(getGraphNodePosition(result, result.nodes[0])).toEqual([33, 44]);
  });

  it('retains valid nodes while diagnosing invalid paths and dangling targets', async () => {
    const frame = toDataFrame({
      refId: 'Partial',
      fields: [
        { name: 'source', values: ['A', 'B', 'C'] },
        { name: 'target', values: ['[broken', 'missing', null] },
      ],
    });
    const result = await normalizeGraphFrames({ data: { series: [frame] }, options: logicOptions });
    const value = snapshot(result);

    expect(nodeIds(value)).toEqual(['A', 'B', 'C']);
    expect(value.relations.recordCount).toBe(0);
    expect(result.diagnostics.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['invalid-path', 'dangling-target'])
    );
  });

  it('keeps the primary coordinate and reports conflicting repeated node definitions', async () => {
    const frame = toDataFrame({
      refId: 'Conflict',
      fields: [
        { name: 'source', values: ['A', 'A'] },
        { name: 'longitude', values: [10, 11] },
        { name: 'latitude', values: [20, 21] },
      ],
    });
    const result = await normalizeGraphFrames({
      data: { series: [frame] },
      options: { ...logicOptions, isLogic: false },
    });
    const value = snapshot(result);

    expect(getGraphNodePosition(value, value.nodes[0])).toEqual([10, 20]);
    expect(value.nodes[0].rows).toHaveLength(2);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'conflicting-node', count: 1 }));
  });

  it('bounds repeated diagnostic examples while retaining the total count', async () => {
    const frame = toDataFrame({
      refId: 'Invalid',
      fields: [{ name: 'source', values: [null, '', false, null] }],
    });
    const result = await normalizeGraphFrames({
      data: { series: [frame] },
      options: { ...logicOptions, diagnosticExampleLimit: 2 },
    });
    const value = snapshot(result);
    const diagnostic = result.diagnostics.find(({ code }) => code === 'invalid-node-id');

    expect(value.nodes).toEqual([]);
    expect(result.ok && result.empty).toBe(true);
    expect(diagnostic?.count).toBe(4);
    expect(diagnostic?.examples).toHaveLength(2);
    expect(result.diagnostics.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['invalid-node-id', 'empty-graph'])
    );
  });

  it('returns a non-mutating fatal result for a missing required node field', async () => {
    const frame = toDataFrame({
      refId: 'Broken',
      fields: [{ name: 'other', values: ['A'] }],
    });
    const result = await normalizeGraphFrames({ data: { series: [frame] }, options: logicOptions });

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'missing-node-id-field',
      severity: 'fatal',
    });
  });

  it('returns a dedicated empty result when no frame matches', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const result = await normalizeGraphFrames({
      data: { series: [fixtures.nodeOnly] },
      options: {
        ...logicOptions,
        query: { id: 'byRefId', options: 'missing' },
      },
    });
    const value = snapshot(result);

    expect(result.ok && result.empty).toBe(true);
    expect(value.nodes).toEqual([]);
    expect(result.diagnostics.map(({ code }) => code)).toEqual(['no-matching-frames']);
  });
});

describe('graph topology signatures', () => {
  async function signatures(
    fields: Array<{ name: string; values: unknown[] }>,
    options: Partial<GraphFrameOptions> = {},
    refId = 'Topology'
  ) {
    const frame = toDataFrame({ refId, fields });
    return snapshot(
      await normalizeGraphFrames({
        data: { series: [frame] },
        options: { ...logicOptions, ...options },
      })
    );
  }

  it('keeps topology stable across visual, layout, and Geo coordinate changes', async () => {
    const first = await signatures([
      { name: 'source', values: ['A', 'B'] },
      { name: 'target', values: ['B', null] },
      { name: 'metric', values: [1, 2] },
    ]);
    const second = await signatures([
      { name: 'source', values: ['A', 'B'] },
      { name: 'target', values: ['B', null] },
      { name: 'metric', values: [100, 200] },
    ]);

    expect(second.topologySignature).toBe(first.topologySignature);
    expect(
      (
        await signatures(
          [
            { name: 'source', values: ['A', 'B'] },
            { name: 'target', values: ['B', null] },
          ],
          { layoutSignature: 'layout:TB' }
        )
      ).topologySignature
    ).toBe(
      (
        await signatures(
          [
            { name: 'source', values: ['A', 'B'] },
            { name: 'target', values: ['B', null] },
          ],
          { layoutSignature: 'layout:LR' }
        )
      ).topologySignature
    );

    const firstGeo = await signatures(
      [
        { name: 'source', values: ['A', 'B'] },
        { name: 'longitude', values: [10, 20] },
        { name: 'latitude', values: [30, 40] },
      ],
      { isLogic: false }
    );
    const movedGeo = await signatures(
      [
        { name: 'source', values: ['A', 'B'] },
        { name: 'longitude', values: [11, 20] },
        { name: 'latitude', values: [30, 40] },
      ],
      { isLogic: false }
    );
    expect(movedGeo.topologySignature).toBe(firstGeo.topologySignature);
    expect(movedGeo.geometrySignature).not.toBe(firstGeo.geometrySignature);
  });

  it('changes topology for node, edge, node-hop path, namespace, and entity-order changes', async () => {
    const baseFields = [
      { name: 'source', values: ['A', 'B', 'C'] },
      { name: 'target', values: ['B', null, null] },
      { name: 'edgeId', values: ['edge-1', null, null] },
      { name: 'sourceNs', values: ['one', 'one', 'one'] },
      { name: 'targetNs', values: ['one', 'one', 'one'] },
    ];
    const baseOptions = {
      sourceNamespaceField: 'sourceNs',
      targetNamespaceField: 'targetNs',
    };
    const base = (await signatures(baseFields, baseOptions)).topologySignature;

    expect(
      (await signatures([{ ...baseFields[0], values: ['A', 'B', 'D'] }, ...baseFields.slice(1)], baseOptions))
        .topologySignature
    ).not.toBe(base);
    expect(
      (
        await signatures(
          baseFields.map((field) => (field.name === 'edgeId' ? { ...field, values: ['edge-2', null, null] } : field)),
          baseOptions
        )
      ).topologySignature
    ).not.toBe(base);
    expect(
      (
        await signatures(
          baseFields.map((field) =>
            field.name === 'target' ? { ...field, values: ['["A","C","B"]', null, null] } : field
          ),
          baseOptions
        )
      ).topologySignature
    ).not.toBe(base);
    expect(
      (
        await signatures(
          baseFields.map((field) => (field.name === 'sourceNs' ? { ...field, values: ['two', 'one', 'one'] } : field)),
          baseOptions
        )
      ).topologySignature
    ).not.toBe(base);

    const frameA = toDataFrame({ refId: 'A', fields: [{ name: 'source', values: ['A'] }] });
    const frameB = toDataFrame({ refId: 'B', fields: [{ name: 'source', values: ['B'] }] });
    const ordered = snapshot(
      await normalizeGraphFrames({ data: { series: [frameA, frameB] }, options: logicOptions })
    ).topologySignature;
    const reversed = snapshot(
      await normalizeGraphFrames({ data: { series: [frameB, frameA] }, options: logicOptions })
    ).topologySignature;
    expect(reversed).not.toBe(ordered);
  });

  it('tracks Geo waypoint positions but ignores waypoint metadata', async () => {
    const route = (waypoint: string) =>
      signatures(
        [
          { name: 'source', values: ['A', 'B'] },
          { name: 'target', values: [waypoint, null] },
          { name: 'longitude', values: [10, 20] },
          { name: 'latitude', values: [50, 60] },
        ],
        { isLogic: false }
      );
    const first = await route('["A",[15,55,0,"first"],"B"]');
    const moved = await route('["A",[16,55,0,"first"],"B"]');
    const relabeled = await route('["A",[15,55,1,"second"],"B"]');

    expect(moved.topologySignature).toBe(first.topologySignature);
    expect(moved.geometrySignature).not.toBe(first.geometrySignature);
    expect(relabeled.topologySignature).toBe(first.topologySignature);
    expect(relabeled.geometrySignature).toBe(first.geometrySignature);
  });
});
