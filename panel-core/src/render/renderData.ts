import type { BinaryPointFeature } from '@loaders.gl/schema';
import { MyGeoJsonLayer } from '../deckLayers/GeoJsonStaticLayer/static-geojson-layer';
import { MyPathLayer } from '../deckLayers/PathLayer/path-layer';
import { MyPolygonsLayer } from '../deckLayers/PolygonsLayer/polygons-layer';
import { type Graph } from '../graph/main';
import { emptyBiCol } from '../types/defaults';
import type { GraphBiFeatCol } from '../types';
import type { RenderLayer } from './layers';

export interface GraphBinaryCollectionsInput {
  graphs: readonly Graph[];
  features: readonly unknown[] | undefined;
  positions: Float64Array | undefined;
  colors: Uint8Array | undefined;
  muted: Uint8Array | undefined;
  annotations: Uint8Array | undefined;
  groupIndices: Uint8Array | undefined;
  showAnnotations: boolean;
  hide: boolean;
}

export function buildGraphBinaryCollections({
  graphs,
  features,
  positions,
  colors,
  muted,
  annotations,
  groupIndices,
  showAnnotations,
  hide,
}: GraphBinaryCollectionsInput): GraphBiFeatCol[] {
  if (hide || !features?.length || !positions || !colors || !muted || !annotations || !groupIndices) {
    return [];
  }

  const graph = graphs[0];
  if (!graph) return [];
  const byLayer = new Map<string, number[]>();
  features.forEach((feature: any, ref) => {
    const name = feature.layerName ?? '';
    const refs = byLayer.get(name) ?? [];
    refs.push(ref);
    byLayer.set(name, refs);
  });
  return [...byLayer].map(([dataLayerId, refs]) => {
    const whole = refs.length === features.length;
    const select = <T extends Float64Array | Uint8Array>(values: T, size: number): T => {
      if (whole) return values;
      const out = new (values.constructor as any)(refs.length * size) as T;
      refs.forEach((ref, index) => out.set(values.subarray(ref * size, (ref + 1) * size), index * size));
      return out;
    };
    const ids = Uint32Array.from({ length: refs.length }, (_, index) => index);
    const nodeRefs = Uint32Array.from(refs);
    const fillMuted = select(muted, 4),
      fillAnnotations = select(annotations, 4);
    return {
      ...emptyBiCol,
      shape: 'binary-feature-collection',
      graph,
      dataLayerId,
      nodeRefs,
      groupIndices: select(groupIndices, 1),
      annots: fillAnnotations,
      muted: fillMuted,
      points: {
        type: 'Point',
        positions: { value: select(positions, 2), size: 2 },
        attributes: {
          getFillColor: { value: showAnnotations ? fillAnnotations : fillMuted, size: 4, normalized: true },
          getColor: { value: select(colors, 4), size: 4, normalized: true },
        },
        featureIds: { value: ids, size: 1 },
        globalFeatureIds: { value: ids, size: 1 },
        numericProps: {},
        properties: whole ? features : refs.map((ref) => features[ref]),
      } as unknown as BinaryPointFeature,
    } as GraphBiFeatCol;
  });
}

export interface SecondaryRenderDescriptor {
  readonly kind: 'polygons' | 'path' | 'geojson';
  readonly name?: string;
  readonly features: readonly unknown[];
  readonly pickable: boolean;
}
export interface SecondaryPresentation {
  readonly isMeters?: boolean;
  readonly isDark?: boolean;
  readonly onHover?: (info: any) => void;
  readonly highlightColor?: import('@deck.gl/core').Color;
  readonly getVisLayers: import('../store/VisLayers').VisLayers;
}

export function buildSecondaryLayers(
  descriptors: readonly SecondaryRenderDescriptor[],
  presentation: SecondaryPresentation
): RenderLayer[] {
  const counts = { polygons: 0, path: 0, geojson: 0 };
  return descriptors.flatMap<RenderLayer>((descriptor) => {
    if (!descriptor.features.length) {
      return [];
    }
    const common = {
      ...presentation,
      pickable: descriptor.pickable,
      name: descriptor.name,
      index: counts[descriptor.kind]++,
    };
    switch (descriptor.kind) {
      case 'polygons':
        return [MyPolygonsLayer({ ...common, data: descriptor.features })];
      case 'path':
        return [MyPathLayer({ ...common, data: descriptor.features, type: 'path' })];
      case 'geojson':
        return [MyGeoJsonLayer({ ...common, data: { type: 'FeatureCollection', features: descriptor.features } })];
    }
  });
}
