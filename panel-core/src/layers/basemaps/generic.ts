import { GrafanaTheme2, textUtil } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from '../../extension';
import type { libreSource } from '@mapgl/panel-core/types';

export interface XYZConfig {
  url: string;
  attribution: string;
}

const urlBase = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer';
const sampleURL = urlBase + '/tile/{z}/{y}/{x}';
export const defaultXYZConfig: XYZConfig = {
  url: sampleURL,
  attribution: `Tiles © <a href="${urlBase}">ArcGIS</a>`,
};

export const xyzTiles: ExtendMapLayerRegistryItem<XYZConfig> = {
  id: 'xyz',
  hideOpacity: true,
  name: 'XYZ Tile layer',
  description: 'Add map from a generic tile layer',
  isBaseMap: true,

  create: (panel: any, options: ExtendMapLayerOptions<XYZConfig>, theme: GrafanaTheme2) => ({
    init: (): libreSource => {
      const cfg = { ...options.config };
      if (!cfg.url) {
        cfg.url = defaultXYZConfig.url;
        cfg.attribution = cfg.attribution ?? defaultXYZConfig.attribution ?? '';
      }
      const interpolatedUrl = textUtil.sanitizeUrl(getTemplateSrv().replace(cfg.url));
      const interpolatedAttribution = textUtil.sanitizeTextPanelContent(getTemplateSrv().replace(cfg.attribution));

      return {
        version: 8,
        sources: {
          xyz: {
            type: 'raster',
            tiles: [interpolatedUrl],
            tileSize: 256,
            attribution: interpolatedAttribution,
          },
        },
        layers: [
          {
            id: 'xyz',
            type: 'raster',
            source: 'xyz',
            minzoom: 0,
            maxzoom: 21,
          },
        ],
      };
    },
    registerOptionsUI: (builder) => {
      builder
        .addTextInput({
          path: 'config.url',
          name: 'URL template',
          description: 'Must include {x}, {y} or {-y}, and {z} placeholders. Dashboard variables are supported.',
          settings: {
            placeholder: defaultXYZConfig.url,
          },
        })
        .addTextInput({
          path: 'config.attribution',
          name: 'Attribution',
          settings: {
            placeholder: defaultXYZConfig.attribution,
          },
        });
    },
  }),
};

export const genericLayers = [xyzTiles];
