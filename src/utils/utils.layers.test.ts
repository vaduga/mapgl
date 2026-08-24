jest.mock('@deck.gl/layers', () => ({
  GeoJsonLayer: class {},
  PathLayer: class {},
  TextLayer: class {},
}));

jest.mock('@mapgl/panel-core/deckLayers/utils', () => ({
  isVisible: () => true,
  toRGB4Array: () => [0, 0, 0, 255],
}));

jest.mock('@mapgl/panel-core', () => ({
  getMapglFeatureServices: () => ({ derivedVisLayerContributors: [], namespaceBoundaryProviders: [] }),
  getNamespaceBoundaries: () => [],
}));

jest.mock('@mapgl/panel-core/utils', () => ({
  genVisLayers: jest.fn(),
  createDerivedLayers: jest.fn(),
}));

jest.mock('@mapgl/panel-core/deckLayers', () => ({
  LineTextLayer: jest.fn((props) => ({ id: `line-text-${props.id ?? ''}` })),
  MyArcLayer: jest.fn((props) => ({ id: `arc-${props.srcGraphId ?? ''}` })),
  MyIconLayer: jest.fn(() => ({ id: 'comments' })),
  EdgesGeojsonLayer: jest.fn(() => ({ id: 'edges' })),
  EdgeArrowLayer: jest.fn(() => ({ id: 'edge-arrows' })),
  NodesGeojsonLayer: jest.fn((props) => ({ id: `nodes-${props.biCol.graph.id}` })),
  PlaceholderTextLayer: jest.fn((props) => ({ id: `center-${props.biCol.graph.id}` })),
  MainLabelTextLayer: jest.fn((props) => ({ id: `labels-${props.biCol.graph.id}` })),
}));

import { genPrimaryLayers } from './utils.layers';

const graph = {
  id: 'graph',
  subgraphsBreadthFirst: () => [],
};

const getVisLayers = {
  getVisState: () => [true, false],
  getCategories: () => [[], []],
};

function createLayers(isLogic: boolean) {
  return genPrimaryLayers({
    biCols: [{ graph }],
    lineFeatures: undefined,
    commentFeatures: undefined,
    layerProps: {
      isLogic,
      isRouted: false,
      theme: {},
      baseLayer: undefined,
      options: { common: { isMeters: false } },
      getVisLayers,
      panel: {
        graph,
        visLayers: getVisLayers,
        layoutReady: false,
      },
    },
  });
}

describe('primary node layer composition', () => {
  it('adds the gauge center-value layer in Geo mode without duplicating the main label layer', () => {
    expect(createLayers(false).nodes?.map((layer) => layer.id)).toEqual(['nodes-graph', 'center-graph']);
  });

  it('preserves the Node graph center-value and separate main-label layers', () => {
    expect(createLayers(true).nodes?.map((layer) => layer.id)).toEqual(['nodes-graph', 'center-graph', 'labels-graph']);
  });
});
