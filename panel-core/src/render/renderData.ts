import type { BinaryPointFeature } from '@loaders.gl/schema';
import { MyGeoJsonLayer, MyPathLayer, MyPolygonsLayer } from '../deckLayers';
import { getGraphPositionRanges, type Graph } from '../graph/main';
import { packGraphNodeBinaryRanges, selectGraphNodeFillColors } from '../utils';
import { emptyBiCol, NS_SEPARATOR } from '../types/defaults';
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
    .sort((a, b) => a.id.split(NS_SEPARATOR).length - b.id.split(NS_SEPARATOR).length)
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

interface SecondaryLayerState {
  layer: { colType?: string; features?: unknown[] };
  options: { type?: string; name?: string; isShowTooltip?: boolean };
}

export function buildSecondaryLayers({
  isLogic,
  layers,
  layerProps,
}: {
  isLogic: boolean;
  layers: readonly SecondaryLayerState[];
  layerProps: Record<string, unknown>;
}): RenderLayer[] {
  if (isLogic) {
    return [];
  }

  const result: RenderLayer[] = [];
  let polygonIndex = 0;
  let pathIndex = 0;
  let geoJsonIndex = 0;

  for (const state of layers.slice(1)) {
    const features = state.layer.features;
    if (state.layer.colType === 'markers' || !features?.length) {
      continue;
    }

    const pickable = Boolean(state.options.isShowTooltip);
    const common = { ...layerProps, pickable, name: state.options.name };
    switch (state.options.type) {
      case 'polygons':
        result.push(MyPolygonsLayer({ ...common, index: polygonIndex++, data: features }));
        break;
      case 'path':
        result.push(MyPathLayer({ ...common, index: pathIndex++, data: features, type: 'path' }));
        break;
      case 'geojson':
        result.push(
          MyGeoJsonLayer({
            ...common,
            index: geoJsonIndex++,
            data: { type: 'FeatureCollection', features },
          })
        );
        break;
    }
  }

  return result;
}
