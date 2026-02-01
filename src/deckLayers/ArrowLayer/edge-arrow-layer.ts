import {IconLayer} from '@deck.gl/layers';
import {DataFilterExtension} from '@deck.gl/extensions';
import {Geometry, Position} from 'geojson';
import {iconAtlas, iconMapping} from './arrow-atlas';
import {toRGB4Array} from '../../utils';
import {colTypes, DeckLine, PointFeatureProperties, RGBAColor, ALERTING_STATES} from 'mapLib/utils';

type ArrowFeature = DeckLine<Geometry, PointFeatureProperties>;

function getLastPoints(d: ArrowFeature): {base: Position; tip: Position} | null {
  const coords = d?.geometry?.coordinates;
  if (!coords || !coords.length) return null;

  const lastLine = coords[coords.length - 1];
  if (!lastLine || lastLine.length < 2) return null;

  const tip = lastLine[lastLine.length - 1];
  const base = lastLine[lastLine.length - 2];
  return {base, tip};
}

type Vec2 = [number, number];

function wrapDeltaLonDeg(dLon: number): number {
  // normalize to [-180, 180]
  if (dLon > 180) return dLon - 360;
  if (dLon < -180) return dLon + 360;
  return dLon;
}

function getArrowAngle(
    d: ArrowFeature,
    isGeo: boolean
): number {
  const pts = getLastPoints(d);
  if (!pts) return 0;

  const [bx, by] = pts.base as Vec2;
  const [tx, ty] = pts.tip as Vec2;

  // Cartesian (x/y): your original logic
  if (!isGeo) {
    const dx = tx - bx;
    const dy = ty - by;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  // Geo (lon/lat degrees): option C
  let dx = wrapDeltaLonDeg(tx - bx); // delta lon
  const dy = ty - by;                // delta lat

  const midLatRad = (((by + ty) / 2) * Math.PI) / 180;
  dx *= Math.cos(midLatRad);

  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function getArrowSize(d: ArrowFeature): number {
  const edgeSize = d?.properties?.edgeStyle?.size;
  if (typeof edgeSize === 'number') {
    const scaled = edgeSize * 6;
    return Math.max(8, Math.min(24, scaled));
  }
  return 12;
}

function getArrowColor(
  d: ArrowFeature,
  getGroupsLegend?: any,
): RGBAColor {
  const {edgeStyle, all_annots} = d.properties || {};
  const {color, group, opacity} = edgeStyle || {};

  if (all_annots && !getGroupsLegend?.at(-1)?.disabled) {
    const annotState = all_annots?.[0]?.newState;
    const aColor = annotState?.startsWith('Normal')
      ? ALERTING_STATES.Normal
      : annotState === 'Alerting'
      ? ALERTING_STATES.Alerting
      : ALERTING_STATES.Pending;
    return toRGB4Array(aColor, 1);
  }

  const c = group?.color ?? color ?? [0, 0, 0, 255];
  const muted = [...c] as RGBAColor;
  muted[3] = opacity !== undefined ? Math.round(opacity * 255) : muted[3];
  return muted;
}

export const EdgeArrowLayer = (props) => {
  const {
    srcGraphId,
    getSelectedIdxs,
    linesCollection,
    visible,
    isLogic,
    getVisLayers,
    getGroupsLegend,
    time,
  } = props;

  const selectedFeatureIndexes = getSelectedIdxs?.get(colTypes.Edges)?.[srcGraphId] ?? []

  const categories = getVisLayers.getCategories();
  const categorySize = 1;

  return new IconLayer({
    id: colTypes.Edges + '-arrow-' + srcGraphId,
    data: linesCollection?.features ?? linesCollection,
    visible,
    pickable: false,
    billboard: false,
//@ts-ignore
    getPosition: (d: ArrowFeature) => {
      const pts = getLastPoints(d);
      return pts ? pts.tip : [0, 0];
    },
    getAngle: (d: ArrowFeature) => getArrowAngle(d, !isLogic),
    getSize: (d: ArrowFeature, k) => getArrowSize(d) * (selectedFeatureIndexes.includes(k.index) ? 2 : 1),
    getColor: (d: ArrowFeature) => getArrowColor(d, getGroupsLegend),

    iconAtlas,
    iconMapping,
    getIcon: () => 'triangle-n',

    sizeUnits: 'pixels',
    sizeScale: 1,
    sizeMinPixels: 6,
    sizeMaxPixels: 30,
    depthTest: false,


    getFilterCategory: (d) => {
      const {layerName} = d.properties || {};
      return layerName;
    },
    filterCategories: categories,
    extensions: [new DataFilterExtension({categorySize})],

    updateTriggers: {
      getColor: time,
      getSize: time,
      getAngle: time,
    },
  });
};
