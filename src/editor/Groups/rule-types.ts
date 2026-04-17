import { FieldType, SelectableValue } from '@grafana/data';
import { genValuesWithIncrement } from '../../utils';
import { SvgTintMode } from '../../types';
import {
  DEFAULT_ICON_NAME,
  DEFAULT_ICON_RULE_IS_COLLAPSED,
  DEFAULT_SVG_ICON_V_OFFSET,
} from 'mapLib/utils';

export interface Rule {
  width?: number;
  size?: number;
  overrides?: OverrideTracker | OverField[];
  label: string;
  color?: string;
  collapse?: boolean;
  offset?: number;
  iconName?: string;
  svgTintMode?: SvgTintMode;
  isEph?: boolean;
  groupIdx?: number;
}

export function defaultGroup(label): Rule {
  return {
    label, //: DEFAULT_ICON_RULE_LABEL,
    collapse: DEFAULT_ICON_RULE_IS_COLLAPSED,
    offset: DEFAULT_SVG_ICON_V_OFFSET,
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
export const IconVOffsetValues: SelectableValue[] = genValuesWithIncrement(-20, 20, 5, false);
export const SvgTintModeOptions: Array<SelectableValue<SvgTintMode>> = [
  { label: 'None', value: 'none' },
  { label: 'Markup recolor', value: 'markup' },
  { label: 'Canvas tint', value: 'canvasTint' },
];
