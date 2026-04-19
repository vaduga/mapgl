import { getTintedSvgIcon, isVisible, resolveSvgTintMode, toRgbaString } from '../../utils';
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers';
import { CollisionFilterExtension, DataFilterExtension } from '@deck.gl/extensions';

import { createDonutChart, getDonutIconSrcSize, getPackedSvgIcon, svgToDataURL } from '../OrthoLayer/donutChart';
import {
  getFittedIconSize,
  getMaxResolvedIconSize,
  getResolvedIconSize,
  getResolvedPointRadius,
  getResolvedTextPixelOffset,
} from '../nodeGeometry';
import { colTypes } from 'mapLib/utils';

type LogicTextDatum = {
  coordinates: [number, number];
  properties: any;
  pointIndex: number;
};

type LogicTextLayerCache = {
  featureIdsRef: any;
  positionsRef: any;
  propertiesRef: any;
  selectedNodeId?: string;
  indexByLocName: Map<string, number>;
  labelData: LogicTextDatum[];
  placeholderData: LogicTextDatum[];
  labelYOffset: Float32Array;
  placeholderBoxSide: Float32Array;
};

const logicTextLayerCache = new WeakMap<object, LogicTextLayerCache>();
const nodeIconCache = new WeakMap<object, Map<string, any>>();
const DEBUG_DISABLE_NODE_CACHE = false;

const getFeatureWrapper = (properties: any) => ({ properties });

const getLabelYOffset = (properties: any, selectedNodeId?: string) => {
  return getResolvedTextPixelOffset(getFeatureWrapper(properties), selectedNodeId, { gap: 2 })[1];
};

const getPlaceholderBoxSide = (properties: any, selectedNodeId?: string) => {
  return (getResolvedPointRadius(getFeatureWrapper(properties), selectedNodeId) * 2) / Math.SQRT2;
};

