
import { TextLayer } from '@deck.gl/layers';
// @ts-ignore
import {CollisionFilterExtension, DataFilterExtension} from '@deck.gl/extensions';
import {isVisible, toRGB4Array} from "../../utils";
import {toJS} from "mobx";
import {colTypes, BBOX_OUTLINE_COLOR, DEFAULT_NUMS_COLOR} from "mapLib/utils";
import {Matrix4} from "@math.gl/core";

const LineTextLayer = ({ id = '', data, baseLayer, theme, options, getVisLayers, visible, type = 'nums'}) => {
  let units
  switch (type) {
    case 'unames':
      break;
    case 'bbox':
    case 'nums':
      units = 'meters'
      break;
    default:  // list1 or list2
      units = options.common?.isMeters ? "meters" : "pixels"
      break;
  }

  // 'arcLabels'
    const categories = getVisLayers.getCategories()
    const categorySize = 1


  const Labels = visible && isVisible(getVisLayers, {index: null, name: colTypes.Label, group: colTypes.Label})
  const lTheme = baseLayer?.options?.config?.theme
  const isAuto = !lTheme || lTheme === 'auto'
  const isDark = isAuto ? theme.isDark : lTheme === 'dark'

  const extensions = ['nums', 'bbox'].includes(type) ? [] : [new DataFilterExtension({categorySize})]


  return new TextLayer({
    data,
    visible: ['nums', 'bbox'].includes(type) || Labels,
    pickable: false,
    id: colTypes.Text + '-' + type + id,
    getText: (d: any) => {
      switch (type) {
        case 'bbox':
          return d.text
          break;
        case 'nums':
          return d.text
          break;
        default:  // arcLabels
          return d.properties?.edgeStyle.text
          break;
      }
    },
    // @ts-ignore
    getPosition: (d: any) => {
      switch (type) {
        case 'bbox':
          return d.coordinates
          break;
        case 'nums':
          return [d.coordinates[0], d.coordinates[1] - 0.00005]
          break;
        default:  // arcLabels
          return d.midPoint
          break;
      }
    },
    getFilterCategory: d => {
      const {style, layerName, root} = d.properties || {}
      return [layerName]
    },
    filterCategories: categories,
      ...(extensions.length && {extensions}),
    getAngle: (d: any) => {
      return d.angle ?? 0
    }, //,
    background: true,
    backgroundBorderRadius: [3,3,3,3],
    getBackgroundColor: type === 'bbox' ? toRGB4Array(BBOX_OUTLINE_COLOR) : (isDark ? [0, 0, 0, 100] : [255, 255, 255, 100]),
    getAlignmentBaseline: type === 'bbox' ? 'top' : 'center', //isList ? dir === 'to'? 'top' : 'bottom' : 'center',
    //anchor: top,
    getTextAnchor: 'middle', //isList ? 'start':'middle',
    sizeUnits: units,
    // sizeScale: isList ? 1 : 1.1,
    //extensions: [new CollisionFilterExtension()],
    //collisionGroup: 'visualization',
    //collisionTestProps: {sizeScale: 40
    //},
    getSize: (d: any) => {
      switch (type) {
        case 'bbox':
          return 50
          break;
        case 'unames':
          return 5
          break;
        case 'nums':
          return 3
          break;
        default:
          const edgeStyle = d.properties?.edgeStyle
          const fontSize = edgeStyle?.textConfig?.fontSize
          return fontSize ?? 13
      }
    },
    getColor: (d: any) => {
      switch (type) {
        case 'bbox':
          return isDark ? [0, 0, 0, 200] : [0, 0, 0, 200]
          break;
        case 'nums':
          return toRGB4Array(d.color)
          break;
        default:  // arc labels
          return isDark ? [255, 255, 255, 200] : [0, 0, 0, 200]
      }
    }})

}

export { LineTextLayer };
