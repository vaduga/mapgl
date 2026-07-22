import * as React from 'react';
import { Component } from 'react';
import { Subscription } from 'rxjs';
import { GrafanaTheme2, PanelData, PanelProps } from '@grafana/data';
import { config } from '@grafana/runtime';
import { PanelContext, PanelContextProvider, PanelContextRoot } from '@grafana/ui';
import { Options, MapLayerState, MapViewConfig, type DeckGLRefWithViewManager } from '@mapgl/panel-core/types';
import { defViewState, CMN_NAMESPACE } from '@mapgl/panel-core/types/defaults';
import { captureLayoutCache, restoreLayoutCache, scheduleLayout } from '@mapgl/panel-core/graph/utils';
import type {
  ViewState,
  BiColProps,
  LayoutArrowTips,
  LayoutCache,
  LayoutCurveGroup,
  LayoutGraphResult,
  LayerDragShift,
} from '@mapgl/panel-core/types';
import { notifyPanelEditor } from '@mapgl/panel-core/utils/geomap_utils';
import {
  getActions,
  applyLayerFilter,
  initLayer,
  RootStoreProvider,
  fillAnnots,
  initGroups,
  genVisLayers,
  initBinaryProps,
  cutBinaryProps,
  SvgIconManager,
  MapglRuntimeUpdateEvent,
  RefreshController,
  LatestAsyncGate,
  normalizeOptions,
  persistFreshPanelOptions,
} from '@mapgl/panel-core/utils';
import RootStore from './store/RootStore';
import Mapgl from './components/Mapgl';
import { mapLayerRegistry, ORTHO_BASEMAP_CONFIG } from './layers/registry';
import { Graph, GraphEdgeIndex, bumpGraphVersion, resetGraph, resetGraphNodes } from '@mapgl/panel-core/graph';
import {
  getMapglFeatureServices,
  RuntimeSubscriptionController,
  type RuntimeSubscriptionContext,
  type RuntimeUpdateEvent,
} from '@mapgl/panel-core/featureContracts';

import { initViewExtent } from './utils/utils.map';

type Props = PanelProps<Options>;

interface State {
  viewState: ViewState;
  source: string | {} | undefined;
}

import { Rule } from '@mapgl/panel-core/editor';
import { VisLayers } from '@mapgl/panel-core/store';

export class MapPanel extends Component<Props, State> {
  private readonly panelUpdateGate = new LatestAsyncGate();
  private readonly optionsRefresh = new RefreshController({
    delayMs: 150,
    isBlocked: () => !this.map || this.layoutInProgress,
    refresh: () => this.dataChanged(this.props.data),
  });
  declare context: React.ContextType<typeof PanelContextRoot>;
  static contextType = PanelContextRoot;
  panelContext: PanelContext | undefined;
  private subs = new Subscription();
  private runtimeSubscriptions = new RuntimeSubscriptionController(
    getMapglFeatureServices().runtimeSubscriptionProviders
  );

  pId: number | undefined;
  graph: Graph;
  graphEdgeIndex = new GraphEdgeIndex();
  vCount = 0;
  visLayers: VisLayers | undefined;
  map?: DeckGLRefWithViewManager | undefined;
  layers: MapLayerState[] = [];
  locLabelName;
  annotations;
  readonly svgIconManager = new SvgIconManager();
  isLogic = true;
  hasAnnots = false;
  useMockData;
  groups: Rule[] = [];
  layoutReady = false;
  layoutGraphBounds = new Map<string, LayoutGraphResult>();
  layoutCurveGroups = new Map<string, LayoutCurveGroup>();
  layoutEdgeIndexes = new Map<string, number>();
  layoutEdgeKeys: string[] = [];
  layoutArrowTips = new Map<string, LayoutArrowTips>();
  layoutDisplayReady = false;
  layoutInProgress = false;

  features: BiColProps[] = [];
  positions: Float64Array = new Float64Array();
  layerShift: LayerDragShift = {};
  muted = new Uint8Array();
  colors = new Uint8Array();
  annots = new Uint8Array();
  groupIndices = new Uint8Array();

  theme2: GrafanaTheme2 = config.theme2;
  readonly byName = new Map<string, MapLayerState>();
  readonly mapLayerRegistry = mapLayerRegistry;
  readonly orthoBasemapConfig = ORTHO_BASEMAP_CONFIG;

