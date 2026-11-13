import { getCurveMetrics, curveAnchorAt } from './curve-metrics';

const data = () =>
  ({
    length: 3,
    features: [{}],
    segmentFeatureIndexes: new Int32Array([0, 0, 0]),
    attributes: {
      getControlPoints: {
        value: new Float32Array([0, 0, 10, 0, 0, 0, 0, 0, 10, 0, 10, 10, 20, 10, 20, 0, 30, 0, 10, 0, 0, 10, 0, 0]),
      },
      getSegment: { value: new Float32Array([1, -1, 0, 1, Math.PI, -Math.PI]) },
      getCurveType: { value: new Uint8Array([0, 1, 2]) },
    },
  }) as any;
it('maps distances across heterogeneous pieces and reversed ranges, caching metrics', () => {
  const input = data();
  const metric = getCurveMetrics(input, 0);
  expect(getCurveMetrics(input, 0)).toBe(metric);
  expect(curveAnchorAt(metric, 0).point).toEqual([10, 0]);
  expect(curveAnchorAt(metric, 5).point).toEqual([5, 0]);
  for (const ratio of [0, 0.1, 0.5, 0.9, 1]) {
    const { point } = curveAnchorAt(metric, metric.length * ratio);
    expect(point.every(Number.isFinite)).toBe(true);
  }
  expect(metric.ranges.get(1)![0]).toBe(10);
  expect(curveAnchorAt(metric, 1e9).point[0]).toBeCloseTo(40);
  expect(curveAnchorAt(metric, 1e9).point[1]).toBeCloseTo(0);
});
it('handles zero-length input and does not reuse metrics from a replaced frame', () => {
  const input = data();
  input.length = 1;
  input.attributes.getControlPoints.value.fill(0);
  const metric = getCurveMetrics(input, 0);
  expect(curveAnchorAt(metric, 0).point).toEqual([0, 0]);
  expect(curveAnchorAt(metric, 0).direction).toEqual([0, 0]);
  expect(getCurveMetrics(data(), 0)).not.toBe(metric);
});

it('reuses immutable geometry samples across appearance frames and invalidates changed buffers', () => {
  const input = data();
  const first = getCurveMetrics(input, 0);
  const next = getCurveMetrics({ ...input, features: [{ properties: { color: 'red' } }] }, 0);
  expect(next.intervals[0].cp).toBe(first.intervals[0].cp);
  const replaced = {
    ...input,
    attributes: { ...input.attributes, getSegment: { value: input.attributes.getSegment.value.slice() } },
  };
  expect(getCurveMetrics(replaced, 0).intervals[0].cp).not.toBe(first.intervals[0].cp);
});
