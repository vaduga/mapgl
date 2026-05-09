import { GeoJsonLayer, IconLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import { DeckLine, RGBAColor } from 'mapLib/utils';
import type { Graph } from 'mapLib';
import { makeColorDarker, makeColorLighter, toRGB4Array } from '../utils';
import { getCurveSegments } from './GeoJsonEdgesLayer/edges-geojson-layer';
import { CurveEdgeLayer } from './GeoJsonEdgesLayer/curve-edge-layer';
import {
  expandArrowItems,
  getArrowAnchorPosition,
  getArrowSize,
  getFeatureArrowAngle,
} from './ArrowLayer/edge-arrow-layer';
import { getIconAtlasImage, iconMapping } from './ArrowLayer/arrow-atlas';
import type { ConnectedEdgeIndex } from './graph-highlighter';
import GradientArcLayer from './ArcLayer/gradient-arc-layer';
import AnimatedBlobsLayer from './ArcLayer/animated-blobs-layer';

type ConnectedHoverLayerOptions = {
  graph: Graph;
  graphLayers: Layer[];
  connectedNodeIds: Set<string>;
  connectedEdgeIndexes: ConnectedEdgeIndex[];
  lineFeaturesByGraph: Record<string, DeckLine[]>;
  isLogic: boolean;
  isHyper: boolean;
  isDark: boolean;
  isMeters?: boolean;
};

export function getConnectedHoverLayers(opts: ConnectedHoverLayerOptions) {
  const {
    graph,
    graphLayers,
    connectedNodeIds,
    connectedEdgeIndexes,
    lineFeaturesByGraph,
    isLogic,
    isHyper,
    isDark,
    isMeters,
  } = opts;
  const edgeFeaturesByGraph = connectedEdgeIndexes.reduce<Record<string, DeckLine[]>>(
    (acc, { graphId, lineId, arcId }) => {
      const index = isHyper ? lineId : arcId;
      const feature = index === undefined ? undefined : lineFeaturesByGraph?.[graphId]?.[index];
      if (feature) {
        (acc[graphId] ??= []).push(feature);
      }
      return acc;
    },
    {}
  );
  const connectedEdgeLayers: any[] = [];

  for (const [graphId, edgeFeatures] of Object.entries(edgeFeaturesByGraph)) {
    if (isHyper) {
      connectedEdgeLayers.push(
        getConnectedHoverEdgeLayer({
          graph,
          graphId,
          features: edgeFeatures,
          isLogic,
          isMeters,
        }),
        getConnectedHoverArrowLayer({
          graph,
          graphId,
          features: edgeFeatures,
          isLogic,
          isMeters,
        })
      );
      continue;
    }

    connectedEdgeLayers.push(
      ...getConnectedHoverArcLayers({
        graphId,
        features: edgeFeatures,
        isDark,
        isMeters,
      })
    );
  }

  return [...connectedEdgeLayers, ...getConnectedHoverNodeLayers(graphLayers, connectedNodeIds)];
}

export function getDimmedGraphLayers(layers: Layer[], connectedNodeIds: Set<string>) {
  return layers.map((layer) => {
    if (layer?.id === 'icon-cluster') {
      return layer;
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

function getConnectedHoverEdgeLayer(opts) {
  const { graph, graphId, features, layerShift, isLogic, isMeters } = opts;
  const idSuffix = graphId ? `-${graphId}` : '';

  if (isLogic) {
    const curveSegments = getCurveSegments(features, graph.getWasmId2Edges);

    return new CurveEdgeLayer({
      id: `connected-hover-edges${idSuffix}`,
      data: curveSegments,
      visible: curveSegments.length > 0,
      pickable: false,
      getWidth: (d: any) => Math.max(3, (d.feature?.properties?.edgeStyle?.size ?? 1) * 2),
      getColor: (d: any) => getEdgeColor(d.feature),
      widthUnits: isMeters ? 'meters' : 'pixels',
      widthScale: 1,
      widthMinPixels: 2,
    });
  }

  return new GeoJsonLayer({
    id: `connected-hover-edges${idSuffix}`,
    data: {
      type: 'FeatureCollection',
      features,
    },
    visible: features.length > 0,
    pickable: false,
    stroked: true,
    filled: false,
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 2,
    getLineWidth: (d: any) => Math.max(3, (d.properties?.edgeStyle?.size ?? 1) * 2),
    getLineColor: getEdgeColor,
    parameters: {
      depthTest: false,
    },
  });
}

function getConnectedHoverArcLayers(opts) {
  const { graphId, features, layerShift, isDark, isMeters } = opts;

  const widthUnits: 'meters' | 'pixels' = isMeters ? 'meters' : 'pixels';
  const idSuffix = graphId ? `-${graphId}` : '';
  const props = {
    data: features,
    visible: features.length > 0,
    pickable: false,
    getWidth: getConnectedArcWidth,
    getHeight: (d: any) => d?.properties?.arcStyle?.arcConfig?.height ?? 0.5,
    getSourcePosition: (d: any) => d.sourcePosition,
    getTargetPosition: (d: any) => d.targetPosition,
    getSourceColor: (d: any) => getArcColor(d, 'sideA'),
    getTargetColor: (d: any) => getArcColor(d, 'sideB'),
    widthUnits,
    widthScale: 1,
    widthMinPixels: 2,
  };

  return [
    new GradientArcLayer({
      ...props,
      id: `connected-hover-arcs${idSuffix}`,
    }),
    new AnimatedBlobsLayer({
      ...props,
      id: `connected-hover-arc-blobs${idSuffix}`,
      getSourceArrow: (d: any) => d.properties.arcStyle?.sideA.arrow ?? 0,
      getTargetArrow: (d: any) => d.properties.arcStyle?.sideB.arrow ?? 0,
      getSourceColor: (d: any) => getAlteredArcColor(d, 'sideA', isDark),
      getTargetColor: (d: any) => getAlteredArcColor(d, 'sideB', isDark),
      getFrequency: () => 10,
      animationSpeed: 5,
      tailLength: 0.1,
      coef: 0.8,
    }),
  ];
}

function getConnectedArcWidth(d: any): number {
  const arcStyle = d?.properties?.arcStyle;
  const size = Math.max(arcStyle?.sideA?.size ?? 1, arcStyle?.sideB?.size ?? 1);
  return size * 2.2;
}

function getConnectedHoverArrowLayer(opts) {
  const { graph, graphId, features, layerShift, isLogic, isMeters } = opts;
  const arrowData = expandArrowItems(features, graph.getWasmId2Edges);
  const sizeUnits = isLogic ? 'common' : isMeters ? 'meters' : 'pixels';
  const idSuffix = graphId ? `-${graphId}` : '';

  return new IconLayer({
    id: `connected-hover-arrows${idSuffix}`,
    data: arrowData,
    visible: arrowData.length > 0,
    pickable: false,
    billboard: false,
    getPosition: (d: any) => getArrowAnchorPosition(d.feature, d.placement) ?? [0, 0],
    getAngle: (d: any) => getFeatureArrowAngle(d.feature, d.placement, !isLogic),
    getSize: (d: any) => getArrowSize(d.feature) * 1.2,
    getColor: (d: any) => getEdgeColor(d.feature),
    iconAtlas: getIconAtlasImage() as any,
    iconMapping,
    getIcon: () => (isLogic && sizeUnits === 'pixels' ? 'triangle-n-ex' : 'triangle-n'),
    sizeUnits: sizeUnits as any,
    sizeScale: 1,
    ...(sizeUnits === 'pixels'
      ? {
          sizeMinPixels: 1,
          sizeMaxPixels: 36,
        }
      : {}),
  });
}

function getEdgeColor(feature): RGBAColor {
  const edgeStyle = feature?.properties?.edgeStyle;
  return getStyleColor(edgeStyle);
}

function getArcColor(feature, side: 'sideA' | 'sideB'): RGBAColor {
  return getStyleColor(feature?.properties?.arcStyle?.[side]);
}

function getAlteredArcColor(feature, side: 'sideA' | 'sideB', isDark: boolean): RGBAColor {
  const color = getArcColor(feature, side);
  return (isDark ? makeColorLighter(color) : makeColorDarker(color)) as RGBAColor;
}

function getStyleColor(style, opacity?: number): RGBAColor {
  const color = style?.group?.color ?? style?.color;
  return normalizeColor(color, opacity);
}

function normalizeColor(color, opacity?: number): RGBAColor {
  if (Array.isArray(color)) {
    const rgba = [...color] as RGBAColor;
    rgba[3] = 255;
    return rgba;
  }

  return toRGB4Array(color, 1);
}
