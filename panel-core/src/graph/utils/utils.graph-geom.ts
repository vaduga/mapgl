import { evalCurvePoint } from './layout-result';
import { Position } from 'geojson';
import { Graph } from '../structs/graph';
import { getNodeData } from '../structs/graphOps';
import type { GraphEdgeIndex } from '../GraphEdgeIndex';
import { BiColProps, CoordRef, DeckLine } from '../../types/index';
import { CoordsConvert } from './utils.turf';
import {
  getEdgeRenderDecisions,
  isProjectedEdgeVisible,
  type EdgeRenderDecision,
} from '../../extension-points/featureContracts';
import { getArrowAngles, getEdgeTerminals, getContractedGraph, segregatePath } from './utils.graph';
import { resolveLayoutArrowLengths } from './layout-geometry';
import { isCoordinateToken } from '../frame/packedRelations';

import type { GraphFrameSnapshot } from '../frame/types';
import type { GraphPanelLayoutState } from '../frame/graphPanelRuntime';
import type { Edge } from '../structs/edge';
import type { LayerDragShift } from '../../types';
import type {
  NamespaceProjectionResult,
  EdgeOffsetStrategy,
  ProjectedEdgeVisibilityStrategy,
  TerminalArrowTips,
} from '../../extension-points/contracts';

export interface EdgeGeometryInput {
  readonly graph: Graph;
  readonly edgeIndex: GraphEdgeIndex;
  readonly positions: Float64Array;
  readonly isLogic: boolean;
  readonly isRouted?: boolean;
  readonly visibleNamespaces: readonly string[];
  readonly layerShift: LayerDragShift;
  readonly projection?: NamespaceProjectionResult;
  readonly layout: Pick<GraphPanelLayoutState, 'curveGroups' | 'edgeIndexes' | 'arrowTips'>;
  readonly layoutReady: boolean;
  readonly transformCoordinates?: (
    key: string,
    coordinates: Position[],
    arrowTips: Record<string, Position | undefined>
  ) => {
    coordinates: Position[];
    arrowTips: Record<string, Position | undefined>;
  };
  readonly layoutIncludesProjection: boolean;
  readonly snapshot?: GraphFrameSnapshot;
  readonly resolveRoute?: (edge: Edge) => { path: CoordRef[]; vertexRefs: ArrayLike<number> } | undefined;
  readonly edgeOffsetStrategies: readonly EdgeOffsetStrategy[];
  readonly projectedEdgeVisibilityStrategies: readonly ProjectedEdgeVisibilityStrategy[];
}

function getIndexedRoute(input: EdgeGeometryInput, edge: Edge) {
  if (input.isLogic && edge.data?.namespacePortPath) {
    const [start, end] = input.edgeIndex.getUnitRange(edge.data.unitRef);
    const nodes = [input.edgeIndex.getEdge(start).source];
    for (let ref = start; ref < end; ref++) {
      nodes.push(input.edgeIndex.getEdge(ref).target);
    }
    return {
      path: nodes.map((node) => node.id),
      vertexRefs: Int32Array.from(nodes, (node) => getNodeData(node)?.wasmId ?? -1),
    };
  }

  const providedRoute = input.resolveRoute?.(edge);
  if (providedRoute) {
    return providedRoute;
  }

  const snapshot = input.snapshot;
  const unitRef = edge.data?.unitRef;
  if (snapshot && Number.isInteger(unitRef) && unitRef >= 0 && unitRef < snapshot.relations.unitCount) {
    const start = snapshot.relations.getUnitRouteStart(unitRef);
    const length = snapshot.relations.getUnitRouteLength(unitRef);
    return {
      path: snapshot.relations.materializeUnitRoute(unitRef, (nodeRef: number) => snapshot.nodes[nodeRef]?.id),
      vertexRefs: Int32Array.from({ length }, (_, offset) => {
        const token = snapshot.relations.getRouteToken(start + offset);
        return isCoordinateToken(token) ? -1 : token;
      }),
    };
  }

  return undefined;
}

export interface EdgeRenderIndex {
  readonly graphId: string;
  readonly lineBatchIndex?: number;
  readonly arcBatchIndex?: number;
  readonly lineId?: number;
  readonly arcId?: number;
  readonly arcGraphId?: string;
}

/** Packed edge references map to indexes in this candidate, never to graph metadata. */
export interface PreparedEdgeGeometry {
  readonly routed: Record<string, DeckLine[]>;
  readonly namespaceCarriers?: readonly DeckLine[];
  readonly arcs: Record<string, any[]>;
  readonly mappings: ReadonlyArray<EdgeRenderIndex | undefined>;
}

