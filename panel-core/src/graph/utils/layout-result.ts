import type { LayoutCurveGroup, LayoutEdgeSnapshot, LayoutResult } from './layout-worker-types';

export type CurveSegment = { type: number; controlPoints: number[]; segment: [number, number] };

export function curveResolutionForLength(length: number): number {
  return Math.max(12, Math.min(64, Math.ceil(length / 20)));
}

export function pushCurveSegments(
  segments: CurveSegment[],
  type: number,
  controlPoints: number[],
  resolution: number,
  range: [number, number] = [0, 1]
): void {
  const res = Math.max(1, Math.ceil(resolution));
  const step = (range[1] - range[0]) / res;
  for (let index = 0; index < res; index++) {
    segments.push({ type, controlPoints, segment: [range[0] + step * index, step] });
  }
}

export function createCurveGroups(
  sourceEdges: readonly LayoutEdgeSnapshot[],
  segmentsByEdge: readonly CurveSegment[][]
): LayoutCurveGroup[] {
  const edgeIndexesByGraph = new Map<string, number[]>();
  sourceEdges.forEach((edge, index) => {
    if (!segmentsByEdge[index].length) {
      return;
    }
    const indexes = edgeIndexesByGraph.get(edge.sourceGraphId) ?? [];
    indexes.push(index);
    edgeIndexesByGraph.set(edge.sourceGraphId, indexes);
  });

  return Array.from(edgeIndexesByGraph, ([graphId, edgeIndexes]) => {
    const edgeSegmentOffsets = new Int32Array(edgeIndexes.length + 1);
    let segmentCount = 0;
    edgeIndexes.forEach((edgeIndex, localIndex) => {
      edgeSegmentOffsets[localIndex] = segmentCount;
      segmentCount += segmentsByEdge[edgeIndex].length;
    });
    edgeSegmentOffsets[edgeIndexes.length] = segmentCount;
    const types = new Uint8Array(segmentCount);
    const controlPoints = new Float32Array(segmentCount * 8);
    const segments = new Float32Array(segmentCount * 2);
    let segmentIndex = 0;
    for (const edgeIndex of edgeIndexes) {
      for (const segment of segmentsByEdge[edgeIndex]) {
        types[segmentIndex] = segment.type;
        controlPoints.set(segment.controlPoints, segmentIndex * 8);
        segments.set(segment.segment, segmentIndex * 2);
        segmentIndex++;
      }
    }
    return { graphId, edgeIndexes: Int32Array.from(edgeIndexes), edgeSegmentOffsets, types, controlPoints, segments };
  });
}

export function getLayoutTransferables(result: LayoutResult): Transferable[] {
  return [
    result.positions.buffer,
    result.arrows.edgeIndexes.buffer,
    result.arrows.flags.buffer,
    result.arrows.sourceTips.buffer,
    result.arrows.targetTips.buffer,
    ...(result.curveGroups ?? []).flatMap((group) => [
      group.edgeIndexes.buffer,
      group.edgeSegmentOffsets.buffer,
      group.types.buffer,
      group.controlPoints.buffer,
      group.segments.buffer,
    ]),
  ];
}

const CURVE_TYPE_BEZIER = 1;
const CURVE_TYPE_ARC = 2;

/** Translate absolute control points; elliptic arc axes are relative vectors. */
export function translateCurveControlPoints(type: number, points: number[], dx: number, dy: number): void {
  const end = type === CURVE_TYPE_ARC ? 2 : type === CURVE_TYPE_BEZIER ? 8 : 4;
  for (let i = 0; i < end; i += 2) {
    points[i] += dx;
    points[i + 1] += dy;
  }
}

export function evalCurvePoint(
  type: number,
  controlPoints: ArrayLike<number>,
  segmentIndex: number,
  t: number
): [number, number] {
  const offset = segmentIndex * 8;
  const x0 = controlPoints[offset];
  const y0 = controlPoints[offset + 1];
  const x1 = controlPoints[offset + 2];
  const y1 = controlPoints[offset + 3];
  const x2 = controlPoints[offset + 4];
  const y2 = controlPoints[offset + 5];
  const x3 = controlPoints[offset + 6];
  const y3 = controlPoints[offset + 7];

  if (type === CURVE_TYPE_BEZIER) {
    const t2 = t * t;
    const t3 = t2 * t;
    const cx = (x1 - x0) * 3;
    const cy = (y1 - y0) * 3;
    const ex = (x2 - x1) * 3 - cx;
    const ey = (y2 - y1) * 3 - cy;
    const lx = x3 - x0 - cx - ex;
    const ly = y3 - y0 - cy - ey;
    return [lx * t3 + ex * t2 + cx * t + x0, ly * t3 + ey * t2 + cy * t + y0];
  }

  if (type === CURVE_TYPE_ARC) {
    return [x0 + Math.cos(t) * x1 + Math.sin(t) * x2, y0 + Math.cos(t) * y1 + Math.sin(t) * y2];
  }

  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
}
