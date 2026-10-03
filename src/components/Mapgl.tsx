import { resolvePickingFocus } from '@vaduga/mapgl-core/runtime';
import { LayerSwitcher, MapglViewport } from '@vaduga/mapgl-core/components';
import { getStyles } from '@vaduga/mapgl-core/render';
import { Menu, Tooltip, GraphFrameDiagnostics } from '@vaduga/mapgl-grafana-adapter/components';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { observer } from 'mobx-react-lite';
import type { DeckGLRef } from '@deck.gl/react';

import { genPrimaryLayers, expandTooltip } from '../utils';
import { useRootStore } from '@vaduga/mapgl-core/store';
import { getDimmedGraphLayers } from '@vaduga/mapgl-core/deckLayers';
import { toRGB4Array } from '@vaduga/mapgl-core/deckLayers/utils';
import { DARK_AUTO_HIGHLIGHT, LIGHT_AUTO_HIGHLIGHT } from '@vaduga/mapgl-core/types/defaults';
import { colTypes, type ViewState, type ComFeature } from '@vaduga/mapgl-grafana-adapter/types';
import { getEdgesGeometry } from '@vaduga/mapgl-core/graph/utils';
import { getGraphVersion, type Graph } from '@vaduga/mapgl-core/graph/main';
import { Layer } from '@deck.gl/core';
import { selectGotoHandler } from '@vaduga/mapgl-grafana-adapter/utils';
import {
  buildGraphBinaryCollections,
  useNodeLegendClick,
  buildSecondaryLayers,
  composeRenderLayers,
  getThemeVariables,
  LegendStack,
  PositionStatus,
  useDelayedHover,
  useLatestRenderCommit,
  useEventState,
  createGroupLegend,
  useSvgIconRefresh,
  useFullscreenPortalBridge,
  getMapLibreAssets,
} from '@vaduga/mapgl-grafana-adapter/render';
import { GraphDomObservability } from './GraphDomObservability';

