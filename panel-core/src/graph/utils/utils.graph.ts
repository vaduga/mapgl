import midpoint from '@turf/midpoint';
import { Position } from 'geojson';

import { NS_SEPARATOR } from '../../types/defaults';
import { getEdgeArrowLength, getEdgeArrowSize } from './layout-geometry';

type Vec2 = [number, number];
type ArrowAngles = { start: number | undefined; end: number | undefined };
type ArrowTips = { start?: Position; end?: Position };
type ArrowLengths = { start?: number; end?: number };

type EdgeTerminals = {
  coordinates: Position[];
  arrowTips: ArrowTips;
  sourcePosition?: Position;
  targetPosition?: Position;
};

function wrapDeltaLonDeg(dLon: number): number {
  if (dLon > 180) {
    return dLon - 360;
  }
  if (dLon < -180) {
    return dLon + 360;
  }
  return dLon;
}

function getFirstPoints(coords: number[][]): { base: number[]; tip: number[] } | null {
  if (!coords?.length || coords.length < 2) {
    return null;
  }
  return { base: coords[1], tip: coords[0] };
}

function getLastPoints(coords: number[][]): { base: number[]; tip: number[] } | null {
  if (!coords?.length || coords.length < 2) {
    return null;
  }
  return {
    base: coords[coords.length - 2],
    tip: coords[coords.length - 1],
  };
}

