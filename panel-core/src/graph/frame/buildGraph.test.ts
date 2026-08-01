import { toDataFrame } from '@grafana/data';

import { getGraphPositionRanges, getNodeData } from '../main';
import { buildGraphFromSnapshot } from './buildGraph';
import { normalizeGraphFrames } from './normalize';
import { createGraphCompatibilityFixtures } from './testFixtures';
import type { GraphFrameOptions, GraphFrameSnapshot, GraphStageResult } from './types';

const options: GraphFrameOptions = {
  nodeIdField: 'source',
  targetField: 'target',
  edgeIdField: 'edgeId',
  isLogic: true,
};

function success<T>(result: GraphStageResult<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('Expected successful graph stage');
  }
  return result.value;
}

async function normalize(frame): Promise<GraphFrameSnapshot> {
  return success(await normalizeGraphFrames({ data: { series: [frame] }, options }));
}

describe('snapshot to graph state builder', () => {
  it('creates deterministic nodes, indexes, positions, and ranges', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const snapshot = await normalize(fixtures.nodeOnly);
    const state = success(buildGraphFromSnapshot(snapshot));

    expect(state.positions).toEqual(new Float64Array([7, 7, 7, 7, 7, 7]));
    expect(state.positions).not.toBe(snapshot.positions);
    expect(state.positionRanges).toEqual([
      {
        namespaceId: 'external',
        start: 0,
        end: 3,
      },
    ]);
    expect(getGraphPositionRanges(state.graph)).toEqual([[0, 3]]);
    expect(Array.from(state.nodeByKey.values(), (node) => getNodeData(node)?.wasmId)).toEqual([0, 1, 2]);
    expect(Array.from(state.nodeByKey.values(), (node) => getNodeData(node)?.idx)).toEqual([0, 1, 2]);
  });

  it('creates nested namespace graphs and namespace position ranges', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const snapshot = success(
      await normalizeGraphFrames({
        data: { series: [fixtures.namespaces] },
        options: {
          ...options,
          sourceNamespaceField: 'sourceNs',
          targetNamespaceField: 'targetNs',
        },
      })
    );
    const state = success(buildGraphFromSnapshot(snapshot));
    const graphIds = Array.from(state.graph.subgraphsBreadthFirst(), (graph) => graph.id);

    expect(graphIds).toEqual(['site', 'site.one', 'site.two']);
    expect(state.positionRanges).toEqual([
      { namespaceId: 'site.one', start: 0, end: 2 },
      { namespaceId: 'site.two', start: 2, end: 4 },
    ]);
  });

  it('keeps editable node indexes local when a namespace contains a child namespace', async () => {
    const frame = toDataFrame({
      refId: 'NestedNamespaceNodes',
      fields: [
        { name: 'source', values: ['parent-node', 'child-node'] },
        { name: 'sourceNs', values: ['site', 'site.one'] },
      ],
    });
    const snapshot = success(
      await normalizeGraphFrames({
        data: { series: [frame] },
        options: {
          ...options,
          sourceNamespaceField: 'sourceNs',
        },
      })
    );
    const state = success(buildGraphFromSnapshot(snapshot));

    expect(Array.from(state.nodeByKey.values(), (node) => getNodeData(node)?.wasmId)).toEqual([0, 1]);
    expect(Array.from(state.nodeByKey.values(), (node) => getNodeData(node)?.idx)).toEqual([0, 0]);
  });

  it('builds routed units and GraphEdgeIndex entries from logical edges', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const snapshot = await normalize(fixtures.explicitUnits);
    const state = success(buildGraphFromSnapshot(snapshot, { layerIndex: 3, wrap: 2 }));

    expect(
      Array.from({ length: state.edgeIndex.recordCount }, (_, ref) => [...state.edgeIndex.getRecordVertexView(ref)])
    ).toEqual([
      [0, 1, 2],
      [0, 1],
      [0, 1],
    ]);
    expect(
      Array.from({ length: state.edgeIndex.recordCount }, (_, ref) => [
        state.edgeIndex.getRecordLayerIndex(ref),
        state.edgeIndex.getRecordWrap(ref),
      ])
    ).toEqual([
      [3, 2],
      [3, 2],
      [3, 2],
    ]);
    expect(
      Array.from({ length: state.edgeIndex.recordCount }, (_, ref) => {
        const [start, end] = state.edgeIndex.getRecordRange(ref);
        return end - start;
      })
    ).toEqual([2, 1, 1]);
    expect([...state.edgeIndex.recordEdges(0)].map(({ id }) => id)).toEqual(['trace-1', 'trace-1--dup-1']);
  });

  it('keeps row metadata on nodes while runtime edges retain only numeric relation references', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const snapshot = await normalize(fixtures.explicitUnits);
    const state = success(buildGraphFromSnapshot(snapshot));
    const nodeMetadata = (getNodeData(state.nodeByKey.get(snapshot.nodes[0].key)!) as any)?.graphFrame;
    const unitStart = snapshot.relations.getRecordUnitStart(0);

    expect(nodeMetadata).toEqual({
      key: snapshot.nodes[0].key,
      primaryRow: snapshot.nodes[0].primaryRow,
      rows: snapshot.nodes[0].rows,
    });
    expect(state.edgeIndex.getRecordEdge(0, 0)!.data).not.toHaveProperty('graphFrame');
    expect(state.edgeIndex.getRecordEdge(0, 0)!.data).not.toHaveProperty('edge_id');
    expect(state.edgeIndex.getRecordEdge(0, 0)!.data).not.toHaveProperty('segmentRef');
    expect(state.edgeIndex.getEdgeUnitRef(state.edgeIndex.getRecordRange(0)[0] + 1)).toBe(unitStart + 1);
  });

  it('returns isolated graph state without mutating the snapshot or a prior build', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const snapshot = await normalize(fixtures.implicitEdges);
    const first = success(buildGraphFromSnapshot(snapshot));
    const second = success(buildGraphFromSnapshot(snapshot));

    expect(second.graph).not.toBe(first.graph);
    expect(second.edgeIndex).not.toBe(first.edgeIndex);
    expect(first.positions).not.toBe(snapshot.positions);
    expect(second.positions).not.toBe(snapshot.positions);
    expect(second.positions).not.toBe(first.positions);
    first.positions[0] = 42;
    expect(snapshot.positions[0]).toBe(7);
    expect(second.positions[0]).toBe(7);
    expect(snapshot.nodes.map(({ id }) => id)).toEqual(['A', 'B', 'C']);
    expect(
      Array.from({ length: snapshot.relations.recordCount }, (_, ref) => snapshot.relations.getRecordId(ref))
    ).toEqual(['A-B', 'C-B']);
  });
});
