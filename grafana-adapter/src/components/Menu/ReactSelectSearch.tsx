import React, { FC } from 'react';
import { observer } from 'mobx-react-lite';
import { DataFrame, GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { Combobox, type ComboboxOption, useStyles2 } from '@grafana/ui';
import { Graph, Edge, getGraphNodes, getNodeData } from '@vaduga/mapgl-core/graph/main';
import { colTypes } from '../../types/index';
import type { SelectionRequest } from '@vaduga/mapgl-core/runtime';

type SearchOption = ComboboxOption<string> & { graphId: string; nodeId: string };
type ReactSelectSearchRootStore = {
  pointStore: {
    getSelectedNode?: { id?: string } | null;
  };
};
type MapRefProps = {
  wait?: number;
  selectHandler?: (a: { value: string }) => void | Promise<void>;
  onSelect?: (request: SelectionRequest) => void;
  rootStore: ReactSelectSearchRootStore;
  graph: Graph;
  value?: string;
  placeholder?: string;
  isMainLocSearch?: boolean;
  total?: number;
  options: any;
  data: any;
  subGraph?: Graph;
};

const ReactSelectSearch: FC<MapRefProps> = ({
  data,
  options,
  subGraph,
  selectHandler,
  onSelect,
  rootStore,
  graph,
  wait = 300,
  placeholder = 'Search',
  isMainLocSearch = false,
  ...props
}) => {
  const s = useStyles2(getStyles);
  const { getSelectedNode } = rootStore.pointStore;

  const dataLayers = options.dataLayers;
  const selectOptions: SearchOption[] = [];

  const fillOptions = (currentGraph: Graph) => {
    for (const node of getGraphNodes(currentGraph)) {
      const point = getNodeData(node)?.feature; // skip Graph nodes
      if (!point) {
        continue;
      }

      const locName = node.id;
      const { rowIndex, layerName, frameRefId } = point;

      const layer: any =
        dataLayers?.length && dataLayers.find((el) => el.type === colTypes.Markers && el.name === layerName);
      const searchProps = layer?.optional?.searchProps ?? layer?.searchProperties;
      const frame: DataFrame | undefined = frameRefId
        ? (data.series.find((el) => el.refId === frameRefId || el.name === frameRefId) ?? data.series[0])
        : data.series[0];

      const paneProps = searchProps?.length ? searchProps : [];
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
  const optionsKey = filteredOptions.map((option) => `${option.graphId}:${option.nodeId}`).join('|');

  return (
    <div className={s.select}>
      <Combobox
        // key={optionsKey}
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
          if (selectHandler) {
            void selectHandler({ value: selected.nodeId });
            return;
          }

          onSelect?.({
            nodeId: selected.nodeId,
            namespaceId: selected.graphId,
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
