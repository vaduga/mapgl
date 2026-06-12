import distance from '@turf/distance';
import { Units } from '@turf/helpers';
import { Position } from 'geojson';
import { Graph } from '../structs/graph';
import { BiColProps, CoordRef, DeckLine } from '../types';
import { CoordsConvert, distance2D } from './utils.turf';
import {
  getArrowAngles,
  getEdgeArrowLength,
  getEdgeTerminals,
  getMidpoint,
  paraboloid,
  segregatePath,
} from './utils.graph';
import { getProGeometry } from './utils.pro';

type FragKey = `${string}:${number}`;
type MapPanel = {
  isLogic: boolean;
};
const CURVE_TYPE_LINE = 0;
const CURVE_TYPE_BEZIER = 1;
const CURVE_TYPE_ARC = 2;

const fragKey = (lineId: string | number, startIdx: number) => `${lineId}:${startIdx}` as const;

export function getEdgesGeometry(panel: any) {
  const skipFrags = new Set<string>();
  const geomOverride: Map<FragKey, Position[]> = new Map();
  const { graphEdgeIndex } = panel;

  const visibleNamespaces = panel.visLayers.getCategories()[1];
  const arcsFeatures: Record<string, any[]> = {};
  const features: Record<string, DeckLine[]> = {};

  const positions = panel.positions;
  const layerShift = panel.layerShift;

  graphEdgeIndex.wasm2Edges.forEach((edges, heIdx) => {
    if (!edges.length) {
      return;
    }

    const edge = edges[0];
    const { source } = edge;
    const { target } = edges[edges.length - 1];
    const srcGraph = source.parent as Graph;
    const tarGraph = target.parent as Graph;
    const findNodeA = (id: string) => srcGraph.findNode(id);
    const findNodeB = (id: string) => tarGraph.findNode(id);

    if (!edge.data?.dataRecord) {
     // console.log('!!edgeData.dataRecord', edges[0]);
    }

    let srcFeatureProps: Partial<BiColProps> = {
      arcStyle: { arcConfig: { height: undefined } },
    };
    let sourcePosition: Position | undefined;
    let targetPosition: Position | undefined;

    edges.forEach((edge, fragIdx) => {
      const edgeData = edge.data;
      const dataRecord = edgeData?.dataRecord as BiColProps;
      const pathFragIdx = edgeData?.pathSegmentIdx ?? fragIdx;
      const isFirst = fragIdx === 0;
      const isLast = fragIdx === edges.length - 1;
      const { parPath } = edgeData || {};
      if (!parPath) {
        return;
      }
      const locName = parPath[0];
      let layoutArrowTips = panel.layoutArrowTips?.get(`${srcGraph.id ?? ''}:${edge.id}`);
      const layoutGeometry = panel.isLogic ? getLayoutTerminalGeometry(edge, panel) : undefined;

      let isSrcContracted;
      let isContracted;
      let isTarContracted;

      if (panel.isLogic && !visibleNamespaces.includes(srcGraph.id)) {
        isSrcContracted = true;
        isContracted = true;
      }

      if (panel.isLogic && !visibleNamespaces.includes(tarGraph.id)) {
        isContracted = true;
        isTarContracted = true;
      }

      let subPath = parPath;
      const wasmIds = graphEdgeIndex.edgeVerticeIds[heIdx][0];
      let pathsCoords = CoordsConvert(subPath, wasmIds, positions, true);

      if (isContracted) {
        subPath = [subPath[0], subPath.at(-1) as CoordRef];
        pathsCoords = [pathsCoords[0], pathsCoords.at(-1) as CoordRef];
      }

      let targetTerminalShift: Position | undefined;

      const proGeometry = getProGeometry({
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
      });

      if (proGeometry === null) {
        return;
      }

      if (proGeometry) {
        ({ subPath, pathsCoords, targetTerminalShift, layoutArrowTips } = proGeometry);
      }

      const [segrPath, segrCoords] = subPath.length
        ? segregatePath(subPath, pathsCoords, findNodeA, findNodeB)
        : [[], []];

      const key = fragKey(heIdx, fragIdx);
      const override = geomOverride.get(key);
      const frCoords = segrCoords[pathFragIdx];

      let coordinates = panel.isLogic
        ? targetTerminalShift || isContracted
          ? ([...pathsCoords] as Position[])
          : layoutGeometry ?? ([...pathsCoords] as Position[])
        : override && frCoords?.length === 2
          ? [frCoords[0], ...override, frCoords[frCoords.length - 1]]
          : frCoords;

      if (!coordinates?.length) {
        return;
      }

      if (isContracted) {
        coordinates = [coordinates[0], coordinates.at(-1) as Position];
      }

      if (!coordinates.length) {
        return;
      }

      let arrowTips: { start?: Position; end?: Position } = {};
      let sourceArrowTip: Position | undefined;
      let targetArrowTip: Position | undefined;
      const arrowLengths = getLayoutArrowLengths(edge);
      const hasStartArrow = arrowLengths.start !== undefined;
      const hasEndArrow = arrowLengths.end !== undefined;

      if (hasStartArrow || hasEndArrow || isFirst || isLast) {
        const edgeTerminals = getEdgeTerminals(
          coordinates,
          targetTerminalShift,
          hasStartArrow,
          hasEndArrow,
          layoutArrowTips,
          arrowLengths
        );

        if (!edgeTerminals) {
          return;
        }

        if (!isContracted) {
          coordinates = edgeTerminals.coordinates;
          arrowTips = edgeTerminals.arrowTips;
          sourceArrowTip = edgeTerminals.sourcePosition;
          targetArrowTip = edgeTerminals.targetPosition;
        }
      }

      const arrowAngles = getArrowAngles(coordinates, !panel.isLogic, hasStartArrow, hasEndArrow, arrowTips);
      const skip = skipFrags.has(`${heIdx}:${fragIdx}`);

      const newFeature: DeckLine = {
        heIdx,
        fragIdx,
        edgeId: edge.id,
        skip,
        renderGeometryOnly: Boolean(targetTerminalShift || isContracted),
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        rowIndex: dataRecord?.rowIndex,
        properties: {
          ...(dataRecord ?? {}),
          locName,
          segrPath,
          ...(arrowAngles ? { arrowAngles } : {}),
          ...(Object.keys(arrowTips).length ? { arrowTips } : {}),
        },
      };

      if (!features[srcGraph.id]) {
        features[srcGraph.id] = [];
      }

      features[srcGraph.id].push(newFeature);
      edge.setLineId(features[srcGraph.id].length - 1);

      if (isFirst) {
        srcFeatureProps = newFeature.properties;
        sourcePosition = sourceArrowTip && !isContracted ? sourceArrowTip : coordinates[0];
      }

      if (isLast) {
        targetPosition = targetArrowTip && !isTarContracted ? targetArrowTip : coordinates.at(-1);
      }
    });

    pushArcFeature(panel, arcsFeatures,edge, srcGraph, sourcePosition, targetPosition, srcFeatureProps);
  });

  return [features, arcsFeatures];
}

