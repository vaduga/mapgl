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
  type MapglEdition,
  type MapglPanelFeature,
  validateMapglFeatureIds,
} from '../extension-points/featureContracts';
import { MapglPluginContext, type MapglPanelProps } from './pluginRuntime';
import { isNestedPanelOptionsCompat } from './nestedPanelOptions';

export interface MapglPanelPluginLayerState {
  options?: unknown;
}

export interface MapglPanelPluginInstanceState<
  TLayerState extends MapglPanelPluginLayerState = MapglPanelPluginLayerState,
> {
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
  TInstanceState extends MapglPanelPluginInstanceState<TLayerState> = MapglPanelPluginInstanceState<TLayerState>,
> {
  edition: MapglEdition;
  features?: MapglPanelFeature[];
  pluginId?: string;
  panelComponent: React.ComponentType<MapglPanelProps<TOptions>>;
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
  TInstanceState extends MapglPanelPluginInstanceState<TLayerState> = MapglPanelPluginInstanceState<TLayerState>,
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
  const configuredFeatures = Object.freeze([...features]);
  validateMapglFeatureIds(configuredFeatures);
  const configuration = Object.freeze({ pluginId, edition, features: configuredFeatures });
  void initPluginTranslations?.(pluginId);
  const editors = new WeakMap<React.ComponentType<any>, React.ComponentType<any>>();
  const scopeEditors = (builder: PanelOptionsEditorBuilder<any>) => {
    for (const item of builder.getItems()) {
      if (isNestedPanelOptionsCompat(item)) {
        const build = item.getBuilder();
        item.getBuilder = () => (nestedBuilder, context) => {
          build(nestedBuilder, context);
          scopeEditors(nestedBuilder);
        };
      } else {
        const Editor = item.editor;
        let ScopedEditor = editors.get(Editor);
        if (!ScopedEditor) {
          ScopedEditor = (props) => (
            <MapglPluginContext.Provider value={configuration}>
              <Editor {...props} />
            </MapglPluginContext.Provider>
          );
          editors.set(Editor, ScopedEditor);
        }
        item.editor = ScopedEditor;
      }
    }
  };
  const Panel = panelComponent;
  const ScopedPanel = (props: PanelProps<TOptions>) => (
    <MapglPluginContext.Provider value={configuration}>
      <Panel {...props} mapglPlugin={configuration} />
    </MapglPluginContext.Provider>
  );

  return new PanelPlugin<TOptions>(ScopedPanel)
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
        })
        .addBooleanSwitch({
          category: ['Other'],
          path: 'common.hideDiagnostics',
          name: 'Hide diagnostic messages',
          defaultValue: false,
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
        .addTextInput({
          category: ['Other'],
          path: 'common.locLabelName',
          name: 'VertexA name label in alert annotation',
          settings: {},
        });
      scopeEditors(builder);
    })
    .setDataSupport({
      annotations: true,
      alertStates: true,
    });
}
