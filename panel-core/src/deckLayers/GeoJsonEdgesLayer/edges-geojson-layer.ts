import { getCurveMetrics } from './curve-metrics';
import { positionTransformProps } from '../positionTransform';
import { getCurveFlowDirection, getCurveFlowRanges } from './curve-flow';
import { toRGB4Array } from '../utils/color';
import { GeoJsonLayer } from '@deck.gl/layers';
import type { Color } from '@deck.gl/core';
import type { Feature, Geometry } from 'geojson';
import { type DeckLine, colTypes, type PointFeatureProperties, type RGBAColor } from '../../types/index';
import { DataFilterExtension, PathStyleExtension } from '@deck.gl/extensions';
import { CurveEdgeBinaryData, CurveEdgeLayer, type CurveEdgeSegment } from './curve-edge-layer';
import { edgeFilterProps } from '../edgeFilterCategories';
import { getCurveSegmentHidden } from '../../extension-points/featureContracts';
import type { GraphEdgeIndex } from '../../graph/GraphEdgeIndex';

type EdgePathStyleLayerProps = {
  getDashArray?: (
    d: CurveEdgeSegment<DeckLine> | DeckLine | Feature<Geometry, PointFeatureProperties>
  ) => readonly [number, number];
  dashGapPickable?: boolean;
  dashJustified?: boolean;
};

const EDGE_DASH_ARRAY = [4, 2] as const;
const SOLID_EDGE_DASH_ARRAY = [0, 0] as const;
const pathStyleExtension = new PathStyleExtension({ dash: true });

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

function getFeatureGeomEdges(feature: DeckLine, edgeIndex: GraphEdgeIndex | undefined) {
  return edgeIndex && Number.isInteger(feature.edgeRef) && feature.edgeRef < edgeIndex.edgeCount
    ? [edgeIndex.getEdge(feature.edgeRef)]
    : [];
}

export function getLayoutCurveSegments(
  srcGraphId: string,
  features: DeckLine[],
  edgeIndex: GraphEdgeIndex | undefined,
  geometry
): CurveEdgeBinaryData<DeckLine> | undefined {
  if (!geometry) {
    return undefined;
  }
  const group = geometry.curveGroups?.get(srcGraphId);
  const edgeKeys = geometry.edgeKeys;
  if (!group || !edgeKeys?.length) {
    return undefined;
  }

  const lineIdsByEdgeIndex = new Int32Array(edgeKeys.length);
  lineIdsByEdgeIndex.fill(-1);
  const hiddenFeature = { skip: true, properties: {} } as DeckLine;
  const hiddenFeatureIndex = features.length;
  const featuresByLineId: DeckLine[] = [...features, hiddenFeature];

  features.forEach((feature, featureIndex) => {
    for (const edge of getFeatureGeomEdges(feature, edgeIndex)) {
      const layoutEdgeIndex = geometry.edgeIndexes?.get(
        `${(edge.source?.parent as { id?: string } | undefined)?.id ?? ''}:${edge.id}`
      );
      if (layoutEdgeIndex !== undefined) {
        const lineId = featureIndex;
        lineIdsByEdgeIndex[layoutEdgeIndex] = lineId;
        featuresByLineId[lineId] = feature;
      }
    }
  });

  const segmentCount = group.types.length;
  const segmentFeatureIndexes = new Int32Array(segmentCount);
  segmentFeatureIndexes.fill(-1);

  group.edgeIndexes.forEach((edgeIndex, localEdgeIndex) => {
    const featureIndex = lineIdsByEdgeIndex[edgeIndex] < 0 ? hiddenFeatureIndex : lineIdsByEdgeIndex[edgeIndex];
    const start = group.edgeSegmentOffsets[localEdgeIndex];
    const end = group.edgeSegmentOffsets[localEdgeIndex + 1];

    for (let segmentIndex = start; segmentIndex < end; segmentIndex++) {
      segmentFeatureIndexes[segmentIndex] = featureIndex;
    }
  });
  const hiddenSegments = getCurveSegmentHidden(geometry.edgeOffsetStrategies, {
    segmentFeatureIndexes,
    features: featuresByLineId,
  });

  const result = createCurveBinaryData({
    length: segmentCount,
    attributes: {
      getControlPoints: { value: group.controlPoints, size: 8 },
      getSegment: { value: group.segments, size: 2 },
      getCurveType: { value: group.types, size: 1 },
      ...(hiddenSegments && { getSkip: { value: hiddenSegments, size: 1 as const } }),
    },
    features: featuresByLineId,
    segmentFeatureIndexes,
  });
  if (result.features.some((feature) => getCurveFlowDirection(feature) !== 0)) {
    result.attributes.getFlow = { value: getCurveFlowRanges(result), size: 4 };
  }
  return result;
}

