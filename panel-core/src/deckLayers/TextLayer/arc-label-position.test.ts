import { OrthographicViewport, WebMercatorViewport, _GlobeViewport } from '@deck.gl/core';
import { Matrix4 } from '@math.gl/core';
import { arcMiddleHeight, getArcLabelPosition } from './arc-label-position';
const feature = (height = 0.5, tilt = 0) => ({
  sourcePosition: [0, 0, 20],
  targetPosition: [100, 0, 40],
  properties: { arcStyle: { arcConfig: { height } }, tilt },
});
const viewport = new OrthographicViewport({ width: 600, height: 600, target: [0, 0, 0], zoom: 0 });
it('uses height, unequal altitudes and tilt at t=0.5 with cached positions', () => {
  const input = feature(0.3, 30),
    point = getArcLabelPosition(input, viewport);
  const z = Math.sqrt(0.5 * ((20 / 30) ** 2 + 0.5)) * 30 + 20;
  expect(point[0]).toBeCloseTo(50);
  expect(point[1]).toBeCloseTo(z * 0.5);
  expect(point[2]).toBeCloseTo(z * Math.cos(Math.PI / 6));
  expect(getArcLabelPosition(input, viewport)).toBe(point);
  expect(getArcLabelPosition(input, viewport, new Matrix4().translate([10, 30, 0]))).toEqual([
    point[0] + 10,
    point[1] + 30,
    point[2],
  ]);
});
it('keeps flat and coincident arcs finite and invalidates replaced inputs', () => {
  expect(arcMiddleHeight(100, 20, 40, 0)).toBe(30);
  const input = feature(0);
  expect(getArcLabelPosition(input, viewport)).toEqual([50, 0, 30]);
  const zero = { ...input, targetPosition: [0, 0, 20] };
  expect(getArcLabelPosition(zero, viewport)).toEqual([0, 0, 20]);
  expect(getArcLabelPosition({ ...input }, viewport)).not.toBe(getArcLabelPosition(input, viewport));
});
it.each([3, 13])('handles geographic altitude and tilt in common space at zoom %i', (zoom) => {
  const view = new WebMercatorViewport({ width: 600, height: 600, longitude: 10, latitude: 60, zoom });
  const input = {
    sourcePosition: [9.9, 60, 0],
    targetPosition: [10.1, 60, 0],
    properties: { arcStyle: { arcConfig: { height: 0.5 } }, tilt: 30 },
  };
  const a = view.projectPosition(input.sourcePosition),
    b = view.projectPosition(input.targetPosition),
    point = getArcLabelPosition(input, view);
  const peak = Math.abs(b[0] - a[0]) * 0.25;
  expect(point[0]).toBeCloseTo((a[0] + b[0]) / 2, 4);
  expect(point[1] - a[1]).toBeCloseTo(peak * 0.5, 4);
  expect(point[2]).toBeCloseTo(peak * Math.cos(Math.PI / 6), 4);
});
it('handles the globe antimeridian and coincident endpoints', () => {
  const view = new _GlobeViewport({ width: 600, height: 600, longitude: 180, latitude: 0, zoom: 0 });
  const input = {
    sourcePosition: [179, 0, 0],
    targetPosition: [-179, 0, 0],
    properties: { arcStyle: { arcConfig: { height: 0 } } },
  };
  const p = view.unprojectPosition(getArcLabelPosition(input, view));
  expect(Math.abs(p[0])).toBeCloseTo(180);
  expect(p[1]).toBeCloseTo(0);
  expect(getArcLabelPosition({ ...input, targetPosition: [179, 0, 0] }, view).every(Number.isFinite)).toBe(true);
});