  private get normalizedOptions(): Options {
    return normalizeOptions(this.props.options);
  }

  private get normalizedProps(): Props {
    return {
      ...this.props,
      options: this.normalizedOptions,
    };
  }

  get svgIconState() {
    return this.svgIconManager.state;
  }

  constructor(props: Props) {
    super(props);
    const options = normalizeOptions(props.options);
    const { locLabelName } = options.common || {};

    this.pId = props.id;
    this.isLogic = isLogicBasemap(options.basemap);
    this.hasAnnots = !!props.data.annotations?.length;

    const firstRun = !options.dataLayers.length;
    this.useMockData = this.isLogic && (firstRun || options.dataLayers.every((el) => !el.locField));

    const rootGraph = new Graph(CMN_NAMESPACE);
    this.graph = rootGraph;
    this.visLayers = new VisLayers();

    this.locLabelName = locLabelName;
    this.state = {
      source: undefined,
      viewState: defViewState,
    };

    this.panelContext = {
      onToggleSeriesVisibility: undefined,
      onSeriesColorChange: (v, c) => {
        const newOptions = { ...this.normalizedOptions };
        const newFieldConfig = { ...this.props.fieldConfig };
        const steps = newFieldConfig.defaults.thresholds?.steps;
        steps?.forEach((t) => {
          const label = v === '-Inf' ? -Infinity : v;
          if (t.value === label) {
            const color = this.theme2.visualization.getColorByName(c);
            if (color) {
              t.color = color; //hexToRgba(color);
            }
          }
        });
        this.props.eventBus?.publish({
          type: 'edgeThresholdType',
          payload: { thresholds: steps },
        });
        this.props.onOptionsChange(newOptions);
        this.props.onFieldConfigChange(newFieldConfig);
      },
      graph: this.graph,
    } as unknown as PanelContext;
  }

  async componentDidMount() {
    this.panelContext = { ...this.context, ...this.panelContext };
    persistFreshPanelOptions(this.props.options, this.props.onOptionsChange);
  }

  componentWillUnmount() {
    this.panelUpdateGate.dispose();
    this.optionsRefresh.cancel();
    this.svgIconManager.abort();
    resetGraph(this.graph);
    this.graphEdgeIndex.reset();
    this.vCount = 0;
    for (const g of this.graph.graphs()) {
      resetGraph(g);
    }
    this.map = undefined;
    this.layers = [];
    this.byName.clear();
    this.runtimeSubscriptions.dispose();
    this.subs.unsubscribe();
  }

  componentDidUpdate(prevProps: Props) {
    if (!this.map) {
      return;
    }

    const dataChanged = this.props.data !== prevProps.data;
    if (dataChanged) {
      void this.dataChanged(this.props.data);
    }

    if (this.props.options !== prevProps.options) {
      this.optionsChanged(this.normalizedOptions, normalizeOptions(prevProps.options), dataChanged);
    }
  }

  /** This function will actually update the JSON model */
  doOptionsUpdate = async (selected: number) => {
    const { onOptionsChange } = this.props;
    const options = this.normalizedOptions;

    const layers = this.layers;
    this.isLogic = isLogicBasemap(layers[0]?.options);
    onOptionsChange({
      ...options,
      basemap: layers[0].options,
      dataLayers: layers.slice(1).map((v) => v.options),
    } as Options);

    if (this.isLogic) {
      this.optionsRefresh.schedule();
    } else {
      void this.dataChanged(this.props.data);
    }
    notifyPanelEditor(this, layers, selected);
  };

  actions = getActions(this);

  /**
   * Called when the panel options change
   *
   * NOTE: changes to basemap and layers are handled independently
   */
  optionsChanged(options: Options, oldOptions: Options, dataAlreadyChanged = false) {
    this.isLogic = isLogicBasemap(options.basemap);

    if (options.view !== oldOptions.view) {
      const viewState = this.initMapView(options.view);
      if (viewState) {
        if (this.isLogic) {
          viewState.rotationX = -90;
        }
        this.setState({ viewState });
      }
    }

    if (
      !dataAlreadyChanged &&
      options.basemap?.type === ORTHO_BASEMAP_CONFIG.type &&
      options.basemap.config !== oldOptions.basemap?.config
    ) {
      this.optionsRefresh.schedule();
    }
  }

