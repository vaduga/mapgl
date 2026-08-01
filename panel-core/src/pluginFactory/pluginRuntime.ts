let activePluginId = 'vaduga-mapgl-panel';

export function setMapglPluginId(pluginId: string): void {
  activePluginId = pluginId;
}

export function getMapglPluginId(): string {
  return activePluginId;
}
