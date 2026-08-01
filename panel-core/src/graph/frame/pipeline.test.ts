import { createTheme, toDataFrame, type DataFrame } from '@grafana/data';

import { buildGraphFromSnapshot } from './buildGraph';
import { normalizeGraphFrames } from './normalize';
import { GraphFramePipeline, type GraphPipelineInput, type GraphPipelineState } from './pipeline';
import type { GraphVisualConfig } from './types';

interface LayoutState {
  readonly id: string;
}

interface RenderState {
  readonly nodeSizes: ReadonlyArray<number | undefined>;
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((next, fail) => {
    resolve = next;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function visualConfig(): GraphVisualConfig {
  return {
    layerName: 'pipeline test',
    locationField: 'source',
    isLogic: true,
    style: {
      color: { fixed: 'green' },
      size: { field: 'metric', fixed: 7, min: 5, max: 10 },
    },
    edgeStyle: {
      color: { fixed: 'blue' },
      size: { fixed: 2, min: 1, max: 10 },
    },
    arcStyle: {
      sideA: {
        color: { fixed: 'blue' },
        size: { fixed: 2, min: 1, max: 10 },
      },
      sideB: {
        color: { fixed: 'blue' },
        size: { fixed: 2, min: 1, max: 10 },
      },
    },
    arcConfig: {
      height: 0.5,
      tiltIncrement: 7,
      capacity: { fixed: 1 },
    },
  };
}

function graphFrame(refId: string, metric: number[], sources = ['A', 'B']): DataFrame {
  return toDataFrame({
    refId,
    fields: [
      { name: 'source', values: sources },
      { name: 'target', values: sources.length === 2 ? [sources[1], null] : sources.map(() => null) },
      { name: 'metric', values: metric },
    ],
  });
}

function input(frame: DataFrame, layoutSignature = 'layout:RL'): GraphPipelineInput {
  return {
    data: { series: [frame] },
    options: {
      layerName: 'pipeline test',
      nodeIdField: 'source',
      targetField: 'target',
      isLogic: true,
      layoutSignature,
    },
    visualConfig: visualConfig(),
    theme: createTheme(),
  };
}

function geoInput(frame: DataFrame): GraphPipelineInput {
  return {
    ...input(frame),
    options: {
      layerName: 'pipeline test',
      nodeIdField: 'source',
      targetField: 'target',
      isLogic: false,
      layoutSignature: 'layout:geo',
    },
    visualConfig: {
      ...visualConfig(),
      isLogic: false,
    },
  };
}

function successful(
  result: Awaited<ReturnType<GraphFramePipeline<LayoutState, RenderState>['run']>> | undefined
): GraphPipelineState<LayoutState, RenderState> {
  expect(result?.ok).toBe(true);
  if (!result?.ok) {
    throw new Error('Expected a committed graph pipeline state');
  }
  return result.value;
}

function createPipeline(
  overrides: {
    normalize?: typeof normalizeGraphFrames;
    buildGraph?: typeof buildGraphFromSnapshot;
    layout?: (
      context: Parameters<ConstructorParameters<typeof GraphFramePipeline<LayoutState, RenderState>>[0]['layout']>[0]
    ) => Promise<LayoutState> | LayoutState;
    render?: (
      context: Parameters<ConstructorParameters<typeof GraphFramePipeline<LayoutState, RenderState>>[0]['render']>[0]
    ) => Promise<RenderState> | RenderState;
    commit?: (state: GraphPipelineState<LayoutState, RenderState>) => void;
    notify?: (state: GraphPipelineState<LayoutState, RenderState>) => Promise<void> | void;
  } = {}
) {
  return new GraphFramePipeline<LayoutState, RenderState>({
    normalize: overrides.normalize,
    buildGraph: overrides.buildGraph,
    layout: overrides.layout ?? (() => ({ id: 'layout' })),
    render:
      overrides.render ??
      ((context) => ({
        nodeSizes: context.visual.nodes.map(({ style }) => style.size),
      })),
    commit: overrides.commit,
    notify: overrides.notify,
  });
}

describe('GraphFramePipeline', () => {
  it('publishes a complete state in one commit and notifies only after commit', async () => {
    const renderStarted = deferred<void>();
    const releaseRender = deferred<void>();
    const events: string[] = [];
    let pipeline!: GraphFramePipeline<LayoutState, RenderState>;
    const pipelineInstance = createPipeline({
      render: async (context) => {
        renderStarted.resolve();
        await releaseRender.promise;
        return {
          nodeSizes: context.visual.nodes.map(({ style }) => style.size),
        };
      },
      commit: (state) => {
        expect(state.snapshot.nodes).toHaveLength(2);
        expect(state.graph.state.nodeByKey.size).toBe(2);
        expect(state.visual.state.nodes).toHaveLength(2);
        events.push('commit');
      },
      notify: (state) => {
        expect(pipeline.state).toBe(state);
        events.push('notify');
      },
    });
    pipeline = pipelineInstance;

    const pending = pipeline.run(input(graphFrame('Atomic', [0, 100])));
    await renderStarted.promise;
    expect(pipeline.state).toBeUndefined();
    expect(events).toEqual([]);

    releaseRender.resolve();
    const state = successful(await pending);
    expect(state.version).toBe(1);
    expect(events).toEqual(['commit', 'notify']);
  });

  it('commits valid entities and recoverable diagnostics together', async () => {
    const frame = toDataFrame({
      refId: 'Partial',
      fields: [
        { name: 'source', values: ['A', 'B', 'C'] },
        { name: 'target', values: ['B', null, 'missing'] },
        { name: 'metric', values: [1, 2, 3] },
      ],
    });
    const state = successful(await createPipeline().run(input(frame)));

    expect(state.snapshot.nodes).toHaveLength(3);
    expect(state.snapshot.relations.recordCount).toBe(1);
    expect(state.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'dangling-target', severity: 'warning' })])
    );
  });

