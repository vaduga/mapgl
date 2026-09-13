import React from 'react';
import { MapPanelRuntime } from '@mapgl/panel-core/runtime';
import type { ViewState, MapViewConfig } from '@mapgl/panel-core/types';
import { mapLayerRegistry, ORTHO_BASEMAP_CONFIG } from './layers/registry';
import { initViewExtent } from './utils/utils.map';
import RootStore from './store/RootStore';
import Mapgl from './components/Mapgl';

export class MapPanel extends MapPanelRuntime {
  readonly mapLayerRegistry = mapLayerRegistry;
  readonly orthoBasemapConfig = ORTHO_BASEMAP_CONFIG;

  protected fitViewExtent(view: ViewState, config: MapViewConfig): void {
    initViewExtent(view, config, this.props.width, this.props.height, this.layers, this.visLayers, this);
  }

  protected createRootStore(props: any) {
    return new RootStore(props);
  }
  protected renderMap(props: any) {
    return <Mapgl {...props} />;
  }
}
