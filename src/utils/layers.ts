import { getFrameMatchers, PanelData, textUtil } from '@grafana/data';
import { config } from '@grafana/runtime';

import { GeomapPanel } from '../GeomapPanel';
import {MARKERS_LAYER_ID, MarkersConfig} from '../layers/data/markersLayer';
import {geomapLayerRegistry, ORTHO_BASEMAP_CONFIG} from '../layers/registry';
import { MapLayerState } from '../types';

import {ExtendMapLayerHandler, ExtendMapLayerOptions} from "../extension";
import {getNextLayerName} from "./geomap_utils";
import { FeatSource } from 'mapLib';

export const applyLayerFilter = (
  handler: ExtendMapLayerHandler<unknown>,
  options: ExtendMapLayerOptions<unknown>,
  panelDataProps: PanelData,
  collectNsNodes: boolean,
): void => {
  const customQuery = panelDataProps.request?.targets[0]
  const isSnapshot =   customQuery?.queryType === "snapshot" || customQuery?.refId // snapshot or dashboard DS

  const f = (collectNsNodes && (options.query || isSnapshot)) ? handler.geom : handler.update
  if (f) {

    let panelData = panelDataProps;
    if (options.query) {
      const matcherFunc = getFrameMatchers(options.query);
      panelData = {
        ...panelData,
        series: panelData.series.filter(matcherFunc),
      };
    }
    f(panelData);
  }
};

// panel: GeomapPanel
export async function updateLayer(panel: GeomapPanel, uid: string, newOptions: ExtendMapLayerOptions): Promise<boolean> {

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

  // Just collapse group rule section
  if (current.options.type === MARKERS_LAYER_ID) {
    const oldGroups = (current.options as ExtendMapLayerOptions<MarkersConfig>)?.config?.groups ?? []
    const newGroups = newOptions.config?.groups ?? []
    const isAddGroup = newGroups.length > oldGroups.length
    const equalLength = (newGroups.length && oldGroups.length) && newGroups.length === oldGroups.length
    const isCollapse = !!equalLength && oldGroups?.some((g,i)=> g.collapse !== newGroups[i]?.collapse)
    if (isAddGroup || isCollapse) {
     //console.log('newgroup, collapse', isAddGroup, isCollapse)

    // @TODO cut processing on collapse rules
  }

}

  try {
    const info = await initLayer(panel, newOptions, current.isBasemap);
    layers[layerIndex]?.handler.dispose?.();
    layers[layerIndex] = info;

  } catch (err) {
    console.warn('ERROR', err); // eslint-disable-line no-console
    return false;
  }

  panel.layers = layers;
  panel.doOptionsUpdate(layerIndex);
  panel.useMockData = panel.isLogic && panel.layers.every(l=> !l.options.locField)
  return true;
}

export async function initLayer(
  panel: GeomapPanel,
  options: ExtendMapLayerOptions,
  isBasemap = false,
  layerIdx?
): Promise<MapLayerState> {
  if (isBasemap && (!options?.type || config.geomapDisableCustomBaseLayer)) {
    options = ORTHO_BASEMAP_CONFIG;
  }

  // Use default makers layer
  if (!options?.type) {
    options = {
      type: MARKERS_LAYER_ID,
      name: getNextLayerName(panel),
      config: {},
    };
  }

  const item = geomapLayerRegistry.getIfExists(options.type);
  if (!item) {
    return Promise.reject('unknown layer: ' + options.type);
  }

  if (options.config?.attribution) {
    options.config.attribution = textUtil.sanitizeTextPanelContent(options.config.attribution);
  }

  const handler = await item.create(panel, options, config.theme2, layerIdx);
  const layer = handler.init(); // eslint-disable-line
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

export const getMapLayerState = (l: any): MapLayerState => {
  return l?.state;
};
