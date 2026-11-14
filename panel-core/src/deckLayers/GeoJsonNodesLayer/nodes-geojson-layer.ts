import {
  GeoJsonLayer,
  PolygonLayer,
  TextLayer,
  IconLayer,
  PathLayer,
  _MultiIconLayer,
  _TextBackgroundLayer,
  SolidPolygonLayer,
} from '@deck.gl/layers';
import { CollisionFilterExtension, DataFilterExtension } from '@deck.gl/extensions';
import { positionTransformProps, withPositionTransform } from '../positionTransform';

import { getPackedSvgIcon } from './svgIconAtlas';
import {
  DonutCircleLayer,
  createDonutAtlas,
  createEqualDonutInput,
  createGaugeDonutInput,
  getDonutInputKey,
  getDonutRecord,
  type DonutInput,
} from '../DonutCircleLayer';
import { getTintedSvgIcon, resolveSvgTintMode } from '../utils/svg';
import {
  BLANK_USER_SVG_ICON,
  createUserSvgAtlas,
  createUserSvgAtlasPlan,
  getUserSvgVariantKey,
  type UserSvgAtlasEntry,
} from './userSvgAtlas';
import { isVisible } from '../utils/visibility';
import { getLayoutCardBox } from '../../graph/utils/layout-geometry';
import { toRGB4Array, toRgbaString } from '../utils/color';
import { getNodeLayerVisibility, getNodePointType } from './nodeRenderPlan';
import {
  GAUGE_VALUE_FONT_FAMILY,
  GAUGE_VALUE_FONT_WEIGHT,
  getFittedGaugeValueTextSize,
  getFittedIconSize,
  getGaugeValueContentBoxSide,
  getMaxNodeIconSizesByVariant,
  getResolvedNodeArcOptions,
  getResolvedNodeArcColors,
  getResolvedNodeGauge,
  getResolvedPointRadius,
  getResolvedTextPixelOffset,
  getResolvedUserIconBoxSize,
} from './nodeGeometry';
import { colTypes } from '../../types/index';
import { resolveArcOptions } from '../../style/types';

const PositionDonutLayer = withPositionTransform(DonutCircleLayer);
const PositionMultiIconLayer = withPositionTransform(_MultiIconLayer);
const PositionTextBackgroundLayer = withPositionTransform(_TextBackgroundLayer);
const PositionIconLayer = withPositionTransform(IconLayer);
const PositionSolidPolygonLayer = withPositionTransform(SolidPolygonLayer, ['vertexPositions', 'nextVertexPositions']);
const PositionPathLayer = withPositionTransform(PathLayer, [
  'instanceLeftPositions',
  'instanceStartPositions',
  'instanceEndPositions',
  'instanceRightPositions',
]);

type LogicTextDatum = {
  coordinates: [number, number];
  properties: any;
  pointIndex: number;
};

type LogicTextLayerData = {
  labelData: LogicTextDatum[];
  placeholderData: LogicTextDatum[];
  labelYOffset: Float32Array;
  placeholderBoxSide: Float32Array;
  placeholderTextSize: Float32Array;
};

const getFeatureWrapper = (properties: any) => ({ properties });

const getLabelYOffset = (properties: any, selectedNodeId?: string) => {
  return getResolvedTextPixelOffset(getFeatureWrapper(properties), selectedNodeId, { gap: 2 })[1];
};

const getPlaceholderBoxSide = (properties: any, selectedNodeId?: string) => {
  return (getResolvedPointRadius(getFeatureWrapper(properties), selectedNodeId) * 2) / Math.SQRT2;
};

const getPlaceholderTextSize = (properties: any) => {
  const size = properties?.style?.size ?? 0;
  const r = size / 2;
  const r0 = Math.round(r * 0.73);
  return Math.round(r0 * 0.5);
};

const logicTextCache = new WeakMap<object, { key: string; data: LogicTextLayerData }>();
const labelDataCache = new WeakMap<LogicTextLayerData, { colors: unknown; data: LogicTextDatum[] }>();
const cardPolygonCache = new WeakMap<object, any[]>();

