import { pointOnCurve } from './curve-geometry';
import type { CurveEdgeBinaryData } from './curve-edge-layer';

type Interval = { end: number; start: number; t0: number; t1: number; type: number; cp: number[] };
export type CurveMetric = { length: number; intervals: Interval[]; ranges: Map<number, [number, number]> };
// Prepared binary data belongs to a captured frame. Weak keys cannot retain discarded frames.
const pieces = new WeakMap<CurveEdgeBinaryData, Map<number, number[]>>();
const cache = new WeakMap<CurveEdgeBinaryData, Map<number, CurveMetric>>();

// Immutable geometry buffers survive appearance-only frame rebuilds. Changes to any
// geometry buffer select a new cache; feature-to-piece mappings remain frame-owned.
const geometryMetrics = new WeakMap<
  Float32Array,
  WeakMap<Float32Array, WeakMap<Uint8Array, Map<number, Interval[]>>>
>();
function getPieceIntervals(data: CurveEdgeBinaryData, i: number): Interval[] {
  const cpBuffer = data.attributes.getControlPoints.value;
  const ranges = data.attributes.getSegment.value;
  const types = data.attributes.getCurveType.value;
  let byRange = geometryMetrics.get(cpBuffer);
  if (!byRange) {
    byRange = new WeakMap();
    geometryMetrics.set(cpBuffer, byRange);
  }
  let byType = byRange.get(ranges);
  if (!byType) {
    byType = new WeakMap();
    byRange.set(ranges, byType);
  }
  let byPiece = byType.get(types);
  if (!byPiece) {
    byPiece = new Map();
    byType.set(types, byPiece);
  }
  const cached = byPiece.get(i);
  if (cached) {
    return cached;
  }
  const cp = Array.from(cpBuffer.subarray(i * 8, i * 8 + 8));
  const type = types[i],
    t0 = ranges[i * 2],
    dt = ranges[i * 2 + 1];
  const samples = type === 0 ? 1 : 8;
  const intervals: Interval[] = [];
  let previous = pointOnCurve(type, cp, t0),
    length = 0;
  for (let j = 1; j <= samples; j++) {
    const t1 = t0 + (dt * j) / samples;
    const next = pointOnCurve(type, cp, t1),
      start = length;
    length += Math.hypot(next[0] - previous[0], next[1] - previous[1]);
    intervals.push({ start, end: length, t0: t0 + (dt * (j - 1)) / samples, t1, type, cp });
    previous = next;
  }
  byPiece.set(i, intervals);
  return intervals;
}

export function getCurveMetrics(data: CurveEdgeBinaryData, featureIndex: number): CurveMetric {
  let byFeature = cache.get(data);
  if (!byFeature) {
    byFeature = new Map();
    cache.set(data, byFeature);
  }
  let metric = byFeature.get(featureIndex);
  if (metric) {
    return metric;
  }
  metric = { length: 0, intervals: [], ranges: new Map() };
  let indexes = pieces.get(data);
  if (!indexes) {
    indexes = new Map();
    for (let i = 0; i < data.length; i++) {
      const f = data.segmentFeatureIndexes[i];
      let list = indexes.get(f);
      if (!list) {
        list = [];
        indexes.set(f, list);
      }
      list.push(i);
    }
    pieces.set(data, indexes);
  }
  for (const i of indexes.get(featureIndex) ?? []) {
    const intervals = getPieceIntervals(data, i);
    const pieceStart = metric.length;
    metric.intervals.push(
      ...intervals.map((part) => ({ ...part, start: part.start + pieceStart, end: part.end + pieceStart }))
    );
    metric.length += intervals[intervals.length - 1].end;
    metric.ranges.set(i, [pieceStart, metric.length]);
  }
  byFeature.set(featureIndex, metric);
  return metric;
}

export function curveAnchorAt(metric: CurveMetric, distance: number) {
  distance = Math.max(0, Math.min(metric.length, distance));
  let lo = 0,
    hi = metric.intervals.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (metric.intervals[mid].end < distance) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  const part = metric.intervals[lo];
  const ratio = part.end > part.start ? (distance - part.start) / (part.end - part.start) : 0;
  const t = part.t0 + (part.t1 - part.t0) * ratio;
  const point = pointOnCurve(part.type, part.cp, t) as [number, number];
  const a = pointOnCurve(part.type, part.cp, part.t0);
  const b = pointOnCurve(part.type, part.cp, part.t1);
  return { point, direction: [b[0] - a[0], b[1] - a[1]] };
}
