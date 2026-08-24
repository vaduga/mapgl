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
    createGaugeDonutInput: (gauge: unknown) => ({ gauge }),
    createDonutAtlas: (variants: Iterable<readonly [string, unknown]>) => ({
      recordByKey: new Map([...variants].map(([key], index) => [key, index])),
    }),
    getDonutInputKey: (input: unknown) => JSON.stringify(input),
    getDonutRecord: (atlas: { recordByKey: Map<string, number> }, key: string) => atlas.recordByKey.get(key) ?? -1,
  };
});

import { CollisionFilterExtension, DataFilterExtension } from '@deck.gl/extensions';
import { createTheme } from '@grafana/data';

import { NodesGeojsonLayer, PlaceholderTextLayer } from './nodes-geojson-layer';

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

function createPlaceholderLayer(
  properties: Record<number, any>,
  svgVisible: boolean,
  labelsVisible = true,
  isLogic = true
) {
  const state = new Map([
    ['circle', [true, false]],
    ['icon', [svgVisible, false]],
    ['label', [labelsVisible, false]],
  ]);
  const ids = Object.keys(properties).map(Number);
  return PlaceholderTextLayer({
    biCol: {
      graph: { id: 'graph' },
      points: {
        featureIds: { value: new Uint16Array(ids) },
        positions: { value: new Float64Array(ids.flatMap((id) => [id, id])) },
        properties,
      },
    },
    getVisLayers: {
      getCategories: () => [[], []],
      getVisState: (_index: number | null, name: string) => state.get(name),
    },
    getSelectedNode: { id: 'gauge-no-icon' },
    options: { common: { isMeters: false } },
    theme: createTheme(),
    isLogic,
    pickable: true,
    visible: true,
  } as any);
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

  it('flips the gauge Y axis for the graph OrbitView projection', () => {
    const layer = createLayer({ isLogic: true });
    expect(layer.props._subLayerProps['points-circle'].gaugeCoordinateYSign).toBe(-1);
  });

  it('resolves the shader donut record for geo-mode nodes', () => {
    const layer = createLayer({ isLogic: false });
    const circle = layer.props._subLayerProps['points-circle'];

    expect(circle.getDonutRecord(feature, { index: 0 })).toBe(0);
    expect(circle.gaugeCoordinateYSign).toBe(1);
  });

  it('shares gauge color stops while keeping per-data-layer fill, arc options, and Gradient independent', () => {
    const gauge = {
      colorMode: 'thresholds',
      stops: [
        { color: [0, 255, 0, 255], endFraction: 0 },
        { color: [255, 0, 0, 255], endFraction: 1 },
      ],
    };
    const properties = {
      0: {
        ...feature.properties,
        style: {
          ...feature.properties.style,
          arcs: ['#00ff00'],
          arcOptions: { barWidthFactor: 0.7, segments: 24, segmentSpacing: 0.2, showThresholds: false },
          gauge: { ...gauge, fillFraction: 0.25 },
        },
      },
      1: {
        ...feature.properties,
        locName: 'router-b',
        layerName: 'nodes-secondary',
        style: {
          ...feature.properties.style,
          arcs: ['#ff0000'],
          arcOptions: {
            barWidthFactor: 0.35,
            segments: 12,
            segmentSpacing: 0.6,
            showThresholds: true,
            gradient: false,
          },
          gauge: { ...gauge, fillFraction: 0.75 },
        },
      },
    };
    const layer = createLayer({
      biCol: {
        graph: { id: 'graph' },
        points: {
          featureIds: { value: new Uint16Array([0, 1]) },
          positions: { value: new Float64Array([0, 0, 1, 1]) },
          properties,
        },
      },
    });
    const circle = layer.props._subLayerProps['points-circle'];

    expect(circle.getDonutRecord(undefined, { index: 0 })).toBe(0);
    expect(circle.getDonutRecord(undefined, { index: 1 })).toBe(0);
    expect(circle.getDonutGaugeValue(undefined, { index: 0 })).toBe(0.25);
    expect(circle.getDonutGaugeValue(undefined, { index: 1 })).toBe(0.75);
    expect(circle.getDonutGaugeOptions(undefined, { index: 0 })).toEqual([0.7, 24, 0.2, 0]);
    expect(circle.getDonutGaugeOptions(undefined, { index: 1 })).toEqual([0.35, 12, 0.6, 3]);
    expect(circle.updateTriggers.getDonutGaugeValue).toEqual([undefined]);
    expect(circle.updateTriggers.getDonutGaugeOptions).toEqual([undefined]);
  });

  it('keeps continuous color schemes on the native gradient sampler', () => {
    const properties = {
      0: {
        ...feature.properties,
        style: {
          ...feature.properties.style,
          arcs: ['#00ff00'],
          arcOptions: { gradient: false },
          gauge: {
            colorMode: 'continuous-GrYlRd',
            fillFraction: 0.5,
            stops: [
              { color: [0, 255, 0, 255], endFraction: 0 },
              { color: [255, 0, 0, 255], endFraction: 1 },
            ],
          },
        },
      },
    };
    const layer = createLayer({
      biCol: {
        graph: { id: 'graph' },
        points: {
          featureIds: { value: new Uint16Array([0]) },
          positions: { value: new Float64Array([0, 0]) },
          properties,
        },
      },
    });

    expect(layer.props._subLayerProps['points-circle'].getDonutGaugeOptions(undefined, { index: 0 })).toEqual([
      0.5, 48, 0.3, 1,
    ]);
  });

  it('arbitrates gauge values and configured icons independently for every node', () => {
    const properties = {
      0: {
        locName: 'gauge-no-icon',
        layerName: 'nodes',
        style: { size: 40, group: { groupIdx: 0 }, gauge: { displayText: '25%' } },
      },
      1: {
        locName: 'gauge-icon',
        layerName: 'nodes',
        style: { size: 40, group: { groupIdx: 1, iconName: 'router' }, gauge: { displayText: '50%' } },
      },
      2: {
        locName: 'legacy-no-icon',
        layerName: 'nodes',
        style: { size: 40, group: { groupIdx: 2 } },
      },
      3: {
        locName: 'legacy-icon',
        layerName: 'nodes',
        style: { size: 40, group: { groupIdx: 3, iconName: 'server' } },
      },
    };

    const withIcons = createPlaceholderLayer(properties, true);
    expect(withIcons.props.data.map((datum: any) => datum.properties.locName)).toEqual([
      'gauge-no-icon',
      'legacy-no-icon',
    ]);
    expect(withIcons.props.data.map((datum: any) => withIcons.props.getText(datum))).toEqual(['25%', '-\n-']);

    const withoutIcons = createPlaceholderLayer(properties, false);
    expect(withoutIcons.props.data.map((datum: any) => datum.properties.locName)).toEqual([
      'gauge-no-icon',
      'gauge-icon',
      'legacy-no-icon',
    ]);
    expect(withoutIcons.props.data.map((datum: any) => withoutIcons.props.getText(datum))).toEqual([
      '25%',
      '50%',
      '-\n-',
    ]);
  });

  it('fits and clips gauge text to selection-aware inner geometry', () => {
    const properties = {
      0: {
        locName: 'gauge-no-icon',
        layerName: 'nodes',
        style: {
          size: 40,
          group: { groupIdx: 0 },
          gauge: { displayText: '123.45 GiB' },
          arcOptions: { barWidthFactor: 1 },
        },
      },
    };
    const layer = createPlaceholderLayer(properties, true);
    const datum = layer.props.data[0];
    const [, , width, height] = layer.props.getContentBox(datum);

    expect(width).toBe(height);
    expect(width).toBeLessThan(40 * 1.3);
    expect(layer.props.getSize(datum)).toBeGreaterThan(0);
    expect(layer.props.getSize(datum)).toBeLessThan(width);
    expect(layer.props.contentCutoffPixels).toEqual([1, 1]);
    expect(layer.props.contentAlignHorizontal).toBe('center');
    expect(layer.props.contentAlignVertical).toBe('center');
    expect(layer.props.updateTriggers.getSize).toEqual(['gauge-no-icon', expect.any(Object), undefined]);
  });

  it('keeps the center text layer subject to Labels visibility', () => {
    const properties = {
      0: {
        locName: 'gauge-no-icon',
        layerName: 'nodes',
        style: { size: 40, group: { groupIdx: 0 }, gauge: { displayText: '25%' } },
      },
    };

    expect(createPlaceholderLayer(properties, true, false).props.visible).toBe(false);
  });

  it('supports the gauge center text layer in Geo mode', () => {
    const properties = {
      0: {
        locName: 'geo-gauge',
        layerName: 'nodes',
        style: { size: 40, group: { groupIdx: 0 }, gauge: { displayText: '75%' } },
      },
    };
    const layer = createPlaceholderLayer(properties, true, true, false);

    expect(layer.props.data).toHaveLength(1);
    expect(layer.props.getText(layer.props.data[0])).toBe('75%');
    expect(layer.props.sizeUnits).toBe('pixels');
  });
});
