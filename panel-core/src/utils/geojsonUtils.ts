type GeoJsonFeatureRecord = {
  type?: unknown;
  geometry?: unknown;
  properties?: Record<string, unknown> | null;
};

export type GeoJsonFeatureCollection = {
  type?: unknown;
  features: GeoJsonFeatureRecord[];
};

type GeoJsonFetch = typeof fetch;

export class GeoJsonLoadError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'GeoJsonLoadError';
    this.cause = cause;
  }
}

export function getGeoJsonLocName(properties: Record<string, unknown>, locField?: string): string | undefined {
  if (!locField) {
    return undefined;
  }

  const value = properties[locField];
  return value === undefined || value === null ? undefined : String(value);
}

export function getGeoJsonFeatureProperties(collection: GeoJsonFeatureCollection): string[] {
  const properties = collection.features.find((feature) => isRecord(feature.properties))?.properties;
  return properties ? Object.keys(properties) : [];
}

export async function fetchGeoJsonFeatureCollection(
  url: string,
  fetchFn: GeoJsonFetch = fetch
): Promise<GeoJsonFeatureCollection> {
  let response: Response;

  try {
    response = await fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/geo+json, application/json',
      },
    });
  } catch (error) {
    throw new GeoJsonLoadError(`Failed to fetch GeoJSON from ${url}`, error);
  }

  if (!response.ok) {
    const statusText = response.statusText ? ` ${response.statusText}` : '';
    throw new GeoJsonLoadError(`Failed to fetch GeoJSON from ${url}: HTTP ${response.status}${statusText}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new GeoJsonLoadError(`GeoJSON response from ${url} is not valid JSON`, error);
  }

  return validateGeoJsonFeatureCollection(body, url);
}

function validateGeoJsonFeatureCollection(value: unknown, source: string): GeoJsonFeatureCollection {
  if (!isRecord(value)) {
    throw new GeoJsonLoadError(`GeoJSON from ${source} must be an object`);
  }

  if (value.type !== undefined && value.type !== 'FeatureCollection') {
    throw new GeoJsonLoadError(`GeoJSON from ${source} must be a FeatureCollection`);
  }

  if (!Array.isArray(value.features)) {
    throw new GeoJsonLoadError(`GeoJSON from ${source} must contain a features array`);
  }

  value.features.forEach((feature, index) => {
    if (!isRecord(feature)) {
      throw new GeoJsonLoadError(`GeoJSON feature ${index} from ${source} must be an object`);
    }
    if (feature.type !== undefined && feature.type !== 'Feature') {
      throw new GeoJsonLoadError(`GeoJSON feature ${index} from ${source} must be a Feature`);
    }
    if (!('geometry' in feature)) {
      throw new GeoJsonLoadError(`GeoJSON feature ${index} from ${source} is missing geometry`);
    }
    if (feature.properties !== undefined && feature.properties !== null && !isRecord(feature.properties)) {
      throw new GeoJsonLoadError(`GeoJSON feature ${index} from ${source} has invalid properties`);
    }
  });

  return value as GeoJsonFeatureCollection;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
