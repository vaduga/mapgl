import {IconLayer} from '@deck.gl/layers';
import {DataFilterExtension} from '@deck.gl/extensions';
import {Geometry, Position} from 'geojson';
import {iconAtlas, iconMapping} from './arrow-atlas';
import {toRGB4Array} from '../../utils';
import {colTypes, DeckLine, PointFeatureProperties, RGBAColor, ALERTING_STATES} from 'mapLib/utils';

type ArrowFeature = DeckLine<Geometry, PointFeatureProperties>;
type ArrowPlacement = 'start' | 'end';
type ArrowItem = {
  feature: ArrowFeature;
  placement: ArrowPlacement;
  lineIndex: number;
  angle?: number;
};

function getLastPoints(d: ArrowFeature): {base: Position; tip: Position} | null {
  const coords = d?.geometry?.coordinates;
  if (!coords || !coords.length) return null;

  const lastLine = coords[coords.length - 1];
  if (!lastLine || lastLine.length < 2) return null;

  const tip = lastLine[lastLine.length - 1];
  const base = lastLine[lastLine.length - 2];
  return {base, tip};
}

function getFirstPoints(d: ArrowFeature): {base: Position; tip: Position} | null {
  const coords = d?.geometry?.coordinates;
  if (!coords || !coords.length) return null;

  const firstLine = coords[0];
  if (!firstLine || firstLine.length < 2) return null;

  // Reverse direction so the arrow points toward the start
  const tip = firstLine[0];
  const base = firstLine[1];
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
  placement: ArrowPlacement,
  isGeo: boolean
): number {
  const pts = placement === 'start' ? getFirstPoints(d) : getLastPoints(d);
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

function expandArrowItems(data: ArrowFeature[] = []): ArrowItem[] {
  const items: ArrowItem[] = [];

  data.forEach((feature, lineIndex) => {
    const arrow = feature?.properties?.edgeStyle?.arrow;
    const angles = feature?.properties?.arrowAngles;

    if (arrow === 1) {
      items.push({feature, placement: 'end', lineIndex, angle: angles?.end});
      return;
    }

    if (arrow === -1) {
      items.push({feature, placement: 'start', lineIndex, angle: angles?.start});
      return;
    }

    if (arrow === 2) {
      items.push({feature, placement: 'start', lineIndex, angle: angles?.start});
      items.push({feature, placement: 'end', lineIndex, angle: angles?.end});
      return;
    }
  });

  return items;
}

export const EdgeArrowLayer = (props) => {
  const {
    srcGraphId,
    getSelectedIdxs,
    linesCollection,
    options,
    visible,
    isLogic,
    getVisLayers,
    getGroupsLegend,
    time,
  } = props;

  const selectedFeatureIndexes = getSelectedIdxs?.get(colTypes.Edges)?.[srcGraphId] ?? []

  const categories = getVisLayers.getCategories();
  const categorySize = 1;

  const baseData = Array.isArray(linesCollection)
    ? linesCollection
    : linesCollection?.features ?? [];
  const arrowData = expandArrowItems(baseData);
  const units = options.common?.isMeters ? "meters" : "pixels"

  return new IconLayer({
    id: colTypes.Edges + '-arrow-' + srcGraphId,
    data: arrowData,
    visible,
    pickable: false,
    billboard: false,
//@ts-ignore
    getPosition: (d: ArrowItem) => {
      const pts = d.placement === 'start' ? getFirstPoints(d.feature) : getLastPoints(d.feature);
      return pts ? pts.tip : [0, 0];
    },
    getAngle: (d: ArrowItem) => d.angle ?? getArrowAngle(d.feature, d.placement, !isLogic),
    getSize: (d: ArrowItem) =>
      getArrowSize(d.feature) * (selectedFeatureIndexes.includes(d.lineIndex) ? 2 : 1),
    getColor: (d: ArrowItem) => getArrowColor(d.feature, getGroupsLegend),

    iconAtlas,
    iconMapping,
    getIcon: () => 'triangle-n',

    sizeUnits: units,
    sizeScale: 1,
    sizeMinPixels: 1,
    sizeMaxPixels: 30,
    depthTest: false,

    getFilterCategory: (d: ArrowItem) => {
      const {layerName} = d.feature?.properties || {};
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
