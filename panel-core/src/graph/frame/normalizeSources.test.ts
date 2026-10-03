import { arrayColumn, type GraphSource } from '../../data/sources';
import { normalizeGraphSources } from './normalizeSources';
import { buildGraphFromSnapshot } from './buildGraph';

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
