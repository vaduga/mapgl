import { getFrameMatchers, PanelData, textUtil } from '@grafana/data';
import { config } from '@grafana/runtime';

import { MARKERS_LAYER_ID, MarkersConfig } from '../layers/data';
import { MapLayerState, colTypes } from '../types';

import { ExtendMapLayerHandler, ExtendMapLayerOptions } from '../extension';
import { getNextLayerName } from './geomap_utils';
import { FeatSource, Graph, getGraphComments } from '@mapgl/panel-core/graph';
import {
  getDerivedVisLayers,
  getMapglFeatureServices,
} from '../extension-points/featureContracts';
import { VisLayers } from '../store';
import { NS_SEPARATOR } from '../types/defaults';

interface VisibilityDataLayer {
  name: string;
  type: string;
}

interface GenVisLayersPanel {
  groups: unknown[];
  isLogic: boolean;
  graph: Graph;
  hasAnnots?: boolean;
  useMockData?: boolean;
}

interface GenVisLayersProps {
  options: {
    dataLayers?: VisibilityDataLayer[];
  };
  replaceVariables: (value: string) => string;
}

export const applyLayerFilter = (
  handler: ExtendMapLayerHandler<unknown>,
  options: ExtendMapLayerOptions<unknown>,
  panelDataProps: PanelData,
  collectNsNodes: boolean
): void => {
  const customQuery = panelDataProps.request?.targets[0];
  const isSnapshot = customQuery?.queryType === 'snapshot' || customQuery?.refId; // snapshot or dashboard DS

  const f = collectNsNodes && (options.query || isSnapshot) ? handler.geom : handler.update;
  if (f) {
    let panelData = panelDataProps;
    if (options.filterData) {
      const matcherFunc = getFrameMatchers(options.filterData);
      panelData = {
        ...panelData,
        series: panelData.series.filter(matcherFunc),
      };
    }
    f(panelData);
  }
};

// panel: MapPanel
export async function updateLayer(
  panel: any,
  uid: string,
  newOptions: ExtendMapLayerOptions
): Promise<boolean> {
  if (!panel.map) {
    return false;
  }
  const current = panel.byName.get(uid);
  //console.log('updateLayer current', current, uid, newOptions)
  if (!current) {
    return false;
  }

  let layerIndex = -1;

  // Special handling for rename
  if (newOptions.name !== uid) {
    if (!newOptions.name) {
      newOptions.name = uid;
    } else if (panel.byName.has(newOptions.name)) {
      return false;
    }
    panel.byName.delete(uid);

    uid = newOptions.name;
    panel.byName.set(uid, current);
  }

  // Type changed -- requires full re-initalization
  if (current.options.type !== newOptions.type) {
    // full init
  } else {
    // just update options
  }

  const layers = panel.layers.slice(0);

  for (let i = 0; i < layers.length; i++) {
    if ((layers[i].layer as FeatSource) === current.layer) {
      layerIndex = i;
      break;
    }
  }

  if (layerIndex < 0) {
    return false;
  }

  if (current.options.type === MARKERS_LAYER_ID) {
    // any extra handling on collapse group rule section?
  }

  try {
    const initLayerIdx = current.isBasemap ? undefined : Math.max(0, layerIndex - 1);
    const info = await initLayer(panel, newOptions, current.isBasemap, initLayerIdx);
    layers[layerIndex]?.handler.dispose?.();
    layers[layerIndex] = info;
  } catch (err) {
    console.warn('ERROR', err);
    return false;
  }

  panel.layers = layers;
  panel.doOptionsUpdate(layerIndex);
  panel.useMockData = panel.isLogic && panel.layers.every((l) => !l.options.locField);
  return true;
}

export async function initLayer(
  panel: any,
  options: ExtendMapLayerOptions,
  isBasemap = false,
  layerIdx?
): Promise<MapLayerState> {
  if (isBasemap && (!options?.type || config.geomapDisableCustomBaseLayer)) {
    options = panel.orthoBasemapConfig;
  }

  // Use default markers layer
  if (!options?.type) {
    options = {
      type: MARKERS_LAYER_ID,
      name: getNextLayerName(panel),
      config: {},
    };
  }

  const item = panel.geomapLayerRegistry?.getIfExists(options.type);
  if (!item) {
    return Promise.reject('unknown layer: ' + options.type);
  }

  if (options.config?.attribution) {
    options.config.attribution = textUtil.sanitizeTextPanelContent(options.config.attribution);
  }

  const handler = await item.create(panel, options, config.theme2, layerIdx);
  const layer = handler.init();
  if (options.opacity != null) {
    //layer.setOpacity(options.opacity);
  }

  if (!options.name) {
    options.name = getNextLayerName(panel);
  }

  const UID = options.name;
  const state: MapLayerState<unknown> = {
    // UID, // unique name when added to the map (it may change and will need special handling)
    isBasemap,
    options,
    layer,
    handler,
    getName: () => UID,
    // Used by the editors
    onChange: (cfg: ExtendMapLayerOptions) => {
      updateLayer(panel, UID, cfg);
    },
  };

  panel.byName.set(UID, state);

  if (state.layer instanceof FeatSource) {
    state.layer.__state = state;
  }

  return state;
}

