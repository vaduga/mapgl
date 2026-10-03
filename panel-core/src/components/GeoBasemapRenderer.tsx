import MapLibre, { AttributionControl } from '@vis.gl/react-maplibre';
import React, { useMemo, type CSSProperties } from 'react';
import type { GeoBasemapProps } from './GeoBasemap';

type GeoBasemapRendererProps = GeoBasemapProps & { attributionStyle: CSSProperties };

function GeoBasemapRenderer({ assets, attributionStyle, mapStyle, onLoad, style, viewState }: GeoBasemapRendererProps) {
  const mapLib = useMemo(
    () => import(/* webpackIgnore: true */ assets.moduleUrl) as Promise<typeof import('maplibre-gl')>,
    [assets.moduleUrl]
  );
  return (
    <MapLibre
      mapLib={mapLib}
      workerUrl={assets.workerUrl}
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

export default GeoBasemapRenderer;
