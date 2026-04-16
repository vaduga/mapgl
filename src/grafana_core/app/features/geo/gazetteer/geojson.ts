import { PlacenameInfo, Gazetteer } from './gazetteer';

interface GeoJSONGeometry {
  type?: string;
  coordinates?: unknown;
}

interface GeoJSONFeature {
  id?: string | number;
  geometry?: GeoJSONGeometry;
  properties?: Record<string, unknown>;
}

interface GeoJSONFeatureCollection {
  type?: string;
  features?: GeoJSONFeature[];
}

function getCoords(geometry?: GeoJSONGeometry): [number, number] | undefined {
  if (!geometry) {
    return undefined;
  }

  if (geometry.type === 'Point') {
    const coords = geometry.coordinates;
    if (Array.isArray(coords) && coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return [coords[0], coords[1]];
    }
  }

  if (geometry.type === 'MultiPoint') {
    const coords = geometry.coordinates;
    if (
      Array.isArray(coords) &&
      Array.isArray(coords[0]) &&
      coords[0].length >= 2 &&
      typeof coords[0][0] === 'number' &&
      typeof coords[0][1] === 'number'
    ) {
      return [coords[0][0], coords[0][1]];
    }
  }

  return undefined;
}

export function loadFromGeoJSON(path: string, body: GeoJSONFeatureCollection): Gazetteer {
  const data = body.features ?? [];
  let count = 0;
  const values = new Map<string, PlacenameInfo>();

  for (const feature of data) {
    const coords = getCoords(feature.geometry);
    if (!coords) {
      continue;
    }

    const info: PlacenameInfo = { coords };
    const id = feature.id;
    if (id != null) {
      const key = String(id);
      values.set(key, info);
      values.set(key.toUpperCase(), info);
    }

    const properties = feature.properties;
    if (properties) {
      for (const key of Object.keys(properties)) {
        if (key.includes('_code') || key.includes('_id')) {
          const value = properties[key];
          if (value != null) {
            const normalized = String(value);
            values.set(normalized, info);
            values.set(normalized.toUpperCase(), info);
          }
        }
      }
    }

    count++;
  }

  return {
    path,
    find: (k) => {
      let v = values.get(k);
      if (!v && typeof k === 'string') {
        v = values.get(k.toUpperCase());
      }
      return v;
    },
    count,
    examples: (limit) => {
      const first: string[] = [];
      if (values.size < 1) {
        first.push('no values found');
      } else {
        for (const key of values.keys()) {
          first.push(key);
          if (first.length >= limit) {
            break;
          }
        }
      }
      return first;
    },
  };
}
