import { GrafanaTheme2, PanelData, PanelProps } from '@grafana/data';
import { config, locationService } from '@grafana/runtime';
import { PanelContext, PanelContextProvider, PanelContextRoot } from '@grafana/ui';
import { GrafanaGraphPipeline } from '../graph/frame/pipeline';
import { updateThresholdColor } from '../render/index';
import { RootStoreProvider } from '@vaduga/mapgl-core/store';
import { type ViewState, MapLayerState, MapViewConfig, Options, type DeckGLRefWithViewManager } from '../types/index';

import {
  applyLayerFilter,
  fillAnnots,
  genVisLayers,
  getActions,
  initGroups,
  initLayer,
  LatestAsyncGate,
  MapglRuntimeUpdateEvent,
  normalizeOptions,
  persistFreshPanelOptions,
  RefreshController,
  SvgIconManager,
} from '../utils/index';
import {
  type MapglFeatureServices,
  type MapglPanelFeature,
  type RuntimeUpdateEvent,
} from '@vaduga/mapgl-core/featureContracts';
import {
  applyGraphVisualState,
  createGraphFrameViewState,
  createGraphLayoutSignature,
  createGraphPanelRenderState,
  createGraphViewportFitSignature,
  resolveGraphPanelLayout,
  type GraphFrameDiagnostic,
  type GraphFrameInstanceState,
  type GraphFrameViewState,
  type GraphPanelLayoutState,
  type GraphPanelPipelineState,
  type GraphPanelRenderState,
} from '@vaduga/mapgl-core/graph/frame';
import { bumpGraphVersion, Graph, GraphEdgeIndex, resetGraph } from '@vaduga/mapgl-core/graph/main';
import { LayoutWorkerClient } from '@vaduga/mapgl-core/graph/utils/layout-worker-client';
import { GraphScene, type SceneCommit } from '@vaduga/mapgl-core/runtime';
import { defViewState } from '@vaduga/mapgl-core/types/defaults';
import * as React from 'react';
import { Component } from 'react';
import { Subscription } from 'rxjs';
import { createMarkersLayersPipelineInput, MARKERS_LAYER_ID, type MarkersConfig } from '../layers/data/index';
import { defaultPluginConfiguration, type MapglPanelProps } from '../plugin-factory/pluginRuntime';
import { notifyPanelEditor } from '../utils/geomap_utils';
import { initViewExtent, type ViewExtentCenter, areMapViewConfigsEqual } from '@vaduga/mapgl-core/utils';
import { loadSvgIcons } from '../utils/plugin';

import type { GrafanaRuntimeSubscriptionContext, GrafanaPanelBinding, SelectionHooks } from './contracts';
import { selectionBinding } from './selectionBinding';
import { buildGrafanaFeatureServices } from './featureServices';
import { createLayoutWorker } from '@vaduga/mapgl-core/workers/layoutWorker';
import { centerPointRegistry, MapCenterID } from '../view';
import { GrafanaRuntimeSubscriptions } from './subscriptions';
type Props = PanelProps<Options>;

export interface MapPanelState {
  viewState: ViewState;
  source: string | {} | undefined;
  graphFrameRevision: number;
  isPanelEditor: boolean;
}

import { Rule } from '../editor/index';

export abstract class MapPanelRuntime<
  TOptions extends Options = Options,
  TState extends MapPanelState = MapPanelState,
