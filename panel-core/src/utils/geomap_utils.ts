import { DataFrame, GrafanaTheme2 } from '@grafana/data';

import { defaultStyleConfig, StyleConfig, StyleConfigState, StyleDimensions } from '../style/types';
import { getColorDimension, getScaledDimension, getTextDimension } from '../grafana_core/app/features/dimensions';
import type { MapLayerState } from '../types';

export function getStyleDimension(
  frame: DataFrame | undefined,
  style: StyleConfigState,
  theme: GrafanaTheme2,
  customStyleConfig?: StyleConfig
) {
  const dims: StyleDimensions = {};
  if (customStyleConfig && Object.keys(customStyleConfig).length) {
    dims.color = getColorDimension(frame, customStyleConfig.color ?? defaultStyleConfig.color, theme);
    dims.size = getScaledDimension(frame, customStyleConfig.size ?? defaultStyleConfig.size);
    if (customStyleConfig.text && (customStyleConfig.text.field || customStyleConfig.text.fixed)) {
      dims.text = getTextDimension(frame, customStyleConfig.text!, theme);
    }
  } else {
    if (style.fields) {
      const capField = style.config.capacity?.field;
      if (style.fields.color) {
        dims.color = getColorDimension(frame, style.config.color ?? defaultStyleConfig.color, theme, capField);
      }
      if (style.fields.size) {
        dims.size = getScaledDimension(frame, style.config.size ?? defaultStyleConfig.size, capField);
      }
      if (style.fields.text) {
        dims.text = getTextDimension(frame, style.config.text!, theme);
      }
    }
  }

  return dims;
}

function resolveSelectedLayer(mapPanel: any, layers: MapLayerState[], selected?: number): number {
  const isValid = (index: unknown): index is number =>
    Number.isInteger(index) && Number(index) >= 0 && Number(index) < layers.length;
  const next = isValid(selected)
    ? selected
    : isValid(mapPanel.selectedLayerIndex)
      ? mapPanel.selectedLayerIndex
      : layers.length > 1
        ? layers.length - 1
        : 0;
  mapPanel.selectedLayerIndex = next;
  return next;
}

export const notifyPanelEditor = (mapPanel: any, layers: MapLayerState[], selected?: number) => {
  // Notify the panel editor
  if (mapPanel.panelContext && mapPanel.panelContext.onInstanceStateChange) {
    const selectedLayerIndex = resolveSelectedLayer(mapPanel, layers, selected);
    mapPanel.panelContext.onInstanceStateChange({
      map: mapPanel.map,
      graph: mapPanel.graph,
      isLogic: mapPanel.isLogic,
      useMockData: mapPanel.useMockData,
      layers: layers,
      selected: selectedLayerIndex,
      actions: mapPanel.actions,
      graphFrame: mapPanel.graphFrameInstanceState,
    });
  }
};

export const getNextLayerName = (panel: any) => {
  let idx = panel.layers.length; // since basemap is 0, this looks right
  while (true && idx < 100) {
    const name = `Layer ${idx++}`;
    if (!panel.byName.has(name)) {
      return name;
    }
  }

  return `Layer ${Date.now()}`;
};

export const getNextGroupName = (groups: any) => {
  let idx = groups.length; // since basemap is 0, this looks right
  while (true && idx < 100) {
    const name = `group ${idx++ + 1}`;
    if (!groups.some((group) => (group.rule?.label ?? group.label ?? group.name) === name)) {
      return name;
    }
  }

  return `group ${Date.now()}`;
};
