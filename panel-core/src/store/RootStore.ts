import type { PanelProps, GrafanaTheme2 } from '@grafana/data';
import type { Graph, GraphEdgeIndex } from '../graph/main';
import type { GraphFrameInstanceState } from '../graph/frame';
import type { Rule } from '../editor';
import type { BiColProps, DeckGLRefWithViewManager, MapLayerState, Options, ViewState } from '../types';
import type { VisLayers } from './VisLayers';
import { PointStore } from './PointStore';
import { ViewStore } from './ViewStore';

export interface StorePanel {
  pId?: number;
  graph: Graph;
  graphEdgeIndex: GraphEdgeIndex;
  graphFrameInstanceState?: GraphFrameInstanceState;
  isLogic: boolean;
  positions: Float64Array;
  features: BiColProps[];
  layers: MapLayerState[];
  groups: Rule[];
  hasAnnots: boolean;
  visLayers?: VisLayers;
  theme2: GrafanaTheme2;
  map?: DeckGLRefWithViewManager;
}

export type StoreProps<TPanel extends StorePanel = StorePanel> = Pick<
  PanelProps<Options>,
  'fieldConfig' | 'replaceVariables' | 'eventBus' | 'data' | 'options'
> & {
  panel: TPanel;
  viewState: ViewState;
};

export class RootStore<TPanel extends StorePanel = StorePanel> {
  panel: TPanel;
  fieldConfig: StoreProps['fieldConfig'];
  replaceVariables: StoreProps['replaceVariables'];
  eventBus: StoreProps['eventBus'];
  data: StoreProps['data'];
  options: Options;
  readonly pointStore: PointStore;
  readonly viewStore: ViewStore;
  private viewStateProp: ViewState;

  constructor(
    props: StoreProps<TPanel>,
    factories: {
      point?: (root: RootStore<TPanel>) => PointStore;
      view?: (root: RootStore<TPanel>, view: ViewState) => ViewStore;
    } = {}
  ) {
    this.panel = props.panel;
    this.fieldConfig = props.fieldConfig;
    this.replaceVariables = props.replaceVariables;
    this.eventBus = props.eventBus;
    this.data = props.data;
    this.options = props.options;
    this.viewStateProp = props.viewState;
    this.viewStore = factories.view?.(this, props.viewState) ?? new ViewStore(this, props.viewState);
    this.pointStore = factories.point?.(this) ?? new PointStore(this);
  }

  get pId() {
    return this.panel.pId;
  }
  get graph() {
    return this.panel.graph;
  }
  get map() {
    return this.panel.map;
  }
  get layers() {
    return this.panel.layers;
  }
  get visLayers() {
    return this.panel.visLayers;
  }
  get theme2() {
    return this.panel.theme2;
  }

  update(props: StoreProps<TPanel>): void {
    this.panel = props.panel;
    this.fieldConfig = props.fieldConfig;
    this.replaceVariables = props.replaceVariables;
    this.eventBus = props.eventBus;
    this.data = props.data;
    this.options = props.options;
    if (props.viewState !== this.viewStateProp) {
      this.viewStateProp = props.viewState;
      this.viewStore.setViewState(props.viewState);
    }
  }

  connect(): void {
    this.pointStore.connect();
  }

  dispose(): void {
    this.pointStore.dispose();
  }
}
