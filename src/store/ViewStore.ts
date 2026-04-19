import { makeAutoObservable } from 'mobx';
import RootStore from './RootStore';
import { DEFAULT_CLUSTER_MAX_ZOOM, ViewState, ANNOTS_LABEL, ALERTING_STATES } from 'mapLib/utils';
import { VizLegendItem } from '@grafana/ui';

class ViewStore {
  root: RootStore;
  time: number = Date.now();

  viewState: ViewState;

  level = 0;

  constructor(root: RootStore, viewState: ViewState) {
    this.root = root;
    this.viewState = viewState;

    makeAutoObservable(this, {
     root: false,
    });
    //autorun(() => console.log('getVisLayers', toJS(this.getVisLayers)));
    //autorun(() => console.log('getGroupsLegend', toJS(this.getGroupsLegend)));
    //makeObservable(this, {forceRefresh: observable, setVisRefresh: action, getVisRefresh: computed, getVisLayers: computed, getGroupsLegend: computed}, { autoBind: true })//, { autoBind: true })
  }

  get getViewState() {
    return this.viewState;
  }

  setViewState = (viewState) => {
    this.viewState = viewState;
  };

  get getTime() {
    return this.time;
  }

  get getGroupsLegend() {
    const nodeThres: VizLegendItem[] = [];
    const { graph, groups, hasAnnots, visLayers } = this.root;

    if (!visLayers) {
      return nodeThres;
    }

    let active_indexes = visLayers.getActiveGroups();

    if (groups.length || hasAnnots) {
      groups.forEach((g, i) => {
        if (g.color) {
          const count = graph.getGroupCounts.get(i) ?? 0;
          nodeThres.push({
            color: g.color,
            label: (g.label ?? g.color) + (count ? ' ' + count : ''),
            yAxis: 1,
            disabled: !active_indexes[i], //getGroupsLegend?.find(el => el.data?.rawLabel === g.label)?.disabled ??
            data: { rawLabel: g.label ?? g.color, groupIdx: g.groupIdx, count },
          });
        }
      });

      //console.log('groups', groups)

      if (hasAnnots) {
        const i = groups.length;

        nodeThres.push({
          color: ALERTING_STATES.Alerting,
          label: ANNOTS_LABEL,
          yAxis: 1,
          disabled: !active_indexes[i],
          data: { rawLabel: ANNOTS_LABEL, groupIdx: i, count: 0 },
        });
      }
    }

    return nodeThres;
  }
}

export default ViewStore;
