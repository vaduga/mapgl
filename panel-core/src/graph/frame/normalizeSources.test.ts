import { arrayColumn, type GraphSource } from '../../data/sources';
import { normalizeGraphSources } from './normalizeSources';
import { buildGraphFromSnapshot } from './buildGraph';
import { resolvePickingFocus } from '../../runtime/picking';
import { getEdgesGeometry } from '../utils/utils.graph-geom';
import { createLayoutRequest } from '../utils/layout-worker-client';
import { getLayoutResult } from '../utils/layout-worker-runner';
import { getLayoutCurveSegments } from '../../deckLayers/GeoJsonEdgesLayer/edges-geojson-layer';
import { GraphHighlighter } from '../../deckLayers/GraphHighlighter';

function source(index: number, ids: string[], targets: unknown[], edgeIds?: string[]): GraphSource {
  return {
    revision: 'baseline',
    key: `query-${index}`,
    index,
    rowCount: ids.length,
    nodeId: arrayColumn('node', ids),
    target: arrayColumn('target', targets),
    edgeId: edgeIds && arrayColumn('edge', edgeIds),
    position: (row) => [row, index],
    value: () => undefined,
  };
}

describe('neutral source normalization', () => {
  it.each([false, true])(
    'keeps the A/B namespace rule without a route override (column present: %s)',
    async (columnPresent) => {
      const graphSource: GraphSource = {
        ...source(0, ['A', 'B', 'B', 'C', 'A'], [null, null, null, null, ['A', 'B', 'C']], ['', '', '', '', 'route']),
        sourceNamespace: arrayColumn('namespace', ['Entry', 'Entry', 'Domain', 'Store', 'Entry']),
        targetNamespace: arrayColumn('targetNamespace', [undefined, undefined, undefined, undefined, 'Store']),
        ...(columnPresent && { routeNamespaces: arrayColumn('routeNamespaces', Array(5).fill(undefined)) }),
      };
      const normalized = await normalizeGraphSources({
        layers: [{ options: { isLogic: true }, sources: [graphSource] }],
      });
      if (!normalized.ok) throw new Error('normalization failed');
      const snapshot = normalized.value;
      const built = buildGraphFromSnapshot(snapshot);
      if (!built.ok) throw new Error('build failed');
      expect(snapshot.diagnostics).toEqual([]);
      expect([...built.value.edgeIndex.getRecordVertexView(0)].map((ref) => snapshot.nodes[ref].key)).toEqual([
        JSON.stringify(['Entry', 'A']),
        JSON.stringify(['Entry', 'B']),
        JSON.stringify(['Store', 'C']),
      ]);
      for (const edge of built.value.edgeIndex.recordEdges(0)) {
        expect(edge.source.parent).toBe(built.value.graph.findNodeRecursive('A')!.parent);
      }
    }
  );

  it('preserves one routed record across intermediate namespaces and picks each hop in its own graph', async () => {
    const graphSource: GraphSource = {
      ...source(
        0,
        ['A', 'B', 'A', 'C', 'A'],
        [null, null, null, null, ['A', 'B', 'A', 'C']],
        ['', '', '', '', 'cross-route']
      ),
      sourceNamespace: arrayColumn('namespace', ['Entry', 'Domain', 'Store', 'Entry', 'Entry']),
      targetNamespace: arrayColumn('targetNamespace', [undefined, undefined, undefined, undefined, 'Entry']),
      routeNamespaces: arrayColumn('routeNamespaces', [
        undefined,
        undefined,
        undefined,
        undefined,
        ['Entry', 'Domain', 'Store', 'Entry'],
      ]),
    };
    const normalized = await normalizeGraphSources({
      layers: [{ options: { isLogic: true }, sources: [graphSource] }],
    });
    if (!normalized.ok) throw new Error('normalization failed');
    const snapshot = normalized.value;
    expect(snapshot.nodes.map((node) => [node.id, node.namespaceId])).toEqual([
      ['A', 'Entry'],
      ['B', 'Domain'],
      ['A', 'Store'],
      ['C', 'Entry'],
    ]);
    expect(snapshot.relations.recordCount).toBe(1);
    expect(snapshot.relations.getRecordId(0)).toBe('cross-route');
    expect(snapshot.diagnostics).toEqual([]);
    const built = buildGraphFromSnapshot(snapshot);
    if (!built.ok) throw new Error('build failed');
    expect([...built.value.edgeIndex.getRecordVertexView(0)]).toEqual([0, 1, 2, 3]);
    expect(built.value.edgeIndex.edgeCount).toBe(3);
    const request = createLayoutRequest({ graph: built.value.graph, positionsLength: snapshot.positions.length });
    const laidOut = getLayoutResult(request);
    const edgeKeys = request.edges.map((edge) => `${edge.sourceGraphId}:${edge.id}`);
    const layout = {
      edgeKeys,
      edgeOffsetStrategies: [],
      curveGroups: new Map(laidOut.curveGroups!.map((group) => [group.graphId, group])),
      edgeIndexes: new Map(edgeKeys.map((key, index) => [key, index])),
      arrowTips: new Map(),
    };
    const geometry = getEdgesGeometry({
      graph: built.value.graph,
      edgeIndex: built.value.edgeIndex,
      positions: laidOut.positions,
      snapshot,
      layout,
      layoutReady: true,
      layoutIncludesProjection: false,
      isLogic: true,
      visibleNamespaces: ['external', 'Entry', 'Domain', 'Store'],
      layerShift: {},
      edgeOffsetStrategies: [],
      terminalGeometryStrategies: [],
    });
    expect(geometry.mappings.map((mapping) => mapping!.graphId)).toEqual(['Entry', 'Domain', 'Store']);
    expect(geometry.mappings[1]).toMatchObject({ arcGraphId: 'Entry' });
    for (const namespace of ['Entry', 'Domain', 'Store']) {
      const features = geometry.routed[namespace];
      expect(features).toHaveLength(1);
      expect(features[0].properties.segrPath).toHaveLength(3);
      const curves = getLayoutCurveSegments(namespace, features, built.value.edgeIndex, layout)!;
      expect(curves.length).toBeGreaterThan(0);
      // Every actual GPU segment maps to the visible feature, rather than the hidden sentinel.
      expect([...curves.segmentFeatureIndexes].every((index) => index === 0)).toBe(true);
    }
    const highlighter = new GraphHighlighter();
    highlighter.setGraph(built.value.graph, { edgeIndex: built.value.edgeIndex, mappings: geometry.mappings });
    highlighter.updateEdge({ edgeId: 'cross-route--1', graphId: 'Domain' });
    expect(highlighter.getConnectedEdgeIndexes().map((index) => index.graphId)).toEqual(['Entry', 'Domain', 'Store']);
    for (let ref = 0; ref < 3; ref++) {
      const picked = resolvePickingFocus(
        { baseline: { snapshot }, render: { ...built.value, features: [] } as any },
        { picked: true, object: { edgeRef: ref } }
      );
      expect(picked).toEqual({
        kind: 'edge',
        id: ref ? `cross-route--${ref}` : 'cross-route',
        namespaceId: ['Entry', 'Domain', 'Store'][ref],
      });
    }
  });

  it.each([
    { values: ['Entry', 'Store'] },
    { values: ['Entry', 'Domain', 'Wrong'] },
    { values: ['Wrong', 'Domain', 'Other'] },
  ])('rejects malformed route namespace arrays: $values', async ({ values }) => {
    const graphSource: GraphSource = {
      ...source(0, ['A', 'B', 'C', 'A'], [null, null, null, ['A', 'B', 'C']], ['', '', '', 'route']),
      sourceNamespace: arrayColumn('ns', ['Entry', 'Domain', 'Other', 'Entry']),
      targetNamespace: arrayColumn('targetNs', [undefined, undefined, undefined, 'Other']),
      routeNamespaces: arrayColumn('routeNs', [undefined, undefined, undefined, values]),
    };
    const result = await normalizeGraphSources({ layers: [{ options: { isLogic: true }, sources: [graphSource] }] });
    if (!result.ok) throw new Error('normalization failed');
    expect(result.value.relations.recordCount).toBe(0);
    expect(result.diagnostics[0].code).toBe('invalid-path');
  });
  it('resolves routes across sources and retains ordered contributing rows for repeated explicit edges', async () => {
    const normalized = await normalizeGraphSources({
      layers: [
        {
          options: { isLogic: true },
          sources: [
            source(0, ['A', 'A'], ['["A","B","C"]', '["A","B","C"]'], ['route', 'route']),
            source(1, ['B', 'C'], [null, null]),
          ],
        },
      ],
    });
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) {
      throw new Error('normalization failed');
    }
    const snapshot = normalized.value;
    expect(snapshot.nodes.map((node) => node.id)).toEqual(['A', 'B', 'C']);
    expect(snapshot.relations.recordCount).toBe(1);
    expect(snapshot.relations.unitCount).toBe(2);
    expect(snapshot.relations.getUnitRow(1)).toMatchObject({ revision: 'baseline', sourceKey: 'query-0', rowIndex: 1 });
    const built = buildGraphFromSnapshot(snapshot);
    expect(built.ok).toBe(true);
    if (!built.ok) {
      throw new Error('build failed');
    }
    expect([...built.value.edgeIndex.recordEdges(0)]).toHaveLength(4);
  });
  it('keeps layer provenance and namespaces while bounding invalid-row diagnostics', async () => {
    const graphSource = {
      ...source(0, ['A', '', '', 'B'], ['B', null, null, null]),
      sourceNamespace: arrayColumn('namespace', ['site.one', null, null, 'site.one']),
    };
    const result = await normalizeGraphSources({
      layers: [{ layerIndex: 2, options: { isLogic: true, diagnosticExampleLimit: 1 }, sources: [graphSource] }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('normalization failed');
    }
    expect(result.value.nodes[0].primaryRow.layerIndex).toBe(2);
    expect(result.value.nodes[0].namespaceId).toBe('site.one');
    const invalid = result.diagnostics.find((diagnostic) => diagnostic.code === 'invalid-node-id');
    expect(invalid?.count).toBe(2);
    expect(invalid?.examples).toHaveLength(1);
  });
});
