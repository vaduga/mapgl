import {
  ColorDimensionConfig,
  ResourceDimensionConfig,
  ScaleDimensionConfig,
  ScalarDimensionConfig,
  TextDimensionConfig,
  BaseDimensionConfig,
} from '@grafana/schema';
import { DimensionSupplier } from '../grafana_core/app/features/dimensions';
import type { RGBAColor } from '@mapgl/panel-core/types';
import type { Rule } from '@mapgl/panel-core/editor';

export interface ColorDimensionConfigWithThresholds extends ColorDimensionConfig {
  thresholds?: unknown;
}

export enum GeometryTypeId {
  Point = 'point',
  Line = 'line',
  Polygon = 'polygon',
  Any = '*any*',
}

export interface ArcOption {
  /**
   * The color of the arc.
   */
  fixed: string;
  /**
   * Field from which to get the value. Values should be less than 1, representing fraction of a circle.
   */
  field?: string;
}

export interface ArcOptionsConfig {
  /** Radial thickness multiplier for both section and gauge bars. */
  barWidthFactor?: number;
  /** Number of compact bars used by the metric-driven gauge. */
  segments?: number;
  /** Normalized gap between gauge bars. */
  segmentSpacing?: number;
  /** Whether the gauge's full-range outer reference circle is rendered. */
  showThresholds?: boolean;
  /** Whether threshold colors are smoothly interpolated across the gauge. */
  gradient?: boolean;
}

export type ResolvedArcOptionsConfig = {
  barWidthFactor: number;
  segments: number;
  segmentSpacing: number;
  showThresholds: boolean;
  gradient: boolean;
};

export const DEFAULT_ARC_OPTIONS: ResolvedArcOptionsConfig = Object.freeze({
  barWidthFactor: 0.5,
  segments: 48,
  segmentSpacing: 0.3,
  showThresholds: true,
  gradient: true,
});

const clampArcOption = (value: unknown, min: number, max: number, fallback: number): number => {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, numeric));
};

export const resolveArcOptions = (options?: ArcOptionsConfig): ResolvedArcOptionsConfig => ({
  barWidthFactor: clampArcOption(options?.barWidthFactor, 0.1, 1, DEFAULT_ARC_OPTIONS.barWidthFactor),
  segments: Math.round(clampArcOption(options?.segments, 1, 100, DEFAULT_ARC_OPTIONS.segments)),
  segmentSpacing: clampArcOption(options?.segmentSpacing, 0, 1, DEFAULT_ARC_OPTIONS.segmentSpacing),
  showThresholds: options?.showThresholds ?? DEFAULT_ARC_OPTIONS.showThresholds,
  gradient: typeof options?.gradient === 'boolean' ? options.gradient : DEFAULT_ARC_OPTIONS.gradient,
});

export const isMetricDrivenArc = (arcs?: readonly ArcOption[]): boolean =>
  arcs?.length === 1 && Boolean(arcs[0]?.field);

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

export const DEFAULT_SIZE = 5;

export enum TextAlignment {
  Left = 'left',
  Center = 'center',
  Right = 'right',
}
export enum TextBaseline {
  Top = 'top',
  Middle = 'middle',
  Bottom = 'bottom',
}
export enum HorizontalAlign {
  Left = 'left',
  Center = 'center',
  Right = 'right',
}
export enum VerticalAlign {
  Top = 'top',
  Center = 'center',
  Bottom = 'bottom',
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

export interface SymbolAlign {
  horizontal?: HorizontalAlign;
  vertical?: VerticalAlign;
}

/**
 * Static options for text display.
 */
export interface TextStyleConfig {
  fontSize?: number;
  offsetX?: number;
  offsetY?: number;
  textAlign?: TextAlignment;
  textBaseline?: TextBaseline;
}

// Applying the config to real data gives the values
export interface StyleConfigValues {
  color: string | RGBAColor;
  opacity?: number;
  lineWidth?: number;
  size?: number;
  symbol?: string; // the point symbol
  symbolAlign?: SymbolAlign;
  rotation?: number;
  text?: string;

  // Pass through (not value dependant)
  textConfig?: TextStyleConfig;
  arrow?: 0 | 1 | -1 | 2;
  useGroups?: boolean;
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
