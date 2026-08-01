import { packGraphNodeBinaryRanges, selectGraphNodeFillColors, type GraphNodeBinaryArrays } from './binaryRanges';

function source(): GraphNodeBinaryArrays {
  return {
    positions: new Float64Array([0, 1, 2, 3, 4, 5, 6, 7]),
    colors: new Uint8Array([10, 11, 12, 255, 20, 21, 22, 255, 30, 31, 32, 255, 40, 41, 42, 255]),
    muted: new Uint8Array([10, 11, 12, 64, 20, 21, 22, 64, 30, 31, 32, 64, 40, 41, 42, 64]),
    annotations: new Uint8Array([255, 0, 0, 255, 255, 255, 0, 255, 0, 255, 0, 255, 20, 21, 22, 64]),
    groupIndices: new Uint8Array([1, 2, 3, 4]),
  };
}

describe('graph node binary range packing', () => {
  it('returns correctly offset zero-copy views for one contiguous range', () => {
    const input = source();
    const packed = packGraphNodeBinaryRanges(input, [[1, 3]]);

    expect(packed.count).toBe(2);
    expect(packed.positions).toEqual(new Float64Array([2, 3, 4, 5]));
    expect(packed.colors).toEqual(new Uint8Array([20, 21, 22, 255, 30, 31, 32, 255]));
    expect(packed.muted).toEqual(new Uint8Array([20, 21, 22, 64, 30, 31, 32, 64]));
    expect(packed.annotations).toEqual(new Uint8Array([255, 255, 0, 255, 0, 255, 0, 255]));
    expect(packed.groupIndices).toEqual(new Uint8Array([2, 3]));
    expect(packed.positions.buffer).toBe(input.positions.buffer);
    expect(packed.positions.byteOffset).toBe(input.positions.byteOffset + 2 * Float64Array.BYTES_PER_ELEMENT);
    expect(packed.colors.buffer).toBe(input.colors.buffer);
    expect(packed.colors.byteOffset).toBe(input.colors.byteOffset + 4);
    expect(packed.muted.buffer).toBe(input.muted.buffer);
    expect(packed.annotations.buffer).toBe(input.annotations.buffer);
    expect(packed.groupIndices.buffer).toBe(input.groupIndices.buffer);
    expect(packed.groupIndices.byteOffset).toBe(input.groupIndices.byteOffset + 1);
  });

  it('coalesces adjacent ranges without changing their order', () => {
    const input = source();
    const packed = packGraphNodeBinaryRanges(input, [
      [0, 1],
      [1, 3],
    ]);

    expect(packed.count).toBe(3);
    expect(packed.positions).toEqual(new Float64Array([0, 1, 2, 3, 4, 5]));
    expect(packed.colors.buffer).toBe(input.colors.buffer);
  });

  it('packs fragmented ranges into isolated buffers while preserving every channel', () => {
    const input = source();
    const ranges = [
      [0, 1],
      [2, 4],
    ] as const;
    const packed = packGraphNodeBinaryRanges(input, ranges);

    expect(packed.count).toBe(3);
    expect(packed.positions).toEqual(new Float64Array([0, 1, 4, 5, 6, 7]));
    expect(packed.colors).toEqual(new Uint8Array([10, 11, 12, 255, 30, 31, 32, 255, 40, 41, 42, 255]));
    expect(packed.muted).toEqual(new Uint8Array([10, 11, 12, 64, 30, 31, 32, 64, 40, 41, 42, 64]));
    expect(packed.annotations).toEqual(new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 20, 21, 22, 64]));
    expect(packed.groupIndices).toEqual(new Uint8Array([1, 3, 4]));
    expect(packed.positions.buffer).not.toBe(input.positions.buffer);
    expect(packed.colors.buffer).not.toBe(input.colors.buffer);
    expect(packed.muted.buffer).not.toBe(input.muted.buffer);
    expect(packed.annotations.buffer).not.toBe(input.annotations.buffer);
    expect(packed.groupIndices.buffer).not.toBe(input.groupIndices.buffer);
  });

  it('does not change a fragmented packed selection when live buffers mutate', () => {
    const input = source();
    const packed = packGraphNodeBinaryRanges(input, [
      [0, 1],
      [2, 4],
    ]);

    input.muted.fill(1);
    input.annotations.fill(2);

    expect(packed.muted).toEqual(new Uint8Array([10, 11, 12, 64, 30, 31, 32, 64, 40, 41, 42, 64]));
    expect(packed.annotations).toEqual(new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 20, 21, 22, 64]));
  });

  it('returns fresh contiguous views that expose subsequent live buffer updates', () => {
    const input = source();
    const first = packGraphNodeBinaryRanges(input, [[1, 3]]);

    input.muted[4] = 99;
    input.annotations[4] = 88;
    const second = packGraphNodeBinaryRanges(input, [[1, 3]]);

    expect(first.muted).not.toBe(second.muted);
    expect(first.annotations).not.toBe(second.annotations);
    expect(first.muted[0]).toBe(99);
    expect(first.annotations[0]).toBe(88);
    expect(second.muted[0]).toBe(99);
    expect(second.annotations[0]).toBe(88);
  });

  it('switches between opacity and annotation colors without losing either channel', () => {
    const packed = packGraphNodeBinaryRanges(source(), [[0, 4]]);

    expect(selectGraphNodeFillColors(packed, false)).toBe(packed.muted);
    expect(selectGraphNodeFillColors(packed, true)).toBe(packed.annotations);
  });
});
