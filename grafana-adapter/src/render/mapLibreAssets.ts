import type { GeoBasemapProps } from '@vaduga/mapgl-core/components';

declare const __webpack_public_path__: string;

export function getMapLibreAssets(): GeoBasemapProps['assets'] {
  const baseUrl = new URL(__webpack_public_path__, document.baseURI);
  return {
    moduleUrl: new URL('maplibre-gl.mjs', baseUrl).href,
    workerUrl: new URL('maplibre-gl-worker.mjs', baseUrl).href,
  };
}
