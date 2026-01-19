import React, {FC} from 'react';
import { observer } from 'mobx-react-lite';
import {selectGotoHandler, useRootStore} from '../../utils';
import {DataFrame, EventBus, GrafanaTheme2} from "@grafana/data";
import {css} from "@emotion/css";
import {Select, useStyles2} from "@grafana/ui";
import {Graph, Edge} from 'mapLib'
import {colTypes} from 'mapLib/utils'

export type handlerProps = { pId: number, value: string, graphId: string, eventBus?: EventBus, edge?: Edge, coord?: any, select: boolean, fly: boolean, zoomIn?: boolean, lineId?: number | null }
type MapRefProps = {
  wait?: number;
    selectHandler?: (a: Partial<handlerProps>) => Promise<void> | undefined; // custom handler, for drawer
    value?: string;
    placeholder?: string;
    isMainLocSearch?: boolean;
    total?: number;
    options: any;
    data: any;
    subGraph?: Graph;
    eventBus?: EventBus;
};

const ReactSelectSearch: FC<MapRefProps> = ({ data, options, subGraph, selectHandler, eventBus, wait = 300, placeholder ='Search', isMainLocSearch = false,
                                              ...props
                                            }) => {
  const s = useStyles2(getStyles);
  const { pointStore, panel, graph, pId} = useRootStore();
  const { getSelectedNode} =   pointStore;

  const dataLayers = options.dataLayers;
  const selectOptions: any = []

    const fillOptions: any = (subGraph)=> {
        for (const node of subGraph.getNodes) {
            const point = node.data?.feature // skip Graph nodes
            if (!point) {continue}
            const locName = node.id
            const {rowIndex, layerName, frameRefId} = point

            const layer: any = dataLayers?.length && dataLayers.find(el=> el.type === colTypes.Markers && el.name === layerName)
            const searchProperties = layer?.searchProperties
            const frame: DataFrame | undefined =  frameRefId
                ? data.series.find(el => el.refId === frameRefId || el.name === frameRefId) ?? data.series[0]
                : data.series[0];

            const SP = searchProperties //[searchProperties].filter(el=>el?.length).reduce((acc,cur)=> acc.concat(cur), [])
            const paneProps = SP && SP.length ? SP : []
            const nameComposite = paneProps.map(field=> {
                return frame?.fields?.find(f=>f.name === field)?.values[rowIndex]
            }).join(' ')

            const option = {
                label: `${locName} ${nameComposite}`,
                value: locName,
                graph: subGraph,
                //color: point.properties.iconColor,
            };

            selectOptions.push(option)
        }
    }
    if (subGraph && !isMainLocSearch) {
        fillOptions(subGraph)
    } else {
            fillOptions(graph)
        for (const subGraph of graph.subgraphsBreadthFirst()) {
            fillOptions(subGraph)
        }
    }


  const filteredOptions = selectOptions

    const total2 = filteredOptions?.length
    const placeholderText = `Search: ${total2}`;
   const locName = isMainLocSearch ? getSelectedNode?.id : undefined

    const isLogic = panel.isLogic;

    return (
      <Select
          className={s.select}
      virtualized
      options={filteredOptions}
      isSearchable={true}
      //defaultOptions={filteredOptions}
      value={locName}
      placeholder={placeholderText}
      onChange={(v)=> {
          selectHandler ? selectHandler({value: v.value}) : selectGotoHandler({pId, value: v.value, eventBus, graphId: v.graph.id, select: true, fly: true, zoomIn: true})
      }}
         // prefix={getPrefix(args.icon)}
        />
  );
};

export default observer(ReactSelectSearch);


const getStyles = (theme2: GrafanaTheme2) => ({
  select: css`
  isolation: isolate;    
  z-index: 2147483647;
      & * {
          z-index: 2147483647; /* or 10 if you want to explicitly set it */
      }
  `
})
