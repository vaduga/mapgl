import type { SelectableValue } from '@grafana/data';
import type { SvgTintMode } from '@vaduga/mapgl-core/deckLayers/utils';
export * from '@vaduga/mapgl-core/style';
export const NodeSizeStates: SelectableValue[] = genValuesWithIncrement(5, 50, 5, false);
export const LineWidthStates: SelectableValue[] = genValuesWithIncrement(0.1, 50, 1, true);
export const SvgTintModeOptions: Array<SelectableValue<SvgTintMode>> = [
  { label: 'None', value: 'none' },
  { label: 'Markup recolor', value: 'markup' },
  { label: 'Canvas tint', value: 'canvasTint' },
];

function genValuesWithIncrement(start: number, end: number, increment: number, slowStart = false): SelectableValue[] {
  const values: SelectableValue[] = [];
  let currentIncrement = slowStart ? 0.1 : increment;

  for (let value = start; value <= end; value += currentIncrement) {
    const roundedValue = parseFloat(value.toFixed(1));
    values.push({ value: roundedValue, label: roundedValue.toString() });

    if (roundedValue === 1) {
      currentIncrement = increment;
    }
  }

  return values;
}