const buildLogicTextLayerData = (
  biCol: any,
  selectedNodeId?: string,
  iconLayerVisible = true,
  selectedNamespace?: string
): LogicTextLayerData => {
  const key = JSON.stringify([selectedNodeId, selectedNamespace, iconLayerVisible]);
  const cached = logicTextCache.get(biCol);
  if (cached?.key === key) return cached.data;
  const featureIds = biCol?.points?.featureIds?.value;
  const positions = biCol?.points?.positions?.value;
  const properties = biCol?.points?.properties;
  const count = featureIds?.length ?? 0;
  const labelData: LogicTextDatum[] = [];
  const placeholderData: LogicTextDatum[] = [];
  const labelYOffset = new Float32Array(count);
  const placeholderBoxSide = new Float32Array(count);
  const placeholderTextSize = new Float32Array(count);

  if (featureIds && positions && properties) {
    for (let i = 0; i < count; i++) {
      const featureProps = properties[featureIds[i]];
      const selected = featureProps?.graph?.id === selectedNamespace ? selectedNodeId : undefined;

      labelYOffset[i] = getLabelYOffset(featureProps, selected);
      const gauge = featureProps?.style?.gauge;
      const boxSide = gauge
        ? getGaugeValueContentBoxSide(getFeatureWrapper(featureProps), selected)
        : getPlaceholderBoxSide(featureProps, selected);
      placeholderBoxSide[i] = boxSide;
      placeholderTextSize[i] = gauge
        ? getFittedGaugeValueTextSize(gauge.displayText ?? '', boxSide)
        : getPlaceholderTextSize(featureProps);

      const datum = {
        coordinates: [positions[i * 2], positions[i * 2 + 1]] as [number, number],
        properties: featureProps,
        pointIndex: i,
      };
      labelData.push(datum);

      const iconName = featureProps?.style?.group?.iconName;
      if ((gauge && (!iconName || !iconLayerVisible)) || (!gauge && !iconName)) {
        placeholderData.push(datum);
      }
    }
  }

  const data = { labelData, placeholderData, labelYOffset, placeholderBoxSide, placeholderTextSize };
  logicTextCache.set(biCol, { key, data });
  return data;
};

const isCanvasTintPending = (
  svgIcon: any,
  tintColor: string | undefined,
  resolvedTintMode: string,
  renderSize: number
) => {
  if (resolvedTintMode !== 'canvasTint' || !svgIcon || !tintColor) {
    return false;
  }

  return !svgIcon.colorVariants?.[`canvasTint:${tintColor}:${renderSize}`];
};

