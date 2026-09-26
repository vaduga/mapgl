import React from 'react';
import { MapPanelRuntime } from '@mapgl/panel-core/runtime';
import { mapLayerRegistry, ORTHO_BASEMAP_CONFIG } from './layers/registry';
import RootStore from './store/RootStore';
import Mapgl from './components/Mapgl';

export class MapPanel extends MapPanelRuntime {
  readonly mapLayerRegistry = mapLayerRegistry;
  readonly orthoBasemapConfig = ORTHO_BASEMAP_CONFIG;

  protected createRootStore(props: any) {
    return new RootStore(props);
  }
  protected renderMap(props: any) {
    return <Mapgl {...props} />;
  }
}
