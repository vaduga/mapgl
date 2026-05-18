import { toRGB4Array } from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers';
import type { Color } from '@deck.gl/core';
import { Feature, Geometry, Position } from 'geojson';
import { type DeckLine, colTypes, PointFeatureProperties, RGBAColor, ALERTING_STATES } from 'mapLib/utils';
import { DataFilterExtension } from '@deck.gl/extensions';
import { BezierSeg, Curve, Ellipse, GeomEdge, LineSegment, Polyline } from '@msagl/core';
import { CurveEdgeLayer, CurveEdgeSegment, CurveType } from './curve-edge-layer';

const MAX_CURVE_RESOLUTION = 64;
const MIN_CURVE_RESOLUTION = 12;

function pointToArray(point): [number, number] {
  return [point.x, point.y];
}

function curveResolution(curve): number {
  if (curve instanceof LineSegment) {
    return 1;
  }

  const length = typeof curve.length === 'number' && Number.isFinite(curve.length) ? curve.length : 0;
  return Math.max(MIN_CURVE_RESOLUTION, Math.min(MAX_CURVE_RESOLUTION, Math.ceil(length / 20)));
}

function pushSegment(
  segments: Array<CurveEdgeSegment<DeckLine>>,
  feature: DeckLine,
  featureIndex: number,
  type: CurveType,
  controlPoints: number[],
  resolution: number,
  range: [number, number] = [0, 1]
) {
  const res = Math.max(1, Math.ceil(resolution));
  const step = (range[1] - range[0]) / res;

  for (let i = 0; i < res; i++) {
    segments.push({
      feature,
      featureIndex,
      pickingIndex: feature.heIdx ?? featureIndex,
      type,
      controlPoints,
      segment: [range[0] + step * i, step],
    });
  }
}

function normalizeLineCoordinates(geometry?: Geometry | null): Position[][] {
  if (!geometry) {
    return [];
  }

  if (geometry.type === 'LineString') {
    return [geometry.coordinates];
  }

  if (geometry.type === 'MultiLineString') {
    return geometry.coordinates;
  }

  return [];
}

function addCoordinateSegments(
  segments: Array<CurveEdgeSegment<DeckLine>>,
  feature: DeckLine,
  featureIndex: number,
  coordinates: Position[][]
) {
  for (const line of coordinates ?? []) {
    for (let i = 0; i < line.length - 1; i++) {
      const start = line[i];
      const end = line[i + 1];

      pushSegment(
        segments,
        feature,
        featureIndex,
        CurveType.Line,
        [start[0], start[1], end[0], end[1], 0, 0, 0, 0],
        1
      );
    }
  }
}

function addCurveSegments(segments: Array<CurveEdgeSegment<DeckLine>>, feature: DeckLine, featureIndex: number, curve) {
  if (!curve) {
    return;
  }

  if (curve instanceof Curve) {
    for (const seg of curve.segs) {
      addCurveSegments(segments, feature, featureIndex, seg);
    }
    return;
  }

  if (curve instanceof LineSegment) {
    pushSegment(
      segments,
      feature,
      featureIndex,
      CurveType.Line,
      [...pointToArray(curve.start), ...pointToArray(curve.end), 0, 0, 0, 0],
      1
    );
    return;
  }

  if (curve instanceof BezierSeg) {
    const controlPoints = [0, 1, 2, 3].flatMap((i) => pointToArray(curve.B(i)));
    pushSegment(segments, feature, featureIndex, CurveType.Bezier, controlPoints, curveResolution(curve));
    return;
  }

  if (curve instanceof Ellipse) {
    pushSegment(
      segments,
      feature,
      featureIndex,
      CurveType.Arc,
      [...pointToArray(curve.center), ...pointToArray(curve.aAxis), ...pointToArray(curve.bAxis), 0, 0],
      curveResolution(curve),
      [curve.parStart, curve.parEnd]
    );
    return;
  }

  if (curve instanceof Polyline) {
    addCoordinateSegments(segments, feature, featureIndex, [Array.from(curve).map(pointToArray)]);
  }
}

function getFeatureGeomEdges(feature: DeckLine, getWasmId2Edges) {
  const edges = getWasmId2Edges?.[feature.heIdx] ?? [];
  if (feature.geometry?.type === 'LineString' && Number.isInteger(feature.fragIdx)) {
    const edge = edges[feature.fragIdx];
    return edge ? [edge] : [];
  }

  return edges;
}

