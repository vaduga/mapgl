import { testFrame, testVisualConfig } from '../../../test/frames';
import { createTheme } from '@grafana/data';
import { TextDimensionMode } from '@grafana/schema';

import { getNodeData, getNodeGroupsWithNodes, markNodeGroupHasNodes } from '@vaduga/mapgl-core/graph/main';
import {
  buildGraphFromSnapshot,
  applyGraphVisualState,
  createGraphFrameViewState,
} from '@vaduga/mapgl-core/graph/frame';
import { normalizeGraphFrames } from './normalize';

import type { GraphStageResult, GrafanaGraphVisualConfig } from './types';
import { resolveGraphVisuals } from './visual';

function value<T>(result: GraphStageResult<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('Expected successful graph stage');
  }
  return result.value;
}

const visualConfig = testVisualConfig({
  layerName: 'runtime test',
  style: { color: { fixed: 'green' }, size: { fixed: 20, min: 5, max: 30 } },
  edgeStyle: { color: { field: 'edgeMetric', fixed: 'blue' }, size: { fixed: 2, min: 1, max: 10 } },
});

describe('graph runtime commit helpers', () => {
  it('attaches committed node and edge visuals to the built graph', async () => {
    const frame = testFrame('Runtime', { source: ['A', 'B'], target: ['B', null], edgeMetric: [42, 0] });
    const snapshot = value(
      await normalizeGraphFrames({
        data: { series: [frame] },
        options: {
          nodeIdField: 'source',
          targetField: 'target',
          isLogic: true,
        },
      })
    );
    const graph = value(buildGraphFromSnapshot(snapshot));
    const visual = value(
      resolveGraphVisuals({
        data: { series: [frame] },
        snapshot,
        graph,
        config: visualConfig,
        theme: createTheme(),
      })
    );

    markNodeGroupHasNodes(graph.graph, 99);
    applyGraphVisualState(graph, visual);

    expect(getNodeData(graph.nodeByKey.get(visual.nodes[0].key)!)?.feature).toBe(visual.nodes[0].feature);
    expect(graph.edgeIndex.getFirstRecordEdge(0)?.data.dataRecord).toBe(visual.edgeUnits[0]!.feature);
    expect(graph.edgeIndex.getRecordMetrics(0)).toEqual({ primary: 42, sideA: 42, sideB: 42 });
    expect(getNodeGroupsWithNodes(graph.graph)).not.toContain(99);
  });

  it('attaches each repeated explicit edge row style to its matching dummy edge', async () => {
    const frame = testFrame('TraceSpans', {
      source: ['A', 'B', 'C'],
      target: ['B', 'C', null],
      edgeId: ['trace-1', 'trace-1', null],
      spanLabel: ['first span', 'second span', 'node C'],
      spanWidth: [1, 9, 1],
    });
    const snapshot = value(
      await normalizeGraphFrames({
        data: { series: [frame] },
        options: {
          nodeIdField: 'source',
          targetField: 'target',
          edgeIdField: 'edgeId',
          isLogic: true,
        },
      })
    );
    const graph = value(buildGraphFromSnapshot(snapshot));
    const visual = value(
      resolveGraphVisuals({
        data: { series: [frame] },
        snapshot,
        graph,
        config: {
          ...visualConfig,
          edgeStyle: {
            color: { fixed: 'blue' },
            size: { field: 'spanWidth', fixed: 2, min: 1, max: 9 },
            text: { field: 'spanLabel', fixed: '', mode: TextDimensionMode.Field },
          },
        },
        theme: createTheme(),
      })
    );

    applyGraphVisualState(graph, visual);

    const dummyEdges = [...graph.edgeIndex.recordEdges(0)];
    expect(dummyEdges.map(({ data }) => data.dataRecord.rowIndex)).toEqual([0, 1]);
    expect(dummyEdges.map(({ data }) => data.dataRecord.locName)).toEqual(['A', 'B']);
    expect(dummyEdges.map(({ data }) => data.dataRecord.edgeStyle.text)).toEqual(['first span', 'second span']);
    expect(dummyEdges.map(({ data }) => data.dataRecord.edgeStyle.size)).toEqual([1, 9]);
  });

  it('summarizes the committed frame without retaining source rows', async () => {
    const frame = testFrame('Summary', { source: ['A', 'B'], target: ['B', null] });
    const snapshot = value(
      await normalizeGraphFrames({
        data: { series: [frame] },
        options: {
          nodeIdField: 'source',
          targetField: 'target',
          isLogic: true,
        },
      })
    );

    const view = createGraphFrameViewState({
      phase: 'loading',
      pending: true,
      runtime: { version: 3, snapshot },
    });

    expect(view.summary).toEqual({
      frameCount: 1,
      rowCount: 2,
      nodeCount: 2,
      edgeCount: 1,
      namespaceCount: 1,
      topologySignature: snapshot.topologySignature,
    });
    expect(view).toEqual({
      phase: 'loading',
      pending: true,
      hasCommittedState: true,
      committedVersion: 3,
      summary: view.summary,
      diagnostics: [],
    });
    expect(createGraphFrameViewState({ phase: 'idle', pending: false })).toEqual({
      phase: 'idle',
      pending: false,
      hasCommittedState: false,
      committedVersion: undefined,
      summary: undefined,
      diagnostics: [],
    });
  });
});
