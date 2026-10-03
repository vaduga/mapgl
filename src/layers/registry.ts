import {
  ArcOptionsEditor,
  CapacityDimensionEditor,
  getQueryFields,
  GroupsEditor,
  StyleEditor,
} from '@vaduga/mapgl-grafana-adapter/editor';
import {
  createMapLayerRegistry,
  DEFAULT_BASEMAP_CONFIG,
  ORTHO_BASEMAP_CONFIG,
  createDataLayers,
} from '@vaduga/mapgl-grafana-adapter/layers';

import { config, hasAlphaPanels } from '../config';

const dataLayers = createDataLayers({
  ArcOptionsEditor,
  CapacityDimensionEditor,
  GroupsEditor,
  StyleEditor,
  getQueryFields,
});

const layerRegistry = createMapLayerRegistry({
  dataLayers,
  getServerBaseLayerConfig: () => config?.geomapDefaultBaseLayerConfig,
  hasAlphaPanels,
});

export { DEFAULT_BASEMAP_CONFIG, ORTHO_BASEMAP_CONFIG };

export const { basemapLayers, defaultBaseLayer, mapLayerRegistry, getLayersOptions } = layerRegistry;
