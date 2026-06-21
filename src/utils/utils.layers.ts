import { isVisible, toRGB4Array } from '@mapgl/panel-core/deckLayers/utils';
import { GeoJsonLayer, PathLayer, TextLayer } from '@deck.gl/layers';
import { Layer } from '@deck.gl/core';
import { Graph } from '@mapgl/panel-core/graph';
import { getMapglFeatureServices, getNamespaceBoundaries } from '@mapgl/panel-core';
import {
  BBOX_OUTLINE_COLOR,
  BBOX_OUTLINE_WIDTH,
} from '@mapgl/panel-core/types/defaults';
import { type DeckLine, colTypes } from '@mapgl/panel-core/types';
import {
  LineTextLayer,
  MyArcLayer,
  MyIconLayer,
  EdgesGeojsonLayer,
  EdgeArrowLayer,
  NodesGeojsonLayer,
  LogicMainLabelTextLayer,
  LogicPlaceholderTextLayer,
} from '@mapgl/panel-core/deckLayers';

function genPrimaryLayers({ biCols, lineFeatures, commentFeatures, layerProps }) {
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
      icons.push(LogicPlaceholderTextLayer({ ...layerProps, biCol: col, visible }));
      icons.push(LogicMainLabelTextLayer({ ...layerProps, biCol: col, visible }));
    } else {
      icons.push(
        nodeLayer({
          ...layerProps,
          biCol: col,
          visible,
        })
      );
    }
  }

  const { visLayers, graph } = panel;
  const clusters = Array.from(graph.subgraphsBreadthFirst()) as Graph[];
  const graphs: Graph[] = clusters.concat([graph as Graph]);

  /// Bboxes polygons
  if ( isLogic && panel.layoutReady ) {
    const boundaries = getNamespaceBoundaries(getMapglFeatureServices().namespaceBoundaryProviders, {
      graph,
      visibleNamespaces: new Set(visLayers.getCategories()[1]),
      positions: panel.positions,
      layoutGraphBounds: panel.layoutGraphBounds,
      layerShift: panel.layerShift,
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

      return [{
        type: 'Polygon',
        properties: {
          id: boundaryGraph.id,
          locName: boundaryGraph.id,
          graph: boundaryGraph,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoords],
          center: [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2],
        },
      }];
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
        const geom = feature.geometry.coordinates[0];

        const [[minX, minY], [maxX], [, maxY]] = geom;

        const center_y = Math.max(maxY, minY);
        const center_x = (minX + maxX) / 2;

        const data = [
          {
            text: id,
            coordinates: [center_x, center_y],
          },
        ];
        bboxes.push(
          LineTextLayer({
            id: 'bbox-' + id,
            data,
            theme,
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
            theme,
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
          getWasmId2Edges: panel.graphEdgeIndex.wasm2Edges,
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

  return [bboxes, icons, arcsBase, lines, comments, edgeLabels];
}

export { genVisLayers, createDerivedLayers } from '@mapgl/panel-core/utils';
export { genPrimaryLayers };
