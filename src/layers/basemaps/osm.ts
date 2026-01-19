import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from '../../extension';
import {GrafanaTheme2} from "@grafana/data";
import {GeomapPanel} from "../../GeomapPanel";

export const standard: ExtendMapLayerRegistryItem = {
  id: 'osm-standard',
  hideOpacity: true,
  name: 'Open Street Map',
  isBaseMap: true,

create: (panel: GeomapPanel, options, theme: GrafanaTheme2) => ({
    init: () => {

      return (
          {
            version: 8,
            sources: {
              osm: {
                type: 'raster',
                tiles: [`https://a.tile.openstreetmap.org/{z}/{x}/{y}.png`],
                tileSize: 256,
                attribution: '© OpenStreetMap Contributors'
              }
            },
            layers: [
              {
                id: 'osm',
                type: 'raster',
                source: 'osm',
                minzoom: 0,
                maxzoom: 21
              }
            ]
          }



      );
    },
  }),

};

export const osmLayers = [standard];
