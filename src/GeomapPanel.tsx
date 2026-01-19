import * as React from 'react';
import { Component } from 'react';
import {Subscription} from 'rxjs';
import {GrafanaTheme2, PanelData, PanelProps} from '@grafana/data';
import {config} from '@grafana/runtime';
import {PanelContext, PanelContextProvider, PanelContextRoot} from '@grafana/ui';
import {Options, MapLayerState, MapViewConfig} from './types';
import {defViewState, ViewState, LayerDragShift} from "mapLib/utils";
import {notifyPanelEditor} from "./utils/geomap_utils";
import {getActions} from "./utils/actions";
import Mapgl from "./components/Mapgl";
import {
    RootStoreProvider,
    fillAnnots,
    initGroups, genVisLayers, initBinaryProps,
    cutBinaryProps,
} from "./utils";
import {applyLayerFilter, initLayer} from './utils/layers';
import {ORTHO_BASEMAP_CONFIG} from "./layers/registry";
import {defaultMarkersConfig} from "./layers/data/markersLayer";
import {Map as MaplibreMap} from "@vis.gl/react-maplibre"
import { Graph, GeomGraph, BiColProps } from 'mapLib';
import {runLayout} from 'mapLib/utils';

import {initViewExtent} from "./utils/utils.map";
import {Deck} from "@deck.gl/core";

type Props = PanelProps<Options>;

interface State {
    viewState: ViewState;
    authReady: boolean;
    source: string | {} | undefined;
    hasYaScriptLoaded?: boolean;
    svgIcons?;
}

import {CMN_NAMESPACE, CMN_NAMESPACE_PREFIX} from 'mapLib/utils'
import {Rule} from "./editor/Groups/rule-types";
import {VisLayers} from "./store/visLayers";

export class GeomapPanel extends Component<Props, State> {
    private svgLoadController: AbortController | null = null;
    declare context: React.ContextType<typeof PanelContextRoot>;
    static contextType = PanelContextRoot;
    panelContext: PanelContext | undefined;
    private subs = new Subscription();

    pId: number | undefined;
    graph: Graph;
    visLayers: VisLayers | undefined;
    map?: Deck | undefined;
    layers: MapLayerState[] = [];
    locLabelName
    annotations
    svgIcons = {}
    isLogic = true
    hasAnnots = false;
    useMockData
    groups: Rule[] = []

    features: BiColProps[] = []
    positions: Float64Array = new Float64Array()
    muted = new Uint8Array()
    colors = new Uint8Array()
    annots = new Uint8Array()
    groupIndices = new Uint8Array()


    theme2: GrafanaTheme2 = config.theme2;
    readonly byName = new Map<string, MapLayerState>();

    constructor(props: Props) {
        super(props);
        const {options} = props
        const {jitterPoints, nsPrefix, locLabelName} = options.common || {}

        this.pId = props.id
        this.isLogic = !options.basemap || options.basemap.type === ORTHO_BASEMAP_CONFIG.type
        this.hasAnnots = !!props.data.annotations?.length

        const firstRun = !this.props.options.dataLayers?.length
        this.useMockData = this.isLogic && (firstRun || this.props.options.dataLayers?.every(el=> !el.locField))

        const rootGraph = new Graph(CMN_NAMESPACE, true, this.isLogic);
        // @ts-ignore
        new GeomGraph(rootGraph)
        this.graph = rootGraph

        // Default layer starter-values
        if (!options.dataLayers?.length) {
            options.dataLayers = [defaultMarkersConfig];
        }

        this.locLabelName = locLabelName
        this.state = {authReady: false, source: undefined, hasYaScriptLoaded: false, viewState: defViewState};

        this.panelContext = {
            onToggleSeriesVisibility: undefined,
            onSeriesColorChange: (v, c) => {
                const newOptions = {...this.props.options};
                const newFieldConfig = {...this.props.fieldConfig};
                const steps = newFieldConfig.defaults.thresholds?.steps
                steps?.forEach(t => {
                    const label = v === '-Inf' ? -Infinity : v
                    if (t.value === label) {
                        const color = this.theme2.visualization.getColorByName(c);
                        if (color) {
                            t.color = color; //hexToRgba(color);
                        }
                    }
                });
                this.props.eventBus?.publish({
                    type: 'edgeThresholdType',
                    payload: {thresholds: steps}
                });
                this.props.onOptionsChange(newOptions);
                this.props.onFieldConfigChange(newFieldConfig)
            }, graph: this.graph
        } as unknown as PanelContext;
    }

    async componentDidMount() {
        this.panelContext = {...this.context, ...this.panelContext};
        this.visLayers = new VisLayers()
        this.setState({authReady: true})
    }

