import {
  Registry,
  GrafanaTheme2,
  PluginState,
  SelectableValue,
} from '@grafana/data';
import {config, hasAlphaPanels} from '../config';
import { basemapLayers } from './basemaps';
import {orthoLayer} from './basemaps/blank';

import { dataLayers } from './data';
import { ExtendMapLayerRegistryItem, ExtendMapLayerOptions } from '../extension';
import {GeomapPanel} from "../GeomapPanel";
import {carto} from "./basemaps/carto";

export const ORTHO_BASEMAP_CONFIG: ExtendMapLayerOptions = {
  type: 'blank',
  name: '',
  config: {},
};

export const DEFAULT_BASEMAP_CONFIG: ExtendMapLayerOptions = {
  type: 'default',
  name: '', // will get filled in with a non-empty name
  config: {},
};

// Default base layer depending on the server setting
export const defaultBaseLayer: ExtendMapLayerRegistryItem = {
  id: DEFAULT_BASEMAP_CONFIG.type,
  hideOpacity: true,
  name: 'Default base layer',
  isBaseMap: true,

  create: (panel: GeomapPanel, options: ExtendMapLayerOptions, theme: GrafanaTheme2) => {
    const serverLayerType = config?.geomapDefaultBaseLayerConfig?.type;
    if (serverLayerType) {
      const layer = geomapLayerRegistry.getIfExists(serverLayerType) ;

      if (!layer) {
        throw new Error('Invalid basemap configuraiton on server');
      }
      return layer.create(panel, config.geomapDefaultBaseLayerConfig!, theme);
    }

    // For now use carto as our default basemap
    return carto.create(panel, options, theme);
  },
};

/**
 * Registry for layer handlers
 */
export const geomapLayerRegistry = new Registry<ExtendMapLayerRegistryItem<any>>(() => [
  orthoLayer,
  defaultBaseLayer,
  ...basemapLayers, // simple basemaps
  ...dataLayers, // Layers with update functions
]);

interface RegistrySelectInfo {
  options: Array<SelectableValue<string>>;
  current: Array<SelectableValue<string>>;
}

function getLayersSelection(items: Array<ExtendMapLayerRegistryItem<any>>, current?: string): RegistrySelectInfo {
  const registry: RegistrySelectInfo = { options: [], current: [] };
  const alpha: Array<SelectableValue<string>> = [];

  for (const layer of items) {
    const option: SelectableValue<string> = { label: layer.name, value: layer.id, description: layer.description };

    switch (layer.state) {
      case PluginState.alpha:
        if (!hasAlphaPanels) {
          break;
        }
        option.label = `${layer.name} (Alpha)`;
        option.icon = 'bolt';
        alpha.push(option);
        break;
      case PluginState.beta:
        option.label = `${layer.name} (Beta)`;
      default:
        registry.options.push(option);
    }

    if (layer.id === current) {
      registry.current.push(option);
    }
  }

  // Position alpha layers at the end of the layers list
  for (const layer of alpha) {
    registry.options.push(layer);
  }

  return registry;
}

export function getLayersOptions(basemap: boolean, current?: string): RegistrySelectInfo {
  if (basemap) {
    return getLayersSelection([orthoLayer, defaultBaseLayer, ...basemapLayers], current);
  }

  return getLayersSelection([...dataLayers], current); /// , ...basemapLayers <-- deck.gl is an overlay over a single basemap provided by other library
}
