import {FieldConfigProperty, PanelPlugin} from '@grafana/data';
import { config } from '@grafana/runtime';
import { commonOptionsBuilder } from '@grafana/ui';
import React from 'react';

import { GeomapPanel } from './GeomapPanel';

import { LayersEditor } from './editor/LayersEditor';
import { MapViewEditor } from './editor/MapView/MapViewEditor';
import {getLayerEditor} from "./editor/layerEditor";
import {defaultMapViewConfig, Options, GeomapInstanceState} from './types';

export const plugin = new PanelPlugin<Options>(GeomapPanel)
    .setNoPadding()
    .useFieldConfig({
        useCustomConfig: (builder) => {
            commonOptionsBuilder.addHideFrom(builder);
        },
        disableStandardOptions: [
            //FieldConfigProperty.Thresholds,
            //FieldConfigProperty.Color,
            //FieldConfigProperty.Decimals,
            //FieldConfigProperty.DisplayName,
            //FieldConfigProperty.Max,
            //FieldConfigProperty.Min,
            //FieldConfigProperty.Links,
            //FieldConfigProperty.NoValue,
            //FieldConfigProperty.Unit,
        ],
        standardOptions: {
            [FieldConfigProperty.Mappings]: {},
        },
    })
    .setPanelOptions((builder, context) => {
        let category = ['Map view'];
        builder.addCustomEditor({
            category,
            id: 'view',
            path: 'view',
            name: 'Initial view', // don't show it
            description: 'This location will show when the panel first loads.',
            editor: MapViewEditor,
            defaultValue: defaultMapViewConfig,
        });

        //console.log('mdule.tsx ctx', context)
        // eslint-disable-next-line
        const state = context.instanceState as GeomapInstanceState;
        //console.log('state?.layers', state?.layers, state, context)
        if (!state?.layers) {
            // TODO? show spinner?
        } else {
            const layersCategory = ['Data layers'];
            const basemapCategory = ['Basemap layer'];
            builder.addCustomEditor({
                category: layersCategory,
                id: 'layers',
                path: '',
                name: '',
                editor: LayersEditor,
            });

            const selected = state.layers[state.selected];
            if (state.selected && selected) {
                builder.addNestedOptions(
                    getLayerEditor({
                        state: selected,
                        category: layersCategory,
                        isLogic: state.isLogic,
                        basemaps: false,
                    })
                );
            }

            const baselayer = state.layers[0];
            if (config.geomapDisableCustomBaseLayer) {
                builder.addCustomEditor({
                    category: basemapCategory,
                    id: 'layers',
                    path: '',
                    name: '',
                    // eslint-disable-next-line react/display-name
                    editor: () => <div>The basemap layer is configured by the server admin.</div>,
                });
            } else if (baselayer) {
                builder.addNestedOptions(
                    getLayerEditor({
                        state: baselayer,
                        category: basemapCategory,
                        isLogic: state.isLogic,
                        basemaps: true,
                    })
                );

            }
        }
        builder.addBooleanSwitch({
            category: ['Other'],
            path: 'common.isShowSwitcher',
            name: 'Layer switcher',
            defaultValue: true,
        })
        .addBooleanSwitch({
            category: ['Other'],
            path: 'common.isShowEdgeLegend',
            name: 'Edge legend',
            description: 'default thresholds',
            defaultValue: true,
        })
        .addBooleanSwitch({
            category: ['Other'],
            path: 'common.isShowLegend',
            name: 'Groups legend',
            defaultValue: true,
        })
        .addBooleanSwitch({
            category: ['Other'],
            path: 'common.isMeters',
            name: 'Meters for Style Sizing',
            description: 'use meters instead of pixels (scale on zoom)',
            defaultValue: false,
        })
        .addTextInput({
                category: ['Other'],
                path: 'common.locLabelName',
                name: 'VertexA name label in alert annotation',
                //description: '',
                settings: {},
            })

})
    .setDataSupport({
        annotations: true,
        alertStates: true,
    });