  it('does not replace the committed baseline after a fatal frame configuration result', async () => {
    const commits: string[] = [];
    const pipeline = createPipeline({
      commit: (state) => commits.push(state.snapshot.frames[0].frameRefId ?? ''),
    });
    const baseline = successful(await pipeline.run(input(graphFrame('Baseline', [0, 1]))));
    const invalid = input(
      toDataFrame({
        refId: 'Invalid',
        fields: [{ name: 'wrongNodeField', values: ['A'] }],
      })
    );

    const result = await pipeline.run(invalid);

    expect(result).toMatchObject({ ok: false });
    expect(pipeline.state).toBe(baseline);
    expect(commits).toEqual(['Baseline']);
  });

  it('does not replace the committed baseline when a downstream stage fails', async () => {
    let failLayout = false;
    const pipeline = createPipeline({
      layout: () => {
        if (failLayout) {
          throw new Error('layout failed');
        }
        return { id: 'layout' };
      },
    });
    const baseline = successful(await pipeline.run(input(graphFrame('Baseline', [0, 1]))));

    failLayout = true;
    await expect(pipeline.run(input(graphFrame('Changed', [0, 1, 2], ['A', 'B', 'C'])))).rejects.toThrow(
      'layout failed'
    );

    expect(pipeline.state).toBe(baseline);
  });

  it('lets a newer update invalidate normalization before the older update can commit', async () => {
    const firstStarted = deferred<void>();
    const releaseFirst = deferred<void>();
    const commits: string[] = [];
    const normalize = jest.fn(async (normalizationInput) => {
      if (normalizationInput.data.series[0].refId === 'First') {
        firstStarted.resolve();
        await releaseFirst.promise;
      }
      return normalizeGraphFrames(normalizationInput);
    });
    const pipeline = createPipeline({
      normalize,
      commit: (state) => commits.push(state.snapshot.frames[0].frameRefId ?? ''),
    });

    const first = pipeline.run(input(graphFrame('First', [0, 10])));
    await firstStarted.promise;
    const second = pipeline.run(input(graphFrame('Second', [10, 0])));
    releaseFirst.resolve();

    expect(await first).toBeUndefined();
    const state = successful(await second);
    expect(state.snapshot.frames[0].frameRefId).toBe('Second');
    expect(commits).toEqual(['Second']);
  });

  it('reuses graph state but recomputes logic layout when resolved node sizes change', async () => {
    const buildGraph = jest.fn(buildGraphFromSnapshot);
    const layout = jest.fn(({ snapshot }) => ({ id: snapshot.topologySignature }));
    const pipeline = createPipeline({ buildGraph, layout });
    const first = successful(await pipeline.run(input(graphFrame('Metrics', [0, 100]))));
    const second = successful(await pipeline.run(input(graphFrame('Metrics', [100, 0]))));

    expect(buildGraph).toHaveBeenCalledTimes(1);
    expect(layout).toHaveBeenCalledTimes(2);
    expect(second.graph.state).toBe(first.graph.state);
    expect(second.layout.state).not.toBe(first.layout.state);
    expect(second.layout.reused).toBe(false);
    expect(second.visual.state).not.toBe(first.visual.state);
    expect(first.render.state.nodeSizes).toEqual([5, 10]);
    expect(second.render.state.nodeSizes).toEqual([10, 5]);
  });

