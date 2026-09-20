import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { WebMercatorViewport } from '@deck.gl/core';

import type { MapViewConfig, MapLayerState, ViewState } from '../types';
import type { Graph } from '../graph/main';
import type { handlerProps } from '../components/Selects/ReactSelectSearch';
import { centerPointRegistry, MapCenterID } from '../view';
import {
  defaultViewportFitStrategy,
  getMapglFeatureServices,
  getNamespaceBoundaries,
  type ViewportFitContext,
  type ViewportFitStrategy,
} from '../extension-points/featureContracts';
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

type ViewportFitPanel = {
  featureServices?: import('../extension-points/contracts').MapglFeatureServices;
  graph: Graph;
  positions: Float64Array;
  layers?: unknown[];
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

export function getLayerFitBounds(
  panel: ViewportFitPanel,
  layers: MapLayerState[] = [],
  config: MapViewConfig,
  visNamespaces: string[],
  width: number,
  height: number
): Bounds | undefined {
  return defaultViewportFitStrategy.fit({
    width,
    height,
    graph: panel.graph,
    layers,
    visibleNamespaces: new Set(visNamespaces),
    projectedPositions: panel.positions,
    options: {
      allLayers: config.allLayers,
      lastOnly: config.lastOnly,
      layer: config.layer,
    },
  })?.bounds;
}

export function getLogicFitBounds(
  panel: ViewportFitPanel,
  visNamespaces: string[],
  width: number,
  height: number
): Bounds | undefined {
  const services = getMapglFeatureServices(panel);
  const visibleNamespaces = new Set(visNamespaces);
  const context: ViewportFitContext = {
    width,
    height,
    graph: panel.graph,
    layers: panel.layers,
    visibleNamespaces,
    namespaceBoundaries: getNamespaceBoundaries(services.namespaceBoundaryProviders, {
      graph: panel.graph,
      visibleNamespaces,
      positions: panel.positions,
      layoutGraphBounds: panel.layoutGraphBounds,
      layerShift: panel.layerShift,
      padding: 0,
      includeRoot: true,
      applyLayerShift: true,
    }),
    projectedPositions: panel.positions,
    options: {
      allLayers: true,
    },
  };

  return getViewportFitBounds(services.viewportFitStrategies, context);
}

export function getViewportFitBounds(
  strategies: ViewportFitStrategy[],
  context: ViewportFitContext
): Bounds | undefined {
  for (const strategy of [...strategies].reverse()) {
    const bounds = strategy.fit(context)?.bounds;
    if (bounds) {
      return bounds;
    }
  }

  return undefined;
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
          ? getLogicFitBounds(panel, visibleNamespaces, width, height)
          : getLayerFitBounds(panel, layers, config, visibleNamespaces, width, height);

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
