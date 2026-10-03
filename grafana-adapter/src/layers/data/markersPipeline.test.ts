import { testFrame } from '../../../test/frames';
import { createTheme, type PanelData } from '@grafana/data';

import { GrafanaGraphPipeline, type GrafanaGraphPipelineInput } from '../../graph/frame/pipeline';

import { normalizeGraphFrames } from '../../graph/frame/normalize';

const normalizeInput = (input: GrafanaGraphPipelineInput) =>
  normalizeGraphFrames({ data: input.data, options: input.layers[0].options });
import { getGraphNodePosition } from '../../graph/frame/testFixtures';
import { MOC_LOC_FIELD } from '@vaduga/mapgl-core/types/defaults';
import { createDefaultMarkersConfig } from './markersDefaults';
import { createMarkersLayersPipelineInput, createMarkersPipelineInput, resolveMarkersConfig } from './markersPipeline';
import { mockEdgeGraphData, mockTextConfig } from './mockData';

const data = {
  series: [testFrame('saved-query', { source: ['A', 'B'], target: ['B', null] })],
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
      isNestEdges: true,
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
    expect(input.layers[0].options).toMatchObject({
      layerName: 'saved graph',
      nodeIdField: 'source',
      targetField: 'target',
      edgeIdField: 'edge',
      layoutSignature: 'layout:RL',
    });
    expect(input.layers[0].graphOptions).toEqual({ layerIndex: 3, wrap: 2, nest: true });
    expect(input.layers[0].visualConfig.style).toEqual(
      expect.objectContaining({
        color: expect.objectContaining({ fixed: 'red' }),
        size: expect.objectContaining({ fixed: 25 }),
      })
    );
    const normalized = await normalizeInput(input);
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
    expect(input.layers[0].options).toMatchObject({
      nodeIdField: MOC_LOC_FIELD,
      targetField: 'target',
      edgeIdField: 'edgeId',
    });
    expect(input.layers[0].visualConfig.style.text).toEqual(mockTextConfig);
    expect(input.layers[0].visualConfig.edgeStyle.arrow).toBe(1);
    const normalized = await normalizeInput(input);
    expect(normalized.ok && normalized.value.nodes).toHaveLength(3);
    expect(normalized.ok && normalized.value.relations.recordCount).toBe(4);
  });

  it('preserves geographic coordinates for an existing saved layer', async () => {
    const geographicData = {
      series: [
        testFrame('geo-query', {
          source: ['A', 'B'],
          target: ['B', null],
          longitude: [104.28, 104.31],
          latitude: [52.29, 52.31],
        }),
      ],
    } as PanelData;
    const layer = {
      ...createDefaultMarkersConfig(),
      name: 'saved geographic graph',
      locField: 'source',
      parField: 'target',
    };

    const normalized = await normalizeInput(
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

  it('uses one shared external namespace for Geo layers with stale namespace config', async () => {
    const geographicData = {
      series: [
        testFrame('geo-query-with-namespaces', {
          source: ['A', 'B'],
          target: ['B', null],
          sourceNs: ['site.one', 'site.two'],
          targetNs: ['site.one', 'site.two'],
          longitude: [104.28, 104.31],
          latitude: [52.29, 52.31],
        }),
      ],
    } as PanelData;
    const layer = {
      ...createDefaultMarkersConfig(),
      name: 'saved geographic graph with stale namespaces',
      locField: 'source',
      parField: 'target',
      config: {
        ...(createDefaultMarkersConfig().config ?? {}),
        vertexA_NS: 'sourceNs',
        vertexB_NS: 'targetNs',
      },
    };

    const input = createMarkersPipelineInput({
      data: geographicData,
      layer,
      theme: createTheme(),
      isLogic: false,
      useMockData: false,
    });
    const normalized = await normalizeInput(input);

    expect(input.layers[0].options).toMatchObject({
      defaultNamespace: 'external',
      sourceNamespaceField: undefined,
      targetNamespaceField: undefined,
    });
    expect(normalized.ok && normalized.value.namespaces).toEqual(['external']);
    expect(normalized.ok && normalized.value.nodes.map(({ namespaceId }) => namespaceId)).toEqual([
      'external',
      'external',
    ]);
    expect(normalized.ok && normalized.value.relations.recordCount).toBe(1);
  });

  it('composes all active graph layers in logic mode with per-layer render identity', async () => {
    const logicData = {
      series: [
        testFrame('Core', { source: ['A', 'B'], target: [null, null] }),
        testFrame('Links', { source: ['C', 'A'], target: [null, 'C'] }),
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
    const pipeline = new GrafanaGraphPipeline({});
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
        testFrame('Geo A', { source: ['A'], target: ['B'], longitude: [104.28], latitude: [52.29] }),
        testFrame('Geo B', { source: ['B'], longitude: [104.31], latitude: [52.31] }),
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
    const pipeline = new GrafanaGraphPipeline({});
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
