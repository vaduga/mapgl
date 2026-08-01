import PointStore from './PointStore';
import ViewStore from './ViewStore';
import { Graph } from '@mapgl/panel-core/graph';
import { type DeckGLRefWithViewManager, MapLayerState, type ViewState } from '@mapgl/panel-core/types';
import { EventBus, FieldConfig, PanelData } from '@grafana/data';
import { MapPanel } from '../MapPanel';
import type { VisLayers } from '@mapgl/panel-core/store';

class RootStore {
  panel!: MapPanel;
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
  map?: DeckGLRefWithViewManager;

  pointStore: PointStore;
  viewStore: ViewStore;
  visLayers!: VisLayers;
  theme2: any;
  private viewStateProp: ViewState;

  constructor(props) {
    this.viewStateProp = props.viewState;
    this.assignProps(props);
    this.viewStore = new ViewStore(this, props.viewState);
    this.pointStore = new PointStore(this);
  }

  update(props) {
    this.assignProps(props);
    if (props.viewState !== this.viewStateProp) {
      this.viewStateProp = props.viewState;
      this.viewStore.setViewState(props.viewState);
    }
  }

  private assignProps(props) {
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
  }
}

export default RootStore;
