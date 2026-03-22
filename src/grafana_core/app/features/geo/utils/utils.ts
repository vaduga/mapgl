import {DataFrame, GrafanaTheme2, SelectableValue} from '@grafana/data';

//import { defaultStyleConfig, StyleConfig, StyleConfigState, StyleDimensions } from '../style/types';

import {getColorDimension, getScalarDimension, getScaledDimension, getTextDimension} from "../../dimensions";
import {getDataSourceSrv} from "@grafana/runtime";
import {defaultStyleConfig, StyleConfig, StyleConfigState, StyleDimensions} from "../../../../../style/types";



/** Get the GrafanaDatasource instance */
export async function getGrafanaDatasource() {
  return (await getDataSourceSrv().get('-- Grafana --')) as any;
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
