import type { LayoutCurveGroup, LayoutEdgeSnapshot, LayoutResult } from './layout-worker-types';

export type CurveSegment = { type: number; controlPoints: number[]; segment: [number, number] };

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
