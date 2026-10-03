import type { SvgTintMode } from '../../deckLayers/utils/svg';
import { DEFAULT_ICON_NAME } from '../../types/defaults';

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

  type: string;
}

export interface OverrideTracker {
  overrideField: OverField;
  order: number;
  ID: string;
}

export const DEFAULT_LINE_WIDTH = 1;