function getArrowAngle(base: number[], tip: number[], isGeo: boolean): number {
  const [bx, by] = base as Vec2;
  const [tx, ty] = tip as Vec2;

  if (!isGeo) {
    return (Math.atan2(ty - by, tx - bx) * 180) / Math.PI;
  }

  let dx = wrapDeltaLonDeg(tx - bx);
  const dy = ty - by;
  const midLatRad = (((by + ty) / 2) * Math.PI) / 180;
  dx *= Math.cos(midLatRad);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function getArrowAngles(
  coords: number[][],
  isGeo: boolean,
  hasStart: boolean,
  hasEnd: boolean,
  arrowTips?: ArrowTips
): ArrowAngles | null {
  if (!hasStart && !hasEnd) {
    return null;
  }
  const startPoints = getFirstPoints(coords);
  const endPoints = getLastPoints(coords);
  if (!startPoints || !endPoints) {
    return null;
  }
  return {
    start: hasStart ? getArrowAngle(startPoints.base, arrowTips?.start ?? startPoints.tip, isGeo) : undefined,
    end: hasEnd ? getArrowAngle(endPoints.base, arrowTips?.end ?? endPoints.tip, isGeo) : undefined,
  };
}

function cloneCoordinates(coords: number[][]): Position[] {
  return coords.map((point) => [...point] as Position);
}

function shiftPointTowards(point: number[], target: number[], distance: number | undefined): Position {
  if (!distance || distance <= 0) {
    return [...point] as Position;
  }

  const dx = target[0] - point[0];
  const dy = target[1] - point[1];
  const length = Math.hypot(dx, dy);
  if (!length) {
    return [...point] as Position;
  }

  const ratio = Math.min(distance, length) / length;
  return [point[0] + dx * ratio, point[1] + dy * ratio];
}

function shiftPosition(position: Position | undefined, delta?: Position): Position | undefined {
  if (!position || !delta) {
    return position;
  }

  return [position[0] + delta[0], position[1] + delta[1]] as Position;
}

function getEdgeTerminals(
  coords: number[][],
  targetTerminalShift?: Position,
  isFirst?: boolean,
  isLast?: boolean,
  preservedArrowTips?: ArrowTips,
  arrowLengths?: ArrowLengths
): EdgeTerminals | null {
  if (!coords?.length) {
    return null;
  }

  const coordinates = cloneCoordinates(coords);
  const arrowTips: ArrowTips = {};
  const firstPoints = getFirstPoints(coords);
  const lastPoints = getLastPoints(coords);
  const sourceTip = preservedArrowTips?.start;
  const targetTip = shiftPosition(preservedArrowTips?.end, targetTerminalShift);

  if (isFirst && firstPoints) {
    if (sourceTip) {
      arrowTips.start = sourceTip;
    }
    coordinates[0] = !targetTerminalShift
      ? ([...firstPoints.tip] as Position)
      : arrowLengths?.start
        ? shiftPointTowards(firstPoints.tip, firstPoints.base, arrowLengths.start)
        : ([...firstPoints.tip] as Position);
  }

  if (isLast && lastPoints) {
    if (targetTip) {
      arrowTips.end = targetTip;
    }

    coordinates[coordinates.length - 1] = !targetTerminalShift
      ? ([...lastPoints.tip] as Position)
      : arrowLengths?.end
        ? shiftPointTowards(lastPoints.tip, lastPoints.base, arrowLengths.end)
        : ([...lastPoints.tip] as Position);
  }

  return {
    coordinates,
    arrowTips,
    sourcePosition: sourceTip,
    targetPosition: targetTip,
  };
}

function segregatePath(path: any[], pathCoords: Position[], findNodeA: any, findNodeB: any): any[] {
  if (path.length === 0) {
    return [[]];
  }
  const pathConverted = path
    .map((item, index) =>
      typeof item === 'string' ? (index !== path.length - 1 ? findNodeA(item) : findNodeB(item)) : item
    )
    .filter((item) => item);

  const subarrays: any[] = [];
  const coordsSubarrays: any[] = [];
  let currentSubarray: any[] = [];
  let currentCoordsSubarray: any[] = [];

  for (let i = 0; i < pathConverted.length; i++) {
    const item = pathConverted[i];
    const coords = pathCoords[i];
    if (!coords) {
      continue;
    }

    if (item.id && currentSubarray.length > 0) {
      currentSubarray.push({ item, gIdx: i, coords });
      currentCoordsSubarray.push(coords);
      subarrays.push(currentSubarray);
      coordsSubarrays.push(currentCoordsSubarray);
      currentSubarray = [];
      currentCoordsSubarray = [];
    }

    currentSubarray.push({ item, gIdx: i, coords });
    currentCoordsSubarray.push(coords);
  }

  return [subarrays, coordsSubarrays];
}

function paraboloid(distance: number, sourceZ: number, targetZ: number, ratio: number, instanceHeights: number) {
  const deltaZ = targetZ - sourceZ;
  const dh = distance * instanceHeights;

  if (dh === 0) {
    return sourceZ + deltaZ * ratio;
  }

  const unitZ = deltaZ / dh;
  const p2 = unitZ * unitZ + 1;
  const dir = deltaZ < 0 ? 1 : 0;
  const z0 = dir ? targetZ : sourceZ;
  const r = dir ? 1 - ratio : ratio;

  return Math.sqrt(r * (p2 - r)) * dh + z0;
}

function getMidpoint(sourcePosition: Position, targetPosition: Position, isLogic: boolean): [number, number] {
  if (isLogic) {
    return [(sourcePosition[0] + targetPosition[0]) / 2, (sourcePosition[1] + targetPosition[1]) / 2];
  }
  const point = midpoint(sourcePosition, targetPosition);
  return point.geometry.coordinates as [number, number];
}

function getContractedGraph(graphId: string, visibleNamespaces: string[], allNameSpaces: string[]) {
  const currentParts = graphId.split(NS_SEPARATOR);

  const eligibleIds = visibleNamespaces.filter((id) => {
    const parts = id.split(NS_SEPARATOR);
    return parts.length <= currentParts.length && parts.every((part, index) => part === currentParts[index]);
  });

  const allEligibleIds = allNameSpaces.filter((id) => {
    const parts = id.split(NS_SEPARATOR);
    return parts.length <= currentParts.length && parts.every((part, index) => part === currentParts[index]);
  });

  if (!eligibleIds.length) {
    return currentParts[0];
  }

  const fallbackId = eligibleIds.reduce((best, id) =>
    id.split(NS_SEPARATOR).length > best.split(NS_SEPARATOR).length ? id : best
  );
  const fallbackParts = fallbackId.split(NS_SEPARATOR);

  return (
    allEligibleIds
      .filter((item) => item.startsWith(fallbackId))
      .find((id) => id.split(NS_SEPARATOR).length === fallbackParts.length + 1) ?? fallbackId
  );
}

function inheritedShift(id: string, layerShift: Record<string, [number, number]>) {
  return id.split('.').reduce<[number, number]>(
    ([x, y], _, index, parts) => {
      const shift = layerShift[parts.slice(0, index + 1).join('.')];
      return shift ? [x + shift[0], y + shift[1]] : [x, y];
    },
    [0, 0]
  );
}

export {
  getEdgeArrowSize,
  getEdgeArrowLength,
  getArrowAngle,
  getArrowAngles,
  getEdgeTerminals,
  paraboloid,
  segregatePath,
  getMidpoint,
  getContractedGraph,
  inheritedShift,
};
