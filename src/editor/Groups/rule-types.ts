import {FieldType, SelectableValue} from '@grafana/data';
import {genValuesWithIncrement} from "../../utils";
import {
  DEFAULT_ICON_NAME,
  DEFAULT_ICON_RULE_IS_COLLAPSED,
  DEFAULT_ICON_SIZE,
  DEFAULT_SVG_ICON_V_OFFSET
} from "mapLib/utils";

export interface Rule {
  lineWidth?: number;
  nodeSize?: number;
  overrides?: OverrideTracker | OverField[];
  label: string;
  color?: string;
  collapse?: boolean;
  iconSize?: number;
  iconVOffset?: number;
  iconName?: string;
  isEph?: boolean;
  groupIdx?: number;
}

export function defaultGroup(label): Rule {
  return {
    label, //: DEFAULT_ICON_RULE_LABEL,
    collapse: DEFAULT_ICON_RULE_IS_COLLAPSED,
    iconSize: DEFAULT_ICON_SIZE,
    iconVOffset: DEFAULT_SVG_ICON_V_OFFSET,
    iconName: DEFAULT_ICON_NAME
  }
}

export interface RuleTracker {
  rule: Rule;
  order: number;
  ID: string;
}


export interface OverField {
  name: string;
  value: string | string[];

  type: FieldType
}

export interface OverrideTracker {
  overrideField: OverField;
  order: number;
  ID: string;
}

export const NodeSizeStates: SelectableValue[] = genValuesWithIncrement(5, 50, 5, true);
export const LineWidthStates: SelectableValue[] = genValuesWithIncrement(0.1, 50, 1, true);
export const IconSvgSizes: SelectableValue[] = genValuesWithIncrement(10, 150, 5, false);
export const IconVOffsetValues: SelectableValue[] = genValuesWithIncrement(-20, 20, 5, false);


