import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from '../../extension';
import { GrafanaTheme2 } from '@grafana/data';
import type { EdgeRoutingConfig, LayoutDirectionConfig } from '../../types';

export interface OrthoConfig {
  edgeRouting?: EdgeRoutingConfig;
  layoutDirection?: LayoutDirectionConfig;
  layerSeparation?: number;
  nodeSeparation?: number;
}

export const defaultOrthoConfig: Required<OrthoConfig> = {
  edgeRouting: 'Splines',
  layoutDirection: 'RL',
  layerSeparation: 60,
  nodeSeparation: 40,
};

export const orthoLayer: ExtendMapLayerRegistryItem<OrthoConfig> = {
  id: 'blank',
  hideOpacity: true,
  name: 'Node Graph ortho',
  isBaseMap: true,
  defaultOptions: defaultOrthoConfig,

  create: (panel: any, options, theme: GrafanaTheme2) => ({
    init: () => {
      return {
        version: 8,
        sources: {
          // osm: {
          //     type: 'raster',
          //     tiles: [`https://a.tile.openstreetmap.org/{z}/{x}/{y}.png`],
          //     tileSize: 256,
          //     attribution: '© OpenStreetMap Contributors'
          // }
        },
        layers: [
          // {
          //     id: 'osm',
          //     type: 'raster',
          //     source: 'osm',
          //     minzoom: 0,
          //     maxzoom: 20
          // }
        ],
      };
    },
    registerOptionsUI: (builder) => {
      builder
        .addRadio({
          path: 'config.edgeRouting',
          name: 'Edge routing',
          description: 'Auto-layout routing mode',
          settings: {
            options: [
              { label: 'Splines', value: 'Splines' },
              { label: 'Rectilinear', value: 'Rectilinear' },
            ],
          },
          defaultValue: defaultOrthoConfig.edgeRouting,
        })
        .addRadio({
          path: 'config.layoutDirection',
          name: 'Layout direction',
          description: 'Direction for auto-layout layers',
          settings: {
            options: [
              { label: 'Right to left', value: 'RL' },
              { label: 'Left to right', value: 'LR' },
              { label: 'Top to bottom', value: 'TB' },
              { label: 'Bottom to top', value: 'BT' },
            ],
          },
          defaultValue: defaultOrthoConfig.layoutDirection,
        })
        .addNumberInput({
          path: 'config.layerSeparation',
          name: 'Layer separation',
          description: 'Distance between adjacent auto-layout layers',
          settings: {
            integer: true,
            min: 1,
            step: 1,
          },
          defaultValue: defaultOrthoConfig.layerSeparation,
        })
        .addNumberInput({
          path: 'config.nodeSeparation',
          name: 'Node separation',
          description: 'Distance between nodes in the same auto-layout layer',
          settings: {
            integer: true,
            min: 1,
            step: 1,
          },
          defaultValue: defaultOrthoConfig.nodeSeparation,
        });
    },
  }),
};
