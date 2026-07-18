import { GeoJsonLayer, TextLayer } from '@deck.gl/layers';
import { CollisionFilterExtension, DataFilterExtension } from '@deck.gl/extensions';

import { createDonutChart, getNodeIconAtlasSourceSize, getPackedSvgIcon, svgToDataURL } from './donutChart';
import { getTintedSvgIcon, resolveSvgTintMode } from '../utils/svg';
import { isVisible } from '../utils/visibility';
import { toRgbaString } from '../utils/color';
import {
  getFittedIconSize,
  getMaxNodeIconSizesByVariant,
  getResolvedIconSize,
  getResolvedPointRadius,
  getResolvedTextPixelOffset,
} from './nodeGeometry';
import { colTypes } from '@mapgl/panel-core/types';
import { Matrix4 } from '@math.gl/core';

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
};

type NodeIconCache = {
  get(key: string): any;
  set(key: string, value: any): unknown;
};

const nodeIconCache = new WeakMap<object, Map<string, any>>();
const DEBUG_DISABLE_NODE_ICON_CACHE = false;
const ICON_CACHE_SOURCE_KEY = '__mapglIconCacheSource';
const disabledNodeIconCache: NodeIconCache = {
  get: () => undefined,
  set: () => disabledNodeIconCache,
};

const getFeatureWrapper = (properties: any) => ({ properties });

const getLabelYOffset = (properties: any, selectedNodeId?: string) => {
  return getResolvedTextPixelOffset(getFeatureWrapper(properties), selectedNodeId, { gap: 2 })[1];
};

const getPlaceholderBoxSide = (properties: any, selectedNodeId?: string) => {
  return (getResolvedPointRadius(getFeatureWrapper(properties), selectedNodeId) * 2) / Math.SQRT2;
};

const buildLogicTextLayerData = (biCol: any, selectedNodeId?: string): LogicTextLayerData => {
  const featureIds = biCol?.points?.featureIds?.value;
  const positions = biCol?.points?.positions?.value;
  const properties = biCol?.points?.properties;
  const count = featureIds?.length ?? 0;
  const labelData: LogicTextDatum[] = [];
  const placeholderData: LogicTextDatum[] = [];
  const labelYOffset = new Float32Array(count);
  const placeholderBoxSide = new Float32Array(count);

  if (featureIds && positions && properties) {
    for (let i = 0; i < count; i++) {
      const featureProps = properties[featureIds[i]];

      labelYOffset[i] = getLabelYOffset(featureProps, selectedNodeId);
      placeholderBoxSide[i] = getPlaceholderBoxSide(featureProps, selectedNodeId);

      const datum = {
        coordinates: [positions[i * 2], positions[i * 2 + 1]] as [number, number],
        properties: featureProps,
        pointIndex: i,
      };
      labelData.push(datum);

      const iconName = featureProps?.style?.group?.iconName;
      if (!iconName) {
        placeholderData.push(datum);
      }
    }
  }

  return {
    labelData,
    placeholderData,
    labelYOffset,
    placeholderBoxSide,
  };
};

