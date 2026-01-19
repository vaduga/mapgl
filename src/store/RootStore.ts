import PointStore from './PointStore';
import ViewStore from './ViewStore';
import {Graph} from 'mapLib';
import {MapLayerState} from "../types";
import {EventBus, FieldConfig, PanelData} from "@grafana/data";
import {Deck} from "@deck.gl/core";
import {GeomapPanel} from "../GeomapPanel";
import type {VisLayers} from "./visLayers";

class RootStore {
  panel: GeomapPanel;
  pId: number;
  auth: any;
  fieldConfig: FieldConfig;
  layers: MapLayerState[];
  subs;
  eventBus: EventBus;
  replaceVariables: any;
  data: PanelData;
  options: any;
  graph: Graph;
  map?: Deck<any>;
  svgIcons: Record<string, {}>;

  pointStore: PointStore;
  viewStore: ViewStore;
  visLayers: VisLayers;
  theme2: any;

  constructor(props) {
    const {pId, auth, layers, subs, graph, map, svgIcons, visLayers, theme2} = props.panel
    this.panel = props.panel;
    this.pId = pId;
    this.auth = auth;
    this.layers = layers;
    this.subs = subs;
    this.eventBus = props.eventBus;
    this.fieldConfig = props.fieldConfig;
    this.replaceVariables = props.replaceVariables
    this.data = props.data
    this.options = props.options
    this.graph = graph;
    this.map = map
    this.svgIcons = svgIcons;
    this.visLayers = visLayers;
    this.theme2 = theme2

    this.viewStore = new ViewStore(this, props.viewState);
    this.pointStore = new PointStore(this);
    this.graph.setRoot(this)
    for (const g of this.graph.graphs()) {
      g.setRoot(this)
    }

  }
}

export default RootStore;
