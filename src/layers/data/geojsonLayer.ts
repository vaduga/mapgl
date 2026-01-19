import {
    GrafanaTheme2,
    PanelData, PanelProps,
} from '@grafana/data';

import {
    ExtendMapLayerRegistryItem,
    ExtendFrameGeometrySourceMode,
    ExtendMapLayerOptions,
} from '../../extension';
import {defaultStyleConfig, StyleConfig} from "../../style/types";
import {StyleEditor} from "../../editor/StyleEditor";
import {getStyleDimension} from "../../utils/geomap_utils";
import {getStyleConfigState} from "../../style/utils";
import {Options} from "../../types";
import {GeomapPanel} from "../../GeomapPanel";
import {Feature, FeatSource} from 'mapLib'
import {colTypes} from 'mapLib/utils';

export interface GeoJsonConfig {
    style: StyleConfig
}

const defaultOptions: GeoJsonConfig = {
    style: defaultStyleConfig
};
export const GEOJSON_LAYER_ID = colTypes.GeoJson;

// Used by default when nothing is configured
export const defaultPolygonsConfig: ExtendMapLayerOptions<GeoJsonConfig> = {
    type: GEOJSON_LAYER_ID,
    name: 'polygons layer',
    config: defaultOptions,
    location: {
        mode: ExtendFrameGeometrySourceMode.Auto,
    },
};

/**
 * Map data layer configuration for icons overlay
 */
export const geojsonLayer: ExtendMapLayerRegistryItem<GeoJsonConfig> = {
    id: GEOJSON_LAYER_ID,
    name: 'GeoJson layer',
    description: 'GeoJson features from file (url)',
    isBaseMap: false,
    showLocation: true,


    /**
     * Function that configures transformation and returns transformed points for mobX
     * @param props
     * @param options
     */
    create: async (panel: GeomapPanel, options: ExtendMapLayerOptions<GeoJsonConfig>,  theme: GrafanaTheme2) => {

        // Assert default values
        const config = {
            ...defaultOptions,
            ...options.config,
        };

        const props: PanelProps<Options> = panel.props
        const globalOpts = props.options
        const layerName = options.name as string

        const featSource = new FeatSource(GEOJSON_LAYER_ID, layerName)


        const locField = options.geojsonLocName
        const metricName = options.geojsonMetricName
        const geoColor = options?.geojsonColor ? theme.visualization.getColorByName(options?.geojsonColor) : undefined;

        const style = await getStyleConfigState(config.style);
        style.dims = getStyleDimension(undefined, style, theme);

            return {
                init: () => featSource,
                //legend: legend,
                update: async (data: PanelData) => {

                    const geoUrl = options?.geojsonurl
                    if ((geoUrl)) {
                        let ds = await fetch(geoUrl, {
                            method: "GET",
                            headers: {
                                'Content-Type': 'application/json'
                            },
                        }).catch((er) => {
                            //console.log(er);
                        })

                        if (ds) {
                        let geoData = await ds.json()
                        if (geoData?.features?.length) {

                            const points: Feature[] = geoData?.features?.map((point, i) => {
                                    const {geometry, properties: props} = point

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


                                    /// no field but prop in static geojson actually
                                    const locName = locField ? props[locField] : undefined

                                const newFeature: any = {
                                        id: i,
                                        type: "Feature",
                                        geometry,
                                        rowIndex: i,
                                        properties: {
                                            root: featSource,
                                            locName: locName ? props[locName] : undefined,
                                            geoJsonProps: props,
                                        style: stValues,}
                                    }
                                    return newFeature
                                }
                            )
                            featSource.setFeatures(points, undefined)
                        }
                        }

                    }
                },
                // Geojson layer overlay options
                registerOptionsUI: (builder, options) => {

                    builder
                        .addCustomEditor({
                            id: 'config.style',
                            path: 'config.style',
                            name: 'Line width and shape fill color (FIXED only)',
                            editor: StyleEditor,
                            settings: {
                                isAuxLayer: true,
                                displayRotation: true,
                            },
                            defaultValue: defaultOptions.style,
                        })
                    builder
                        .addTextInput({
                            path: 'geojsonurl',
                            name: 'GeoJson Url',
                            description: 'Url to a file with valid GeoJSON FeatureCollection object',
                            settings: {},
                            showIf: (opts) => opts.type === colTypes.GeoJson,
                        })
                    builder
                        .addSelect({
                            path: 'geojsonLocName',
                            name: 'Location name GeoJson property',
                            //description: 'Select location name from GeoJson properties',
                            settings: {
                                allowCustomValue: true,
                                options: [],
                                placeholder: 'GeoJson properties',
                                getOptions: async (context)=> await getGeoJsonProps(context)
                            },
                            showIf: (opts) => opts.type === colTypes.GeoJson,
                            defaultValue: '',
                        })
                        // .addSelect({
                        //     path: 'geojsonMetricName',
                        //     name: 'Metric name GeoJson property',
                        //     description: 'select Metric GeoJson property with numeric values',
                        //     settings: {
                        //         allowCustomValue: true,
                        //         options: [],
                        //         placeholder: 'GeoJson properties',
                        //
                        //         getOptions: async (context)=> await getGeoJsonProps(context),
                        //     },
                        //     showIf: (opts) => opts.type === colTypes.GeoJson,
                        // })

                }
            }
    },
    // fill in the default values
    defaultOptions,
};


export const getGeoJsonProps = async (context)=> {
    const url = context?.options?.geojsonurl
    if (!url) {return []}

    let ds = await fetch(url, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        },
    }).catch((er) => {
        //console.log(er);
    })
    if (!ds) {return []}
    let geoData = await ds.json()
    return Object.keys(geoData.features[0].properties).map(el=> ({value: el, label: el} ))
}
