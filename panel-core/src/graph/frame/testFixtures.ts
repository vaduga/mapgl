import { toDataFrame } from '@grafana/data';

import type { GraphFrameSnapshot, GraphNodeRecord, GraphPosition } from './types';

export function createGraphCompatibilityFixtures() {
  const directEdge = toDataFrame({
    refId: 'DirectEdge',
    fields: [
      { name: 'source', values: ['A', 'B'] },
      { name: 'target', values: ['B', null] },
      { name: 'edgeId', values: [null, null] },
    ],
  });

  const pathArray = toDataFrame({
    refId: 'PathArray',
    fields: [
      { name: 'source', values: ['A', 'B'] },
      { name: 'target', values: [['A', [15, 55], 'B'], null] },
      { name: 'edgeId', values: ['array-route', null] },
      { name: 'longitude', values: [10, 20] },
      { name: 'latitude', values: [50, 60] },
    ],
  });

  const jsonCoordinatePath = toDataFrame({
    refId: 'JsonCoordinatePath',
    fields: [
      { name: 'source', values: ['A', 'B'] },
      { name: 'target', values: ['["A",[15,55,0,"handoff","green"],"B"]', null] },
      { name: 'edgeId', values: ['json-route', null] },
      { name: 'longitude', values: [10, 20] },
      { name: 'latitude', values: [50, 60] },
    ],
  });

  const nodeOnly = toDataFrame({
    refId: 'Nodes',
    fields: [
      { name: 'source', values: ['A', 'B', 'C'] },
      { name: 'metric', values: [10, 20, 30] },
    ],
  });

  const implicitEdges = toDataFrame({
    refId: 'Implicit',
    fields: [
      { name: 'source', values: ['A', 'B', 'A', 'C'] },
      { name: 'target', values: ['B', null, 'B', 'B'] },
      { name: 'metric', values: [1, 2, 3, 4] },
    ],
  });

  const conflictingImplicitRoutes = toDataFrame({
    refId: 'ConflictingImplicit',
    fields: [
      { name: 'source', values: ['A', 'A', 'B'] },
      { name: 'target', values: ['["A",[15,55],"B"]', '["A",[16,55],"B"]', null] },
      { name: 'longitude', values: [10, 10, 20] },
      { name: 'latitude', values: [50, 50, 60] },
    ],
  });

  const explicitUnits = toDataFrame({
    refId: 'Explicit',
    fields: [
      { name: 'source', values: ['A', 'B', 'A', 'A', 'C'] },
      { name: 'target', values: ['["A","B"]', '["B","C"]', 'B', 'B', null] },
      { name: 'edgeId', values: ['trace-1', 'trace-1', 'parallel-a', 'parallel-b', null] },
      { name: 'metric', values: [10, 20, 30, 40, 50] },
    ],
  });

  const conflictingExplicitUnits = toDataFrame({
    refId: 'ConflictingExplicit',
    fields: [
      { name: 'source', values: ['A', 'C', 'B', 'D'] },
      { name: 'target', values: ['B', 'D', null, null] },
      { name: 'edgeId', values: ['shared', 'shared', null, null] },
    ],
  });

  const namespaces = toDataFrame({
    refId: 'Namespaces',
    fields: [
      { name: 'source', values: ['A', 'B', 'A', 'B'] },
      { name: 'target', values: ['B', null, 'B', null] },
      { name: 'sourceNs', values: ['site.one', 'site.one', 'site.two', 'site.two'] },
      { name: 'targetNs', values: ['site.one', 'site.one', 'site.two', 'site.two'] },
    ],
  });

  const coordinates = toDataFrame({
    refId: 'Coordinates',
    fields: [
      { name: 'source', values: ['geo-a', 'geo-b'] },
      { name: 'longitude', values: [10, 20] },
      { name: 'latitude', values: [50, 60] },
    ],
  });
  const geojson = toDataFrame({
    refId: 'GeoJSON',
    fields: [
      { name: 'source', values: ['geo-c'] },
      { name: 'geojson', values: ['{"type":"Point","coordinates":[30,70]}'] },
    ],
  });
  const geohash = toDataFrame({
    refId: 'Geohash',
    fields: [
      { name: 'source', values: ['geo-d'] },
      { name: 'geohash', values: ['u4pruydqqvj'] },
    ],
  });

  const multiNodes = toDataFrame({
    refId: 'MultiNodes',
    fields: [
      { name: 'source', values: ['A', 'B', 'C'] },
      { name: 'metric', values: [1, 2, 3] },
    ],
  });
  const multiEdges = toDataFrame({
    refId: 'MultiEdges',
    fields: [
      { name: 'source', values: ['A', 'A'] },
      { name: 'target', values: ['B', 'C'] },
      { name: 'metric', values: [100, 200] },
    ],
  });

  return {
    directEdge,
    pathArray,
    jsonCoordinatePath,
    nodeOnly,
    implicitEdges,
    conflictingImplicitRoutes,
    explicitUnits,
    conflictingExplicitUnits,
    namespaces,
    geographic: Object.freeze([coordinates, geojson, geohash]),
    multipleFrames: Object.freeze([multiNodes, multiEdges]),
  };
}

export function getGraphNodePosition(snapshot: GraphFrameSnapshot, record: GraphNodeRecord): GraphPosition {
  const offset = record.index * 2;
  return [snapshot.positions[offset], snapshot.positions[offset + 1]];
}

export function createLargeGraphCompatibilityFixture(nodeCount = 10_000, unitsPerRecord = 4) {
  if (!Number.isInteger(nodeCount) || nodeCount < 2) {
    throw new Error('nodeCount must be an integer greater than one');
  }
  if (!Number.isInteger(unitsPerRecord) || unitsPerRecord < 1) {
    throw new Error('unitsPerRecord must be a positive integer');
  }

  const source = Array.from({ length: nodeCount }, (_, index) => `N${index}`);
  const target = source.map((id, index) => {
    if (index === nodeCount - 1) {
      return null;
    }
    const targetId = source[index + 1];
    return index % 4 === 1 ? JSON.stringify([id, [100 + index / 1000, 50 + index / 2000], targetId]) : targetId;
  });
  const edgeId = source.map((_, index) =>
    index === nodeCount - 1 ? null : `route-${Math.floor(index / unitsPerRecord)}`
  );

  return toDataFrame({
    refId: 'LargeGraphCompatibility',
    fields: [
      { name: 'source', values: source },
      { name: 'target', values: target },
      { name: 'edgeId', values: edgeId },
      { name: 'longitude', values: source.map((_, index) => 100 + index / 1000) },
      { name: 'latitude', values: source.map((_, index) => 50 + index / 2000) },
    ],
  });
}
