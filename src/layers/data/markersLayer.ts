import {
  PanelData,
  DataFrameView, GrafanaTheme2, Field, PanelProps, FieldType, DataFrame,
} from '@grafana/data';

import {
    FrameGeometryField,
    getGeometryField,
    getLocationMatchers,
    getStyleDimension, mockEdgeGraphData, mockTextConfig,
    parseRoute,
    toRGB4Array
} from '../../utils';
import {
  ExtendMapLayerRegistryItem,
  ExtendFrameGeometrySourceMode,
  ExtendMapLayerOptions,
} from '../../extension';
import {StyleEditor} from "../../editor/StyleEditor";
import {defaultStyleConfig, StyleConfig} from "../../style/types";
import {getStyleConfigState} from "../../style/utils";
import {getGroupRules} from "../../editor/Groups/data/rules_processor";

import {Options} from "../../types";
import {GeomapPanel} from "../../GeomapPanel";
import {getQueryFields} from "../../editor/getQueryFields";
import {GroupsEditor} from "../../editor/Groups/GroupsEditor";
import {Rule} from "../../editor/Groups/rule-types";
import {CapacityDimensionEditor} from "../../editor/Other/CapacityEditor";
import {ArcOptionsEditor} from "../../editor/ArcOptionsEditor";
import {CurveFactory,  Graph, FeatSource, AttributeRegistry, GeomNode, Point as MSPoint} from "mapLib";
import {FIXED_COLOR_LABEL, pushPath, PushPathProps, colTypes, BiColProps } from 'mapLib/utils'
import {MOC_LOC_FIELD} from "mapLib/utils";


export interface MarkersConfig {
  graph?: Graph,
  searchProperties?: string[],
  style: StyleConfig,
  edgeStyle: StyleConfig,
  arcStyle: {
    sideA: StyleConfig,
    sideB: StyleConfig,
  },
  arcConfig: {
    height: number,
    capacity: { field?: string, fixed: number },
  },
  groups?: Rule[],
  showStat2?: boolean;
  isWrapEdges?: 0 | 1 | 2 | 3;
}

const fixForNodes = {...defaultStyleConfig, size: {...defaultStyleConfig.size, fixed: 25}}

const defaultOptions: MarkersConfig = {
  style: {...fixForNodes, useGroups: true},
  edgeStyle: {...defaultStyleConfig},
  arcStyle: {
    sideA: {...defaultStyleConfig,
      arrow: 0,
    },
    sideB: {...defaultStyleConfig,
      arrow: 0,
    }
  },
  arcConfig: {
    height: 0.5,
    capacity: { fixed: 1 }
  },
  showStat2: false,
  isWrapEdges: 0
};

export const MARKERS_LAYER_ID = colTypes.Markers

// Used by default when nothing is configured
export const defaultMarkersConfig: ExtendMapLayerOptions<MarkersConfig> = {
  type: MARKERS_LAYER_ID,
  name: 'new markers layer',
  config: defaultOptions,
  location: {
    mode: ExtendFrameGeometrySourceMode.Auto,
  }
};

/**
 * Map data layer configuration for icons, circle, label overlay with polyline-strings for links
 */
