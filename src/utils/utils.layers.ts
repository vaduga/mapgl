import { collectGroups, getGraphLayers, loadSvgIcons, newUniqueIconNames, toRGB4Array } from './utils.plugin';
import { GeomGraph, Graph } from 'mapLib';
import { LineTextLayer } from '../deckLayers/TextLayer/text-layer';
import { MyIconLayer } from '../deckLayers/IconLayer/icon-layer';
import { MyArcLayer } from '../deckLayers/ArcLayer/arc-layer';
import { GeoJsonLayer, PathLayer, TextLayer } from '@deck.gl/layers';
import { Layer } from '@deck.gl/core';
import { DeckLine, colTypes, NS_SEPARATOR, NS_PADDING, BBOX_OUTLINE_WIDTH, BBOX_OUTLINE_COLOR } from 'mapLib/utils';
import { Rule } from 'editor/Groups/rule-types';
import {
  LogicMainLabelTextLayer,
  LogicPlaceholderTextLayer,
  NodesGeojsonLayer,
} from '../deckLayers/GeoJsonNodesLayer/nodes-geojson-layer';
import { EdgesGeojsonLayer } from '../deckLayers/GeoJsonEdgesLayer/edges-geojson-layer';
import { EdgeArrowLayer } from '../deckLayers/ArrowLayer/edge-arrow-layer';
import { GeomapPanel } from '../GeomapPanel';
import { VisLayers } from '../store/visLayers';

function genPrimaryLayers({ biCols, lineFeatures, commentFeatures, layerProps }) {
  let comments;
  const lines: any[] = [];
  const arcsBase: any[] = [];
  const edgeLabels: any[] = [];
  const { theme, baseLayer, options, getVisLayers, isHyper, panel, isLogic } = layerProps;

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
  if (isLogic) {
    const features: any[] = [];
    const bboxCols: any = {};
    for (const c of clusters) {
      const gId = c.id;
      if (gId && !bboxCols[gId]) {
        //@ts-ignore
        const rawBbox = GeomGraph.getGeom(c).getPumpedGraphWithMarginsBox();
        const bbox = rawBbox && {
          minX: rawBbox.left_,
          minY: rawBbox.bottom_,
          maxX: rawBbox.right_,
          maxY: rawBbox.top_,
        };

        const graph = Array.from(clusters).find((el) => el.id === gId);
        if (bbox) {
          bboxCols[gId] = { graph, bbox };
        }
      }
    }

    Object.values(bboxCols).forEach((col: any, i) => {
      let minX, minY, maxX, maxY;
      ({ minX, minY, maxX, maxY } = col.bbox);

      const polygonCoords: any = [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY],
      ];

      const polyFeature = {
        type: 'Polygon',
        properties: {
          id: col.graph.id,
          locName: col.graph.id,
          root: col.graph,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoords],
          center: [minX + (maxX - minX) / 2, minY + (maxY - minY) / 2],
        },
      };
      features.push(polyFeature);
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

      if (!isHyper) {
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
          getWasmId2Edges: graph.getWasmId2Edges,
          visible,
        };

        lines.push(lineLayer(props));
        lines.push(EdgeArrowLayer(props));
      }
    }
  }

  if (commentFeatures?.length && isHyper) {
    comments = MyIconLayer({
      ...layerProps,
      showGraph,
      data: commentFeatures,
    });
  }

  return [bboxes, icons, arcsBase, lines, comments, edgeLabels];
}

function genNodeLayers({ biCols, layerProps }) {
  const { getVisLayers, isLogic } = layerProps;
  const icons: Layer[] = [];
  const nodeLayer = NodesGeojsonLayer;

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
  return icons;
}

function genEdgeLayers({
  lineFeatures,
  layerProps,
  isHyperOverride,
}: {
  lineFeatures: any;
  layerProps: any;
  isHyperOverride?: boolean;
}) {
  const { theme, baseLayer, options, getVisLayers, panel, isLogic } = layerProps;
  const isHyper = isHyperOverride ?? layerProps.isHyper;
  const lines: any[] = [];
  const arcsBase: any[] = [];
  const edgeLabels: any[] = [];
  const lineLayer = EdgesGeojsonLayer;
  const graph = panel.graph;

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

      if (!isHyper) {
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
          getWasmId2Edges: graph.getWasmId2Edges,
          visible,
        };

        lines.push(lineLayer(props));
        lines.push(EdgeArrowLayer(props));
      }
    }
  }

  return { arcsBase, lines, edgeLabels };
}

async function initGroups(groups: Rule[], layers, svgIcons, theme, loadController: AbortController, reload = false) {
  const nsLayers = layers?.slice(1); //reload ? 1 : 0)

  const iconNames = new Set<string>();

  collectGroups(groups, iconNames, nsLayers, theme);

  const newNames = newUniqueIconNames(svgIcons, iconNames);
  if (newNames.length) {
    await loadSvgIcons(newNames, svgIcons, loadController);
  }
}

function isVisible(getVisLayers, args: { index: number | null; name: string | null; group: string | null }) {
  const { index, name, group } = args;

  const [visible, indeterminate] = getVisLayers.getVisState(index, name, group) ?? [true, false];

  return visible && !indeterminate;
}

function findSubgraphById(graph: Graph, id: string): Graph | undefined {
  if (graph.id === id) {
    return graph;
  }
  for (const sub of graph.graphs()) {
    const found = findSubgraphById(sub, id);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function genVisLayers(panel: GeomapPanel, props) {
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
  const hasComments = graph ? !isLogic && graphs.some((g) => Object.keys(g.getComments).length) : false;

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

  const hyperVar = useMockData ? '1' : replaceVariables(`$routed`); //(`$hyperedges`)
  const parsed = parseInt(hyperVar, 10);
  const isHyper = !isNaN(parsed) && parsed > 0;

  const parentIdx = null;
  visLayers.addLayer(colTypes.Circle, colTypes.Circle, colTypes.Circle, false, true, false, parentIdx, false);
  visLayers.addLayer(colTypes.SVG, colTypes.SVG, colTypes.SVG, false, true, false, parentIdx, false);
  visLayers.addLayer(colTypes.Label, colTypes.Label, colTypes.Label, false, true, false, parentIdx, false);
  hasComments &&
    visLayers.addLayer(colTypes.Comments, colTypes.Comments, colTypes.Comments, false, true, false, parentIdx, false);
  visLayers.addLayer(colTypes.Edges, colTypes.Edges, colTypes.Edges, false, true, false, parentIdx, false);
  visLayers.addLayer(
    colTypes.Hyperedges,
    colTypes.Hyperedges,
    colTypes.Hyperedges,
    false,
    isHyper,
    false,
    parentIdx,
    false
  );
}

export {
  genPrimaryLayers,
  genNodeLayers,
  genEdgeLayers,
  initGroups,
  isVisible,
  genVisLayers,
  createDerivedLayers,
  findSubgraphById,
};
