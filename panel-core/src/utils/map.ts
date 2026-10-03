import { WebMercatorViewport } from '@deck.gl/core';

import type { ViewState } from '../types';
import {
  denormalizeZoom,
  fitCartesianBounds,
  getLayerFitBounds,
  getLogicFitBounds,
  type FitConfig,
  type FitLayer,
  type ViewExtentInput,
  type VisibleNamespaceSource,
} from './mapGeometry';

export type ViewExtentCenter = {
  kind: 'coordinates' | 'fit' | 'fixed';
  lon?: number;
  lat?: number;
  zoom?: number;
};

export type MapViewExtentConfig = FitConfig & {
  id: string;
  lon?: number;
  lat?: number;
  maxZoom?: number;
  minZoom?: number;
  padding?: number;
  zoom?: number;
};

export function initViewExtent(
  view: ViewState,
  config: MapViewExtentConfig,
  center: ViewExtentCenter | undefined,
  width: number,
  height: number,
  layers: FitLayer[],
  visLayers: VisibleNamespaceSource | undefined,
  panel: ViewExtentInput
): void {
  if (center) {
    let { lon, lat, zoom } = center;
    let coordinates: [number, number] | undefined;

    if (center.lat == null) {
      if (center.kind === 'coordinates') {
        coordinates = [config.lon ?? 0, config.lat ?? 0];
      } else if (center.kind === 'fit') {
        const viewport = new WebMercatorViewport({ width, height });
        const configuredZoom = config.zoom ?? config.maxZoom;
        const maxZoom = configuredZoom && configuredZoom > 0 ? configuredZoom : 18;
        const visibleNamespaces = visLayers?.getVisibleNamespaces() ?? [];
        const bounds = panel.isLogic
          ? getLogicFitBounds(panel, visibleNamespaces)
          : getLayerFitBounds(panel, layers, config);

        if (bounds) {
          const [minX, minY, maxX, maxY] = bounds;
          const padding = config.padding ?? 5;

          try {
            const denormalizedZoom = denormalizeZoom(!panel.isLogic, maxZoom);
            const fittedView = panel.isLogic
              ? fitCartesianBounds(bounds, width, height, { maxZoom: denormalizedZoom, padding })
              : viewport.fitBounds(
                  [
                    [minX, minY],
                    [maxX, maxY],
                  ],
                  { maxZoom: denormalizedZoom, padding }
                );
            lon = fittedView.longitude;
            lat = fittedView.latitude;
            zoom = fittedView.zoom;
          } catch (error) {
            console.error(
              'fit bounds for maxZoom ' + maxZoom + ' and padding ' + padding + ' error: out of bounds?',
              error
            );
          }
        }

        if (lon == null) {
          ({ lon, lat, zoom } = center);
        }
        coordinates = [lon ?? 0, lat ?? 0];
      }
    } else {
      coordinates = [center.lon ?? 0, center.lat];
    }

    if (coordinates) {
      view.longitude = coordinates[0];
      view.latitude = coordinates[1];
    }
    if (zoom !== undefined) {
      view.zoom = zoom;
      view.yZoom = zoom + 1;
    }
  }

  if (config.maxZoom) {
    view.maxZoom = config.maxZoom;
  }
  if (config.minZoom !== undefined) {
    view.minZoom = config.minZoom;
  }
  if (config.zoom !== undefined && center?.kind !== 'fit') {
    const zoom = denormalizeZoom(!panel.isLogic, config.zoom);
    view.zoom = zoom;
    view.yZoom = zoom + 1;
  }

  if ([view.longitude, view.latitude, view.zoom].every((value) => value !== undefined)) {
    view.target = [view.longitude, view.latitude, panel.isLogic ? 0 : view.zoom!];
  }
}