    componentWillUnmount() {
        //console.log('willUnmount')
        this.graph?.disposeAutorun()
        this.graph.reset()
        for (const g of this.graph.graphs()) {
            this.graph?.disposeAutorun()
            g.reset()
        }
        this.map = undefined
        this.layers = []
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
        //console.log('did update')

        // Check for a difference between previous data and component data
        if (this.map && this.props.data !== prevProps.data) {
            this.dataChanged(this.props.data);
        }
    }

    /** This function will actually update the JSON model */
    doOptionsUpdate = async (selected: number) => {
        const {options, onOptionsChange} = this.props;

        const layers = this.layers;
        onOptionsChange({
            ...options,
            basemap: layers[0].options,
            dataLayers: layers.slice(1).map((v) => v.options),
        } as Options);

        this.dataChanged(this.props.data)
        notifyPanelEditor(this, layers, selected);
    }

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
                    viewState.rotationX = -90
                }
                this.setState({viewState})
            }
        }

    }

    /**
     * Called when PanelData changes (query results etc)
     */
    dataChanged = async (data: PanelData) => {
        // Only update if panel data matches component data
        if (data === this.props.data) {
            //console.log('dataChanged');
            this.svgLoadController?.abort();
            this.svgLoadController = new AbortController();

            this.groups = []
            this.features = []
            await initGroups(this.groups, this.layers, this.svgIcons, this.theme2, this.svgLoadController, true)

            if (this.locLabelName) {
                await (async () => {
                    this.annotations = await fillAnnots(this.locLabelName, data.annotations);
                })();
            }

            if (!this.layers.length) {return}
            for (const g of this.graph.graphs()) {
                g.resetNodes()
            }

            this.graph.reset()
            initBinaryProps(this);

            const d = {...this.props.data}
            this.layers.forEach(state => applyLayerFilter(state.handler, state.options, d, true))
            cutBinaryProps(this)

            this.layers.forEach(state => applyLayerFilter(state.handler, state.options, d, false))

            this.visLayers = genVisLayers(this, this.props)

            if (this.isLogic) {
                runLayout(this)
            }

        }

        const viewState = this.initMapView(this.props.options.view);
        if (viewState) {
            if (this.isLogic) {
                viewState.rotationX = -90
            }
            this.setState({viewState})
        }
    }

    initMapRef = async (deckRef) => {

        if (this.locLabelName) {
            await (async () => {
                this.annotations = await fillAnnots(this.locLabelName, this.props.data.annotations);
            })();
        }

        const {options} = this.props;
        this.byName.clear();
        const layers: MapLayerState[] = [];
        for (const g of this.graph.graphs()) {
            g.resetNodes()
        }
        this.graph.reset()
        initBinaryProps(this)

        try {
            const baseLayer = await initLayer(this, options.basemap ?? ORTHO_BASEMAP_CONFIG, true)
            layers.push(baseLayer);

            let layerIdx = 0
            for (const lyr of options.dataLayers) {
                const layerState = await initLayer(this, {...lyr}, false, layerIdx)
                layers.push(layerState);
                layerIdx++
            }

            const d = {...this.props.data}
            layers.forEach(state => applyLayerFilter(state.handler, state.options, d, true))
            cutBinaryProps(this)

            this.groups = []
            this.features = []
            this.svgLoadController?.abort();
            this.svgLoadController = new AbortController();
            await initGroups(this.groups, layers, this.svgIcons, this.theme2, this.svgLoadController)

            layers.forEach(state => applyLayerFilter(state.handler, state.options, d, false))

            this.layers = layers;

            if (this.isLogic) {
                runLayout(this)
             }


            this.visLayers = genVisLayers(this, this.props)

            const viewState = this.initMapView(options.view)
            if (viewState) {
                this.map = deckRef.current
                if (this.isLogic) {
                    viewState.rotationX = -90
                }
                this.setState({viewState})
            }

        notifyPanelEditor(this, layers, layers.length - 1);

        } catch (ex) {
            console.error('error loading layers', ex);
        }

    };


    initMapView = (config: MapViewConfig): ViewState | undefined => {
        let view = {
            id: config.id,
            longitude: 0,
            latitude: 0,
            zoom: config.zoom ?? 1,
            yZoom: config.zoom ?? 1 +1,
            target: [0,0, config.zoom ?? 1]
        }

        initViewExtent(view, config, this.props.width, this.props.height, this.layers, this.visLayers, this);
        return view;
    };


    render() {
        if (!this.state.authReady) {
            return <div>Authorizing…(F5,F12)</div>; // blocks other logic
        }


        const { data, options, replaceVariables, fieldConfig, eventBus } = this.props;

        return (
            <>
            {this.panelContext && <PanelContextProvider value={this.panelContext}>
            <RootStoreProvider props={{ panel: this, viewState: this.state.viewState, fieldConfig, replaceVariables, eventBus, data, options, }} >
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
                            data
                        }}/>
            </RootStoreProvider>
                </PanelContextProvider>}
            </>
        );
    }
}









