import { GeoJsonLayer, IconLayer, TextLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { RGBAColor } from '@mapgl/panel-core/types';
import { toRGB4Array } from './utils/color';
import AnimatedBlobsLayer from './ArcLayer/animated-blobs-layer';
import GradientArcLayer from './ArcLayer/gradient-arc-layer';
import { getArrowColor } from './ArrowLayer/edge-arrow-layer';
import { CurveEdgeLayer } from './GeoJsonEdgesLayer/curve-edge-layer';
import { makeScopedKey, type ConnectedEdgeIndex } from './graphHighlighter';
import { EDGE_LABEL_DIM_OPACITY } from './TextLayer/text-layer';

const ICON_CACHE_SOURCE_KEY = '__mapglIconCacheSource';

type DimmedGraphLayerOptions = {
  connectedNodeIds: Set<string>;
  connectedEdgeIndexes?: ConnectedEdgeIndex[];
  isRouted?: boolean;
};

const widthMultiplier = 1.3;

export function getDimmedGraphLayers(layers: Layer[], opts: DimmedGraphLayerOptions | Set<string>) {
  const connectedNodeIds = opts instanceof Set ? opts : opts.connectedNodeIds;
  const edgeDepthsByGraph =
    opts instanceof Set ? {} : getEdgeDepthsByGraph(opts.connectedEdgeIndexes ?? [], Boolean(opts.isRouted));

  return flattenDeckLayers(layers).map((layer) => {
    if ((layer?.id ?? '').startsWith('icon-cluster')) {
      return layer.clone({ opacity: 0.18 });
    }

    const dimmedEdgeLayer = getDimmedEdgeLayer(layer, edgeDepthsByGraph);
    if (dimmedEdgeLayer) {
      return dimmedEdgeLayer;
    }

    const dimmedNodeTextLayer = getDimmedNodeTextLayer(layer, connectedNodeIds);
    if (dimmedNodeTextLayer) {
      return dimmedNodeTextLayer;
    }

    const data = layer?.props?.data as any;
    if (data?.points) {
      return layer.clone({
        data: getDimmedNodeBiCol(data, connectedNodeIds),
      });
    }
    return layer.clone({ opacity: 0.18 });
  });
}

function flattenDeckLayers(layers: unknown[]): Layer[] {
  return layers.flatMap((layer) => {
    if (Array.isArray(layer)) {
      return flattenDeckLayers(layer);
    }

    return isCloneableLayer(layer) ? [layer] : [];
  });
}

function isCloneableLayer(layer: unknown): layer is Layer {
  return typeof (layer as Layer | undefined)?.clone === 'function';
}

function getEdgeDepthsByGraph(connectedEdgeIndexes: ConnectedEdgeIndex[], isRouted: boolean) {
  return connectedEdgeIndexes.reduce<Record<string, Map<number, number>>>((acc, { graphId, lineId, arcId, depth }) => {
    const index = isRouted ? lineId : arcId;
    if (index === undefined) {
      return acc;
    }

    const depths = (acc[graphId] ??= new Map<number, number>());
    const nextDepth = depth ?? 0;
    const prevDepth = depths.get(index);
    if (prevDepth === undefined || nextDepth < prevDepth) {
      depths.set(index, nextDepth);
    }
    return acc;
  }, {});
}

function getDimmedEdgeLayer(layer: Layer, edgeDepthsByGraph: Record<string, Map<number, number>>) {
  const graphId = getGraphIdFromEdgeLayer(layer);
  if (graphId === undefined) {
    return null;
  }

  const connectedFeatureDepths = edgeDepthsByGraph[graphId];
  if (!connectedFeatureDepths?.size) {
    if (isEdgeTextLayer(layer)) {
      return layer.clone({ opacity: EDGE_LABEL_DIM_OPACITY });
    }
    return layer.clone({ opacity: 0.18 });
  }

  const highlightDepthTrigger = Array.from(connectedFeatureDepths.entries());
  if ((layer as any) instanceof CurveEdgeLayer) {
    const curveLayer = layer as any;
    return curveLayer.clone({
      highlightOnly: false,
      highlightMaxDepth: getMaxMapValue(connectedFeatureDepths),
      highlightDimOpacity: 0.18,
      skipVisibleMaxDepth: getMaxMapValue(connectedFeatureDepths),
      getHighlightDepth: (d: any) =>
        d.feature?.renderGeometryOnly
          ? Number.MAX_SAFE_INTEGER
          : (connectedFeatureDepths.get(d.featureIndex) ?? Number.MAX_SAFE_INTEGER),
      getWidth: (d: any, info: any) => {
        const width = getAccessorValue(curveLayer.props.getWidth, d, info, 1);
        return !d.feature?.renderGeometryOnly && connectedFeatureDepths.has(d.featureIndex)
          ? Math.max(3, width * widthMultiplier)
          : width;
      },
      updateTriggers: {
        ...layer.props.updateTriggers,
        getHighlightDepth: highlightDepthTrigger,
        getWidth: [curveLayer.props.updateTriggers?.getWidth, highlightDepthTrigger],
      },
    });
  }

  if (isStraightEdgeGeometryLayer(layer)) {
    const geoJsonLayer = layer as any;
    return layer.clone({
      getLineWidth: (d: any, info: any) => {
        const isConnected = isConnectedLineFeature(connectedFeatureDepths, d);
        const width = getAccessorValue(
          geoJsonLayer.props.getLineWidth,
          isConnected ? getRenderableLineFeature(d) : d,
          info,
          1
        );
        return isConnected ? Math.max(3, width * widthMultiplier) : width;
      },
      getLineColor: (d: any, info: any) => {
        const isConnected = isConnectedLineFeature(connectedFeatureDepths, d);
        const color = getAccessorResult(
          geoJsonLayer.props.getLineColor,
          isConnected ? getRenderableLineFeature(d) : d,
          info,
          [0, 0, 0, 255]
        );
        return isConnected ? color : getDimmedRgba(color, 0.18);
      },
      updateTriggers: {
        ...layer.props.updateTriggers,
        getLineWidth: [geoJsonLayer.props.updateTriggers?.getLineWidth, highlightDepthTrigger],
        getLineColor: [geoJsonLayer.props.updateTriggers?.getLineColor, highlightDepthTrigger],
      },
    } as any);
  }

  if ((layer as any) instanceof AnimatedBlobsLayer) {
    const blobLayer = layer as any;
    return blobLayer.clone({
      getHighlightDepth: (_d: any, info: any) =>
        connectedFeatureDepths.has(info.index) ? 0 : 1,
      getHighlightDimOpacity: 0.18,
      getWidth: (d: any, info: any) => {
        const width = getAccessorValue(blobLayer.props.getWidth, d, info, 1);
        return connectedFeatureDepths.has(info.index) ? Math.max(3, width * widthMultiplier) : width;
      },
      updateTriggers: {
        ...layer.props.updateTriggers,
        getHighlightDepth: highlightDepthTrigger,
        getHighlightDimOpacity: highlightDepthTrigger,
        getWidth: [blobLayer.props.updateTriggers?.getWidth, highlightDepthTrigger],
      },
    } as any);
  }

  if (isArcLayer(layer)) {
    const arcLayer = layer as any;
    return layer.clone({
      getHighlightDepth: (_d: any, info: any) =>
        connectedFeatureDepths.has(info.index) ? 0 : 1,
      getHighlightDimOpacity: 0.18,
      getWidth: (d: any, info: any) => {
        const width = getAccessorValue(arcLayer.props.getWidth, d, info, 1);
        return connectedFeatureDepths.has(info.index) ? Math.max(3, width * widthMultiplier) : width;
      },
      updateTriggers: {
        ...layer.props.updateTriggers,
        getHighlightDepth: highlightDepthTrigger,
        getHighlightDimOpacity: highlightDepthTrigger,
        getWidth: [arcLayer.props.updateTriggers?.getWidth, highlightDepthTrigger],
      },
    } as any);
  }

  if (isEdgeTextLayer(layer)) {
    const textLayer = layer as any;
    return layer.clone({
      opacity: 1,
      getText: (d: any, info: any) => {
        if (d?.skip) {
          return connectedFeatureDepths.has(info.index) ? (d.properties?.edgeStyle?.text ?? '') : '';
        }
        return getAccessorResult(textLayer.props.getText, d, info, '');
      },
      getColor: (d: any, info: any) => {
        const color = getAccessorResult(textLayer.props.getColor, d, info, [0, 0, 0, 200]);
        return connectedFeatureDepths.has(info.index) ? color : getDimmedRgba(color, EDGE_LABEL_DIM_OPACITY);
      },
      getBackgroundColor: (d: any, info: any) => {
        const color = getAccessorResult(textLayer.props.getBackgroundColor, d, info, [255, 255, 255, 100]);
        return connectedFeatureDepths.has(info.index) ? color : getDimmedRgba(color, EDGE_LABEL_DIM_OPACITY);
      },
      updateTriggers: {
        ...layer.props.updateTriggers,
        getText: highlightDepthTrigger,
        getColor: [textLayer.props.updateTriggers?.getColor, highlightDepthTrigger],
        getBackgroundColor: [textLayer.props.updateTriggers?.getBackgroundColor, highlightDepthTrigger],
      },
    } as any);
  }

  if (isArrowLayer(layer)) {
    const arrowLayer = layer as any;
    return layer.clone({
      getColor: (d: any, info: any) => {
        if (connectedFeatureDepths.has(d.lineIndex)) {
          return d.feature?.skip ? getArrowColor(d.feature) : getAccessorResult(arrowLayer.props.getColor, d, info, [0, 0, 0, 255]);
        }

        if (d.feature?.skip) {
          return [0, 0, 0, 0];
        }

        const color = getAccessorResult(arrowLayer.props.getColor, d, info, [0, 0, 0, 255]);
        return getDimmedRgba(color, 0.18);
      },
      updateTriggers: {
        ...layer.props.updateTriggers,
        getColor: [arrowLayer.props.updateTriggers?.getColor, highlightDepthTrigger],
      },
    } as any);
  }

  return null;
}

function getGraphIdFromEdgeLayer(layer: Layer): string | undefined {
  const id = layer?.id ?? '';
  if (id.startsWith('edges-view')) {
    const graphId = id.slice('edges-view'.length);
    return graphId.endsWith('-geometry') ? graphId.slice(0, -'-geometry'.length) : graphId;
  }
  if (id.startsWith('edges-arc-base')) {
    return id.slice('edges-arc-base'.length);
  }
  if (id.startsWith('edges-arc-blobs')) {
    return id.slice('edges-arc-blobs'.length);
  }
  if (id.startsWith('edges-arrow-')) {
    return id.slice('edges-arrow-'.length);
  }
  if (id.startsWith('text-arcLabels')) {
    return id.slice('text-arcLabels'.length);
  }
  return undefined;
}

function isArcLayer(layer: Layer): boolean {
  return layer instanceof GradientArcLayer || layer instanceof AnimatedBlobsLayer;
}

function isArrowLayer(layer: Layer): boolean {
  return layer instanceof IconLayer && (layer?.id ?? '').startsWith('edges-arrow-');
}

function isStraightEdgeGeometryLayer(layer: Layer): boolean {
  const id = layer?.id ?? '';
  return layer instanceof GeoJsonLayer && id.startsWith('edges-view') && id.endsWith('-geometry');
}

function isConnectedLineFeature(connectedFeatureDepths: Map<number, number>, d: any): boolean {
  const lineId = getLineFeatureId(d);
  return lineId !== undefined && connectedFeatureDepths.has(lineId);
}

function getLineFeatureId(d: any): number | undefined {
  const sourceObject = d?.__source?.object;
  const sourceLineId = sourceObject?.lineId;
  if (typeof sourceLineId === 'number') {
    return sourceLineId;
  }

  const lineId = d?.lineId;
  return typeof lineId === 'number' ? lineId : undefined;
}

function getRenderableLineFeature(d: any): any {
  const sourceObject = d?.__source?.object;
  if (sourceObject?.skip && sourceObject.renderGeometryOnly) {
    return {
      ...d,
      __source: {
        ...d.__source,
        object: { ...sourceObject, skip: false },
      },
    };
  }

  return d?.skip && d.renderGeometryOnly ? { ...d, skip: false } : d;
}

function isEdgeTextLayer(layer: Layer): boolean {
  return layer instanceof TextLayer && (layer?.id ?? '').startsWith('text-arcLabels');
}

function getAccessorResult(accessor: any, object: any, info: any, fallback: any) {
  const value = typeof accessor === 'function' ? accessor(object, info) : accessor;
  return value ?? fallback;
}

function getDimmedRgba(color: any, opacity: number): RGBAColor {
  const rgba = Array.isArray(color) ? ([...color] as RGBAColor) : toRGB4Array(color, 1);
  rgba[3] = Math.round((rgba[3] ?? 255) * opacity);
  return rgba;
}

function getDimmedNodeTextLayer(layer: Layer, connectedNodeIds: Set<string>) {
  if (!isNodeTextLayer(layer)) {
    return null;
  }

  const data = layer.props.data as any;
  if (!Array.isArray(data)) {
    return null;
  }

  const textLayer = layer as any;
  const textData = data as any[] & { attributes?: Record<string, any> };
  const getColorAttribute = textData.attributes?.getColor;
  let nextData = textData;

  if (getColorAttribute?.value) {
    nextData = [...textData] as any[] & { attributes?: Record<string, any> };
    nextData.attributes = {
      ...textData.attributes,
      getColor: {
        ...getColorAttribute,
        value: getDimmedTextColorArray(getColorAttribute.value, textData, connectedNodeIds),
      },
    };
  }

  return layer.clone({
    data: nextData,
    getColor: (d: any, info: any) => {
      const color = getAccessorResult(textLayer.props.getColor, d, info, [0, 0, 0, 200]);
      return isConnectedNode(d?.properties, connectedNodeIds) ? color : getDimmedRgba(color, 0.18);
    },
    updateTriggers: {
      ...layer.props.updateTriggers,
      getColor: [textLayer.props.updateTriggers?.getColor, Array.from(connectedNodeIds)],
    },
  } as any);
}

function isNodeTextLayer(layer: Layer): boolean {
  const id = layer?.id ?? '';
  return id.includes('-view-placeholder-text') || id.includes('-view-label-text');
}

function getDimmedTextColorArray(colors, data: any[], connectedNodeIds: Set<string>) {
  const nextColors = new colors.constructor(colors.length);
  nextColors.set(colors);

  data.forEach((d, index) => {
    if (!isConnectedNode(d?.properties, connectedNodeIds)) {
      const alphaIndex = index * 4 + 3;
      nextColors[alphaIndex] = Math.round((nextColors[alphaIndex] ?? 255) * 0.18);
    }
  });
  return nextColors;
}

function getAccessorValue(accessor: any, object: any, info: any, fallback: number): number {
  const value = typeof accessor === 'function' ? accessor(object, info) : accessor;
  return Number.isFinite(value) ? value : fallback;
}

function getDimmedNodeBiCol(data, connectedNodeIds: Set<string>) {
  const points = data.points;
  const featureIds = points?.featureIds?.value;
  const properties = points?.properties;
  const attributes = points?.attributes;
  const fillColors = attributes?.getFillColor?.value;
  const textColors = attributes?.getColor?.value;

  if (!featureIds?.length || !properties) {
    return data;
  }

  return {
    ...data,
    [ICON_CACHE_SOURCE_KEY]: data[ICON_CACHE_SOURCE_KEY] ?? data,
    points: {
      ...points,
      attributes: {
        ...attributes,
        ...(fillColors
          ? {
              getFillColor: {
                ...attributes.getFillColor,
                value: getDimmedColorArray(fillColors, featureIds, properties, connectedNodeIds),
              },
            }
          : {}),
        ...(textColors
          ? {
              getColor: {
                ...attributes.getColor,
                value: getDimmedColorArray(textColors, featureIds, properties, connectedNodeIds),
              },
            }
          : {}),
      },
    },
  };
}

function getDimmedColorArray(colors, featureIds, properties, connectedNodeIds: Set<string>) {
  const nextColors = new colors.constructor(colors.length);
  nextColors.set(colors);

  for (let i = 0; i < featureIds.length; i++) {
    if (isConnectedNode(properties[featureIds[i]], connectedNodeIds)) {
      continue;
    }

    const alphaIndex = i * 4 + 3;
    nextColors[alphaIndex] = Math.round((nextColors[alphaIndex] ?? 255) * 0.18);
  }

  return nextColors;
}

function isConnectedNode(props: any, connectedNodeIds: Set<string>): boolean {
  const locName = props?.locName;
  if (!locName) {
    return false;
  }

  const graphId = props?.graph?.id;
  return connectedNodeIds.has(graphId ? makeScopedKey(String(graphId), locName) : locName);
}

function getMaxMapValue(map: Map<number, number>): number {
  let max = 0;
  for (const value of map.values()) {
    max = Math.max(max, value);
  }
  return max;
}
