import { locationService } from '@grafana/runtime';
import MapLibre, { AttributionControl } from '@vis.gl/react-maplibre';
import * as maplibregl from 'maplibre-gl';
import React, { type CSSProperties } from 'react';

declare const __webpack_public_path__: string;

function configureMapLibreWorker(): void {
  if (typeof Worker === 'undefined' || typeof __webpack_public_path__ === 'undefined') {
    return;
  }

  const publicPath = new URL(__webpack_public_path__, locationService.getLocation().href);
  maplibregl.setWorkerUrl(new URL('maplibre-gl-worker.mjs', publicPath).href);
}

configureMapLibreWorker();

type MapLibreProps = React.ComponentProps<typeof MapLibre>;

export interface GeoBasemapProps {
  attributionStyle: CSSProperties;
  mapStyle: MapLibreProps['mapStyle'];
  onLoad: NonNullable<MapLibreProps['onLoad']>;
  style?: MapLibreProps['style'];
  viewState?: MapLibreProps['viewState'];
}

function GeoBasemap({ attributionStyle, mapStyle, onLoad, style, viewState }: GeoBasemapProps) {
  return (
    <MapLibre
      mapLib={maplibregl}
      mapStyle={mapStyle}
      onLoad={onLoad}
      style={style}
      viewState={viewState}
      attributionControl={false}
    >
      <AttributionControl style={attributionStyle} />
    </MapLibre>
  );
}

export default GeoBasemap;
