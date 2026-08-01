import {
  DEFAULT_LAYOUT_NODE_RADIUS,
  getEdgeArrowLength,
  getLayoutNodeRadius,
  resolveLayoutArrowLengths,
  resolveLayoutArrowStyle,
} from './layout-geometry';

describe('layout geometry', () => {
  it('resolves node radius from rendered node size', () => {
    expect(getLayoutNodeRadius(20)).toBe(10);
    expect(getLayoutNodeRadius(undefined)).toBe(DEFAULT_LAYOUT_NODE_RADIUS);
  });

  it('uses the same bounded arrow length for signatures and terminal geometry', () => {
    expect(getEdgeArrowLength(0.25)).toBe(2);
    expect(getEdgeArrowLength(4)).toBe(16);
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