  /**
   * Called when PanelData changes (query results etc)
   */
  dataChanged = async (data: PanelData) => {
    this.optionsRefresh.cancel();

    await this.panelUpdateGate.run(async (isCurrent) => {
      // Only update if panel data matches component data
      if (data !== this.props.data || !isCurrent()) {
        return;
      }

      this.groups = [];
      this.features = [];
      let svgIconState;
      try {
        const svgGroups = initGroups(this.groups, this.layers, this.theme2, true);
        svgIconState = await this.svgIconManager.resolve({
          requiredIconNames: svgGroups.requiredIconNames,
          signature: svgGroups.svgSignature,
        });
      } catch (ex: any) {
        console.error('error loading SVG icons', ex);
        return;
      }
      if (!svgIconState || !isCurrent()) {
        return;
      }

      if (this.locLabelName) {
        const annotations = await fillAnnots(this.locLabelName, data.annotations);
        if (!isCurrent()) {
          return;
        }
        this.annotations = annotations;
      }

      if (!this.layers.length) {
        return;
      }
      const layoutCache: LayoutCache | undefined =
        this.isLogic && this.layoutDisplayReady ? captureLayoutCache(this) : undefined;
      for (const g of this.graph.graphs()) {
        resetGraphNodes(g);
      }

      resetGraph(this.graph);
      this.graphEdgeIndex.reset();
      this.vCount = 0;
      initBinaryProps(this);

      const d = { ...this.props.data };
      this.layers.forEach((state) => applyLayerFilter(state.handler, state.options, d, true));
      cutBinaryProps(this);

      this.layers.forEach((state) => applyLayerFilter(state.handler, state.options, d, false));

      if (this.isLogic) {
        this.layoutReady = false;
        this.layoutDisplayReady = restoreLayoutCache(layoutCache, this);
        if (!this.layoutDisplayReady) {
          this.layoutGraphBounds.clear();
          this.layoutCurveGroups.clear();
          this.layoutEdgeIndexes.clear();
          this.layoutEdgeKeys = [];
          this.layoutArrowTips.clear();
        }
      }

      this.visLayers = genVisLayers(this, this.normalizedProps);

      if (this.isLogic) {
        bumpGraphVersion(this.graph);
        this.layoutInProgress = scheduleLayout(this, this.onLayoutApplied);
      }

      if (!isCurrent()) {
        return;
      }

      const viewState = this.initMapView(this.normalizedOptions.view);
      if (viewState) {
        if (this.isLogic) {
          viewState.rotationX = -90;
        }
        this.setState({ viewState });
      }
      this.runtimeSubscriptions.onDataChange(this.getRuntimeSubscriptionContext(data));
    });
  };

