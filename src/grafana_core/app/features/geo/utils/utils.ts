import {DataFrame, GrafanaTheme2, SelectableValue} from '@grafana/data';

//import { defaultStyleConfig, StyleConfig, StyleConfigState, StyleDimensions } from '../style/types';

import {getColorDimension, getScalarDimension, getScaledDimension, getTextDimension} from "../../dimensions";
import {getDataSourceSrv} from "@grafana/runtime";
import {defaultStyleConfig, StyleConfig, StyleConfigState, StyleDimensions} from "../../../../../style/types";



/** Get the GrafanaDatasource instance */
export async function getGrafanaDatasource() {
  return (await getDataSourceSrv().get('-- Grafana --')) as any;
}

export function getStyleDimension(
  frame: DataFrame | undefined,
  style: StyleConfigState,
  theme: GrafanaTheme2,
  customStyleConfig?: StyleConfig
) {
  const dims: StyleDimensions = {};
  if (customStyleConfig && Object.keys(customStyleConfig).length) {
    dims.color = getColorDimension(frame, customStyleConfig.color ?? defaultStyleConfig.color, theme);
    dims.size = getScaledDimension(frame, customStyleConfig.size ?? defaultStyleConfig.size)
    if (customStyleConfig.text && (customStyleConfig.text.field || customStyleConfig.text.fixed)) {
      dims.text = getTextDimension(frame, customStyleConfig.text!, theme);
    }
  } else {
    if (style.fields) {
      if (style.fields.color) {
        dims.color = getColorDimension(frame, style.config.color ?? defaultStyleConfig.color, theme);
      }
      if (style.fields.size) {
        dims.size = getScaledDimension(frame, style.config.size ?? defaultStyleConfig.size);
      }
      if (style.fields.text) {
        dims.text = getTextDimension(frame, style.config.text!, theme);
      }

    }
  }

  return dims;
}

let publicGeoJSONFiles: Array<SelectableValue<string>> | undefined = undefined;

export function getPublicGeoJSONFiles(): Array<SelectableValue<string>> {
  if (!publicGeoJSONFiles) {
    publicGeoJSONFiles = [];
    initGeojsonFiles(); // async
  }
  return publicGeoJSONFiles;
}

// This will find all geojson files in the maps and gazetteer folders
async function initGeojsonFiles() {
  const ds = await getGrafanaDatasource();
  for (let folder of ['maps', 'gazetteer']) {
    ds.listFiles(folder).subscribe({
      next: (frame) => {
        frame.forEach((item) => {
          if (item.name.endsWith('.geojson')) {
            const value = `public/${folder}/${item.name}`;
            publicGeoJSONFiles!.push({
              value,
              label: value,
            });
          }
        });
      },
    });
  }
}



export const isUrl = (url: string) => {
  try {
    const newUrl = new URL(url);
    return newUrl.protocol.includes('http');
  } catch (_) {
    return false;
  }
};
