import { GeoJsonLayer, IconLayer, ScatterplotLayer } from '@deck.gl/layers';
import { DeckLine, RGBAColor } from 'mapLib/utils';
import type { Graph } from 'mapLib';
import { toRGB4Array } from '../utils';
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

type ConnectedHoverLayerOptions = {
  graph: Graph;
  positions: Float64Array;
  connectedNodeIds: Set<string>;
  connectedEdgeIndexes: ConnectedEdgeIndex[];
  lineFeaturesByGraph: Record<string, DeckLine[]>;
  isLogic: boolean;
  isMeters?: boolean;
};

export function getConnectedHoverLayers(opts: ConnectedHoverLayerOptions) {
  const { graph, positions, connectedNodeIds, connectedEdgeIndexes, lineFeaturesByGraph, isLogic, isMeters } = opts;
  const edgeFeatures = connectedEdgeIndexes
    .map(({ graphId, lineId }) => lineFeaturesByGraph?.[graphId]?.[lineId])
    .filter(Boolean) as DeckLine[];

  return [
    getConnectedHoverEdgeLayer({
      graph,
      features: edgeFeatures,
      isLogic,
      isMeters,
    }),
    getConnectedHoverArrowLayer({
      graph,
      features: edgeFeatures,
      isLogic,
      isMeters,
    }),
    getConnectedHoverNodeLayer({
      graph,
      positions,
      connectedNodeIds,
      isLogic,
    }),
  ];
}

function getConnectedHoverNodeLayer(opts) {
  const { graph, positions, connectedNodeIds, isLogic } = opts;
  const data = Array.from(connectedNodeIds)
    .map((nodeId) => {
      const node = graph.findNodeRecursive(nodeId);
      const wasmId = node?.data?.wasmId;
      if (wasmId === undefined) {
        return null;
      }

      const x = positions[wasmId * 2];
      const y = positions[wasmId * 2 + 1];
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null;
      }

      const size = node?.data?.feature?.style?.size ?? 10;
      const style = node?.data?.feature?.style;
      return {
        nodeId,
        position: [x, y],
        radius: (size / 2) * 1.2,
        color: getStyleColor(style),
      };
    })
    .filter(Boolean);

  return new ScatterplotLayer({
    id: 'connected-hover-nodes',
    data,
    visible: data.length > 0,
    pickable: false,
    stroked: true,
    filled: false,
    radiusUnits: isLogic ? 'common' : 'pixels',
    lineWidthUnits: 'pixels',
    lineWidthMinPixels: 1,
    getPosition: (d: any) => d.position,
    getRadius: (d: any) => d.radius,
    getLineWidth: 8,
    getLineColor: (d: any) => d.color,
    parameters: {
      depthTest: false,
    },
  });
}

function getConnectedHoverEdgeLayer(opts) {
  const { graph, features, isLogic, isMeters } = opts;

  if (isLogic) {
    const curveSegments = getCurveSegments(features, graph.getWasmId2Edges);

    return new CurveEdgeLayer({
      id: 'connected-hover-edges',
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
    id: 'connected-hover-edges',
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

function getConnectedHoverArrowLayer(opts) {
  const { graph, features, isLogic, isMeters } = opts;
  const arrowData = expandArrowItems(features, graph.getWasmId2Edges);
  const sizeUnits = isLogic ? 'common' : isMeters ? 'meters' : 'pixels';

  return new IconLayer({
    id: 'connected-hover-arrows',
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
