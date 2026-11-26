import { evalCurvePoint } from './layout-result';
import { roundedPolyline } from './rounded-polyline';

it('rounds a bend without changing route terminals or adding gaps', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 24, y: 0 },
    { x: 24, y: 24 },
  ];
  const segments = roundedPolyline(points, 8);
  const endpoints = segments.map(({ type, controlPoints, segment: [start, step] }) => [
    evalCurvePoint(type, controlPoints, 0, start),
    evalCurvePoint(type, controlPoints, 0, start + step),
  ]);
  expect(endpoints[0][0]).toEqual([0, 0]);
  expect(endpoints.at(-1)?.[1]).toEqual([24, 24]);
  expect(segments.some(({ type }) => type === 1)).toBe(true);
  endpoints.slice(1).forEach(([start], index) => {
    expect(start[0]).toBeCloseTo(endpoints[index][1][0], 8);
    expect(start[1]).toBeCloseTo(endpoints[index][1][1], 8);
  });
});

it('keeps straight paths and skips zero-length segments', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 12, y: 0 },
  ];
  expect(roundedPolyline(points, 8)).toEqual([{ type: 0, controlPoints: [0, 0, 12, 0, 0, 0, 0, 0], segment: [0, 1] }]);
});