export function getCurveSegments(features: DeckLine[], getWasmId2Edges): Array<CurveEdgeSegment<DeckLine>> {
  const segments: Array<CurveEdgeSegment<DeckLine>> = [];

  features.forEach((feature, featureIndex) => {
    const before = segments.length;

    if (feature.renderGeometryOnly) {
      addCoordinateSegments(segments, feature, featureIndex, normalizeLineCoordinates(feature.geometry));
      return;
    }

    for (const edge of getFeatureGeomEdges(feature, getWasmId2Edges)) {
      addCurveSegments(segments, feature, featureIndex, GeomEdge.getGeom(edge)?.curve);
    }

    if (segments.length === before) {
      addCoordinateSegments(segments, feature, featureIndex, normalizeLineCoordinates(feature.geometry));
    }
  });

  return segments;
}

export const EdgesGeojsonLayer = (props) => {
  const {
    srcGraphId,
    linesCollection,
    getSelectedIdxs,
    onHover,
    pickable,
    autoHighlight,
    highlightColor,
    time,
    options,
    visible,
    getVisLayers,
    getGroupsLegend,
    panel,
    getWasmId2Edges,
  } = props;

  const isLogic = panel.isLogic;
  const selectedFeatureIndexes = getSelectedIdxs?.get(colTypes.Edges)?.[srcGraphId] ?? [];
  const cats = getVisLayers.getCategories();
  const categories = cats.concat([cats[1]]);
  const categorySize = 3;
  const lineFeatures = linesCollection?.features ?? [];
  const curveSegments = isLogic ? getCurveSegments(lineFeatures, getWasmId2Edges) : [];

  const getLineWidth = (d) => {
    const feature = d.feature ?? d;
    const { edgeStyle } = feature.properties;
    const isSelected = selectedFeatureIndexes.includes(feature.rowIndex);
    return edgeStyle.size * (isSelected ? 2 : 1);
  };

  const getLineColor = (
    d: CurveEdgeSegment<DeckLine> | DeckLine | Feature<Geometry, PointFeatureProperties>
  ): Color => {
    const feature = 'feature' in d ? d.feature : d;
    const { edgeStyle, all_annots } = feature.properties as any;
    const { color, group, opacity } = edgeStyle;

    if (all_annots && !getGroupsLegend?.at(-1)?.disabled) {
      const annotState = all_annots?.[0]?.newState;
      const color = annotState?.startsWith('Normal')
        ? ALERTING_STATES.Normal
        : annotState === 'Alerting'
          ? ALERTING_STATES.Alerting
          : ALERTING_STATES.Pending;
      return toRGB4Array(color, 1) as [number, number, number];
    }

    // group is defined only if nodes/edge metric field match
    const c = group?.color ?? color;
    const muted = [...c] as RGBAColor;
    muted[3] = opacity !== undefined ? Math.round(opacity * 255) : muted[3];
    return muted as [number, number, number];
  };

  const units = options.common?.isMeters ? 'meters' : 'pixels';
  const commonLayerProps = {
    visible,
    highlightColor,
    onHover,
    id: colTypes.Edges + '-view' + srcGraphId,
    updateTriggers: {
      getLineColor: time,
      getColor: time,
      getTextColor: time,
      getFillColor: time,
      getLineWidth: selectedFeatureIndexes,
      getWidth: selectedFeatureIndexes,
    },
    getFilterCategory: (d) => {
      const feature = d.feature ?? d;
      const { style, layerName, graph } = feature.properties || {};
      return [style?.group.groupIdx, layerName, graph?.id];
    },
    filterCategories: categories,
    extensions: [new DataFilterExtension({ categorySize })],
  };

  if (curveSegments.length) {
    return new CurveEdgeLayer({
      ...commonLayerProps,
      data: curveSegments,
      getWidth: getLineWidth,
      getColor: getLineColor,
      widthUnits: units,
      widthScale: 1,
      widthMinPixels: 0.1,
      pickable,
      autoHighlight,
    });
  }

  return new GeoJsonLayer<PointFeatureProperties, {}>({
    ...commonLayerProps,
    data: linesCollection,
    getLineWidth,
    getLineColor,

    // Styles
    lineWidthUnits: units,
    lineWidthScale: 1,
    lineWidthMinPixels: 0.1,
    //lineWidthMaxPixels: 15,
    lineJointRounded: false,
    lineCapRounded: true,
    //lineMiterLimit: 4,

    // Interactive props
    pickable,
    autoHighlight,
  });
};
