import { makeAutoObservable } from 'mobx';
import type { RootStore } from './RootStore';
import { ANNOTS_LABEL, ALERTING_STATES } from '@mapgl/panel-core/types/defaults';
import type { ViewState } from '@mapgl/panel-core/types';
import { VizLegendItem } from '@grafana/ui';
import { getNodeGroupsWithNodes } from '@mapgl/panel-core/graph';

export class ViewStore {
  root: RootStore;
  time: number = Date.now();
  forceRefresh = Math.random() + 1;

  viewState: ViewState;
  clusterMaxZoom: number;

  constructor(
    root: RootStore,
    viewState: ViewState,
    private readonly resolveClusterMaxZoom: () => number = () => 18
  ) {
    this.root = root;
    this.viewState = viewState;
    this.clusterMaxZoom = this.resolveClusterMaxZoom();

    makeAutoObservable(this, { root: false, resolveClusterMaxZoom: false, getGroupsLegend: false } as any);
    //autorun(() => console.log('getVisLayers', toJS(this.getVisLayers)));
    //autorun(() => console.log('getGroupsLegend', toJS(this.getGroupsLegend)));
    //makeObservable(this, {forceRefresh: observable, setVisRefresh: action, getVisRefresh: computed, getVisLayers: computed, getGroupsLegend: computed}, { autoBind: true })//, { autoBind: true })
  }

  get getClusterMaxZoom() {
    return this.clusterMaxZoom;
  }

  get getViewState() {
    return this.viewState;
  }

  setViewState = (viewState) => {
    this.viewState = viewState;
  };

  setClusterMaxZoom = (maxZoom: number) => {
    this.clusterMaxZoom = maxZoom;
  };

  syncClusterMaxZoom = () => {
    this.clusterMaxZoom = this.resolveClusterMaxZoom();
  };

  setVisRefresh = (rnd) => {
    this.forceRefresh = rnd;
  };

  get getTime() {
    return this.time;
  }

  get getGroupsLegend() {
    const t = this.forceRefresh; /// #TODO make a proper mobx trigger

    const nodeThres: VizLegendItem[] = [];
    if (!this.root.visLayers) {
      return nodeThres;
    }

    let active_indexes = this.root.visLayers.getActiveGroups();

    const { options } = this.root;
    const dataLayers = options.dataLayers;

    if (dataLayers.length) {
      const { groups, graph } = this.root.panel;
      const nodeGroupsWithNodes = getNodeGroupsWithNodes(graph);
      groups.forEach((g, i) => {
        if (g.color) {
          const groupIdx = g.groupIdx ?? i;
          nodeThres.push({
            color: g.color,
            label: g.label ?? g.color,
            yAxis: 1,
            disabled: !active_indexes[groupIdx], //getGroupsLegend?.find(el => el.data?.rawLabel === g.label)?.disabled ??
            data: { rawLabel: g.label ?? g.color, groupIdx, hasNodes: nodeGroupsWithNodes.has(groupIdx) },
          });
        }
      });

      //console.log('groups', groups)

      const hasAnnots = this.root.panel.hasAnnots;
      if (hasAnnots) {
        const i = groups.length;

        nodeThres.push({
          color: ALERTING_STATES.Alerting,
          label: ANNOTS_LABEL,
          yAxis: 1,
          disabled: !active_indexes[i],
          data: { rawLabel: ANNOTS_LABEL, groupIdx: i, hasNodes: false },
        });
      }
    }

    return nodeThres;
  }
}

export default ViewStore;
