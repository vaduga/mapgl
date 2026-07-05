import type { MapViewConfig, MapLayerState } from '../types';
import type { Graph } from '../graph/main';
import type { handlerProps } from '../components/Selects/ReactSelectSearch';
import {
  defaultViewportFitStrategy,
  getMapglFeatureServices,
  getNamespaceBoundaries,
  type ViewportFitContext,
  type ViewportFitStrategy,
} from '../extension-points/featureContracts';
import { SelectNodeEvent } from './bus.events';

export type Bounds = [number, number, number, number];

type ViewportFitPanel = {
  graph: Graph;
  positions: Float64Array;
  layers?: unknown[];
  layoutGraphBounds?: Map<string, unknown>;
  layerShift?: Record<string, [number, number]>;
};

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
    panel,
  })?.bounds;
}

export function getLogicFitBounds(
  panel: ViewportFitPanel,
  visNamespaces: string[],
  width: number,
  height: number
): Bounds | undefined {
  const services = getMapglFeatureServices();
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
      panel,
      padding: 0,
      includeRoot: true,
    }),
    projectedPositions: panel.positions,
    options: {
      allLayers: true,
    },
    panel,
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
