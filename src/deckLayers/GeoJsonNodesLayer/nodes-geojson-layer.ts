import { getTintedSvgIcon, isVisible, resolveSvgTintMode, toRgbaString } from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers';
import { CollisionFilterExtension, DataFilterExtension } from '@deck.gl/extensions';

import { createDonutChart, getDonutIconSrcSize, getPackedSvgIcon, svgToDataURL } from '../OrthoLayer/donutChart';
import {
  getFittedIconSize,
  getResolvedIconSize,
  getResolvedPointRadius,
  getResolvedTextPixelOffset,
} from '../nodeGeometry';
import { colTypes } from 'mapLib/utils';

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
    getVisLayers,
    panel,
    visible
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

  const units = options.common?.isMeters ? 'meters' : 'pixels';
  const categories = getVisLayers.getCategories();
  const categorySize = 2;

  const isMeterSizing = units === 'meters';

  const getNodeIconSize = (d) => {
    const targetBoxSize = getResolvedIconSize(d, getSelectedNode?.id);
    const { group, arcs } = d.properties?.style || {};

    if (isLogic && arcs?.length) {
      return targetBoxSize;
    }

    const iconName = group?.iconName;
    const svgIcon = iconName && svgIcons[iconName];
    return getFittedIconSize(targetBoxSize, svgIcon?.width, svgIcon?.height);
  };

  const getNodeTextPixelOffset = (d) => {
    if (isMeterSizing && !isLogic) {
      return [0, 0];
    }

    return getResolvedTextPixelOffset(d, getSelectedNode?.id, { gap: 0 });
  };

  return new GeoJsonLayer({
    id: biCol.graph.id + '-view',
    visible,
    highlightColor,
    onHover,
    data: biCol,
    // parameters: {
    //   depthTest: false
    // },
    pointType: isLogic ? 'circle+text' : 'circle+icon+text',
    getText: (d: any) => d.properties?.style?.text,
    getTextAlignmentBaseline: isLogic ? 'center' : 'top',
    getTextAnchor: isLogic ? 'middle' : 'middle',
    getTextPixelOffset: getNodeTextPixelOffset,
    getTextSize: (d) => {
      const size = d.properties.style?.textConfig?.fontSize;
      return size ?? 12;
    },
    stroked: false,
    getPointRadius: (d) => {
      return getResolvedPointRadius(d, getSelectedNode?.id);
    },
    getIcon: (d) => {
      const { group, arcs } = d.properties.style || {};
      const iconName = group?.iconName;
      const svgIcon = iconName && svgIcons[iconName];
      const tintColor = group?.color ? toRgbaString(group.color) : d.properties?.thrColor;
      const requestedTintMode = group?.svgTintMode ?? 'none';
      const resolvedTintMode = resolveSvgTintMode(svgIcon, requestedTintMode);
      const tintedSvgIcon = getTintedSvgIcon(
        svgIcon,
        tintColor,
        {
          mode: resolvedTintMode,
        }
      );

      if (isLogic && arcs?.length) {
        const colorCounts = {};
        arcs.forEach((color) => {
          colorCounts[color] = {
            count: 1 / arcs.length,
          };
        });
        const iconSize = getNodeIconSize(d);
        const packedIconSize = getDonutIconSrcSize(iconSize);
        const icon = {
          url: svgToDataURL(
            createDonutChart({
              colorCounts,
              stripeCounts: undefined,
              allTotal: arcs.length,
              bkColor: undefined,
              radius: iconSize / 2,
              isDark: theme.isDark,
              svgIcon: tintedSvgIcon,
            })
          ),
          width: packedIconSize,
          height: packedIconSize,
        };
        return icon;
      } else if (tintedSvgIcon) {
        const packedSvgIcon = getPackedSvgIcon(
          tintedSvgIcon,
          getDonutIconSrcSize(getResolvedIconSize(d, getSelectedNode?.id))
        );
        return {
          url: packedSvgIcon?.svgDataUrl ?? tintedSvgIcon.svgDataUrl,
          width: packedSvgIcon?.width ?? tintedSvgIcon.width,
          height: packedSvgIcon?.height ?? tintedSvgIcon.height,
          id: `${iconName}:${resolvedTintMode}:${tintColor ?? 'base'}`,
        };
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
      const offset = style?.group.offset;
      return [0, offset ?? 0];
    },
    getIconSize: (d) => {
      return getNodeIconSize(d);
    },
    parameters: {
      depthTest: false,
    },
    getFilterCategory: (d) => {
      const { style, layerName } = d.properties || {};
      const groupIdx = style?.group.groupIdx;
      return categorySize > 1 ? [groupIdx, layerName] : groupIdx;
    },
    filterCategories: categories,
    extensions: [new DataFilterExtension({ categorySize })],
    _subLayerProps: {
      'points-text': {
        visible: Labels,
        //filterCategories: categories,
        extensions:
          units === 'meters'
            ? [new CollisionFilterExtension(), new DataFilterExtension({ categorySize })]
            : [new DataFilterExtension({ categorySize })],
        sizeUnits: units,
        // collisionTestProps: {
        //   sizeScale: 3,
        // },
        // unexpected effect with this on - some text invisible
        // fontSettings: {sdf: true},
      },
      'points-icon': {
        visible: SVG,
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
      },
      'points-circle': {
        sizeUnits: units,
        radiusUnits: units,
        visible: Circle,
        opacity: biCol.opacity,
        extensions: [new CollisionFilterExtension(), new DataFilterExtension({ categorySize })],
        collisionGroup: 'nodes-circle',
        collisionTestProps: {
          sizeScale: 1,
        },
      },
    },
    // Styles
    filled: true,

    // Interactive props
    pickable,
    pickingDepth: 0,
    autoHighlight: true,
  });
};

export { NodesGeojsonLayer };
