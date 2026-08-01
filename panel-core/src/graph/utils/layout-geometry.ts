export const DEFAULT_LAYOUT_NODE_RADIUS = 12.5;

export type LayoutArrow = -1 | 0 | 1 | 2;
export type LayoutArrowPlacement = 'start' | 'end' | 'both' | 'none';

export interface LayoutArrowStyle {
  readonly arrow: LayoutArrow;
  readonly length?: number;
}

export interface LayoutArrowLengths {
  readonly start?: number;
  readonly end?: number;
}

export function getLayoutNodeRadius(nodeSize: number | undefined): number {
  return typeof nodeSize === 'number' ? nodeSize / 2 : DEFAULT_LAYOUT_NODE_RADIUS;
}

export function getEdgeArrowSize(edgeSize: number | undefined): number {
  return typeof edgeSize === 'number' ? Math.max(2, edgeSize * 4) : 12;
}

export function getEdgeArrowLength(edgeSize: number | undefined): number {
  return getEdgeArrowSize(edgeSize);
}

export function resolveLayoutArrowStyle(arrow: unknown, edgeSize: number | undefined): LayoutArrowStyle {
  const normalized = arrow === -1 || arrow === 1 || arrow === 2 ? arrow : 0;
  return {
    arrow: normalized,
    ...(normalized !== 0 && { length: getEdgeArrowLength(edgeSize) }),
  };
}

export function resolveLayoutArrowLengths(
  arrow: unknown,
  edgeSize: number | undefined,
  placement: LayoutArrowPlacement = 'both'
): LayoutArrowLengths {
  const style = resolveLayoutArrowStyle(arrow, edgeSize);
  return {
    start:
      (style.arrow === -1 || style.arrow === 2) && (placement === 'start' || placement === 'both')
        ? style.length
        : undefined,
    end:
      (style.arrow === 1 || style.arrow === 2) && (placement === 'end' || placement === 'both')
        ? style.length
        : undefined,
  };
}