const NodesGeojsonLayer = (props: any): GeoJsonLayer<any> => {
  const {
    biCol,
    pickable,
    getSelectedNode,
    onHover,
    highlightColor,
    isMeters = false,
    svgIconState,
    resourceRevision,
    isLogic,
    isRouted,
    onSvgIconReady,
    getVisLayers,
    autoHighlight,
    visible,
    logicTextMode = 'single',
    pointTypeOverride,
    idSuffix = '',
  } = props;

  const { circle: Circle, svg: SVG, labels: Labels } = getNodeLayerVisibility(getVisLayers);

  const units = isLogic ? 'common' : isMeters ? 'meters' : 'pixels';
  const categories = props.effectiveVisibility?.groupCategories ?? [1];
  const categorySize = 1;
  const isPlaceholderTextMode = logicTextMode === 'placeholder';
  const isLabelTextMode = logicTextMode === 'label';
  const selectedNodeId = getSelectedNode?.id;
  const selectedNamespace = getSelectedNode?.parent?.id;
  const selectedIdFor = (d) => (d.properties?.graph?.id === selectedNamespace ? selectedNodeId : undefined);
  const svgIcons = svgIconState?.icons ?? {};
  const svgIconRevision = svgIconState?.revision ?? 0;

  const resolveUserSvgVariant = (properties: any) => {
    const { group } = properties?.style || {};
    const iconName = group?.iconName;
    const svgIcon = iconName && svgIcons[iconName];
    const requestedTintMode = group?.svgTintMode ?? 'none';
    const tintMode = resolveSvgTintMode(svgIcon, requestedTintMode);
    const requestedTintColor = group?.color ? toRgbaString(group.color) : properties?.thrColor;
    const tintColor = tintMode === 'none' ? undefined : requestedTintColor;
    const key = svgIcon
      ? getUserSvgVariantKey({ iconName, tintMode, tintColor, revision: svgIconRevision })
      : undefined;

    return { key, iconName, svgIcon, tintMode, tintColor };
  };

  // Deck.gl auto-packs every distinct icon id into its texture atlas. Use one
  // shared, atlas-safe source resolution for all active variants; getIconSize
  // still scales every node independently and changing node sizes does not add
  // new atlas entries.
  const pointProperties = biCol?.points?.properties;
  const featureIds = biCol?.points?.featureIds?.value;
  const activePointProperties = featureIds
    ? Array.from(featureIds, (featureId: number) => pointProperties?.[featureId])
    : pointProperties;
  const maxIconSizesByVariant = getMaxNodeIconSizesByVariant(activePointProperties, (properties) => {
    return resolveUserSvgVariant(properties).key;
  });
  const hasActiveUserSvg = maxIconSizesByVariant.size > 0;
  const pointType = getNodePointType(pointTypeOverride, hasActiveUserSvg);
  const userSvgAtlasPlan = createUserSvgAtlasPlan(maxIconSizesByVariant, {
    revision: svgIconRevision,
    devicePixelRatio: globalThis.devicePixelRatio ?? 1,
  });
  const packedIconSize = userSvgAtlasPlan.sourceTier;
  const activeProperties = Object.values(activePointProperties ?? {}) as any[];
  const userSvgAtlasEntries: UserSvgAtlasEntry[] = [];
  const collectedUserSvgKeys = new Set<string>();

  for (const properties of activeProperties) {
    const { key, svgIcon, tintMode, tintColor } = resolveUserSvgVariant(properties);
    if (!key || collectedUserSvgKeys.has(key)) {
      continue;
    }
    collectedUserSvgKeys.add(key);

    const tintedSvgIcon = getTintedSvgIcon(svgIcon, tintColor, {
      mode: tintMode,
      onReady: onSvgIconReady,
      renderSize: tintMode === 'canvasTint' ? packedIconSize : undefined,
    });
    const canvasTintPending = isCanvasTintPending(svgIcon, tintColor, tintMode, packedIconSize);
    const packedSvgIcon =
      tintMode === 'canvasTint' && !canvasTintPending ? tintedSvgIcon : getPackedSvgIcon(tintedSvgIcon, packedIconSize);

    if (packedSvgIcon?.svgDataUrl && packedSvgIcon.width && packedSvgIcon.height) {
      userSvgAtlasEntries.push({
        key,
        url: packedSvgIcon.svgDataUrl,
        width: packedSvgIcon.width,
        height: packedSvgIcon.height,
      });
    }
  }
  const userSvgAtlas = createUserSvgAtlas(userSvgAtlasPlan, userSvgAtlasEntries);

  const getDonutInput = (properties: any): DonutInput | undefined => {
    const gauge = properties?.style?.gauge;
    if (gauge?.stops?.length) {
      return createGaugeDonutInput({ colorMode: gauge.colorMode, stops: gauge.stops });
    }
    const arcs = properties?.style?.arcs;
    return arcs?.length ? createEqualDonutInput(arcs) : undefined;
  };

  const donutVariants = new Map<string, DonutInput>();
  for (const properties of activeProperties) {
    const input = getDonutInput(properties);
    if (!input) {
      continue;
    }
    donutVariants.set(getDonutInputKey(input), input);
  }
  const donutAtlas = createDonutAtlas(donutVariants);

  const getNodeDonutRecord = (d: any, info?: { index?: number }) => {
    const gauge = getResolvedNodeGauge(d, pointProperties, featureIds, info?.index);
    const arcs = getResolvedNodeArcColors(d, pointProperties, featureIds, info?.index);
    const input = gauge?.stops?.length
      ? createGaugeDonutInput({ colorMode: gauge.colorMode, stops: gauge.stops })
      : arcs?.length
        ? createEqualDonutInput(arcs)
        : undefined;
    if (!input) {
      return -1;
    }
    return getDonutRecord(donutAtlas, getDonutInputKey(input));
  };

  const getNodeDonutGaugeValue = (d: any, info?: { index?: number }) => {
    return getResolvedNodeGauge(d, pointProperties, featureIds, info?.index)?.fillFraction ?? -1;
  };

  const getNodeDonutGaugeOptions = (d: any, info?: { index?: number }) => {
    const arcOptions = resolveArcOptions(getResolvedNodeArcOptions(d, pointProperties, featureIds, info?.index));
    const gauge = getResolvedNodeGauge(d, pointProperties, featureIds, info?.index);
    const gradient = gauge?.colorMode !== 'thresholds' || arcOptions.gradient;
    return [
      arcOptions.barWidthFactor,
      arcOptions.segments,
      arcOptions.segmentSpacing,
      (arcOptions.showThresholds ? 1 : 0) + (gradient ? 0 : 2),
    ] as const;
  };

  const getNodeIconSize = (d) => {
    const targetBoxSize = getResolvedUserIconBoxSize(d, selectedIdFor(d));
    const { group } = d.properties?.style || {};
    const iconName = group?.iconName;
    const svgIcon = iconName && svgIcons[iconName];
    return getFittedIconSize(targetBoxSize, svgIcon?.width, svgIcon?.height);
  };

  const getNodeText = (d: any) => {
    if (isPlaceholderTextMode) {
      const iconName = d.properties?.style?.group?.iconName;
      return !iconName ? '-\n-' : ' ';
    }

    return d.properties?.style?.text ?? ' ';
  };

  const getNodeTextPixelOffset = (d) => {
    if (isPlaceholderTextMode) {
      return [0, 0];
    }

    if (isLogic) {
      return getResolvedTextPixelOffset(d, selectedIdFor(d), { gap: 2 });
    }

    return getResolvedTextPixelOffset(d, selectedIdFor(d), { gap: 0 });
  };

  return new GeoJsonLayer({
    id: `graph-nodes-view${idSuffix}`,
    visible,
    highlightColor,
    ...nodePresentationProps(props),
    onHover,
    data: biCol,
    // parameters: {
    //   depthTest: false
    // },
    pointType,
    iconAtlas: userSvgAtlas.iconAtlas,
    iconMapping: userSvgAtlas.iconMapping,
    getText: getNodeText,
    getTextAlignmentBaseline: isPlaceholderTextMode ? undefined : 'top',
    getTextAnchor: isPlaceholderTextMode ? undefined : 'middle',
    getTextPixelOffset: getNodeTextPixelOffset,
    getTextSize: (d) => {
      if (isPlaceholderTextMode) {
        return getPlaceholderTextSize(d.properties);
      }
      const size = d.properties.style?.textConfig?.fontSize;
      return size ?? 12;
    },
    stroked: false,
    getPointRadius: (d) => {
      return getResolvedPointRadius(d, selectedIdFor(d));
    },
    getIcon: (d) => resolveUserSvgVariant(d.properties).key ?? BLANK_USER_SVG_ICON,
    iconSizeScale: 1,
    getIconSize: (d) => {
      return getNodeIconSize(d);
    },
    parameters: {
      depthTest: false,
    },
    updateTriggers: {
      getFilterValue: props.effectiveVisibility?.key ?? props.getVisLayers.getVisibleNamespaces(),
      getFilterCategory: props.effectiveVisibility?.groupTrigger ?? props.getVisLayers.getCategories(),
      getPointRadius: [selectedNodeId, selectedNamespace],
      getIcon: [svgIconRevision, resourceRevision],
      getIconSize: [selectedNodeId, selectedNamespace],
      getTextPixelOffset: [selectedNodeId, selectedNamespace],
      getTextSize: [selectedNodeId, selectedNamespace],
    },
    getFilterCategory: nodePresentationProps(props).getFilterCategory,
    filterCategories: categories,
    extensions: [new DataFilterExtension({ categorySize }), ...(props.positionTransform?.extensions ?? [])],
    _subLayerProps: {
      'points-text': {
        visible: isPlaceholderTextMode || Labels,
        highlightColor,
        extensions: [new DataFilterExtension({ categorySize }), ...(props.positionTransform?.extensions ?? [])],
        sizeUnits: units,
        updateTriggers: {
          getFilterValue: props.effectiveVisibility?.key ?? props.getVisLayers.getVisibleNamespaces(),
          getFilterCategory: props.effectiveVisibility?.groupTrigger ?? props.getVisLayers.getCategories(),
          getPixelOffset: [selectedNodeId, selectedNamespace],
          getSize: [selectedNodeId, selectedNamespace],
        },
        // unexpected effect with this on - some text invisible
        // fontSettings: {sdf: true},
      },
      'points-icon': {
        type: PositionIconLayer,
        visible: SVG,
        highlightColor,
        extensions: [
          new CollisionFilterExtension(),
          new DataFilterExtension({ categorySize }),
          ...(props.positionTransform?.extensions ?? []),
        ],
        collisionGroup: 'nodes-icon',
        sizeUnits: units,
        // looks like props are shared across the group
        collisionTestProps: {
          sizeScale: 1,
        },
        alphaCutoff: -1,
        autoHighlight: false,
        updateTriggers: {
          getFilterValue: props.effectiveVisibility?.key ?? props.getVisLayers.getVisibleNamespaces(),
          getFilterCategory: props.effectiveVisibility?.groupTrigger ?? props.getVisLayers.getCategories(),
          getIcon: [svgIconRevision, resourceRevision],
          getSize: [selectedNodeId, selectedNamespace],
        },
      },
      'points-circle': {
        type: PositionDonutLayer,
        donutAtlas,
        getDonutState: (d, info) => [getNodeDonutRecord(d, info), 1, getNodeDonutGaugeValue(d, info)],
        getDonutGaugeOptions: getNodeDonutGaugeOptions,
        // OrbitView rotates the graph plane so its local +Y points down on
        // screen; MapView keeps local +Y pointing toward screen 12 o'clock.
        gaugeCoordinateYSign: isLogic ? -1 : 1,
        sizeUnits: units,
        radiusUnits: units,
        visible: Circle,
        highlightColor,
        extensions: [
          new CollisionFilterExtension(),
          new DataFilterExtension({ categorySize }),
          ...(props.positionTransform?.extensions ?? []),
        ],
        collisionGroup: 'nodes-circle',
        pickable: true,
        collisionTestProps: {
          sizeScale: 1,
        },
        updateTriggers: {
          getFilterValue: props.effectiveVisibility?.key ?? props.getVisLayers.getVisibleNamespaces(),
          getFilterCategory: props.effectiveVisibility?.groupTrigger ?? props.getVisLayers.getCategories(),
          getRadius: [selectedNodeId, selectedNamespace],
          getDonutState: [donutAtlas, resourceRevision],
          getDonutGaugeOptions: [resourceRevision],
        },
      },
    },
    // Styles
    filled: true,

    // Interactive props
    pickable: isLabelTextMode ? false : pickable,
    pickingDepth: 0,
    autoHighlight: autoHighlight && !isLabelTextMode,
  });
};

