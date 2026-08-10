import { FullscreenWidget, CompassWidget, LoadingWidget } from '@deck.gl/widgets';
import {
  useFullscreenPortalBridge,
  LayerSwitcher,
  Menu,
  Tooltip,
  GraphFrameDiagnostics,
} from '@mapgl/panel-core/components';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStyles2, useTheme2, type VizLegendItem } from '@grafana/ui';
import { observer } from 'mobx-react-lite';
import DeckGL from '@deck.gl/react';
import MapLibre, { AttributionControl } from '@vis.gl/react-maplibre';

import { useRootStore, genPrimaryLayers, expandTooltip } from '../utils';
import { getDimmedGraphLayers } from '@mapgl/panel-core/deckLayers';
import { toRGB4Array } from '@mapgl/panel-core/deckLayers/utils';
import { DARK_AUTO_HIGHLIGHT, LIGHT_AUTO_HIGHLIGHT, ANNOTS_LABEL } from '@mapgl/panel-core/types/defaults';
import { colTypes, type ViewState, type ComFeature } from '@mapgl/panel-core/types';
import { getEdgesGeometry } from '@mapgl/panel-core/graph/utils';
import { getGraphVersion, type Graph } from '@mapgl/panel-core/graph';
import { Layer, MapView, OrbitView } from 'deck.gl';
import { selectGotoHandler } from '@mapgl/panel-core/utils';
import {
  buildGraphBinaryCollections,
  buildSecondaryLayers,
  composeRenderLayers,
  getStyles,
  LegendStack,
  PositionStatus,
  useDelayedHover,
  useLatestRenderCommit,
  useEventState,
  useSvgIconRefresh,
} from '@mapgl/panel-core/render';
import { GraphDomObservability } from './GraphDomObservability';

class AutolayoutLoadingWidget extends LoadingWidget {
  onRedraw(): void {}
}

