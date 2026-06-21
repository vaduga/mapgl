import { createMapglPanelPlugin } from '@mapgl/panel-core';

import { PLUGIN_ID } from './constants/plugin';
import { createGetLayerEditor, createLayersEditor, MapViewEditor } from '@mapgl/panel-core/editor';
import { MapPanel } from './MapPanel';
import { defaultMapViewConfig, type GeomapInstanceState, type MapLayerState, type Options } from '@mapgl/panel-core/types';
import { initPluginTranslations } from '@mapgl/panel-core/utils/i18n';
import { geomapLayerRegistry, getLayersOptions } from './layers/registry';

const LayersEditor = createLayersEditor({ getLayersOptions });
const getLayerEditor = createGetLayerEditor({ geomapLayerRegistry, getLayersOptions });

export const plugin = createMapglPanelPlugin<Options, MapLayerState, GeomapInstanceState>({
  edition: 'oss',
  features: [],
  pluginId: PLUGIN_ID,
  panelComponent: MapPanel,
  mapViewEditor: MapViewEditor,
  layersEditor: LayersEditor,
  getLayerEditor,
  defaultMapViewConfig,
  initPluginTranslations,
});