export function getEdgesGeometry(input: EdgeGeometryInput): PreparedEdgeGeometry {
  const mappings: Array<EdgeRenderIndex | undefined> = new Array(input.edgeIndex.edgeCount);
  const skippedEdges = new Set<number>();
  const geomOverride: Map<number, Position[]> = new Map();
  const namespaceCarriers: DeckLine[] = [];
  const renderDecisions: Map<number, EdgeRenderDecision> = new Map();
  const tiltDecisions: Map<number, Pick<EdgeRenderDecision, 'tiltDistance' | 'isOutgoingTilt'>> = new Map();
  const graphEdgeIndex = input.edgeIndex;

  const visibleNamespaces = input.visibleNamespaces;
  const logicalArcs = input.isLogic && input.isRouted === false;
  const contractsHiddenNamespaces = !logicalArcs && Boolean(input.projection?.contractsHiddenNamespaces);
  const arcsFeatures: Record<string, any[]> = {};
  const features: Record<string, DeckLine[]> = {};

  const positions = input.positions;
  const layerShift = input.layerShift;
  const namespaceGraphs = new Map(
    [input.graph, ...(Array.from(input.graph.subgraphsBreadthFirst()) as Graph[])].map((graph) => [graph.id, graph])
  );
  const allNamespaces = [...namespaceGraphs.keys()];

  applyEdgeRenderDecisions({
    decisions: getEdgeRenderDecisions(input.edgeOffsetStrategies, {
      graph: input.graph,
      edgeIndex: graphEdgeIndex,
      positions,
      visibleNamespaces: new Set(visibleNamespaces),
    }),
    graphEdgeIndex,
    skippedEdges,
    geomOverride,
    renderDecisions,
    tiltDecisions,
    applyGeometryOverrides: !input.isLogic,
  });

  for (let recordRef = 0; recordRef < graphEdgeIndex.recordCount; recordRef++) {
    const [edgeStart, edgeEnd] = graphEdgeIndex.getRecordRange(recordRef);
    if (edgeStart === edgeEnd) {
      continue;
    }

    const edge = graphEdgeIndex.getEdge(edgeStart);
    const { source } = edge;
    const { target } = graphEdgeIndex.getEdge(edgeEnd - 1);
    const srcGraph = source.parent as Graph;
    const tarGraph = target.parent as Graph;

    if (!edge.data?.dataRecord) {
      // console.log('!!edgeData.dataRecord', edges[0]);
    }

    let srcFeatureProps: Partial<BiColProps> = {
      arcStyle: { arcConfig: { height: undefined } },
    };
    let sourcePosition: Position | undefined;
    let targetPosition: Position | undefined;
    let arcSourceNamespace = srcGraph.id,
      arcTargetNamespace = tarGraph.id;

    for (let edgeRef = edgeStart; edgeRef < edgeEnd; edgeRef++) {
      const edge = graphEdgeIndex.getEdge(edgeRef);
      const edgeData = edge.data;
      const dataRecord = edgeData?.dataRecord as BiColProps;
      const segmentOrdinal = graphEdgeIndex.getEdgeSegmentOrdinal(edgeRef);
      const isFirst = edgeRef === edgeStart;
      const isLast = edgeRef === edgeEnd - 1;
      const indexedRoute = getIndexedRoute(input, edge);
      if (!indexedRoute) {
        continue;
      }
      const parPath = indexedRoute.path;
      const findRouteNode = (id: string, index: number) => {
        const record = input.snapshot?.nodes[indexedRoute.vertexRefs[index]];
        if (record?.id === id) {
          return namespaceGraphs.get(record.namespaceId)?.findNode(id);
        }
        // Edited/private routes retain their unit's actual hop identities even
        // when a snapshot no longer has the route's vertex reference.
        const [start, end] = graphEdgeIndex.getUnitRange(graphEdgeIndex.getEdgeUnitRef(edgeRef));
        const ordinal = parPath.slice(0, index + 1).filter((item) => typeof item === 'string').length - 1;
        const node =
          ordinal === 0
            ? graphEdgeIndex.getEdge(start).source
            : start + ordinal - 1 < end
              ? graphEdgeIndex.getEdge(start + ordinal - 1).target
              : undefined;
        return node?.id === id ? node : undefined;
      };
      const edgeSrcGraph = edge.source.parent as Graph;
      const edgeTarGraph = edge.target.parent as Graph;
      const locName = typeof parPath[0] === 'string' ? parPath[0] : undefined;
      let layoutArrowTips: TerminalArrowTips | undefined = input.layout.arrowTips?.get(
        `${edgeSrcGraph.id ?? ''}:${edge.id}`
      );
      const layoutGeometry = input.isLogic ? getLayoutTerminalGeometry(edge, input) : undefined;
      const projectedLayoutGeometry = input.layoutIncludesProjection ? layoutGeometry : undefined;

      let isSrcContracted;
      let isContracted;
      let isTarContracted;

      if (contractsHiddenNamespaces && !visibleNamespaces.includes(edgeSrcGraph.id)) {
        isSrcContracted = true;
        isContracted = true;
      }

      if (contractsHiddenNamespaces && !visibleNamespaces.includes(edgeTarGraph.id)) {
        isContracted = true;
        isTarContracted = true;
      }
      const srcProjectionNamespace = isSrcContracted
        ? getContractedGraph(edgeSrcGraph.id, visibleNamespaces, allNamespaces)
        : edgeSrcGraph.id;
      const tarProjectionNamespace = isTarContracted
        ? getContractedGraph(edgeTarGraph.id, visibleNamespaces, allNamespaces)
        : edgeTarGraph.id;
      const hideArrowheads = Boolean(
        isSrcContracted &&
        isTarContracted &&
        srcProjectionNamespace &&
        tarProjectionNamespace &&
        srcProjectionNamespace === tarProjectionNamespace
      );

      let subPath = parPath;
      let pathsCoords = CoordsConvert(subPath, indexedRoute.vertexRefs, positions, true);

      if (isContracted) {
        subPath = [edge.source.id, edge.target.id];
        pathsCoords = [edge.source, edge.target].map((node) => {
          const ref = getNodeData(node)?.wasmId;
          if (ref === undefined) {
            throw new Error(`Missing canonical node position: ${node.id}`);
          }
          return [positions[ref * 2], positions[ref * 2 + 1]];
        });
      }

      if (
        !isProjectedEdgeVisible(input.projectedEdgeVisibilityStrategies, {
          srcNamespace: edgeSrcGraph.id,
          tarNamespace: edgeTarGraph.id,
          srcProjectionNamespace,
          tarProjectionNamespace,
          isSrcContracted,
          isContracted,
          isTarContracted,
        })
      ) {
        continue;
      }

      const [segrPath, segrCoords] = subPath.length
        ? segregatePath(
            subPath,
            pathsCoords,
            isContracted ? (_id, index) => (index === 0 ? edge.source : edge.target) : findRouteNode,
            isContracted ? (_id, index) => (index === 0 ? edge.source : edge.target) : findRouteNode
          )
        : [[], []];

      const override = geomOverride.get(edgeRef);
      const renderDecision = renderDecisions.get(edgeRef);
      const frCoords = segrCoords[isContracted ? 0 : segmentOrdinal];

      let coordinates = input.isLogic
        ? (projectedLayoutGeometry ??
          (isContracted
            ? ([...(frCoords ?? pathsCoords)] as Position[])
            : (layoutGeometry ?? ([...pathsCoords] as Position[]))))
        : override && frCoords?.length === 2
          ? [frCoords[0], ...override, frCoords[frCoords.length - 1]]
          : frCoords;

      if (!coordinates?.length) {
        continue;
      }

      if (isContracted && !projectedLayoutGeometry) {
        coordinates = [coordinates[0], coordinates.at(-1) as Position];
      }

      if (!coordinates.length) {
        continue;
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
          undefined,
          hasStartArrow,
          hasEndArrow,
          layoutArrowTips,
          arrowLengths
        );

        if (!edgeTerminals) {
          continue;
        }

        if (!isContracted || projectedLayoutGeometry) {
          coordinates = edgeTerminals.coordinates;
          arrowTips = edgeTerminals.arrowTips;
          sourceArrowTip = edgeTerminals.sourcePosition;
          targetArrowTip = edgeTerminals.targetPosition;
        }
      }

      const arrowAngles = hideArrowheads
        ? undefined
        : getArrowAngles(coordinates, !input.isLogic, hasStartArrow, hasEndArrow, arrowTips);
      const skip = skippedEdges.has(edgeRef);
      const graphFeatures = (features[edgeSrcGraph.id] ??= []);
      const lineId = graphFeatures.length;

      if (input.transformCoordinates) {
        ({ coordinates, arrowTips } = input.transformCoordinates(edgeSrcGraph.id, coordinates, arrowTips));
      }
      const newFeature: DeckLine = {
        edgeRef,
        namespaceSource: srcProjectionNamespace ?? edgeSrcGraph.id,
        namespaceTarget: tarProjectionNamespace ?? edgeTarGraph.id,
        lineId,
        edgeId: edge.id,
        skip,
        hideArrowheads,
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        rowIndex: dataRecord?.rowIndex,
        properties: {
          ...(dataRecord ?? {}),
          ...(edgeData?.labelGroup !== undefined && {
            labelGroup: edgeData.labelGroup,
            labelGroupOrder: edgeData.labelGroupOrder,
          }),
          locName,
          segrPath,
          ...(renderDecision
            ? {
                edgeRenderDecisionType: renderDecision.type,
                representativeEdgeId: renderDecision.representativeEdgeId,
                offsetIndex: renderDecision.offsetIndex,
                offsetCount: renderDecision.offsetCount,
              }
            : {}),
          ...(arrowAngles ? { arrowAngles } : {}),
          ...(Object.keys(arrowTips).length ? { arrowTips } : {}),
        },
      };

      if (input.isLogic && renderDecision?.namespaceCarrierId) {
        const route = getLayoutTerminalGeometry(edge, input, true);
        const carrierCoordinates = route
          ? (input.transformCoordinates?.(edgeSrcGraph.id, route, {}).coordinates ?? route)
          : coordinates;
        namespaceCarriers.push({
          ...newFeature,
          edgeId: renderDecision.namespaceCarrierId,
          namespaceCarrierId: renderDecision.namespaceCarrierId,
          skip: false,
          hideArrowheads: true,
          geometry: { type: 'LineString', coordinates: carrierCoordinates },
        });
      }

      graphFeatures.push(newFeature);
      mappings[edgeRef] = { graphId: edgeSrcGraph.id, lineId };

      if (isFirst) {
        arcSourceNamespace = newFeature.namespaceSource!;
        srcFeatureProps = newFeature.properties;
        sourcePosition = arrowTips.start && !isContracted ? arrowTips.start : coordinates[0];
      }

      if (isLast) {
        arcTargetNamespace = newFeature.namespaceTarget!;
        targetPosition = arrowTips.end && !isTarContracted ? arrowTips.end : coordinates.at(-1);
      }
    }

    if (logicalArcs) {
      const nodePosition = (node: typeof source, namespace: string): Position | undefined => {
        const ref = getNodeData(node)?.wasmId;
        if (ref === undefined) return;
        const point = [positions[ref * 2], positions[ref * 2 + 1]];
        if (!point.every(Number.isFinite)) return;
        return input.transformCoordinates?.(namespace, [point], {}).coordinates[0] ?? point;
      };
      arcSourceNamespace = srcGraph.id;
      arcTargetNamespace = tarGraph.id;
      sourcePosition = nodePosition(source, arcSourceNamespace);
      targetPosition = nodePosition(target, arcTargetNamespace);
      const { representativeEdgeId, ...properties } = srcFeatureProps as Partial<BiColProps> & { representativeEdgeId?: string };
      srcFeatureProps = {
        ...properties,
        segrPath: sourcePosition && targetPosition
          ? segregatePath([source, target], [sourcePosition, targetPosition], () => source, () => target)[0]
          : undefined,
      };
    }

    const arcId = pushArcFeature(
      input,
      arcsFeatures,
      edge,
      srcGraph,
      sourcePosition,
      targetPosition,
      srcFeatureProps,
      tiltDecisions.get(edgeStart)
    );
    if (arcId !== undefined) {
      Object.assign(arcsFeatures[srcGraph.id][arcId], {
        namespaceSource: arcSourceNamespace,
        namespaceTarget: arcTargetNamespace,
      });
      for (let edgeRef = edgeStart; edgeRef < edgeEnd; edgeRef++) {
        const lineMapping = mappings[edgeRef];
        mappings[edgeRef] = {
          ...lineMapping,
          graphId: lineMapping?.graphId ?? srcGraph.id,
          arcId,
          ...(lineMapping && lineMapping.graphId !== srcGraph.id ? { arcGraphId: srcGraph.id } : {}),
        };
      }
    }
  }

  const lineOffsets = new Map<string, number>(),
    arcOffsets = new Map<string, number>();
  let offset = 0;
  for (const [id, lines] of Object.entries(features)) {
    lineOffsets.set(id, offset);
    offset += lines.length;
  }
  offset = 0;
  for (const [id, arcs] of Object.entries(arcsFeatures)) {
    arcOffsets.set(id, offset);
    offset += arcs.length;
  }
  mappings.forEach((mapping, index) => {
    if (!mapping) {
      return;
    }
    mappings[index] = {
      ...mapping,
      ...(mapping.lineId !== undefined && { lineBatchIndex: lineOffsets.get(mapping.graphId)! + mapping.lineId }),
      ...(mapping.arcId !== undefined && {
        arcBatchIndex: arcOffsets.get(mapping.arcGraphId ?? mapping.graphId)! + mapping.arcId,
      }),
    };
  });
  return { routed: features, arcs: arcsFeatures, mappings, ...(namespaceCarriers.length && { namespaceCarriers }) };
}

