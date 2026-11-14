import { getCurveFlowDirection, getCurveFlowRanges } from './curve-flow';
import { getLayoutCurveSegments, EdgesGeojsonLayer } from './edges-geojson-layer';

function fixture() {
  const features = [
    {
      edgeRef: 0,
      properties: { edgeStyle: { arrow: 2 }, layerName: 'a', style: { group: { groupIdx: 0 } } },
    },
    {
      edgeRef: 1,
      properties: { edgeStyle: { arrow: -1 }, layerName: 'b', style: { group: { groupIdx: 0 } } },
    },
  ] as any;
  const geometry = {
    edgeOffsetStrategies: [],
    edgeKeys: ['ns:a', 'ns:b'],
    edgeIndexes: new Map([
      ['ns:a', 0],
      ['ns:b', 1],
    ]),
    curveGroups: new Map([
      [
        'ns',
        {
          edgeIndexes: Int32Array.from([0, 1]),
          edgeSegmentOffsets: Int32Array.from([0, 2, 3]),
          types: new Uint8Array(3),
          segments: Float32Array.from([0, 1, 0, 1, 0, 1]),
          controlPoints: Float32Array.from([
            0, 0, 40, 0, 0, 0, 0, 0, 40, 0, 40, 60, 0, 0, 0, 0, 0, 0, 50, 0, 0, 0, 0, 0,
          ]),
        },
      ],
    ]),
  };
  const edgeIndex = {
    edgeCount: 2,
    getEdge: (ref: number) => ({ id: ref ? 'b' : 'a', source: { parent: { id: 'ns' } } }),
  } as any;
  return { features, geometry, edgeIndex };
}



it('measures a complete edge across pieces independently of another layer', () => {
  const { features, geometry, edgeIndex } = fixture();
  const data = getLayoutCurveSegments('ns', features, edgeIndex, geometry)!;
  expect(Array.from(getCurveFlowRanges(data))).toEqual([0, 40, 100, 2, 40, 100, 100, 2, 0, 50, 50, -1]);
  for (const arrow of [-1, 0, 1, 2]) {
    expect(getCurveFlowDirection({ properties: { edgeStyle: { arrow } } })).toBe(arrow);
  }
  expect(getCurveFlowDirection({ properties: { edgeStyle: {} } })).toBe(0);
});

it('stops requesting animation for hidden layers and disabled flow', () => {
  const { features, geometry, edgeIndex } = fixture();
  const create = (visible: boolean, names: string[], animateAllEdges = false) =>
    EdgesGeojsonLayer({
      batchId: 'ns',
      isLogic: true,
      linesCollection: { features },
      edgeIndex,
      layoutGeometry: geometry,
      visible,
      animateAllEdges,
      effectiveVisibility: { key: names.join(','), edge: (feature) => names.includes(feature.properties.layerName) },
      getVisLayers: { getVisibleNamespaces: () => ['external', 'ns'], getCategories: () => [[0], names] },
    }) as any;
  expect(create(true, ['a', 'b']).props.animate).toBe(false);
  expect(create(true, ['a', 'b'], true).props.animate).toBe(true);
  expect(create(false, ['a', 'b'], true).props.animate).toBe(false);
  expect(create(true, ['b'], true).props.animate).toBe(true);
  features[0].properties.edgeStyle.arrow = 0;
  features[1].properties.edgeStyle.arrow = 0;
  expect(create(true, ['a', 'b'], true).props.animate).toBe(false);
});

it('accumulates line, Bezier and elliptical pieces without restarting at piece boundaries', () => {
  const data: any = {
    length: 3,
    segmentFeatureIndexes: Int32Array.from([0, 0, 1]),
    features: [1, -1].map((arrow) => ({ properties: { edgeStyle: { arrow } } })),
    attributes: {
      getCurveType: { value: Uint8Array.from([0, 1, 2]) },
      getSegment: { value: Float32Array.from([0, 1, 0, 1, 0, Math.PI]) },
      getControlPoints: {
        value: Float32Array.from([0, 0, 40, 0, 0, 0, 0, 0, 40, 0, 60, 0, 80, 0, 100, 0, 0, 0, 10, 0, 0, 10, 0, 0]),
      },
    },
  };
  const ranges = getCurveFlowRanges(data);
  expect(Array.from(ranges.slice(0, 8))).toEqual([0, 40, 100, 1, 40, 100, 100, 1]);
  expect(ranges[9]).toBeCloseTo(Math.PI * 10, 0);
  expect(ranges[11]).toBe(-1);
});

it('omits the flow buffer for static geometry and reuses captured curve data', () => {
  const { features, geometry, edgeIndex } = fixture();
  features.forEach((feature) => (feature.properties.edgeStyle.arrow = 0));
  const data = getLayoutCurveSegments('ns', features, edgeIndex, geometry)!;
  expect(data.attributes.getFlow).toBeUndefined();
  const layer = EdgesGeojsonLayer({
    batchId: 'ns',
    isLogic: true,
    curveSegments: data,
    linesCollection: { features },
    visible: true,
    getVisLayers: { getVisibleNamespaces: () => ['external', 'ns'], getCategories: () => [[0], ['a', 'b']] },
  }) as any;
  expect(layer.props.data).toBe(data);
  expect(layer.props.animate).toBe(false);
});
