import { GrafanaTheme2, PluginState, Registry, SelectableValue } from '@grafana/data';

import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from '../extension';
import { basemapLayers as defaultBasemapLayers } from './basemaps';
import { orthoLayer } from './basemaps/blank';
import { carto } from './basemaps/carto';

export const ORTHO_BASEMAP_CONFIG: ExtendMapLayerOptions = {
  type: 'blank',
  name: '',
  config: {},
};

export const DEFAULT_BASEMAP_CONFIG: ExtendMapLayerOptions = {
  type: 'default',
  name: '',
  config: {},
};

interface RegistrySelectInfo {
  options: Array<SelectableValue<string>>;
  current: Array<SelectableValue<string>>;
}

export interface CreateGeomapLayerRegistryOptions {
  basemapLayers?: Array<ExtendMapLayerRegistryItem<any>>;
  dataLayers?: Array<ExtendMapLayerRegistryItem<any>>;
  defaultBaseMapLayer?: ExtendMapLayerRegistryItem<any>;
  getServerBaseLayerConfig?: () => ExtendMapLayerOptions | undefined;
  hasAlphaPanels?: boolean;
}

export function createGeomapLayerRegistry(options: CreateGeomapLayerRegistryOptions = {}) {
  const basemapLayers = options.basemapLayers ?? defaultBasemapLayers;
  const dataLayers = options.dataLayers ?? [];
  const fallbackBaseMapLayer = options.defaultBaseMapLayer ?? carto;

  const defaultBaseLayer: ExtendMapLayerRegistryItem = {
    id: DEFAULT_BASEMAP_CONFIG.type,
    hideOpacity: true,
    name: 'Default base layer',
    isBaseMap: true,

    create: (panel: any, layerOptions: ExtendMapLayerOptions, theme: GrafanaTheme2) => {
      const serverLayerConfig = options.getServerBaseLayerConfig?.();
      const serverLayerType = serverLayerConfig?.type;

      if (serverLayerType) {
        const layer = geomapLayerRegistry.getIfExists(serverLayerType);

        if (!layer) {
          throw new Error('Invalid basemap configuration on server');
        }

        return layer.create(panel, serverLayerConfig, theme);
      }

      return fallbackBaseMapLayer.create(panel, layerOptions, theme);
    },
  };

  const geomapLayerRegistry = new Registry<ExtendMapLayerRegistryItem<any>>(() => [
    orthoLayer,
    defaultBaseLayer,
    ...basemapLayers,
    ...dataLayers,
  ]);

  const getLayersSelection = (
    items: Array<ExtendMapLayerRegistryItem<any>>,
    current?: string
  ): RegistrySelectInfo => {
    const registry: RegistrySelectInfo = { options: [], current: [] };
    const alpha: Array<SelectableValue<string>> = [];

    for (const layer of items) {
      const option: SelectableValue<string> = {
        label: layer.name,
        value: layer.id,
        description: layer.description,
      };

      switch (layer.state) {
        case PluginState.alpha:
          if (!options.hasAlphaPanels) {
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

    for (const layer of alpha) {
      registry.options.push(layer);
    }

    return registry;
  };

  const getLayersOptions = (basemap: boolean, current?: string): RegistrySelectInfo => {
    if (basemap) {
      return getLayersSelection([orthoLayer, defaultBaseLayer, ...basemapLayers], current);
    }

    return getLayersSelection([...dataLayers], current);
  };

  return {
    basemapLayers,
    dataLayers,
    defaultBaseLayer,
    geomapLayerRegistry,
    getLayersOptions,
  };
}
