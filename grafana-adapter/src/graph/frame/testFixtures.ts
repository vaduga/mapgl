import { toDataFrame } from '@grafana/data';

import type { GraphFrameSnapshot, GraphNodeRecord, GraphPosition } from '@vaduga/mapgl-core/graph/frame';

export function createGraphCompatibilityFixtures() {
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

  const explicitUnits = toDataFrame({
    refId: 'Explicit',
    fields: [
      { name: 'source', values: ['A', 'B', 'A', 'A', 'C'] },
      { name: 'target', values: ['["A","B"]', '["B","C"]', 'B', 'B', null] },
      { name: 'edgeId', values: ['trace-1', 'trace-1', 'parallel-a', 'parallel-b', null] },
      { name: 'metric', values: [10, 20, 30, 40, 50] },
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
    nodeOnly,
    implicitEdges,
    explicitUnits,
    namespaces,
    geographic: Object.freeze([coordinates, geojson, geohash]),
    multipleFrames: Object.freeze([multiNodes, multiEdges]),
  };
}

export function getGraphNodePosition(snapshot: GraphFrameSnapshot, record: GraphNodeRecord): GraphPosition {
  const offset = record.index * 2;
  return [snapshot.positions[offset], snapshot.positions[offset + 1]];
}