export const EdgesGeojsonLayer = (props) => {
  const {
    batchId,
    linesCollection,
    getSelectedIdxs,
    onHover,
    pickable,
    autoHighlight,
    highlightColor,
    presentationRevision,
    isMeters = false,
    visible,
    getVisLayers,
    overlayEnabled,
    animateAllEdges = false,
    layoutGeometry,
    isLogic,
    usesRendererNamespaceFiltering = false,
    edgeIndex,
  } = props;

  const selectedFeatureIndexes = getSelectedIdxs?.get(colTypes.Edges)?.[batchId] ?? [];
  const lineFeatures = linesCollection?.features ?? [];
  const curveSegments = isLogic
    ? (props.curveSegments ?? getLayoutCurveSegments(batchId, lineFeatures, edgeIndex, layoutGeometry))
    : undefined;

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
    const { edgeStyle, overlayColor } = feature.properties as any;
    if (!edgeStyle) {
      return [0, 0, 0, 0];
    }
    const { color, group, opacity } = edgeStyle;

    if (overlayColor && overlayEnabled) {
      return overlayColor;
    }

    // group is defined only if nodes/edge metric field match
    const c = group?.color ?? color;
    const muted = [...c] as RGBAColor;
    muted[3] = opacity !== undefined ? Math.round(opacity * 255) : muted[3];
    return muted as [number, number, number];
  };

  const getEdgeDashArray = (
    d: CurveEdgeSegment<DeckLine> | DeckLine | Feature<Geometry, PointFeatureProperties>
  ): readonly [number, number] => {
    const feature = 'feature' in d ? d.feature : d;
    const edgeStyle = feature?.properties?.edgeStyle as { isDashed?: boolean } | undefined;
    return edgeStyle?.isDashed ? EDGE_DASH_ARRAY : SOLID_EDGE_DASH_ARRAY;
  };

  const units = isMeters ? 'meters' : 'pixels';
  const sizeUnits = isLogic ? 'common' : units;
  const filter = edgeFilterProps(props.effectiveVisibility, !isLogic);
  const commonLayerProps = {
    ...filter,
    visible,
    highlightColor,
    onHover,
    id: colTypes.Edges + '-view' + batchId,
    ...positionTransformProps(props.positionTransform, 'curve', { ...props, curveSegments }),
    updateTriggers: {
      ...filter.updateTriggers,
      getLineColor: presentationRevision,
      getColor: presentationRevision,
      getTextColor: presentationRevision,
      getFillColor: presentationRevision,
      getLineWidth: selectedFeatureIndexes,
      getWidth: selectedFeatureIndexes,
    },
    filterCategories: filter.filterCategories,
    extensions: [
      new DataFilterExtension({ categorySize: 1, filterSize: 0 }),
      pathStyleExtension,
      ...(props.positionTransform?.extensions ?? []),
    ],
  };

  const createGeoJsonLineLayer = (data, idSuffix = '') =>
    new GeoJsonLayer<PointFeatureProperties, EdgePathStyleLayerProps>({
      ...commonLayerProps,
      id: commonLayerProps.id + idSuffix,
      data,
      getLineWidth,
      getLineColor,
      getDashArray: getEdgeDashArray,
      dashGapPickable: true,

      // Styles
      lineWidthUnits: sizeUnits,
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
      widthUnits: sizeUnits,
      widthScale: 1,
      widthMinPixels: 0.1,
      skipVisibleMaxDepth: -1,
      animateAllEdges,
      animate:
        animateAllEdges &&
        visible &&
        curveSegments.segmentFeatureIndexes.some((featureIndex, segmentIndex) => {
          if (curveSegments.attributes.getSkip?.value[segmentIndex]) {
            return false;
          }
          const feature = curveSegments.features[featureIndex];
          if (feature.skip || !getCurveFlowDirection(feature)) {
            return false;
          }
          return filter.getFilterCategory(feature) === 1;
        }),
      getDashArray: getEdgeDashArray,
      dashGapPickable: true,
      pickable,
      autoHighlight,
    });

    return curveLayer;
  }

  if (isLogic) {
    const emptyCurveLayer = new CurveEdgeLayer({
      ...commonLayerProps,
      data: curveSegments ?? createEmptyCurveData(lineFeatures),
      getWidth: getLineWidth,
      getColor: getLineColor,
      widthUnits: sizeUnits,
      widthScale: 1,
      widthMinPixels: 0.1,
      getDashArray: getEdgeDashArray,
      dashGapPickable: true,
      pickable,
      autoHighlight,
    });

    return emptyCurveLayer;
  }

  return createGeoJsonLineLayer(linesCollection);
};

/** One binary draw domain for all layout namespaces. Feature indexes remain global. */
export function getSharedLayoutCurveSegments(
  features: DeckLine[],
  edgeIndex: GraphEdgeIndex | undefined,
  geometry
): CurveEdgeBinaryData<DeckLine> {
  const parts = [...(geometry.curveGroups?.keys() ?? [])]
    .map((id) => ({ id, data: getLayoutCurveSegments(id, features, edgeIndex, geometry)! }))
    .filter((part) => part.data);
  const length = parts.reduce((sum, part) => sum + part.data.length, 0);
  const controlPoints = new Float32Array(length * 8),
    segments = new Float32Array(length * 2);
  const types = new Uint8Array(length),
    skip = new Uint8Array(length),
    indexes = new Int32Array(length);
  let offset = 0;
  for (const { id, data: part } of parts) {
    controlPoints.set(part.attributes.getControlPoints.value, offset * 8);
    geometry.transformControlPoints?.(id, controlPoints, offset * 8, part.attributes.getCurveType.value);
    segments.set(part.attributes.getSegment.value, offset * 2);
    types.set(part.attributes.getCurveType.value, offset);
    if (part.attributes.getSkip) skip.set(part.attributes.getSkip.value, offset);
    indexes.set(part.segmentFeatureIndexes, offset);
    offset += part.length;
  }
  const result = createCurveBinaryData({
    length,
    attributes: {
      getControlPoints: { value: controlPoints, size: 8 },
      getSegment: { value: segments, size: 2 },
      getCurveType: { value: types, size: 1 },
      getSkip: { value: skip, size: 1 },
    },
    features: [...features, { skip: true, properties: {} } as DeckLine],
    segmentFeatureIndexes: indexes,
  });
  if (features.some((feature) => getCurveFlowDirection(feature)))
    result.attributes.getFlow = { value: getCurveFlowRanges(result), size: 4 };
  return result;
}
