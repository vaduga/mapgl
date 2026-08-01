export type BinaryRange = readonly [start: number, endExclusive: number];

export interface GraphNodeBinaryArrays {
  readonly positions: Float64Array;
  readonly colors: Uint8Array;
  readonly muted: Uint8Array;
  readonly annotations: Uint8Array;
  readonly groupIndices: Uint8Array;
}

export interface PackedGraphNodeBinaryArrays extends GraphNodeBinaryArrays {
  readonly count: number;
}

export function selectGraphNodeFillColors(
  arrays: Pick<GraphNodeBinaryArrays, 'muted' | 'annotations'>,
  annotationsVisible: boolean
): Uint8Array {
  return annotationsVisible ? arrays.annotations : arrays.muted;
}

function getBinaryRangeItemCount(ranges: readonly BinaryRange[]): number {
  return ranges.reduce((count, [start, endExclusive]) => count + Math.max(0, endExclusive - start), 0);
}

function getContiguousBinaryRange(ranges: readonly BinaryRange[]): BinaryRange | undefined {
  let contiguousStart: number | undefined;
  let contiguousEnd: number | undefined;

  for (const [start, endExclusive] of ranges) {
    if (endExclusive <= start) {
      continue;
    }
    if (contiguousStart === undefined) {
      contiguousStart = start;
      contiguousEnd = endExclusive;
      continue;
    }
    if (start !== contiguousEnd) {
      return undefined;
    }
    contiguousEnd = endExclusive;
  }

  return [contiguousStart ?? 0, contiguousEnd ?? 0];
}

/**
 * Selects graph-node binary channels in range order.
 *
 * Contiguous selections are fresh zero-copy views over the source arrays.
 * Fragmented selections own packed copies. Callers must treat both forms as
 * read-only and must not rely on the returned arrays having independent buffers.
 */
export function packGraphNodeBinaryRanges(
  source: GraphNodeBinaryArrays,
  ranges: readonly BinaryRange[]
): PackedGraphNodeBinaryArrays {
  const contiguousRange = getContiguousBinaryRange(ranges);
  if (contiguousRange) {
    const [start, endExclusive] = contiguousRange;
    return {
      count: endExclusive - start,
      positions: source.positions.subarray(start * 2, endExclusive * 2),
      colors: source.colors.subarray(start * 4, endExclusive * 4),
      muted: source.muted.subarray(start * 4, endExclusive * 4),
      annotations: source.annotations.subarray(start * 4, endExclusive * 4),
      groupIndices: source.groupIndices.subarray(start, endExclusive),
    };
  }

  const count = getBinaryRangeItemCount(ranges);
  const positions = new Float64Array(count * 2);
  const colors = new Uint8Array(count * 4);
  const muted = new Uint8Array(count * 4);
  const annotations = new Uint8Array(count * 4);
  const groupIndices = new Uint8Array(count);
  let offset = 0;

  for (const [start, endExclusive] of ranges) {
    positions.set(source.positions.subarray(start * 2, endExclusive * 2), offset * 2);
    colors.set(source.colors.subarray(start * 4, endExclusive * 4), offset * 4);
    muted.set(source.muted.subarray(start * 4, endExclusive * 4), offset * 4);
    annotations.set(source.annotations.subarray(start * 4, endExclusive * 4), offset * 4);
    groupIndices.set(source.groupIndices.subarray(start, endExclusive), offset);
    offset += Math.max(0, endExclusive - start);
  }

  return {
    count,
    positions,
    colors,
    muted,
    annotations,
    groupIndices,
  };
}
