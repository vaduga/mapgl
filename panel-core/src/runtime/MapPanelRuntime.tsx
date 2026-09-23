import { defaultPluginConfiguration, type MapglPanelProps } from '../plugin-factory/pluginRuntime';
import * as React from 'react';
import { Component } from 'react';
import { Subscription } from 'rxjs';
import { GrafanaTheme2, PanelData, PanelProps } from '@grafana/data';
import { config, locationService } from '@grafana/runtime';
import { PanelContext, PanelContextProvider, PanelContextRoot } from '@grafana/ui';
import { Options, MapLayerState, MapViewConfig, type DeckGLRefWithViewManager } from '@mapgl/panel-core/types';
import { defViewState, CMN_NAMESPACE } from '@mapgl/panel-core/types/defaults';
import type { ViewState, BiColProps, ComFeature, LayerDragShift } from '@mapgl/panel-core/types';
import type { LayoutArrowTips, LayoutCurveGroup, LayoutGraphResult } from '@mapgl/panel-core/graph/utils';
import { notifyPanelEditor } from '@mapgl/panel-core/utils/geomap_utils';
import {
  getActions,
  applyLayerFilter,
  initLayer,
  fillAnnots,
  initGroups,
  genVisLayers,
  SvgIconManager,
  MapglRuntimeUpdateEvent,
  RefreshController,
  LatestAsyncGate,
  normalizeOptions,
  persistFreshPanelOptions,
} from '@mapgl/panel-core/utils';
import { RootStoreProvider, VisLayers } from '@mapgl/panel-core/store';
import { Graph, GraphEdgeIndex, bumpGraphVersion, resetGraph } from '@mapgl/panel-core/graph';
import {
  GraphFramePipeline,
  applyGraphVisualState,
  createGraphFrameViewState,
  createGraphLayoutSignature,
  createGraphPanelRenderState,
  createGraphViewportFitSignature,
  resolveGraphPanelLayout,
  type GraphFrameDiagnostic,
  type GraphFrameInstanceState,
  type GraphFrameViewState,
  type GraphPanelPipelineState,
  type GraphPanelRenderState,
  type GraphPanelLayoutState,
} from '@mapgl/panel-core/graph/frame';
import { updateThresholdColor } from '@mapgl/panel-core/render';
import { createMarkersLayersPipelineInput, MARKERS_LAYER_ID, type MarkersConfig } from '@mapgl/panel-core/layers/data';
import { areMapViewConfigsEqual } from '@mapgl/panel-core/view';
import {
  buildMapglFeatureServices,
  type MapglFeatureServices,
  type MapglPanelFeature,
  RuntimeSubscriptionController,
  type RuntimeSubscriptionContext,
  type RuntimeUpdateEvent,
} from '@mapgl/panel-core/featureContracts';
type Props = PanelProps<Options>;

export interface MapPanelState {
  viewState: ViewState;
  source: string | {} | undefined;
  graphFrameRevision: number;
  isPanelEditor: boolean;
}

import { Rule } from '@mapgl/panel-core/editor';

export abstract class MapPanelRuntime<
  TOptions extends Options = Options,
  TState extends MapPanelState = MapPanelState,