const pushArcFeature = (
  panel: MapPanel,
  arcsFeatures,
  edge: any,
  srcGraph: Graph,
  sourcePosition: Position | undefined,
  targetPosition: Position | undefined,
  properties: Partial<BiColProps>
) => {
  if (!sourcePosition || !targetPosition) {
    return;
  }

  const { isOutgoing, tiltDist } = edge;
  const { arcStyle } = properties;
  const heightCoef = arcStyle?.arcConfig?.height;
  const options = { units: 'meters' as Units };
  const d = panel.isLogic
    ? distance2D(sourcePosition, targetPosition)
    : distance(sourcePosition, targetPosition, options);
  const peakHeight = paraboloid(d, 0, 0, 0.5, heightCoef !== undefined ? heightCoef : 0.5);
  const mid = getMidpoint(sourcePosition, targetPosition, panel.isLogic);
  const midPoint = [...mid, peakHeight];

  const arcData = {
    sourcePosition,
    targetPosition,
    midPoint,
    properties,
    edgeId: edge.id,
    skip: false,
  };

  if (tiltDist !== undefined) {
    if (tiltDist === 0) {
      arcData.skip = true;
    } else if (!panel.isLogic) {
      const dist = tiltDist / 1;
      const tiltIncrement = arcStyle?.arcConfig.tiltIncrement;
      const tilt = dist * tiltIncrement * (isOutgoing ? 1 : -1);
      arcData.properties.tilt = tilt;

      const tiltAngle = (tilt * Math.PI) / 180;
      const tiltFactor = panel.isLogic ? 1 : 0.00002;
      const tiltDirection = [targetPosition[0] - sourcePosition[0], targetPosition[1] - sourcePosition[1]];
      const norm = Math.sqrt(tiltDirection[0] * tiltDirection[0] + tiltDirection[1] * tiltDirection[1]);
      const unitTiltDirection = [tiltDirection[0] / norm, tiltDirection[1] / norm];
      const peakHeight = midPoint[2];
      const tiltX = -unitTiltDirection[1] * peakHeight * Math.sin(tiltAngle) * tiltFactor;
      const tiltY = unitTiltDirection[0] * peakHeight * Math.sin(tiltAngle) * tiltFactor;

      midPoint[0] += tiltX;
      midPoint[1] += tiltY;
    }
  }

  if (!arcsFeatures[srcGraph.id]) {
    arcsFeatures[srcGraph.id] = [];
  }

  arcsFeatures[srcGraph.id].push(arcData);
  edge.setArcId(arcsFeatures[srcGraph.id].length - 1);
};

