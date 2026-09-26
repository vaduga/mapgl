import { Field, FieldType } from '@grafana/data';
import { FeatSource } from '@mapgl/panel-core/graph';
import { colTypes } from '@mapgl/panel-core/types';

import { getMapglFeatureServices } from '../../extension-points/featureContracts';
import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from '../../extension';
import { OptIdentityEditor } from '../../editor/Other/OptIdentityEditor';
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
          const isExtendedEdition = getMapglFeatureServices(panel).edition === 'extended';
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
            .addCustomEditor({
              id: 'optional',
              path: 'optional',
              name: '',
              editor: OptIdentityEditor,
              settings: {
                isLogic: panel.isLogic,
                isExtendedEdition,
                getQueryFields,
              },
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
                  // ArcOptionsEditor renders the visible label and collapse control.
                  name: '',
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
            .addCustomEditor({
              id: 'config.edgeStyle',
              category: ['Edge Styles'],
              path: 'config.edgeStyle',
              name: 'Edge Styles',
              editor: StyleEditor,
              settings: {
                hideSymbol: true,
                isEdge: true,
                arrowOptions: [
                  { label: 'None', value: 0 },
                  { label: 'Forward', value: 1 },
                  { label: 'Reverse', value: -1 },
                  { label: 'Both', value: 2 },
                ],
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
                arrowOptions: [
                  { label: 'None', value: 0 },
                  { label: 'Forward', value: 1 },
                  { label: 'Reverse', value: -1 },
                ],
                sectionStyle: true,
              },
              showIf: (opts) => opts.config?.showStat2 && (!!opts.parField || useMockData),
              defaultValue: defaultOptions.style,
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
                arrowOptions: [
                  { label: 'None', value: 0 },
                  { label: 'Forward', value: 1 },
                  { label: 'Reverse', value: -1 },
                ],
                sectionStyle: true,
              },
              showIf: (opts) => opts.config?.showStat2 && (!!opts.parField || useMockData),
              defaultValue: defaultOptions.style,
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