export const markersLayer: ExtendMapLayerRegistryItem<MarkersConfig> = {
  id: MARKERS_LAYER_ID,
  name: 'Markers and links',
  description: 'nodes and edges from query',
  isBaseMap: false,
  showLocation: true,

  /**
   * Function that configures transformation and returns transformed points
   * @param props
   * @param options
   */

  create: async (panel: GeomapPanel, options: ExtendMapLayerOptions<MarkersConfig>, theme: GrafanaTheme2, layerIdx?: number) => {

    const props: PanelProps<Options> = panel.props
    const layerName = options.name as string
    const colType = MARKERS_LAYER_ID

    const graph = panel.graph
    const {
      parField, edgeIdField
    } = options
    const locField = options.locField ?? MOC_LOC_FIELD

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
              ...(panel.useMockData && options.config?.edgeStyle.arrow === undefined && {
                  arrow: 1,
              }),
          }
      };

    const style = await getStyleConfigState(config.style);
    const edgeStyle = await getStyleConfigState(config.edgeStyle);

      const {showStat2} = config

      const arcConfig =  config.arcConfig
    let arcStyle: any = {
      sideA: edgeStyle, sideB: edgeStyle, arcConfig
    }

    if (showStat2) {
      arcStyle.sideA = await getStyleConfigState(config.arcStyle.sideA)
      arcStyle.sideB = await getStyleConfigState(config.arcStyle.sideB)
    }

    const matchers = await getLocationMatchers(options?.location);
    const featSource = new FeatSource(MARKERS_LAYER_ID, layerName)
    featSource.useMockData = panel.useMockData

    let info: FrameGeometryField | undefined

        return {
          init: () => featSource,
          geom: (data: PanelData)=> {

                if (panel.useMockData) {  ///} || !panel.positions.length) {
                data.series = [mockEdgeGraphData];
                 }
                featSource.useMockData = panel.useMockData


              const startIdx = graph.shallowNodeCount
              for (const frame of data.series) {
                  info = getGeometryField(frame, matchers, locField, panel, featSource, graph);
                  if (info.warning) {
                    //console.log(info.warning);
                    continue;
                  }
                  const field = info?.field

                  if (!field?.values) {
                    //console.log('no coords field')
                    break
                  }

              const values = field.values
              const ranges = field.ranges
              panel.positions.set(values as Float64Array, startIdx * 2)

              const lastIdx = values.length/2
                  if (lastIdx != undefined) {
                      featSource.setPositionRanges([[startIdx, lastIdx+1]])
                  }
                break;
              }
          },
          update: (data: PanelData) => {
           // console.log('update data filtered', data)

               if (panel.useMockData) {
               data.series = [mockEdgeGraphData];
                  }
              featSource.useMockData = panel.useMockData

            for (const frame of data.series) {
              const frameRefId = frame.refId

              style.dims = getStyleDimension(frame, style, theme)
              style.arcDims = style.config.arcs?.map(config=> getStyleDimension(frame, style, theme, {color: config}))

              if (edgeStyle) {
              edgeStyle.dims = getStyleDimension(frame, edgeStyle, theme);

              if (showStat2) {
              arcStyle.sideA.dims = getStyleDimension(frame, {...arcStyle.sideA, config: {...arcStyle.sideA.config, capacity: arcConfig.capacity}}, theme);
              arcStyle.sideB.dims = getStyleDimension(frame, {...arcStyle.sideB, config: {...arcStyle.sideB.config, capacity: arcConfig.capacity}}, theme);
              } else {
              arcStyle.sideA.dims = edgeStyle.dims
              arcStyle.sideB.dims = edgeStyle.dims
              }
              }

                const field = info?.field
                const coords = field?.values
                if (!coords || !field?.nodes) {
                  //console.log('no coords field / no query',field, coords, field?.nodes)
                  return
                }

              const colorField = style.dims.color?.field
              const colorThresholds = colorField?.config?.thresholds
              if (colorThresholds) {
                featSource.setThresholds(colorThresholds)
              }

              const dataFrame = new DataFrameView(frame) //.toArray()
              const points: BiColProps[] = []
              let counter = 0

              field.nodes?.forEach((node, i) => {

                    const point = dataFrame.get(i)

                    const locName = panel.useMockData ? indexFields(frame).source[i] : locField && point[locField]
                    if (!locName) {return}

                    const stValues = {
                      ...style.base, color: toRGB4Array(style.base.color as string), group: {}, arcs: [] as (string | undefined)[] }

                    const edgeStValues = {...edgeStyle.base, color: toRGB4Array(edgeStyle.base.color as string), thr: {}} as any
                    const arcStValues = {
                      arcConfig,
                      sideA: { ...arcStyle.sideA.base, color: toRGB4Array(arcStyle.sideA.base.color), thr: {} },
                      sideB: { ...arcStyle.sideB.base, color: toRGB4Array(arcStyle.sideB.base.color), thr: {} },
                    }
                    const dims = style.dims;
                    const edgeDims = edgeStyle.dims
                    const arcDims = {
                      sideA: arcStyle.sideA.dims,
                      sideB: arcStyle.sideB.dims
                    }

                      // try {

                        const {field: nodeMetricField, fixed} = style.config?.color || {}
                        const isFixed = !nodeMetricField && fixed

                        if ((!dims || !Object.keys(dims).length) && !fixed) {return}
                        let group
                        const hexColor = dims?.color?.get(i) ?? (fixed && theme.visualization.getColorByName(fixed))
                          if (hexColor) {
                            point.thrColor = isFixed ? FIXED_COLOR_LABEL : hexColor // for group rules

                            const rgba = toRGB4Array(hexColor)
                            stValues.color = rgba

                            const matchedRules = getGroupRules(point, featSource.getGroups, theme, isFixed, locField, locName)
                            /// original threshold. May contain no color
                            group = matchedRules[0]
                            /// escalate to the next threshold with color
                            const nextThr = matchedRules.find(r=> r.color !== undefined)

                            if (nextThr?.color) {
                              group.color = nextThr.color && toRGB4Array(nextThr.color)
                              group.groupIdx = nextThr.groupIdx
                            }
                            else {
                              const groupIdx = panel.groups.length
                              const newGroup: Rule = {
                                label: hexColor,
                                color: hexColor,
                                isEph: true,
                                groupIdx,
                                overrides: [{
                                   name: "thrColor", type: FieldType.enum, value: [point.thrColor]},
                                  ]
                              }

                              featSource.addGroup(newGroup)
                              panel.groups.push(newGroup)

                              if (group) {
                                group.color = rgba
                              } else {
                                group = {...newGroup, color: toRGB4Array(newGroup.color!)}
                              }
                              group.groupIdx = newGroup.groupIdx

                            }
                            stValues.group = group
                          if (dims?.size) {
                            stValues.size = dims.size.get(i);
                          }
                          if (dims?.text) {
                            stValues.text = dims.text.get(i);
                          }

                            if (group.nodeSize !== undefined) {
                                  stValues.size = group.nodeSize
                            }

                                if (panel.isLogic && style.arcDims) {
                              const arcs = style.arcDims.map(arc=> arc.color?.get(i))
                              stValues.arcs = arcs
                              if (arcs.length && group.iconSize !== undefined && group.iconSize > 0) {
                                stValues.size = group.iconSize
                              }
                            }

                        }

                        const {field: edgeMetricField, fixed: edgeFixed} = edgeStyle.config?.color || {}


                        const edgeColor =  edgeDims?.color?.get(i) ?? (edgeFixed && theme.visualization.getColorByName(edgeFixed))

                        if (edgeColor) {
                            // overwriting color for multiedges
                            point.thrColor = edgeColor
                            const rgba = toRGB4Array(edgeColor)
                            edgeStValues.color = rgba


                        if (edgeMetricField && edgeMetricField === nodeMetricField) {
                                edgeStValues.group = stValues.group
                              }

                          if (edgeDims?.size) {
                            edgeStValues.size = edgeDims.size.get(i);
                          }

                          if (group.lineWidth !== undefined) {
                            edgeStValues.size = group.lineWidth
                          }
                          if (edgeDims?.text) {
                            edgeStValues.text = edgeDims.text.get(i);
                          }

                        }


                        ['sideA', 'sideB'].forEach(side=> {
                            if (!showStat2) {
                              arcStValues[side] = {
                                group: edgeStValues.group,
                                color: edgeStValues.color,
                                size: edgeStValues.size,
                                text: edgeStValues.text,
                                opacity: edgeStValues.opacity,
                              }
                            } else {
                              const {field: arcMetricField, fixed: arcFixed} = arcStyle?.[side]?.config?.color || {}

                                const arcColor =  arcDims?.[side]?.color?.get(i) ?? (arcFixed && theme.visualization.getColorByName(arcFixed))

                              if (arcColor) {
                                  //arcStValues[side].group = {lineWidth: edgeStValues.group?.lineWidth}
                                  const rgba = toRGB4Array(arcColor)
                                  arcStValues[side].color = rgba
                                  arcStValues[side].colorField = arcStyle?.[side]?.config?.color?.field
                                  arcStValues[side].opacity = edgeStValues.opacity

                              if (arcStyle[side].arrow !== undefined) {
                                  arcStValues[side].arrow = arcStyle[side].arrow
                                }
                              if (arcDims[side].size) {
                                arcStValues[side].size = arcDims[side].size.get(i);
                              }
                              if (arcDims[side].text) {
                                arcStValues[side].text = arcDims[side].text.get(i);
                              }
                              }

                              if (arcMetricField === edgeMetricField) {
                                arcStValues[side].group = edgeStValues.group
                              }

                            }

                        })

                        const {wasmId} = node.data
                        const dataRecord: BiColProps = {
                          id: wasmId, // doesn't matter, not used elsewhere
                          // geometry, - stored as Float64Array in featSource
                          layerName,
                          ...(layerIdx!==undefined && {layerIdx}),
                          frameRefId,
                          rowIndex: i,
                          root: graph,
                          featSource,
                          locName,
                          style: stValues,
                          edgeStyle: edgeStValues,
                          arcStyle: arcStValues,
                        }

                        const feature = node?.data.feature

                        if (node && !feature) {

                          node.setAttrProp(AttributeRegistry.NodeDataIndex, 'feature', dataRecord)

                          panel.features.push(dataRecord)
                          const gb = new GeomNode(node)
                          if (stValues.size != undefined) {
                            gb.boundaryCurve = CurveFactory.mkCircle(stValues.size/2, new MSPoint(0, 0))
                          }
                          const wasmId = node.data.wasmId as number
                          graph.addToGroup(group.groupIdx, wasmId)

                          const muted = [...group.color];
                          muted[3] = stValues.opacity !== undefined ? Math.round( muted[3] * stValues.opacity ) : muted[3];
                          const color = group.color;//[...group.color];
                          //color[3] = 255
                          panel.colors.set(color, wasmId * 4)
                          panel.muted.set(muted, wasmId * 4)
                          panel.annots.set(muted, wasmId * 4) // duplicate for live updates fallback
                          panel.groupIndices[wasmId] = group.groupIdx
                          points.push(dataRecord)
                          counter++
                        }

                        const processParPath = (parPath) => {
                          if (!parPath || parPath.length < 2) return;

                          const edgeIdValue = panel.useMockData ? indexFields(frame).edgeId[i] : edgeIdField && point[edgeIdField];
                          const edgeId = edgeIdValue?.length ? edgeIdValue : undefined

                          const commentsData = graph.comments

                          const props: PushPathProps = {
                            panel,
                            graphA: graph,
                            graphB: graph,
                            edgeId,
                            ...(edgeIdValue?.length? {rxEdgeId: edgeIdValue}: {} ),
                            dataRecord,
                            parPath,
                            ...(layerIdx !== undefined && {layerIdx}),
                            commentsData,
                            theme,
                          }
                          pushPath(props);
                        };

                        const parent = panel.useMockData ? indexFields(frame).target[i] : parField && point[parField];
                        const route = parseRoute(parent)

                        if (route) {
                          const parPath = getParPath(route, counter, null, locName)

                          if (parPath.filter(el => el && (typeof el === 'string' || Array.isArray(el))).length < 2) {
                            return;
                          }

                          if (node && parPath) {
                            processParPath(parPath)
                          }
                        }
                    //   }
                    //
                    //   catch (error ){
                    //     console.log('locName: '+locName+'. '+error)
                    //     //throw new Error('locName: '+locName+'. '+error);
                    //   }
                    //

                  }
                );

                featSource?.setFeatures(points, frameRefId)

              //break; // Only the first frame for now! -- filtered by query anyway
            }
            return
      }
,
          registerOptionsUI: (builder, context) => {
            const useMockData = !!context.instanceState?.layer.useMockData
            builder
                .addFieldNamePicker({
                  path: 'parField',
                  name: 'Vertex B',
                  description: 'unique node ID or path as Array<String | [lon, lat]>',
                  settings: {
                    filter: (f: Field) => {
                      return f.type === FieldType.string
                    },
                    noFieldsMessage: 'No string fields found',
                  },
                  showIf: (opts) => opts.type === colTypes.Markers,
                })
                .addFieldNamePicker({
                  path: 'edgeIdField',
                  name: 'Edge ID',
                  description: 'optional. Use for parallel edges',
                  settings: {
                    filter: (f: Field) => {
                      return f.type === FieldType.string
                    },
                    noFieldsMessage: 'No string fields found',
                  },
                  showIf: (opts) => !!opts.parField,
                })
                .addMultiSelect({
                    path: 'searchProperties',
                    name: 'Search by',
                    description: 'extra fields',
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
                }).addNestedOptions({
              category: ['Node Styles'],
              path: 'config.style',
              build: (builder) => {
                builder.addCustomEditor({
                  id: 'arcs',
                  name: 'Arc sections',
                  path: 'arcs',
                  editor: ArcOptionsEditor,
                  showIf: ()=> panel.isLogic
                });
              },
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
                  name: "Arc styles",
                  category: ['Edge Styles'],
                  //description: '',
                  defaultValue: false,
                  showIf: (opts) =>  !!opts.parField || useMockData,
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
                  description: '0 - flat, 1 - max',
                  defaultValue: defaultOptions.arcConfig.height,
                  showIf: (opts) => opts.config.showStat2 && (!!opts.parField || useMockData),
                  settings: {
                    min: 0,
                    max: 1,
                  },
                })
                .addCustomEditor({
                  id: 'config.arcStyle.capacity',
                  category: ['Arc Styles'],
                  path: 'config.arcConfig.capacity',
                  name: 'Capacity',
                  description: 'max value field',
                  editor: CapacityDimensionEditor,
                  settings: {
                    filteredFieldType: FieldType.number,
                  },
                  showIf: (opts) => opts.config.showStat2 && (!!opts.parField || useMockData),
                  defaultValue: defaultOptions.arcConfig.capacity,
                })
                .addBooleanSwitch({
                  path: 'config.style.useGroups',
                  name: 'Apply',
                  category: ['Groups'],
                  defaultValue: defaultOptions.style.useGroups,
                })
                .addCustomEditor({
                 category: ['Groups'],
                 id: 'config.groups',
                 path: 'config.groups',
                 name: 'cluster label, SVG icon, circle color override',
                 editor: GroupsEditor,
                })
          }
                }
      },

  // fill in the default values
  defaultOptions
}

function getParPath(target, id, idx,locName){

  const isArray = Array.isArray(target)

  if (!isArray) {
    if (typeof target === 'string') {
      return [locName, target]
    }
   // console.log('Wrong format: '+toJS(target))
    return []
  }

  const parPath: any = target

  const isInitString = (Array.isArray(parPath) && typeof parPath[0] === 'string') || (!Array.isArray(parPath[0]) && typeof parPath === 'string') // #TODO : better handling for single names like [["U1"],"M1"]
  if (!isInitString) {
    //console.log('Wrong path format: No coords, numbers, nulls allowed as 0 element), no deeper nesting arrays, or empty arrays. Info: id: '+id+' locName: '+locName+' target: '+target)
    return []
  }

  const isSingle = Array.isArray(parPath)? parPath.length===1 : false
   return isSingle? [locName, parPath[0]]: parPath[0] !== locName ? [locName, ...parPath] : parPath as []

 }

function indexFields(frame: DataFrame) {
  const map: Record<string, any[]> = {};

  for (const field of frame.fields) {
    map[field.name] = field.values as any[];
  }

  return map;
}










