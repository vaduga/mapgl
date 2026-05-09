import { IconLayer, TextLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import { RGBAColor } from 'mapLib/utils';
import { toRGB4Array } from '../utils';
import { CurveEdgeLayer } from './GeoJsonEdgesLayer/curve-edge-layer';
import { getArrowColor } from './ArrowLayer/edge-arrow-layer';
import type { ConnectedEdgeIndex } from './graph-highlighter';
import GradientArcLayer from './ArcLayer/gradient-arc-layer';
import AnimatedBlobsLayer from './ArcLayer/animated-blobs-layer';

type ConnectedHoverLayerOptions = {
  graphLayers: Layer[];
  connectedNodeIds: Set<string>;
};

export function getConnectedHoverLayers(opts: ConnectedHoverLayerOptions) {
  const { graphLayers, connectedNodeIds } = opts;
  return getConnectedHoverNodeLayers(graphLayers, connectedNodeIds);
}

type DimmedGraphLayerOptions = {
  connectedNodeIds: Set<string>;
  connectedEdgeIndexes?: ConnectedEdgeIndex[];
  isHyper?: boolean;
};

export function getDimmedGraphLayers(layers: Layer[], opts: DimmedGraphLayerOptions | Set<string>) {
  const connectedNodeIds = opts instanceof Set ? opts : opts.connectedNodeIds;
  const edgeDepthsByGraph =
    opts instanceof Set ? {} : getEdgeDepthsByGraph(opts.connectedEdgeIndexes ?? [], Boolean(opts.isHyper));

  return layers.map((layer) => {
    if (layer?.id === 'icon-cluster') {
      return layer;
    }

    const dimmedEdgeLayer = getDimmedEdgeLayer(layer, edgeDepthsByGraph);
    if (dimmedEdgeLayer) {
      return dimmedEdgeLayer;
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

function getEdgeDepthsByGraph(connectedEdgeIndexes: ConnectedEdgeIndex[], isHyper: boolean) {
  return connectedEdgeIndexes.reduce<Record<string, Map<number, number>>>((acc, { graphId, lineId, arcId, depth }) => {
    const index = isHyper ? lineId : arcId;
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
    return layer.clone({ opacity: 0.18 });
  }

  const highlightDepthTrigger = Array.from(connectedFeatureDepths.entries());
  if (layer instanceof CurveEdgeLayer) {
    const curveLayer = layer as any;
    return layer.clone({
      highlightOnly: false,
      highlightMaxDepth: getMaxMapValue(connectedFeatureDepths),
      highlightDimOpacity: 0.18,
      skipVisibleMaxDepth: getMaxMapValue(connectedFeatureDepths),
      getHighlightDepth: (d: any) => connectedFeatureDepths.get(d.featureIndex) ?? Number.MAX_SAFE_INTEGER,
      getWidth: (d: any, info: any) => {
        const width = getAccessorValue(curveLayer.props.getWidth, d, info, 1);
        return connectedFeatureDepths.has(d.featureIndex) ? Math.max(3, width * 2) : width;
      },
      updateTriggers: {
        ...layer.props.updateTriggers,
        getHighlightDepth: highlightDepthTrigger,
        getWidth: [curveLayer.props.updateTriggers?.getWidth, highlightDepthTrigger],
      },
    });
  }

  if (isArcLayer(layer)) {
    const arcLayer = layer as any;
    return layer.clone({
      getHighlightDepth: (_d: any, info: any) =>
        connectedFeatureDepths.has(info.index) ? 0 : Number.MAX_SAFE_INTEGER,
      getHighlightDimOpacity: 0.18,
      getWidth: (d: any, info: any) => {
        const width = getAccessorValue(arcLayer.props.getWidth, d, info, 1);
        return connectedFeatureDepths.has(info.index) ? Math.max(3, width * 2.2) : width;
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
      getText: (d: any, info: any) => {
        if (d?.skip) {
          return connectedFeatureDepths.has(info.index) ? (d.properties?.edgeStyle?.text ?? '') : '';
        }
        return getAccessorResult(textLayer.props.getText, d, info, '');
      },
      getColor: (d: any, info: any) => {
        const color = getAccessorResult(textLayer.props.getColor, d, info, [0, 0, 0, 200]);
        return connectedFeatureDepths.has(info.index) ? color : getDimmedRgba(color, 0.18);
      },
      getBackgroundColor: (d: any, info: any) => {
        const color = getAccessorResult(textLayer.props.getBackgroundColor, d, info, [255, 255, 255, 100]);
        return connectedFeatureDepths.has(info.index) ? color : getDimmedRgba(color, 0.18);
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
    return id.slice('edges-view'.length);
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

function getConnectedHoverNodeLayers(layers: Layer[], connectedNodeIds: Set<string>) {

  return layers
    .map((layer) => {
      const data = layer?.props?.data as any;
      if (!data?.points) {
        return getConnectedNodeTextLayer(layer, connectedNodeIds);
      }

      const connectedData = getConnectedNodeBiCol(data, connectedNodeIds);
      if (!connectedData) {
        return null;
      }

      return layer.clone({
        id: `${layer.id}-connected-hover`,
        data: connectedData,
        opacity: 1,
        pickable: false,
        autoHighlight: false,
      });
    })
    .filter(Boolean);
}

function getConnectedNodeTextLayer(layer: Layer, connectedNodeIds: Set<string>) {
  if (!isNodeTextLayer(layer)) {
    return null;
  }

  const data = layer.props.data as any;
  if (!Array.isArray(data)) {
    return null;
  }

  const textData = data as any[] & { attributes?: Record<string, any> };
  const connectedData = textData.filter((d) => connectedNodeIds.has(d?.properties?.locName)) as any[] & {
    attributes?: Record<string, any>;
  };
  if (!connectedData.length) {
    return null;
  }

  const getColor = textData.attributes?.getColor;
  if (getColor?.value) {
    connectedData.attributes = {
      ...textData.attributes,
      getColor: {
        ...getColor,
        value: getFilteredTextColorArray(getColor.value, connectedData),
      },
    };
  } else if (textData.attributes) {
    connectedData.attributes = textData.attributes;
  }

  return layer.clone({
    id: `${layer.id}-connected-hover`,
    data: connectedData,
    opacity: 1,
    pickable: false,
    autoHighlight: false,
  });
}

function isNodeTextLayer(layer: Layer): boolean {
  const id = layer?.id ?? '';
  return id.includes('-view-placeholder-text') || id.includes('-view-label-text');
}

function getFilteredTextColorArray(colors, data: any[]) {
  const nextColors = new colors.constructor(data.length * 4);
  data.forEach((d, index) => {
    const sourceIndex = d?.pointIndex;
    if (sourceIndex === undefined) {
      return;
    }
    nextColors.set(colors.subarray(sourceIndex * 4, sourceIndex * 4 + 4), index * 4);
  });
  return nextColors;
}

function getConnectedNodeBiCol(data, connectedNodeIds: Set<string>) {
  return getFilteredNodeBiCol(data, (locName) => connectedNodeIds.has(locName));
}

function getFilteredNodeBiCol(data, predicate: (locName: string) => boolean) {
  const points = data?.points;
  const featureIds = points?.featureIds?.value;
  const positions = points?.positions?.value;
  const properties = points?.properties;
  const attributes = points?.attributes;
  const fillColors = attributes?.getFillColor?.value;
  const textColors = attributes?.getColor?.value;

  if (!featureIds?.length || !positions || !properties) {
    return null;
  }

  const selectedIndexes: number[] = [];
  for (let i = 0; i < featureIds.length; i++) {
    const locName = properties[featureIds[i]]?.locName;
    if (predicate(locName)) {
      selectedIndexes.push(i);
    }
  }

  if (!selectedIndexes.length) {
    return null;
  }

  const PositionArray = positions.constructor as any;
  const FeatureIdArray = featureIds.constructor as any;
  const FillColorArray = fillColors?.constructor as any;
  const TextColorArray = textColors?.constructor as any;

  const nextPositions = new PositionArray(selectedIndexes.length * 2);
  const nextFeatureIds = new FeatureIdArray(selectedIndexes.length);
  const nextGlobalFeatureIds = new Uint32Array(selectedIndexes.length);
  const nextFillColors = fillColors ? new FillColorArray(selectedIndexes.length * 4) : undefined;
  const nextTextColors = textColors ? new TextColorArray(selectedIndexes.length * 4) : undefined;

  selectedIndexes.forEach((sourceIndex, targetIndex) => {
    nextPositions.set(positions.subarray(sourceIndex * 2, sourceIndex * 2 + 2), targetIndex * 2);
    nextFeatureIds[targetIndex] = featureIds[sourceIndex];
    nextGlobalFeatureIds[targetIndex] = targetIndex;

    if (nextFillColors && fillColors) {
      nextFillColors.set(fillColors.subarray(sourceIndex * 4, sourceIndex * 4 + 4), targetIndex * 4);
    }
    if (nextTextColors && textColors) {
      nextTextColors.set(textColors.subarray(sourceIndex * 4, sourceIndex * 4 + 4), targetIndex * 4);
    }
  });

  return {
    ...data,
    points: {
      ...points,
      positions: {
        ...points.positions,
        value: nextPositions,
      },
      attributes: {
        ...attributes,
        ...(nextFillColors
          ? {
              getFillColor: {
                ...attributes.getFillColor,
                value: nextFillColors,
              },
            }
          : {}),
        ...(nextTextColors
          ? {
              getColor: {
                ...attributes.getColor,
                value: nextTextColors,
              },
            }
          : {}),
      },
      featureIds: {
        ...points.featureIds,
        value: nextFeatureIds,
      },
      globalFeatureIds: {
        ...points.globalFeatureIds,
        value: nextGlobalFeatureIds,
      },
    },
  };
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
    const locName = properties[featureIds[i]]?.locName;
    if (connectedNodeIds.has(locName)) {
      continue;
    }

    const alphaIndex = i * 4 + 3;
    nextColors[alphaIndex] = Math.round((nextColors[alphaIndex] ?? 255) * 0.18);
  }

  return nextColors;
}

function getAccessorValue(accessor: any, object: any, info: any, fallback: number): number {
  const value = typeof accessor === 'function' ? accessor(object, info) : accessor;
  return Number.isFinite(value) ? value : fallback;
}

function getMaxMapValue(map: Map<number, number>): number {
  let max = 0;
  for (const value of map.values()) {
    max = Math.max(max, value);
  }
  return max;
}