export function genVisLayers(panel: GenVisLayersPanel, props: GenVisLayersProps): VisLayers {
  const { groups, isLogic, graph, hasAnnots, useMockData } = panel;
  const { options, replaceVariables } = props;
  const dataLayers = options.dataLayers;
  const visLayers = new VisLayers();

  const userLayers: Record<string, number> = {};
  if (dataLayers?.length) {
    const nodeLayers = dataLayers.filter((layer) => layer.type === colTypes.Markers);
    const userColTypes = [...new Set((isLogic ? nodeLayers : dataLayers).map((layer) => layer.type))];

    userColTypes.forEach((type) => {
      userLayers[type] = visLayers.addLayer(type, type, type, false, true, false, null, false);
    });

    dataLayers.forEach((layer) => {
      const parentIdx = userLayers[layer.type];
      if (parentIdx !== undefined) {
        visLayers.addLayer(layer.name, layer.name, layer.type, false, true, false, parentIdx, false);
      }
    });

    if (nodeLayers.length) {
      createDerivedLayers(visLayers, graph, isLogic, replaceVariables, useMockData);
    }
  }

  const len = groups.length + (hasAnnots ? 1 : 0);
  visLayers.setActiveGroups(new Uint8Array(len).fill(1));
  return visLayers;
}

export function createDerivedLayers(
  visLayers: VisLayers,
  graph: Graph,
  isLogic: boolean,
  replaceVariables: (value: string) => string,
  useMockData = false
): void {
  const graphs: Graph[] = [graph].concat(Array.from(graph.subgraphsBreadthFirst()) as Graph[]);
  const hasComments = !isLogic && graphs.some((g) => Object.keys(getGraphComments(g)).length);

  const idToLayerIdx = new Map<string, number>();
  const graphIdx = visLayers.addLayer('graph', 'graph', 'graph', false, true, false, null, false);

  for (const g of graphs) {
    const id = g.id;
    const segments = id.split(NS_SEPARATOR);
    const label = segments[segments.length - 1];
    const parentId = segments.length > 1 ? segments.slice(0, -1).join(NS_SEPARATOR) : 'graph';
    const parentIdx = parentId !== 'graph' ? idToLayerIdx.get(parentId) : graphIdx;

    const layerIdx = visLayers.addLayer(label, id, parentId, false, true, false, parentIdx ?? null, false);

    idToLayerIdx.set(id, layerIdx);
  }

  const parentIdx = null;
  getDerivedVisLayers(getMapglFeatureServices().derivedVisLayerContributors, {
    graph,
    isLogic,
    replaceVariables,
    useMockData,
  }).forEach((layer) => {
    visLayers.addLayer(
      layer.label,
      layer.name,
      layer.group,
      layer.fold ?? false,
      layer.visible,
      layer.indeterminate ?? false,
      layer.parentIndex ?? parentIdx,
      layer.combine ?? false
    );
  });
  visLayers.addLayer(colTypes.Circle, colTypes.Circle, colTypes.Circle, false, true, false, parentIdx, false);
  visLayers.addLayer(colTypes.SVG, colTypes.SVG, colTypes.SVG, false, true, false, parentIdx, false);
  visLayers.addLayer(colTypes.Label, colTypes.Label, colTypes.Label, false, true, false, parentIdx, false);
  if (hasComments) {
    visLayers.addLayer(colTypes.Comments, colTypes.Comments, colTypes.Comments, false, true, false, parentIdx, false);
  }
  visLayers.addLayer(colTypes.Edges, colTypes.Edges, colTypes.Edges, false, true, false, parentIdx, false);

  const rVar = useMockData ? '1' : replaceVariables(`$routed`);
  const parsed = parseInt(rVar, 10);
  const isRouted = !isNaN(parsed) ? parsed > 0 : true;
  visLayers.addLayer(colTypes.Routed, colTypes.Routed, colTypes.Routed, false, isRouted, false, parentIdx, false);

}