> extends Component<MapglPanelProps<TOptions>, TState> {
  protected lifetime = new AbortController();
  protected panelUpdateGate = new LatestAsyncGate();
  protected graphViewportFitSignature?: string;
  protected graphViewportRefitRequired = true;
  layoutWorker = new LayoutWorkerClient(createLayoutWorker);
  readonly scene = new GraphScene();
  private createGraphPipeline = () =>
    new GrafanaGraphPipeline(
      {
        isolateGraph: (this.props.mapglPlugin ?? defaultPluginConfiguration).edition === 'extended',
        layout: (context) =>
          resolveGraphPanelLayout(context, this.normalizedOptions.basemap, (input) =>
            this.layoutWorker.requestLayout({ ...input, signal: context.signal })
          ),
        render: createGraphPanelRenderState,
        prepareCommit: (state) => this.prepareGraphPipelineCommit(state),
        commitVisuals: (state) => this.bindMarkerFeatureSources(state),
      },
      this.scene
    );
  protected graphPipeline = this.createGraphPipeline();
  get controller() {
    return this.graphPipeline.controller;
  }
  get sourceResolver() {
    return this.graphPipeline.sourceResolver;
  }
  protected readonly optionsRefresh = new RefreshController({
    delayMs: 150,
    isBlocked: () => this.scene.pending,
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
  private panelRuntimeSubscriptions?: GrafanaRuntimeSubscriptions;

  get featureServices(): MapglFeatureServices {
    return (this.panelFeatureServices ??= buildGrafanaFeatureServices({
      edition: this.pluginConfiguration.edition,
      features: [...this.pluginConfiguration.features, ...this.createPanelFeatures()],
    }));
  }

  protected get runtimeSubscriptions(): GrafanaRuntimeSubscriptions {
    return (this.panelRuntimeSubscriptions ??= new GrafanaRuntimeSubscriptions(
      this.featureServices.runtimeSubscriptionProviders
    ));
  }

  pId: number | undefined;

  map?: DeckGLRefWithViewManager | undefined;
  layers: MapLayerState[] = [];
  locLabelName;
  annotations;
  svgIconManager = new SvgIconManager((names, icons, controller) =>
    loadSvgIcons(names, icons, controller, this.pluginConfiguration.pluginId)
  );
  isLogic = true;
  hasAnnots = false;
  useMockData;
  get graphFrameRuntime(): GraphPanelPipelineState | undefined {
    return this.scene.baseline;
  }

  theme2: GrafanaTheme2 = config.theme2;
  readonly byName = new Map<string, MapLayerState>();
  abstract readonly mapLayerRegistry: import('@grafana/data').Registry<
    import('../extension').ExtendMapLayerRegistryItem
  >;
  abstract readonly orthoBasemapConfig: import('../extension').ExtendMapLayerOptions;

  setVisibility(
    layer: import('@vaduga/mapgl-core/store').LayerTreeInfo,
    visible: boolean,
    style: 'children' | 'group' | 'none'
  ): void {
    this.scene.setVisibility(layer, visible, style, this.featureServices.namespaceProjectionStrategies);
  }

  protected normalizePanelOptions(options: TOptions): TOptions {
    return normalizeOptions(options) as TOptions;
  }

  private optionsCache?: { source: TOptions; value: TOptions };

  protected get normalizedOptions(): TOptions {
    const source = this.props.options;
    if (!this.optionsCache || this.optionsCache.source !== source) {
      this.optionsCache = { source, value: this.normalizePanelOptions(source) };
    }
    return this.optionsCache.value;
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
      graph: this.scene.render.graph,
    } as unknown as PanelContext;
  }

  async componentDidMount() {
    if (this.lifetime.signal.aborted) {
      this.lifetime = new AbortController();
      this.panelUpdateGate = new LatestAsyncGate();
      this.layoutWorker = new LayoutWorkerClient(createLayoutWorker);
      this.graphPipeline = this.createGraphPipeline();
      this.svgIconManager = new SvgIconManager((names, icons, controller) =>
        loadSvgIcons(names, icons, controller, this.pluginConfiguration.pluginId)
      );
      this.subs = new Subscription();
      this.panelRuntimeSubscriptions = undefined;
      this.layerInitialization = undefined;
    }
    this.syncStoreBindings();
    this.runtimeSubscriptions.updatePanel(this.getGrafanaRuntimeSubscriptionContext());
    this.subs.add(
      this.scene.subscribe(() => {
        if (!this.lifetime.signal.aborted) {
          this.syncStoreInputs();
          this.setState((state) => ({ graphFrameRevision: state.graphFrameRevision + 1 }));
        }
      })
    );
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
    const lifetime = this.lifetime;
    await this.initializeIntegration();
    if (lifetime.signal.aborted || lifetime !== this.lifetime) {
      return;
    }
    await this.initializeLayers();
  }

  /** Edition integrations must be ready before graph preparation can use them. */
  protected async initializeIntegration(): Promise<void> {}

  componentWillUnmount() {
    this.lifetime.abort();
    this.panelUpdateGate.dispose();
    this.graphPipeline.dispose();
    this.layoutWorker.dispose();
    this.optionsRefresh.cancel();
    this.svgIconManager.dispose();
    resetGraph(this.scene.render.graph);
    this.scene.render.edgeIndex.reset();
    for (const g of this.scene.render.graph.graphs()) {
      resetGraph(g);
    }
    this.map = undefined;
    this.layers.forEach((layer) => layer.handler.dispose?.());
    this.layers = [];
    this.byName.clear();
    this.panelRuntimeSubscriptions?.dispose();
    this.releaseStoreBindings = [];
    this.subs.unsubscribe();
  }

  componentDidUpdate(prevProps: PanelProps<TOptions>) {
    this.runtimeSubscriptions.updatePanel(this.getGrafanaRuntimeSubscriptionContext());
    const dataChanged = this.props.data !== prevProps.data;
    if (dataChanged) {
      void this.dataChanged(this.props.data);
    }

    if (this.props.options !== prevProps.options) {
      this.optionsChanged(this.normalizedOptions, this.normalizePanelOptions(prevProps.options), dataChanged);
    }
    this.syncStoreBindings();
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
      ...this.scene.view,
      snapshot: runtime?.snapshot,
      render: runtime
        ? {
            version: runtime.version,
            graph: this.scene.render.graph,
            edgeIndex: this.scene.render.edgeIndex,
            positions: this.scene.render.positions,
            features: this.scene.render.features,
            colors: this.scene.render.colors,
            muted: this.scene.render.muted,
            annotations: this.scene.render.annotations,
            groupIndices: this.scene.render.groupIndices,
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
    this.controller.setStatus(view);
  }

  protected clearGraphFrameRuntime(): void {
    if (!this.graphFrameRuntime) {
      return;
    }

    this.controller.clear();
    this.graphViewportFitSignature = undefined;
    this.graphViewportRefitRequired = true;
    this.panelContext = {
      ...this.panelContext,
      graph: this.scene.render.graph,
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

  protected prepareGraphPipelineCommit(state: GraphPanelPipelineState): SceneCommit {
    const render = state.render.state;
    applyGraphVisualState(state.graph.state, state.visual.state);
    const prepared = this.prepareGraphCommit(state);
    const viewportFitSignature = createGraphViewportFitSignature(
      state.snapshot,
      this.isLogic,
      this.normalizedOptions.basemap
    );
    this.graphViewportRefitRequired = this.graphViewportFitSignature !== viewportFitSignature;
    this.graphViewportFitSignature = viewportFitSignature;

    return {
      render: { edgeIndex: prepared.edgeIndex, positions: prepared.positions },
      visibility: genVisLayers(
        {
          graph: render.graph,
          groups: [...render.groups],
          isLogic: this.isLogic,
          hasAnnots: this.hasAnnots,
          useMockData: this.useMockData,
          featureServices: this.featureServices,
        },
        this.normalizedProps
      ),
      apply: () => {
        this.bindMarkerFeatureSources(state);

        prepared.commit?.();
        this.panelContext = {
          ...this.panelContext,
          graph: this.scene.render.graph,
        } as unknown as PanelContext;
      },
      project: prepared.project,
    };
  }

  private bindMarkerFeatureSources(state: GraphPanelPipelineState): void {
    this.getMarkersLayers().forEach((markerLayer, index) => {
      const featureSource = state.render.state.featureSources[index];
      if (featureSource) {
        featureSource.useMockData = this.useMockData;
        markerLayer.layer = featureSource;
      }
    });
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

    this.controller.setStatus(
      createGraphFrameViewState({ phase: 'loading', pending: true, runtime: this.graphFrameRuntime })
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
      this.optionsRefresh.resume();
      return false;
    }
    if (!result.ok) {
      this.optionsRefresh.resume();
      this.failGraphRefresh(result.diagnostics);
      return false;
    }
    this.optionsRefresh.resume();
    notifyPanelEditor(this, this.layers);
    return true;
  }

  /**
   * Called when PanelData changes (query results etc)
   */
  dataChanged = async (data: PanelData) => {
    await this.initializeLayers();
    if (this.lifetime.signal.aborted) {
      return;
    }
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
        this.scene.update({ groups: nextGroups });
        this.scene.replaceVisibility(
          genVisLayers(
            {
              graph: this.scene.render.graph,
              groups: this.scene.render.groups,
              isLogic: this.isLogic,
              hasAnnots: this.hasAnnots,
              useMockData: this.useMockData,
              featureServices: this.featureServices,
            },
            this.normalizedProps
          )
        );
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

  private layerInitialization?: Promise<void>;
  private initializeLayers = (): Promise<void> => {
    return (this.layerInitialization ??= this.loadLayers());
  };

  private loadLayers = async () => {
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
          this.scene.update({ groups: nextGroups });
          this.scene.replaceVisibility(
            genVisLayers(
              {
                graph: this.scene.render.graph,
                groups: this.scene.render.groups,
                isLogic: this.isLogic,
                hasAnnots: this.hasAnnots,
                useMockData: this.useMockData,
                featureServices: this.featureServices,
              },
              this.normalizedProps
            )
          );
        }

        const viewState = this.initMapView(options.view);
        if (viewState) {
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

  initMapRef = async (deckRef, initializeHost?: (view: ViewState) => void) => {
    this.map = deckRef.current;
    await this.initializeLayers();
    if (this.lifetime.signal.aborted || !this.map) {
      return;
    }
    initializeHost?.(this.state.viewState);
    this.optionsRefresh.resume();
  };

  applyViewport = (viewState: ViewState): void => {
    this.setState({ viewState });
    this.onViewChanged(viewState);
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

  protected fitViewExtent(view: ViewState, config: MapViewConfig): void {
    const centerPoint = centerPointRegistry.getIfExists(config.id);
    const center: ViewExtentCenter | undefined = centerPoint
      ? {
          kind:
            centerPoint.id === MapCenterID.Fit
              ? 'fit'
              : centerPoint.id === MapCenterID.Coordinates
                ? 'coordinates'
                : 'fixed',
          lon: centerPoint.lon,
          lat: centerPoint.lat,
          zoom: centerPoint.zoom,
        }
      : undefined;

    initViewExtent(view, config, center, this.props.width, this.props.height, this.layers, this.scene.visibility, {
      graph: this.scene.render.graph,
      positions: this.scene.render.positions,
      layoutGraphBounds: this.scene.render.graphBounds,
      layerShift: this.scene.layerShift,
      isLogic: this.isLogic,
    });
  }

  protected getGrafanaRuntimeSubscriptionContext(data = this.props.data): GrafanaRuntimeSubscriptionContext {
    return {
      graph: this.scene.render.graph,
      revision: this.sourceResolver?.revision,
      edgeIndex: this.scene.render.edgeIndex,
      data,
      options: this.normalizedOptions,
      eventBus: this.props.eventBus,
      publish: this.publishRuntimeUpdate,
    };
  }

  protected publishRuntimeUpdate = (event: RuntimeUpdateEvent) => {
    this.props.eventBus?.publish(new MapglRuntimeUpdateEvent(event));
  };

  refreshRuntimeSubscriptions(context: Partial<GrafanaRuntimeSubscriptionContext>) {
    this.runtimeSubscriptions.onDataChange({
      ...this.getGrafanaRuntimeSubscriptionContext(),
      ...context,
    });
  }

  protected beforeGraphRefresh(): void {}
  protected onViewChanged(view: ViewState): void {}
  protected onGraphReady(restart: boolean, isCurrent: () => boolean, data: PanelData): void {
    if (restart) {
      void this.runtimeSubscriptions
        .start(this.getGrafanaRuntimeSubscriptionContext(data))
        .catch((error) => console.error('Runtime subscriptions failed', error));
    } else {
      this.runtimeSubscriptions.onDataChange(this.getGrafanaRuntimeSubscriptionContext(data));
    }
  }

  private releaseStoreBindings: Array<() => void> = [];
  private initializedSelection = new WeakSet<object>();
  private inputController?: typeof this.controller;
  private inputView?: ViewState;
  private inputClusterMaxZoom?: number;

  protected get resolvedClusterMaxZoom(): number {
    return 18;
  }
  protected get resolvedEditable(): boolean {
    return false;
  }
  protected createSelectionHooks(): SelectionHooks {
    return {};
  }
  protected createPanelBindings(): GrafanaPanelBinding[] {
    return [
      selectionBinding(
        {
          eventBus: this.props.eventBus,
          panelId: this.props.id,
          controller: this.controller,
          scene: this.scene,
          readIsLogic: () => this.isLogic,
          readZoom: () => this.map?.deck?.viewManager?.viewState[this.isLogic ? '3d-scene' : 'geo-view']?.zoom,
          applyViewport: (view) => this.applyViewport(view),
        },
        this.createSelectionHooks()
      ),
    ];
  }
  private syncStoreInputs(): void {
    const controller = this.controller;
    controller.stores.pointStore.setEditable(this.resolvedEditable);
    const clusterMaxZoom = this.resolvedClusterMaxZoom;
    if (this.inputController !== controller || this.inputClusterMaxZoom !== clusterMaxZoom) {
      this.inputClusterMaxZoom = clusterMaxZoom;
      controller.stores.viewStore.setClusterMaxZoom(clusterMaxZoom);
    }
    if (this.inputController !== controller || this.inputView !== this.state.viewState) {
      this.inputController = controller;
      this.inputView = this.state.viewState;
      controller.setViewport(this.state.viewState, 'host');
    }
    if (!this.initializedSelection.has(controller)) {
      const nodeId = this.props.replaceVariables('$nodeId');
      const node = nodeId !== '$nodeId' ? this.scene.render.graph.findNodeRecursive(nodeId) : undefined;
      if (node || nodeId === '$nodeId') {
        this.initializedSelection.add(controller);
        if (node && !controller.stores.pointStore.getSelectedNode) {
          controller.select({ id: node.id, namespaceId: String((node.parent as Graph | undefined)?.id ?? '') }, 'host');
        }
      }
    }
  }
  private syncStoreBindings(): void {
    this.syncStoreInputs();
    const previous = this.releaseStoreBindings;
    this.releaseStoreBindings = this.createPanelBindings().map((binding) =>
      this.runtimeSubscriptions.bindPanel(binding)
    );
    previous.filter((release) => !this.releaseStoreBindings.includes(release)).forEach((release) => release());
  }

  protected abstract renderMap(props: any): React.ReactNode;

  render() {
    const { data, replaceVariables, fieldConfig, eventBus } = this.props;
    const options = this.normalizedOptions;

    return (
      <>
        {this.panelContext && (
          <PanelContextProvider value={this.panelContext}>
            <RootStoreProvider store={this.controller.stores}>
              {this.renderMap({
                panel: this,
                subscriptions: this.runtimeSubscriptions,
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