  initMapRef = async (deckRef) => {
    await this.panelUpdateGate.run(async (isCurrent) => {
      if (this.locLabelName) {
        const annotations = await fillAnnots(this.locLabelName, this.props.data.annotations);
        if (!isCurrent()) {
          return;
        }
        this.annotations = annotations;
      }

      const options = this.normalizedOptions;
      this.byName.clear();
      const layers: MapLayerState[] = [];
      const layoutCache: LayoutCache | undefined =
        this.isLogic && this.layoutDisplayReady ? captureLayoutCache(this) : undefined;
      for (const g of this.graph.graphs()) {
        resetGraphNodes(g);
      }
      resetGraph(this.graph);
      this.graphEdgeIndex.reset();
      this.vCount = 0;
      initBinaryProps(this);

      try {
        const baseLayer = await initLayer(this, options.basemap ?? ORTHO_BASEMAP_CONFIG, true);
        if (!isCurrent()) {
          return;
        }
        layers.push(baseLayer);

        let layerIdx = 0;
        for (const lyr of options.dataLayers) {
          const layerState = await initLayer(this, { ...lyr }, false, layerIdx);
          if (!isCurrent()) {
            return;
          }
          layers.push(layerState);
          layerIdx++;
        }

        const d = { ...this.props.data };
        layers.forEach((state) => applyLayerFilter(state.handler, state.options, d, true));
        cutBinaryProps(this);

        this.groups = [];
        this.features = [];
        const svgGroups = initGroups(this.groups, layers, this.theme2);
        const svgIconState = await this.svgIconManager.resolve({
          requiredIconNames: svgGroups.requiredIconNames,
          signature: svgGroups.svgSignature,
        });
        if (!svgIconState || !isCurrent()) {
          return;
        }

        layers.forEach((state) => applyLayerFilter(state.handler, state.options, d, false));

        this.layers = layers;

        if (this.isLogic) {
          this.layoutReady = false;
          this.layoutDisplayReady = restoreLayoutCache(layoutCache, this);
          if (!this.layoutDisplayReady) {
            this.layoutGraphBounds.clear();
            this.layoutCurveGroups.clear();
            this.layoutEdgeIndexes.clear();
            this.layoutEdgeKeys = [];
            this.layoutArrowTips.clear();
          }
        }

        this.visLayers = genVisLayers(this, this.normalizedProps);

        if (this.isLogic) {
          bumpGraphVersion(this.graph);
          this.layoutInProgress = scheduleLayout(this, this.onLayoutApplied);
        }

        const viewState = this.initMapView(options.view);
        if (viewState) {
          this.map = deckRef.current;
          if (this.isLogic) {
            viewState.rotationX = -90;
          }
          if (!isCurrent()) {
            return;
          }
          this.setState({ viewState });
        }

        if (!isCurrent()) {
          return;
        }

        notifyPanelEditor(this, layers, layers.length - 1);
        void this.runtimeSubscriptions.start(this.getRuntimeSubscriptionContext());
      } catch (ex) {
        if ((ex as any)?.name === 'AbortError') {
          return;
        }
        console.error('error loading layers', ex);
      }
    });
  };

  onLayoutApplied = (applied = true) => {
    this.layoutInProgress = false;
    if (!applied) {
      bumpGraphVersion(this.graph);
    } else {
      this.layoutReady = true;
      this.layoutDisplayReady = true;
      bumpGraphVersion(this.graph);
      const viewState = this.initMapView(this.normalizedOptions.view);
      if (viewState) {
        viewState.rotationX = -90;
        this.setState({ viewState });
      }
    }
    this.optionsRefresh.resume();
  };

  initMapView = (config: MapViewConfig): ViewState | undefined => {
    let view = {
      id: config.id,
      longitude: 0,
      latitude: 0,
      zoom: config.zoom ?? 1,
      yZoom: config.zoom ?? 1 + 1,
      target: [0, 0, config.zoom ?? 1],
    };

    initViewExtent(view, config, this.props.width, this.props.height, this.layers, this.visLayers, this);
    return view;
  };

  private getRuntimeSubscriptionContext(data = this.props.data): RuntimeSubscriptionContext {
    return {
      graph: this.graph,
      edgeIndex: this.graphEdgeIndex,
      data,
      options: this.normalizedOptions,
      eventBus: this.props.eventBus,
      panel: this,
      publish: this.publishRuntimeUpdate,
    };
  }

  private publishRuntimeUpdate = (event: RuntimeUpdateEvent) => {
    this.props.eventBus?.publish(new MapglRuntimeUpdateEvent(event));
  };

  refreshRuntimeSubscriptions(context: Partial<RuntimeSubscriptionContext>) {
    this.runtimeSubscriptions.onDataChange({
      ...this.getRuntimeSubscriptionContext(),
      ...context,
    });
  }

  render() {
    const { data, replaceVariables, fieldConfig, eventBus } = this.props;
    const options = this.normalizedOptions;

    return (
      <>
        {this.panelContext && (
          <PanelContextProvider value={this.panelContext}>
            <RootStoreProvider
              createRootStore={(props) => new RootStore(props)}
              props={{
                panel: this,
                viewState: this.state.viewState,
                fieldConfig,
                replaceVariables,
                eventBus,
                data,
                options,
              }}
            >
              <Mapgl
                {...{
                  panel: this,
                  annots: this.annotations,
                  initMapRef: this.initMapRef,
                  source: this.layers?.[0]?.layer,
                  fieldConfig,
                  replaceVariables,
                  eventBus,
                  options,
                  data,
                }}
              />
            </RootStoreProvider>
          </PanelContextProvider>
        )}
      </>
    );
  }
}

function isLogicBasemap(basemap: Options['basemap'] | undefined): boolean {
  return !basemap || basemap.type === ORTHO_BASEMAP_CONFIG.type;
}