const Mapgl = ({
  panel,
  subscriptions,
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
  const { setVisRefresh: setMobxLegendRefresh } = rootStore.viewStore;

  const { hideDiagnostics, isShowEdgeLegend, isShowLegend, isShowSwitcher } = options.common || {};
  const s = useStyles2(getStyles);
  const theme2 = useTheme2();
  const themeVars = useMemo(() => getThemeVariables(theme2), [theme2]);
  const { getTooltipObject, setSelCoord, setTooltipObject, getSelCoord } = pointStore;
  const { getSelectedNode, getSelectedIdxs, getSelEdges, refreshGraphHighlighter, isDefDir } = rootStore.pointStore;

  const { getViewState } = rootStore.viewStore;
  const { isLogic } = panel;
  const visLayers = panel.scene.visibility;
  const graphRuntime = panel.graphFrameRuntime;
  const committedRender = panel.scene.render;
  const graph = committedRender.graph;
  const getGroupsLegend = createGroupLegend(
    graph,
    committedRender.groups,
    panel.scene.visibility.getActiveGroups(),
    Boolean(options.dataLayers.length),
    Boolean(data.annotations?.length)
  );
  const committedVersion = graphRuntime?.version ?? -1;
  const positions = committedRender.positions;
  const features = committedRender.features;
  const colors = committedRender.colors;
  const muted = committedRender.muted;
  const groupIndices = committedRender.groupIndices;
  const annotationColors = committedRender.annotations;
  const hidePendingLogicLayout = isLogic && !panel.scene.ready && !panel.scene.displayReady;
  const graphVersion = getGraphVersion(graph);
  const clusters = Array.from(graph.subgraphsBreadthFirst()) as Graph[];
  const graphs: Graph[] = [graph as Graph].concat(clusters);

  // isRouted is the only 'layer' that is active even in indeterminate state
  const [isRouted = true] = visLayers.getVisState(null, colTypes.Routed, colTypes.Routed) ?? [];

  const deckRef = useRef<DeckGLRef | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { fullscreenContainer } = useFullscreenPortalBridge(containerRef);

  const [visRefresh, setVisRefresh] = useState(1);
  const [hoverInfo, setHoverInfo] = useState({});
  const [layers, setLayers] = useState<Layer[]>([]);
  const [localViewState, setLocalViewState] = useState<ViewState>(getViewState);
  const { time, edgeLegend } = useEventState({
    data,
    subscriptions,
    eventBus,
    fieldConfig,
    theme: theme2,
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
      annotationBuffer: panel.scene.render.annotations,
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

  const focusHoveredElement = useDelayedHover((info) => {
    rootStore.pointStore.focus(resolvePickingFocus(panel.scene, info));
  });
  const onDeckHover = useCallback(
    (info: any) => {
      setHoverInfo(info);
      focusHoveredElement(info);
    },
    [focusHoveredElement, setHoverInfo]
  );

  const layerProps = {
    //<editor-fold desc="layerProps">
    ...dataClickProps,
    theme2,
    isDark: theme2.isDark,
    textColor: theme2.colors.text.primary,
    featureServices: panel.featureServices,
    usesRendererNamespaceFiltering: panel.scene.projection?.rendererFiltering !== 'none',
    layoutGeometry: {
      curveGroups: panel.scene.render.curveGroups,
      edgeKeys: panel.scene.render.edgeKeys,
      edgeIndexes: panel.scene.render.edgeIndexes,
      edgeOffsetStrategies: panel.featureServices.edgeOffsetStrategies,
    },
    overlayEnabled: hasAnnots && !getGroupsLegend?.at(-1)?.disabled,
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

  const focusRevision = rootStore.pointStore.getFocusRevision;
  const hasFocusHighlight = rootStore.pointStore.getHasFocusHighlight;
  const canDimGraph = hasFocusHighlight && (isLogic || (!isLogic && !isRouted));

  const renderedLayers = useMemo(() => {
    return (
      canDimGraph
        ? getDimmedGraphLayers(layers, {
            connectedNodeIds: rootStore.pointStore.getFocusedConnectedNodeIds,
            connectedEdgeIndexes: rootStore.pointStore.getFocusedConnectedEdgeIndexes,
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
    const edgesGeometry = hidePendingLogicLayout
      ? [{}, {}]
      : getEdgesGeometry({
          graph,
          edgeIndex: committedRender.edgeIndex,
          positions,
          isLogic,
          visibleNamespaces: visLayers.getVisibleNamespaces(),
          layerShift: panel.scene.layerShift,
          projection: panel.scene.projection,
          layout: committedRender,
          layoutReady: panel.scene.ready || panel.scene.displayReady,
          layoutIncludesProjection: panel.scene.layoutIncludesProjection,
          snapshot: graphRuntime?.snapshot,
          resolveRoute: panel.graphRouteProvider ? (edge) => panel.graphRouteProvider.getEdgeRoute(edge) : undefined,
          edgeOffsetStrategies: panel.featureServices.edgeOffsetStrategies,
          terminalGeometryStrategies: panel.featureServices.projectedTerminalGeometryStrategies,
        });
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
  }, [graphVersion, committedVersion, getTooltipObject, getSelectedNode, time, getViewState, visRefresh]);

  const memoLayerSwitcher = useMemo(() => {
    return (
      <LayerSwitcher
        {...{
          label: 'layers',
          className: '',
          bindings: {
            visibility: visLayers,
            readComments: () => panel.scene.render.commentFeatures,
            setVisibility: (layer, visible, style) => panel.setVisibility(layer, visible, style),
          },
          commentFeatures: panel.scene.render.commentFeatures,
          setVisRefresh,
        }}
      />
    );
  }, [visLayers, panel.scene.render.commentFeatures]);

  const memoMenu = useMemo(() => {
    return <Menu graph={graph} panelId={panel.props.id} eventBus={eventBus} {...{ options, data, panel, rootStore }} />;
  }, [options, panel.layers, graphVersion, data, rootStore]);

  const onLabelClick = useNodeLegendClick({
    visLayers,
    hasAnnots,
    getGroupsLegend,
    setVisRefresh,
    setMobxLegendRefresh,
  });

  ///// return
  return (
    <GraphDomObservability
      className={isLogic ? s.container : `${s.container} ${s.geoContainer}`}
      style={themeVars}
      colors={colors}
      edgeRevision={committedVersion + graphVersion}
      features={features}
      graphs={graphs}
      isRouted={isRouted}
      layoutDirection={options.basemap?.config?.layoutDirection}
      nodes={panel.graphFrameInstanceState.snapshot?.nodes}
      phase={panel.scene.view.phase}
      summary={panel.scene.view.summary}
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
      <MapglViewport
        mapLibreAssets={getMapLibreAssets()}
        {...{ isLogic, localViewState, fullscreenContainer, deckRef, renderedLayers, source, onMapLoad }}
        layoutInProgress={panel.scene.pending}
        classes={s}
        onClick={(info) => expandTooltip(info, panel, eventBus, dataClickProps, selectGotoHandler)}
      />

      <div className={panel.scene.view.phase === 'empty' ? s.graphEmptyState : s.graphDiagnostics}>
        <GraphFrameDiagnostics state={panel.scene.view} editing={editing} hideDiagnostics={hideDiagnostics} />
      </div>

      <Tooltip
        panelId={panel.props.id}
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

      {!panel.scene.pending && memoMenu}
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
