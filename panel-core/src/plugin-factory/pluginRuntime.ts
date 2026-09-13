import { createContext, useContext } from 'react';
import type { PanelProps } from '@grafana/data';
import type { MapglEdition, MapglPanelFeature } from '../extension-points/contracts';

export interface MapglPluginConfiguration {
  readonly pluginId: string;
  readonly edition: MapglEdition;
  readonly features: readonly MapglPanelFeature[];
}
export type MapglPanelProps<TOptions> = PanelProps<TOptions> & { mapglPlugin?: MapglPluginConfiguration };
export const defaultPluginConfiguration: MapglPluginConfiguration = Object.freeze({
  pluginId: 'vaduga-mapgl-panel',
  edition: 'oss',
  features: Object.freeze([]),
});
export const MapglPluginContext = createContext(defaultPluginConfiguration);
export const useMapglPlugin = () => useContext(MapglPluginContext);
export function getMapglPluginId(
  configuration: Pick<MapglPluginConfiguration, 'pluginId'> = defaultPluginConfiguration
): string {
  return configuration.pluginId;
}