const Mapgl = ({
  panel,
  annots,
  initMapRef,
  fieldConfig,
  source,
  options,
  data,
  replaceVariables,
  eventBus,
  editing,
}) => {
  const rootStore = useRootStore();
  const { pointStore, viewStore } = rootStore;
  const { setVisRefresh: setMobxLegendRefresh } = viewStore;

  const { hideDiagnostics, isShowEdgeLegend, isShowLegend, isShowSwitcher } = options.common || {};
  const s = useStyles2(getStyles);
  const theme2 = useTheme2();
  const {
    //<editor-fold desc="store imports">
    getTooltipObject,
    setSelCoord,
    getSelectedNode,
    getSelectedIdxs,
    getSelEdges,
    setFocusedNodeFromPickingInfo,
    refreshGraphHighlighter,
    setTooltipObject,
    getSelCoord,
    isDefDir,
    //</editor-fold>
  } = pointStore;

  const { getViewState, getTime, getGroupsLegend } = viewStore;
  const { isLogic, visLayers } = panel;
  const graphRuntime = panel.graphFrameRuntime;
  const committedRender = graphRuntime?.render.state;
  const graph = committedRender?.graph ?? panel.graph;
  const committedVersion = graphRuntime?.version ?? -1;
  const positions = committedRender?.positions ?? panel.positions;
  const features = committedRender?.features ?? panel.features;
  const colors = committedRender?.colors ?? panel.colors;
  const muted = committedRender?.muted ?? panel.muted;
  const groupIndices = committedRender?.groupIndices ?? panel.groupIndices;
  const annotationColors = panel.annots ?? committedRender?.annotations;
  const hidePendingLogicLayout = isLogic && !panel.layoutReady && !panel.layoutDisplayReady;
  const graphVersion = getGraphVersion(graph);
  const clusters = Array.from(graph.subgraphsBreadthFirst()) as Graph[];
  const graphs: Graph[] = [graph as Graph].concat(clusters);

  // isRouted is the only 'layer' that is active even in indeterminate state
  const [isRouted = true] = visLayers.getVisState(null, colTypes.Routed, colTypes.Routed) ?? [];

  const mapLibreRef: any = useRef(null);

  const deckRef = useRef<DeckGLRef | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { fullscreenContainer } = useFullscreenPortalBridge(containerRef);

  const [visRefresh, setVisRefresh] = useState(1);
  const [hoverInfo, setHoverInfo] = useState({});
  const [layers, setLayers] = useState<Layer[]>([]);
  const [localViewState, setLocalViewState] = useState<ViewState>(getViewState);
  const { time, edgeLegend } = useEventState({
    eventBus,
    fieldConfig,
    theme: theme2,
    initialTime: getTime,
  });
  const hasAnnots = !!data.annotations?.length;
  const layerCount = panel.layers.length;

  useEffect(() => {
    if (!hasAnnots) {
      return;
    }

    panel.refreshRuntimeSubscriptions({
      time,
      annotationTables: annots,
      annotationGraphs: graphs,
      annotationBuffer: panel.annots,
      onAnnotationsApplied: () => setVisRefresh((refresh) => refresh + 1),
    });
  }, [time, annots, committedVersion, hasAnnots]);

  const onMapLoad = useCallback(() => {
    initMapRef(deckRef);
  }, []);

  const onSvgIconReady = useSvgIconRefresh(() => setVisRefresh((refresh) => refresh + 1));

  useEffect(() => {
    if (isLogic && !source) {
      initMapRef(deckRef);
    }
  }, [isLogic]);

  const dataClickProps = {
    //<editor-fold desc="dataClickProps">
    pId: panel.pId,
    setSelCoord,
    isDefDir,
    setTooltipObject,
    setLocalViewState,
    setHoverInfo,
    getTooltipObject,
    //</editor-fold>
  };

  const focusHoveredElement = useDelayedHover(setFocusedNodeFromPickingInfo);
  const onDeckHover = useCallback(
    (info: any) => {
      setHoverInfo(info);
      focusHoveredElement(info);
    },
    [focusHoveredElement]
  );

  const layerProps = {
    //<editor-fold desc="layerProps">
    ...dataClickProps,
    theme2,
    graph,
    panel,
    pickable: true,
    autoHighlight: !isLogic,
    highlightColor: toRGB4Array(theme2.isDark ? DARK_AUTO_HIGHLIGHT : LIGHT_AUTO_HIGHLIGHT, 1),
    onHover: onDeckHover, //!hoverInfo.objects &&
    hasAnnots,
    setVisRefresh,
    getSelectedNode,
    getSelectedIdxs,
    getSelEdges,
    time,
    options,
    svgIconState: panel.svgIconState,
    svgIconCache: panel.svgIconManager.cache,
    visRefresh,
    setHoverInfo,
    hoverInfo,
    onSvgIconReady,
    isRouted,
    getVisLayers: visLayers,
    getGroupsLegend,
    theme: theme2,
    baseLayer: panel.layers?.[0],
    isLogic,
    //</editor-fold>
  };

  const focusRevision = pointStore.getFocusRevision;
  const hasFocusHighlight = pointStore.getHasFocusHighlight;
  const canDimGraph = hasFocusHighlight && (isLogic || (!isLogic && !isRouted));

  const renderedLayers = useMemo(() => {
    return (
      canDimGraph
        ? getDimmedGraphLayers(layers, {
            connectedNodeIds: pointStore.getFocusedConnectedNodeIds,
            connectedEdgeIndexes: pointStore.getFocusedConnectedEdgeIndexes,
            isRouted,
          })
        : layers
    ).filter(Boolean);
  }, [layers, focusRevision, canDimGraph, pointStore, isRouted]);

  useEffect(() => {
    if (!getViewState) {
      return;
    }
    const { longitude, latitude } = getViewState;
    setLocalViewState(getViewState);
    setSelCoord({ type: 'Point', coordinates: [longitude, latitude] });
  }, [getViewState]);

  /// init render

  const commitLayerBuild = useLatestRenderCommit<Layer[]>(setLayers, (error) => console.error(error));
  const getLayers = () => {
    const secondary = buildSecondaryLayers({ isLogic, layers: panel.layers, layerProps });
    const edgesGeometry = hidePendingLogicLayout ? [{}, {}] : getEdgesGeometry(panel);
    const initLineFeatures: any = isRouted ? edgesGeometry[0] : edgesGeometry[1];
    refreshGraphHighlighter();

    const commentFeatures: readonly ComFeature[] = graphRuntime?.render.state.commentFeatures ?? [];

    const biCols = buildGraphBinaryCollections({
      graphs,
      visibleNamespaces: visLayers.getCategories()[1],
      features,
      positions,
      colors,
      muted,
      annotations: annotationColors,
      groupIndices,
      showAnnotations: hasAnnots && !getGroupsLegend.at(-1)?.disabled,
      hide: hidePendingLogicLayout,
    });
    const bundle = genPrimaryLayers({
      layerProps,
      biCols,
      lineFeatures: initLineFeatures,
      commentFeatures,
    });
    void commitLayerBuild(() => composeRenderLayers({ ...bundle, secondary }));
  };

  /// refresh selIds for edges
  useEffect(() => {
    selectGotoHandler({
      pId: panel.pId,
      value: getSelectedNode?.id,
      graphId: (getSelectedNode?.parent as Graph)?.id,
      eventBus,
      select: true,
      fly: false,
    });
  }, [isDefDir]);

  useEffect(() => {
    if (layerCount < 2) {
      return;
    }
    getLayers();
  }, [graphVersion, committedVersion, getTooltipObject, time, getViewState, visRefresh]);

  const memoLayerSwitcher = useMemo(() => {
    return (
      <LayerSwitcher
        {...{
          theme: theme2,
          label: 'layers',
          className: '',
          panel,
          commentFeatures: panel.commentFeatures,
          setVisRefresh,
        }}
      />
    );
  }, [visLayers, panel.commentFeatures]);

  const memoMenu = useMemo(() => {
    return <Menu eventBus={eventBus} {...{ options, data, panel, rootStore }} />;
  }, [options, panel.layers, graphVersion, data, rootStore]);

  const onLabelClick = useCallback(
    (clickItem: VizLegendItem) => {
      const active_indexes = visLayers.getActiveGroups();
      const allChecked = active_indexes.every((item) => item);

      let newStates;
      if (hasAnnots && clickItem.data?.rawLabel === ANNOTS_LABEL) {
        active_indexes[active_indexes.length - 1] = active_indexes[active_indexes.length - 1] ? 0 : 1;
        newStates = active_indexes;
      } else {
        const itemIdx = clickItem.data.groupIdx;
        const unCheck = !allChecked && itemIdx > -1 && active_indexes[itemIdx];

        newStates = active_indexes.map((item, i) => {
          if (hasAnnots && i === itemIdx) {
            return 1;
          }

          if (i === itemIdx) {
            return 1;
          } else {
            return unCheck ? 1 : 0;
          }
        });
      }

      visLayers.setActiveGroups(newStates);
      setVisRefresh(Math.random() + 1);
      setMobxLegendRefresh(Math.random() + 1);
    },
    [getGroupsLegend, visLayers]
  );

  const viewId = isLogic ? '3d-scene' : 'geo-view';
  const views = useMemo(
    () => [isLogic ? new OrbitView({ id: viewId, controller: true }) : new MapView({ id: viewId, controller: true })],
    [isLogic, viewId]
  );
  const deckViewState = useMemo(() => ({ [viewId]: localViewState }), [viewId, localViewState]);

  const widgets: any = [
    new FullscreenWidget({
      id: 'myfull',
      container: fullscreenContainer,
      placement: 'top-right',
      className: s.fullscreen,
    }),
  ];
  if (!isLogic) {
    widgets.push(
      new CompassWidget({
        id: 'compass',
        placement: 'top-right',
        className: s.compass,
      })
    );
  }
  if (panel.layoutInProgress) {
    widgets.push(
      new AutolayoutLoadingWidget({
        id: 'autolayout-loading',
        placement: 'top-left',
        className: s.layoutLoading,
        label: 'Calculating graph layout',
      })
    );
  }

  ///// return
  return (
    <GraphDomObservability
      className={s.container}
      colors={colors}
      edgeRevision={committedVersion + graphVersion}
      features={features}
      graphs={graphs}
      isRouted={isRouted}
      layoutDirection={options.basemap?.config?.layoutDirection}
      nodes={panel.graphFrameInstanceState.snapshot?.nodes}
      phase={panel.graphFrameView.phase}
      summary={panel.graphFrameView.summary}
      visibleNamespaces={visLayers.getCategories()[1]}
      ref={containerRef}
      onInspectNode={(index, feature) => {
        const pickingInfo = {
          picked: true,
          x: 16,
          y: 16,
          index,
          object: { index, rowIndex: feature?.rowIndex, properties: feature },
        };
        expandTooltip(pickingInfo, panel, eventBus, dataClickProps, selectGotoHandler);
        setHoverInfo({ ...pickingInfo, mapglPinned: true });
      }}
    >
      <DeckGL
        widgets={widgets}
        views={views}
        ref={deckRef}
        layers={renderedLayers}
        initialViewState={deckViewState}
        eventRecognizerOptions={{
          click: { interval: 0 },
        }}
        controller={{
          dragMode: 'pan',
          dragRotate: !isLogic,
          doubleClickZoom: false,
          scrollZoom: { smooth: false, speed: 0.005 },
          inertia: true,
        }}
        onClick={(info) => expandTooltip(info, panel, eventBus, dataClickProps, selectGotoHandler)}
        getCursor={(state) => (state.isHovering ? 'pointer' : 'grab')}
      >
        {!isLogic && (
          <MapLibre
            //reuseMaps // to enable, we need to rebind mapLibreRef everytime
            onLoad={onMapLoad}
            ref={mapLibreRef}
            mapStyle={source}
            attributionControl={false}
          >
            <AttributionControl
              style={{
                zIndex: theme2.zIndex.dropdown,
                position: 'absolute',
                right: theme2.spacing(0.5),
                bottom: theme2.spacing(0.5),
              }}
            />
          </MapLibre>
        )}
      </DeckGL>

      <div className={panel.graphFrameView.phase === 'empty' ? s.graphEmptyState : s.graphDiagnostics}>
        <GraphFrameDiagnostics state={panel.graphFrameView} editing={editing} hideDiagnostics={hideDiagnostics} />
      </div>

      <Tooltip
        data={data}
        panel={panel}
        time={time}
        eventBus={eventBus}
        isRouted={isRouted}
        info={hoverInfo}
        setHoverInfo={setHoverInfo}
        dataLayers={options.dataLayers}
        replaceVariables={replaceVariables}
      />

      <LegendStack
        edgeLegend={edgeLegend}
        nodeLegend={getGroupsLegend}
        hasAnnotations={hasAnnots}
        isRouted={isRouted}
        showEdgeLegend={isShowEdgeLegend}
        showNodeLegend={isShowLegend}
        onNodeLabelClick={onLabelClick}
        classes={s}
      />

      {!panel.layoutInProgress && memoMenu}
      <PositionStatus
        className={s.timeNcoords}
        groupsLegend={getGroupsLegend}
        time={time}
        isLogic={panel.isLogic}
        selectedCoord={getSelCoord}
      />
      {isShowSwitcher && memoLayerSwitcher}
    </GraphDomObservability>
  );
};

export default observer(Mapgl);
