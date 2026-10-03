import type { Layer } from '@deck.gl/core';
import { GeoJsonLayer, PathLayer, TextLayer } from '@deck.gl/layers';
import type { RenderLayerBundle } from '@vaduga/mapgl-grafana-adapter/render';
import { colTypes, type DeckLine } from '@vaduga/mapgl-grafana-adapter/types';
import {
  EdgeArrowLayer,
  EdgesGeojsonLayer,
  LineTextLayer,
  MainLabelTextLayer,
  MyArcLayer,
  MyIconLayer,
  NodesGeojsonLayer,
  PlaceholderTextLayer,
} from '@vaduga/mapgl-core/deckLayers';
import { isVisible, toRGB4Array } from '@vaduga/mapgl-core/deckLayers/utils';
import { getGraphNsLabel, type Graph } from '@vaduga/mapgl-core/graph/main';
import { getNamespaceBoundaries } from '@vaduga/mapgl-core';
import { BBOX_OUTLINE_COLOR, BBOX_OUTLINE_WIDTH } from '@vaduga/mapgl-core/types/defaults';

function genPrimaryLayers({ biCols, lineFeatures, commentFeatures, layerProps }): RenderLayerBundle {
  let comments;
  const lines: any[] = [];
  const arcsBase: any[] = [];
  const edgeLabels: any[] = [];
  const { theme, baseLayer, options, getVisLayers, isRouted, panel, isLogic } = layerProps;

  const icons: Layer[] = [];

  const bboxes: Array<PathLayer | TextLayer | GeoJsonLayer> = [];
  const nodeLayer = NodesGeojsonLayer;
  const lineLayer = EdgesGeojsonLayer;

  for (const col of biCols ?? []) {
    const visible = isVisible(getVisLayers, { index: null, name: col.graph.id, group: 'graph' });
    if (isLogic) {
      icons.push(
        nodeLayer({
          ...layerProps,
          biCol: col,
          visible,
          pointTypeOverride: 'circle+icon',
          idSuffix: '-main',
        })
      );
    } else {
      icons.push(
        nodeLayer({
          ...layerProps,
          biCol: col,
          visible,
        })
      );
    }
    icons.push(PlaceholderTextLayer({ ...layerProps, biCol: col, visible }));
    if (isLogic) {
      icons.push(MainLabelTextLayer({ ...layerProps, biCol: col, visible }));
    }
  }

  const visLayers = panel.scene.visibility;
  const graph = panel.scene.render.graph;
  const clusters = Array.from(graph.subgraphsBreadthFirst()) as Graph[];
  const graphs: Graph[] = clusters.concat([graph as Graph]);

  /// Bboxes polygons
  if (isLogic && panel.scene.ready) {
    const boundaries = getNamespaceBoundaries(layerProps.featureServices.namespaceBoundaryProviders, {
      graph,
      visibleNamespaces: new Set(visLayers.getCategories()[1]),
      positions: panel.scene.render.positions,
      layoutGraphBounds: panel.scene.render.graphBounds,
      layerShift: panel.scene.layerShift,
    });
    const graphById = new Map(clusters.map((cluster) => [cluster.id, cluster]));
    const features = boundaries.flatMap((boundary) => {
      const [minX, minY, maxX, maxY] = boundary.bounds;
      const boundaryGraph = graphById.get(boundary.namespace);
      if (!boundaryGraph) {
        return [];
      }

      const polygonCoords: any = [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY],
      ];

      return [
        {
          type: 'Polygon',
          properties: {
            id: boundaryGraph.id,
            locName: boundaryGraph.id,
            namespaceLabel: getGraphNsLabel(boundaryGraph) ?? boundaryGraph.id,
            graph: boundaryGraph,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [polygonCoords],
            center: [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2],
          },
        },
      ];
    });

    let bboxFeatCollection = {
      type: 'FeatureCollection',
      features,
    };

    if (bboxFeatCollection.features.length) {
      const props = {
        id: 'bbox-polygons',
        ...layerProps,
        rects: bboxFeatCollection,
        biCols,
        getLineColor: toRGB4Array(BBOX_OUTLINE_COLOR),
        getLineWidth: BBOX_OUTLINE_WIDTH,
        lineWidthUnits: 'pixels', // or 'meters'
        lineWidthScale: 1,
        filled: true,
        stroked: true,
      };
      const polygonsLayer = new GeoJsonLayer({
        ...props,
        pickable: false,
        data: bboxFeatCollection,
        filled: false,
      });
      bboxes.push(polygonsLayer);

      bboxFeatCollection.features.forEach((feature) => {
        const id = feature.properties.id;
        const namespaceLabel = feature.properties.namespaceLabel;
        const geom = feature.geometry.coordinates[0];

        const [[minX, minY], [maxX], [, maxY]] = geom;

        const center_y = Math.max(maxY, minY);
        const center_x = (minX + maxX) / 2;

        const data = [
          {
            text: namespaceLabel,
            coordinates: [center_x, center_y],
          },
        ];
        bboxes.push(
          LineTextLayer({
            id: 'bbox-' + id,
            data,
            isDark: theme.isDark,
            visible: true,
            baseLayer: layerProps.baseLayer,
            isLogic,
            options,
            getVisLayers: visLayers,
            type: 'bbox',
          })
        );
      });
    }
  }

  /// Edges render

  const showGraph = isVisible(getVisLayers, {
    index: null,
    name: 'graph',
    group: 'graph',
  });

  const visible =
    showGraph &&
    isVisible(getVisLayers, {
      index: null,
      name: colTypes.Edges,
      group: colTypes.Edges,
    });

  if (lineFeatures && Object.keys(lineFeatures).length) {
    for (const [srcGraphId, features] of Object.entries(lineFeatures)) {
      if (!(features as DeckLine[])?.length) {
        continue;
      }

      if (!isRouted) {
        const props = {
          ...layerProps,
          srcGraphId,
          lineFeatures: features,
          visible,
        };

        lines.push(MyArcLayer(props));
        arcsBase.push(MyArcLayer({ ...props, isBase: true }));

        edgeLabels.push(
          LineTextLayer({
            getVisLayers,
            id: srcGraphId,
            data: features,
            visible,
            type: 'arcLabels',
            isLogic,
            options,
            baseLayer,
            isDark: theme.isDark,
          })
        );
      } else {
        const linesCollection = {
          type: 'FeatureCollection' as const,
          features: (features as DeckLine[]).filter(Boolean),
        };

        const props = {
          ...layerProps,
          srcGraphId,
          linesCollection,
          edgeIndex: panel.scene.render.edgeIndex,
          visible,
        };

        lines.push(lineLayer(props));
        lines.push(EdgeArrowLayer(props));
      }
    }
  }

  if (commentFeatures?.length && isRouted) {
    comments = MyIconLayer({
      ...layerProps,
      showGraph,
      data: commentFeatures,
    });
  }

  return {
    bounds: bboxes,
    nodes: icons,
    baseEdges: arcsBase,
    edges: lines,
    comments,
    labels: edgeLabels,
  };
}

export { createDerivedLayers, genVisLayers } from '@vaduga/mapgl-grafana-adapter/utils';
export { genPrimaryLayers };
