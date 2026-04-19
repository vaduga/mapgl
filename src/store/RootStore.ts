import PointStore from './PointStore';
import ViewStore from './ViewStore';
import { Graph } from 'mapLib';
import { MapLayerState } from '../types';
import { EventBus, FieldConfig, PanelData } from '@grafana/data';
import { Deck } from '@deck.gl/core';
import { makeObservable, observable } from 'mobx';
import { GeomapPanel } from '../GeomapPanel';
import type { Rule } from '../editor/Groups/rule-types';
import type { VisLayers } from './visLayers';

class RootStore {
  panel!: GeomapPanel;
  pId!: number;
  auth: any;
  fieldConfig!: FieldConfig;
  layers!: MapLayerState[];
  subs: any;
  eventBus!: EventBus;
  replaceVariables: any;
  data!: PanelData;
  options: any;
  graph!: Graph;
  map?: Deck<any>;
  svgIcons!: Record<string, {}>;

  pointStore!: PointStore;
  viewStore!: ViewStore;
  groups: Rule[] = [];
  visLayers!: VisLayers;
  hasAnnots = false;
  theme2: any;

  constructor(props) {
    makeObservable(this, {
      groups: observable.ref,
      visLayers: observable.ref,
      hasAnnots: observable.ref,
    });

    this.syncFromProps(props);
    this.viewStore = new ViewStore(this, props.viewState);
    this.pointStore = new PointStore(this);
    this.graph.setRoot(this);
    for (const g of this.graph.graphs()) {
      g.setRoot(this);
    }
  }

  syncFromProps(props) {
    const { pId, auth, layers, subs, graph, map, svgIcons, visLayers, theme2 } = props.panel;
    this.panel = props.panel;
    this.pId = pId;
    this.auth = auth;
    this.layers = layers;
    this.subs = subs;
    this.eventBus = props.eventBus;
    this.fieldConfig = props.fieldConfig;
    this.replaceVariables = props.replaceVariables;
    this.data = props.data;
    this.options = props.options;
    this.graph = graph;
    this.map = map;
    this.svgIcons = svgIcons;
    this.groups = props.panel.groups;
    this.visLayers = visLayers;
    this.hasAnnots = props.panel.hasAnnots;
    this.theme2 = theme2;
    this.graph.setRoot(this);
    for (const g of this.graph.graphs()) {
      g.setRoot(this);
    }

    if (this.viewStore) {
      this.viewStore.root = this;
      this.viewStore.setViewState(props.viewState);
    }
  }

  dispose() {
    this.pointStore?.dispose();
  }
}

export default RootStore;
