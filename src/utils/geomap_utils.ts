import {DataFrame, GrafanaTheme2} from '@grafana/data';

import { defaultStyleConfig, StyleConfig, StyleConfigState, StyleDimensions } from '../style/types';
import {getColorDimension, getScaledDimension, getTextDimension} from "../grafana_core/app/features/dimensions";
import {GeomapPanel} from "../GeomapPanel";
import {MapLayerState, Options} from "../types";

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
            const capField = style.config.capacity?.field
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


export const notifyPanelEditor = (geomapPanel: GeomapPanel, layers: MapLayerState[], selected: number) => {
    // Notify the panel editor
    if (geomapPanel.panelContext && geomapPanel.panelContext.onInstanceStateChange) {
        geomapPanel.panelContext.onInstanceStateChange({
            map: geomapPanel.map,
            graph: geomapPanel.graph,
            isLogic: geomapPanel.isLogic,
            useMockData: geomapPanel.useMockData,
            layers: layers,
            selected: selected,
            actions: geomapPanel.actions,
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
        const name = `new rule ${idx++ +1}`;
        if (groups.find(l=> l.name === name) !== -1) {
            return name;
        }
    }

    return `new rule ${Date.now()}`;
};
