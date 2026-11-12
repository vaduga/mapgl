import type { CurveEdgeBinaryData } from './curve-edge-layer';
import { pointOnCurve } from './curve-geometry';

export function getCurveFlowDirection(feature: any): number {
  const style = feature?.properties?.edgeStyle;
  const arrow = style?.arrow;
  return style?.animate && (arrow === -1 || arrow === 1 || arrow === 2) ? arrow : 0;
}

/** Cumulative distance for each tessellated piece, measured over its entire edge. */
export function getCurveFlowRanges(data: CurveEdgeBinaryData): Float32Array {
  const ranges = new Float32Array(data.length * 4);
  const totals = new Map<number, number>();
  for (let i = 0; i < data.length; i++) {
    const featureIndex = data.segmentFeatureIndexes[i];
    if (!getCurveFlowDirection(data.features[featureIndex])) {
      continue;
    }
    const cp = data.attributes.getControlPoints.value.subarray(i * 8, i * 8 + 8);
    const [t, dt] = data.attributes.getSegment.value.subarray(i * 2, i * 2 + 2);
    const type = data.attributes.getCurveType.value[i];
    let previous = pointOnCurve(type, cp, t);
    let length = 0;
    // Subsamples also handle the larger ELK Bezier pieces without visible speed jumps.
    const samples = type === 0 ? 1 : 8;
    for (let sample = 1; sample <= samples; sample++) {
      const next = pointOnCurve(type, cp, t + (dt * sample) / samples);
      length += Math.hypot(next[0] - previous[0], next[1] - previous[1]);
      previous = next;
    }
    const start = totals.get(featureIndex) ?? 0;
    ranges[i * 4] = start;
    ranges[i * 4 + 1] = start + length;
    totals.set(featureIndex, start + length);
  }
  for (let i = 0; i < data.length; i++) {
    const featureIndex = data.segmentFeatureIndexes[i];
    ranges[i * 4 + 2] = totals.get(featureIndex) ?? 0;
    ranges[i * 4 + 3] = getCurveFlowDirection(data.features[featureIndex]);
  }
  return ranges;
}
