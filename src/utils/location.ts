import {
  FieldMatcher,
  getFieldMatcher,
  FieldMatcherID,
  DataFrame,
  Field,
  getFieldDisplayName,
  FieldType,
  FieldConfig,
} from '@grafana/data';
import { getGazetteer, Gazetteer } from '../grafana_core/app/features/geo/gazetteer/gazetteer';
import { decodeGeohash } from './geohash';
import { ExtendFrameGeometrySource, ExtendFrameGeometrySourceMode } from '../extension';
import { Geometry, Point } from 'geojson';
import { findField } from '../grafana_core/app/features/dimensions';
import { GeomGraph, Graph, Node, FeatSource } from 'mapLib';
import { CMN_NAMESPACE, NS_SEPARATOR } from 'mapLib/utils';
import { GeomapPanel } from '../GeomapPanel';

export type NamespaceRange = [
  graphId: string,
  separator: typeof NS_SEPARATOR,
  range: number[], // [start,end]
];

export interface ExtendedField<T> extends Omit<Field<T>, 'values'> {
  values: T[] | Float64Array;
  nodes?: Node[];
  ranges?: NamespaceRange[];
}

export interface FrameGeometryField {
  field?: ExtendedField<Geometry | Float64Array>;
  warning?: string;
  derived?: boolean;
  description?: string;
}

export type FieldFinder = (frame: DataFrame) => Field | undefined;

function getFieldFinder(matcher: FieldMatcher): FieldFinder {
  return (frame: DataFrame) => {
    for (const field of frame.fields) {
      if (matcher(field, frame, [])) {
        return field;
      }
    }
    return undefined;
  };
}
function matchLowerNames(names: Set<string>): FieldFinder {
  return (frame: DataFrame) => {
    for (const field of frame.fields) {
      if (names.has(field.name.toLowerCase())) {
        return field;
      }
      const disp = getFieldDisplayName(field, frame);
      if (names.has(disp)) {
        return field;
      }
    }
    return undefined;
  };
}
export interface LocationFieldMatchers {
  mode: ExtendFrameGeometrySourceMode;

  // Field mappings
  geojson: FieldFinder;
  geohash: FieldFinder;
  longitude: FieldFinder;
  latitude: FieldFinder;
  h3: FieldFinder;
  wkt: FieldFinder;
  lookup: FieldFinder;
  geo: FieldFinder;
  gazetteer?: Gazetteer;
}

const defaultMatchers: LocationFieldMatchers = {
  mode: ExtendFrameGeometrySourceMode.Auto,
  geojson: matchLowerNames(new Set(['location', 'geojson'])),
  geohash: matchLowerNames(new Set(['geohash'])),
  longitude: matchLowerNames(new Set(['longitude', 'lon', 'lng'])),
  latitude: matchLowerNames(new Set(['latitude', 'lat'])),
  h3: matchLowerNames(new Set(['h3'])),
  wkt: matchLowerNames(new Set(['wkt'])),
  lookup: matchLowerNames(new Set(['lookup'])),
  geo: (frame: DataFrame) => frame.fields.find((f) => f.type === FieldType.geo),
};
export async function getLocationMatchers(src?: ExtendFrameGeometrySource): Promise<LocationFieldMatchers> {
  const info: LocationFieldMatchers = {
    ...defaultMatchers,
    mode: src?.mode ?? ExtendFrameGeometrySourceMode.Auto,
  };
  switch (info.mode) {
    case ExtendFrameGeometrySourceMode.Geohash:
      if (src?.geohash) {
        info.geohash = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.geohash }));
      }
      break;
    case ExtendFrameGeometrySourceMode.Lookup:
      if (src?.lookup) {
        info.lookup = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.lookup }));
      }
      info.gazetteer = await getGazetteer(src?.gazetteer);
      break;
    case ExtendFrameGeometrySourceMode.Coords:
      if (src?.longitude) {
        info.longitude = getFieldFinder(
          getFieldMatcher({
            id: FieldMatcherID.byName,
            options: src.longitude,
          })
        );
      }
      if (src?.latitude) {
        info.latitude = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.latitude }));
      }
      break;
    case ExtendFrameGeometrySourceMode.Geojson:
      if (src?.geojson) {
        info.geojson = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.geojson }));
      }
      break;
  }
  return info;
}
export interface LocationFields {
  mode: ExtendFrameGeometrySourceMode;

  // Field mappings
  geojson?: Field;
  geohash?: Field;
  longitude?: Field;
  latitude?: Field;
  h3?: Field;
  wkt?: Field;
  lookup?: Field;
  geo?: Field<Geometry | undefined>;
  locName?: Field | undefined;
  vertexA_NS?: Field | undefined;
  vertexB_NS?: Field | undefined;
}

