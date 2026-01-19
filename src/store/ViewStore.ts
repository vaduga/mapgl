import {makeAutoObservable} from 'mobx';
import RootStore from './RootStore';
import {DEFAULT_CLUSTER_MAX_ZOOM, ViewState, ANNOTS_LABEL, ALERTING_STATES} from 'mapLib/utils';
import {VizLegendItem} from "@grafana/ui";


class ViewStore {
  root: RootStore;
  time: number = Date.now();
  forceRefresh = Math.random()+1

  viewState: ViewState

  level = 0

  constructor(root: RootStore, viewState: ViewState) {
    this.root = root;
    this.viewState = viewState

    makeAutoObservable(this);
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

  setVisRefresh = (rnd)=> {
    this.forceRefresh = rnd
  }

  get getTime() {
    return this.time;
  }

  get getGroupsLegend() {

    const t = this.forceRefresh /// #TODO make a proper mobx trigger

    const nodeThres: VizLegendItem[] = []
    if (!this.root.visLayers) {
      return nodeThres
    }

    const {options} = this.root
    const dataLayers = options.dataLayers

  if (dataLayers.length) {

  const {groups, graph} = this.root.panel

    groups.forEach((g, i) => {
      if (g.color) {
        const count = graph.getGroupCounts.get(i) ?? 0
        nodeThres.push({
          color: g.color,
          label: (g.label ?? g.color) + (count ? ' ' + count : ''),
          yAxis: 1,
          disabled: false,
          data: {rawLabel: g.label ?? g.color, groupIdx: g.groupIdx, count},
        })
      }
    })

    //console.log('groups', groups)

    const hasAnnots = this.root.panel.hasAnnots
      if (hasAnnots) {
        const i = groups.length

        nodeThres.push(
            {
              color: ALERTING_STATES.Alerting,
              label: ANNOTS_LABEL,
              yAxis: 1,
              disabled: false,
              data: {rawLabel: ANNOTS_LABEL, groupIdx: i, count: 0},
            }
        )
      }


}

 return nodeThres

  }


}

export default ViewStore;
