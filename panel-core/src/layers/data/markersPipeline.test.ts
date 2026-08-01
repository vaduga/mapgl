import { createTheme, toDataFrame, type PanelData } from '@grafana/data';

import { GraphFramePipeline } from '../../graph/frame';
import { normalizeGraphFrames } from '../../graph/frame/normalize';
import { getGraphNodePosition } from '../../graph/frame/testFixtures';
import { MOC_LOC_FIELD } from '../../types/defaults';
import { createDefaultMarkersConfig } from './markersDefaults';
import { createMarkersLayersPipelineInput, createMarkersPipelineInput, resolveMarkersConfig } from './markersPipeline';
import { mockEdgeGraphData, mockTextConfig } from './mockData';

const data = {
  series: [
    toDataFrame({
      refId: 'saved-query',
      fields: [
        { name: 'source', values: ['A', 'B'] },
        { name: 'target', values: ['B', null] },
      ],
    }),
  ],
} as PanelData;

describe('markers graph pipeline adapter', () => {
  it('maps existing saved layer fields and partial visual options without migration', async () => {
    const layer = {
      ...createDefaultMarkersConfig(),
      name: 'saved graph',
      locField: 'source',
      parField: 'target',
      edgeIdField: 'edge',
      isWrapEdges: 2,
      config: {
        style: {
          color: { fixed: 'red' },
        },
      },
    };

    const input = createMarkersPipelineInput({
      data,
      layer,
      theme: createTheme(),
      isLogic: true,
      useMockData: false,
      layoutSignature: 'layout:RL',
      layerIndex: 3,
    });

    expect(input.data).toBe(data);
    expect(input.options).toMatchObject({
      layerName: 'saved graph',
      nodeIdField: 'source',
      targetField: 'target',
      edgeIdField: 'edge',
      layoutSignature: 'layout:RL',
    });
    expect(input.graphOptions).toEqual({ layerIndex: 3, wrap: 2 });
    expect(input.visualConfig.style).toEqual(
      expect.objectContaining({
        color: expect.objectContaining({ fixed: 'red' }),
        size: expect.objectContaining({ fixed: 25 }),
      })
    );
    const normalized = await normalizeGraphFrames(input);
    expect(normalized.ok && normalized.value.nodes).toHaveLength(2);
    expect(normalized.ok && normalized.value.relations.recordCount).toBe(1);
  });

  it('routes a fresh panel mock through the same graph input contract', async () => {
    const input = createMarkersPipelineInput({
      data,
      layer: createDefaultMarkersConfig(),
      theme: createTheme(),
      isLogic: true,
      useMockData: true,
    });

    expect(input.data.series).toEqual([mockEdgeGraphData]);
    expect(input.options).toMatchObject({
      nodeIdField: MOC_LOC_FIELD,
      targetField: 'target',
      edgeIdField: 'edgeId',
    });
    expect(input.visualConfig.style.text).toEqual(mockTextConfig);
    expect(input.visualConfig.edgeStyle.arrow).toBe(1);
    const normalized = await normalizeGraphFrames(input);
    expect(normalized.ok && normalized.value.nodes).toHaveLength(3);
    expect(normalized.ok && normalized.value.relations.recordCount).toBe(4);
  });

  it('preserves geographic coordinates for an existing saved layer', async () => {
    const geographicData = {
      series: [
        toDataFrame({
          refId: 'geo-query',
          fields: [
            { name: 'source', values: ['A', 'B'] },
            { name: 'target', values: ['B', null] },
            { name: 'longitude', values: [104.28, 104.31] },
            { name: 'latitude', values: [52.29, 52.31] },
          ],
        }),
      ],
    } as PanelData;
    const layer = {
      ...createDefaultMarkersConfig(),
      name: 'saved geographic graph',
      locField: 'source',
      parField: 'target',
    };

    const normalized = await normalizeGraphFrames(
      createMarkersPipelineInput({
        data: geographicData,
        layer,
        theme: createTheme(),
        isLogic: false,
        useMockData: false,
      })
    );

    expect(normalized.ok).toBe(true);
    expect(
      normalized.ok && normalized.value.nodes.map((record) => getGraphNodePosition(normalized.value, record))
    ).toEqual([
      [104.28, 52.29],
      [104.31, 52.31],
    ]);
    expect(normalized.ok && normalized.value.relations.recordCount).toBe(1);
  });

  it('composes all active graph layers in logic mode with per-layer render identity', async () => {
    const logicData = {
      series: [
        toDataFrame({
          refId: 'Core',
          fields: [
            { name: 'source', values: ['A', 'B'] },
            { name: 'target', values: [null, null] },
          ],
        }),
        toDataFrame({
          refId: 'Links',
          fields: [
            { name: 'source', values: ['C', 'A'] },
            { name: 'target', values: [null, 'C'] },
          ],
        }),
      ],
    } as PanelData;
    const input = createMarkersLayersPipelineInput({
      data: logicData,
      layers: [
        {
          layer: {
            ...createDefaultMarkersConfig(),
            name: 'core nodes',
            locField: 'source',
            query: { id: 'byRefId', options: 'Core' },
          },
          layerIndex: 1,
        },
        {
          layer: {
            ...createDefaultMarkersConfig(),
            name: 'linked nodes',
            locField: 'source',
            parField: 'target',
            query: { id: 'byRefId', options: 'Links' },
          },
          layerIndex: 4,
        },
      ],
      theme: createTheme(),
      isLogic: true,
      useMockData: false,
    });
    const pipeline = new GraphFramePipeline<null, null>({
      layout: () => null,
      render: () => null,
    });
    const result = await pipeline.run(input);

    expect(result?.ok).toBe(true);
    if (!result?.ok) {
      return;
    }

    expect(result.value.snapshot.nodes.map(({ id }) => id)).toEqual(['A', 'B', 'C']);
    expect(result.value.snapshot.relations.getRecordId(0)).toBe('A-C');
    expect(result.value.snapshot.nodes.map(({ primaryRow }) => primaryRow.layerIndex)).toEqual([0, 0, 1]);
    expect(result.value.visual.state.nodes.map(({ feature }) => feature.layerName)).toEqual([
      'core nodes',
      'core nodes',
      'linked nodes',
    ]);
    expect(result.value.visual.state.edgeUnits[0]!.feature.layerName).toBe('linked nodes');
    expect(result.value.visual.state.featureSources.map(({ features }) => features.length)).toEqual([2, 1]);
    expect(result.value.graph.state.edgeIndex.getRecordLayerIndex(0)).toBe(4);
  });

  it('resolves geographic edges whose targets are supplied by another active graph layer', async () => {
    const geographicData = {
      series: [
        toDataFrame({
          refId: 'Geo A',
          fields: [
            { name: 'source', values: ['A'] },
            { name: 'target', values: ['B'] },
            { name: 'longitude', values: [104.28] },
            { name: 'latitude', values: [52.29] },
          ],
        }),
        toDataFrame({
          refId: 'Geo B',
          fields: [
            { name: 'source', values: ['B'] },
            { name: 'longitude', values: [104.31] },
            { name: 'latitude', values: [52.31] },
          ],
        }),
      ],
    } as PanelData;
    const input = createMarkersLayersPipelineInput({
      data: geographicData,
      layers: [
        {
          layer: {
            ...createDefaultMarkersConfig(),
            name: 'geo A',
            locField: 'source',
            parField: 'target',
            query: { id: 'byRefId', options: 'Geo A' },
          },
          layerIndex: 0,
        },
        {
          layer: {
            ...createDefaultMarkersConfig(),
            name: 'geo B',
            locField: 'source',
            query: { id: 'byRefId', options: 'Geo B' },
          },
          layerIndex: 1,
        },
      ],
      theme: createTheme(),
      isLogic: false,
      useMockData: false,
    });
    const pipeline = new GraphFramePipeline<null, null>({
      layout: () => null,
      render: () => null,
    });
    const result = await pipeline.run(input);

    expect(result?.ok).toBe(true);
    if (!result?.ok) {
      return;
    }

    expect(result.value.snapshot.nodes.map((record) => getGraphNodePosition(result.value.snapshot, record))).toEqual([
      [104.28, 52.29],
      [104.31, 52.31],
    ]);
    expect(result.value.snapshot.relations.recordCount).toBe(1);
    expect(result.value.diagnostics).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'dangling-target' })])
    );
    expect(result.value.visual.state.featureSources.map(({ features }) => features.length)).toEqual([1, 1]);
  });

  it('does not mutate saved partial configuration while filling defaults', () => {
    const configured = {
      style: {
        color: { fixed: 'orange' },
      },
    };

    const resolved = resolveMarkersConfig(configured);

    expect(resolved.style.color?.fixed).toBe('orange');
    expect(resolved.style.size?.fixed).toBe(25);
    expect(configured).toEqual({
      style: {
        color: { fixed: 'orange' },
      },
    });
  });
});
