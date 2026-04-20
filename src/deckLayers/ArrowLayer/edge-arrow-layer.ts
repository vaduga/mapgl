import { IconLayer } from '@deck.gl/layers';
import { DataFilterExtension } from '@deck.gl/extensions';
import { Geometry } from 'geojson';
import { getIconAtlasImage, iconMapping } from './arrow-atlas';
import { toRGB4Array } from '../../utils';
import { colTypes, DeckLine, PointFeatureProperties, RGBAColor, ALERTING_STATES, getEdgeArrowSize } from 'mapLib/utils';
import type { Edge } from 'mapLib';

type ArrowFeature = DeckLine<Geometry, PointFeatureProperties>;
type ArrowPlacement = 'start' | 'end';
type ArrowItem = {
  feature: ArrowFeature;
  placement: ArrowPlacement;
  lineIndex: number;
  angle?: number;
  edgeId: string;
  properties: ArrowFeature['properties'];
};

function getArrowTip(d: ArrowFeature, placement: ArrowPlacement): [number, number] | null {
  const tip = d?.properties?.arrowTips?.[placement];
  return Array.isArray(tip) && tip.length >= 2 ? [tip[0] as number, tip[1] as number] : null;
}

function getArrowBaseAndTip(
  d: ArrowFeature,
  placement: ArrowPlacement
): { base: [number, number]; tip: [number, number] } | null {
  const pts = placement === 'start' ? getFirstPoints(d) : getLastPoints(d);
  if (!pts) {
    return null;
  }

  const arrowTip = getArrowTip(d, placement);
  if (!arrowTip) {
    return pts;
  }

  return { base: pts.tip, tip: arrowTip };
}

function getArrowAnchorPosition(d: ArrowFeature, placement: ArrowPlacement, isLogic: boolean): [number, number] | null {
  if (!isLogic) {
    const pts = placement === 'start' ? getFirstPoints(d) : getLastPoints(d);
    return pts ? pts.tip : null;
  }

  const pts = getArrowBaseAndTip(d, placement);
  return pts ? pts.tip : null;
}

function getLastPoints(d: ArrowFeature): { base: [number, number]; tip: [number, number] } | null {
  const coords = d?.geometry?.coordinates;
  if (!coords || !coords.length) {
    return null;
  }

  const lastLine = coords[coords.length - 1];
  if (!lastLine || lastLine.length < 2) {
    return null;
  }

  const tip = lastLine[lastLine.length - 1] as [number, number];
  const base = lastLine[lastLine.length - 2] as [number, number];
  return { base, tip };
}

function getFirstPoints(d: ArrowFeature): { base: [number, number]; tip: [number, number] } | null {
  const coords = d?.geometry?.coordinates;
  if (!coords || !coords.length) {
    return null;
  }

  const firstLine = coords[0];
  if (!firstLine || firstLine.length < 2) {
    return null;
  }

  // Reverse direction so the arrow points toward the start
  const tip = firstLine[0] as [number, number];
  const base = firstLine[1] as [number, number];
  return { base, tip };
}

type Vec2 = [number, number];

function wrapDeltaLonDeg(dLon: number): number {
  // normalize to [-180, 180]
  if (dLon > 180) {
    return dLon - 360;
  }
  if (dLon < -180) {
    return dLon + 360;
  }
  return dLon;
}

