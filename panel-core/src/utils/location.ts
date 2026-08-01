import { DataFrame, Field, FieldConfig, FieldType } from '@grafana/data';
import { Geometry, Point } from 'geojson';

import { ExtendFrameGeometrySourceMode } from '../extension';
import { Gazetteer } from '../grafana_core/app/features/geo/gazetteer/gazetteer';
import { decodeGeohash } from '../grafana_core/app/features/geo/format/geohash';
import { getLocationFields, type LocationFieldMatchers } from './locationMatchers';

export {
  getLocationFields,
  getLocationMatchers,
  type FieldFinder,
  type LocationFieldMatchers,
  type LocationFields,
} from './locationMatchers';

export interface ExtendedField<T> extends Omit<Field<T>, 'values'> {
  values: T[];
}

export interface FrameGeometryField {
  field?: ExtendedField<Geometry>;
  warning?: string;
  derived?: boolean;
  description?: string;
}

export function getGeometryField(frame: DataFrame, location: LocationFieldMatchers): FrameGeometryField {
  const fields = getLocationFields(frame, location);

  switch (fields.mode) {
    case ExtendFrameGeometrySourceMode.Auto:
      if (fields.geo) {
        return {
          field: fields.geo as ExtendedField<Geometry>,
        };
      }
      return {
        warning: 'Unable to find location fields',
      };

    case ExtendFrameGeometrySourceMode.Geojson:
      if (fields.geojson) {
        return {
          field: pointFieldFromGeoJSON(fields.geojson),
        };
      }
      return {
        warning: 'Unable to find location fields',
      };

    case ExtendFrameGeometrySourceMode.Coords:
      if (fields.longitude && fields.latitude) {
        return {
          field: pointFieldFromLonLat(fields.longitude, fields.latitude),
          derived: true,
          description: `${fields.mode}: ${fields.longitude.name}, ${fields.latitude.name}`,
        };
      }
      return {
        warning: 'Select longitude/latitude fields',
      };

    case ExtendFrameGeometrySourceMode.Geohash:
      if (fields.geohash) {
        return {
          field: pointFieldFromGeohash(fields.geohash),
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
            field: getGeoFieldFromGazetteer(location.gazetteer, fields.lookup),
            derived: true,
            description: `${fields.mode}: ${location.gazetteer.path}`,
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

function pointFieldFromGeoJSON(geojson: Field<string>): ExtendedField<Geometry> {
  const values: Geometry[] = [];

  for (const value of geojson.values) {
    if (!value) {
      continue;
    }
    const feature = JSON.parse(value);
    if (feature) {
      values.push({
        type: feature.type,
        coordinates: feature.coordinates,
      } as Geometry);
    }
  }

  return {
    name: 'Point',
    type: FieldType.geo,
    values,
    config: hiddenTooltipField,
  };
}

function pointFieldFromLonLat(lon: Field<number>, lat: Field<number>): ExtendedField<Geometry> {
  const values: Point[] = [];

  for (let i = 0; i < lon.values.length; i++) {
    const longitude = lon.values[i];
    const latitude = lat.values[i];

    if (longitude !== null && latitude !== null) {
      values.push({
        type: 'Point',
        coordinates: [longitude, latitude],
      });
    }
  }

  return {
    name: 'Point',
    type: FieldType.geo,
    values,
    config: hiddenTooltipField,
  };
}

function pointFieldFromGeohash(geohash: Field<string>): ExtendedField<Geometry> {
  const values: Point[] = [];

  for (const value of geohash.values) {
    if (!value) {
      continue;
    }
    const coordinates = decodeGeohash(value);
    if (coordinates) {
      values.push({ type: 'Point', coordinates });
    }
  }

  return {
    name: geohash.name ?? 'Point',
    type: FieldType.geo,
    values,
    config: hiddenTooltipField,
  };
}

function getGeoFieldFromGazetteer(gazetteer: Gazetteer, field: Field<string>): ExtendedField<Geometry> {
  const values: Point[] = [];

  for (const value of field.values) {
    const info = gazetteer.find(value);
    if (info?.coords) {
      values.push({ type: 'Point', coordinates: info.coords });
    }
  }

  return {
    name: 'Geometry',
    type: FieldType.geo,
    values,
    config: hiddenTooltipField,
  };
}

const hiddenTooltipField: FieldConfig = Object.freeze({
  custom: {
    hideFrom: { tooltip: true },
  },
});
