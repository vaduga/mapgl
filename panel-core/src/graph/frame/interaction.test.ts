import { toDataFrame, type DataFrame, type InterpolateFunction, type ScopedVars } from '@grafana/data';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema';

import { getDisplayValuesAndLinks } from '../../components/Tooltips/DataHoverView';
import { adjacentEdgeTooltipSectionContributor } from '../../extension-points/featureContracts';
import { clearTooltipInteraction, expandTooltip } from '../../utils/data-click';
import { buildGraphFromSnapshot } from './buildGraph';
import { getGraphInteractionScopedVars, resolveGraphInteraction, resolveGraphInteractionRow } from './interaction';
import { normalizeGraphFrames } from './normalize';
import { createGraphCompatibilityFixtures } from './testFixtures';
import type { GraphBuiltState, GraphFrameSnapshot, GraphStageResult } from './types';

function success<T>(result: GraphStageResult<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('Expected a successful graph stage');
  }
  return result.value;
}

async function graphState(frame: DataFrame): Promise<{
  snapshot: GraphFrameSnapshot;
  graph: GraphBuiltState;
  features: any[];
}> {
  const snapshot = success(
    await normalizeGraphFrames({
      data: { series: [frame] },
      options: {
        layerName: 'interaction graph',
        nodeIdField: 'source',
        targetField: 'target',
        edgeIdField: 'edgeId',
        isLogic: true,
      },
    })
  );
  const graph = success(buildGraphFromSnapshot(snapshot));
  const features = snapshot.nodes.map((record, index) => ({
    id: index,
    locName: record.id,
    graph: graph.nodeByKey.get(record.key)?.parent,
    frameRefId: record.primaryRow.frameRefId,
    rowIndex: record.primaryRow.rowIndex,
  }));
  return { snapshot, graph, features };
}

function binaryNodeInfo(featureIndex: number): any {
  return {
    picked: true,
    featureType: 'points',
    index: 0,
    x: 10,
    y: 20,
    object: {},
    layer: {
      props: {
        data: {
          points: {
            featureIds: { value: Int32Array.from([featureIndex]) },
          },
        },
      },
    },
  };
}

