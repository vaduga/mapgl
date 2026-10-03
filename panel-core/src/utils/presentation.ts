import { HorizontalAlign, VerticalAlign, type SymbolAlign } from '../style/types';

export function areMapViewConfigsEqual(left: object | undefined, right: object | undefined): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }

  const leftValues = left as unknown as Record<string, unknown>;
  const rightValues = right as unknown as Record<string, unknown>;
  const keys = new Set([...Object.keys(leftValues), ...Object.keys(rightValues)]);
  return Array.from(keys).every((key) => Object.is(leftValues[key], rightValues[key]));
}

/** Return a displacment array depending on alignment and icon radius */
export function getDisplacement(symbolAlign: SymbolAlign, radius: number) {
  const displacement = [0, 0];
  if (symbolAlign?.horizontal === HorizontalAlign.Left) {
    displacement[0] = -radius;
  } else if (symbolAlign?.horizontal === HorizontalAlign.Right) {
    displacement[0] = radius;
  }
  if (symbolAlign?.vertical === VerticalAlign.Top) {
    displacement[1] = radius;
  } else if (symbolAlign?.vertical === VerticalAlign.Bottom) {
    displacement[1] = -radius;
  }
  return displacement;
}
