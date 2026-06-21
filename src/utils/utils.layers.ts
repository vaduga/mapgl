import { isVisible, toRGB4Array } from '@mapgl/panel-core/deckLayers/utils';
import { GeoJsonLayer, PathLayer, TextLayer } from '@deck.gl/layers';
import { Layer } from '@deck.gl/core';
import {
  Graph,
  getGraphComments,
} from '@mapgl/panel-core/graph';
import { getMapglFeatureServices, getNamespaceBoundaries } from '@mapgl/panel-core';
import {
  BBOX_OUTLINE_COLOR,
  BBOX_OUTLINE_WIDTH,
  NS_SEPARATOR,
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
import { MapPanel } from '../MapPanel';
import { VisLayers } from '@mapgl/panel-core/store';

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

function genVisLayers(panel: MapPanel, props) {
  const { groups, isLogic, graph, hasAnnots, useMockData } = panel;
  const { options, replaceVariables } = props;
  const dataLayers = options.dataLayers;
  const visLayers = new VisLayers();

  /// Layer Switcher

  const userLayers: { [key: string]: number } = {};
  if (dataLayers?.length) {
    const nodeLayers = dataLayers?.filter((l) => l.type === colTypes.Markers);
    const nodesCollections = nodeLayers?.reduce((acc, el, index) => {
      acc.push([el, index]);
      return acc;
    }, []);

    const userColTypes = [...new Set((isLogic ? nodeLayers : dataLayers).map((el) => el.type))];
    userColTypes.forEach((type: any) => {
      userLayers[type] = visLayers.addLayer(type, type, type, false, true, false, null, false); /// parent idx
    });

    dataLayers.forEach((layer) => {
      const parentIdx = userLayers[layer.type];
      if (parentIdx !== undefined) {
        visLayers.addLayer(layer.name, layer.name, layer.type, false, true, false, parentIdx, false);
      }
    });

    if (nodesCollections.length) {
      createDerivedLayers(visLayers, graph, isLogic, replaceVariables, useMockData);
    }
  }

  const len = groups.length + (hasAnnots ? 1 : 0);
  visLayers.setActiveGroups(new Uint8Array(len).fill(1));
  return visLayers;
}

function createDerivedLayers(visLayers: VisLayers, graph: Graph, isLogic, replaceVariables, useMockData = false) {
  const graphs: Graph[] = [graph as Graph].concat(Array.from((graph as Graph).subgraphsBreadthFirst()));
  const hasComments = graph ? !isLogic && graphs.some((g) => Object.keys(getGraphComments(g)).length) : false;

  // Map from graph ID to visLayers index
  const idToLayerIdx = new Map<string, number>();
  const graphIdx = visLayers.addLayer('graph', 'graph', 'graph', false, true, false, null, false);

  for (const g of graphs) {
    const id = g.id;
    const segments = id.split(NS_SEPARATOR);
    const label = segments[segments.length - 1]; // Use last segment as label
    const parentId = segments.length > 1 ? segments.slice(0, -1).join(NS_SEPARATOR) : 'graph';
    const parentIdx = parentId !== 'graph' ? idToLayerIdx.get(parentId) : graphIdx;

    const layerIdx = visLayers.addLayer(
      label,
      id,
      parentId, //'graph',
      false,
      true,
      false,
      parentIdx ?? null,
      false
    );

    idToLayerIdx.set(id, layerIdx);
  }

  const rVar = useMockData ? '1' : replaceVariables(`$routed`);
  const parsed = parseInt(rVar, 10);
  const isRouted = !isNaN(parsed) ? parsed > 0 : true;

  const parentIdx = null;
  visLayers.addLayer(colTypes.Circle, colTypes.Circle, colTypes.Circle, false, true, false, parentIdx, false);
  visLayers.addLayer(colTypes.SVG, colTypes.SVG, colTypes.SVG, false, true, false, parentIdx, false);
  visLayers.addLayer(colTypes.Label, colTypes.Label, colTypes.Label, false, true, false, parentIdx, false);
  hasComments &&
    visLayers.addLayer(colTypes.Comments, colTypes.Comments, colTypes.Comments, false, true, false, parentIdx, false);
  visLayers.addLayer(colTypes.Edges, colTypes.Edges, colTypes.Edges, false, true, false, parentIdx, false);
  visLayers.addLayer(colTypes.Routed, colTypes.Routed, colTypes.Routed, false, isRouted, false, parentIdx, false);
}

export { genVisLayers, genPrimaryLayers, createDerivedLayers };