export function getLocationFields(frame: DataFrame, location: LocationFieldMatchers): LocationFields {
  const fields: LocationFields = {
    mode: location.mode ?? ExtendFrameGeometrySourceMode.Auto,
  };

  // Find the best option
  if (fields.mode === ExtendFrameGeometrySourceMode.Auto) {
    fields.geojson = location.geojson(frame);
    if (fields.geojson) {
      fields.mode = ExtendFrameGeometrySourceMode.Geojson;
      return fields;
    }

    fields.geo = location.geo(frame);
    if (fields.geo) {
      return fields;
    }

    fields.longitude = location.longitude(frame);
    fields.latitude = location.latitude(frame);
    if (fields.longitude && fields.latitude) {
      fields.mode = ExtendFrameGeometrySourceMode.Coords;
      return fields;
    }
    fields.geohash = location.geohash(frame);
    if (fields.geohash) {
      fields.mode = ExtendFrameGeometrySourceMode.Geohash;
      return fields;
    }
    fields.lookup = location.lookup(frame);
    if (fields.lookup) {
      fields.mode = ExtendFrameGeometrySourceMode.Lookup;
      return fields;
    }
  }

  switch (fields.mode) {
    case ExtendFrameGeometrySourceMode.Geojson:
      fields.geojson = location.geojson(frame);
      break;
    case ExtendFrameGeometrySourceMode.Coords:
      fields.longitude = location.longitude(frame);
      fields.latitude = location.latitude(frame);
      break;
    case ExtendFrameGeometrySourceMode.Geohash:
      fields.geohash = location.geohash(frame);
      break;
    case ExtendFrameGeometrySourceMode.Lookup:
      fields.lookup = location.lookup(frame);
      break;
  }

  return fields;
}

export function getGeometryField(
  frame: DataFrame,
  location: LocationFieldMatchers,
  locField?: string,
  vertexA_NS?: string,
  vertexB_NS?: string,
  panel?: GeomapPanel,
  root?: FeatSource,
  graph?: Graph
): FrameGeometryField {
  const fields = getLocationFields(frame, location);
  fields.locName = locField ? findField(frame, locField) : undefined;
  fields.vertexA_NS = vertexA_NS ? findField(frame, vertexA_NS) : undefined;
  fields.vertexB_NS = vertexB_NS ? findField(frame, vertexB_NS) : undefined;

  const isLogic = panel?.isLogic;
  if (isLogic && root && graph) {
    const len = fields.locName?.values?.length;
    const frameLen = frame.length ?? len ?? 0; // rndField for len
    if (!frameLen) {
      return {
        field: undefined,
      };
    }

    return {
      field: pointFieldFromAutolayout(frameLen, fields, panel, root, graph),
    };
  }

  switch (fields.mode) {
    case ExtendFrameGeometrySourceMode.Auto:
      if (fields.geo) {
        return {
          field: fields.geo as Field<Geometry>,
        };
      }
      return {
        warning: 'Unable to find location fields',
      };

    case ExtendFrameGeometrySourceMode.Geojson:
      if (fields.geojson) {
        return {
          field: pointFieldFromGeoJSON(fields.geojson, fields, panel, root, graph),
        };
      }
      return {
        warning: 'Unable to find location fields',
      };

    case ExtendFrameGeometrySourceMode.Coords:
      if (fields.latitude && fields.longitude) {
        return {
          field: pointFieldFromLonLat(fields.longitude, fields.latitude, fields, panel, root, graph),
          derived: true,
          description: `${fields.mode}: ${fields.latitude.name}, ${fields.longitude.name}`,
        };
      }
      return {
        warning: 'Select longitude/latitude fields',
      };

    case ExtendFrameGeometrySourceMode.Geohash:
      if (fields.geohash) {
        return {
          field: pointFieldFromGeohash(fields.geohash, fields, panel, root, graph),
          derived: true,
          description: `${fields.mode}`,
        };
      }
      return {
        warning: 'Select geohash field',
      };

    case ExtendFrameGeometrySourceMode.Lookup:
      if (fields.lookup) {
        if (location.gazetteer) {
          return {
            field: getGeoFieldFromGazetteer(location.gazetteer, fields.lookup, fields, panel, root, graph),
            derived: true,
            description: `${fields.mode}: ${location.gazetteer.path}`, // TODO get better name for this
          };
        }
        return {
          warning: 'Gazetteer not found',
        };
      }
      return {
        warning: 'Select lookup field',
      };
  }

  return { warning: 'unable to find geometry' };
}

