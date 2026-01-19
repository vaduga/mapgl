import {
  isVisible,
} from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers';
import {CollisionFilterExtension, DataFilterExtension} from '@deck.gl/extensions';

import {createDonutChart, svgToDataURL} from "../OrthoLayer/donutChart";
import {colTypes} from "mapLib/utils";

const NodesGeojsonLayer = (props) => {
  const {
    biCol,
    pickable,
    getSelectedNode,
    onHover,
    highlightColor,
    options,
    svgIcons,
    isLogic,
    getVisLayers,
    visible
  } = props;

const Circle = isVisible(getVisLayers, {index: null, name: colTypes.Circle, group: colTypes.Circle});
const SVG =  isVisible(getVisLayers, {index: null, name: colTypes.SVG, group:colTypes.SVG});
const Labels =  isVisible(getVisLayers, {index: null, name: colTypes.Label, group:colTypes.Label});

const units = options.common?.isMeters ? "meters" : "pixels"

const categories = getVisLayers.getCategories()
const categorySize = 1

  return new GeoJsonLayer({
    id: biCol.graph.id+'-view',
    visible,
    highlightColor,
    onHover,
    data: biCol,
    // parameters: {
    //   depthTest: false
    // },
    pointType: isLogic ? 'circle+text' : 'circle+icon+text',
      getText: (d: any) => d.properties?.style?.text,
      getTextAlignmentBaseline: 'center',
      getTextPixelOffset: (d) => {
        if (isLogic) {
          const selId = getSelectedNode?.id
          const isHead = selId === d.properties.locName
          const size = d.properties.style?.size
          const diam =  isHead ? size * 1.3 : size
          return [0, diam/2*1.4]
        }
        let offsetX = 0
        let offsetY = 15
        // if (d.properties?.style?.textConfig) {
        //     ({offsetX, offsetY} = d.properties?.style?.textConfig)
        // }
        return [offsetX, offsetY]
      },
        getTextSize: (d) => {
          const size = d.properties.style?.textConfig?.fontSize
          return size ?? 12
        },
        stroked: false,
        getPointRadius: (d) => {
          const selId = getSelectedNode?.id
          const isHead = selId === d.properties.locName
          const {style} = d.properties
          const diam = style.size
          return isHead ? diam / 2 * 1.3 : diam / 2
        },
        getIcon: (d) => {
          const {group, arcs} = d.properties.style || {}
          const iconName = group?.iconName
          const svgIcon = iconName && svgIcons[iconName]

          if (isLogic && arcs?.length) {
            const colorCounts = {};
            arcs.forEach(color=>{
              colorCounts[color] = {
                count: 1/arcs.length}
            })
            const selId = getSelectedNode?.id
            const isHead = selId === d.properties.locName
            const size = d.properties.style?.size
            const diam =  isHead ? size * 1.3 : size
            const icon = {
              url: svgToDataURL(createDonutChart({
                colorCounts,
                radius: diam/2,
                userSvgUrl: svgIcon? svgIcon.svgDataUrl : null // embed user SVG
              })),
              width: diam*2,
              height: diam*2
            };
            return icon;
          } else if (svgIcon) {
              const {svgDataUrl, width, height} = svgIcon
              return {
                url: svgDataUrl,
                width, //128
                height, //128
                id: iconName
              };
          }
          // no custom svg icon loaded
          return {
            url: svgToDataURL(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">  
</svg>`),
            width: 1,
            height: 1,
            id: 'blank'
          };
        },
        iconSizeScale: 1,
        getIconPixelOffset: (d) => {
          const {style} = d.properties || {}
          const iconVOffset = style?.group.iconVOffset
          return [0, iconVOffset ?? -5]
        },
        getIconSize: (d) => {
          const selId = getSelectedNode?.id
          const {style, locName} = d.properties || {}
          const isHead = selId === locName
          if (isLogic) {
            const size = style?.size
            const diam =  isHead ? size * 1.3 : size
            return diam
          }
            const iconSize = style?.group.iconSize
            return iconSize ? isHead ? iconSize * 1.5 : iconSize : 30
      },
        parameters: {
          depthTest: false
        },
    getFilterCategory: d => {
      const {style, layerName} = d.properties || {}
      return layerName
    },
        filterCategories: categories,
        extensions: [new DataFilterExtension({categorySize})],
        _subLayerProps: {
          "points-text": {
            visible: Labels,
            //filterCategories: categories,
            extensions: [new DataFilterExtension({categorySize}), new CollisionFilterExtension()],
            //collisionGroup: 'text',
            sizeUnits: 'pixels',
            collisionTestProps:
                {
                  sizeScale: 3,
                },
            // unexpected effect with this on - some text invisible
            // fontSettings: {sdf: true},
          },
          "points-icon": {
            visible: SVG,
            // loadOptions: {
            //   imagebitmap: {
            //     resizeWidth: 128,
            //     resizeHeight: 128
            //   }
            // },
            // updateTriggers: {
            //   getIcon: [svgIcons, updHost]},
            extensions: [new CollisionFilterExtension(),new DataFilterExtension({categorySize})],
            collisionGroup: 'icons',
                sizeUnits: 'pixels',
            // looks like props are shared across the group
            collisionTestProps:
                {
                  sizeScale: 1,
                },
            alphaCutoff: -1,
            autoHighlight: false,
          },
          "points-circle": {
           sizeUnits: units,
           radiusUnits: units,
           visible: Circle,
           opacity: biCol.opacity,
           extensions: [new CollisionFilterExtension(), new DataFilterExtension({categorySize})],
            collisionGroup: 'circle',
            collisionTestProps:
                {
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
  })
}

export { NodesGeojsonLayer }


