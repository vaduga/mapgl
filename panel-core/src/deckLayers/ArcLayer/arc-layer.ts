import { toRGB4Array, makeColorDarker, makeColorLighter } from '../utils/color';
import type { Unit } from '@deck.gl/core';
import { colTypes, type RGBAColor } from '../../types/index';
import AnimatedBlobsLayer from './animated-blobs-layer';
import GradientArcLayer from './gradient-arc-layer';
import { DataFilterExtension } from '@deck.gl/extensions';
import { positionTransformProps, withPositionTransform } from '../positionTransform';
import { edgeFilterProps } from '../edgeFilterCategories';

const arcFlowPresenceCache = new WeakMap<object, { revision: unknown; hasFlow: boolean }>();

function hasDirectionalArcFlow(lineFeatures: any[], revision: unknown): boolean {
  const cached = arcFlowPresenceCache.get(lineFeatures);
  if (revision !== undefined && cached?.revision === revision) {
    return cached.hasFlow;
  }

  const hasFlow = lineFeatures.some(
    (feature) =>
      (feature.properties.arcStyle?.sideA.arrow ?? 0) !== 0 || (feature.properties.arcStyle?.sideB.arrow ?? 0) !== 0
  );
  if (revision !== undefined) {
    arcFlowPresenceCache.set(lineFeatures, { revision, hasFlow });
  }
  return hasFlow;
}

const PositionGradientArcLayer = withPositionTransform(GradientArcLayer, [
  'instanceSourcePositions',
  'instanceTargetPositions',
]);
const PositionAnimatedBlobsLayer = withPositionTransform(AnimatedBlobsLayer, [
  'instanceSourcePositions',
  'instanceTargetPositions',
]);
export const MyArcLayer = (props) => {
  const {
    batchId,
    lineFeatures,
    onHover,
    pickable,
    autoHighlight,
    highlightColor,
    presentationRevision,
    isBase,
    isDark,
    isMeters = false,
    getVisLayers,
    overlayEnabled,
    isLogic,
    usesRendererNamespaceFiltering = false,
    visible,
  } = props;
  const animateAllEdges = Boolean(props.animateAllEdges);

  type BartSegment = {
    properties;
  };

  const getColor = (dir: 'sideA' | 'sideB', d, opts?: { ignoreSkip?: boolean }): RGBAColor => {
    if (!opts?.ignoreSkip && !isBase && d.skip) {
      return [0, 0, 0, 0];
    }

    const { edgeStyle, arcStyle } = d.properties;
    const overlayColor = d.properties.overlayColor;
    const { group, color } = arcStyle[dir];
    const opacity = edgeStyle.opacity;
    const c = group?.color ?? color;
    let muted = [...c] as RGBAColor;
    muted[3] = opacity !== undefined ? Math.round(opacity * 255) : muted[3];

    if (overlayColor && overlayEnabled) {
      return overlayColor;
    }

    const alterColor = (color) => {
      return isDark ? makeColorLighter(color) : makeColorDarker(color);
    };

    return isBase ? muted : (alterColor(muted) as RGBAColor);
  };
  const units: Unit = isMeters ? 'meters' : 'pixels';

  const getWidths = (d): [number, number] => {
    const { arcStyle } = d.properties;
    return [arcStyle.sideA.size, arcStyle.sideB.size];
  };
  const getHeight = (d: BartSegment) => {
    const arcStyle = d?.properties.arcStyle;
    const heightCoef = arcStyle?.arcConfig?.height;
    return heightCoef ?? 0.5;
  };

  const filter = edgeFilterProps(props.effectiveVisibility);
  const layerProps = {
    ...filter,
    visible,
    ...positionTransformProps(props.positionTransform, 'arc', props),
    highlightColor,
    onHover,
    data: lineFeatures,
    getWidths,
    getHeight,
    getTilt: (d: BartSegment) => d.properties.tilt,
    getSourceColor: (d: BartSegment) => getColor('sideA', d),
    getTargetColor: (d: BartSegment) => getColor('sideB', d),
    getSkip: (d) => Number(Boolean(d.skip)),
    getHighlightDepth: (d) => (d.skip ? 1 : 0),

    updateTriggers: {
      ...filter.updateTriggers,
      getLineColor: presentationRevision,
      getTextColor: presentationRevision,
      getFillColor: presentationRevision,
      getSourceColor: presentationRevision,
      getTargetColor: presentationRevision,
      getWidths: presentationRevision,
    },
    filterCategories: filter.filterCategories,
    extensions: [new DataFilterExtension({ categorySize: 1, filterSize: 0 }), ...(props.positionTransform?.extensions ?? [])],
    // Styles
    widthUnits: units,
    widthScale: 1,
    widthMinPixels: 0.1,
    //lineWidthMaxPixels: 15,
    // Interactive props
    pickable,
    autoHighlight,
  };

  return isBase
    ? new PositionGradientArcLayer({
        ...layerProps,
        id: colTypes.Edges + '-arc-base' + batchId,
      })
    : new PositionAnimatedBlobsLayer({
        //<BartSegment>
        ...layerProps,
        id: colTypes.Edges + '-arc-blobs' + batchId,
        getSourceColor: (d: BartSegment) => getColor('sideA', d, { ignoreSkip: true }),
        getTargetColor: (d: BartSegment) => getColor('sideB', d, { ignoreSkip: true }),
        getSourceArrow: (d: BartSegment) => d.properties.arcStyle?.sideA.arrow ?? 0,
        getTargetArrow: (d: BartSegment) => d.properties.arcStyle?.sideB.arrow ?? 0,
        animateAllEdges,
        animate: animateAllEdges && visible !== false && hasDirectionalArcFlow(lineFeatures, presentationRevision),
        getFrequency: (d) => 10,
        animationSpeed: 5,
        tailLength: 0.1,
        coef: 0.8,
      });
};