function getLayoutArrowLengths(edge: any): { start?: number; end?: number } {
  const edgeData = edge.data;
  const arrow = edgeData?.dataRecord?.edgeStyle?.arrow ?? 0;
  const placement = edgeData?.arrowPlacement ?? 'both';
  const arrowLength = getEdgeArrowLength(edgeData?.dataRecord?.edgeStyle?.size);
  return {
    start: (arrow === -1 || arrow === 2) && (placement === 'start' || placement === 'both') ? arrowLength : undefined,
    end: (arrow === 1 || arrow === 2) && (placement === 'end' || placement === 'both') ? arrowLength : undefined,
  };
}

function getLayoutTerminalGeometry(edge: any, panel: any): Position[] | undefined {
  if (!panel.layoutReady && !panel.layoutDisplayReady) {
    return undefined;
  }

  const sourceGraphId = (edge.source?.parent as Graph | undefined)?.id;
  const edgeIndex = panel.layoutEdgeIndexes?.get(`${sourceGraphId ?? ''}:${edge.id}`);
  const group = sourceGraphId ? panel.layoutCurveGroups?.get(sourceGraphId) : undefined;
  if (edgeIndex === undefined || !group) {
    return undefined;
  }

  const localEdgeIndex = group.edgeIndexes.indexOf(edgeIndex);
  if (localEdgeIndex < 0) {
    return undefined;
  }

  const start = group.edgeSegmentOffsets[localEdgeIndex];
  const end = group.edgeSegmentOffsets[localEdgeIndex + 1];
  if (start === end) {
    return undefined;
  }

  const first = getLayoutSegmentEndpoints(group, start);
  if (end === start + 1) {
    return first;
  }

  const last = getLayoutSegmentEndpoints(group, end - 1);
  return [first[0], first[1], last[0], last[1]];
}

function getLayoutSegmentEndpoints(group: any, segmentIndex: number): [Position, Position] {
  const rangeOffset = segmentIndex * 2;
  const t0 = group.segments[rangeOffset];
  const t1 = t0 + group.segments[rangeOffset + 1];
  return [
    evalCurvePoint(group.types[segmentIndex], group.controlPoints, segmentIndex, t0),
    evalCurvePoint(group.types[segmentIndex], group.controlPoints, segmentIndex, t1),
  ];
}

function evalCurvePoint(type: number, controlPoints: Float32Array, segmentIndex: number, t: number): Position {
  const offset = segmentIndex * 8;
  const x0 = controlPoints[offset];
  const y0 = controlPoints[offset + 1];
  const x1 = controlPoints[offset + 2];
  const y1 = controlPoints[offset + 3];
  const x2 = controlPoints[offset + 4];
  const y2 = controlPoints[offset + 5];
  const x3 = controlPoints[offset + 6];
  const y3 = controlPoints[offset + 7];

  if (type === CURVE_TYPE_BEZIER) {
    const t2 = t * t;
    const t3 = t2 * t;
    const cx = (x1 - x0) * 3;
    const cy = (y1 - y0) * 3;
    const ex = (x2 - x1) * 3 - cx;
    const ey = (y2 - y1) * 3 - cy;
    const lx = x3 - x0 - cx - ex;
    const ly = y3 - y0 - cy - ey;
    return [lx * t3 + ex * t2 + cx * t + x0, ly * t3 + ey * t2 + cy * t + y0];
  }

  if (type === CURVE_TYPE_ARC) {
    return [x0 + Math.cos(t) * x1 + Math.sin(t) * x2, y0 + Math.cos(t) * y1 + Math.sin(t) * y2];
  }

  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
}
