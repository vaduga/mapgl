import { decodeGeohash } from '@vaduga/mapgl-core/utils';
import { bindGraphSource, captureGrafanaValue } from '../../data/index';
import { GraphDiagnosticCollector, normalizeGraphSources, type GraphBoundLayer } from '@vaduga/mapgl-core/graph/frame';
import { resolveGraphFrames, selectGraphFrames } from './selection';

import type { GraphNormalizationInput, GraphPosition, GraphResolvedFrame } from './types';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const normalizeId = (value: unknown) => (value == null ? undefined : String(value).trim() || undefined);
function positionFromCoordinates(value: unknown): GraphPosition | undefined {
  if (!Array.isArray(value) || !isFiniteNumber(value[0]) || !isFiniteNumber(value[1])) {
    return undefined;
  }
  return Object.freeze([value[0], value[1]]) as GraphPosition;
}

function positionFromGeoJSON(value: unknown): GraphPosition | undefined {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return undefined;
  }

  const object = parsed as {
    type?: string;
    coordinates?: unknown;
    geometry?: { type?: string; coordinates?: unknown };
  };
  const geometry = object.type === 'Feature' ? object.geometry : object;
  if (geometry?.type !== 'Point') {
    return undefined;
  }
  return positionFromCoordinates(geometry.coordinates);
}

function positionAt(frame: GraphResolvedFrame, rowIndex: number, isLogic: boolean): GraphPosition | undefined {
  if (isLogic) {
    return Object.freeze([7, 7]) as GraphPosition;
  }

  const location = frame.location;
  if (location.geojson) {
    return positionFromGeoJSON(location.geojson.values[rowIndex]);
  }
  if (location.geo) {
    return positionFromGeoJSON(location.geo.values[rowIndex]);
  }
  if (location.longitude && location.latitude) {
    const longitude = location.longitude.values[rowIndex];
    const latitude = location.latitude.values[rowIndex];
    return isFiniteNumber(longitude) && isFiniteNumber(latitude)
      ? (Object.freeze([longitude, latitude]) as GraphPosition)
      : undefined;
  }
  if (location.geohash) {
    const value = location.geohash.values[rowIndex];
    const position = typeof value === 'string' ? decodeGeohash(value) : undefined;
    return position ? (Object.freeze(position) as GraphPosition) : undefined;
  }
  if (location.lookup && location.findLookup) {
    const value = normalizeId(location.lookup.values[rowIndex]);
    const position = value ? location.findLookup(value) : undefined;
    return position ? (Object.freeze([...position]) as GraphPosition) : undefined;
  }
  return undefined;
}

let revision = 0;
export async function bindGraphFrames(input: GraphNormalizationInput) {
  input = {
    ...input,
    data: {
      series: input.data.series.map((frame) => ({
        ...frame,
        fields: frame.fields.map((field) => ({
          ...field,
          values: field.values.map((value) => captureGrafanaValue(value)),
          config: captureGrafanaValue(field.config),
          state: field.state ? { ...field.state } : undefined,
        })),
      })),
    },
  };
  const layers = input.normalizationLayers?.length
    ? input.normalizationLayers
    : [{ layerIndex: undefined, options: input.options }];
  const diagnostics = new GraphDiagnosticCollector(input.options.diagnosticExampleLimit);
  const bound: GraphBoundLayer[] = [];
  const sourceRevision = input.revision ?? `normalization-${++revision}`;
  for (const layer of layers) {
    const selections = selectGraphFrames(input.data.series, layer.options.query);
    if (!selections.length) {
      diagnostics.add('no-matching-frames', 'info', 'No data frames matched the configured graph layer', {
        layerName: layer.options.layerName,
        layerIndex: layer.layerIndex,
      });
    }
    const result = await resolveGraphFrames(selections, layer.options);
    diagnostics.addAll(result.diagnostics);
    if (result.ok) {
      bound.push({
        layerIndex: layer.layerIndex,
        options: layer.options,
        sources: result.value.map((resolved) =>
          bindGraphSource({
            frame: resolved.selection.frame,
            sourceIndex: resolved.selection.frameIndex,
            revision: sourceRevision,
            fields: resolved,
            snapshot: true,
            position: (rowIndex) => positionAt(resolved, rowIndex, layer.options.isLogic),
          })
        ),
      });
    }
  }
  return {
    normalization: { layers: bound, diagnostics: diagnostics.result() },
    frames: input.data.series,
    revision: sourceRevision,
  };
}
export { graphFrameKey } from '@vaduga/mapgl-core/graph/frame';

export async function normalizeGraphFrames(
  input: GraphNormalizationInput,
  internalOptions: { readonly packedMaxRef?: number } = {}
) {
  const bound = await bindGraphFrames(input);
  return normalizeGraphSources(bound.normalization, internalOptions);
}
