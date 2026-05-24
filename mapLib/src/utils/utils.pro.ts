import { Position } from 'geojson';
import { Graph } from '../structs/graph';
import { getNodeData } from '../structs/graphOps';
import { CoordRef } from '../types';
import { inheritedShift } from './utils.graph';

const DEFAULT_NODE_RADIUS = 12.5;

type ArrowTips = { start?: Position; end?: Position };

export function getProGeometry({
  edge,
  panel,
  layerShift,
  srcGraph,
  tarGraph,
  subPath,
  pathsCoords,
  layoutArrowTips,
  layoutGeometry,
  isSrcContracted,
  isContracted,
  isTarContracted,
}: {
  edge: any;
  panel: any;
  layerShift: any;
  srcGraph: Graph;
  tarGraph: Graph;
  subPath: CoordRef[];
  pathsCoords: Position[];
  layoutArrowTips?: ArrowTips;
  layoutGeometry?: Position[];
  isSrcContracted?: boolean;
  isContracted?: boolean;
  isTarContracted?: boolean;
}):
  | {
      subPath: CoordRef[];
      pathsCoords: Position[];
      targetTerminalShift: Position;
      layoutArrowTips?: ArrowTips;
    }
  | null
  | undefined {
  if (srcGraph.id === tarGraph.id) {
    return undefined;
  }

  const [ax, ay] = inheritedShift(srcGraph.id, layerShift);
  const [bx, by] = inheritedShift(tarGraph.id, layerShift);
  if (ax === bx && ay === by) {
    return undefined;
  }

  const targetTerminalShift: Position = [bx - ax, by - ay];
  const shiftedTerminals =
    !isContracted && !isTarContracted ? getShiftedStraightTerminals(edge, panel, targetTerminalShift) : undefined;
  const startTip =
    shiftedTerminals?.coordinates[0] ??
    (isContracted ? pathsCoords[0] : layoutArrowTips?.start ?? layoutGeometry?.[0] ?? pathsCoords[0]);
  const endTip =
    shiftedTerminals?.coordinates.at(-1) ??
    (isTarContracted ? pathsCoords.at(-1) : layoutArrowTips?.end ?? layoutGeometry?.at(-1) ?? pathsCoords.at(-1));

  if (!startTip || !endTip) {
    return null;
  }

  const lastShifted =
    shiftedTerminals || (isSrcContracted && isTarContracted)
      ? endTip
      : [endTip[0] + targetTerminalShift[0], endTip[1] + targetTerminalShift[1]];

  return {
    subPath: [subPath[0], subPath.at(-1) as CoordRef],
    pathsCoords: [startTip, lastShifted],
    targetTerminalShift,
    layoutArrowTips: shiftedTerminals?.arrowTips ?? layoutArrowTips,
  };
}

function getShiftedStraightTerminals(
  edge: any,
  panel: any,
  targetTerminalShift: Position
): { coordinates: [Position, Position]; arrowTips: { start: Position; end: Position } } | undefined {
  const sourceData = getNodeData(edge.source);
  const targetData = getNodeData(edge.target);
  if (!sourceData || !targetData) {
    return undefined;
  }

  const sourceCenter: Position = [
    panel.positions[sourceData.wasmId * 2],
    panel.positions[sourceData.wasmId * 2 + 1],
  ];
  const targetCenter: Position = [
    panel.positions[targetData.wasmId * 2],
    panel.positions[targetData.wasmId * 2 + 1],
  ];
  const shiftedTargetCenter: Position = [
    targetCenter[0] + targetTerminalShift[0],
    targetCenter[1] + targetTerminalShift[1],
  ];

  const dx = shiftedTargetCenter[0] - sourceCenter[0];
  const dy = shiftedTargetCenter[1] - sourceCenter[1];
  const length = Math.hypot(dx, dy);
  if (!length) {
    return undefined;
  }

  const ux = dx / length;
  const uy = dy / length;
  const sourceRadius = getNodeRadius(sourceData);
  const targetRadius = getNodeRadius(targetData);
  const sourceTip: Position = [sourceCenter[0] + ux * sourceRadius, sourceCenter[1] + uy * sourceRadius];
  const targetTipShifted: Position = [
    shiftedTargetCenter[0] - ux * targetRadius,
    shiftedTargetCenter[1] - uy * targetRadius,
  ];
  const targetTip: Position = [
    targetTipShifted[0] - targetTerminalShift[0],
    targetTipShifted[1] - targetTerminalShift[1],
  ];

  return {
    coordinates: [sourceTip, targetTipShifted],
    arrowTips: {
      start: sourceTip,
      end: targetTip,
    },
  };
}

function getNodeRadius(nodeData: ReturnType<typeof getNodeData>): number {
  const size = nodeData?.feature?.style?.size;
  return typeof size === 'number' ? size / 2 : DEFAULT_NODE_RADIUS;
}
