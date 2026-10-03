import { createMapglPanelPlugin } from '@vaduga/mapgl-grafana-adapter';

import { PLUGIN_ID } from './constants/plugin';
import { createGetLayerEditor, createLayersEditor, MapViewEditor } from '@vaduga/mapgl-grafana-adapter/editor';
import { MapPanel } from './MapPanel';
import {
  defaultMapViewConfig,
  type MapInstanceState,
  type MapLayerState,
  type Options,
} from '@vaduga/mapgl-grafana-adapter/types';
import { initPluginTranslations } from '@vaduga/mapgl-core/utils/i18n';
import { mapLayerRegistry, getLayersOptions } from './layers/registry';

const LayersEditor = createLayersEditor({ getLayersOptions });
const getLayerEditor = createGetLayerEditor({ mapLayerRegistry, getLayersOptions });

export const plugin = createMapglPanelPlugin<Options, MapLayerState, MapInstanceState>({
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
