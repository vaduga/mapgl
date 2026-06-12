import { BiColProps, Comment, CommentsData, CoordRef, PushDummyEdgesProps, PushPathProps } from '../types';
import { Edge } from '../structs/edge';
import { AttributeRegistry } from '../structs/attributeRegistry';
import { Position } from 'geojson';

import midpoint from '@turf/midpoint';
import { findEdge, getNodeData, setEdge, setEntityAttrProp } from '../structs/graphOps';

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

function getSegmentArrowPlacement(i: number, len: number) {
  return len === 1 ? 'both' : i === 0 ? 'start' : i === len - 1 ? 'end' : 'none';
}

function pushDummyEdges({
  graphA,
  graphB,
  edgeId,
  data,
  multiEdges,
  parPath,
  positions,
  findNodeA,
  findNodeB,
  duplicateIdx,
}: PushDummyEdgesProps) {
  const [segrPath] = parPath.length ? segregatePath(parPath, positions, findNodeA, findNodeB) : [];
  segrPath?.forEach((frag: any, i: number) => {
    const idx = i ? '--' + i : '';
    const extraId = duplicateIdx === undefined ? edgeId + idx : `${edgeId}--dup-${duplicateIdx}${idx}`;
    const start = frag[0].item.id;
    const end = frag.at(-1).item.id;
    const dummy = setEdge(graphA, extraId, start, end as string, i === segrPath.length - 1 ? graphB : undefined);

    if (dummy) {
      const placement = getSegmentArrowPlacement(i, segrPath.length);
      dummy.setData({ ...data, arrowPlacement: placement, pathSegmentIdx: i, pathSegmentCount: segrPath.length });
      multiEdges.push(dummy);
    }
  });
}

function appendVerticeIds(prevVerticeIds: Array<number | undefined>, nextVerticeIds: Array<number | undefined>) {
  if (!prevVerticeIds.length) {
    return Array.from(nextVerticeIds);
  }
  if (!nextVerticeIds.length) {
    return Array.from(prevVerticeIds);
  }

  const shouldDropJoin = prevVerticeIds.at(-1) !== undefined && prevVerticeIds.at(-1) === nextVerticeIds[0];
  return [...prevVerticeIds, ...(shouldDropJoin ? nextVerticeIds.slice(1) : nextVerticeIds)];
}

export function getEdgeArrowSize(edgeSize: number | undefined): number {
  return typeof edgeSize === 'number' ? Math.max(2, edgeSize * 4) : 12;
}

export function getEdgeArrowLength(edgeSize: number | undefined): number {
  return getEdgeArrowSize(edgeSize);
}

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
  if (!coords?.length) {
    return null;
  }
  const firstLine = coords;
  if (!firstLine || firstLine.length < 2) {
    return null;
  }
  const tip = firstLine[0];
  const base = firstLine[1];
  return { base, tip };
}

function getLastPoints(coords: number[][]): { base: number[]; tip: number[] } | null {
  if (!coords?.length) {
    return null;
  }
  const lastLine = coords;
  if (!lastLine || lastLine.length < 2) {
    return null;
  }
  const tip = lastLine[lastLine.length - 1];
  const base = lastLine[lastLine.length - 2];
  return { base, tip };
}

