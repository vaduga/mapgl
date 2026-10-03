import {
  FieldMatcherID,
  FieldType,
  getFieldDisplayName,
  getFieldMatcher,
  type DataFrame,
  type Field,
  type FieldMatcher,
} from '@grafana/data';
import type { Geometry } from 'geojson';

import type { ExtendFrameGeometrySource, ExtendFrameGeometrySourceMode } from '../extension';
import { getGazetteer, type Gazetteer } from '../grafana_core/app/features/geo/gazetteer/gazetteer';

const LOCATION_MODE = {
  Auto: 'auto',
  Geojson: 'geojson',
  Geohash: 'geohash',
  Coords: 'coords',
  Lookup: 'lookup',
} as const;

export interface FieldFinder {
  (frame: DataFrame): Field | undefined;
}

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
      const displayName = getFieldDisplayName(field, frame);
      if (names.has(displayName)) {
        return field;
      }
    }
    return undefined;
  };
}

export interface LocationFieldMatchers {
  mode: ExtendFrameGeometrySourceMode;
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
  mode: LOCATION_MODE.Auto as ExtendFrameGeometrySourceMode,
  geojson: matchLowerNames(new Set(['location', 'geojson'])),
  geohash: matchLowerNames(new Set(['geohash'])),
  longitude: matchLowerNames(new Set(['longitude', 'lon', 'lng'])),
  latitude: matchLowerNames(new Set(['latitude', 'lat'])),
  h3: matchLowerNames(new Set(['h3'])),
  wkt: matchLowerNames(new Set(['wkt'])),
  lookup: matchLowerNames(new Set(['lookup'])),
  geo: (frame: DataFrame) => frame.fields.find((field) => field.type === FieldType.geo),
};

export async function getLocationMatchers(src?: ExtendFrameGeometrySource): Promise<LocationFieldMatchers> {
  const info: LocationFieldMatchers = {
    ...defaultMatchers,
    mode: src?.mode ?? (LOCATION_MODE.Auto as ExtendFrameGeometrySourceMode),
  };
  switch (info.mode) {
    case LOCATION_MODE.Geohash:
      if (src?.geohash) {
        info.geohash = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.geohash }));
      }
      break;
    case LOCATION_MODE.Lookup:
      if (src?.lookup) {
        info.lookup = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.lookup }));
      }
      info.gazetteer = await getGazetteer(src?.gazetteer);
      break;
    case LOCATION_MODE.Coords:
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
    case LOCATION_MODE.Geojson:
      if (src?.geojson) {
        info.geojson = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.geojson }));
      }
      break;
  }
  return info;
}

export interface LocationFields {
  mode: ExtendFrameGeometrySourceMode;
  geojson?: Field;
  geohash?: Field;
  longitude?: Field;
  latitude?: Field;
  h3?: Field;
  wkt?: Field;
  lookup?: Field;
  geo?: Field<Geometry | undefined>;
  locName?: Field;
  vertexA_NS?: Field;
  vertexB_NS?: Field;
}

export function getLocationFields(frame: DataFrame, location: LocationFieldMatchers): LocationFields {
  const fields: LocationFields = {
    mode: location.mode ?? (LOCATION_MODE.Auto as ExtendFrameGeometrySourceMode),
  };

  if (fields.mode === LOCATION_MODE.Auto) {
    fields.geojson = location.geojson(frame);
    if (fields.geojson) {
      fields.mode = LOCATION_MODE.Geojson as ExtendFrameGeometrySourceMode;
      return fields;
    }

    fields.geo = location.geo(frame);
    if (fields.geo) {
      return fields;
    }

    fields.longitude = location.longitude(frame);
    fields.latitude = location.latitude(frame);
    if (fields.longitude && fields.latitude) {
      fields.mode = LOCATION_MODE.Coords as ExtendFrameGeometrySourceMode;
      return fields;
    }
    fields.geohash = location.geohash(frame);
    if (fields.geohash) {
      fields.mode = LOCATION_MODE.Geohash as ExtendFrameGeometrySourceMode;
      return fields;
    }
    fields.lookup = location.lookup(frame);
    if (fields.lookup) {
      fields.mode = LOCATION_MODE.Lookup as ExtendFrameGeometrySourceMode;
      return fields;
    }
  }

  switch (fields.mode) {
    case LOCATION_MODE.Geojson:
      fields.geojson = location.geojson(frame);
      break;
    case LOCATION_MODE.Coords:
      fields.longitude = location.longitude(frame);
      fields.latitude = location.latitude(frame);
      break;
    case LOCATION_MODE.Geohash:
      fields.geohash = location.geohash(frame);
      break;
    case LOCATION_MODE.Lookup:
      fields.lookup = location.lookup(frame);
      break;
  }

  return fields;
}
