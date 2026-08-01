import { performance } from 'perf_hooks';

import { buildGraphFromSnapshot } from './buildGraph';
import { normalizeGraphFrames } from './normalize';
import { createLargeGraphCompatibilityFixture } from './testFixtures';
import type { GraphFrameOptions, GraphStageResult } from './types';

const options: GraphFrameOptions = {
  layerName: 'large graph benchmark',
  nodeIdField: 'source',
  targetField: 'target',
  edgeIdField: 'edgeId',
  isLogic: false,
};

function success<T>(result: GraphStageResult<T>): T {
  if (!result.ok) {
    throw new Error(`Benchmark graph stage failed: ${JSON.stringify(result.diagnostics)}`);
  }
  return result.value;
}

function mib(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

const benchmark = process.env.MAPGL_RUN_GRAPH_BENCHMARK === '1' ? it : it.skip;

describe('large graph compatibility benchmark', () => {
  benchmark(
    'records normalization, graph-build, and retained-heap baselines',
    async () => {
      const nodeCount = Number(process.env.MAPGL_GRAPH_BENCHMARK_NODES ?? 10_000);
      const frame = createLargeGraphCompatibilityFixture(nodeCount);

      global.gc?.();
      const heapBefore = process.memoryUsage().heapUsed;
      const normalizeStarted = performance.now();
      const snapshot = success(await normalizeGraphFrames({ data: { series: [frame] }, options }));
      const normalizeFinished = performance.now();
      const graph = success(buildGraphFromSnapshot(snapshot));
      const buildFinished = performance.now();
      global.gc?.();
      const heapAfter = process.memoryUsage().heapUsed;

      const result = {
        nodeCount: snapshot.nodes.length,
        recordCount: snapshot.relations.recordCount,
        runtimeItemCount: graph.edgeIndex.edgeCount,
        normalizationMs: Math.round((normalizeFinished - normalizeStarted) * 100) / 100,
        graphBuildMs: Math.round((buildFinished - normalizeFinished) * 100) / 100,
        heapUsedAfterBuildMiB: mib(heapAfter),
        retainedHeapDeltaMiB: mib(heapAfter - heapBefore),
      };

      console.info(`[graph-compatibility-benchmark] ${JSON.stringify(result)}`);
      expect(result.nodeCount).toBe(nodeCount);
      expect(result.recordCount).toBe(Math.ceil((nodeCount - 1) / 4));
      expect(result.runtimeItemCount).toBe(nodeCount - 1);
    },
    30_000
  );
});
