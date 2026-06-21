import { PanelData, GrafanaTheme2, Field, PanelProps, FieldType, DataFrame } from '@grafana/data';

import {
  findSubgraphById,
  parseRoute,
} from './utils';
import { toRGB4Array } from '../../deckLayers/utils/color';
import { FrameGeometryField, getGeometryField, getLocationMatchers } from '../../utils/location';
import { getStyleDimension } from '../../utils/geomap_utils';
import { ExtendMapLayerRegistryItem, ExtendFrameGeometrySourceMode, ExtendMapLayerOptions } from '../../extension';
import { defaultStyleConfig, StyleConfig } from '../../style/types';
import { getStyleConfigState } from '../../style/utils';

import { OverField, Rule } from '../../editor/Groups/ruleTypes';
import { resolveFeatureGroup } from '../../editor/Groups/data/group-resolve';
import {
  Graph,
  FeatSource,
  AttributeRegistry,
  addNodeGroup,
  getGraphComments,
  getNodeData,
  setEntityAttrProp,
} from '@mapgl/panel-core/graph';
import {
  CMN_NAMESPACE,
  MOC_LOC_FIELD,
  FIXED_COLOR_LABEL,
} from '../../types/defaults';
import {
  pushPath,
} from '@mapgl/panel-core/graph/utils';
import {
  colTypes,
  type BiColProps,
  type PushPathProps,
} from '@mapgl/panel-core/types';
import { findField } from '../../grafana_core/app/features/dimensions';
import type { DataLayerEditorAdapters } from './types';
import { mockEdgeGraphData, mockTextConfig } from './mockData';
import { getMapglFeatureServices } from '../../extension-points/featureContracts';

export interface MarkersConfig {
  graph?: Graph;
  searchProperties?: string[];
  style: StyleConfig;
  edgeStyle: StyleConfig;
  arcStyle: {
    sideA: StyleConfig;
    sideB: StyleConfig;
  };
  arcConfig: {
    height: number;
    tiltIncrement: number;
    capacity: { field?: string; fixed: number };
  };
  groups?: Rule[];
  showStat2?: boolean;
  isWrapEdges?: 0 | 1 | 2 | 3;
  vertexA_NS?: string;
  vertexB_NS?: string;
}

const fixForNodes = {
  ...defaultStyleConfig,
  size: { ...defaultStyleConfig.size, fixed: 25 },
};

const defaultOptions: MarkersConfig = {
  style: { ...fixForNodes, useGroups: true },
  edgeStyle: { ...defaultStyleConfig },
  arcStyle: {
    sideA: { ...defaultStyleConfig, arrow: 0 },
    sideB: { ...defaultStyleConfig, arrow: 0 },
  },
  arcConfig: {
    height: 0.5,
    tiltIncrement: 7,
    capacity: { fixed: 1 },
  },
  showStat2: false,
  isWrapEdges: 0,
};

const cloneResolvedGroup = (group: any) => {
  if (!group) {
    return group;
  }

  return {
    ...group,
    color: Array.isArray(group.color) ? [...group.color] : group.color,
    offset: Array.isArray(group.offset) ? [...group.offset] : group.offset,
  };
};

export const MARKERS_LAYER_ID = colTypes.Markers;

// Used by default when nothing is configured
export const defaultMarkersConfig: ExtendMapLayerOptions<MarkersConfig> = {
  type: MARKERS_LAYER_ID,
  name: 'new markers layer',
  config: defaultOptions,
  location: {
    mode: ExtendFrameGeometrySourceMode.Auto,
  },
};

