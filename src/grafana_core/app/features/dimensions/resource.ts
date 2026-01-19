import { DataFrame } from '@grafana/data';
import { ResourceDimensionConfig, ResourceDimensionMode } from '@grafana/schema';

import {DimensionSupplier, ResourceFolderName} from './types';
import { findField, getLastNotNullFieldValue } from './utils';
import {PLUGIN_ID} from "../../../../types";


//---------------------------------------------------------
// Resource dimension
//---------------------------------------------------------
export function getPublicOrAbsoluteUrl(v: string): string {
    if (!v) {
        return '';
    }

    //@ts-ignore
    if (v.indexOf(':/') > 0) {return window.__grafana_public_path__}
    return v.startsWith(ResourceFolderName.Custom) ? v : `public/plugins/${PLUGIN_ID}/img/icons/${v}.svg`;
}