describe('graph frame interaction identity', () => {
  it('maps a binary node hover to its normalized record and primary row', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const state = await graphState(fixtures.explicitUnits);
    const interaction = resolveGraphInteraction(state, binaryNodeInfo(2));

    expect(interaction).toMatchObject({
      kind: 'node',
      record: { id: 'C', namespaceId: 'external' },
      primaryRow: { frameRefId: 'Explicit', rowIndex: 4 },
      row: { frameRefId: 'Explicit', rowIndex: 4 },
      values: { nodeId: 'C', namespaceId: 'external' },
    });
  });

  it('maps an edge hover to its logical record and selected unit row', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const state = await graphState(fixtures.explicitUnits);
    const interaction = resolveGraphInteraction(state, {
      picked: true,
      object: {
        edgeRef: 1,
        edgeId: 'trace-1--dup-1',
        properties: { id: 0 },
      },
    });

    expect(interaction).toMatchObject({
      kind: 'edge',
      runtimeId: 'trace-1--dup-1',
      record: {
        id: 'trace-1',
        sourceId: 'A',
        targetId: 'C',
      },
      primaryRow: { rowIndex: 0 },
      unitRow: { rowIndex: 1 },
      row: { rowIndex: 1 },
      values: {
        edgeId: 'trace-1',
        sourceId: 'A',
        targetId: 'C',
        namespaceId: 'external',
      },
    });
    expect(interaction?.rows.map(({ rowIndex }) => rowIndex)).toEqual([0, 1]);
  });

  it('resolves the exact normalized frame and never falls back to the first frame', () => {
    const first = toDataFrame({
      refId: 'First',
      fields: [{ name: 'source', values: ['wrong'] }],
    });
    const selected = toDataFrame({
      refId: 'Selected',
      fields: [{ name: 'source', values: ['right'] }],
    });
    const interaction = {
      kind: 'node' as const,
      key: 'external:right',
      record: {
        index: 0,
        key: 'external:right',
        id: 'right',
        namespaceId: 'external',
        primaryRow: { frameIndex: 1, frameRefId: 'Selected', rowIndex: 0 },
        rows: [{ frameIndex: 1, frameRefId: 'Selected', rowIndex: 0 }],
      },
      primaryRow: { frameIndex: 1, frameRefId: 'Selected', rowIndex: 0 },
      row: { frameIndex: 1, frameRefId: 'Selected', rowIndex: 0 },
      rows: [{ frameIndex: 1, frameRefId: 'Selected', rowIndex: 0 }],
      values: { nodeId: 'right', namespaceId: 'external' },
    };

    expect(resolveGraphInteractionRow([first, selected], interaction)?.frame).toBe(selected);
    expect(
      resolveGraphInteractionRow([first], {
        ...interaction,
        record: {
          ...interaction.record,
          primaryRow: { frameIndex: 4, frameRefId: 'Missing', rowIndex: 0 },
        },
        primaryRow: { frameIndex: 4, frameRefId: 'Missing', rowIndex: 0 },
        row: { frameIndex: 4, frameRefId: 'Missing', rowIndex: 0 },
      })
    ).toBeUndefined();
  });

  it('preserves a flat edge reference on adjacent edge records', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const state = await graphState(fixtures.explicitUnits);
    const edge = state.graph.edgeIndex.getRecordEdge(0, 1)!;
    const sections = adjacentEdgeTooltipSectionContributor.getSections({
      graph: state.graph.graph,
      edgeIndex: state.graph.edgeIndex,
      adjacentEdges: { outgoing: [edge] },
    });

    expect(sections[0].outgoing[0]).toMatchObject({ edgeRef: state.graph.edgeIndex.getEdgeRef(edge) });
    expect(sections[0].outgoing[0]).not.toHaveProperty('graphFrame');
  });

  it('pins normalized node identity and clears it on close and outside click', async () => {
    const fixtures = createGraphCompatibilityFixtures();
    const state = await graphState(fixtures.explicitUnits);
    const setTooltipObject = jest.fn();
    const setHoverInfo = jest.fn();
    const select = jest.fn();
    const panel = {
      features: state.features,
      graphFrameRuntime: {
        snapshot: state.snapshot,
        graph: { state: state.graph },
      },
    };
    const props = {
      pId: 'panel-1',
      setSelCoord: jest.fn(),
      setTooltipObject,
      setHoverInfo,
      setLocalViewState: jest.fn(),
    };

    expandTooltip(binaryNodeInfo(0), panel, {}, props, select);
    expect(setTooltipObject).toHaveBeenLastCalledWith(
      expect.objectContaining({
        graphInteraction: expect.objectContaining({
          kind: 'node',
          record: expect.objectContaining({ id: 'A' }),
        }),
      })
    );

    const edge = state.graph.edgeIndex.getRecordEdge(0, 1)!;
    expandTooltip(
      {
        picked: true,
        x: 10,
        y: 20,
        object: {
          edgeRef: 1,
          edgeId: edge.id,
          properties: {
            id: 0,
            locName: edge.source.id,
            graph: edge.source.parent,
            rowIndex: 1,
          },
        },
      },
      panel,
      {},
      props,
      select
    );
    expect(setTooltipObject).toHaveBeenLastCalledWith(
      expect.objectContaining({
        graphInteraction: expect.objectContaining({
          kind: 'edge',
          unitRow: expect.objectContaining({ rowIndex: 1 }),
          record: expect.objectContaining({ id: 'trace-1' }),
        }),
      })
    );

    clearTooltipInteraction({ setTooltipObject, setHoverInfo });
    expect(setTooltipObject).toHaveBeenLastCalledWith({});
    expect(setHoverInfo).toHaveBeenLastCalledWith({});

    setTooltipObject.mockClear();
    setHoverInfo.mockClear();
    expandTooltip({ picked: false }, panel, {}, props, select);
    expect(setTooltipObject).toHaveBeenCalledWith({});
    expect(setHoverInfo).toHaveBeenCalledWith({});
  });

  it('resolves graph-scoped data links while retaining original row fields', async () => {
    const frame = toDataFrame({
      refId: 'Links',
      fields: [
        {
          name: 'edgeId',
          values: ['raw-edge'],
          config: {
            links: [
              {
                title: 'Open ${edgeId}',
                url: 'https://example.com/${sourceId}/${targetId}?metric=${__data.fields.metric}',
              },
            ],
          },
        },
        { name: 'metric', values: [42] },
      ],
    });
    const fixtures = createGraphCompatibilityFixtures();
    const state = await graphState(fixtures.explicitUnits);
    const interaction = resolveGraphInteraction(state, {
      object: { edgeRef: 0, edgeId: 'trace-1', properties: { id: 0 } },
    });
    expect(interaction?.kind).toBe('edge');
    if (!interaction) {
      throw new Error('Expected an edge interaction');
    }

    const replaceVariables: InterpolateFunction = (value, scopedVars) =>
      value.replace(/\$\{([^}]+)\}/g, (_match, name: string) => scopedValue(name, scopedVars));
    const result = getDisplayValuesAndLinks(
      frame,
      [],
      [],
      [],
      undefined,
      0,
      0,
      0,
      SortOrder.None,
      TooltipDisplayMode.Single,
      getGraphInteractionScopedVars(interaction),
      replaceVariables
    );

    expect(result?.links).toEqual([
      expect.objectContaining({
        title: 'Open trace-1',
        href: 'https://example.com/A/C?metric=42',
      }),
    ]);
  });
});

function scopedValue(name: string, scopedVars: ScopedVars | undefined): string {
  if (name.startsWith('__data.fields.')) {
    const fieldName = name.slice('__data.fields.'.length);
    const context = scopedVars?.__dataContext?.value;
    const field = context?.frame.fields.find((candidate) => candidate.name === fieldName);
    return String(field?.values[context?.rowIndex ?? 0] ?? '');
  }
  return String(scopedVars?.[name]?.value ?? '');
}
