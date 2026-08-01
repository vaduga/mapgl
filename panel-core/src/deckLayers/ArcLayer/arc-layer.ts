import { toRGB4Array, makeColorDarker, makeColorLighter } from '../utils/color';
import { Unit } from 'deck.gl';
import { ALERTING_STATES } from '../../types/defaults';
import { colTypes, type RGBAColor } from '@mapgl/panel-core/types';
import AnimatedBlobsLayer from './animated-blobs-layer';
import GradientArcLayer from './gradient-arc-layer';
import { DataFilterExtension } from '@deck.gl/extensions';
import { Matrix4 } from '@math.gl/core';
import { getEdgeFilterCategories, getEdgeFilterCategory } from '../edgeFilterCategories';
export const MyArcLayer = (props) => {
  const {
    srcGraphId,
    layerShift = {},
    lineFeatures,
    onHover,
    pickable,
    autoHighlight,
    highlightColor,
    time,
    isBase,
    baseLayer,
    theme,
    options,
    getVisLayers,
    getGroupsLegend,
    panel,
    isLogic,
    visible,
  } = props;

  const baseCategories = getVisLayers.getCategories();
  const usesRendererNamespaceFiltering = panel?.namespaceProjection?.rendererFiltering !== 'none';
  const { categories, categorySize } = getEdgeFilterCategories({
    baseCategories,
    filterIncludesSkip: false,
    usesRendererNamespaceFiltering,
  });

  type BartSegment = {
    properties;
  };

  const lTheme = baseLayer?.options?.config?.theme;
  const isAuto = !lTheme || lTheme === 'auto';
  const isDark = isAuto ? theme.isDark : lTheme === 'dark';

  const getColor = (dir: 'sideA' | 'sideB', d, opts?: { ignoreSkip?: boolean }): RGBAColor => {
    if (!opts?.ignoreSkip && !isBase && d.skip) {
      return [0, 0, 0, 0];
    }

    const { edgeStyle, arcStyle } = d.properties;
    const all_annots = d.properties.all_annots;
    const { group, color } = arcStyle[dir];
    const opacity = edgeStyle.opacity;
    const c = group?.color ?? color;
    let muted = [...c] as RGBAColor;
    muted[3] = opacity !== undefined ? Math.round(opacity * 255) : muted[3];

    if (all_annots && !getGroupsLegend?.at(-1)?.disabled) {
      const annotState = all_annots?.[0]?.newState;
      const color = annotState?.startsWith('Normal')
        ? ALERTING_STATES.Normal
        : annotState === 'Alerting'
          ? ALERTING_STATES.Alerting
          : ALERTING_STATES.Pending;
      return toRGB4Array(color, 1);
    }

    const alterColor = (color) => {
      return isDark ? makeColorLighter(color) : makeColorDarker(color);
    };

    return isBase ? muted : (alterColor(muted) as RGBAColor);
  };
  const units: Unit = options.common?.isMeters ? 'meters' : 'pixels';

  const getWidth = (d) => {
    const { arcStyle } = d.properties;
    const getLineWidth = (dir) => {
      const { size } = arcStyle[dir];
      return size;
    };
    const lineWidthA = getLineWidth('sideA');
    const lineWidthB = getLineWidth('sideB');
    const size = Math.max(lineWidthA, lineWidthB);
    return size;
  };
  const getHeight = (d: BartSegment) => {
    const arcStyle = d?.properties.arcStyle;
    const heightCoef = arcStyle?.arcConfig?.height;
    return heightCoef ?? 0.5;
  };

  const modelMatrix = new Matrix4();
  const parts = srcGraphId.split('.');
  let path = '';
  for (let i = 0; i < parts.length; i++) {
    path = path ? `${path}.${parts[i]}` : parts[i];

    const shift = layerShift[path];
    if (shift) {
      modelMatrix.translate([shift[0], shift[1], 0]);
    }
  }

  const layerProps = {
    visible,
    modelMatrix,
    highlightColor,
    onHover,
    data: lineFeatures,
    getWidth,
    getHeight,
    getTilt: (d: BartSegment) => d.properties.tilt,
    getSourceColor: (d: BartSegment) => getColor('sideA', d),
    getTargetColor: (d: BartSegment) => getColor('sideB', d),
    getSkip: (d) => Number(Boolean(d.skip)),
    getHighlightDepth: (d) => (d.skip ? 1 : 0),
    getFilterCategory: (d) => {
      return getEdgeFilterCategory({
        feature: d,
        baseCategories,
        filterIncludesSkip: false,
        usesRendererNamespaceFiltering,
      });
    },

    updateTriggers: {
      getLineColor: time,
      getTextColor: time,
      getFillColor: time,
      getSourceColor: time,
      getTargetColor: time,
    },
    filterCategories: categories,
    extensions: [new DataFilterExtension({ categorySize })],
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
    ? new GradientArcLayer({
        ...layerProps,
        id: colTypes.Edges + '-arc-base' + srcGraphId,
      })
    : new AnimatedBlobsLayer({
        //<BartSegment>
        ...layerProps,
        id: colTypes.Edges + '-arc-blobs' + srcGraphId,
        getSourceColor: (d: BartSegment) => getColor('sideA', d, { ignoreSkip: true }),
        getTargetColor: (d: BartSegment) => getColor('sideB', d, { ignoreSkip: true }),
        getSourceArrow: (d: BartSegment) => d.properties.arcStyle?.sideA.arrow ?? 0,
        getTargetArrow: (d: BartSegment) => d.properties.arcStyle?.sideB.arrow ?? 0,
        getFrequency: (d) => 10,
        animationSpeed: 5,
        tailLength: 0.1,
        coef: 0.8,
      });
};
