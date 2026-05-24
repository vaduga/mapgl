import { toRGB4Array } from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers';
import type { Color } from '@deck.gl/core';
import type { Feature, Geometry } from 'geojson';
import { ALERTING_STATES } from 'mapLib/defaults';
import { type DeckLine, colTypes, type PointFeatureProperties, type RGBAColor } from 'mapLib/types';
import { DataFilterExtension } from '@deck.gl/extensions';
import { CurveEdgeBinaryData, CurveEdgeLayer, type CurveEdgeSegment } from './curve-edge-layer';

function createEmptyCurveData(features: DeckLine[] = []): CurveEdgeBinaryData<DeckLine> {
  return createCurveBinaryData({
    length: 0,
    attributes: {
      getControlPoints: { value: new Float32Array(), size: 8 },
      getSegment: { value: new Float32Array(), size: 2 },
      getCurveType: { value: new Uint8Array(), size: 1 },
    },
    features,
    segmentFeatureIndexes: new Int32Array(),
  });
}

function createCurveBinaryData(
  data: Omit<CurveEdgeBinaryData<DeckLine>, typeof Symbol.iterator>
): CurveEdgeBinaryData<DeckLine> {
  return Object.assign(data, {
    *[Symbol.iterator](): IterableIterator<CurveEdgeSegment<DeckLine>> {
      for (let segmentIndex = 0; segmentIndex < data.length; segmentIndex++) {
        const featureIndex = data.segmentFeatureIndexes[segmentIndex];
        yield {
          feature: data.features[featureIndex],
          featureIndex,
          pickingIndex: segmentIndex,
          type: 0,
          controlPoints: [],
          segment: [],
        };
      }
    },
  });
}

function getFeatureGeomEdges(feature: DeckLine, getWasmId2Edges) {
  const edges = getWasmId2Edges?.[feature.heIdx] ?? [];
  if (feature.geometry?.type === 'LineString' && Number.isInteger(feature.fragIdx)) {
    const edge = edges[feature.fragIdx];
    return edge ? [edge] : [];
  }

  return edges;
}

function getLayoutCurveSegments(
  srcGraphId: string,
  features: DeckLine[],
  getWasmId2Edges,
  panel
): CurveEdgeBinaryData<DeckLine> | undefined {
  const group = panel.layoutCurveGroups?.get(srcGraphId);
  const edgeKeys = panel.layoutEdgeKeys;
  if (!group || !edgeKeys?.length) {
    return undefined;
  }

  const lineIdsByEdgeIndex = new Int32Array(edgeKeys.length);
  lineIdsByEdgeIndex.fill(-1);
  const hiddenFeature = { skip: true, properties: {} } as DeckLine;
  const featuresByLineId: DeckLine[] = [hiddenFeature];

  features.forEach((feature, featureIndex) => {
    for (const edge of getFeatureGeomEdges(feature, getWasmId2Edges)) {
      const edgeIndex = panel.layoutEdgeIndexes?.get(`${edge.source?.parent?.id ?? ''}:${edge.id}`);
      if (edgeIndex !== undefined) {
        const lineId = typeof edge.lineId === 'number' ? edge.lineId : featureIndex;
        lineIdsByEdgeIndex[edgeIndex] = lineId;
        featuresByLineId[lineId] = feature.renderGeometryOnly ? { ...feature, skip: true } : feature;
      }
    }
  });

  const segmentCount = group.types.length;
  const segmentFeatureIndexes = new Int32Array(segmentCount);
  segmentFeatureIndexes.fill(-1);

  group.edgeIndexes.forEach((edgeIndex, localEdgeIndex) => {
    const featureIndex = lineIdsByEdgeIndex[edgeIndex] < 0 ? 0 : lineIdsByEdgeIndex[edgeIndex];
    const start = group.edgeSegmentOffsets[localEdgeIndex];
    const end = group.edgeSegmentOffsets[localEdgeIndex + 1];

    for (let segmentIndex = start; segmentIndex < end; segmentIndex++) {
      segmentFeatureIndexes[segmentIndex] = featureIndex;
    }
  });

  return createCurveBinaryData({
    length: segmentCount,
    attributes: {
      getControlPoints: { value: group.controlPoints, size: 8 },
      getSegment: { value: group.segments, size: 2 },
      getCurveType: { value: group.types, size: 1 },
    },
    features: featuresByLineId,
    segmentFeatureIndexes,
  });
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
  const lineFeatures = linesCollection?.features ?? [];
  const curveSegments = isLogic ? getLayoutCurveSegments(srcGraphId, lineFeatures, getWasmId2Edges, panel) : undefined;
  const cats = getVisLayers.getCategories();
  const categories = cats.concat([cats[1]]);
  const categorySize = 3;

  const getLineWidth = (d, info?) => {
    const feature = d.feature ?? d;
    if (!feature?.properties) {
      return 1;
    }
    const { edgeStyle } = feature.properties;
    if (!edgeStyle) {
      return 1;
    }
    const isSelected = !isLogic && selectedFeatureIndexes.includes(info?.index);
    return edgeStyle.size * (isSelected ? 2 : 1);
  };

  const getLineColor = (
    d: CurveEdgeSegment<DeckLine> | DeckLine | Feature<Geometry, PointFeatureProperties>
  ): Color => {
    const feature = 'feature' in d ? d.feature : d;
    if (!feature?.properties) {
      return [0, 0, 0, 0];
    }
    const { edgeStyle, all_annots } = feature.properties as any;
    if (!edgeStyle) {
      return [0, 0, 0, 0];
    }
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

  const createGeoJsonLineLayer = (data, idSuffix = '') =>
    new GeoJsonLayer<PointFeatureProperties, {}>({
      ...commonLayerProps,
      id: commonLayerProps.id + idSuffix,
      data,
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

  if (curveSegments?.length) {
    const curveLayer = new CurveEdgeLayer({
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

    return curveLayer;
  }

  return createGeoJsonLineLayer(linesCollection);
};