> extends Component<MapglPanelProps<TOptions>, TState> {
  protected readonly lifetime = new AbortController();
  protected readonly panelUpdateGate = new LatestAsyncGate();
  protected graphViewportFitSignature?: string;
  protected graphViewportRefitRequired = true;
  protected readonly graphPipeline = new GraphFramePipeline<GraphPanelLayoutState, GraphPanelRenderState>({
    layout: (context) => resolveGraphPanelLayout(context, this.normalizedOptions.basemap),
    render: createGraphPanelRenderState,
    commit: (state) => this.commitGraphPipelineState(state),
  });
  protected readonly optionsRefresh = new RefreshController({
    delayMs: 150,
    isBlocked: () => !this.map || this.layoutInProgress,
    refresh: () => this.dataChanged(this.props.data),
  });
  declare context: React.ContextType<typeof PanelContextRoot>;
  static contextType = PanelContextRoot;
  panelContext: PanelContext | undefined;
  protected subs = new Subscription();
  readonly pluginConfiguration = this.props.mapglPlugin ?? defaultPluginConfiguration;
  private panelFeatureServices?: MapglFeatureServices;
  protected createPanelFeatures(): MapglPanelFeature[] {
    return [];
  }
  private panelRuntimeSubscriptions?: RuntimeSubscriptionController;

  get featureServices(): MapglFeatureServices {
    return (this.panelFeatureServices ??= buildMapglFeatureServices({
      edition: this.pluginConfiguration.edition,
      features: [...this.pluginConfiguration.features, ...this.createPanelFeatures()],
    }));
  }

  protected get runtimeSubscriptions(): RuntimeSubscriptionController {
    return (this.panelRuntimeSubscriptions ??= new RuntimeSubscriptionController(
      this.featureServices.runtimeSubscriptionProviders
    ));
  }

  pId: number | undefined;
  graph: Graph;
  graphEdgeIndex = new GraphEdgeIndex();
  vCount = 0;
  visLayers: VisLayers | undefined;
  map?: DeckGLRefWithViewManager | undefined;
  layers: MapLayerState[] = [];
  locLabelName;
  annotations;
  readonly svgIconManager = new SvgIconManager(this.pluginConfiguration.pluginId);
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
  graphFrameRuntime?: GraphPanelPipelineState;
  graphFrameView: GraphFrameViewState = createGraphFrameViewState({
    phase: 'idle',
    pending: false,
  });

  features: BiColProps[] = [];
  positions: Float64Array = new Float64Array();
  layerShift: LayerDragShift = {};
  muted: Uint8Array = new Uint8Array();
  colors: Uint8Array = new Uint8Array();
  annots: Uint8Array = new Uint8Array();
  groupIndices: Uint8Array = new Uint8Array();
  commentFeatures: readonly ComFeature[] = [];

  theme2: GrafanaTheme2 = config.theme2;
  readonly byName = new Map<string, MapLayerState>();
  abstract readonly mapLayerRegistry: import('@grafana/data').Registry<
    import('../extension').ExtendMapLayerRegistryItem
  >;
  abstract readonly orthoBasemapConfig: import('../extension').ExtendMapLayerOptions;

  protected normalizePanelOptions(options: TOptions): TOptions {
    return normalizeOptions(options) as TOptions;
  }

  protected get normalizedOptions(): TOptions {
    return this.normalizePanelOptions(this.props.options);
  }

  protected get normalizedProps(): PanelProps<TOptions> {
    return {
      ...this.props,
      options: this.normalizedOptions,
    };
  }

  get svgIconState() {
    return this.svgIconManager.state;
  }

  constructor(props: PanelProps<TOptions>) {
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
      graphFrameRevision: 0,
      isPanelEditor: locationService.getSearch().has('editPanel'),
    } as TState;

    this.panelContext = {
      onToggleSeriesVisibility: undefined,
      onSeriesColorChange: (label, colorName) => {
        const color = this.theme2.visualization.getColorByName(colorName);
        const fieldConfig = updateThresholdColor(this.props.fieldConfig, label, color);
        if (fieldConfig === this.props.fieldConfig) {
          return;
        }

        const steps = fieldConfig.defaults.thresholds?.steps;
        this.props.eventBus?.publish({
          type: 'edgeThresholdType',
          payload: { thresholds: steps },
        });
        this.props.onFieldConfigChange(fieldConfig);
      },
      graph: this.graph,
    } as unknown as PanelContext;
  }

  async componentDidMount() {
    this.panelContext = { ...this.context, ...this.panelContext };
    this.subs.add(
      locationService.getLocationObservable().subscribe(() => {
        const isPanelEditor = locationService.getSearch().has('editPanel');
        if (isPanelEditor !== this.state.isPanelEditor) {
          this.setState({ isPanelEditor });
        }
      })
    );
    persistFreshPanelOptions(this.props.options, (options) =>
      this.props.onOptionsChange(this.normalizePanelOptions({ ...this.props.options, ...options }))
    );
  }

  componentWillUnmount() {
    this.lifetime.abort();
    this.panelUpdateGate.dispose();
    this.graphPipeline.dispose();
    this.optionsRefresh.cancel();
    this.svgIconManager.dispose();
    resetGraph(this.graph);
    this.graphEdgeIndex.reset();
    this.vCount = 0;
    for (const g of this.graph.graphs()) {
      resetGraph(g);
    }
    this.map = undefined;
    this.layers.forEach((layer) => layer.handler.dispose?.());
    this.layers = [];
    this.byName.clear();
    this.panelRuntimeSubscriptions?.dispose();
    this.subs.unsubscribe();
  }

  componentDidUpdate(prevProps: PanelProps<TOptions>) {
    if (!this.map) {
      return;
    }

    const dataChanged = this.props.data !== prevProps.data;
    if (dataChanged) {
      void this.dataChanged(this.props.data);
    }

    if (this.props.options !== prevProps.options) {
      this.optionsChanged(this.normalizedOptions, this.normalizePanelOptions(prevProps.options), dataChanged);
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
    } as TOptions);

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
  optionsChanged(options: TOptions, oldOptions: TOptions, dataAlreadyChanged = false) {
    this.isLogic = isLogicBasemap(options.basemap);

    if (!areMapViewConfigsEqual(options.view, oldOptions.view)) {
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
      options.basemap?.type === 'blank' &&
      options.basemap.config !== oldOptions.basemap?.config
    ) {
      this.optionsRefresh.schedule();
    }
  }

  get graphFrameInstanceState(): GraphFrameInstanceState {
    const runtime = this.graphFrameRuntime;
    return {
      ...this.graphFrameView,
      snapshot: runtime?.snapshot,
      render: runtime
        ? {
            version: runtime.version,
            graph: runtime.render.state.graph,
            edgeIndex: this.graphEdgeIndex,
            positions: this.positions,
            features: runtime.render.state.features,
            colors: runtime.render.state.colors,
            muted: runtime.render.state.muted,
            annotations: runtime.render.state.annotations,
            groupIndices: runtime.render.state.groupIndices,
          }
        : undefined,
    };
  }

  protected getMarkersLayers(layers = this.layers): Array<MapLayerState<MarkersConfig>> {
    return layers.filter(
      (layer): layer is MapLayerState<MarkersConfig> => !layer.isBasemap && layer.options.type === MARKERS_LAYER_ID
    );
  }

  protected applyNonGraphLayers(data: PanelData, layers: MapLayerState[]): void {
    const panelData = { ...data };
    layers
      .filter((layer) => layer.options.type !== MARKERS_LAYER_ID)
      .forEach((layer) => applyLayerFilter(layer.handler, layer.options, panelData));
  }

  protected updateGraphFrameView(view: GraphFrameViewState): void {
    this.graphFrameView = Object.freeze(view);
    this.setState((state) => ({ graphFrameRevision: state.graphFrameRevision + 1 }));
  }

  protected clearGraphFrameRuntime(): void {
    if (!this.graphFrameRuntime) {
      return;
    }

    this.graphFrameRuntime = undefined;
    this.graph = new Graph(CMN_NAMESPACE);
    this.graphEdgeIndex = new GraphEdgeIndex();
    this.vCount = 0;
    this.features = [];
    this.positions = new Float64Array();
    this.colors = new Uint8Array();
    this.muted = new Uint8Array();
    this.annots = new Uint8Array();
    this.groupIndices = new Uint8Array();
    this.commentFeatures = [];
    this.groups = [];
    this.layoutGraphBounds.clear();
    this.layoutCurveGroups.clear();
    this.layoutEdgeIndexes.clear();
    this.layoutEdgeKeys = [];
    this.layoutArrowTips.clear();
    this.layoutReady = false;
    this.layoutDisplayReady = false;
    this.layoutInProgress = false;
    this.graphViewportFitSignature = undefined;
    this.graphViewportRefitRequired = true;
    this.panelContext = {
      ...this.panelContext,
      graph: this.graph,
    } as unknown as PanelContext;
  }

  protected prepareGraphCommit(state: GraphPanelPipelineState): {
    edgeIndex: GraphEdgeIndex;
    positions: Float64Array;
    commit?: () => void;
    project?: () => void;
  } {
    return { edgeIndex: state.render.state.edgeIndex, positions: state.render.state.positions };
  }

  protected commitGraphPipelineState(state: GraphPanelPipelineState): void {
    applyGraphVisualState(state.graph.state, state.visual.state);
    const render = state.render.state;
    const prepared = this.prepareGraphCommit(state);
    const viewportFitSignature = createGraphViewportFitSignature(
      state.snapshot,
      this.isLogic,
      this.normalizedOptions.basemap
    );
    this.graphViewportRefitRequired = this.graphViewportFitSignature !== viewportFitSignature;
    this.graphViewportFitSignature = viewportFitSignature;

    this.graphFrameRuntime = state;
    this.graph = render.graph;
    this.graphEdgeIndex = prepared.edgeIndex;
    this.positions = prepared.positions;
    this.features = [...render.features];
    this.colors = render.colors;
    this.muted = render.muted;
    this.annots = render.annotations;
    this.groupIndices = render.groupIndices;
    this.commentFeatures = render.commentFeatures;
    this.groups = [...render.groups];
    this.vCount = state.snapshot.nodes.length;
    this.layoutGraphBounds = new Map(render.graphBounds);
    this.layoutCurveGroups = new Map(render.curveGroups);
    this.layoutEdgeIndexes = new Map(render.edgeIndexes);
    this.layoutEdgeKeys = [...render.edgeKeys];
    this.layoutArrowTips = new Map(render.arrowTips);
    this.layoutReady = true;
    this.layoutDisplayReady = true;
    this.layoutInProgress = false;

    const markerLayers = this.getMarkersLayers();
    markerLayers.forEach((markerLayer, index) => {
      const featureSource = render.featureSources[index];
      if (!featureSource) {
        return;
      }
      featureSource.useMockData = this.useMockData;
      markerLayer.layer = featureSource;
    });

    prepared.commit?.();
    this.panelContext = {
      ...this.panelContext,
      graph: this.graph,
    } as unknown as PanelContext;
    this.visLayers = genVisLayers(this, this.normalizedProps);
    prepared.project?.();
    bumpGraphVersion(this.graph);

    this.updateGraphFrameView(
      createGraphFrameViewState({
        phase: state.snapshot.nodes.length ? 'ready' : 'empty',
        pending: false,
        runtime: state,
        diagnostics: state.diagnostics,
      })
    );
  }

  protected failGraphRefresh(diagnostics: readonly GraphFrameDiagnostic[]): void {
    this.updateGraphFrameView(
      createGraphFrameViewState({
        phase: 'fatal',
        pending: false,
        runtime: this.graphFrameRuntime,
        diagnostics,
      })
    );
    notifyPanelEditor(this, this.layers);
  }

  protected async runGraphPipeline(
    data: PanelData,
    layers = this.layers,
    isCurrent = () => !this.lifetime.signal.aborted
  ): Promise<boolean> {
    const markerLayers = this.getMarkersLayers(layers);
    const markerLayer = markerLayers[0];
    if (!markerLayer) {
      this.clearGraphFrameRuntime();
      this.updateGraphFrameView(createGraphFrameViewState({ phase: 'idle', pending: false }));
      return false;
    }

    this.layoutInProgress = this.isLogic;
    this.updateGraphFrameView(
      createGraphFrameViewState({
        phase: 'loading',
        pending: true,
        runtime: this.graphFrameRuntime,
      })
    );

    let result: Awaited<ReturnType<(typeof this.graphPipeline)['run']>>;
    try {
      result = await this.graphPipeline.run(
        createMarkersLayersPipelineInput({
          data,
          layers: markerLayers.map((layer) => ({
            layer: layer.options,
            layerIndex: Math.max(0, layers.indexOf(layer) - 1),
          })),
          theme: this.theme2,
          isLogic: this.isLogic,
          useMockData: this.useMockData,
          layoutSignature: createGraphLayoutSignature(this.normalizedOptions.basemap),
          groupIndexOffset: 0,
        })
      );
    } catch (error) {
      if (!isCurrent()) {
        return false;
      }
      this.layoutInProgress = false;
      this.optionsRefresh.resume();
      this.failGraphRefresh([
        {
          code: 'pipeline-failed',
          severity: 'fatal',
          message: 'Graph refresh pipeline failed',
          count: 1,
          examples: [
            {
              context: {
                layerName: markerLayer.options.name,
              },
              value: error instanceof Error ? error.message : String(error),
            },
          ],
        },
      ]);
      return false;
    }
    if (!isCurrent()) {
      return false;
    }
    if (!result) {
      this.layoutInProgress = false;
      this.optionsRefresh.resume();
      return false;
    }
    if (!result.ok) {
      this.layoutInProgress = false;
      this.optionsRefresh.resume();
      this.failGraphRefresh(result.diagnostics);
      return false;
    }
    this.layoutInProgress = false;
    this.optionsRefresh.resume();
    notifyPanelEditor(this, this.layers);
    return true;
  }

  /**
   * Called when PanelData changes (query results etc)
   */
  dataChanged = async (data: PanelData) => {
    this.graphPipeline.invalidate();
    this.optionsRefresh.cancel();
    this.beforeGraphRefresh();

    await this.panelUpdateGate.run(async (isCurrent) => {
      // Only update if panel data matches component data
      if (data !== this.props.data || !isCurrent()) {
        return;
      }

      const annotationsPresenceChanged = this.hasAnnots !== Boolean(data.annotations?.length);
      this.hasAnnots = Boolean(data.annotations?.length);
      const nextGroups: Rule[] = [];
      let svgIconState;
      try {
        const svgGroups = initGroups(nextGroups, this.layers, this.theme2, true);
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
      const graphCommitted = await this.runGraphPipeline(data, this.layers, isCurrent);

      if (!isCurrent()) {
        return;
      }

      this.applyNonGraphLayers(data, this.layers);
      if (!this.getMarkersLayers().length) {
        this.groups = nextGroups;
        this.visLayers = genVisLayers(this, this.normalizedProps);
      }

      if (!graphCommitted || this.graphViewportRefitRequired) {
        const viewState = this.initMapView(this.normalizedOptions.view);
        if (viewState) {
          if (this.isLogic) {
            viewState.rotationX = -90;
          }
          this.setState({ viewState });
          this.onViewChanged(viewState);
        }
      }
      if (graphCommitted) {
        this.onGraphReady(annotationsPresenceChanged, isCurrent, data);
      }
    });
  };

  initMapRef = async (deckRef, initializeHost?: (view: ViewState) => void) => {
    this.graphPipeline.invalidate();
    this.beforeGraphRefresh();
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

      try {
        const baseLayer = await initLayer(this, options.basemap ?? this.orthoBasemapConfig, true);
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

        const nextGroups: Rule[] = [];
        const svgGroups = initGroups(nextGroups, layers, this.theme2);
        const svgIconState = await this.svgIconManager.resolve({
          requiredIconNames: svgGroups.requiredIconNames,
          signature: svgGroups.svgSignature,
        });
        if (!svgIconState || !isCurrent()) {
          return;
        }

        this.layers = layers;
        const graphCommitted = await this.runGraphPipeline(this.props.data, layers, isCurrent);
        if (!isCurrent()) {
          return;
        }
        this.applyNonGraphLayers(this.props.data, layers);

        if (!this.getMarkersLayers(layers).length) {
          this.groups = nextGroups;
          this.visLayers = genVisLayers(this, this.normalizedProps);
        }

        const viewState = this.initMapView(options.view);
        if (viewState) {
          initializeHost?.(viewState);
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

        if (!graphCommitted) {
          notifyPanelEditor(this, layers, layers.length - 1);
        }
        if (graphCommitted) {
          this.onGraphReady(true, isCurrent, this.props.data);
        }
      } catch (ex) {
        if ((ex as any)?.name === 'AbortError') {
          return;
        }
        console.error('error loading layers', ex);
      }
    });
  };

  initMapView = (config: MapViewConfig): ViewState | undefined => {
    let view = {
      id: config.id,
      longitude: 0,
      latitude: 0,
      zoom: config.zoom ?? 1,
      yZoom: config.zoom ?? 1 + 1,
      target: [0, 0, this.isLogic ? 0 : (config.zoom ?? 1)],
    };

    this.fitViewExtent(view, config);
    return view;
  };

  protected getRuntimeSubscriptionContext(data = this.props.data): RuntimeSubscriptionContext {
    return {
      graph: this.graph,
      edgeIndex: this.graphEdgeIndex,
      data,
      options: this.normalizedOptions,
      eventBus: this.props.eventBus,
      publish: this.publishRuntimeUpdate,
    };
  }

  protected publishRuntimeUpdate = (event: RuntimeUpdateEvent) => {
    this.props.eventBus?.publish(new MapglRuntimeUpdateEvent(event));
  };

  refreshRuntimeSubscriptions(context: Partial<RuntimeSubscriptionContext>) {
    this.runtimeSubscriptions.onDataChange({
      ...this.getRuntimeSubscriptionContext(),
      ...context,
    });
  }

  protected beforeGraphRefresh(): void {}
  protected onViewChanged(view: ViewState): void {}
  protected onGraphReady(restart: boolean, isCurrent: () => boolean, data: PanelData): void {
    if (restart) {
      void this.runtimeSubscriptions
        .start(this.getRuntimeSubscriptionContext(data))
        .catch((error) => console.error('Runtime subscriptions failed', error));
    } else {
      this.runtimeSubscriptions.onDataChange(this.getRuntimeSubscriptionContext(data));
    }
  }

  protected abstract fitViewExtent(view: ViewState, config: MapViewConfig): void;
  protected abstract createRootStore(props: any): { update(props: any): void; connect(): void; dispose(): void };
  protected abstract renderMap(props: any): React.ReactNode;

  render() {
    const { data, replaceVariables, fieldConfig, eventBus } = this.props;
    const options = this.normalizedOptions;

    return (
      <>
        {this.panelContext && (
          <PanelContextProvider value={this.panelContext}>
            <RootStoreProvider
              createRootStore={(props) => this.createRootStore(props)}
              updateRootStore={(root, props) => root.update(props)}
              connectRootStore={(root) => root.connect()}
              disposeRootStore={(root) => root.dispose()}
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
              {this.renderMap({
                panel: this,
                annots: this.annotations,
                initMapRef: this.initMapRef,
                source: this.layers?.[0]?.layer,
                fieldConfig,
                replaceVariables,
                eventBus,
                options,
                data,
                editing: this.state.isPanelEditor,
              })}
            </RootStoreProvider>
          </PanelContextProvider>
        )}
      </>
    );
  }
}

function isLogicBasemap(basemap: Options['basemap'] | undefined): boolean {
  return !basemap || basemap.type === 'blank';
}
