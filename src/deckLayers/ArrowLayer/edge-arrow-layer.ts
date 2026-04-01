import { IconLayer } from '@deck.gl/layers';
import { DataFilterExtension } from '@deck.gl/extensions';
import { Geometry, Position } from 'geojson';
import { getIconAtlasImage, iconMapping } from './arrow-atlas';
import { toRGB4Array } from '../../utils';
import { colTypes, DeckLine, PointFeatureProperties, RGBAColor, ALERTING_STATES } from 'mapLib/utils';
import type { Edge } from 'mapLib';

type ArrowFeature = DeckLine<Geometry, PointFeatureProperties>;
type ArrowPlacement = 'start' | 'end';
type ArrowItem = {
  feature: ArrowFeature;
  placement: ArrowPlacement;
  lineIndex: number;
  angle?: number;
};

function getLastPoints(d: ArrowFeature): { base: [number, number]; tip: [number, number] } | null {
  const coords = d?.geometry?.coordinates;
  if (!coords || !coords.length) {
    return null;
  }

  const lastLine = coords; //[coords.length - 1];
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

  const firstLine = coords
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
  const pts = placement === 'start' ? getFirstPoints(d) : getLastPoints(d);
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
  const edgeSize = d?.properties?.edgeStyle?.size;
  if (typeof edgeSize === 'number') {
    const scaled = edgeSize * 6;
    return Math.max(8, Math.min(24, scaled));
  }
  return 12;
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

  data.forEach((feature, lineIndex) => {
    const arrow = feature?.properties?.edgeStyle?.arrow;
    const angles = feature?.properties?.arrowAngles;
    const edgeId = feature?.edgeId;
    const heIdx = feature?.heIdx;

    const hyperEdge = getWasmId2Edges[heIdx];
    const firstEdgeId = hyperEdge?.[0]?.id;
    const lastEdgeId = hyperEdge?.at(-1)?.id;

    if (arrow === 1 && lastEdgeId === edgeId) {
      items.push({ feature, placement: 'end', lineIndex, angle: angles?.end });
      return;
    }

    if (arrow === -1 && firstEdgeId === edgeId) {
      items.push({
        feature,
        placement: 'start',
        lineIndex,
        angle: angles?.start,
      });
      return;
    }

    if (arrow === 2) {
      if (firstEdgeId === edgeId) {
        items.push({
          feature,
          placement: 'start',
          lineIndex,
          angle: angles?.start,
        });
      }
      if (lastEdgeId === edgeId) {
        items.push({
          feature,
          placement: 'end',
          lineIndex,
          angle: angles?.end,
        });
      }

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
    panel,
    getVisLayers,
    getGroupsLegend,
    getWasmId2Edges,
    time,
  } = props;

  const selectedFeatureIndexes = getSelectedIdxs?.get(colTypes.Edges)?.[srcGraphId] ?? [];

  const isLogic = panel.isLogic;
  const categories = getVisLayers.getCategories();
  const categorySize = 1;

  const baseData = Array.isArray(linesCollection) ? linesCollection : (linesCollection?.features ?? []);
  const arrowData = expandArrowItems(baseData, getWasmId2Edges);
  const units = options.common?.isMeters ? 'meters' : 'pixels';

  return new IconLayer({
    id: colTypes.Edges + '-arrow-' + srcGraphId,
    data: arrowData,
    visible,
    pickable: false,
    billboard: false,
    getPosition: (d: ArrowItem) => {
      const pts = d.placement === 'start' ? getFirstPoints(d.feature) : getLastPoints(d.feature);
      return pts ? pts.tip : [0, 0];
    },
    getAngle: (d: ArrowItem) => d.angle ?? getArrowAngle(d.feature, d.placement, !isLogic),
    getSize: (d: ArrowItem) => getArrowSize(d.feature) * (selectedFeatureIndexes.includes(d.lineIndex) ? 2 : 1),
    getColor: (d: ArrowItem) => getArrowColor(d.feature, getGroupsLegend),

    // Deck typings in this build are stricter than runtime support for HTMLImageElement.
    iconAtlas: getIconAtlasImage() as any,
    iconMapping,
    getIcon: () => 'triangle-n',

    sizeUnits: units,
    sizeScale: 1,
    sizeMinPixels: 1,
    sizeMaxPixels: 30,
    depthTest: false,
    getFilterCategory: (d: ArrowItem) => {
      const { layerName } = d.feature?.properties || {};
      return layerName;
    },
    filterCategories: categories,
    extensions: [new DataFilterExtension({ categorySize })],

    updateTriggers: {
      getColor: time,
      getSize: time,
      getAngle: time,
    },
  });
};