  it('reuses logic layout when only non-geometric visuals change', async () => {
    const layout = jest.fn(({ snapshot }) => ({ id: snapshot.topologySignature }));
    const pipeline = createPipeline({ layout });
    const frame = graphFrame('Colors', [0, 100]);
    const firstInput = input(frame);
    const secondInput = {
      ...input(frame),
      visualConfig: {
        ...visualConfig(),
        style: {
          ...visualConfig().style,
          color: { fixed: 'red' },
        },
      },
    };

    const first = successful(await pipeline.run(firstInput));
    const changed = successful(await pipeline.run(secondInput));

    expect(layout).toHaveBeenCalledTimes(1);
    expect(changed.layout.state).toBe(first.layout.state);
    expect(changed.layout.reused).toBe(true);
    expect(changed.visual.state).not.toBe(first.visual.state);
  });

  it('recomputes logic layout when edge arrows or their resolved length change', async () => {
    const layout = jest.fn(({ snapshot }) => ({ id: snapshot.topologySignature }));
    const pipeline = createPipeline({ layout });
    const frame = graphFrame('Arrows', [0, 1]);
    const withEdgeStyle = (arrow: 0 | 1, size: number): GraphPipelineInput => {
      const base = input(frame);
      return {
        ...base,
        visualConfig: {
          ...base.visualConfig,
          edgeStyle: {
            ...base.visualConfig.edgeStyle,
            arrow,
            size: { fixed: size, min: 1, max: 10 },
          },
        },
      };
    };

    const first = successful(await pipeline.run(withEdgeStyle(0, 2)));
    const withArrow = successful(await pipeline.run(withEdgeStyle(1, 2)));
    const longerArrow = successful(await pipeline.run(withEdgeStyle(1, 4)));

    expect(layout).toHaveBeenCalledTimes(3);
    expect(withArrow.graph.state).toBe(first.graph.state);
    expect(longerArrow.graph.state).toBe(first.graph.state);
    expect(withArrow.layout.reused).toBe(false);
    expect(longerArrow.layout.reused).toBe(false);
  });

  it('rebuilds graph and layout for topology changes but only layout for layout options', async () => {
    const buildGraph = jest.fn(buildGraphFromSnapshot);
    const layout = jest.fn(({ snapshot }) => ({ id: snapshot.topologySignature }));
    const pipeline = createPipeline({ buildGraph, layout });

    const first = successful(await pipeline.run(input(graphFrame('Topology', [0, 1]))));
    const changedGraph = successful(await pipeline.run(input(graphFrame('Topology', [0, 1, 2], ['A', 'B', 'C']))));
    const changedLayout = successful(
      await pipeline.run(input(graphFrame('Topology', [0, 1, 2], ['A', 'B', 'C']), 'layout:TB'))
    );

    expect(first.snapshot.topologySignature).not.toBe(changedGraph.snapshot.topologySignature);
    expect(changedGraph.snapshot.topologySignature).toBe(changedLayout.snapshot.topologySignature);
    expect(buildGraph).toHaveBeenCalledTimes(2);
    expect(layout).toHaveBeenCalledTimes(3);
    expect(changedLayout.graph.state).toBe(changedGraph.graph.state);
    expect(changedGraph.layout.reused).toBe(false);
    expect(changedLayout.layout.reused).toBe(false);
  });

  it('rebuilds graph state when saved edge build options change', async () => {
    const buildGraph = jest.fn(buildGraphFromSnapshot);
    const layout = jest.fn(({ snapshot }) => ({ id: snapshot.topologySignature }));
    const pipeline = createPipeline({ buildGraph, layout });
    const frame = graphFrame('BuildOptions', [0, 1]);

    const first = successful(await pipeline.run(input(frame)));
    const changed = successful(
      await pipeline.run({
        ...input(frame),
        graphOptions: { layerIndex: 2, wrap: 1 },
      })
    );
    const reused = successful(
      await pipeline.run({
        ...input(frame),
        graphOptions: { layerIndex: 2, wrap: 1 },
      })
    );

    expect(buildGraph).toHaveBeenCalledTimes(2);
    expect(layout).toHaveBeenCalledTimes(2);
    expect(changed.graph.state).not.toBe(first.graph.state);
    expect(changed.layout.reused).toBe(false);
    expect(reused.graph.state).toBe(changed.graph.state);
    expect(reused.layout.reused).toBe(true);
  });