/**
 * Map data layer configuration for icons, circle, label overlay with polyline-strings for links
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

  /**
   * Function that configures transformation and returns transformed points
   * @param props
   * @param options
   */

    create: async (
      panel: any,
      options: ExtendMapLayerOptions<MarkersConfig>,
      theme: GrafanaTheme2,
      layerIdx?: number
    ) => {
    const props: PanelProps<any> = panel.props;
    const layerName = options.name as string;
    const colType = MARKERS_LAYER_ID;

    const graph = panel.graph;
    const { parField, edgeIdField } = options;
    const isWrapEdges = options.isWrapEdges as 0 | 1 | 2 | 3 | undefined;
    const locField = options.locField ?? MOC_LOC_FIELD;

    // Assert default values
    const config = {
      ...defaultOptions,
      ...options.config,
      style: {
        ...defaultOptions.style,
        ...options.config?.style,
        ...(panel.useMockData && {
          text: mockTextConfig,
        }),
      },
      edgeStyle: {
        ...defaultOptions.edgeStyle,
        ...options.config?.edgeStyle,
        ...(panel.useMockData &&
          options.config?.edgeStyle.arrow === undefined && {
            arrow: 1,
          }),
      },
    };

    const style = await getStyleConfigState(config.style);
    const edgeStyle = await getStyleConfigState(config.edgeStyle);

    const { showStat2, vertexA_NS, vertexB_NS } = config;

    const arcConfig = config.arcConfig;
    let arcStyle: any = {
      sideA: edgeStyle,
      sideB: edgeStyle,
      arcConfig,
    };

    if (showStat2) {
      arcStyle.sideA = await getStyleConfigState(config.arcStyle.sideA);
      arcStyle.sideB = await getStyleConfigState(config.arcStyle.sideB);
    }

    const matchers = await getLocationMatchers(options?.location);
    const featSource = new FeatSource(MARKERS_LAYER_ID, layerName);
    featSource.useMockData = panel.useMockData;

    let info: FrameGeometryField | undefined;

    return {
      init: () => featSource,
      geom: (data: PanelData) => {
        if (panel.useMockData) {
          ///} || !panel.positions.length) {
          data.series = [mockEdgeGraphData];
        }
        featSource.useMockData = panel.useMockData;

        for (const frame of data.series) {
          info = getGeometryField(frame, matchers, locField, vertexA_NS, vertexB_NS, panel, featSource, graph);
          if (info.warning) {
            //console.log(info.warning);
            continue;
          }
          const field = info?.field;

          if (!field?.values) {
            //console.log('no coords field');
            break;
          }

          const values = field.values;
          const startIdx = panel.vCount;
          const ranges = field.ranges;
          //console.log('startIdx new', startIdx, panel.isLogic)

          if (panel.graphEngine) {
            const setPositions = panel.graphEngine.setPositions.bind(panel.graphEngine);
            const createVertices = panel.graphEngine.createVertices.bind(panel.graphEngine);

            setPositions(values as Float64Array, startIdx * 2);
            createVertices(true, ranges as any);
          }

          panel.positions.set(values as Float64Array, startIdx * 2);
          const pointCount = values.length / 2;
          if (pointCount > 0) {
            const endIdxExclusive = startIdx + pointCount;
            featSource.setPositionRanges([[startIdx, endIdxExclusive]]);
            panel.vCount = endIdxExclusive;
          }
          break;
        }
      },
      update: (data: PanelData) => {
        // console.log('update data filtered', data)

        if (panel.useMockData) {
          data.series = [mockEdgeGraphData];
        }
        featSource.useMockData = panel.useMockData;

        for (const frame of data.series) {
          const frameRefId = frame.refId;

          style.dims = getStyleDimension(frame, style, theme);
          style.arcDims = style.config.arcs?.map((config) => getStyleDimension(frame, style, theme, { color: config }));

          if (edgeStyle) {
            edgeStyle.dims = getStyleDimension(frame, edgeStyle, theme);

            if (showStat2) {
              arcStyle.sideA.dims = getStyleDimension(
                frame,
                {
                  ...arcStyle.sideA,
                  config: {
                    ...arcStyle.sideA.config,
                    capacity: arcConfig.capacity,
                  },
                },
                theme
              );
              arcStyle.sideB.dims = getStyleDimension(
                frame,
                {
                  ...arcStyle.sideB,
                  config: {
                    ...arcStyle.sideB.config,
                    capacity: arcConfig.capacity,
                  },
                },
                theme
              );
            } else {
              arcStyle.sideA.dims = edgeStyle.dims;
              arcStyle.sideB.dims = edgeStyle.dims;
            }
          }

          const field = info?.field;
          const coords = field?.values;
          if (!coords || !field?.nodes) {
            //console.log('no coords field / no query', field, coords, field?.nodes);
            return;
          }

          const { field: nodeMetricField, fixed } = style.config?.color || {};
          const isFixed = !nodeMetricField && Boolean(fixed);
          const colorField = style.dims.color?.field;
          const colorThresholds = isFixed
            ? undefined
            : style.config?.color?.thresholds ?? colorField?.config?.thresholds;
          featSource.setThresholds(colorThresholds);

          const fieldValues = new Map(frame.fields.map((f) => [f.name, f.values]));
          const mock = panel.useMockData ? indexFields(frame) : undefined;
          const getValue = (fieldName: string | undefined, rowIndex: number) => {
            if (!fieldName) {
              return undefined;
            }

            if (panel.useMockData) {
              return mock?.[fieldName]?.[rowIndex];
            }

            return fieldValues.get(fieldName)?.[rowIndex];
          };

          const ruleFieldNames = Array.from(
            new Set(
              featSource.getGroups.flatMap((group) =>
                Array.isArray(group.overrides) ? group.overrides.map((override) => override.name) : []
              )
            )
          );
          const makeRulePoint = (rowIndex: number, thrColor?: string) => {
            const point: Record<string, any> = {};

            for (const fieldName of ruleFieldNames) {
              point[fieldName] = getValue(fieldName, rowIndex);
            }

            if (locField) {
              point[locField] = getValue(locField, rowIndex);
            }

            if (thrColor !== undefined) {
              point.thrColor = thrColor;
            }

            return point;
          };
          const points: BiColProps[] = [];
          let counter = 0;

          field.nodes?.forEach((node, i) => {
            const locName = panel.useMockData ? mock?.source?.[i] : getValue(locField, i);
            if (!locName) {
              return;
            }
            const point = makeRulePoint(i);

            const stValues = {
              ...style.base,
              color: toRGB4Array(style.base.color as string),
              group: {},
              arcs: [] as Array<string | undefined>,
            };

            const edgeStValues = {
              ...edgeStyle.base,
              color: toRGB4Array(edgeStyle.base.color as string),
              thr: {},
            } as any;
            const arcStValues = {
              arcConfig,
              sideA: {
                ...arcStyle.sideA.base,
                color: toRGB4Array(arcStyle.sideA.base.color),
                thr: {},
              },
              sideB: {
                ...arcStyle.sideB.base,
                color: toRGB4Array(arcStyle.sideB.base.color),
                thr: {},
              },
            };
            const dims = style.dims;
            const edgeDims = edgeStyle.dims;
            const arcDims = {
              sideA: arcStyle.sideA.dims,
              sideB: arcStyle.sideB.dims,
            };

            // try {

            if ((!dims || !Object.keys(dims).length) && !fixed) {
              return;
            }
            let group;
            const fixedColor = fixed ? theme.visualization.getColorByName(fixed) : undefined;
            const hexColor = isFixed ? fixedColor : dims?.color?.get(i) ?? fixedColor;
            if (hexColor) {
              const thrColor = isFixed ? undefined : hexColor;
              if (thrColor !== undefined) {
                point.thrColor = thrColor;
              }

              const rgba = toRGB4Array(hexColor);
              stValues.color = rgba;

              ({ group } = resolveFeatureGroup({
                feature: point,
                featSource,
                allGroups: panel.groups,
                theme,
                isFixed,
                locField,
                locName,
                hexColor,
                rgba,
              }));

              stValues.group = cloneResolvedGroup(group);
              if (dims?.size) {
                stValues.size = dims.size.get(i);
              }
              if (dims?.text) {
                stValues.text = dims.text.get(i);
              }

              if (group.size !== undefined) {
                stValues.size = group.size;
              }

              if (panel.isLogic && style.arcDims) {
                const arcs = style.arcDims.map((arc) => arc.color?.get(i));
                stValues.arcs = arcs;
              }
            }

            const edgeMetrics = {
              sideA: undefined,
              sideB: undefined,
              cMetric: undefined,
            };

            const { field: edgeMetricField, fixed: edgeFixed } = edgeStyle.config?.color || {};
            if (edgeMetricField) {
              const field = findField(frame, edgeMetricField);
              edgeMetrics.cMetric = field?.values[i];
            }

            const edgeColor = edgeDims?.color?.get(i) ?? (edgeFixed && theme.visualization.getColorByName(edgeFixed));

            if (edgeColor) {
              // overwriting color for multiedges
              point.thrColor = edgeColor;
              const rgba = toRGB4Array(edgeColor);
              edgeStValues.color = rgba;

              if (edgeMetricField && edgeMetricField === nodeMetricField) {
                edgeStValues.group = stValues.group;
              }

              if (edgeDims?.size) {
                edgeStValues.size = edgeDims.size.get(i);
              }

              if (group.width !== undefined) {
                edgeStValues.size = group.width;
              }
              if (edgeDims?.text) {
                edgeStValues.text = edgeDims.text.get(i);
              }
            }

            ['sideA', 'sideB'].forEach((side) => {
              if (!showStat2) {
                arcStValues[side] = {
                  group: edgeStValues.group,
                  color: edgeStValues.color,
                  size: edgeStValues.size,
                  text: edgeStValues.text,
                  opacity: edgeStValues.opacity,
                };
              } else {
                const { field: arcMetricField, fixed: arcFixed } = arcStyle?.[side]?.config?.color || {};
                if (arcMetricField) {
                  const field = findField(frame, arcMetricField);
                  edgeMetrics[side] = field?.values[i];
                }

                const arcColor =
                  arcDims?.[side]?.color?.get(i) ?? (arcFixed && theme.visualization.getColorByName(arcFixed));

                if (arcColor) {
                  //arcStValues[side].group = {lineWidth: edgeStValues.group?.lineWidth}
                  const rgba = toRGB4Array(arcColor);
                  arcStValues[side].color = rgba;
                  arcStValues[side].colorField = arcStyle?.[side]?.config?.color?.field;
                  arcStValues[side].opacity = edgeStValues.opacity;

                  if (arcStyle[side].arrow !== undefined) {
                    arcStValues[side].arrow = arcStyle[side].arrow;
                  }
                  if (arcDims[side].size) {
                    arcStValues[side].size = arcDims[side].size.get(i);
                  }
                  if (arcDims[side].text) {
                    arcStValues[side].text = arcDims[side].text.get(i);
                  }
                }

                if (arcMetricField === edgeMetricField) {
                  arcStValues[side].group = edgeStValues.group;
                }
              }
            });

            const graphA = node.parent as Graph;
            const nodeData = getNodeData(node)!;
            const { wasmId } = nodeData;
            const dataRecord: BiColProps = {
              id: wasmId, // doesn't matter, not used elsewhere
              layerName,
              ...(layerIdx !== undefined && { layerIdx }),
              frameRefId,
              rowIndex: i,
              featSource,
              graph: graphA,
              locName,
              style: stValues,
              edgeStyle: edgeStValues,
              arcStyle: arcStValues,
            };

            const isFirstNodeRecord = node && !nodeData.feature;

            if (isFirstNodeRecord) {
              setEntityAttrProp(node, AttributeRegistry.NodeDataIndex, 'feature', dataRecord);

              panel.features.push(dataRecord);
              const wasmId = getNodeData(node)!.wasmId as number;
              addNodeGroup(graph, group.groupIdx);

              const muted = [...group.color];
              muted[3] = stValues.opacity !== undefined ? Math.round(muted[3] * stValues.opacity) : muted[3];
              const color = [...group.color];
              //color[3] = 255
              panel.colors.set(color, wasmId * 4);
              panel.muted.set(muted, wasmId * 4);
              panel.annots.set(muted, wasmId * 4); // duplicate for live updates fallback
              panel.groupIndices[wasmId] = group.groupIdx;
              points.push(dataRecord);
              counter++;
            }

            const processParPath = (parPath) => {
              if (!parPath || parPath.length < 2) {
                return;
              }

              const edgeIdValue = panel.useMockData ? mock?.edgeId?.[i] : getValue(edgeIdField, i);
              const edgeId = edgeIdValue?.length ? edgeIdValue : undefined;

              const commentsData = getGraphComments(graphA);

              const vB_NS = vertexB_NS ? findField(frame, vertexB_NS) : undefined;

              const subGraphBName = vB_NS?.values[i] ?? CMN_NAMESPACE;
              const graphB = findSubgraphById(graph, subGraphBName) ?? graph;

              const props: PushPathProps = {
                panel,
                graphA,
                graphB,
                edgeId,
                ...(edgeIdValue?.length ? { rxEdgeId: edgeIdValue } : {}),
                dataRecord,
                parPath,
                ...(layerIdx !== undefined && { layerIdx }),
                wrap: isWrapEdges ?? 0,
                aMetric: edgeMetrics.sideA,
                bMetric: edgeMetrics.sideB,
                cMetric: edgeMetrics.cMetric,
                commentsData,
                theme,
              };
              pushPath(props);
            };

            const parent = panel.useMockData ? mock?.target?.[i] : getValue(parField, i);
            const route = parseRoute(parent);

            if (route) {
              const parPath = getParPath(route, counter, null, locName);

              if (parPath.filter((el) => el && (typeof el === 'string' || Array.isArray(el))).length < 2) {
                return;
              }

              if (node && parPath) {
                processParPath(parPath);
              }
            }
            //   }
            //
            //   catch (error ){
            //     console.log('locName: '+locName+'. '+error)
            //     //throw new Error('locName: '+locName+'. '+error);
            //   }
            //
          });

          featSource?.setFeatures(points, frameRefId);

          //break; // Only the first frame for now! -- filtered by query anyway
        }
        return;
      },
      registerOptionsUI: (builder, context) => {
        const useMockData = !!context.instanceState?.layer.useMockData;
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

        if (getMapglFeatureServices().edition === 'extended') {
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
            showIf: (opts) => true, //!!opts.edgeIdField,
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
            //showIf: (opts) => typeof opts.query !== 'undefined',
            defaultValue: '',
          })
          .addCustomEditor({
            id: 'config.style',
            category: ['Node Styles'],
            path: 'config.style',
            name: 'Node Styles',
            editor: StyleEditor,
            settings: {
              // frameMatcher: (frame: DataFrame) => frame === frameNodes,
            },
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
                showIf: () => panel.isLogic,
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
              //frameMatcher: (frame: DataFrame) => frame === frameEdges,
            },
            showIf: (opts, data) => !!opts.parField || useMockData,
            defaultValue: defaultOptions.edgeStyle,
          })
          .addBooleanSwitch({
            path: 'config.showStat2',
            name: 'Arc styles',
            category: ['Edge Styles'],
            //description: '',
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
              //frameMatcher: (frame: DataFrame) => frame === frameEdges,
            },
            showIf: (opts) => opts.config.showStat2 && (!!opts.parField || useMockData),
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
            showIf: (opts) => opts.config.showStat2 && (!!opts.parField || useMockData),
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
              //frameMatcher: (frame: DataFrame) => frame === frameEdges,
            },
            showIf: (opts) => opts.config.showStat2 && (!!opts.parField || useMockData),
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
            showIf: (opts) => opts.config.showStat2 && (!!opts.parField || useMockData),
            defaultValue: defaultOptions.arcStyle.sideB.arrow,
          })
          .addNumberInput({
            category: ['Arc Styles'],
            path: 'config.arcConfig.height',
            name: 'Height multiplier',
            description: '0 - Flat, 1 - Max',
            defaultValue: defaultOptions.arcConfig.height,
            showIf: (opts) => opts.config.showStat2 && (!!opts.parField || useMockData),
            settings: {
              min: 0,
              max: 1,
            },
          })
          .addNumberInput({
            category: ['Arc Styles'],
            path: 'config.arcConfig.tiltIncrement',
            name: 'Tilt angle increment',
            description: '0 - no tilt, 20 - max',
            defaultValue: defaultOptions.arcConfig.tiltIncrement,
            showIf: (opts) => opts.config.showStat2 && (!!opts.parField || useMockData),
            settings: {
              min: 0,
              max: 20,
            },
          })
          .addCustomEditor({
            id: 'config.arcStyle.capacity',
            category: ['Arc Styles'],
            path: 'config.arcConfig.capacity',
            name: 'Capacity',
            description: 'Max value field',
            editor: CapacityDimensionEditor,
            settings: {
              filteredFieldType: FieldType.number,
            },
            showIf: (opts) => opts.config.showStat2 && (!!opts.parField || useMockData),
            defaultValue: defaultOptions.arcConfig.capacity,
          });
      },
    };
  },

    // fill in the default values
    defaultOptions,
  };
}

function getParPath(target, id, idx, locName) {
  const isArray = Array.isArray(target);

  if (!isArray) {
    if (typeof target === 'string') {
      return [locName, target];
    }
    //console.log('Wrong format: ' + toJS(target));
    return [];
  }

  const parPath: any = target;

  const isInitString =
    (Array.isArray(parPath) && typeof parPath[0] === 'string') ||
    (!Array.isArray(parPath[0]) && typeof parPath === 'string'); // #TODO : better handling for single names like [["U1"],"M1"]
  if (!isInitString) {
    // console.log(
    //   'Wrong path format: No coords, numbers, nulls allowed as 0 element), no deeper nesting arrays, or empty arrays. Info: id: ' +
    //     id +
    //     ' locName: ' +
    //     locName +
    //     ' target: ' +
    //     target
    // );
    return [];
  }

  const isSingle = Array.isArray(parPath) ? parPath.length === 1 : false;
  return isSingle ? [locName, parPath[0]] : parPath[0] !== locName ? [locName, ...parPath] : (parPath as []);
}

function indexFields(frame: DataFrame) {
  const map: Record<string, any[]> = {};

  for (const field of frame.fields) {
    map[field.name] = field.values as any[];
  }

  return map;
}
