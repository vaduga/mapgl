import { get as lodashGet, isEqual } from 'lodash';

import {
  Field,
  FieldType,
  FrameGeometrySourceMode,
  getFrameMatchers,
  StandardEditorContext
} from '@grafana/data';

import { defaultMarkersConfig } from '../layers/data/markersLayer';
import {ORTHO_BASEMAP_CONFIG, geomapLayerRegistry, getLayersOptions, DEFAULT_BASEMAP_CONFIG} from '../layers/registry';
import { MapLayerState } from '../types';

import { FrameSelectionEditor } from './FrameSelectionEditor';
import {setOptionImmutably} from "../grafana_core/app/dashboard/components/PanelEditor/utils";
import {PanelOptionsSupplier} from "../grafana_data/panel/PanelPlugin";

import {ExtendMapLayerOptions} from "../extension";
import {addLocationFields} from "./MapView/locationEditor";
import {colTypes} from "mapLib/utils";
import {getQueryFields} from "./getQueryFields";
import {getGeoJsonProps} from "../layers/data/geojsonLayer";


export interface LayerEditorOptions {
  state: MapLayerState;
  category: string[];
  isLogic: boolean;
  basemaps: boolean; // only basemaps
}

export interface NestedValueAccess {
  getValue: (path: string) => any;
  onChange: (path: string, value: any) => void;
  getContext?: (parent: StandardEditorContext<any, any>) => StandardEditorContext<any, any>;
}
export interface NestedPanelOptions<TSub = any> {
  path: string;
  category?: string[];
  defaultValue?: TSub;
  build: PanelOptionsSupplier<TSub>;
  values?: (parent: NestedValueAccess) => NestedValueAccess;
}

export function getLayerEditor(opts: LayerEditorOptions): NestedPanelOptions<ExtendMapLayerOptions> {
  return {
    category: opts.category,
    path: '--', // Not used
    defaultValue: opts.basemaps ? ORTHO_BASEMAP_CONFIG : defaultMarkersConfig,
    values: (parent: NestedValueAccess) => ({
      getContext: (parent) => {
        //console.log('in layer editor ctx', parent, opts.state )
        return { ...parent, options: opts.state.options, instanceState: opts.state };
      },
      getValue: (path: string) => lodashGet(opts.state.options, path),
      onChange: (path: string, value: string) => {
        const { state } = opts;
        const { options } = state;
        if (path === 'type' && value) {
          const layer = geomapLayerRegistry.getIfExists(value);
          //console.log('layer onchange', layer)
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
        //console.log('state onchange?', state, options, path, value)
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
          path: 'query',
          name: 'Data',
          editor: FrameSelectionEditor,
          defaultValue: undefined,
        });
      }

      if (!layer) {
        return; // unknown layer type
      }


      // Don't show UI for default configuration
      if (options.type === DEFAULT_BASEMAP_CONFIG.type) {
        return;
      }

      if (layer.showLocation) {
        let data = context.data;
        // If 'query' (`filterData`) exists filter data feeding into location editor
        if (options.query) {
          const matcherFunc = getFrameMatchers(options.query);
          data = data.filter(matcherFunc);
        }

        addLocationFields('Location', 'location.', builder, opts.isLogic, options.location, data);
      }


      if (!isEqual(opts.category, ['Basemap layer'])) {

        builder.addFieldNamePicker({
          path: 'locField',
          name: 'Vertex A',
          description: 'unique node ID',
          settings: {
            filter: (f: Field) => f.type === FieldType.string,
            noFieldsMessage: 'No string fields found',
          },
          showIf: (opts) => opts.type !== colTypes.GeoJson,
        })

        builder.addBooleanSwitch({
          path: 'isShowTooltip',
          name: 'Display tooltip',
          //description: 'Show the tooltip for layer',
          defaultValue: true,
        })
        builder.addMultiSelect({
          path: 'displayProperties',
          name: 'Tooltip properties',
          description: 'default: all',
          settings: {
            allowCustomValue: true,
            options: [],
            placeholder: 'All Properties',
            //@ts-ignore
            getOptions: options?.type === colTypes.GeoJson ? async (context)=> await getGeoJsonProps(context) : getQueryFields ?? [],

          },
          showIf: (opts) => opts.isShowTooltip,
          //showIf: (opts) => typeof opts.query !== 'undefined',
          defaultValue: '',
        })


      }

      if (handler.registerOptionsUI) {
        handler.registerOptionsUI(builder, context);
      }
    },
  };
}