function getArrowAngle(base: number[], tip: number[], isGeo: boolean): number {
  const [bx, by] = base as Vec2;
  const [tx, ty] = tip as Vec2;

  if (!isGeo) {
    const dx = tx - bx;
    const dy = ty - by;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
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
  return coords.map(point => [...point] as Position);
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

function pushPath(props: PushPathProps) {
  let {
    graphA,
    graphB,
    panel,
    parPath,
    layerIdx,
    edgeId: assignedEdgeId,
    dataRecord,
    commentsData,
    theme,
    rxEdgeId = false,
    isEdit = false,
  } = props;
  const { graphEdgeIndex } = panel;

  const findNodeA = (id: string) => graphA.findNode(id);
  const findNodeB = (id: string) => graphB.findNode(id);
  const findEdgeA = (edgeId: string | number) => findEdge(graphA, edgeId);

  const sourceId = parPath[0];
  const targetId = parPath.at(-1);

  if (typeof targetId !== 'string' || typeof sourceId !== 'string') {
    //console.warn('no src or target id in path: ', parPath)
    return;
  }

  let sourceNode = findNodeA(sourceId);
  let targetNode = findNodeB(targetId);
  if (!targetNode || !sourceNode) {
    //console.warn(`no ${!targetNode ? 'target '+targetId : 'source '+sourceId} node in ${parPath}. isEdit: ${isEdit}`)
    return;
  }

  const wasmVerticeIds: Array<number | undefined> = [];
  const nodes: string[] = [];
  const parPathSan: CoordRef[] = [];
  parPath.forEach((coordRef: CoordRef, i: number) => {
    const is_node = typeof coordRef === 'string';
    if (is_node) {
      const node = i === parPath.length - 1 ? findNodeB(coordRef) : findNodeA(coordRef);
      if (node) {
        const wasmId = getNodeData(node)!.wasmId;
        wasmVerticeIds.push(wasmId);
        nodes.push(coordRef);
        parPathSan.push(coordRef);
      } else {
        //console.warn(`Node ${coordRef} in parPath but not in "${graphA.id}" namespace?`)
      }
    } else if (!panel.isLogic && Array.isArray(coordRef)) {
      wasmVerticeIds.push(undefined);
      parPathSan.push(coordRef);
    }
  });
  if (!wasmVerticeIds.length) {
    return;
  }

  const edgeId = assignedEdgeId ?? sourceId + '-' + targetId;
  const edgeDataBase = {
    dataRecord,
    ...(rxEdgeId ? { rxEdgeId } : {}), // assigned either from DS [edgeId] field or RXDB
    parPath: parPathSan,
    edgeId,
  };
  let edge = findEdgeA(edgeId);
  let edge_id;
  if (!edge && !isEdit) {
    const newVerticeIds = wasmVerticeIds;
    graphEdgeIndex.edgeVerticeIds.push([newVerticeIds, layerIdx]);

    edge_id = graphEdgeIndex.edgeVerticeIds.length - 1;

    const data = { ...edgeDataBase, edge_id };

    if (!dataRecord) {
      /// create new edge from rxdb?
    }

    const multiEdges: Edge[] = [];

    if (nodes.length > 2) {
      pushDummyEdges({
        graphA,
        graphB,
        edgeId,
        data,
        multiEdges,
        parPath: parPathSan,
        positions: panel.positions,
        findNodeA,
        findNodeB,
      });
    } else {
      // @ts-ignore
      edge = setEdge(graphA, edgeId, sourceId, targetId, graphB);
      if (!edge) {
        console.warn(
          'edge from rxdb not found in your datasource. Mixed namespaces? (edgeId, sourceId, targetId)',
          edgeId,
          sourceId,
          targetId
        );
        return;
      }
      edge?.setData({ ...data, arrowPlacement: 'both' });
      multiEdges.push(edge);
    }
    graphEdgeIndex.wasm2Edges[edge_id] = multiEdges;
  } else if (edge) {
    edge_id = edge.data.edge_id;
    if (edge_id !== undefined) {
      if (panel.isLogic && assignedEdgeId && !isEdit) {
        const multiEdges = graphEdgeIndex.wasm2Edges[edge_id] ?? [];
        const data = { ...edgeDataBase, edge_id };

        if (nodes.length > 2) {
          pushDummyEdges({
            graphA,
            graphB,
            edgeId,
            data,
            multiEdges,
            parPath: parPathSan,
            positions: panel.positions,
            findNodeA,
            findNodeB,
            duplicateIdx: multiEdges.length,
          });
        } else {
          const extraId = `${edgeId}--dup-${multiEdges.length}`;
          const dummy = setEdge(graphA, extraId, sourceId, targetId, graphB);

          if (dummy) {
            dummy.setData({ ...data, arrowPlacement: 'both', pathSegmentIdx: 0, pathSegmentCount: 1 });
            multiEdges.push(dummy);
          }
        }

        graphEdgeIndex.wasm2Edges[edge_id] = multiEdges;

        const prevVerticeIds = graphEdgeIndex.edgeVerticeIds[edge_id][0];
        const appendedVerticeIds = appendVerticeIds(prevVerticeIds, wasmVerticeIds);
        graphEdgeIndex.edgeVerticeIds[edge_id][0] = appendedVerticeIds;

        return;
      }
    } else {
      //console.log('edge wasmid undefined', edge);
    }
  }

  ///////// comments

  parPath.forEach((element: CoordRef, index: number) => {
    if (Array.isArray(element) && element.length > 2) {
      const text = element[3] as string;
      const iconColor = element[4] as string;
      const hexColor = iconColor && theme.visualization.getColorByName(iconColor);

      const { style, layerName } = dataRecord || {};
      if (text !== undefined && style) {
        const comment: Comment = {
          text,
          iconColor: hexColor ?? '#4ec2fc',
          style,
          graph: graphA,
          layerName,
          locName: parPath[0] as string,
          index,
          coords: element.slice(0, 2) as [number, number],
          edge,
        };
        if (!commentsData[edgeId]) {
          commentsData[edgeId] = new Map();
        }
        commentsData[edgeId].set(index, comment);
      }
    }
  });
}

function segregatePath(path: any[], pathCoords: Position[], findNodeA: any, findNodeB: any): any[] {
  if (path.length === 0) {
    return [[]];
  }
  const pathConverted = path
    .map((p, i) => (typeof p === 'string' ? (i !== path.length - 1 ? findNodeA(p) : findNodeB(p)) : p))
    .filter((el) => el);

  const subarrays: any[] = [];
  const coordsSubarrays: any[] = [];
  let currentSubarray: any[] = [];
  let currentCoordsSubarray: any[] = [];
  for (let i = 0; i < pathConverted.length; i++) {
    const item = pathConverted[i];
    const coords = pathCoords[i];
    if (!coords) {
      //console.log('no coords', item, coords, i, pathCoords[i], pathCoords);
      continue;
    }
    const isNode = item.id;

    if (isNode) {
      if (currentSubarray.length > 0) {
        // at least fromNode already exists
        currentSubarray.push({ item, gIdx: i, coords });
        currentCoordsSubarray.push(pathCoords[i]);

        subarrays.push(currentSubarray);
        coordsSubarrays.push(currentCoordsSubarray);
        currentSubarray = [];
        currentCoordsSubarray = [];
      }
    }
    currentSubarray.push({ item, gIdx: i, coords });
    currentCoordsSubarray.push(coords);
    if (!coords) {
      //console.log('coordinates not found: ', item, coords, i , pathCoords[i], pathCoords);
    }
  }

  return [subarrays, coordsSubarrays];
}

function paraboloid(distance: number, sourceZ: number, targetZ: number, ratio: number, instanceHeights: number) {
  const deltaZ = targetZ - sourceZ;
  const dh = distance * instanceHeights;

  if (dh === 0) {
    // No height multiplier, so we interpolate between source and target Z
    return sourceZ + deltaZ * ratio;
  }

  const unitZ = deltaZ / dh;
  const p2 = unitZ * unitZ + 1.0;

  // Handle negative deltaZ by reversing source and target positions
  const dir = deltaZ < 0 ? 1 : 0;
  const z0 = dir ? targetZ : sourceZ;
  const r = dir ? 1.0 - ratio : ratio;

  // Compute the height at the given ratio along the arc
  return Math.sqrt(r * (p2 - r)) * dh + z0;
}

function getMidpoint(sourcePosition: Position, targetPosition: Position, isLogic: boolean): [number, number] {
  if (isLogic) {
    // Cartesian midpoint
    return [(sourcePosition[0] + targetPosition[0]) / 2, (sourcePosition[1] + targetPosition[1]) / 2];
  } else {
    // Geospatial midpoint via Turf
    const pt = midpoint(sourcePosition, targetPosition);
    return pt.geometry.coordinates as [number, number];
  }
}

function inheritedShift(id: string, layerShift: any) {
  return id.split('.').reduce<[number, number]>(
    ([x, y], _, i, arr) => {
      const shift = layerShift[arr.slice(0, i + 1).join('.')];
      return shift ? [x + shift[0], y + shift[1]] : [x, y];
    },
    [0, 0]
  );
}

export {
  pushPath,
  getArrowAngle,
  getArrowAngles,
  getEdgeTerminals,
  paraboloid,
  segregatePath,
  getMidpoint,
  inheritedShift,
};