const PlaceholderTextLayer = (props) => {
  const {
    biCol,
    getVisLayers,
    visible,
    getSelectedNode,
    isMeters = false,
    isLogic,
    pickable,
    onHover,
    autoHighlight,
    textColor,
    resourceRevision,
    idSuffix = '',
  } = props;
  const { svg: SVG } = getNodeLayerVisibility(getVisLayers);
  const categories = props.effectiveVisibility?.groupCategories ?? [1];
  const categorySize = 1;
  const units = isLogic ? 'common' : isMeters ? 'meters' : 'pixels';

  const selectedNodeId = getSelectedNode?.id;
  const selectedNamespace = getSelectedNode?.parent?.id;
  const selectedIdFor = (d) => (d.properties?.graph?.id === selectedNamespace ? selectedNodeId : undefined);
  const logicTextData = buildLogicTextLayerData(biCol, selectedNodeId, SVG, selectedNamespace);
  const gaugeTextColor = textColor ? toRGB4Array(textColor, 1) : ([240, 240, 240, 255] as const);

  return new TextLayer({
    _subLayerProps: positionTextSublayers,
    id: `graph-nodes-view-placeholder-text${idSuffix}`,
    characterSet: 'auto',
    data: logicTextData.placeholderData,
    visible,
    ...nodePresentationProps(props),
    pickable,
    onHover,
    autoHighlight,
    sizeUnits: units,
    fontFamily: GAUGE_VALUE_FONT_FAMILY,
    fontWeight: GAUGE_VALUE_FONT_WEIGHT,
    getText: (d: any) => d.properties?.style?.gauge?.displayText ?? '-\n-',
    getColor: (d: any) => (d.properties?.style?.gauge ? gaugeTextColor : [240, 240, 240, 50]),
    getPosition: (d: any) => d.coordinates,
    getContentBox: (d: any) => {
      // Deck's content box uses world units even when glyph sizes use pixels.
      // Pixel-sized values already fit the opening through getSize.
      if (!isLogic && !isMeters) {
        return [0, 0, -1, -1];
      }
      const side = logicTextData.placeholderBoxSide[d.pointIndex] ?? 0;
      return [-side / 2, -side / 2, side, side];
    },
    contentCutoffPixels: [1, 1],
    contentAlignHorizontal: 'center',
    contentAlignVertical: 'center',
    getSize: (d: any) => logicTextData.placeholderTextSize[d.pointIndex] ?? 0,
    getFilterCategory: nodePresentationProps(props).getFilterCategory,
    updateTriggers: {
      getFilterValue: props.effectiveVisibility?.key ?? props.getVisLayers.getVisibleNamespaces(),
      getFilterCategory: props.effectiveVisibility?.groupTrigger ?? props.getVisLayers.getCategories(),
      getText: [biCol?.points?.properties, SVG, resourceRevision],
      getColor: [textColor],
      getContentBox: [selectedNodeId, biCol?.points?.properties, resourceRevision],
      getSize: [selectedNodeId, biCol?.points?.properties, resourceRevision],
    },
    filterCategories: categories,
    extensions: [new DataFilterExtension({ categorySize }), ...(props.positionTransform?.extensions ?? [])],
  });
};

