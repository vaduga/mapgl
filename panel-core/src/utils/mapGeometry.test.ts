import { fitCartesianBounds, getLayerFitBounds, denormalizeZoom, normalizeZoom } from './mapGeometry';
import { getDisplacement } from './presentation';
import { HorizontalAlign, VerticalAlign } from '../style/types';
import { Graph } from '../graph/main';

it('fits cartesian extents with padding, degenerate and uninitialized viewport fallbacks', () => {
  expect(fitCartesianBounds([0, 0, 100, 50], 400, 200, { maxZoom: 10 })).toEqual({
    longitude: 50,
    latitude: 25,
    zoom: 2,
  });
  expect(fitCartesianBounds([0, 0, 100, 50], 400, 200, { maxZoom: 10, padding: 100 }).zoom).toBe(1);
  expect(fitCartesianBounds([5, 6, 5, 6], 0, NaN, { maxZoom: 3 }).zoom).toBe(3);
  expect(fitCartesianBounds([0, 0, 1, 1], 0, NaN, { maxZoom: 10 }).zoom).toBe(0);
});
it('uses resolved feature coordinates, indexed points and layer selection without native handlers', () => {
  const layers = [
    {
      isBasemap: false,
      options: { name: 'a' },
      layer: {
        features: [
          {
            geometry: {
              coordinates: [
                [
                  [2, 3],
                  [4, 9],
                  [Infinity, 5],
                ],
              ],
            },
          },
          { id: 0 },
        ],
      },
    },
  ];
  const scene = { graph: new Graph('root'), positions: new Float64Array([10, 20]) };
  expect(getLayerFitBounds(scene, layers, { allLayers: true })).toEqual([2, 3, 10, 20]);
  expect(getLayerFitBounds(scene, layers, { lastOnly: true, layer: 'a' })).toEqual([10, 20, 10, 20]);
  expect(getLayerFitBounds(scene, layers, { layer: 'missing' })).toBeUndefined();
});
it('preserves resolved symbol alignment and round-trips logical zoom conversion', () => {
  expect(getDisplacement({ horizontal: HorizontalAlign.Left, vertical: VerticalAlign.Top }, 5)).toEqual([-5, 5]);
  expect(getDisplacement({ horizontal: HorizontalAlign.Right, vertical: VerticalAlign.Bottom }, 5)).toEqual([5, -5]);
  expect(normalizeZoom(false, denormalizeZoom(false, 9))).toBeCloseTo(9);
});
