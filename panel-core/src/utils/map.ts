import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { WebMercatorViewport } from '@deck.gl/core';

import type { MapViewConfig, MapLayerState, ViewState } from '../types';
import type { Graph } from '../graph/main';
import type { handlerProps } from '../components/Selects/ReactSelectSearch';
import { centerPointRegistry, MapCenterID } from '../view';
import { defaultNamespaceBoundaryProvider, type NamespaceBoundaryRecord } from '../extension-points/featureContracts';
import { SelectNodeEvent } from './bus.events';

export type Bounds = [number, number, number, number];

export interface CartesianFitOptions {
  maxZoom: number;
  /** Relative percentage added beyond the fitted data extent. */
  padding?: number;
}

export interface CartesianFitResult {
  longitude: number;
  latitude: number;
  zoom: number;
}

type FeatureLike = {
  geometry?: { coordinates?: unknown };
  id?: number;
};

type ViewportFitPanel = {
  graph: Graph;
  positions: Float64Array;
  layers?: MapLayerState[];
  layoutGraphBounds?: Map<string, unknown>;
  layerShift?: Record<string, [number, number]>;
};

export type ViewExtentPanel = ViewportFitPanel & {
  isLogic: boolean;
};

export type VisibleNamespaceSource = {
  getVisibleNamespaces(): string[];
};

export function fitCartesianBounds(
  bounds: Bounds,
  width: number,
  height: number,
  options: CartesianFitOptions
): CartesianFitResult {
  const [minX, minY, maxX, maxY] = bounds;
  const paddingFactor = 1 + Math.max(0, options.padding ?? 0) / 100;
  // OrbitView, like WebMercatorViewport, treats a zero-sized viewport as one
  // pixel while it is being initialized. Keep the Cartesian calculation on
  // the same footing so an incomplete panel size cannot turn the max zoom
  // into the fit result.
  const fitWidth = Number.isFinite(width) && width > 0 ? width : 1;
  const fitHeight = Number.isFinite(height) && height > 0 ? height : 1;
  const spanX = Math.max(0, maxX - minX);
  const spanY = Math.max(0, maxY - minY);
  const scaleX = spanX > 0 ? fitWidth / spanX : Infinity;
  const scaleY = spanY > 0 ? fitHeight / spanY : Infinity;
  const scale = Math.min(scaleX, scaleY) / paddingFactor;
  // A point extent has no scale of its own, so retain the existing max-zoom
  // behavior for that case. A non-degenerate extent always gets its zoom from
  // the available viewport scale; maxZoom is only applied as a ceiling.
  const fittedZoom =
    Number.isFinite(scale) && scale > 0
      ? Math.log2(scale)
      : spanX === 0 && spanY === 0
        ? options.maxZoom
        : 0;

  return {
    longitude: minX + spanX / 2,
    latitude: minY + spanY / 2,
    zoom: Math.min(options.maxZoom, fittedZoom),
  };
}

function getViewportFitBounds(
  layers: MapLayerState[],
  positions: Float64Array,
  options: Pick<MapViewConfig, 'allLayers' | 'lastOnly' | 'layer'>,
  namespaceBoundaries: NamespaceBoundaryRecord[] = []
): Bounds | undefined {
  const namespaceBounds = combineBoundaryRecords(namespaceBoundaries);
  if (namespaceBounds) {
    return namespaceBounds;
  }

  const layerFeatures = getLayerExtentFeatures(layers, options);
  return getFeatureBounds(layerFeatures, positions);
}

function combineBoundaryRecords(records: NamespaceBoundaryRecord[]): Bounds | undefined {
  if (!records.length) {
    return undefined;
  }

  return records.reduce(
    (acc, record) => [
      Math.min(acc[0], record.bounds[0]),
      Math.min(acc[1], record.bounds[1]),
      Math.max(acc[2], record.bounds[2]),
      Math.max(acc[3], record.bounds[3]),
    ],
    [Infinity, Infinity, -Infinity, -Infinity] as Bounds
  );
}

function getLayerExtentFeatures(
  layers: MapLayerState[],
  { allLayers = false, lastOnly = false, layer }: Pick<MapViewConfig, 'allLayers' | 'lastOnly' | 'layer'>
): FeatureLike[] {
  return layers
    .filter((item) => !item.isBasemap)
    .flatMap((item) => {
      const source = item.layer;
      const features = typeof source === 'object' && source !== null && 'features' in source ? source.features : [];
      if (allLayers) {
        return features as FeatureLike[];
      }

      if (lastOnly && layer === item.options?.name) {
        const feature = features.at(-1);
        return feature ? [feature as FeatureLike] : [];
      }

      if (!lastOnly && layer === item.options?.name) {
        return features as FeatureLike[];
      }

      return [];
    });
}