const getNodeIconCache = (biCol: any): NodeIconCache => {
  if (DEBUG_DISABLE_NODE_ICON_CACHE) {
    return disabledNodeIconCache;
  }

  const cacheSource = biCol?.[ICON_CACHE_SOURCE_KEY] ?? biCol;
  let cache = nodeIconCache.get(cacheSource);
  if (!cache) {
    cache = new Map();
    nodeIconCache.set(cacheSource, cache);
  }
  return cache;
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

const getNodeIconVariantKey = ({
  iconName,
  tintMode,
  tintColor,
  arcs,
  isDonut,
}: {
  iconName?: string;
  tintMode: string;
  tintColor?: string;
  arcs?: Array<string | undefined>;
  isDonut: boolean;
}) => {
  if (!iconName && !isDonut) {
    return undefined;
  }

  return `${isDonut ? 'donut' : 'svg'}:${iconName ?? 'none'}:${tintMode}:${tintColor ?? 'base'}:${
    isDonut ? (arcs ?? []).join('|') : ''
  }`;
};

const NodesGeojsonLayer = (props) => {
  const {
    biCol,
    pickable,
    getSelectedNode,
    onHover,
    highlightColor,
    options,
    svgIconState,
    visRefresh,
    theme,
    isLogic,
    isRouted,
    onSvgIconReady,
    getVisLayers,
    panel,
    autoHighlight,
    visible,
    logicTextMode = 'single',
    pointTypeOverride,
    idSuffix = '',
  } = props;

  const Circle = isVisible(getVisLayers, {
    index: null,
    name: colTypes.Circle,
    group: colTypes.Circle,
  });
  const SVG = isVisible(getVisLayers, {
    index: null,
    name: colTypes.SVG,
    group: colTypes.SVG,
  });
  const Labels = isVisible(getVisLayers, {
    index: null,
    name: colTypes.Label,
    group: colTypes.Label,
  });

  const units = isLogic ? 'common' : options.common?.isMeters ? 'meters' : 'pixels';
  const categories = getVisLayers.getCategories();
  const categorySize = 2;
  const pointType = pointTypeOverride ?? 'circle+icon+text';
  const isPlaceholderTextMode = logicTextMode === 'placeholder';
  const isLabelTextMode = logicTextMode === 'label';
  const selectedNodeId = getSelectedNode?.id;
  const svgIcons = svgIconState?.icons ?? {};
  const svgIconRevision = svgIconState?.revision ?? 0;

  const iconCache = getNodeIconCache(biCol);

  const resolveNodeIconVariant = (properties: any) => {
    const { group, arcs } = properties?.style || {};
    const iconName = group?.iconName;
    const svgIcon = iconName && svgIcons[iconName];
    const requestedTintMode = group?.svgTintMode ?? 'none';
    const tintMode = resolveSvgTintMode(svgIcon, requestedTintMode);
    const requestedTintColor = group?.color ? toRgbaString(group.color) : properties?.thrColor;
    const tintColor = tintMode === 'none' ? undefined : requestedTintColor;
    const isDonut = Boolean(isLogic && arcs?.length);
    const key = getNodeIconVariantKey({ iconName, tintMode, tintColor, arcs, isDonut });

    return { key, iconName, svgIcon, tintMode, tintColor, arcs, isDonut };
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
    return resolveNodeIconVariant(properties).key;
  });
  // Reserve one additional entry for nodes without an SVG. Canvas tint uses a
  // base image while its rasterized variant is pending, so it needs two slots.
  const iconAtlasEntryCount = [...maxIconSizesByVariant.keys()].reduce((count, variantKey) => {
    return count + (variantKey.includes(':canvasTint:') ? 2 : 1);
  }, 1);
  const packedIconSize = getNodeIconAtlasSourceSize(iconAtlasEntryCount);

  const getNodeIconSize = (d) => {
    const targetBoxSize = getResolvedIconSize(d, selectedNodeId);
    const { group, arcs } = d.properties?.style || {};

    if (isLogic && arcs?.length) {
      return targetBoxSize;
    }

    const iconName = group?.iconName;
    const svgIcon = iconName && svgIcons[iconName];
    return getFittedIconSize(targetBoxSize, svgIcon?.width, svgIcon?.height);
  };

  const getPlaceholderTextSize = (d) => {
    const size = d.properties?.style?.size ?? 0;
    const r = size / 2;
    const r0 = Math.round(r * 0.73);
    return Math.round(r0 * 0.5);
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
      const offset = d.properties?.style?.group?.offset;
      return [0, offset ?? 0];
    }

    if (isLogic) {
      return getResolvedTextPixelOffset(d, selectedNodeId, { gap: 2 });
    }

    return getResolvedTextPixelOffset(d, selectedNodeId, { gap: 0 });
  };

  const modelMatrix = new Matrix4();
  const srcGraphId = biCol.graph.id;
  const parts = srcGraphId.split('.');
  let path = '';
  for (let i = 0; i < parts.length; i++) {
    path = path ? `${path}.${parts[i]}` : parts[i];
    const shift = props.layerShift?.[path];
    if (shift) {
      modelMatrix.translate([shift[0], shift[1], 0]);
    }
  }

  return new GeoJsonLayer({
    id: biCol.graph.id + `-view${idSuffix}`,
    visible,
    highlightColor,
    modelMatrix,
    onHover,
    data: biCol,
    // parameters: {
    //   depthTest: false
    // },
    pointType,
    getText: getNodeText,
    getTextAlignmentBaseline: isPlaceholderTextMode ? undefined : 'top',
    getTextAnchor: isPlaceholderTextMode ? undefined : 'middle',
    getTextPixelOffset: getNodeTextPixelOffset,
    getTextSize: (d) => {
      if (isPlaceholderTextMode) {
        return getPlaceholderTextSize(d);
      }
      const size = d.properties.style?.textConfig?.fontSize;
      return size ?? 12;
    },
    stroked: false,
    getPointRadius: (d) => {
      return getResolvedPointRadius(d, selectedNodeId);
    },
    getIcon: (d) => {
      const { key: variantKey, iconName, svgIcon, tintMode: resolvedTintMode, tintColor, arcs, isDonut } =
        resolveNodeIconVariant(d.properties);
      const tintedSvgIcon = getTintedSvgIcon(svgIcon, tintColor, {
        mode: resolvedTintMode,
        onReady: onSvgIconReady,
        renderSize: resolvedTintMode === 'canvasTint' ? packedIconSize : undefined,
      });
      const canvasTintPending = isCanvasTintPending(svgIcon, tintColor, resolvedTintMode, packedIconSize);
      const cacheState = canvasTintPending ? 'pending' : 'ready';

      if (isDonut) {
        const donutCacheKey = `${variantKey}:${cacheState}:${packedIconSize}`;
        const cachedDonut = canvasTintPending ? undefined : iconCache.get(donutCacheKey);
        if (cachedDonut) {
          return cachedDonut;
        }

        const colorCounts = {};
        arcs.forEach((color) => {
          colorCounts[color] = {
            count: 1,
          };
        });
        const icon = {
          id: donutCacheKey,
          url: svgToDataURL(
            createDonutChart({
              colorCounts,
              stripeCounts: undefined,
              allTotal: arcs.length,
              bkColor: undefined,
              radius: 50,
              sourceSize: packedIconSize,
              isDark: theme.isDark,
              svgIcon: tintedSvgIcon,
            })
          ),
          width: packedIconSize,
          height: packedIconSize,
        };
        if (!canvasTintPending) {
          iconCache.set(donutCacheKey, icon);
        }
        return icon;
      } else if (tintedSvgIcon) {
        const iconWidth = tintedSvgIcon.width;
        const iconHeight = tintedSvgIcon.height;
        const cacheKey = `svg:${iconName ?? 'none'}:${resolvedTintMode}:${cacheState}:${tintColor ?? 'base'}:${packedIconSize}:${iconWidth ?? 'auto'}x${iconHeight ?? 'auto'}`;
        const cachedSvg = canvasTintPending ? undefined : iconCache.get(cacheKey);
        if (cachedSvg) {
          return cachedSvg;
        }

        const packedSvgIcon =
          resolvedTintMode === 'canvasTint' && !canvasTintPending
            ? tintedSvgIcon
            : getPackedSvgIcon(tintedSvgIcon, packedIconSize) ?? tintedSvgIcon;
        const icon = {
          url: packedSvgIcon.svgDataUrl,
          width: packedSvgIcon.width,
          height: packedSvgIcon.height,
          id: `${variantKey}:${cacheState}:${packedIconSize}:${packedSvgIcon.width ?? 'auto'}x${packedSvgIcon.height ?? 'auto'}`,
        };
        if (!canvasTintPending) {
          iconCache.set(cacheKey, icon);
        }
        return icon;
      }
      // no custom svg icon loaded
      return {
        url: svgToDataURL(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">  
</svg>`),
        width: 1,
        height: 1,
        id: 'blank',
      };
    },
    iconSizeScale: 1,
    getIconPixelOffset: (d) => {
      const { style } = d.properties || {};
      if (isLogic && style?.arcs?.length) {
        return [0, 0];
      }
      const offset = style?.group.offset;
      return [0, offset ?? 0];
    },
    getIconSize: (d) => {
      return getNodeIconSize(d);
    },
    parameters: {
      depthTest: false,
    },
    updateTriggers: {
      getPointRadius: [selectedNodeId],
      getIcon: [svgIconRevision, visRefresh],
      getIconSize: [selectedNodeId],
      getTextPixelOffset: [selectedNodeId],
      getTextSize: [selectedNodeId],
    },
    getFilterCategory: (d) => {
      const { style, layerName } = d.properties || {};
      const groupIdx = style?.group.groupIdx;
      return [groupIdx, layerName];
    },
    filterCategories: categories,
    extensions: [new DataFilterExtension({ categorySize })],
    _subLayerProps: {
      'points-text': {
        visible: Labels,
        highlightColor,
        extensions: [new DataFilterExtension({ categorySize })],
        sizeUnits: units,
        updateTriggers: {
          getPixelOffset: [selectedNodeId],
          getSize: [selectedNodeId],
        },
        // unexpected effect with this on - some text invisible
        // fontSettings: {sdf: true},
      },
      'points-icon': {
        visible: SVG,
        highlightColor,
        extensions: [new CollisionFilterExtension(), new DataFilterExtension({ categorySize })],
        collisionGroup: 'nodes-icon',
        sizeUnits: units,
        // looks like props are shared across the group
        collisionTestProps: {
          sizeScale: 1,
        },
        alphaCutoff: -1,
        autoHighlight: false,
        updateTriggers: {
          getIcon: [svgIconRevision, visRefresh],
          getSize: [selectedNodeId],
        },
      },
      'points-circle': {
        sizeUnits: units,
        radiusUnits: units,
        visible: Circle,
        highlightColor,
        extensions: [new CollisionFilterExtension(), new DataFilterExtension({ categorySize })],
        collisionGroup: 'nodes-circle',
        pickable: true,
        collisionTestProps: {
          sizeScale: 1,
        },
        updateTriggers: {
          getRadius: [selectedNodeId],
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

const LogicPlaceholderTextLayer = (props) => {
  const {
    biCol,
    getVisLayers,
    visible,
    getSelectedNode,
    options,
    isLogic,
    pickable,
    onHover,
    autoHighlight,
    idSuffix = '',
  } = props;
  const Labels = isVisible(getVisLayers, {
    index: null,
    name: colTypes.Label,
    group: colTypes.Label,
  });
  const categories = getVisLayers.getCategories();
  const categorySize = 2;
  const units = isLogic ? 'common' : options.common?.isMeters ? 'meters' : 'pixels';

  const selectedNodeId = getSelectedNode?.id;
  const logicTextData = buildLogicTextLayerData(biCol, selectedNodeId);

  const modelMatrix = new Matrix4();
  const srcGraphId = biCol.graph.id;
  const parts = srcGraphId.split('.');
  let path = '';
  for (let i = 0; i < parts.length; i++) {
    path = path ? `${path}.${parts[i]}` : parts[i];
    const shift = props.layerShift?.[path];
    if (shift) {
      modelMatrix.translate([shift[0], shift[1], 0]);
    }
  }

  return new TextLayer({
    id: `${biCol.graph.id}-view-placeholder-text${idSuffix}`,
    data: logicTextData.placeholderData,
    visible: visible && Labels,
    modelMatrix,
    pickable,
    onHover,
    autoHighlight,
    sizeUnits: units,
    getText: () => '-\n-',
    getColor: [240, 240, 240, 50],
    getPosition: (d: any) => d.coordinates,
    getPixelOffset: (d: any) => {
      const offset = d.properties?.style?.group?.offset;
      return [0, offset ?? 0];
    },
    getContentBox: (d: any) => {
      const side = logicTextData.placeholderBoxSide[d.pointIndex] ?? 0;
      return [-side / 2, -side / 2, side, side];
    },
    contentCutoffPixels: [1, 1],
    contentAlignHorizontal: 'center',
    contentAlignVertical: 'center',
    getSize: (d: any) => {
      const size = d.properties?.style?.size ?? 0;
      const r = size / 2;
      const r0 = Math.round(r * 0.73);
      return Math.round(r0 * 0.5);
    },
    getFilterCategory: (d: any) => {
      const { style, layerName } = d.properties || {};
      return [style?.group?.groupIdx, layerName];
    },
    updateTriggers: {
      getContentBox: [selectedNodeId],
    },
    filterCategories: categories,
    extensions: [new DataFilterExtension({ categorySize })],
  });
};

export { LogicPlaceholderTextLayer };

const LogicMainLabelTextLayer = (props) => {
  const {
    biCol,
    getVisLayers,
    visible,
    getSelectedNode,
    options,
    isLogic,
    pickable,
    onHover,
    autoHighlight,
    highlightColor,
    idSuffix = '',
  } = props;
  const Labels = isVisible(getVisLayers, {
    index: null,
    name: colTypes.Label,
    group: colTypes.Label,
  });
  const categories = getVisLayers.getCategories();
  const categorySize = 2;
  const units = isLogic ? 'common' : options.common?.isMeters ? 'meters' : 'pixels';

  const selectedNodeId = getSelectedNode?.id;
  const logicTextData = buildLogicTextLayerData(biCol, selectedNodeId);
  const labelData = logicTextData.labelData as LogicTextDatum[] & { attributes?: Record<string, any> };
  labelData.attributes = {
    getColor: biCol?.points?.attributes?.getColor,
  };

  const modelMatrix = new Matrix4();
  const srcGraphId = biCol.graph.id;
  const parts = srcGraphId.split('.');
  let path = '';
  for (let i = 0; i < parts.length; i++) {
    path = path ? `${path}.${parts[i]}` : parts[i];
    const shift = props.layerShift?.[path];
    if (shift) {
      modelMatrix.translate([shift[0], shift[1], 0]);
    }
  }


  return new TextLayer({
    id: `${biCol.graph.id}-view-label-text${idSuffix}`,
    data: labelData,
    visible: visible && Labels,
    modelMatrix,
    pickable,
    onHover,
    autoHighlight,
    highlightColor,
    sizeUnits: units,
    getText: (d: any) => d.properties?.style?.text ?? ' ',
    getPosition: (d: any) => {
      const yOffset = logicTextData.labelYOffset[d.pointIndex] ?? 0;
      return [d.coordinates[0], d.coordinates[1] + yOffset];
    },
    getSize: (d: any) => {
      const size = d.properties?.style?.textConfig?.fontSize;
      return size ?? 12;
    },
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'top',
    getFilterCategory: (d: any) => {
      const { style, layerName } = d.properties || {};
      return [style?.group?.groupIdx, layerName];
    },
    updateTriggers: {
      getPosition: [selectedNodeId],
      getColor: [biCol?.points?.attributes?.getColor?.value],
    },
    filterCategories: categories,
    extensions: [new DataFilterExtension({ categorySize })],
    _subLayerProps: {
      characters: {
        highlightColor,
      },
    },
  });
};

export { NodesGeojsonLayer, LogicMainLabelTextLayer, ICON_CACHE_SOURCE_KEY };
