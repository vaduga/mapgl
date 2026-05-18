import distance from '@turf/distance';
import { Units } from '@turf/helpers';
import { GeomEdge, Graph } from '@msagl/core';
import { Position } from 'geojson';
import { BiColProps, CoordRef, DeckLine } from './interfaces';
import { CoordsConvert, distance2D } from './utils.turf';
import { getEdgeData, getEdgeId, getEdgeTilt, setEdgeArcId, setEdgeLineId, setEdgeTilt } from '../structs/graphOps';
import {
  getArrowAngles,
  getEdgeTerminals,
  getMidpoint,
  getSmoothPolyline,
  paraboloid,
  segregatePath,
} from './utils.graph';

type FragKey = `${string}:${number}`;

const fragKey = (lineId: string | number, startIdx: number) => `${lineId}:${startIdx}` as const;

export function getEdgesGeometry(graph: Graph, panel: any) {
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
    const edgeData = getEdgeData(edge);
    const dataRecord = edgeData?.dataRecord as BiColProps;

    if (!edgeData?.parPath || !dataRecord) {
      return;
    }

    let srcFeatureProps: Partial<BiColProps> = {
      arcStyle: { arcConfig: { height: undefined } },
    };
    let sourcePosition: Position | undefined;
    let targetPosition: Position | undefined;

    edges.forEach((edge, fragIdx) => {
      const len = edges.length - 1;
      const isFirst = fragIdx === 0;
      const isLast = fragIdx === len;
      const { parPath } = edgeData;
      const locName = parPath[0];

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
      const geomEdge: GeomEdge = GeomEdge.getGeom(edge);

      if (isContracted) {
        subPath = [subPath[0], subPath.at(-1) as CoordRef];
        pathsCoords = [pathsCoords[0], pathsCoords.at(-1) as CoordRef];
      }

      let targetTerminalShift: Position | undefined;

      const [segrPath, segrCoords] = subPath.length
        ? segregatePath(subPath, pathsCoords, findNodeA, findNodeB)
        : [[], []];

      const key = fragKey(heIdx, fragIdx);
      const override = geomOverride.get(key);
      const frCoords = segrCoords[fragIdx];

      let coordinates = panel.isLogic
        ? targetTerminalShift || isContracted
          ? ([...pathsCoords] as Position[])
          : getSmoothPolyline(edge)
        : override && frCoords?.length === 2
          ? [frCoords[0], ...override, frCoords[frCoords.length - 1]]
          : frCoords;

      if (!coordinates?.length) {
        return;
      }

      if (panel.isLogic && !isContracted && targetTerminalShift && geomEdge?.targetArrowhead?.tipPosition) {
        coordinates = [...coordinates];
        coordinates[coordinates.length - 1] = [
          geomEdge.targetArrowhead.tipPosition.x + targetTerminalShift[0],
          geomEdge.targetArrowhead.tipPosition.y + targetTerminalShift[1],
        ];
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

      if (isFirst || isLast) {
        const edgeTerminals = getEdgeTerminals(coordinates, geomEdge, targetTerminalShift, isFirst, isLast);

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

      const arrowAngles = getArrowAngles(coordinates, !panel.isLogic, fragIdx, len, arrowTips);
      const skip = skipFrags.has(`${heIdx}:${fragIdx}`);

      const newFeature: DeckLine = {
        heIdx,
        fragIdx,
        edgeId: getEdgeId(edge),
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
          locName: String(locName),
          segrPath,
          ...(arrowAngles ? { arrowAngles } : {}),
          ...(Object.keys(arrowTips).length ? { arrowTips } : {}),
        },
      };

      if (isFirst) {
        srcFeatureProps = newFeature.properties;
        sourcePosition = sourceArrowTip && !isContracted ? sourceArrowTip : coordinates[0];
      }

      if (isLast) {
        targetPosition = targetArrowTip && !isTarContracted ? targetArrowTip : coordinates.at(-1);
      }

      if (!features[srcGraph.id]) {
        features[srcGraph.id] = [];
      }

      features[srcGraph.id].push(newFeature);
      setEdgeLineId(edge, features[srcGraph.id].length - 1);
    });

    if (!sourcePosition || !targetPosition) {
      return;
    }

    const { isOutgoing, tiltDist } = getEdgeTilt(edge) ?? {};
    const { arcStyle } = srcFeatureProps;
    const heightCoef = arcStyle?.arcConfig?.height;
    const options = { units: 'meters' as Units };
    const d = panel.isLogic ? distance2D(sourcePosition, targetPosition) : distance(sourcePosition, targetPosition, options);
    const peakHeight = paraboloid(d, 0, 0, 0.5, heightCoef !== undefined ? heightCoef : 0.5);
    const mid = getMidpoint(sourcePosition, targetPosition, panel.isLogic);
    const midPoint = [...mid, peakHeight];

    const arcData = {
      sourcePosition,
      targetPosition,
      midPoint,
      properties: srcFeatureProps,
      edgeId: getEdgeId(edge),
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
    setEdgeArcId(edge, arcsFeatures[srcGraph.id].length - 1);
  });

  return [features, arcsFeatures];
}
