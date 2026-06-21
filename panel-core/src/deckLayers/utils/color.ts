import type { RGBAColor } from '@mapgl/panel-core/types';

function hexToRgba(hexColor: string) {
  let color = hexColor;
  if (color.startsWith('#')) {
    color = color.slice(1);
  }

  let alpha = 1;
  if (color.length === 8) {
    alpha = parseInt(color.substr(6, 2), 16) / 255;
    color = color.substr(0, 6);
  }

  const red = parseInt(color.substr(0, 2), 16);
  const green = parseInt(color.substr(2, 2), 16);
  const blue = parseInt(color.substr(4, 2), 16);

  return alpha !== 1 ? `rgba(${red},${green},${blue},${alpha.toFixed(2)})` : `rgb(${red},${green},${blue})`;
}

export function makeColorLighter(color: RGBAColor): RGBAColor {
  if (!Array.isArray(color) || color.length !== 4) {
    return [145, 145, 45, 255];
  }
  return color.map((value, index) => (index === 3 ? Math.min(value, 255) : Math.min(value + 45, 255))) as RGBAColor;
}

export function makeColorDarker(color: RGBAColor): RGBAColor {
  if (!Array.isArray(color) || color.length !== 4) {
    return [55, 55, 0, 255];
  }
  return color.map((value, index) => (index === 3 ? Math.min(value, 255) : Math.max(value - 45, 0))) as RGBAColor;
}

export function toRGB4Array(hexColor: string, opacity?: number): RGBAColor {
  if (!hexColor) {
    return [0, 0, 0, 0];
  }

  const rgbStr = hexToRgba(hexColor);
  const matches = rgbStr.match(/[\d.]+/g);
  if (!matches || matches.length < 3) {
    return [0, 0, 0, 0];
  }

  const rgba = matches.slice(0).map(Number) as RGBAColor;
  rgba[3] = opacity !== undefined ? Math.round((rgba[3] ?? 1) * 255 * opacity) : (rgba[3] ?? 1) * 255;

  return rgba;
}

export function toRgbaString(color: unknown): string {
  if (!Array.isArray(color) || color.length < 3) {
    throw new Error('Input must be an array of at least 3 elements.');
  }

  const alpha = color[3] === undefined ? 1 : Math.max(0, Math.min(Number(color[3]), 255)) / 255;
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}
