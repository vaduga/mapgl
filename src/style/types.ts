import {Rule} from "../editor/Groups/rule-types";

type Style = {}

import {
    ColorDimensionConfig,
    ResourceDimensionConfig,
    ScaleDimensionConfig,
    ScalarDimensionConfig,
    TextDimensionConfig, BaseDimensionConfig,
} from '@grafana/schema';
import {DimensionSupplier} from '../grafana_core/app/features/dimensions';
import {RGBAColor} from "mapLib/utils";
import {ArcOption} from "../editor/types";

export enum GeometryTypeId {
    Point = 'point',
    Line = 'line',
    Polygon = 'polygon',
    Any = '*any*',
}

// StyleConfig is saved in panel json and is used to configure how items get rendered
export interface StyleConfig {
    group?: Rule;
    color?: ColorDimensionConfig;
    arcs?: ArcOption[];
    opacity?: number; // defaults to 80%
    arrow?: 0 | 1 | -1 | 2
    capacity?: BaseDimensionConfig;
    useGroups?: boolean

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
 * Static options for text display.  See:
 * https://openlayers.org/en/latest/apidoc/module-ol_style_Text.html
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

    // Pass though (not value dependant)
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

