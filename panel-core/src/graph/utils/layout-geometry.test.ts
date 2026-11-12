import {
  DEFAULT_LAYOUT_NODE_RADIUS,
  getEdgeArrowLength,
  getLayoutCardBox,
  getLayoutNodeBox,
  getLayoutNodeRadius,
  resolveLayoutArrowLengths,
  resolveLayoutArrowStyle,
} from './layout-geometry';

describe('layout geometry', () => {
  it('resolves node radius from rendered node size', () => {
    expect(getLayoutNodeRadius(20)).toBe(10);
    expect(getLayoutNodeRadius(undefined)).toBe(DEFAULT_LAYOUT_NODE_RADIUS);
  });

  it('sizes the layout box to hold the label under the node', () => {
    expect(getLayoutNodeBox({ size: 20 })).toBeUndefined();
    expect(getLayoutNodeBox({ size: 20, text: 'a' })).toEqual({ width: 20, height: 20 + 2 * (2 + 12 * 1.2) });
    expect(getLayoutNodeBox({ size: 20, text: 'x'.repeat(10), textConfig: { fontSize: 10 } })?.width).toBe(60);
  });

  it('uses the same bounded arrow length for signatures and terminal geometry', () => {
    expect(getEdgeArrowLength(0.25)).toBe(2);
    expect(getEdgeArrowLength(4)).toBe(16);
    expect(getEdgeArrowLength(10)).toBe(16);
    expect(resolveLayoutArrowStyle(1, 4)).toEqual({ arrow: 1, length: 16 });
  });

  it('resolves directional arrows against segment placement', () => {
    expect(resolveLayoutArrowLengths(-1, 3, 'both')).toEqual({ start: 12, end: undefined });
    expect(resolveLayoutArrowLengths(1, 3, 'both')).toEqual({ start: undefined, end: 12 });
    expect(resolveLayoutArrowLengths(2, 3, 'start')).toEqual({ start: 12, end: undefined });
    expect(resolveLayoutArrowLengths(2, 3, 'none')).toEqual({ start: undefined, end: undefined });
    expect(resolveLayoutArrowLengths(0, 3, 'both')).toEqual({ start: undefined, end: undefined });
  });
});

describe('getLayoutCardBox', () => {
  it('fits the longest line and every line, plus padding', () => {
    expect(getLayoutCardBox({ text: 'abcd\nab', textConfig: { fontSize: 10 } })).toEqual({
      width: 4 * 10 * 0.6 + 20,
      height: 2 * 10 * 1.2 + 10,
    });
    expect(getLayoutCardBox({ text: ' ' })).toBeUndefined();
    expect(getLayoutCardBox({ text: '↑ a', textConfig: { fontSize: 10 } })!.width).toBeCloseTo((1.7 + 2) * 6 + 20);
  });
});
