import React, { lazy, Suspense, type CSSProperties } from 'react';
import type MapLibre from '@vis.gl/react-maplibre';

const GeoBasemapRenderer = lazy(() => import('./GeoBasemapRenderer'));

const attributionStyle: CSSProperties = {
  zIndex: 1000,
  position: 'absolute',
  right: 4,
  bottom: 4,
};

type MapLibreProps = React.ComponentProps<typeof MapLibre>;

export interface GeoBasemapProps {
  assets: { moduleUrl: string; workerUrl: string };
  mapStyle: MapLibreProps['mapStyle'];
  onLoad: NonNullable<MapLibreProps['onLoad']>;
  style?: MapLibreProps['style'];
  viewState?: MapLibreProps['viewState'];
}

function GeoBasemap(props: GeoBasemapProps) {
  return (
    <Suspense fallback={null}>
      <GeoBasemapRenderer {...props} attributionStyle={attributionStyle} />
    </Suspense>
  );
}

export default GeoBasemap;
