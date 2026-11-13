import { TextLayer } from '@deck.gl/layers';
import { EdgeLabelLayer } from './edge-label-layer';
import { DataFilterExtension } from '@deck.gl/extensions';
import { toRGB4Array } from '../utils/color';
import { isVisible } from '../utils/visibility';
import { BBOX_OUTLINE_COLOR } from '../../types/defaults';
import { getNsPrefixes } from '../../graph/utils/utils.graph';
import { colTypes } from '../../types/index';
import { Matrix4 } from '@math.gl/core';

const LineTextLayer = ({
  id = '',
  data,
  isDark,
  isMeters = false,
  getVisLayers,
  visible = true,
  type = 'nums',
  isLogic = false,
  layerShift = {},
  edgeLabels = false,
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
      units = isLogic ? 'common' : isMeters ? 'meters' : 'pixels';
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

  const isEdgeText = type === 'arcLabels' || type === 'routeLabels';
  const isRoute = type === 'routeLabels';
  const extensions = ['nums', 'bbox'].includes(type) ? [] : [new DataFilterExtension({ categorySize })];

  const modelMatrix = new Matrix4();
  for (const path of getNsPrefixes(id)) {
    const shift = layerShift[path];
    if (shift) {
      modelMatrix.translate([shift[0], shift[1], 0]);
    }
  }

  const LabelLayer = isEdgeText ? EdgeLabelLayer : TextLayer;
  return new LabelLayer({
    data,
    characterSet: 'auto',
    visible: Labels,
    ...(isEdgeText ? { modelMatrix } : {}),
    ...(isEdgeText ? { parameters: { depthTest: false } } : {}),
    ...(isEdgeText ? { edgeLabelsAlwaysOn: edgeLabels, arcLabels: !isRoute } : {}),
    pickable: false,
    id: colTypes.Text + '-' + type + id,
    getText: (d: any) => {
      switch (type) {
        case 'bbox':
          return d.text;
          break;
        case 'nums':
        case 'routeLabels':
          return d.text;
          break;
        default: // arcLabels
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
        case 'routeLabels':
          return d.position;
          break;
        default: // arcLabels
          return d.sourcePosition;
          break;
      }
    },
    getFilterCategory: (d) => {
      const { style, layerName, graph, featSource } = (d.feature ?? d).properties || {};
      const groupIdx = style?.group?.groupIdx;
      return [groupIdx, layerName, graph?.id ?? featSource?.layerName];
    },
    filterCategories: categories,
    ...(extensions.length && { extensions }),
    getAngle: (d: any) => {
      return d.angle ?? 0;
    }, //,
    background: type !== 'bbox',
    backgroundBorderRadius: [3, 3, 3, 3],
    getBackgroundColor: isRoute
      ? (d: any): [number, number, number, number] =>
          d.kind === 'middle' ? opaque(d.color) : isDark ? [24, 27, 31, 235] : [255, 255, 255, 235]
      : type === 'bbox'
        ? toRGB4Array(BBOX_OUTLINE_COLOR)
        : isDark
          ? [0, 0, 0, 100]
          : [255, 255, 255, 100],
    ...(isRoute && {
      backgroundPadding: [4, 1],
      getBorderColor: (d: any) => (d.kind === 'middle' ? [0, 0, 0, 0] : opaque(d.color)),
      getBorderWidth: 1,
      fontWeight: 600,
    }),
    getAlignmentBaseline: type === 'bbox' ? 'top' : 'center', //isList ? dir === 'to'? 'top' : 'bottom' : 'center',
    //anchor: top,
    getTextAnchor: type === 'bbox' ? 'start' : 'middle',
    sizeUnits: units,
    // sizeScale: isList ? 1 : 1.1,
    //extensions: [new CollisionFilterExtension()],
    //collisionGroup: 'visualization',
    //collisionTestProps: {sizeScale: 40
    //},
    getSize: (d: any) => {
      switch (type) {
        case 'bbox':
          return 12;
          break;
        case 'unames':
          return 5;
          break;
        case 'nums':
          return 3;
          break;
        case 'routeLabels':
          return d.fontSize ?? 10;
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
          return d.color ?? (isDark ? [220, 220, 220, 255] : [60, 60, 60, 255]);
          break;
        case 'nums':
          return toRGB4Array(d.color);
          break;
        case 'routeLabels':
          return d.kind === 'middle' || isDark ? [255, 255, 255, 255] : [30, 30, 30, 255];
          break;
        default: // arc labels
          return isDark ? [255, 255, 255, 200] : [0, 0, 0, 200];
      }
    },
  });
};

const opaque = (c: number[] = [128, 128, 128]): [number, number, number, number] => [c[0], c[1], c[2], 255];

export { LineTextLayer };
