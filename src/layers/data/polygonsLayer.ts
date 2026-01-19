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

import {Feature, FeatSource} from "mapLib";
import {colTypes} from 'mapLib/utils';
import {toJS} from "mobx";
import {StyleEditor} from "../../editor/StyleEditor";
import {defaultStyleConfig, StyleConfig} from "../../style/types";
import {getStyleConfigState} from "../../style/utils";
import {getStyleDimension} from "../../utils/geomap_utils";
import {Options} from "../../types";
import {GeomapPanel} from "../../GeomapPanel";
import {Geometry} from "geojson";

export interface PolygonsConfig {
    style: StyleConfig
}

const defaultOptions: PolygonsConfig = {
    style: defaultStyleConfig
};
export const POLYGONS_LAYER_ID = colTypes.Polygons;

// Used by default when nothing is configured
export const defaultPolygonsConfig: ExtendMapLayerOptions<PolygonsConfig> = {
    type: POLYGONS_LAYER_ID,
    name: 'polygons layer',
    config: defaultOptions,
    location: {
        mode: ExtendFrameGeometrySourceMode.Auto,
    },
};

/**
 * Map data layer configuration for icons overlay
 */
export const polygonsLayer: ExtendMapLayerRegistryItem<PolygonsConfig> = {
    id: POLYGONS_LAYER_ID,
    name: 'Polygons layer',
    description: 'GeoJson Polygons from query',
    isBaseMap: false,
    showLocation: true,

    /**
     * Function that configures transformation and returns transformed points for mobX
     * @param props
     * @param options
     */
    create: async (panel: GeomapPanel, options: ExtendMapLayerOptions<PolygonsConfig>,  theme: GrafanaTheme2) => {

        // Assert default values
        const config = {
            ...defaultOptions,
            ...options.config,
        };

        const props: PanelProps<Options> = panel.props
        const layerName = options.name as string
        const globalOpts = props.options

        const matchers = await getLocationMatchers(options.location);
        const featSource = new FeatSource(POLYGONS_LAYER_ID, layerName)

        const locField = options.locField
        const colType = POLYGONS_LAYER_ID
        const style = await getStyleConfigState(config.style);

                return {
                    init: () => featSource,
                    //legend: legend,
                    update: (data: PanelData) => {

                        for (const frame of data.series) {
//|| !options.query) || (frame.meta)

                            style.dims = getStyleDimension(frame, style, theme);
                         //   if ((options.query && options.query.options === frame.refId)) {

                                const info = getGeometryField(frame, matchers);
                                if (info.warning) {
                                    //console.log('Could not find locations', info.warning);
                                    // continue; // ???
                                }

                                const field = info.field
                                if (field) {

                                    const dataFrame = new DataFrameView(frame).toArray()
                                    const points: Feature[]  = (field.values as Geometry[]).map((geometry, i) => {

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
                                            type: "Polygon",
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
                            }

                        //break; // Only the first frame for now!

                   // }
                    }
                } ,

                    // Polygons overlay options
                    registerOptionsUI: (builder) => {

                        builder
                            .addCustomEditor({
                                id: 'config.style',
                                path: 'config.style',
                                name: 'Line width and polygon fill color',
                                editor: StyleEditor,
                                settings: {
                                    isAuxLayer: true,
                                    displayRotation: true,
                                },
                                defaultValue: defaultOptions.style,
                            })
                    }

            }
    },
    // fill in the default values
    defaultOptions,
}