const buildLogicTextLayerCache = (biCol: any, selectedNodeId?: string): LogicTextLayerCache => {
  const featureIds = biCol?.points?.featureIds?.value;
  const positions = biCol?.points?.positions?.value;
  const properties = biCol?.points?.properties;
  const count = featureIds?.length ?? 0;
  const indexByLocName = new Map<string, number>();
  const labelData: LogicTextDatum[] = [];
  const placeholderData: LogicTextDatum[] = [];
  const labelYOffset = new Float32Array(count);
  const placeholderBoxSide = new Float32Array(count);

  if (featureIds && positions && properties) {
    for (let i = 0; i < count; i++) {
      const featureProps = properties[featureIds[i]];
      const locName = featureProps?.locName;
      if (locName) {
        indexByLocName.set(locName, i);
      }

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
    featureIdsRef: featureIds,
    positionsRef: positions,
    propertiesRef: properties,
    selectedNodeId,
    indexByLocName,
    labelData,
    placeholderData,
    labelYOffset,
    placeholderBoxSide,
  };
};

const syncLogicTextLayerCache = (biCol: any, selectedNodeId?: string) => {
  if (DEBUG_DISABLE_NODE_CACHE) {
    return buildLogicTextLayerCache(biCol, selectedNodeId);
  }

  const featureIds = biCol?.points?.featureIds?.value;
  const positions = biCol?.points?.positions?.value;
  const properties = biCol?.points?.properties;
  const cached = logicTextLayerCache.get(biCol);

  const needsRebuild =
    !cached ||
    cached.featureIdsRef !== featureIds ||
    cached.positionsRef !== positions ||
    cached.propertiesRef !== properties ||
    cached.labelYOffset.length !== (featureIds?.length ?? 0);

  if (needsRebuild) {
    const rebuilt = buildLogicTextLayerCache(biCol, selectedNodeId);
    logicTextLayerCache.set(biCol, rebuilt);
    return rebuilt;
  }

  if (cached.selectedNodeId === selectedNodeId) {
    return cached;
  }

  const idsToUpdate = new Set<string>();
  if (cached.selectedNodeId) {
    idsToUpdate.add(cached.selectedNodeId);
  }
  if (selectedNodeId) {
    idsToUpdate.add(selectedNodeId);
  }

  for (const locName of idsToUpdate) {
    const pointIndex = cached.indexByLocName.get(locName);
    if (pointIndex === undefined) {
      continue;
    }
    const featureProps = properties?.[featureIds[pointIndex]];
    cached.labelYOffset[pointIndex] = getLabelYOffset(featureProps, selectedNodeId);
    cached.placeholderBoxSide[pointIndex] = getPlaceholderBoxSide(featureProps, selectedNodeId);
  }

  cached.selectedNodeId = selectedNodeId;
  return cached;
};

const getNodeIconCache = (biCol: any) => {
  if (DEBUG_DISABLE_NODE_CACHE) {
    return new Map();
  }

  let cache = nodeIconCache.get(biCol);
  if (!cache) {
    cache = new Map();
    nodeIconCache.set(biCol, cache);
  }
  return cache;
};

const NodesGeojsonLayer = (props) => {
  const {
    biCol,
    pickable,
    getSelectedNode,
    onHover,
    highlightColor,
    options,
    svgIcons,
    theme,
    isLogic,
    isHyper,
    onSvgIconReady,
    getVisLayers,
    panel,
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

  const iconCache = getNodeIconCache(biCol);

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

  return new GeoJsonLayer({
    id: biCol.graph.id + `-view${idSuffix}`,
    visible,
    highlightColor,
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
      const { group, arcs } = d.properties.style || {};
      const iconName = group?.iconName;
      const svgIcon = iconName && svgIcons[iconName];
      const tintColor = group?.color ? toRgbaString(group.color) : d.properties?.thrColor;
      const requestedTintMode = group?.svgTintMode ?? 'none';
      const resolvedTintMode = resolveSvgTintMode(svgIcon, requestedTintMode);
      const tintedSvgIcon = getTintedSvgIcon(svgIcon, tintColor, {
        mode: resolvedTintMode,
        onReady: onSvgIconReady,
      });

      if (isLogic && arcs?.length) {
        const maxIconSize = getMaxResolvedIconSize(d);
        const packedIconSize = getDonutIconSrcSize(maxIconSize)

        const donutCacheKey = `donut:${iconName ?? 'none'}:${resolvedTintMode}:${tintColor ?? 'base'}:${packedIconSize}:${(
          arcs as string[]
        ).join('|')}`;
        const cachedDonut = iconCache.get(donutCacheKey);
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
          url: svgToDataURL(
            createDonutChart({
              colorCounts,
              stripeCounts: undefined,
              allTotal: arcs.length,
              bkColor: undefined,
              radius: maxIconSize / 2,
              isDark: theme.isDark,
              svgIcon: tintedSvgIcon
            })
          ),
          width: packedIconSize,
          height: packedIconSize,
        };
        iconCache.set(donutCacheKey, icon);
        return icon;
      } else if (tintedSvgIcon) {
        const maxIconSize = getMaxResolvedIconSize(d);
        const packedIconSize = getDonutIconSrcSize(maxIconSize);
        const iconWidth = tintedSvgIcon.width;
        const iconHeight = tintedSvgIcon.height;
        const cacheKey = `svg:${iconName ?? 'none'}:${resolvedTintMode}:${tintColor ?? 'base'}:${packedIconSize}:${iconWidth ?? 'auto'}x${iconHeight ?? 'auto'}`;
        const cachedSvg = iconCache.get(cacheKey);
        if (cachedSvg) {
          return cachedSvg;
        }

        const packedSvgIcon = getPackedSvgIcon(tintedSvgIcon, packedIconSize) ?? tintedSvgIcon;
        const icon = {
          url: packedSvgIcon.svgDataUrl,
          width: packedSvgIcon.width,
          height: packedSvgIcon.height,
          id: `${iconName}:${resolvedTintMode}:${tintColor ?? 'base'}:${packedIconSize}:${packedSvgIcon.width ?? 'auto'}x${packedSvgIcon.height ?? 'auto'}`,
        };
        iconCache.set(cacheKey, icon);
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
        // loadOptions: {
        //   imagebitmap: {
        //     resizeWidth: 128,
        //     resizeHeight: 128
        //   }
        // },
        // updateTriggers: {
        //   getIcon: [svgIcons, updHost]},
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
          getSize: [selectedNodeId],
        },
      },
      'points-circle': {
        sizeUnits: units,
        radiusUnits: units,
        visible: Circle,
        opacity: biCol.opacity,
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
    autoHighlight: !isLabelTextMode,
  });
};

export { NodesGeojsonLayer };

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
    ignoreSelectionSizing = false,
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
  const cache = syncLogicTextLayerCache(biCol, selectedNodeId);

  return new TextLayer({
    id: `${biCol.graph.id}-view-placeholder-text`,
    data: cache.placeholderData,
    visible: visible && Labels,
    pickable,
    onHover,
    autoHighlight,
    sizeUnits: units,
    getText: () => '-\n-',
    getColor: [240,240,240,50],
    getPosition: (d: any) => d.coordinates,
    getPixelOffset: (d: any) => {
      const offset = d.properties?.style?.group?.offset;
      return [0, offset ?? 0];
    },
    getContentBox: (d: any) => {
      const side = cache.placeholderBoxSide[d.pointIndex] ?? 0;
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
  const { biCol, getVisLayers, visible, getSelectedNode, options, isLogic, pickable, onHover, autoHighlight, highlightColor } =
    props;
  const Labels = isVisible(getVisLayers, {
    index: null,
    name: colTypes.Label,
    group: colTypes.Label,
  });
  const categories = getVisLayers.getCategories();
  const categorySize = 2;
  const units = isLogic ? 'common' : options.common?.isMeters ? 'meters' : 'pixels';

  const selectedNodeId = getSelectedNode?.id;
  const cache = syncLogicTextLayerCache(biCol, selectedNodeId);
  const labelData = cache.labelData as LogicTextDatum[] & { attributes?: Record<string, any> };
  labelData.attributes = {
    getColor: biCol?.points?.attributes?.getColor,
  };

  return new TextLayer({
    id: `${biCol.graph.id}-view-label-text`,
    data: labelData,
    visible: visible && Labels,
    pickable,
    onHover,
    autoHighlight,
    highlightColor,
    sizeUnits: units,
    getText: (d: any) => d.properties?.style?.text ?? ' ',
    getPosition: (d: any) => {
      const yOffset = cache.labelYOffset[d.pointIndex] ?? 0;
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

export { LogicMainLabelTextLayer };
