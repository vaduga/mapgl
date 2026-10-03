import React from 'react';
import { MapPanelRuntime } from '@vaduga/mapgl-grafana-adapter/runtime';
import { mapLayerRegistry, ORTHO_BASEMAP_CONFIG } from './layers/registry';
import Mapgl from './components/Mapgl';

export class MapPanel extends MapPanelRuntime {
  readonly mapLayerRegistry = mapLayerRegistry;
  readonly orthoBasemapConfig = ORTHO_BASEMAP_CONFIG;

  protected renderMap(props: any) {
    return <Mapgl {...props} />;
  }
}
