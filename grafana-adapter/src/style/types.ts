import {
  ColorDimensionConfig,
  ResourceDimensionConfig,
  ScaleDimensionConfig,
  ScalarDimensionConfig,
  TextDimensionConfig,
  BaseDimensionConfig,
} from '@grafana/schema';
import { DimensionSupplier } from '../grafana_core/app/features/dimensions/index';
import type { RGBAColor } from '../types/index';
import {
  type Rule,
  type ArcOption,
  type ArcOptionsConfig,
  type SymbolAlign,
  type TextStyleConfig,
  type StyleConfigValues,
  DEFAULT_SIZE,
} from '@vaduga/mapgl-core/style';

export interface ColorDimensionConfigWithThresholds extends ColorDimensionConfig {
  thresholds?: unknown;
}

export * from '@vaduga/mapgl-core/style';

// StyleConfig is saved in panel json and is used to configure how items get rendered
export interface StyleConfig {
  group?: Rule;
  color?: ColorDimensionConfigWithThresholds;
  arcs?: ArcOption[];
  arcOptions?: ArcOptionsConfig;
  opacity?: number;
  arrow?: 0 | 1 | -1 | 2;
  capacity?: BaseDimensionConfig;
  useGroups?: boolean;

  // For non-points
  lineWidth?: number;

  // Used for points and dynamic text
  size?: ScaleDimensionConfig;
  symbol?: ResourceDimensionConfig;
  symbolAlign?: SymbolAlign;

  // Can show markers and text together!
  text?: TextDimensionConfig;
  textConfig?: TextStyleConfig;

  // Allow for rotation of markers
  rotation?: ScalarDimensionConfig;
}

/** When the style depends on a field */
export interface StyleConfigFields {
  color?: string;
  size?: string;
  capacity?: string;
  text?: string;
  rotation?: string;
  arcs?: ArcOption[];
}

export interface StyleDimensions {
  color?: DimensionSupplier<string>;
  size?: DimensionSupplier<number>;
  text?: DimensionSupplier<string>;
  rotation?: DimensionSupplier<number>;
}

export interface StyleConfigState {
  config: StyleConfig;
  hasText?: boolean;
  base: StyleConfigValues;
  fields?: StyleConfigFields;
  dims?: StyleDimensions;
  arcDims?: StyleDimensions[];
}

export const defaultStyleConfig = Object.freeze({
  size: {
    fixed: DEFAULT_SIZE,
    min: 5,
    max: 20,
  },
  color: {
    fixed: 'dark-green', // picked from theme
  },
  opacity: 0.4,
  textConfig: {
    fontSize: 14,
    // textAlign: TextAlignment.Center,
    // textBaseline: TextBaseline.Middle,
    // offsetX: 0,
    // offsetY: 0,
  },
});
