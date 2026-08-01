import { FieldType, SelectableValue } from '@grafana/data';
import type { SvgTintMode } from '../../deckLayers/utils/svg';
import {
  DEFAULT_ICON_NAME,
} from '../../types/defaults';

export interface Rule {
  width?: number;
  isDashed?: boolean;
  size?: number;
  overrides?: OverrideTracker | OverField[];
  label: string;
  color?: string;
  iconName?: string;
  svgTintMode?: SvgTintMode;
  isEph?: boolean;
  groupIdx?: number;
}

export function defaultGroup(label): Rule {
  return {
    label,
    iconName: DEFAULT_ICON_NAME,
    svgTintMode: 'none',
  };
}

export interface RuleTracker {
  rule: Rule;
  order: number;
  ID: string;
}

export interface OverField {
  name: string;
  value: string | string[];

  type: FieldType;
}

export interface OverrideTracker {
  overrideField: OverField;
  order: number;
  ID: string;
}

export const DEFAULT_LINE_WIDTH = 1;
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
