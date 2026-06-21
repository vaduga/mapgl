import { DataFrame, KeyValue } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import { loadFromGeoJSON } from './geojson';
import { loadWorldmapPoints } from './worldmap';

export interface PlacenameInfo {
  coords: [number, number]; // lon, lat (WGS84)
  props?: Record<string, any>;
}

export interface Gazetteer {
  path: string;
  error?: string;
  find: (key: string) => PlacenameInfo | undefined;
  examples: (count: number) => string[];
  frame?: () => DataFrame;
  count?: number;
}

// Without knowing the datatype pick a good lookup function
export function loadGazetteer(path: string, data: any): Gazetteer {
  if (Array.isArray(data)) {
    const first = data[0];
    // Check for legacy worldmap syntax
    if (first.latitude && first.longitude && (first.key || first.keys)) {
      return loadWorldmapPoints(path, data);
    }
  }

  const features = data?.features;
  if (Array.isArray(features) && data?.type === 'FeatureCollection') {
    return loadFromGeoJSON(path, data);
  }

  return {
    path,
    error: 'Unsupported data format',
    find: () => undefined,
    examples: () => [],
  };
}

const registry: KeyValue<Gazetteer> = {};

export const COUNTRIES_GAZETTEER_PATH = 'public/gazetteer/countries.json';

/**
 * Given a path to a file return a cached lookup function
 */
export async function getGazetteer(path?: string): Promise<Gazetteer> {
  // When not specified, use the default path
  if (!path) {
    path = COUNTRIES_GAZETTEER_PATH;
  }

  let lookup = registry[path];
  if (!lookup) {
    try {
      // block the async function
      const data = await getBackendSrv().get(path!);
      lookup = loadGazetteer(path, data);
    } catch (err) {
      console.warn('Error loading placename lookup', path, err);
      lookup = {
        path,
        error: 'Error loading URL',
        find: (k) => undefined,
        examples: (v) => [],
      };
    }
    registry[path] = lookup;
  }
  return lookup;
}
