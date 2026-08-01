import { PackedRelationFlags, decodeRouteRef, isCoordinateToken, type PackedGraphRelations } from './packedRelations';
import type { GraphGeometrySignature, GraphNodeRecord, GraphTopologySignature } from './types';

interface GraphTopologySignatureInput {
  readonly nodes: readonly GraphNodeRecord[];
  readonly namespaces: readonly string[];
  readonly relations: PackedGraphRelations;
}

interface GraphGeometrySignatureInput {
  readonly nodes: readonly GraphNodeRecord[];
  readonly positions: Float64Array;
  readonly relations: PackedGraphRelations;
}

interface GraphBuildDataSignatureInput extends GraphGeometrySignatureInput {
  readonly namespaces: readonly string[];
}

function hashString(value: string): string {
  let left = 0x811c9dc5;
  let right = 0x9e3779b9;

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    left = Math.imul(left ^ code, 0x01000193);
    right = Math.imul(right ^ code, 0x85ebca6b);
    right ^= right >>> 13;
  }

  return `${(left >>> 0).toString(16).padStart(8, '0')}${(right >>> 0).toString(16).padStart(8, '0')}`;
}

function serializeSignature(prefix: string, value: unknown): string {
  const serialized = JSON.stringify(value);
  return `${prefix}:${hashString(serialized)}:${serialized.length}`;
}

export function createGraphTopologySignature(input: GraphTopologySignatureInput): GraphTopologySignature {
  const { relations } = input;
  const records = Array.from({ length: relations.recordCount }, (_, recordRef) => {
    const unitStart = relations.getRecordUnitStart(recordRef);
    const unitCount = relations.getRecordUnitCount(recordRef);
    return [
      relations.getRecordKey(recordRef),
      relations.getRecordId(recordRef),
      relations.getRecordSourceNodeRef(recordRef),
      relations.getRecordTargetNodeRef(recordRef),
      topologyRoute(relations, relations.getRecordRouteStart(recordRef), relations.getRecordRouteLength(recordRef)),
      relations.getRecordPrimaryRow(recordRef).layerIndex ?? null,
      Boolean(relations.getRecordFlags(recordRef) & PackedRelationFlags.explicitId),
      Array.from({ length: unitCount }, (_, unitOffset) => {
        const unitRef = unitStart + unitOffset;
        return [
          topologyRoute(relations, relations.getUnitRouteStart(unitRef), relations.getUnitRouteLength(unitRef)),
          relations.getUnitRow(unitRef).layerIndex ?? null,
        ];
      }),
    ];
  });

  return serializeSignature('t3', {
    version: 3,
    nodes: input.nodes.map(({ key, id, namespaceId, primaryRow }) => [
      key,
      id,
      namespaceId,
      primaryRow.layerIndex ?? null,
    ]),
    namespaces: input.namespaces,
    records,
  });
}

export function createGraphGeometrySignature(input: GraphGeometrySignatureInput): GraphGeometrySignature {
  const { relations } = input;
  const records = Array.from({ length: relations.recordCount }, (_, recordRef) => {
    const unitStart = relations.getRecordUnitStart(recordRef);
    const unitCount = relations.getRecordUnitCount(recordRef);
    return [
      relations.getRecordKey(recordRef),
      coordinateRoute(relations, relations.getRecordRouteStart(recordRef), relations.getRecordRouteLength(recordRef)),
      Array.from({ length: unitCount }, (_, unitOffset) => {
        const unitRef = unitStart + unitOffset;
        return coordinateRoute(relations, relations.getUnitRouteStart(unitRef), relations.getUnitRouteLength(unitRef));
      }),
    ];
  });

  return serializeSignature('p2', {
    version: 2,
    nodes: input.nodes.map(({ index, key }) => [key, input.positions[index * 2], input.positions[index * 2 + 1]]),
    records,
  });
}

export function createGraphBuildDataSignature(input: GraphBuildDataSignatureInput): string {
  const { relations } = input;
  return serializeSignature('b1', {
    version: 1,
    nodes: input.nodes.map(({ key, primaryRow, rows }) => [key, primaryRow, rows]),
    namespaces: input.namespaces,
    records: Array.from({ length: relations.recordCount }, (_, recordRef) => {
      const unitStart = relations.getRecordUnitStart(recordRef);
      const unitCount = relations.getRecordUnitCount(recordRef);
      return [
        relations.getRecordKey(recordRef),
        relations.getRecordId(recordRef),
        relations.getRecordSourceNodeRef(recordRef),
        relations.getRecordTargetNodeRef(recordRef),
        relations.getRecordFlags(recordRef),
        relations.getRecordPrimaryRow(recordRef),
        buildRoute(relations, relations.getRecordRouteStart(recordRef), relations.getRecordRouteLength(recordRef)),
        Array.from({ length: unitCount }, (_, unitOffset) => {
          const unitRef = unitStart + unitOffset;
          return [
            relations.getUnitRow(unitRef),
            relations.getUnitSourceNodeRef(unitRef),
            buildRoute(relations, relations.getUnitRouteStart(unitRef), relations.getUnitRouteLength(unitRef)),
          ];
        }),
      ];
    }),
  });
}

function topologyRoute(relations: PackedGraphRelations, start: number, length: number): number[] {
  const nodeRefs: number[] = [];
  for (let tokenIndex = start; tokenIndex < start + length; tokenIndex++) {
    const token = relations.getRouteToken(tokenIndex);
    if (!isCoordinateToken(token)) {
      nodeRefs.push(token);
    }
  }
  return nodeRefs;
}

function coordinateRoute(
  relations: PackedGraphRelations,
  start: number,
  length: number
): Array<readonly [number, number] | null> {
  const coordinates: Array<readonly [number, number] | null> = [];
  for (let tokenIndex = start; tokenIndex < start + length; tokenIndex++) {
    const token = relations.getRouteToken(tokenIndex);
    if (!isCoordinateToken(token)) {
      coordinates.push(null);
      continue;
    }
    const coordinateRef = decodeRouteRef(token);
    coordinates.push([relations.getCoordinateLongitude(coordinateRef), relations.getCoordinateLatitude(coordinateRef)]);
  }
  return coordinates;
}

function buildRoute(relations: PackedGraphRelations, start: number, length: number): unknown[] {
  const route: unknown[] = [];
  for (let tokenIndex = start; tokenIndex < start + length; tokenIndex++) {
    const token = relations.getRouteToken(tokenIndex);
    if (!isCoordinateToken(token)) {
      route.push(['n', token]);
      continue;
    }
    const coordinateRef = decodeRouteRef(token);
    const annotationRef = relations.getCoordinateAnnotationRef(coordinateRef);
    route.push([
      'c',
      relations.getCoordinateLongitude(coordinateRef),
      relations.getCoordinateLatitude(coordinateRef),
      relations.getCoordinateElevation(coordinateRef) ?? null,
      annotationRef === undefined ? null : relations.getAnnotationText(annotationRef),
      annotationRef === undefined ? null : (relations.getAnnotationColor(annotationRef) ?? null),
    ]);
  }
  return route;
}