export { PlaceholderTextLayer };

const MainLabelTextLayer = (props) => {
  const {
    biCol,
    getVisLayers,
    visible,
    getSelectedNode,
    isMeters = false,
    isLogic,
    pickable,
    onHover,
    autoHighlight,
    highlightColor,
    idSuffix = '',
    nodeCards = false,
    isDark = false,
  } = props;
  const Labels = isVisible(getVisLayers, {
    index: null,
    name: colTypes.Label,
    group: colTypes.Label,
  });
  const categories = props.effectiveVisibility?.groupCategories ?? [1];
  const categorySize = 1;
  const units = isLogic ? 'common' : isMeters ? 'meters' : 'pixels';

  const selectedNodeId = getSelectedNode?.id;
  const selectedNamespace = getSelectedNode?.parent?.id;
  const selectedIdFor = (d) => (d.properties?.graph?.id === selectedNamespace ? selectedNodeId : undefined);
  const logicTextData = buildLogicTextLayerData(biCol, selectedNodeId, true, selectedNamespace);
  let labelData = logicTextData.labelData as LogicTextDatum[] & { attributes?: Record<string, any> };
  if (!nodeCards) {
    const colors = biCol?.points?.attributes?.getColor;
    let cached = labelDataCache.get(logicTextData);
    if (!cached || cached.colors !== colors) {
      const data = Object.assign([...labelData], { attributes: { getColor: colors } });
      cached = { colors, data };
      labelDataCache.set(logicTextData, cached);
    }
    labelData = cached.data;
  }

  return new TextLayer({
    id: `graph-nodes-view-label-text${idSuffix}`,
    characterSet: 'auto',
    data: labelData,
    visible: visible && Labels,
    ...nodePresentationProps(props),
    pickable,
    onHover,
    autoHighlight,
    highlightColor,
    sizeUnits: units,
    getText: (d: any) => d.properties?.style?.text ?? ' ',
    getPosition: (d: any) => {
      const yOffset = nodeCards ? 0 : (logicTextData.labelYOffset[d.pointIndex] ?? 0);
      return [d.coordinates[0], d.coordinates[1] + yOffset];
    },
    getSize: (d: any) => {
      const size = d.properties?.style?.textConfig?.fontSize;
      return size ?? 12;
    },
    getTextAnchor: 'middle',
    getAlignmentBaseline: nodeCards ? 'center' : 'top',
    ...(nodeCards && {
      // On the NodeCardLayer box.
      getColor: isDark ? [230, 230, 230, 255] : [30, 30, 30, 255],
      lineHeight: 1.2,
      parameters: { depthTest: false },
    }),
    getFilterCategory: nodePresentationProps(props).getFilterCategory,
    updateTriggers: {
      getFilterValue: props.effectiveVisibility?.key ?? props.getVisLayers.getVisibleNamespaces(),
      getFilterCategory: props.effectiveVisibility?.groupTrigger ?? props.getVisLayers.getCategories(),
      getPosition: [selectedNodeId, selectedNamespace],
      getColor: [biCol?.points?.attributes?.getColor?.value],
    },
    filterCategories: categories,
    extensions: [new DataFilterExtension({ categorySize }), ...(props.positionTransform?.extensions ?? [])],
    _subLayerProps: {
      ...positionTextSublayers,
      characters: {
        type: PositionMultiIconLayer,
        highlightColor,
      },
    },
  });
};

