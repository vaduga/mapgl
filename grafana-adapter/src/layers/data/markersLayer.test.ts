import { createMarkersLayer } from './markersLayer';

describe('markers layer registry adapter', () => {
  it('delegates graph data processing exclusively to the graph frame pipeline', async () => {
    const registry = createMarkersLayer({
      ArcOptionsEditor: jest.fn(),
      CapacityDimensionEditor: jest.fn(),
      GroupsEditor: jest.fn(),
      StyleEditor: jest.fn(),
      getQueryFields: jest.fn(),
    });

    const handler = await registry.create(
      { isLogic: false, useMockData: false },
      { name: 'graph', type: 'markers' },
      {} as never
    );

    expect(registry.usesQueryData).toBe(true);
    expect(handler.update).toBeUndefined();
    expect('geom' in handler).toBe(false);
  });
});
