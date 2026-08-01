import { TextLayer } from '@deck.gl/layers';
import { DataFilterExtension } from '@deck.gl/extensions';
import { toRGB4Array } from '../utils/color';
import { isVisible } from '../utils/visibility';
import { BBOX_OUTLINE_COLOR } from '../../types/defaults';
import { colTypes } from '@mapgl/panel-core/types';
import { Matrix4 } from '@math.gl/core';

export const EDGE_LABEL_DIM_OPACITY = 0;//.18;

const LineTextLayer = ({
  id = '',
  data,
  baseLayer,
  theme,
  options,
  getVisLayers,
  visible,
  type = 'nums',
  isLogic = false,
  layerShift = {},
}) => {
  let units: any = 'pixels';
  switch (type) {
    case 'unames':
      break;
    case 'bbox':
    case 'nums':
      units = 'meters';
      break;
    default: // list1 or list2
      units = isLogic ? 'common' : options.common?.isMeters ? 'meters' : 'pixels';
      break;
  }

  // 'arcLabels'
  const cats = getVisLayers.getCategories();
  const add = cats[1];
  const categories = cats.concat([add]);
  const categorySize = 3;

  const Labels =
    visible &&
    isVisible(getVisLayers, {
      index: null,
      name: colTypes.Label,
      group: colTypes.Label,
    });
  const lTheme = baseLayer?.options?.config?.theme;
  const isAuto = !lTheme || lTheme === 'auto';
  const isDark = isAuto ? theme.isDark : lTheme === 'dark';

  const extensions = ['nums', 'bbox'].includes(type) ? [] : [new DataFilterExtension({ categorySize })];

  const modelMatrix = new Matrix4();
  const parts = id.split('.');
  let path = '';
  for (let i = 0; i < parts.length; i++) {
    path = path ? `${path}.${parts[i]}` : parts[i];

    const shift = layerShift[path];
    if (shift) {
      modelMatrix.translate([shift[0], shift[1], 0]);
    }
  }

  return new TextLayer({
    data,
    visible: ['nums', 'bbox'].includes(type) || Labels,
    ...(type === 'arcLabels' ? { modelMatrix } : {}),
    ...(type === 'arcLabels' ? { parameters: { depthTest: false } } : {}),
    ...(type === 'arcLabels' ? { opacity: EDGE_LABEL_DIM_OPACITY } : {}),
    pickable: false,
    id: colTypes.Text + '-' + type + id,
    getText: (d: any) => {
      switch (type) {
        case 'bbox':
          return d.text;
          break;
        case 'nums':
          return d.text;
          break;
        default: // arcLabels
          if (d.skip) {
            return '';
          }
          return d.properties?.edgeStyle.text;
          break;
      }
    },
    getPosition: (d: any) => {
      switch (type) {
        case 'bbox':
          return d.coordinates;
          break;
        case 'nums':
          return [d.coordinates[0], d.coordinates[1] - 0.00005];
          break;
        default: // arcLabels
          return d.midPoint;
          break;
      }
    },
    getFilterCategory: (d) => {
      const { style, layerName, graph, featSource } = d.properties || {};
      const groupIdx = style?.group?.groupIdx;
      return [groupIdx, layerName, graph?.id ?? featSource?.layerName];
    },
    filterCategories: categories,
    ...(extensions.length && { extensions }),
    getAngle: (d: any) => {
      return d.angle ?? 0;
    }, //,
    background: true,
    backgroundBorderRadius: [3, 3, 3, 3],
    getBackgroundColor:
      type === 'bbox' ? toRGB4Array(BBOX_OUTLINE_COLOR) : isDark ? [0, 0, 0, 100] : [255, 255, 255, 100],
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
          return 50;
          break;
        case 'unames':
          return 5;
          break;
        case 'nums':
          return 3;
          break;
        default:
          const edgeStyle = d.properties?.edgeStyle;
          const fontSize = edgeStyle?.textConfig?.fontSize;
          return fontSize ?? 13;
      }
    },
    getColor: (d: any) => {
      switch (type) {
        case 'bbox':
          return isDark ? [0, 0, 0, 200] : [0, 0, 0, 200];
          break;
        case 'nums':
          return toRGB4Array(d.color);
          break;
        default: // arc labels
          return isDark ? [255, 255, 255, 200] : [0, 0, 0, 200];
      }
    },
  });
};

export { LineTextLayer };