/** Card boxes of a graph's nodes (centre, half sizes; layout units), as NodeCardLayer draws them. */
export function getNodeCards(biCol: any): Array<{ d: LogicTextDatum; x: number; y: number; hw: number; hh: number }> {
  const cards: ReturnType<typeof getNodeCards> = [];
  const points = biCol?.points;
  const ids = points?.featureIds?.value;
  const positions = points?.positions?.value;
  if (!ids || !positions) {
    return cards;
  }
  for (let i = 0; i < ids.length; i++) {
    const properties = points.properties?.[ids[i]];
    const box = getLayoutCardBox(properties?.style);
    if (box) {
      const x = positions[i * 2],
        y = positions[i * 2 + 1];
      cards.push({
        d: { coordinates: [x, y], properties, pointIndex: i },
        x,
        y,
        hw: box.width / 2,
        hh: box.height / 2,
      });
    }
  }
  return cards;
}

/** Node cards: the box the layout sized for each label (layout-geometry getLayoutCardBox), edged in the node's kind colour. */
const NodeCardLayer = (props: any): PolygonLayer<any> => {
  const {
    biCol,
    getVisLayers,
    visible,
    isDark = false,
    idSuffix = '',
    pickable,
    onHover,
    autoHighlight,
    highlightColor,
  } = props;
  const cards: ReturnType<typeof getNodeCards> = props.nodeCardData ?? getNodeCards(biCol);
  let data = cardPolygonCache.get(cards);
  if (!data) {
    data = cards.map(({ d, x, y, hw: w, hh: h }) => ({
      ...d,
      polygon: [
        [x - w, y - h],
        [x + w, y - h],
        [x + w, y + h],
        [x - w, y + h],
      ],
    }));
    cardPolygonCache.set(cards, data);
  }
  return new PolygonLayer({
    _subLayerProps: { fill: { type: PositionSolidPolygonLayer }, stroke: { type: PositionPathLayer } },
    id: `graph-nodes-view-node-card${idSuffix}`,
    data,
    visible: visible && isVisible(getVisLayers, { index: null, name: colTypes.Label, group: colTypes.Label }),
    ...nodePresentationProps(props),
    pickable,
    onHover,
    autoHighlight,
    highlightColor,
    getPolygon: (d: any) => d.polygon,
    getFillColor: isDark ? [24, 27, 31, 255] : [255, 255, 255, 255],
    getLineColor: (d: any) => {
      const c = d.properties?.style?.group?.color ?? d.properties?.style?.color; // kind (group) colour first
      return Array.isArray(c) ? [c[0], c[1], c[2], 255] : c ? toRGB4Array(c) : [128, 128, 128, 255];
    },
    getLineWidth: 2,
    lineWidthUnits: 'pixels',
    parameters: { depthTest: false },
    getFilterCategory: nodePresentationProps(props).getFilterCategory,
    filterCategories: props.effectiveVisibility?.groupCategories ?? [1],
    extensions: [new DataFilterExtension({ categorySize: 1 }), ...(props.positionTransform?.extensions ?? [])],
  });
};

