import { locationService } from '@grafana/runtime';
import MapLibre, { AttributionControl } from '@vis.gl/react-maplibre';
import React, { type CSSProperties } from 'react';

declare const __webpack_public_path__: string;

type MapLibreModule = typeof import('maplibre-gl');

function getMapLibreAssetUrl(fileName: string): string {
  const location = locationService.getLocation();
  const publicPath = typeof __webpack_public_path__ === 'undefined' ? location.href : __webpack_public_path__;
  return new URL(fileName, new URL(publicPath, location.href)).href;
}

let mapLibrePromise: Promise<MapLibreModule> | undefined;

function loadMapLibre(): Promise<MapLibreModule> {
  mapLibrePromise ??= import(/* webpackIgnore: true */ getMapLibreAssetUrl('maplibre-gl.mjs'));
  return mapLibrePromise;
}

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
      mapLib={loadMapLibre()}
      mapStyle={mapStyle}
      onLoad={onLoad}
      style={style}
      viewState={viewState}
      workerUrl={getMapLibreAssetUrl('maplibre-gl-worker.mjs')}
      attributionControl={false}
    >
      <AttributionControl style={attributionStyle} />
    </MapLibre>
  );
}

export default GeoBasemap;
