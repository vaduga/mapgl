import {
  ArcOptionsEditor,
  CapacityDimensionEditor,
  getQueryFields,
  GroupsEditor,
  StyleEditor,
} from '@mapgl/panel-core/editor';
import {
  createGeomapLayerRegistry,
  DEFAULT_BASEMAP_CONFIG,
  ORTHO_BASEMAP_CONFIG,
} from '@mapgl/panel-core/layers';
import { createDataLayers } from '@mapgl/panel-core/layers/data';
import { hasAlphaPanels } from '../config';

const dataLayers = createDataLayers({
  ArcOptionsEditor,
  CapacityDimensionEditor,
  GroupsEditor,
  StyleEditor,
  getQueryFields,
});

const layerRegistry = createGeomapLayerRegistry({
  dataLayers,
  hasAlphaPanels,
});

export { DEFAULT_BASEMAP_CONFIG, ORTHO_BASEMAP_CONFIG };

export const { basemapLayers, defaultBaseLayer, geomapLayerRegistry, getLayersOptions } = layerRegistry;