function pointFieldFromAutolayout(
  len: number,
  fields: LocationFields,
  panel: GeomapPanel,
  root: FeatSource,
  graph: Graph
): ExtendedField<Geometry | Float64Array> {
  const buffer = new Float64Array(len * 2);
  const nodes = new Array<Node>();
  const startIdx = panel?.vCount;
  const state = { graph: undefined, index: 0, startIdx };
  const ranges = [];

  for (let i = 0; i < len; i++) {
      createNode(fields, nodes, ranges, i, len, root, panel, graph, buffer, state, undefined);
  }

  const values = new Float64Array((buffer as Float64Array).slice(0, state.index));

  return {
    name: 'Point',
    type: FieldType.geo,
    values,
    nodes,
    ranges,
    config: hiddenTooltipField,
  };
}

function pointFieldFromGeoJSON(
  geojson: Field<string>,
  fields?: LocationFields,
  panel?: GeomapPanel,
  root?: FeatSource,
  graph?: Graph
): ExtendedField<Geometry | Float64Array> {
  const len = geojson?.values?.length ?? 0;
  const buffer = graph ? new Float64Array(len * 2) : new Array<Geometry>(len);
  const nodes = new Array<Node>();
  const startIdx = panel?.vCount ?? 0;
  const state = { graph: undefined, index: 0, startIdx };
  const ranges = [];

  for (let i = 0; i < len; i++) {
    if (!geojson?.values[i]) {
      continue;
    }
    const feature = JSON.parse(geojson.values[i] as string);
    if (!feature) {
      //console.log('no feature', geojson.values[i]);
      continue;
    }

    if (graph) {
      createNode(fields, nodes, ranges, i, len, root, panel, graph, buffer, state, feature?.coordinates);
      continue;
    }
    buffer[state.index++] = {
      type: feature.type,
      coordinates: feature.coordinates,
    };
  }

  const values = graph
    ? new Float64Array((buffer as Float64Array).slice(0, state.index))
    : (buffer as Geometry[]).slice(0, state.index);

  return {
    name: 'Point',
    type: FieldType.geo,
    values,
    nodes,
    ranges,
    config: hiddenTooltipField,
  };
}

function pointFieldFromLonLat(
  lon: Field<number>,
  lat: Field<number>,
  fields?: LocationFields,
  panel?: GeomapPanel,
  root?: FeatSource,
  graph?: Graph
): ExtendedField<Geometry | Float64Array> {
  const len = lon.values.length;
  const buffer = graph ? new Float64Array(len * 2) : new Array<Geometry>(len);
  const nodes = new Array<Node>(len);
  const startIdx = panel?.vCount ?? 0;
  const state = { graph: undefined, index: 0, startIdx };
  const ranges = [];

  for (let i = 0; i < len; i++) {
    const longitude = lon.values[i];
    const latitude = lat.values[i];

    if (longitude === null || latitude === null) {
      continue;
    }
    const feature: Point = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
    if (graph) {
      createNode(fields, nodes, ranges, i, len, root, panel, graph, buffer, state, feature?.coordinates);
      continue;
    }
    buffer[state.index++] = feature;
  }
  const values = graph
    ? new Float64Array((buffer as Float64Array).slice(0, state.index))
    : (buffer as Geometry[]).slice(0, state.index);

  return {
    name: 'Point',
    type: FieldType.geo,
    values,
    nodes,
    ranges,
    config: hiddenTooltipField,
  };
}

function pointFieldFromGeohash(
  geohash: Field<string>,
  fields?: LocationFields,
  panel?: GeomapPanel,
  root?: FeatSource,
  graph?: Graph
): ExtendedField<Geometry | Float64Array> {
  const len = geohash.values.length;
  const buffer = graph ? new Float64Array(len * 2) : new Array<Geometry>(len);
  const nodes = new Array<Node>(len);
  const startIdx = panel?.vCount ?? 0;
  const state = { graph: undefined, index: 0, startIdx };
  const ranges = [];
  for (let i = 0; i < len; i++) {
    const v = geohash.values[i];
    if (v) {
      const coordinates = decodeGeohash(v);
      if (!coordinates) {
        continue;
      }
      const feature: Point = { type: 'Point', coordinates };
      if (graph) {
        createNode(fields, nodes, ranges, i, len, root, panel, graph, buffer, state, feature?.coordinates);
        continue;
      }
      buffer[state.index++] = feature;
    }
  }
  const values = graph
    ? new Float64Array((buffer as Float64Array).slice(0, state.index))
    : (buffer as Geometry[]).slice(0, state.index);

  return {
    name: geohash.name ?? 'Point',
    type: FieldType.geo,
    values,
    nodes,
    ranges,
    config: hiddenTooltipField,
  };
}