function applyEdgeRenderDecisions({
  decisions,
  graphEdgeIndex,
  skippedEdges,
  geomOverride,
  renderDecisions,
  tiltDecisions,
  applyGeometryOverrides,
}: {
  decisions: EdgeRenderDecision[];
  graphEdgeIndex: GraphEdgeIndex;
  skippedEdges: Set<number>;
  geomOverride: Map<number, Position[]>;
  renderDecisions: Map<number, EdgeRenderDecision>;
  tiltDecisions: Map<number, Pick<EdgeRenderDecision, 'tiltDistance' | 'isOutgoingTilt'>>;
  applyGeometryOverrides: boolean;
}) {
  decisions.forEach((decision) => {
    const edgeRef = graphEdgeIndex.getEdgeRef(decision.edge);
    if (edgeRef === undefined) {
      return;
    }

    renderDecisions.set(edgeRef, decision);
    if (decision.tiltDistance !== undefined) {
      tiltDecisions.set(edgeRef, {
        tiltDistance: decision.tiltDistance,
        isOutgoingTilt: decision.isOutgoingTilt,
      });
    }
    if (decision.type === 'reduced') {
      skippedEdges.add(edgeRef);
      return;
    }

    if (decision.type === 'offset' && decision.coordinates && applyGeometryOverrides) {
      geomOverride.set(edgeRef, decision.coordinates);
    }
  });
}

