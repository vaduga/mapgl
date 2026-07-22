import { createGeoJsonLayer } from './geojsonLayer';
import { createMarkersLayer } from './markersLayer';
import { createPathLayer } from './pathLayer';
import { createPolygonsLayer } from './polygonsLayer';
import type { DataLayerEditorAdapters } from './types';

export function createDataLayers(adapters: DataLayerEditorAdapters) {
  return [
    createMarkersLayer(adapters),
    createPolygonsLayer(adapters),
    createPathLayer(adapters),
    createGeoJsonLayer(adapters),
  ];
}

export * from './geojsonLayer';
export * from './markersDefaults';
export * from './markersLayer';
export * from './pathLayer';
export * from './polygonsLayer';
export * from './types';
export * from './utils';