export { NodesGeojsonLayer, MainLabelTextLayer, NodeCardLayer };

const positionTextSublayers = {
  characters: { type: PositionMultiIconLayer },
  background: { type: PositionTextBackgroundLayer },
};

function nodePresentationProps(props) {
  const visible = new Set(props.getVisLayers.getVisibleNamespaces());

  const properties = (d, info) =>
    d?.properties ?? props.biCol?.points?.properties?.[props.biCol?.points?.featureIds?.value?.[info?.index]];
  return {
    ...positionTransformProps(props.positionTransform, 'node', props),
    getFilterValue: (d, info) =>
      (props.effectiveVisibility?.namespace(properties(d, info)) ?? visible.has(properties(d, info)?.graph?.id))
        ? 1
        : 0,
    getFilterCategory: (d, info) => {
      const feature = properties(d, info);
      if (props.effectiveVisibility) return props.effectiveVisibility.groupCategory(feature);
      const eligible =
        feature?.style?.group?.groupIdx === undefined ||
        Array.from(props.getVisLayers.getCategories()[0]).includes(feature.style.group.groupIdx);
      return eligible ? 1 : 0;
    },
    filterRange: [1, 1],
    updateTriggers: {
      getFilterValue: props.effectiveVisibility?.key ?? [...visible],
      getFilterCategory: props.effectiveVisibility?.groupTrigger ?? props.getVisLayers.getCategories(),
    },
  };
}
