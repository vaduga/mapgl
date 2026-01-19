import {
    PanelData,
    DataFrameView, GrafanaTheme2, PanelProps,
} from '@grafana/data';

import { getGeometryField, getLocationMatchers } from '../../utils/location';
import {
    ExtendMapLayerRegistryItem,
    ExtendFrameGeometrySourceMode,
    ExtendMapLayerOptions,
} from '../../extension';
import {FeatSource} from 'mapLib'
import {Feature, colTypes} from 'mapLib/utils'
import {Position, LineString, Geometry} from "geojson";
import {toJS} from "mobx";
import {StyleEditor} from "../../editor/StyleEditor";
import {defaultStyleConfig, StyleConfig} from "../../style/types";
import {getStyleConfigState} from "../../style/utils";
import {getStyleDimension} from "../../utils/geomap_utils";

import {Options} from "../../types";
import {GeomapPanel} from "../../GeomapPanel";

export interface PathConfig {
    style: StyleConfig
}

const defaultOptions: PathConfig = {
    style: defaultStyleConfig
};
export const PATH_LAYER_ID = colTypes.Path;

// Used by default when nothing is configured
export const defaultPathConfig: ExtendMapLayerOptions<PathConfig> = {
    type: PATH_LAYER_ID,
    name: 'path layer',
    config: defaultOptions,
    location: {
        mode: ExtendFrameGeometrySourceMode.Auto,
    },
};

/**
 * Map data layer configuration for icons overlay
 */
export const pathLayer: ExtendMapLayerRegistryItem<PathConfig> = {
    id: PATH_LAYER_ID,
    name: 'Path layer',
    description: 'GeoJson LineStrings from query',
    isBaseMap: false,
    showLocation: true,


    /**
     * Function that configures transformation and returns transformed points for mobX
     * @param props
     * @param options
     */
    create: async (panel: GeomapPanel, options: ExtendMapLayerOptions<PathConfig>,  theme: GrafanaTheme2) => {

        // Assert default values
        const config = {
            ...defaultOptions,
            ...options.config,
        };

        const props: PanelProps<Options> = panel.props
        const layerName = options.name as string
        const globalOpts = props.options

        const matchers = await getLocationMatchers(options.location);
        const featSource = new FeatSource(PATH_LAYER_ID, layerName)

        const locField = options.locField
        const style = await getStyleConfigState(config.style);

                return {
                    init: () => featSource,
                    //legend: legend,
                    update: (data: PanelData) => {
                        for (const frame of data.series) {
//|| !options.query) || (frame.meta)
// console.log('options.query.options === frame.refId', options?.query?.options, frame.refId)

                            style.dims = getStyleDimension(frame, style, theme);
                          //  if ((options.query && options.query.options === frame.refId)) {

                                const info = getGeometryField(frame, matchers);
                                if (info.warning) {
                                    //console.log('Could not find locations', info.warning);
                                    // continue; // ???
                                }

                                const field = info.field

                                if (field) {

                                    const colorField = style.dims.color?.field
                                    const colorThresholds = colorField?.config?.thresholds
                                    if (colorThresholds) {
                                        featSource.setThresholds(colorThresholds)
                                    }

                                    const dataFrame = new DataFrameView(frame).toArray()
                                const points: Feature[] = (field.values as Geometry[]).map((geometry, i) => {

                                        const point = dataFrame[i]

                                        const stValues: any = {...style.base};
                                        const dims = style.dims;

                                        if (dims) {
                                            if (dims.color) {
                                                stValues.color = dims.color.get(i)
                                            }
                                            if (dims.size) {
                                                stValues.size = dims.size.get(i);
                                            }
                                            if (dims.text) {
                                                stValues.text = dims.text.get(i);
                                            }

                                        }

                                        const entries = Object.entries(point);
                                        const locName = entries.length > 0 && locField ? point[locField] ?? entries[0][1] : undefined

                                    const newFeature: any = {
                                            id: i,
                                            type: "LineString",
                                            geometry,
                                            rowIndex: i,
                                            properties: {
                                                root: featSource,
                                                locName,
                                                style: stValues}
                                        }

                                        return newFeature
                                    }
                                );

                                    featSource.setFeatures(points, frame.refId)
                                //break; // Only the first frame for now!
                            }
                           // }
                        }
                    },

                    // Polygons overlay options
                    registerOptionsUI: (builder) => {

                        builder
                            .addCustomEditor({
                                id: 'config.style',
                                path: 'config.style',
                                name: 'Line width and color',
                                editor: StyleEditor,
                                settings: {
                                    isAuxLayer: true,
                                    displayRotation: true,
                                },
                                defaultValue: defaultOptions.style,
                            })
                    },
                }
    },
    // fill in the default values
    defaultOptions,

};