function getFeatureBounds(features: FeatureLike[], positions: Float64Array): Bounds | undefined {
  const coords = features.flatMap((feature) => getFeatureCoordinates(feature, positions));
  if (!coords.length) {
    return undefined;
  }

  return coords.reduce(
    (acc, [x, y]) => [Math.min(acc[0], x), Math.min(acc[1], y), Math.max(acc[2], x), Math.max(acc[3], y)],
    [Infinity, Infinity, -Infinity, -Infinity] as Bounds
  );
}

function getFeatureCoordinates(feature: FeatureLike, positions: Float64Array): Array<[number, number]> {
  if (feature.geometry?.coordinates) {
    return flattenCoordinates(feature.geometry.coordinates);
  }

  if (feature.id !== undefined) {
    const x = positions[feature.id * 2];
    const y = positions[feature.id * 2 + 1];
    return Number.isFinite(x) && Number.isFinite(y) ? [[x, y]] : [];
  }

  return [];
}

function flattenCoordinates(value: unknown): Array<[number, number]> {
  if (!Array.isArray(value)) {
    return [];
  }

  if (typeof value[0] === 'number' && typeof value[1] === 'number') {
    return Number.isFinite(value[0]) && Number.isFinite(value[1]) ? [[value[0], value[1]]] : [];
  }

  return value.flatMap((item) => flattenCoordinates(item));
}

export function getLayerFitBounds(
  panel: ViewportFitPanel,
  layers: MapLayerState[] = [],
  config: MapViewConfig
): Bounds | undefined {
  return getViewportFitBounds(layers, panel.positions, config);
}

export function getLogicFitBounds(panel: ViewportFitPanel, visNamespaces: string[]): Bounds | undefined {
  const visibleNamespaces = new Set(visNamespaces);
  const namespaceBoundaries = defaultNamespaceBoundaryProvider.getBoundaries({
    graph: panel.graph,
    visibleNamespaces,
    positions: panel.positions,
    layoutGraphBounds: panel.layoutGraphBounds,
    layerShift: panel.layerShift,
    padding: 0,
    includeRoot: true,
    applyLayerShift: true,
  });

  return getViewportFitBounds(panel.layers ?? [], panel.positions, { allLayers: true }, namespaceBoundaries);
}

export function initViewExtent(
  view: ViewState,
  config: MapViewConfig,
  width: number,
  height: number,
  layers: MapLayerState[],
  visLayers: VisibleNamespaceSource | undefined,
  panel: ViewExtentPanel
): void {
  const center = centerPointRegistry.getIfExists(config.id);
  if (center) {
    let { lon, lat, zoom } = center;
    let coordinates: [number, number] | undefined;

    if (center.lat == null) {
      if (center.id === MapCenterID.Coordinates) {
        coordinates = [config.lon ?? 0, config.lat ?? 0];
      } else if (center.id === MapCenterID.Fit) {
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
          } catch {
            getAppEvents().publish({
              type: AppEvents.alertWarning.name,
              payload: [`fit bounds for maxZoom ${maxZoom} and padding ${padding} error: out of bounds?`],
            });
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
  if (config.zoom !== undefined && center?.id !== MapCenterID.Fit) {
    const zoom = denormalizeZoom(!panel.isLogic, config.zoom);
    view.zoom = zoom;
    view.yZoom = zoom + 1;
  }

  if ([view.longitude, view.latitude, view.zoom].every((value) => value !== undefined)) {
    view.target = [view.longitude, view.latitude, panel.isLogic ? 0 : view.zoom!];
  }
}

export const selectGotoHandler = async ({
  pId,
  value,
  graphId,
  eventBus,
  coord,
  select,
  fly,
  edge,
  edgeId,
  zoomIn,
}: Partial<handlerProps>) => {
  const payload: SelectNodeEvent['payload'] = {
    ...(graphId !== undefined && { graphId }),
    ...(value !== undefined && { nodeId: value }),
    ...(select !== undefined && { select }),
    ...(edge !== undefined ? { edge } : edgeId !== undefined ? { edgeId } : {}),
    ...(coord !== undefined && { coord }),
    ...(fly !== undefined && { fly }),
    ...(zoomIn !== undefined && { zoomIn }),
    pId: pId as number,
  };
  eventBus?.publish({
    type: 'selectNode',
    payload,
  });
};

export function denormalizeZoom(isWebmercator: boolean, normalizedZoom: number): number {
  if (isWebmercator) {
    return normalizedZoom;
  }

  const clampedZoom = Math.max(1, Math.min(18, normalizedZoom));

  return ((clampedZoom - 1) / 17) * 10 - 5;
}

export function normalizeZoom(isWebmercator: boolean, zoom: number): number {
  if (isWebmercator) {
    return zoom;
  }

  const clampedZoom = Math.max(-5, Math.min(5, zoom));

  return ((clampedZoom + 5) / 10) * 17 + 1;
}