function getGeoFieldFromGazetteer(
  gaz: Gazetteer,
  field: Field<string>,
  fields?: LocationFields,
  panel?: GeomapPanel,
  root?: FeatSource,
  graph?: Graph
): ExtendedField<Geometry | Float64Array> {
  const len = field.values.length;
  const buffer = graph ? new Float64Array(len * 2) : new Array<Geometry>(len);
  const nodes = new Array<Node>(len);
  const startIdx = panel?.vCount ?? 0;
  const state = { graph: undefined, index: 0, startIdx };
  const ranges = [];
  for (let i = 0; i < len; i++) {
    const info = gaz.find(field.values[i]); //?.geometry();

    if (!info?.coords) {
      continue;
    } // info?.geometry ?
    const feature: Point = { type: 'Point', coordinates: info.coords };
    if (graph) {
      createNode(fields, nodes, ranges, i, len, root, panel, graph, buffer, state, feature?.coordinates);
      continue;
    }
    buffer[state.index++] = feature;
  }

  const values = graph
    ? new Float64Array((buffer as Float64Array).slice(0, state.index))
    : (buffer as Geometry[]).slice(0, state.index);

  return {
    name: 'Geometry',
    type: FieldType.geo,
    values,
    nodes,
    ranges,
    config: hiddenTooltipField,
  };
}

const hiddenTooltipField: FieldConfig = Object.freeze({
  custom: {
    hideFrom: { tooltip: true },
  },
});

function createNode(fields, nodes, ranges, i, len, root, panel, graph, coords, state, coordinates) {
  const { locName, vertexA_NS } = fields || {};
  if (!locName) {
    return;
  }

  const id = locName.values[i];
  const isLogic = panel.isLogic;

  const namespace = isLogic && vertexA_NS?.values[i] ? vertexA_NS.values[i] : CMN_NAMESPACE;
  const srcGraph = ensureNestedSubgraph(graph, namespace);

  const vCount = panel.vCount;
  if (!state.graph) {
    state.graph = srcGraph;
    state.startIdx = state.index / 2 + vCount;
  }

  const isGraphSwitch = state.graph.id !== srcGraph.id;
  const isLastItem = i === len - 1;

  function addNodeAndCoords() {
    if (!id) {
      return;
    }
    let node = state.graph.findNode(id);
    if (!node) {
      node = new Node(id);
      const wasmId = state.index / 2 + vCount;
      coords[state.index++] = isLogic ? 7 : coordinates[0];
      coords[state.index++] = isLogic ? 7 : coordinates[1];
      const idx = state.graph.shallowNodeCount;
      const data = { wasmId, root, idx };
      node.setData(data);
      state.graph.addNode(node);
    }
    nodes[i] = node;
  }

  function closeRange() {
    const endExclusive = state.index / 2 + vCount;
    if (endExclusive > state.startIdx) {
      ranges.push([state.graph.id, NS_SEPARATOR, [state.startIdx, endExclusive]]);
      state.graph.positionRanges.push([state.startIdx, endExclusive]);
    }
  }

  if (isGraphSwitch) {
    // Close old graph range BEFORE switching graphs and adding last node coords
    closeRange();

    // Switch graph and start new range
    state.graph = srcGraph;
    state.startIdx = state.index / 2 + vCount;
  }

  // Add current node coords (for last item or graph switch last node)
  addNodeAndCoords();

  // If last item, close current graph range after adding coords
  if (isLastItem) {
    closeRange();
  }
}

function ensureNestedSubgraph(root: Graph, namespacePath: string): Graph {
  let currentGraph = root;

  if (!namespacePath) {
    return currentGraph;
  }

  const parts = namespacePath.split('.');
  let pathSegments: string[] = [];

  if (parts[0] !== CMN_NAMESPACE) {
    for (const part of parts) {
      pathSegments.push(part);
      const fullId = pathSegments.join(NS_SEPARATOR);

      let childGraph = Array.from(root.subgraphsBreadthFirst()).find((el: Graph) => el.id === fullId);

      if (fullId) {
        if (!childGraph) {
          childGraph = createAndAddSubgraph(currentGraph, fullId);
        }
        currentGraph = childGraph;
      }
    }
  }

  return currentGraph;
}

function createAndAddSubgraph(parent: Graph, id: string): Graph {
  const subgraph = new Graph(id);
  //console.log('add gr', id);

  //@ts-ignore
  GeomGraph.getGeom(parent).addNode(new GeomGraph(subgraph));

  return subgraph;
}