const pushArcFeature = (
  input: Pick<EdgeGeometryInput, 'isLogic' | 'edgeIndex'>,
  arcsFeatures,
  edge: any,
  srcGraph: Graph,
  sourcePosition: Position | undefined,
  targetPosition: Position | undefined,
  properties: Partial<BiColProps>,
  tiltDecision?: Pick<EdgeRenderDecision, 'tiltDistance' | 'isOutgoingTilt'>
) => {
  if (!sourcePosition || !targetPosition) {
    return;
  }

  const tiltDist = tiltDecision?.tiltDistance;
  const isOutgoing = tiltDecision?.isOutgoingTilt ?? false;
  const arcData = {
    edgeRef: input.edgeIndex.getEdgeRef(edge),
    sourcePosition,
    targetPosition,
    namespaceSource: (edge.source.parent as Graph).id,
    namespaceTarget: (edge.target.parent as Graph).id,
    properties: { ...properties },
    edgeId: edge.id,
    skip: false,
  };

  if (tiltDist !== undefined) {
    if (tiltDist === 0) {
      arcData.skip = true;
    } else if (!input.isLogic) {
      const dist = tiltDist / 1;
      const tiltIncrement = properties.arcStyle?.arcConfig.tiltIncrement;
      const tilt = dist * tiltIncrement * (isOutgoing ? 1 : -1);
      arcData.properties.tilt = tilt;
    }
  }

  if (!arcsFeatures[srcGraph.id]) {
    arcsFeatures[srcGraph.id] = [];
  }

  arcsFeatures[srcGraph.id].push(arcData);
  return arcsFeatures[srcGraph.id].length - 1;
};