function getArrowAngle(d: ArrowFeature, placement: ArrowPlacement, isGeo: boolean): number {
  const pts = getArrowBaseAndTip(d, placement);
  if (!pts) {
    return 0;
  }

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
  const dy = ty - by; // delta lat

  const midLatRad = (((by + ty) / 2) * Math.PI) / 180;
  dx *= Math.cos(midLatRad);

  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function getArrowSize(d: ArrowFeature): number {
  return getEdgeArrowSize(d?.properties?.edgeStyle?.size);
}

function getArrowColor(d: ArrowFeature, getGroupsLegend?: any): RGBAColor {
  const { edgeStyle, all_annots } = d.properties || {};
  const { color, group, opacity } = edgeStyle || {};

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

function expandArrowItems(data: ArrowFeature[] = [], getWasmId2Edges: Edge[][]): ArrowItem[] {
  const items: ArrowItem[] = [];

  const createItem = (
    feature: ArrowFeature,
    edgeId: string,
    placement: ArrowPlacement,
    lineIndex: number,
    angle?: number
  ): ArrowItem => ({
    feature,
    placement,
    lineIndex,
    angle,
    edgeId,
    properties: feature.properties,
  });

  data.forEach((feature, lineIndex) => {
    const arrow = feature?.properties?.edgeStyle?.arrow;
    const angles = feature?.properties?.arrowAngles;
    const heIdx = feature?.heIdx;
    const hyperEdge = getWasmId2Edges[heIdx];
    const firstEdgeId = hyperEdge?.[0]?.id;
    const lastEdgeId = hyperEdge?.at(-1)?.id;

    if (!firstEdgeId || !lastEdgeId) {
      return;
    }

    if (arrow === 1) {
      items.push(createItem(feature, lastEdgeId, 'end', lineIndex, angles?.end));
      return;
    }

    if (arrow === -1) {
      items.push(createItem(feature, firstEdgeId, 'start', lineIndex, angles?.start));
      return;
    }

    if (arrow === 2) {
      items.push(createItem(feature, firstEdgeId, 'start', lineIndex, angles?.start));
      items.push(createItem(feature, lastEdgeId, 'end', lineIndex, angles?.end));
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
    panel,
    getVisLayers,
    getGroupsLegend,
    getWasmId2Edges,
    autoHighlight,
    highlightColor,
    time,
  } = props;

  const selectedFeatureIndexes = getSelectedIdxs?.get(colTypes.Edges)?.[srcGraphId] ?? [];

  const isLogic = panel.isLogic;
  const cats = getVisLayers.getCategories();
  const categories = cats.concat([cats[1]]);
  const categorySize = 3;

  const baseData = Array.isArray(linesCollection) ? linesCollection : (linesCollection?.features ?? []);
  const arrowData = expandArrowItems(baseData, getWasmId2Edges);
  const units = options.common?.isMeters ? 'meters' : 'pixels';
  const sizeUnits = isLogic ? 'common' : units;
  const sizeConstraintProps =
    sizeUnits === 'pixels'
      ? {
          sizeMinPixels: 1,
          sizeMaxPixels: 30,
        }
      : {};

  return new IconLayer({
    id: colTypes.Edges + '-arrow-' + srcGraphId,
    data: arrowData,
    visible,
    pickable: true,
    autoHighlight,
    highlightColor,
    billboard: false,
    getPosition: (d: ArrowItem) => {
      const pos = getArrowAnchorPosition(d.feature, d.placement, isLogic);
      return pos ?? [0, 0];
    },
    getAngle: (d: ArrowItem) => getArrowAngle(d.feature, d.placement, !isLogic),
    getSize: (d: ArrowItem) => getArrowSize(d.feature) * (selectedFeatureIndexes.includes(d.lineIndex) ? 1.2 : 1),
    getColor: (d: ArrowItem) => getArrowColor(d.feature, getGroupsLegend),

    // Deck typings in this build are stricter than runtime support for HTMLImageElement.
    iconAtlas: getIconAtlasImage() as any,
    iconMapping,
    getIcon: () => (isLogic && sizeUnits === 'pixels' ? 'triangle-n-ex' : 'triangle-n'),

    sizeUnits: sizeUnits as any,
    sizeScale: 1,
    ...sizeConstraintProps,
    depthTest: false,
    getFilterCategory: (d: ArrowItem) => {
      const { style, layerName, root } = d.feature?.properties || {};
      return [style?.group.groupIdx, layerName, root.id];
    },
    filterCategories: categories,
    extensions: [new DataFilterExtension({ categorySize })],

    updateTriggers: {
      getColor: time,
      getSize: [time, selectedFeatureIndexes],
      getAngle: time,
    },
  });
};