  it('rebuilds changed row metadata without recomputing logic layout', async () => {
    const buildGraph = jest.fn(buildGraphFromSnapshot);
    const layout = jest.fn(({ snapshot }) => ({ id: snapshot.topologySignature }));
    const pipeline = createPipeline({ buildGraph, layout });

    const first = successful(await pipeline.run(input(graphFrame('First ref', [0, 1]))));
    const changed = successful(await pipeline.run(input(graphFrame('Changed ref', [0, 1]))));

    expect(changed.snapshot.topologySignature).toBe(first.snapshot.topologySignature);
    expect(buildGraph).toHaveBeenCalledTimes(2);
    expect(layout).toHaveBeenCalledTimes(1);
    expect(changed.graph.state).not.toBe(first.graph.state);
    expect(changed.layout.state).toBe(first.layout.state);
    expect(changed.layout.reused).toBe(true);
  });

  it('rebuilds Geo graph and layout state when node geometry changes', async () => {
    const buildGraph = jest.fn(buildGraphFromSnapshot);
    const layout = jest.fn(({ snapshot }) => ({ id: snapshot.geometrySignature }));
    const pipeline = createPipeline({ buildGraph, layout });
    const frame = (longitude: number) =>
      toDataFrame({
        refId: 'Geo',
        fields: [
          { name: 'source', values: ['A', 'B'] },
          { name: 'target', values: ['B', null] },
          { name: 'longitude', values: [longitude, 20] },
          { name: 'latitude', values: [50, 60] },
        ],
      });

    const first = successful(await pipeline.run(geoInput(frame(10))));
    const moved = successful(await pipeline.run(geoInput(frame(11))));

    expect(moved.snapshot.topologySignature).toBe(first.snapshot.topologySignature);
    expect(moved.snapshot.geometrySignature).not.toBe(first.snapshot.geometrySignature);
    expect(buildGraph).toHaveBeenCalledTimes(2);
    expect(layout).toHaveBeenCalledTimes(2);
    expect(moved.layout.reused).toBe(false);
  });

  it('rebuilds Geo path metadata without recomputing an unchanged layout', async () => {
    const buildGraph = jest.fn(buildGraphFromSnapshot);
    const layout = jest.fn(({ snapshot }) => ({ id: snapshot.geometrySignature }));
    const pipeline = createPipeline({ buildGraph, layout });
    const frame = (comment: string) =>
      toDataFrame({
        refId: 'Geo comments',
        fields: [
          { name: 'source', values: ['A', 'B'] },
          { name: 'target', values: [`["A",[15,55,0,"${comment}"],"B"]`, null] },
          { name: 'longitude', values: [10, 20] },
          { name: 'latitude', values: [50, 60] },
        ],
      });

    const first = successful(await pipeline.run(geoInput(frame('first'))));
    const edited = successful(await pipeline.run(geoInput(frame('edited'))));

    expect(edited.snapshot.topologySignature).toBe(first.snapshot.topologySignature);
    expect(edited.snapshot.geometrySignature).toBe(first.snapshot.geometrySignature);
    expect(buildGraph).toHaveBeenCalledTimes(2);
    expect(layout).toHaveBeenCalledTimes(1);
    expect(edited.graph.state).not.toBe(first.graph.state);
    expect(edited.layout.reused).toBe(true);
    expect(edited.snapshot.relations.materializeRecordRoute(0, (ref) => edited.snapshot.nodes[ref]?.id)).toEqual([
      'A',
      [15, 55, 0, 'edited'],
      'B',
    ]);
  });

  it('does not let an obsolete layout result overwrite the latest update', async () => {
    const firstLayoutStarted = deferred<void>();
    const releaseFirstLayout = deferred<void>();
    const commits: string[] = [];
    const layout = jest.fn(async ({ snapshot }) => {
      const frameRefId = snapshot.frames[0].frameRefId ?? '';
      if (frameRefId === 'SlowLayout') {
        firstLayoutStarted.resolve();
        await releaseFirstLayout.promise;
      }
      return { id: frameRefId };
    });
    const pipeline = createPipeline({
      layout,
      commit: (state) => commits.push(state.layout.state.id),
    });

    const first = pipeline.run(input(graphFrame('SlowLayout', [0, 1])));
    await firstLayoutStarted.promise;
    const second = pipeline.run(input(graphFrame('LatestLayout', [0, 1])));
    releaseFirstLayout.resolve();

    expect(await first).toBeUndefined();
    const state = successful(await second);
    expect(state.layout.state.id).toBe('LatestLayout');
    expect(commits).toEqual(['LatestLayout']);
  });
});
