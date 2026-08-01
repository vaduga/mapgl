import { getEdgeFilterCategories, getEdgeFilterCategory } from './edgeFilterCategories';

describe('edge filter categories', () => {
  const baseCategories = [new Uint8Array([0, 1]), ['external']];

  it('keeps ungrouped edges filterable without dereferencing a missing group', () => {
    const feature = {
      properties: {
        style: {},
        layerName: 'graph',
        graph: { id: 'external' },
      },
    };

    expect(
      getEdgeFilterCategory({
        feature,
        baseCategories,
        filterIncludesSkip: false,
        usesRendererNamespaceFiltering: true,
      })
    ).toEqual([undefined, 'graph', 'external']);
  });

  it('uses the neutral namespace when renderer namespace filtering is disabled', () => {
    const feature = {
      properties: {
        style: {},
        layerName: 'graph',
        graph: { id: 'nested' },
      },
    };

    expect(
      getEdgeFilterCategories({
        baseCategories,
        filterIncludesSkip: false,
        usesRendererNamespaceFiltering: false,
      })
    ).toEqual({ categories: baseCategories, categorySize: 2 });
    expect(
      getEdgeFilterCategory({
        feature,
        baseCategories,
        filterIncludesSkip: false,
        usesRendererNamespaceFiltering: false,
      })
    ).toEqual([undefined, 'graph']);
  });
});
