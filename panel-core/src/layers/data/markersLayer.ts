import { Field, FieldType } from '@grafana/data';
import { FeatSource } from '@mapgl/panel-core/graph';
import { colTypes } from '@mapgl/panel-core/types';

import { getMapglFeatureServices } from '../../extension-points/featureContracts';
import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from '../../extension';
import { defaultMarkersOptions, MARKERS_LAYER_ID, type MarkersConfig } from './markersDefaults';
import type { DataLayerEditorAdapters } from './types';

const defaultOptions = defaultMarkersOptions;

/**
 * Map data layer configuration for icons, circle, label overlay with line-strings for links/multi-hop links.
 *
 * Graph data is normalized and committed by GraphFramePipeline. The registry
 * handler only owns layer initialization and editor registration.
 */
export function createMarkersLayer({
  ArcOptionsEditor,
  CapacityDimensionEditor,
  GroupsEditor,
  StyleEditor,
  getQueryFields,
}: DataLayerEditorAdapters): ExtendMapLayerRegistryItem<MarkersConfig> {
  return {
    id: MARKERS_LAYER_ID,
    name: 'Markers and links',
    description: 'Nodes and edges from query',
    isBaseMap: false,
    showLocation: true,
    usesQueryData: true,

    create: async (panel: any, options: ExtendMapLayerOptions<MarkersConfig>) => {
      const featSource = new FeatSource(MARKERS_LAYER_ID, options.name);
      featSource.useMockData = panel.useMockData;

      return {
        init: () => featSource,
        registerOptionsUI: (builder, context) => {
          const useMockData = !!context.instanceState?.layer.useMockData;
          const isExtendedEdition = getMapglFeatureServices().edition === 'extended';
          builder
            .addFieldNamePicker({
              path: 'parField',
              name: 'Vertex B',
              description: 'Node ID or path array of node IDs and [lon, lat]',
              settings: {
                filter: (f: Field) => {
                  return f.type === FieldType.string;
                },
                isClearable: true,
                noFieldsMessage: 'No string fields found',
              },
              showIf: (opts) => opts.type === colTypes.Markers,
            })
            .addFieldNamePicker({
              path: 'edgeIdField',
              name: 'Edge ID',
              description: 'Optional. Used for parallel edges or trace ID',
              settings: {
                filter: (f: Field) => {
                  return f.type === FieldType.string;
                },
                isClearable: true,
                noFieldsMessage: 'No string fields found',
              },
              showIf: (opts) => !!opts.parField,
            });

          if (isExtendedEdition) {
            builder.addRadio({
              path: 'isWrapEdges',
              name: 'Reduce parallel edges to: ',
              settings: {
                options: [
                  { label: 'Min', value: 1 },
                  { label: 'Max', value: 2 },
                  { label: 'Both', value: 3 },
                  { label: 'No wrap', value: 0 },
                ],
              },
              showIf: (opts) => true,
              defaultValue: defaultOptions.isWrapEdges,
            });
          }

          builder
            .addFieldNamePicker({
              path: 'config.vertexA_NS',
              name: 'Vertex A namespace',
              description: 'Optional. Use "." to separate layers',
              settings: {
                filter: (f: Field) => {
                  return f.type === FieldType.string;
                },
                isClearable: true,
                noFieldsMessage: 'No string fields found',
              },
              showIf: (opts) => panel.isLogic && !!opts.locField,
            })
            .addFieldNamePicker({
              path: 'config.vertexB_NS',
              name: 'Vertex B namespace',
              description: 'Optional',
              settings: {
                filter: (f: Field) => {
                  return f.type === FieldType.string;
                },
                isClearable: true,
                noFieldsMessage: 'No string fields found',
              },
              showIf: (opts) => panel.isLogic && !!opts.parField,
            })
            .addMultiSelect({
              path: 'searchProperties',
              name: 'Search by',
              description: 'Extra fields',
              settings: {
                allowCustomValue: false,
                options: [],
                placeholder: 'Search by location name',
                getOptions: getQueryFields,
              },
              showIf: (opts) => opts.type === colTypes.Markers,
              defaultValue: '',
            })
            .addCustomEditor({
              id: 'config.style',
              category: ['Node Styles'],
              path: 'config.style',
              name: 'Node Styles',
              editor: StyleEditor,
              settings: {},
              defaultValue: defaultOptions.style,
            })
            .addNestedOptions({
              category: ['Node Styles'],
              path: 'config.style',
              build: (builder) => {
                builder.addCustomEditor({
                  id: 'arcs',
                  name: 'Arc sections',
                  path: 'arcs',
                  editor: ArcOptionsEditor,
                });
              },
            })
            .addBooleanSwitch({
              path: 'config.style.useGroups',
              name: 'Apply',
              category: ['Node Groups'],
              defaultValue: defaultOptions.style.useGroups,
            })
            .addCustomEditor({
              category: ['Node Groups'],
              id: 'config.groups',
              path: 'config.groups',
              name: 'Legend label, SVG icon, color override',
              editor: GroupsEditor,
            })
            .addRadio({
              path: 'config.edgeStyle.arrow',
              category: ['Edge Styles'],
              name: 'Arrow',
              settings: {
                options: [
                  { label: 'None', value: 0 },
                  { label: 'Forward', value: 1 },
                  { label: 'Reverse', value: -1 },
                  { label: 'Both', value: 2 },
                ],
              },
              defaultValue: defaultOptions.edgeStyle.arrow,
            })
            .addCustomEditor({
              id: 'config.edgeStyle',
              category: ['Edge Styles'],
              path: 'config.edgeStyle',
              name: 'Edge Styles',
              editor: StyleEditor,
              settings: {
                hideSymbol: true,
                isEdge: true,
              },
              showIf: (opts) => !!opts.parField || useMockData,
              defaultValue: defaultOptions.edgeStyle,
            })
            .addBooleanSwitch({
              path: 'config.showStat2',
              name: 'Arc styles',
              category: ['Edge Styles'],
              defaultValue: false,
              showIf: (opts) => !!opts.parField || useMockData,
            })
            .addCustomEditor({
              id: 'config.arcStyle.sideA',
              category: ['Arc Styles'],
              path: 'config.arcStyle.sideA',
              name: 'Side A',
              editor: StyleEditor,
              settings: {
                hideSymbol: true,
                hideOpacity: true,
                hideText: true,
                isEdge: true,
              },
              showIf: (opts) => opts.config?.showStat2 && (!!opts.parField || useMockData),
              defaultValue: defaultOptions.style,
            })
            .addRadio({
              path: 'config.arcStyle.sideA.arrow',
              category: ['Arc Styles'],
              name: 'Arrow',
              settings: {
                options: [
                  { label: 'None', value: 0 },
                  { label: 'Forward', value: 1 },
                  { label: 'Reverse', value: -1 },
                ],
              },
              showIf: (opts) => opts.config?.showStat2 && (!!opts.parField || useMockData),
              defaultValue: defaultOptions.arcStyle.sideA.arrow,
            })
            .addCustomEditor({
              id: 'config.arcStyle.sideB',
              category: ['Arc Styles'],
              path: 'config.arcStyle.sideB',
              name: 'Side B',
              editor: StyleEditor,
              settings: {
                hideSymbol: true,
                hideOpacity: true,
                hideText: true,
                isEdge: true,
              },
              showIf: (opts) => opts.config?.showStat2 && (!!opts.parField || useMockData),
              defaultValue: defaultOptions.style,
            })
            .addRadio({
              path: 'config.arcStyle.sideB.arrow',
              category: ['Arc Styles'],
              name: 'Arrow',
              settings: {
                options: [
                  { label: 'None', value: 0 },
                  { label: 'Forward', value: 1 },
                  { label: 'Reverse', value: -1 },
                ],
              },
              showIf: (opts) => opts.config?.showStat2 && (!!opts.parField || useMockData),
              defaultValue: defaultOptions.arcStyle.sideB.arrow,
            })
            .addNumberInput({
              category: ['Arc Styles'],
              path: 'config.arcConfig.height',
              name: 'Height multiplier',
              description: '0 - Flat, 1 - Max',
              defaultValue: defaultOptions.arcConfig.height,
              showIf: (opts) => opts.config?.showStat2 && (!!opts.parField || useMockData),
              settings: {
                min: 0,
                max: 1,
              },
            });

          if (isExtendedEdition) {
            builder.addNumberInput({
              category: ['Arc Styles'],
              path: 'config.arcConfig.tiltIncrement',
              name: 'Tilt angle increment',
              description: '0 - no tilt, 20 - max',
              defaultValue: defaultOptions.arcConfig.tiltIncrement,
              showIf: (opts) => opts.config?.showStat2 && (!!opts.parField || useMockData),
              settings: {
                min: 0,
                max: 20,
              },
            });
          }

          builder.addCustomEditor({
            id: 'config.arcStyle.capacity',
            category: ['Arc Styles'],
            path: 'config.arcConfig.capacity',
            name: 'Capacity',
            description: 'Max value field',
            editor: CapacityDimensionEditor,
            settings: {
              filteredFieldType: FieldType.number,
            },
            showIf: (opts) => opts.config?.showStat2 && (!!opts.parField || useMockData),
            defaultValue: defaultOptions.arcConfig.capacity,
          });
        },
      };
    },
    defaultOptions,
  };
}
