import { createTheme, toDataFrame, type DataFrame } from '@grafana/data';

import { getNodeData } from '../main';
import { requestGraphLayout } from '../utils/layout-worker-client';
import {
  createGraphViewportFitSignature,
  createGraphPanelRenderState,
  resolveGraphPanelLayout,
  type GraphPanelLayoutState,
  type GraphPanelRenderState,
} from './graphPanelRuntime';
import { GraphFramePipeline, type GraphPipelineInput, type GraphPipelineState } from './pipeline';
import type { GraphVisualConfig } from './types';

jest.mock('../utils/layout-worker-client', () => ({
  ...jest.requireActual('../utils/layout-worker-client'),
  requestGraphLayout: jest.fn(),
}));

const mockedRequestGraphLayout = requestGraphLayout as jest.MockedFunction<typeof requestGraphLayout>;

function visualConfig(isLogic: boolean): GraphVisualConfig {
  const style = {
    color: { fixed: 'green' },
    size: { fixed: 7, min: 5, max: 10 },
  };
  return {
    layerName: 'runtime test',
    locationField: 'source',
    isLogic,
    style,
    edgeStyle: style,
    arcStyle: {
      sideA: style,
      sideB: style,
    },
    arcConfig: {
      height: 0.5,
      tiltIncrement: 7,
      capacity: { fixed: 1 },
    },
  };
}

function input(frame: DataFrame, isLogic: boolean): GraphPipelineInput {
  return {
    data: { series: [frame] },
    options: {
      layerName: 'runtime test',
      nodeIdField: 'source',
      targetField: 'target',
      isLogic,
      layoutSignature: isLogic ? 'logic-layout' : 'geo-layout',
    },
    visualConfig: visualConfig(isLogic),
    theme: createTheme(),
  };
}

function pipeline() {
  return new GraphFramePipeline<GraphPanelLayoutState, GraphPanelRenderState>({
    layout: (context) => resolveGraphPanelLayout(context, undefined),
    render: createGraphPanelRenderState,
  });
}

function successful(
  result: Awaited<ReturnType<GraphFramePipeline<GraphPanelLayoutState, GraphPanelRenderState>['run']>> | undefined
): GraphPipelineState<GraphPanelLayoutState, GraphPanelRenderState> {
  expect(result?.ok).toBe(true);
  if (!result?.ok) {
    throw new Error('Expected a committed graph panel runtime state');
  }
  return result.value;
}

describe('graph panel runtime layout boundary', () => {
  beforeEach(() => {
    mockedRequestGraphLayout.mockReset();
    mockedRequestGraphLayout.mockResolvedValue(undefined);
  });

  it('uses Geo coordinates directly and creates comments without scheduling auto-layout', async () => {
    const frame = toDataFrame({
      refId: 'Geo',
      fields: [
        { name: 'source', values: ['A', 'B'] },
        { name: 'target', values: ['["A",[15,55,0,"handoff","red"],"B"]', null] },
        { name: 'longitude', values: [10, 20] },
        { name: 'latitude', values: [50, 60] },
      ],
    });

    const state = successful(await pipeline().run(input(frame, false)));

    expect(mockedRequestGraphLayout).not.toHaveBeenCalled();
    expect(state.layout.state.positions).toBe(state.graph.state.positions);
    expect(state.render.state.positions).toBe(state.graph.state.positions);
    expect(state.render.state.commentFeatures).toEqual([
      expect.objectContaining({
        geometry: { type: 'Point', coordinates: [15, 55] },
        properties: expect.objectContaining({ text: 'handoff' }),
      }),
    ]);
    expect(getNodeData(state.graph.state.nodeByKey.get(state.snapshot.nodes[0].key)!)?.feature).toBeUndefined();
  });

  it('applies visuals before logic auto-layout and never creates logic comments', async () => {
    let featureAppliedBeforeLayout = false;
    mockedRequestGraphLayout.mockImplementation(async ({ graph }) => {
      featureAppliedBeforeLayout = Boolean(getNodeData(Array.from(graph.nodesBreadthFirst)[0])?.feature);
      return undefined;
    });
    const frame = toDataFrame({
      refId: 'Logic',
      fields: [
        { name: 'source', values: ['A', 'B'] },
        { name: 'target', values: ['["A",[15,55,0,"ignored","red"],"B"]', null] },
      ],
    });

    const state = successful(await pipeline().run(input(frame, true)));

    expect(mockedRequestGraphLayout).toHaveBeenCalledTimes(1);
    expect(featureAppliedBeforeLayout).toBe(true);
    expect(state.render.state.commentFeatures).toEqual([]);
  });

  it('keeps the logic viewport fit signature independent of visual styles', async () => {
    const frame = toDataFrame({
      refId: 'Logic viewport',
      fields: [
        { name: 'source', values: ['A', 'B'] },
        { name: 'target', values: ['B', null] },
      ],
    });
    const state = successful(await pipeline().run(input(frame, true)));
    const basemap = {
      name: 'Node graph',
      type: 'nodeGraph',
      config: { layoutDirection: 'RL', nodeSeparation: 40 },
    };

    const signature = createGraphViewportFitSignature(state.snapshot, true, basemap);

    expect(
      createGraphViewportFitSignature(state.snapshot, true, {
        ...basemap,
        opacity: 0.5,
      })
    ).toBe(signature);
    expect(
      createGraphViewportFitSignature(state.snapshot, true, {
        ...basemap,
        config: { ...basemap.config, layoutDirection: 'TB' },
      })
    ).not.toBe(signature);
  });

  it('refreshes the Geo positions reference when coordinates change', async () => {
    const geoFrame = (longitude: number) =>
      toDataFrame({
        refId: 'Moving Geo',
        fields: [
          { name: 'source', values: ['A', 'B'] },
          { name: 'longitude', values: [longitude, 20] },
          { name: 'latitude', values: [50, 60] },
        ],
      });
    const runtime = pipeline();

    const first = successful(await runtime.run(input(geoFrame(10), false)));
    const moved = successful(await runtime.run(input(geoFrame(11), false)));

    expect(moved.snapshot.topologySignature).toBe(first.snapshot.topologySignature);
    expect(moved.snapshot.geometrySignature).not.toBe(first.snapshot.geometrySignature);
    expect(moved.render.state.positions).toBe(moved.graph.state.positions);
    expect(moved.render.state.positions).not.toBe(first.render.state.positions);
    expect(moved.render.state.positions[0]).toBe(11);
    expect(createGraphViewportFitSignature(moved.snapshot, false)).not.toBe(
      createGraphViewportFitSignature(first.snapshot, false)
    );
  });
});
