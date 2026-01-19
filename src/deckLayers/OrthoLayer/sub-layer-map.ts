// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CompositeLayer, Layer} from '@deck.gl/core';
import {IconLayer, ScatterplotLayer, TextLayer} from "@deck.gl/layers";

export const POINT_LAYER = {
  circle: {
    type: ScatterplotLayer,
    props: {
      filled: 'filled',
      stroked: 'stroked',
      lineWidthMaxPixels: 'lineWidthMaxPixels',
      lineWidthMinPixels: 'lineWidthMinPixels',
      lineWidthScale: 'lineWidthScale',
      lineWidthUnits: 'lineWidthUnits',
      pointRadiusMaxPixels: 'radiusMaxPixels',
      pointRadiusMinPixels: 'radiusMinPixels',
      pointRadiusScale: 'radiusScale',
      pointRadiusUnits: 'radiusUnits',
      pointAntialiasing: 'antialiasing',
      pointBillboard: 'billboard',

      getFillColor: 'getFillColor',
      getLineColor: 'getLineColor',
      getLineWidth: 'getLineWidth',
      getPointRadius: 'getRadius'
    }
  },
  icon: {
    type: IconLayer,
    props: {
      iconSizeMaxPixels: 'sizeMaxPixels',
      iconSizeMinPixels: 'sizeMinPixels',
      iconSizeScale: 'sizeScale',
      iconSizeUnits: 'sizeUnits',
      iconAlphaCutoff: 'alphaCutoff',
      iconBillboard: 'billboard',

      getIcon: 'getIcon',
      getIconAngle: 'getAngle',
      getIconColor: 'getColor',
      getIconPixelOffset: 'getPixelOffset',
      getIconSize: 'getSize'
    }
  },
  text: {
    type: TextLayer,
    props: {
      textSizeMaxPixels: 'sizeMaxPixels',
      textSizeMinPixels: 'sizeMinPixels',
      textSizeScale: 'sizeScale',
      textSizeUnits: 'sizeUnits',

      textBackground: 'background',
      textBackgroundPadding: 'backgroundPadding',
      textFontFamily: 'fontFamily',
      textFontWeight: 'fontWeight',
      textLineHeight: 'lineHeight',
      textMaxWidth: 'maxWidth',
      textOutlineColor: 'outlineColor',
      textOutlineWidth: 'outlineWidth',
      textWordBreak: 'wordBreak',
      textCharacterSet: 'characterSet',
      textBillboard: 'billboard',
      textFontSettings: 'fontSettings',

      getText: 'getText',
      getTextAngle: 'getAngle',
      getTextColor: 'getColor',
      getTextPixelOffset: 'getPixelOffset',
      getTextSize: 'getSize',
      getTextAnchor: 'getTextAnchor',
      getTextAlignmentBaseline: 'getAlignmentBaseline',
      getTextBackgroundColor: 'getBackgroundColor',
      getTextBorderColor: 'getBorderColor',
      getTextBorderWidth: 'getBorderWidth'
    }
  }
};

export function getDefaultProps({
  type,
  props
}: {
  type: typeof Layer;
  props: Record<string, string>;
}): Record<string, any> {
  const result = {};
  for (const key in props) {
    result[key] = type.defaultProps[props[key]];
  }
  return result;
}

export function forwardProps(
  layer: CompositeLayer,
  mapping: Record<string, string>
): Record<string, any> {
  const {transitions, updateTriggers} = layer.props;
  const result: Record<string, any> = {
    updateTriggers: {},
    transitions: transitions && {
      getPosition: transitions.geometry
    }
  };

  for (const sourceKey in mapping) {
    const targetKey = mapping[sourceKey];
    let value = layer.props[sourceKey];
    if (sourceKey.startsWith('get')) {
      // isAccessor
      value = (layer as any).getSubLayerAccessor(value);
      result.updateTriggers[targetKey] = updateTriggers[sourceKey];
      if (transitions) {
        result.transitions[targetKey] = transitions[sourceKey];
      }
    }
    result[targetKey] = value;
  }
  return result;
}
