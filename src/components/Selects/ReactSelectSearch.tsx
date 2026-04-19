import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { selectGotoHandler, useRootStore } from '../../utils';
import { DataFrame, EventBus, GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { Graph, Edge } from 'mapLib';
import { colTypes } from 'mapLib/utils';
import { ComboboxCompat } from '../Compat/ComboboxCompat';

export type handlerProps = {
  pId: number;
  value: string;
  graphId: string;
  eventBus?: EventBus;
  edge?: Edge;
  coord?: any;
  select: boolean;
  fly: boolean;
  zoomIn?: boolean;
  lineId?: number | null;
};
type SearchOption = SelectableValue<string> & { graphId: string; nodeId: string };
type MapRefProps = {
  wait?: number;
  selectHandler?: (a: Partial<handlerProps>) => Promise<void> | undefined; // custom handler, for drawer
  value?: string;
  placeholder?: string;
  isMainLocSearch?: boolean;
  refreshToken?: number;
  total?: number;
  options: any;
  data: any;
  subGraph?: Graph;
  eventBus?: EventBus;
};

const ReactSelectSearch: FC<MapRefProps> = ({
  data,
  options,
  subGraph,
  selectHandler,
  eventBus,
  wait = 300,
  placeholder = 'Search',
  isMainLocSearch = false,
  refreshToken = 0,
  ...props
}) => {
  const s = useStyles2(getStyles);
  const { pointStore, panel, graph, pId } = useRootStore();
  const { getSelectedNode } = pointStore;

  const dataLayers = options.dataLayers;
  const selectOptions: SearchOption[] = [];

  const fillOptions = (currentGraph: Graph) => {
    for (const node of currentGraph.getNodes) {
      const point = node.data?.feature; // skip Graph nodes
      if (!point) {
        continue;
      }

      const locName = node.id;
      const { rowIndex, layerName, frameRefId } = point;

      const layer: any =
        dataLayers?.length && dataLayers.find((el) => el.type === colTypes.Markers && el.name === layerName);
      const searchProperties = layer?.searchProperties;
      const frame: DataFrame | undefined = frameRefId
        ? data.series.find((el) => el.refId === frameRefId || el.name === frameRefId) ?? data.series[0]
        : data.series[0];

      const paneProps = searchProperties?.length ? searchProperties : [];
      const nameComposite = paneProps
        .map((field) => {
          return frame?.fields?.find((f) => f.name === field)?.values[rowIndex];
        })
        .join(' ');

      const searchValue = `${locName} ${nameComposite}`.trim();
      selectOptions.push({
        label: searchValue,
        value: searchValue,
        graphId: currentGraph.id,
        nodeId: locName,
      });
    }
  };

  if (subGraph && !isMainLocSearch) {
    fillOptions(subGraph);
  } else {
    fillOptions(graph);
    for (const childGraph of graph.subgraphsBreadthFirst()) {
      fillOptions(childGraph);
    }
  }

  const filteredOptions = selectOptions;

  const total2 = filteredOptions?.length;
  const placeholderText = `Search: ${total2}`;
  const locName = isMainLocSearch ? getSelectedNode?.id : undefined;
  const selectedOption = filteredOptions.find((option) => option.nodeId === locName);

  return (
    <div className={s.select}>
      <ComboboxCompat
        key={refreshToken}
        options={filteredOptions}
        value={selectedOption}
        width="auto"
        minWidth={10}
        placeholder={placeholderText}
        onChange={(v) => {
          if (!v) {
            return;
          }

          const selected = v as SearchOption;
          selectHandler
            ? selectHandler({ value: selected.nodeId })
            : selectGotoHandler({
                pId,
                value: selected.nodeId,
                eventBus,
                graphId: selected.graphId,
                select: true,
                fly: true,
                zoomIn: true,
              });
        }}
        // prefix={getPrefix(args.icon)}
      />
    </div>
  );
};

export default observer(ReactSelectSearch);

const getStyles = (theme2: GrafanaTheme2) => ({
  select: css({
    isolation: 'isolate',
    zIndex: theme2.zIndex.typeahead,
    // & * {
    //     zIndex: 2147483647; /* or 10 if you want to explicitly set it */
    // }
  }),
});
