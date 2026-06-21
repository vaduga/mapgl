import {
  FieldConfigProperty,
  PanelOptionsEditorBuilder,
  PanelPlugin,
  PanelProps,
  StandardEditorContext,
} from '@grafana/data';
import { config } from '@grafana/runtime';
import { commonOptionsBuilder } from '@grafana/ui';
import React from 'react';

import {
  buildMapglFeatureServices,
  setMapglFeatureServices,
  type MapglEdition,
  type MapglPanelFeature,
} from '../extension-points/featureContracts';
import { setMapglPluginId } from './pluginRuntime';

export interface MapglPanelPluginLayerState {
  options?: unknown;
}

export interface MapglPanelPluginInstanceState<TLayerState extends MapglPanelPluginLayerState = MapglPanelPluginLayerState> {
  isLogic?: boolean;
  layers?: TLayerState[];
  selected?: number;
}

export interface LayerEditorOptions<TLayerState extends MapglPanelPluginLayerState> {
  state: TLayerState;
  category: string[];
  isLogic: boolean;
  basemaps: boolean;
}

export interface CreateMapglPanelPluginOptions<
  TOptions,
  TLayerState extends MapglPanelPluginLayerState = MapglPanelPluginLayerState,
  TInstanceState extends MapglPanelPluginInstanceState<TLayerState> = MapglPanelPluginInstanceState<TLayerState>
> {
  edition: MapglEdition;
  features?: MapglPanelFeature[];
  pluginId?: string;
  panelComponent: React.ComponentType<PanelProps<TOptions>>;
  mapViewEditor: React.ComponentType<any>;
  layersEditor: React.ComponentType<any>;
  getLayerEditor: (options: LayerEditorOptions<TLayerState>) => any;
  defaultMapViewConfig: Partial<unknown>;
  initPluginTranslations?: (pluginId: string) => void | Promise<void>;
  addExtraOptions?: (
    builder: PanelOptionsEditorBuilder<TOptions>,
    context: StandardEditorContext<TOptions>,
    state?: TInstanceState
  ) => void;
}

export function createMapglPanelPlugin<
  TOptions,
  TLayerState extends MapglPanelPluginLayerState = MapglPanelPluginLayerState,
  TInstanceState extends MapglPanelPluginInstanceState<TLayerState> = MapglPanelPluginInstanceState<TLayerState>
>({
  edition,
  features = [],
  pluginId = 'vaduga-mapgl-panel',
  panelComponent,
  mapViewEditor,
  layersEditor,
  getLayerEditor,
  defaultMapViewConfig,
  initPluginTranslations,
  addExtraOptions,
}: CreateMapglPanelPluginOptions<TOptions, TLayerState, TInstanceState>): PanelPlugin<TOptions> {
  setMapglPluginId(pluginId);
  void initPluginTranslations?.(pluginId);
  setMapglFeatureServices(buildMapglFeatureServices({ edition, features }));

  return new PanelPlugin<TOptions>(panelComponent)
    .setNoPadding()
    .useFieldConfig({
      useCustomConfig: (builder) => {
        commonOptionsBuilder.addHideFrom(builder);
      },
      disableStandardOptions: [
        // FieldConfigProperty.Thresholds,
      ],
      standardOptions: {
        [FieldConfigProperty.Mappings]: {},
      },
    })
    .setPanelOptions((builder, context) => {
      const category = ['Map view'];
      builder.addCustomEditor({
        category,
        id: 'view',
        path: 'view',
        name: 'Initial view',
        editor: mapViewEditor,
        defaultValue: defaultMapViewConfig,
      });

      const state = context.instanceState as TInstanceState | undefined;
      if (state?.layers) {
        const layersCategory = ['Data layers'];
        const basemapCategory = ['Basemap layer'];
        builder.addCustomEditor({
          category: layersCategory,
          id: 'layers',
          path: '',
          name: '',
          editor: layersEditor,
        });

        const selectedIndex = state.selected ?? 0;
        const selected = state.layers[selectedIndex];
        if (state.selected && selected) {
          builder.addNestedOptions(
            getLayerEditor({
              state: selected,
              category: layersCategory,
              isLogic: state.isLogic ?? false,
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
            editor: () => <div>The basemap layer is configured by the server admin.</div>,
          });
        } else if (baselayer) {
          builder.addNestedOptions(
            getLayerEditor({
              state: baselayer,
              category: basemapCategory,
              isLogic: state.isLogic ?? false,
              basemaps: true,
            })
          );
        }
      }

      builder
        .addBooleanSwitch({
          category: ['Other'],
          path: 'common.isShowSwitcher',
          name: 'Layer switcher',
          defaultValue: true,
        })
        .addBooleanSwitch({
          category: ['Other'],
          path: 'common.isShowEdgeLegend',
          name: 'Edge legend',
          description: 'Default thresholds',
          defaultValue: true,
        })
        .addBooleanSwitch({
          category: ['Other'],
          path: 'common.isShowLegend',
          name: 'Groups legend',
          defaultValue: true,
        });

      addExtraOptions?.(builder, context, state);

      builder
        .addBooleanSwitch({
          category: ['Other'],
          path: 'common.isMeters',
          name: 'Meters for sizing',
          description: 'Use meters in Geo view (scales with zoom)',
          defaultValue: false,
        })
        .addRadio({
          category: ['Other'],
          path: 'common.edgeRouting',
          name: 'Edge routing',
          description: 'Auto-layout routing mode',
          settings: {
            options: [
              { label: 'Splines', value: 'Splines' },
              { label: 'Rectilinear', value: 'Rectilinear' },
            ],
          },
          defaultValue: 'Splines',
        })
        .addTextInput({
          category: ['Other'],
          path: 'common.locLabelName',
          name: 'VertexA name label in alert annotation',
          settings: {},
        });
    })
    .setDataSupport({
      annotations: true,
      alertStates: true,
    });
}
