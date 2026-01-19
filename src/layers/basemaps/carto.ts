import {EventBus, GrafanaTheme2, MapLayerOptions} from '@grafana/data';
import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from '../../extension';
import {GeomapPanel} from "../../GeomapPanel";
import {libreSource} from "mapLib/utils";

// https://carto.com/help/building-maps/basemap-list/

export enum LayerTheme {
  Auto = 'auto',
  Light = 'light',
  Dark = 'dark',
}

export interface CartoConfig {
  theme?: LayerTheme;
  showLabels?: boolean;
}

export const defaultCartoConfig: CartoConfig = {
  theme: LayerTheme.Auto,
  showLabels: true,
};

export const carto: ExtendMapLayerRegistryItem<CartoConfig> = {
  id: 'carto',
  hideOpacity: true,
  name: 'CARTO reference map',
  isBaseMap: true,
  defaultOptions: defaultCartoConfig,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: (panel: GeomapPanel, options: ExtendMapLayerOptions<CartoConfig>, theme: GrafanaTheme2) => ({
    init: (): libreSource => {
      const cfg = { ...defaultCartoConfig, ...options.config };
      let style = cfg.theme as string;
      if (!style || style === LayerTheme.Auto) {
        style = theme.isDark ? 'dark' : 'light';
      }
      if (cfg.showLabels) {
        style += '_all';
      } else {
        style += '_nolabels';
      }
      const scale = window.devicePixelRatio > 1 ? '@2x' : '';
      return (
      {
        version: 8,
            sources: {
        carto: {
          type: 'raster',
              tiles: [`https://basemaps.cartocdn.com/${style}/{z}/{x}/{y}${scale}.png`],
              tileSize: 256,
              attribution: '© CARTO'
        }
      },
        layers: [
          {
            id: 'carto',
            type: 'raster',
            source: 'carto',
            minzoom: 0,
            maxzoom: 21
          }
        ]
      }



      );
    },
    registerOptionsUI: (builder) => {
      builder
          .addRadio({
            path: 'config.theme',
            name: 'Theme',
            settings: {
              options: [
                { value: LayerTheme.Auto, label: 'Auto', description: 'Match grafana theme' },
                { value: LayerTheme.Light, label: 'Light' },
                { value: LayerTheme.Dark, label: 'Dark' },
              ],
            },
            defaultValue: defaultCartoConfig.theme!,
          })
          .addBooleanSwitch({
            path: 'config.showLabels',
            name: 'Show labels',
            description: '',
            defaultValue: defaultCartoConfig.showLabels,
          });
    }
  })


};

export const cartoLayers = [carto];
