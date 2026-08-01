import { cartoLayers } from './carto';
import { esriLayers } from './esri';
import { genericLayers } from './generic';
import { osmLayers } from './osm';
import { jsonLayers } from './fromJson';

export { defaultOrthoConfig, orthoLayer } from './blank';
export type { OrthoConfig } from './blank';
export { carto, cartoLayers, defaultCartoConfig, LayerTheme } from './carto';
export { esriLayers, esriXYZTiles, publicServiceRegistry } from './esri';
export { fromJson, jsonLayers } from './fromJson';
export { genericLayers, xyzTiles } from './generic';
export { osmLayers, standard } from './osm';
export type { CartoConfig } from './carto';
export type { ESRIXYZConfig } from './esri';
export type { JsonConfig } from './fromJson';
export type { XYZConfig } from './generic';

/**
 * Registry for layer handlers
 */
export const basemapLayers = [
  ...osmLayers,
  ...cartoLayers,
  ...esriLayers, // keep formatting
  ...genericLayers,
  ...jsonLayers,
];
