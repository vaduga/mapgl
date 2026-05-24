import * as React from 'react';
import { Component } from 'react';
import { Subscription } from 'rxjs';
import { GrafanaTheme2, PanelData, PanelProps } from '@grafana/data';
import { config } from '@grafana/runtime';
import { PanelContext, PanelContextProvider, PanelContextRoot } from '@grafana/ui';
import { Options, MapLayerState, MapViewConfig, type DeckGLRefWithViewManager } from './types';
import { defViewState, CMN_NAMESPACE } from 'mapLib/defaults';
import { captureLayoutCache, restoreLayoutCache, scheduleLayout } from 'mapLib/utils';
import type {
  ViewState,
  BiColProps,
  LayoutArrowTips,
  LayoutCache,
  LayoutCurveGroup,
  LayoutGraphResult,
  LayerDragShift,
} from 'mapLib/types';
import { notifyPanelEditor } from './utils/geomap_utils';
import { getActions } from './utils/actions';
import Mapgl from './components/Mapgl';
import {
  RootStoreProvider,
  fillAnnots,
  initGroups,
  genVisLayers,
  initBinaryProps,
  cutBinaryProps,
  SvgIconManager,
} from './utils';
import { applyLayerFilter, initLayer } from './utils/layers';
import { ORTHO_BASEMAP_CONFIG } from './layers/registry';
import { defaultMarkersConfig } from './layers/data/markersLayer';
import { Graph, GraphEdgeIndex, bumpGraphVersion, resetGraph, resetGraphNodes } from 'mapLib';

import { initViewExtent } from './utils/utils.map';

type Props = PanelProps<Options>;

interface State {
  viewState: ViewState;
  source: string | {} | undefined;
}

import { Rule } from './editor/Groups/rule-types';
import { VisLayers } from './store/visLayers';

export class MapPanel extends Component<Props, State> {
  declare context: React.ContextType<typeof PanelContextRoot>;
  static contextType = PanelContextRoot;
  panelContext: PanelContext | undefined;
  private subs = new Subscription();

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
  edgeRoutingOverride?: Options['common']['edgeRouting'];
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

  get svgIconState() {
    return this.svgIconManager.state;
  }

  constructor(props: Props) {
    super(props);
    const { options } = props;
    const { locLabelName } = options.common || {};

    this.pId = props.id;
    this.isLogic = !options.basemap || options.basemap.type === ORTHO_BASEMAP_CONFIG.type;
    this.hasAnnots = !!props.data.annotations?.length;

    const firstRun = !this.props.options.dataLayers?.length;
    this.useMockData = this.isLogic && (firstRun || this.props.options.dataLayers?.every((el) => !el.locField));

    const rootGraph = new Graph(CMN_NAMESPACE);
    this.graph = rootGraph;
    this.visLayers = new VisLayers();

    // Default layer starter-values
    if (!options.dataLayers?.length) {
      options.dataLayers = [defaultMarkersConfig];
    }

    this.locLabelName = locLabelName;
    this.state = {
      source: undefined,
      viewState: defViewState,
    };

    this.panelContext = {
      onToggleSeriesVisibility: undefined,
      onSeriesColorChange: (v, c) => {
        const newOptions = { ...this.props.options };
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
  }

  componentWillUnmount() {
    this.svgIconManager.abort();
    resetGraph(this.graph);
    this.graphEdgeIndex.reset();
    this.vCount = 0;
    for (const g of this.graph.graphs()) {
      resetGraph(g);
    }
    this.map = undefined;
    this.layers = [];
    this.subs.unsubscribe();
  }

  shouldComponentUpdate(nextProps: Props) {
    if (!this.map) {
      return true; // not yet initialized
    }

    // External data changed
    //console.log('should update with datachanged', this.props.data !== nextProps.data)
    if (this.props.data !== nextProps.data) {
      this.dataChanged(nextProps.data);
    }

    // Options changed
    if (this.props.options !== nextProps.options) {
      this.optionsChanged(nextProps.options);
    }

    return true; // always?
  }

  componentDidUpdate(prevProps: Props) {
    // Check for a difference between previous data and component data
    if (this.map && this.props.data !== prevProps.data) {
      this.dataChanged(this.props.data);
    }
  }

  /** This function will actually update the JSON model */
  doOptionsUpdate = async (selected: number) => {
    const { options, onOptionsChange } = this.props;

    const layers = this.layers;
    onOptionsChange({
      ...options,
      basemap: layers[0].options,
      dataLayers: layers.slice(1).map((v) => v.options),
    } as Options);

    this.dataChanged(this.props.data);
    notifyPanelEditor(this, layers, selected);
  };

  actions = getActions(this);

  /**
   * Called when the panel options change
   *
   * NOTE: changes to basemap and layers are handled independently
   */
  optionsChanged(options: Options) {
    const oldOptions = this.props.options;
    if (options.view !== oldOptions.view) {
      const viewState = this.initMapView(options.view);
      if (viewState) {
        if (this.isLogic) {
          viewState.rotationX = -90;
        }
        this.setState({ viewState });
      }
    }

    if (options.common?.edgeRouting !== oldOptions.common?.edgeRouting && this.isLogic) {
      this.edgeRoutingOverride = options.common?.edgeRouting;
      this.dataChanged(this.props.data).finally(() => {
        this.edgeRoutingOverride = undefined;
      });
    }
  }

  /**
   * Called when PanelData changes (query results etc)
   */
  dataChanged = async (data: PanelData) => {
    // Only update if panel data matches component data
    if (data === this.props.data) {
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
      if (!svgIconState) {
        return;
      }

      if (this.locLabelName) {
        await (async () => {
          this.annotations = await fillAnnots(this.locLabelName, data.annotations);
        })();
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

      this.visLayers = genVisLayers(this, this.props);

      if (this.isLogic) {
        bumpGraphVersion(this.graph);
        this.layoutInProgress = scheduleLayout(this, this.onLayoutApplied);
      }
    }

    const viewState = this.initMapView(this.props.options.view);
    if (viewState) {
      if (this.isLogic) {
        viewState.rotationX = -90;
      }
      this.setState({ viewState });
    }
  };

  initMapRef = async (deckRef) => {
    if (this.locLabelName) {
      await (async () => {
        this.annotations = await fillAnnots(this.locLabelName, this.props.data.annotations);
      })();
    }

    const { options } = this.props;
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
      layers.push(baseLayer);

      let layerIdx = 0;
      for (const lyr of options.dataLayers) {
        const layerState = await initLayer(this, { ...lyr }, false, layerIdx);
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
      if (!svgIconState) {
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

      this.visLayers = genVisLayers(this, this.props);

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
        this.setState({ viewState });
      }

      notifyPanelEditor(this, layers, layers.length - 1);
    } catch (ex) {
      if ((ex as any)?.name === 'AbortError') {
        return;
      }
      console.error('error loading layers', ex);
    }
  };

  onLayoutApplied = (applied = true) => {
    this.layoutInProgress = false;
    if (!applied) {
      bumpGraphVersion(this.graph);
      return;
    }
    this.layoutReady = true;
    this.layoutDisplayReady = true;
    bumpGraphVersion(this.graph);
    const viewState = this.initMapView(this.props.options.view);
    if (viewState) {
      viewState.rotationX = -90;
      this.setState({ viewState });
    }
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

  render() {
    const { data, options, replaceVariables, fieldConfig, eventBus } = this.props;

    return (
      <>
        {this.panelContext && (
          <PanelContextProvider value={this.panelContext}>
            <RootStoreProvider
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
