import React from 'react';
import {selectGotoHandler, toRgbaString, useRootStore} from '../../utils';
import {css} from "@emotion/css";
import {IconButton, SeriesIcon, useStyles2, useTheme2, VizTooltipContainer} from "@grafana/ui";
import {DataFrame, Field, FieldType, GrafanaTheme2} from "@grafana/data";
import {BiColProps, colTypes} from "mapLib/utils";
import {DataHoverView} from "./DataHoverView";
import {SortOrder, TooltipDisplayMode} from "@grafana/schema";

import {Node, Edge} from "mapLib";

const includes = ['ack', 'msg', 'all_annots', 'liveUpd'] //liveStat

const Tooltip = ({ data, panel, info, eventBus, setHoverInfo, time, timeZone, isClosed = false, isHyper, dataLayers}) => {
    if (!info || !Object.entries(info).length) {
        return null
    }

  const s = useStyles2(getStyles);
  const { pointStore, pId} = useRootStore();
  const theme = useTheme2();
  const { getTooltipObject, setTooltipObject } = pointStore;

    let { x, y, object, coordinate, featureType, index, layer: deckLayer} = info;

    let props = object?.properties ?? object
    let rowIndex


if (!x && !y && !coordinate) return

        const points = deckLayer?.props.data.points
        if (points && (featureType === 'points' || info.viewport?.id === '3d-scene') && index !== -1)  {
            const featureIds = points.featureIds
            const features = panel.features
            const idx = featureIds?.value[index]

            props = (features as BiColProps[])[idx]
            rowIndex = props?.rowIndex
        }

        let pinned = false
        if (!props || index === -1) {
            if (isClosed) return null;
            ({ x, y, object } = getTooltipObject) // pinned object
            if (!x && !y) return;
            props = object.properties
            pinned = true
        }

        const {edgeId} = object || {}

        rowIndex = rowIndex ?? object?.rowIndex ?? object?.properties?.rowIndex //?? featureIds?.value?.[index];  // pinned && lines && other collections ?? binary nodes row index

        const layerProps = info.layer?.props
        const {frameRefId, locName, layerName, root: graph} = props || {}
        const edge: Edge = graph?.nodeCollection?.getEdgesMap[edgeId]
        const eNode = edge?.['source']
        const findNode = graph?.findNode
        const pickedNode: Node = eNode ?? findNode?.(locName)
        const pickedFeature = pickedNode?.data.feature

        const layer: any = dataLayers.length && layerName && dataLayers.find(l=> l.name === layerName)
        const isShowTooltip = layer?.isShowTooltip ?? layerProps?.isShowTooltip ?? true
        if (!isShowTooltip) {return null}

        const DP = layer?.displayProperties ?? layerProps?.displayProperties
        const baseProps = includes
        let displayProps = (DP?.length) ? DP.concat(baseProps) : baseProps

        const isComment = props['isComment']
        if (isComment) {
        displayProps = [...displayProps, 'text']
        }

        props.parents = edge ? [edge] : [];

        /// geojson static or comment icon entries
        const entries = isComment ? Object.entries(props) : (props['geoJsonProps'] && Object.entries(props['geoJsonProps']))
        const hoverPayload: any = {
        mode: TooltipDisplayMode.Single,
        sortOrder:  SortOrder.None,
        time,
        displayProps,
        baseProps
        }

    const frame: DataFrame | undefined =  frameRefId
            ? data.series.find(el => el.refId === frameRefId || el.name === frameRefId) ?? data.series[0]
            : data.series[0];

        if (frame) {
            hoverPayload.data = frame;
            hoverPayload.rowIndex = rowIndex
            hoverPayload.columnIndex = frame.fields.findIndex(v=> ['edgesArcsBase', colTypes.Edges, colTypes.Edges+'fallback'].includes(info?.layer?.id) ? v.name === layer?.edgeIdField : v.name === layer?.locField)
            const all_annots = props?.all_annots ?? pickedFeature?.all_annots
            hoverPayload.all_annots = all_annots //root ? filteredProps.all_annots : all_annots // point vs line
        }
        /// geojson static entries & comments
        if (Array.isArray(entries)) {
            const frame: any = {fields: []}
            entries.forEach(([key,value]) => {
                frame.fields.push({name: key, values: [value], type: FieldType.string, config: {description: isComment ? 'CommentField' : 'GeoJson'}})
            })
            hoverPayload.data = frame;
            hoverPayload.rowIndex = 0 /// must be passed
        }

            const extraFields: Field[] = []

            baseProps.forEach(name => {
                if (name === 'all_annots') {
                    return
                }
                const value = props[name]
                if (value !== undefined) {
                    extraFields.push({name, values: [value], type: FieldType.string, config: {}})
                }
            })

            hoverPayload.extraFields = extraFields

    const  ConnectedEdges = ()=> {
        const genLi = (node, edge: Edge, i?) => {
            const dataRecord = edge.data?.dataRecord
            const arcStyle = dataRecord?.arcStyle
            const {sideB, sideA} = arcStyle || {}
            const aField = sideA?.colorField
            const bField = sideB?.colorField
            const edgeId = edge.data?.edgeId

            //&& parent === getSelectedNode --- would need pinned tooltip rerender
            return <li key={edgeId}>
                <div style={{display: 'flex', alignItems: 'center', backgroundColor: undefined}}>
                    <a onClick={() => {
                        selectGotoHandler({pId, value: node?.id, edge, eventBus, graphId: graph.id, select: true})
                        setTooltipObject({...getTooltipObject, object: {
                                edgeId: object.edgeId,
                                properties:
                                    {
                                        ...dataRecord,
                                        locName: props.locName,
                                        inEdges: props.inEdges,
                                        outEdges: props.outEdges
                                    }
                            }})
                    }
                    }
                       style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                        <span>{edgeId}</span>
                        <div style={{marginLeft: '4px', display: 'flex'}}>
                            {sideA?.color && <SeriesIcon title={aField} color={toRgbaString(sideA.color)}/>}
                            {sideB?.color && <SeriesIcon title={bField} color={toRgbaString(sideB.color)}/>}
                        </div>
                    </a>
                </div>
            </li>
        }

        const {parents}= props
        const adjacentEdges = parents?.map((e,i) => genLi(pickedNode, e, parents?.length>1 && i))


        return (
            <>
                <ul style={{listStyle: 'none'}}>
                    {props.locName && <li key="locName">
                        {pinned && <><IconButton
                            key="closeHint"
                            variant="destructive"
                            name="x"
                            size='sm'
                            tooltip={'close'}
                            tooltipPlacement='left'
                            onClick={() => {
                                setTooltipObject({})
                                setHoverInfo({})
                            }}
                        />
                        </>
                        }

                        {/*{'name: '}*/}
                        {!eNode && props.locName}

                    </li>}

                    {adjacentEdges.length === 1 && adjacentEdges}

                </ul>
            </>
        );
    }

    return (
            /// onClick={() => setHoverInfo({})}
                <VizTooltipContainer
                    className={s.viz}
                    allowPointerEvents={pinned}
                    position={{ x,  y }}
                    offset={{ x: 10, y: 10 }}
                    >
                {<ConnectedEdges/>}
                <DataHoverView {...hoverPayload}/>
                </VizTooltipContainer>
        );
              };
              export {Tooltip};


        const getStyles = (theme: GrafanaTheme2) => ({
              viz: css`
                  isolation: isolate;
                  z-index: 1000 !important;
              borderRadius: "10px";
                  ul {
                      list-style-type: none }
            `,
              fab: css`                  
                  margin-left: 5px;
        //transform: scale(0.8);
        //position: absolute;
        //zIndex: 1;
        //top: 0;
        //left: 0;
        //right: 0;
        //margin: 0 auto;
              `
          });
