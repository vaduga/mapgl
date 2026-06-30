import { get as lodashGet, isEqual } from 'lodash';

import {
  type Field,
  FieldType,
  FrameGeometrySourceMode,
  getFrameMatchers,
  type NestedPanelOptions,
  type NestedValueAccess,
} from '@grafana/data';

import { defaultMarkersConfig, getGeoJsonProps } from '../layers/data';
import {  ORTHO_BASEMAP_CONFIG } from '../layers/registry';
import { type MapLayerState } from '../types';

import { addLocationFields } from './MapView/locationEditor';
import { FrameSelectionEditor } from './FrameSelectionEditor';
import { getQueryFields } from './getQueryFields';
import { setOptionImmutably } from '../grafana_core/app/dashboard/components/PanelEditor/utils';

import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from '../extension';
import { colTypes } from '@mapgl/panel-core/types';

export interface LayerEditorOptions {
  state: MapLayerState;
  category: string[];
  basemaps: boolean; // only basemaps
  isLogic: boolean;
}

interface LayerEditorAdapters {
  geomapLayerRegistry: {
    getIfExists: (id: string) => ExtendMapLayerRegistryItem<any> | undefined;
  };
  getLayersOptions: (basemap: boolean, current?: string) => { options: any[]; current: any[] };
}

export function createGetLayerEditor({ geomapLayerRegistry, getLayersOptions }: LayerEditorAdapters) {
  return function getLayerEditor(opts: LayerEditorOptions): NestedPanelOptions<ExtendMapLayerOptions> {
  return {
    category: opts.category,
    path: '--', // Not used
    defaultValue: opts.basemaps ? ORTHO_BASEMAP_CONFIG : defaultMarkersConfig,
    values: (parent: NestedValueAccess) => ({
      getContext: (parent) => {
        //console.log('in layer editor ctx', parent, opts.state )
        return {
          ...parent,
          options: opts.state.options,
          instanceState: opts.state,
        };
      },
      getValue: (path: string) => lodashGet(opts.state.options, path),
      onChange: (path: string, value: string) => {
        const { state } = opts;
        const { options } = state;
        if (path === 'type' && value) {
          const layer = geomapLayerRegistry.getIfExists(value);
          if (layer) {
            const opts = {
              ...options, // keep current shared options
              type: layer.id,
              config: { ...layer.defaultOptions }, // clone?
            };
            if (layer.showLocation) {
              if (!opts.location?.mode) {
                opts.location = { mode: FrameGeometrySourceMode.Auto };
              } else {
                delete opts.location;
              }
            }
            state.onChange(opts);
            return;
          }
        }
        state.onChange(setOptionImmutably(options, path, value));
      },
    }),
    build: (builder, context) => {
      if (!opts.state) {
        return;
      }

      const { handler, options } = opts.state;
      const layer = geomapLayerRegistry.getIfExists(options?.type);

      const layerTypes = getLayersOptions(
        opts.basemaps,
        options?.type // the selected value
          ? options.type
          : ORTHO_BASEMAP_CONFIG.type
      );

      builder.addSelect({
        path: 'type',
        name: 'Layer type', // required, but hide space
        settings: {
          options: layerTypes.options,
        },
      });

      // Show data filter if the layer type can do something with the data query results
      if (handler.update) {
        builder.addCustomEditor({
          id: 'filterData',
          path: 'filterData',
          name: 'Data',
          editor: FrameSelectionEditor,
          defaultValue: undefined,
        });
      }

      if (!layer) {
        return; // unknown layer type
      }

      if (layer.showLocation) {
        let data = context.data;
        // If 'query' (`filterData`) exists filter data feeding into location editor
        if (options.filterData) {
          const matcherFunc = getFrameMatchers(options.filterData);
          if (data.some(matcherFunc)) {
            data = data.filter(matcherFunc);
          }
        }

        addLocationFields('Location', 'location.', builder, opts.isLogic, options.location, data);
      }
      if (handler.registerOptionsUI) {
        handler.registerOptionsUI(builder, context);
      }
      if (!isEqual(opts.category, ['Basemap layer'])) {
        builder.addFieldNamePicker({
          path: 'locField',
          name: 'Vertex A',
          description: 'Unique node ID',
          settings: {
            filter: (f: Field) => f.type === FieldType.string,
            noFieldsMessage: 'No string fields found',
          },
          showIf: (opts) => opts.type !== colTypes.GeoJson,
        });

        builder.addBooleanSwitch({
          path: 'isShowTooltip',
          name: 'Display tooltip',
          //description: 'Show the tooltip for layer',
          defaultValue: true,
        });
        builder.addMultiSelect({
          path: 'displayProperties',
          name: 'Tooltip properties',
          description: 'Default: all',
          settings: {
            allowCustomValue: true,
            options: [],
            placeholder: 'All Properties',
            getOptions:
              options?.type === colTypes.GeoJson
                ? async (context) => await getGeoJsonProps(context)
                : getQueryFields ?? [],
          },
          showIf: (opts) => opts.isShowTooltip,
          //showIf: (opts) => typeof opts.query !== 'undefined',
          defaultValue: '',
        });
      }

      if (handler.registerOptionsUI) {
        handler.registerOptionsUI(builder, context);
      }
    },
  };
  };
}
