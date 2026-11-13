import type { CurveEdgeBinaryData } from './curve-edge-layer';
import { getCurveMetrics } from './curve-metrics';

export function getCurveFlowDirection(feature: any): number {
  const style = feature?.properties?.edgeStyle;
  const arrow = style?.arrow;
  return style?.animate && (arrow === -1 || arrow === 1 || arrow === 2) ? arrow : 0;
}

/** Cumulative distance for each tessellated piece, measured over its entire edge. */
export function getCurveFlowRanges(data: CurveEdgeBinaryData): Float32Array {
  const ranges = new Float32Array(data.length * 4);
  for (let i = 0; i < data.length; i++) {
    const featureIndex = data.segmentFeatureIndexes[i];
    const direction = getCurveFlowDirection(data.features[featureIndex]);
    if (!direction) {
      continue;
    }
    const metric = getCurveMetrics(data, featureIndex);
    const [start, end] = metric.ranges.get(i)!;
    ranges.set([start, end, metric.length, direction], i * 4);
  }
  return ranges;
}