function getLayoutArrowLengths(edge: any): { start?: number; end?: number } {
  const edgeData = edge.data;
  return resolveLayoutArrowLengths(
    edgeData?.dataRecord?.edgeStyle?.arrow,
    edgeData?.dataRecord?.edgeStyle?.size,
    edgeData?.arrowPlacement ?? 'both'
  );
}

function getLayoutTerminalGeometry(edge: Edge, input: EdgeGeometryInput, fullRoute = false): Position[] | undefined {
  if (!input.layoutReady) {
    return undefined;
  }

  const sourceGraphId = (edge.source?.parent as Graph | undefined)?.id;
  const edgeIndex = input.layout.edgeIndexes?.get(`${sourceGraphId ?? ''}:${edge.id}`);
  const group = sourceGraphId ? input.layout.curveGroups?.get(sourceGraphId) : undefined;
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
  if (fullRoute) {
    const path = [first[0]];
    for (let i = start; i < end; i++) {
      const steps = group.types[i] === 0 ? 1 : 24;
      const t0 = group.segments[i * 2];
      const dt = group.segments[i * 2 + 1];
      for (let step = 1; step <= steps; step++) {
        path.push(evalCurvePoint(group.types[i], group.controlPoints, i, t0 + dt * step / steps));
      }
    }
    return path;
  }
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
