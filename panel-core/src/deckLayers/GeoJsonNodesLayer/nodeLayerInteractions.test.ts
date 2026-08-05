jest.mock('@deck.gl/layers', () => {
  class MockLayer {
    props: any;

    constructor(props: any) {
      this.props = props;
    }
  }

  return { GeoJsonLayer: MockLayer, TextLayer: MockLayer };
});

jest.mock('@deck.gl/extensions', () => {
  class MockCollisionFilterExtension {}
  class MockDataFilterExtension {}

  return {
    CollisionFilterExtension: MockCollisionFilterExtension,
    DataFilterExtension: MockDataFilterExtension,
  };
});

jest.mock('../DonutCircleLayer', () => {
  class MockDonutCircleLayer {}

  return {
    DonutCircleLayer: MockDonutCircleLayer,
    createEqualDonutInput: (colors: unknown[]) => ({ colors }),
    createDonutAtlas: (variants: Iterable<readonly [string, unknown]>) => ({
      recordByKey: new Map([...variants].map(([key], index) => [key, index])),
    }),
    getDonutInputKey: (input: unknown) => JSON.stringify(input),
    getDonutRecord: (atlas: { recordByKey: Map<string, number> }, key: string) => atlas.recordByKey.get(key) ?? -1,
  };
});

import { CollisionFilterExtension, DataFilterExtension } from '@deck.gl/extensions';

import { NodesGeojsonLayer } from './nodes-geojson-layer';

const feature = {
  properties: {
    locName: 'router-a',
    layerName: 'nodes',
    thrColor: '#00ff00',
    style: {
      size: 20,
      arcs: ['#ff0000', '#0000ff'],
      text: 'router-a',
      group: { iconName: 'router', groupIdx: 3 },
    },
  },
};

function createLayer(overrides: Record<string, any> = {}) {
  const state = new Map([
    ['circle', [true, false]],
    ['svg', [true, false]],
    ['label', [true, false]],
  ]);
  const props = {
    biCol: {
      graph: { id: 'graph' },
      points: {
        featureIds: { value: new Uint16Array([0]) },
        positions: { value: new Float64Array([0, 0]) },
        properties: { 0: feature.properties },
      },
    },
    getVisLayers: {
      getCategories: () => [[], []],
      getVisState: (_index: number | null, name: string) => state.get(name),
    },
    options: { common: { isMeters: false } },
    svgIconState: {
      revision: 4,
      signature: 'test',
      icons: {
        router: {
          svgText: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20"><path /></svg>',
          svgDataUrl: 'data:image/svg+xml,router',
          width: 10,
          height: 20,
        },
      },
    },
    svgIconCache: new Map(),
    getSelectedNode: { id: 'router-a' },
    isLogic: true,
    pickable: true,
    visible: true,
    pointTypeOverride: 'circle+icon+text',
    onSvgIconReady: jest.fn(),
    getNodeLayerVisibility: undefined,
    ...overrides,
  };

  return NodesGeojsonLayer(props as any);
}

describe('node shader and SVG interaction contract', () => {
  it('keeps picking, filtering, collision, hover, and selected updates on both channels', () => {
    const onHover = jest.fn();
    const layer = createLayer({ onHover });
    const circle = layer.props._subLayerProps['points-circle'];
    const icon = layer.props._subLayerProps['points-icon'];

    expect(layer.props.pickable).toBe(true);
    expect(layer.props.onHover).toBe(onHover);
    expect(layer.props.getFilterCategory(feature)).toEqual([3, 'nodes']);
    expect(circle.pickable).toBe(true);
    expect(circle.extensions).toEqual(
      expect.arrayContaining([expect.any(CollisionFilterExtension), expect.any(DataFilterExtension)])
    );
    expect(icon.extensions).toEqual(
      expect.arrayContaining([expect.any(CollisionFilterExtension), expect.any(DataFilterExtension)])
    );
    expect(circle.updateTriggers.getRadius).toEqual(['router-a']);
    expect(icon.updateTriggers.getSize).toEqual(['router-a']);
  });

  it('keeps the fitted user SVG independent from the shader donut record', () => {
    const layer = createLayer();
    const icon = layer.props._subLayerProps['points-icon'];
    const circle = layer.props._subLayerProps['points-circle'];

    const iconValue = layer.props.getIcon(feature);
    expect(iconValue.id).toContain('svg:router:4');
    expect(iconValue.id).not.toContain('#ff0000');
    expect(circle.getDonutRecord(feature, { index: 0 })).toBe(0);
  });

  it('resolves the shader donut record for geo-mode nodes', () => {
    const layer = createLayer({ isLogic: false });
    const circle = layer.props._subLayerProps['points-circle'];

    expect(circle.getDonutRecord(feature, { index: 0 })).toBe(0);
  });
});
