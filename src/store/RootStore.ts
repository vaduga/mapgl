import PointStore from './PointStore';
import ViewStore from './ViewStore';
import { Graph } from 'mapLib';
import { type DeckGLRefWithViewManager, MapLayerState } from '../types';
import { EventBus, FieldConfig, PanelData } from '@grafana/data';
import { MapPanel } from '../MapPanel';
import type { VisLayers } from './visLayers';

class RootStore {
  panel: MapPanel;
  pId: number;
  auth: any;
  fieldConfig: FieldConfig;
  layers: MapLayerState[];
  subs: any;
  eventBus: EventBus;
  replaceVariables: any;
  data: PanelData;
  options: any;
  graph: Graph;
  map?: DeckGLRefWithViewManager;

  pointStore: PointStore;
  viewStore: ViewStore;
  visLayers: VisLayers;
  theme2: any;

  constructor(props) {
    const { pId, auth, layers, subs, graph, map, visLayers, theme2 } = props.panel;
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
    this.visLayers = visLayers;
    this.theme2 = theme2;

    this.viewStore = new ViewStore(this, props.viewState);
    this.pointStore = new PointStore(this);
  }
}

export default RootStore;
