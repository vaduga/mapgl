//@ts-nocheck

import { config as c, GrafanaBootConfig as gb } from '@grafana/runtime';
import {PluginState} from '@grafana/data';

interface config extends c {

}

//my augments
//
class GrafanaBootConfig extends gb {
  geomapDefaultBaseLayerConfig: ExtendMapLayerOptions
}
const config: GrafanaBootConfig = c;
//

// Legacy binding paths

export { config, GrafanaBootConfig as Settings };

let grafanaConfig: GrafanaBootConfig = config;

export default grafanaConfig;

export const getConfig = () => {
  return grafanaConfig;
};

// The `enable_alpha` flag is no exposed directly, this is equivolant
export const hasAlphaPanels = Boolean(config.panels?.debug?.state === PluginState.alpha);

import {ExtendMapLayerOptions} from "./extension";



