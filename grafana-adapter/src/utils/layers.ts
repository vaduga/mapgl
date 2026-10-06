import { getFrameMatchers, PanelData, textUtil } from '@grafana/data';
import { config } from '@grafana/runtime';

import { MARKERS_LAYER_ID, MarkersConfig } from '../layers/data/index';
import { MapLayerState, colTypes } from '../types/index';

import { ExtendMapLayerHandler, ExtendMapLayerOptions } from '../extension';
import { getNextLayerName } from './geomap_utils';
import { Graph } from '@vaduga/mapgl-core/graph/main';
import {
  getDerivedVisLayers,
  getMapglFeatureServices,
  type MapglFeatureServices,
} from '@vaduga/mapgl-core/featureContracts';
import { VisLayers, createVisibility, createDerivedLayers as buildDerivedLayers } from '@vaduga/mapgl-core/store';

interface VisibilityDataLayer {
  name: string;
  type: string;
}

interface GenVisLayersPanel {
  featureServices?: MapglFeatureServices;
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
  panelDataProps: PanelData
): void => {
  if (handler.update) {
    let panelData = panelDataProps;
    if (options.query) {
      const matcherFunc = getFrameMatchers(options.query);
      panelData = {
        ...panelData,
        series: panelData.series.filter(matcherFunc),
      };
    }
    handler.update(panelData);
  }
};

// panel: MapPanel
export async function updateLayer(panel: any, uid: string, newOptions: ExtendMapLayerOptions): Promise<boolean> {
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
    if (layers[i].layer === current.layer) {
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

  const item = panel.mapLayerRegistry?.getIfExists(options.type);
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

  return state;
}

export function genVisLayers(panel: GenVisLayersPanel, props: GenVisLayersProps): VisLayers {
  const routed = resolveRouting(props.replaceVariables, panel.useMockData);
  return createVisibility({
    graph: panel.graph,
    groupCount: panel.groups.length + (panel.hasAnnots ? 1 : 0),
    isLogic: panel.isLogic,
    isRouted: routed,
    dataLayers: props.options.dataLayers ?? [],
    derivedLayers: getDerivedVisLayers(getMapglFeatureServices(panel).derivedVisLayerContributors, {
      graph: panel.graph,
      isLogic: panel.isLogic,
      replaceVariables: props.replaceVariables,
      useMockData: panel.useMockData ?? false,
    }),
  });
}

export function createDerivedLayers(
  visLayers: VisLayers,
  graph: Graph,
  isLogic: boolean,
  replaceVariables: (value: string) => string,
  useMockData = false,
  featureServices = getMapglFeatureServices()
): void {
  buildDerivedLayers(
    visLayers,
    graph,
    isLogic,
    resolveRouting(replaceVariables, useMockData),
    getDerivedVisLayers(featureServices.derivedVisLayerContributors, { graph, isLogic, replaceVariables, useMockData })
  );
}

function resolveRouting(replaceVariables: (value: string) => string, useMockData = false): boolean {
  const parsed = parseInt(useMockData ? '1' : replaceVariables('$routed'), 10);
  return !isNaN(parsed) ? parsed > 0 : true;
}
