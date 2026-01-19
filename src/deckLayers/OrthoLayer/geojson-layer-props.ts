// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LayerData} from '@deck.gl/core';
import {calculatePickingColors} from './geojson-binary';
import type {ExtendedBinaryFeatureCollection} from './geojson-binary';
import {ScatterplotLayerProps} from "deck.gl";

export type SubLayersProps = {
  points: Partial<ScatterplotLayerProps>;
};

function createEmptyLayerProps(): SubLayersProps {
  return {
    points: {},
  };
}

export function createLayerPropsFromBinary(
  geojsonBinary: Required<ExtendedBinaryFeatureCollection>,
  encodePickingColor: (id: number, result: number[]) => void
): SubLayersProps {
  // The binary data format is documented here
  // https://github.com/visgl/loaders.gl/blob/master/modules/gis/docs/api-reference/geojson-to-binary.md
  // It is the default output from the `MVTLoader` and can also be obtained
  // from GeoJSON by using the `geojsonToBinary` utility function.
  const layerProps = createEmptyLayerProps();
  const {points} = geojsonBinary;

  const customPickingColors = calculatePickingColors(geojsonBinary, encodePickingColor);

  layerProps.points.data = {
    length: points.positions.value.length / points.positions.size,
    attributes: {
      ...points.attributes,
      getPosition: points.positions,
      instancePickingColors: {
        size: 4,
        value: customPickingColors.points!
      }
    },
    properties: points.properties,
    numericProps: points.numericProps,
    featureIds: points.featureIds
  } as LayerData<any>;

  return layerProps;
}



