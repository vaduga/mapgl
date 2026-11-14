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

// The node label sits under the node and shares its layout units, so the layout box must hold it
// too, or nodes packed side by side (e.g. lone nodes inside a namespace box) overlap their labels.
const LABEL_CHAR_WIDTH = 0.6; // average glyph width per font size unit
const LABEL_LINE_HEIGHT = 1.2;
const LABEL_GAP = 2;
const DEFAULT_LABEL_FONT_SIZE = 12;

export interface LayoutNodeBox {
  readonly width: number;
  readonly height: number;
}

/** Layout box of a node with its label, or undefined when the node has no label (circle of getLayoutNodeRadius). */
export function getLayoutNodeBox(
  style: { size?: number; text?: string; textConfig?: { fontSize?: number } } | undefined
): LayoutNodeBox | undefined {
  const lines = style?.text?.trim().split('\n');
  if (!lines?.[0]) {
    return undefined;
  }
  const diameter = getLayoutNodeRadius(style?.size) * 2;
  const fontSize = style?.textConfig?.fontSize ?? DEFAULT_LABEL_FONT_SIZE;
  const label = LABEL_GAP + lines.length * fontSize * LABEL_LINE_HEIGHT;
  const longest = Math.max(...lines.map((line) => line.length));
  // Symmetric around the node centre: MSAGL boxes are centred on the node.
  return { width: Math.max(diameter, longest * fontSize * LABEL_CHAR_WIDTH), height: diameter + 2 * label };
}

// Node card: the label on a filled box centred on the node, in place of the circle.
export const CARD_PADDING_X = 10;
export const CARD_PADDING_Y = 5;
// Glyphs outside ASCII (arrows) come from a fallback font, wider than the monospace advance.
const WIDE_GLYPH = 1.7;

/** Text width in font-size units: monospace advance per character, wide for non-ASCII glyphs. */
export function measureText(text: string): number {
  let chars = 0;
  for (const ch of text) {
    chars += ch.charCodeAt(0) > 0x7f ? WIDE_GLYPH : 1;
  }
  return chars * LABEL_CHAR_WIDTH;
}

const cardBoxes = new WeakMap<object, { text: string | undefined; fontSize: number; box: LayoutNodeBox | undefined }>();

/** Layout box of a node drawn as a card (its label in a box), or undefined when the node has no label. */
export function getLayoutCardBox(
  style: { text?: string; textConfig?: { fontSize?: number } } | undefined
): LayoutNodeBox | undefined {
  if (!style) return undefined;
  const text = style.text;
  const fontSize = style.textConfig?.fontSize ?? DEFAULT_LABEL_FONT_SIZE;
  const cached = cardBoxes.get(style);
  if (cached && cached.text === text && cached.fontSize === fontSize) return cached.box;
  const lines = text?.trim().split('\n');
  const box = lines?.[0]
    ? {
        width: Math.max(...lines.map(measureText)) * fontSize + 2 * CARD_PADDING_X,
        height: lines.length * fontSize * LABEL_LINE_HEIGHT + 2 * CARD_PADDING_Y,
      }
    : undefined;
  cardBoxes.set(style, { text, fontSize, box });
  return box;
}

export function getEdgeArrowSize(edgeSize: number | undefined): number {
  // Capped: arrows on thick (busy) lines would cover the node they point at.
  return typeof edgeSize === 'number' ? Math.min(16, Math.max(2, edgeSize * 4)) : 12;
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
