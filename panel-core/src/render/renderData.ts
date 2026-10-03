import type { BinaryPointFeature } from '@loaders.gl/schema';
import { MyGeoJsonLayer } from '../deckLayers/GeoJsonStaticLayer/static-geojson-layer';
import { MyPathLayer } from '../deckLayers/PathLayer/path-layer';
import { MyPolygonsLayer } from '../deckLayers/PolygonsLayer/polygons-layer';
import { getGraphPositionRanges, type Graph } from '../graph/main';
import { packGraphNodeBinaryRanges, selectGraphNodeFillColors } from '../utils/binaryRanges';
import { emptyBiCol } from '../types/defaults';
import { splitNsId } from '../graph/utils/utils.graph';
import type { GraphBiFeatCol } from '../types';
import type { RenderLayer } from './layers';

export interface GraphBinaryCollectionsInput {
  graphs: readonly Graph[];
  visibleNamespaces: readonly string[];
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
  visibleNamespaces,
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

  return graphs
    .filter((graph) => visibleNamespaces.includes(graph.id))
    .sort((a, b) => splitNsId(a.id).length - splitNsId(b.id).length)
    .map((graph) => {
      const positionRanges = getGraphPositionRanges(graph);
      const packed = packGraphNodeBinaryRanges({ positions, colors, muted, annotations, groupIndices }, positionRanges);
      const fillColors = selectGraphNodeFillColors(
        { muted: packed.muted, annotations: packed.annotations },
        showAnnotations
      );
      const featureIds = { value: new Uint16Array(packed.count), size: 1 };
      const globalFeatureIds = { value: new Uint32Array(packed.count), size: 1 };
      let offset = 0;

      for (const [start, end] of positionRanges) {
        for (let index = start; index < end; index++) {
          globalFeatureIds.value[offset] = offset;
          featureIds.value[offset++] = index;
        }
      }

      return {
        ...emptyBiCol,
        shape: 'binary-feature-collection',
        graph,
        groupIndices: packed.groupIndices,
        annots: packed.annotations,
        points: {
          type: 'Point',
          positions: { value: packed.positions, size: 2 },
          attributes: {
            getFillColor: { value: fillColors, size: 4, normalized: true },
            getColor: { value: packed.colors, size: 4, normalized: true },
          },
          featureIds,
          globalFeatureIds,
          numericProps: {},
          properties: features,
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
