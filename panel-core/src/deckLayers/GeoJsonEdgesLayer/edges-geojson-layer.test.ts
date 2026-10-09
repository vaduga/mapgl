import { getLayoutCurveSegments } from './edges-geojson-layer';

it('keeps curves without a visible edge separate from the first visible feature', () => {
  const visibleFeature = { edgeRef: 0, properties: {} } as any;
  const data = getLayoutCurveSegments(
    'Core.Input',
    [visibleFeature],
    {
      edgeCount: 1,
      getEdge: () => ({ id: 'visible', source: { parent: { id: 'Core.Input' } } }),
    } as any,
    {
      edgeOffsetStrategies: [],
      edgeKeys: ['Core.Input:hidden', 'Core.Input:visible'],
      edgeIndexes: new Map([['Core.Input:visible', 1]]),
      curveGroups: new Map([
        [
          'Core.Input',
          {
            edgeIndexes: Int32Array.from([0, 1]),
            edgeSegmentOffsets: Int32Array.from([0, 1, 2]),
            types: new Uint8Array(2),
            controlPoints: new Float32Array(16),
            segments: new Float32Array(4),
          },
        ],
      ]),
    }
  );
  expect(data?.features[data.segmentFeatureIndexes[0]].skip).toBe(true);
  expect(data?.features[data.segmentFeatureIndexes[1]]).toBe(visibleFeature);
});
