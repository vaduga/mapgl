import { LayerSwitcher, MapglViewport } from '@vaduga/mapgl-core/components';
import { getStyles, buildSecondaryLayers, useDelayedHover, useSvgIconRefresh } from '@vaduga/mapgl-core/render';
import { usePanelRenderSession } from '@vaduga/mapgl-core/render/react';
import type { DisplayedRenderFrame, PanelRenderOptions, PanelRenderSession } from '@vaduga/mapgl-core/render/session';
import { Menu, Tooltip, GraphFrameDiagnostics, RenderDiagnostics } from '@vaduga/mapgl-grafana-adapter/components';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { observer } from 'mobx-react-lite';
import type { DeckGLRef } from '@deck.gl/react';

import { expandTooltip } from '../utils';
import { useRootStore } from '@vaduga/mapgl-core/store';
import { colTypes, type ViewState, type ComFeature } from '@vaduga/mapgl-grafana-adapter/types';
import { getGraphVersion, type Graph } from '@vaduga/mapgl-core/graph/main';
import { selectGotoHandler } from '@vaduga/mapgl-grafana-adapter/utils';
import {
  useNodeLegendClick,
  getThemeVariables,
  LegendStack,
  PositionStatus,
  useEventState,
  createGroupLegend,
  useFullscreenPortalBridge,
  getMapLibreAssets,
  secondaryRenderDescriptors,
  grafanaRenderPresentation,
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

  const { hideDiagnostics, isShowEdgeLegend, isShowLegend, isShowSwitcher } = options.common || {};
  const s = useStyles2(getStyles);
  const theme2 = useTheme2();
  const themeVars = useMemo(() => getThemeVariables(theme2), [theme2]);
  const { getTooltipObject, setSelCoord, setTooltipObject, getSelCoord } = pointStore;
  const { getSelectedNode, isDefDir } = rootStore.pointStore;

  const { getViewState } = rootStore.viewStore;
  const { isLogic } = panel;
  const visLayers = panel.scene.visibility;
  const graphRuntime = panel.graphFrameRuntime;
  const committedRender = panel.scene.render;
  const graph = committedRender.graph;
  const activeGroups = visLayers.getActiveGroups();
  const getGroupsLegend = useMemo(
    () =>
      createGroupLegend(
        graph,
        committedRender.groups,
        activeGroups,
        Boolean(options.dataLayers.length),
        Boolean(data.annotations?.length)
      ),
    [graph, committedRender.groups, visLayers, activeGroups, options.dataLayers.length, data.annotations?.length]
  );
  const committedVersion = graphRuntime?.version ?? -1;
  const features = committedRender.features;
  const colors = committedRender.colors;
  const graphVersion = getGraphVersion(graph);
  const clusters = Array.from(graph.subgraphsBreadthFirst()) as Graph[];
  const graphs: Graph[] = [graph as Graph].concat(clusters);

  // isRouted is the only 'layer' that is active even in indeterminate state
  const [isRouted = true] = visLayers.getVisState(null, colTypes.Routed, colTypes.Routed) ?? [];

  const deckRef = useRef<DeckGLRef | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { fullscreenContainer } = useFullscreenPortalBridge(containerRef);

  const [hoverInfo, setHoverInfo] = useState({});
  const [localViewState, setLocalViewState] = useState<ViewState>(getViewState);
  const { time, edgeLegend } = useEventState({
    data,
    subscriptions,
    eventBus,
    fieldConfig,
    theme: theme2,
  });
  const hasAnnots = !!data.annotations?.length;

  useEffect(() => {
    if (!hasAnnots) {
      return;
    }

    const annotationGeneration = panel.scene.version;
    const annotationBuffer = panel.scene.render.annotations.slice();
    panel.refreshRuntimeSubscriptions({
      time,
      annotationTables: annots,
      annotationGraphs: graphs,
      annotationBuffer,
      onAnnotationsApplied: () => panel.scene.update({ annotations: annotationBuffer.slice() }, annotationGeneration),
    });
  }, [time, annots, committedVersion, hasAnnots]);

  const onMapLoad = useCallback(() => {
    initMapRef(deckRef);
  }, []);

  const onSvgIconReady = useSvgIconRefresh(() => panel.scene.invalidatePresentation());

  useEffect(() => {
    if (isLogic && !source) {
      initMapRef(deckRef);
    }
  }, [isLogic]);

  const rendererRef = useRef<PanelRenderSession | undefined>(undefined);
  const dataClickProps = {
    //<editor-fold desc="dataClickProps">
    pId: panel.pId,
    readRenderFrame: (): DisplayedRenderFrame | undefined => rendererRef.current?.frame,
    setSelCoord,
    isDefDir,
    setTooltipObject,
    setLocalViewState,
    setHoverInfo,
    getTooltipObject,
    //</editor-fold>
  };

  const focusHoveredElement = useDelayedHover((info) => {
    rootStore.pointStore.focus(rendererRef.current?.resolvePick(info));
  });
  const onDeckHover = useCallback(
    (info: any) => {
      setHoverInfo(info);
      focusHoveredElement(info);
    },
    [focusHoveredElement, setHoverInfo]
  );

  const renderPreparation = useMemo(
    () => ({
      boundaryProviders: panel.featureServices.namespaceBoundaryProviders,
      edgeOffsetStrategies: panel.featureServices.edgeOffsetStrategies,
      terminalGeometryStrategies: panel.featureServices.projectedTerminalGeometryStrategies,
    }),
    [panel]
  );
  const renderOptions = useMemo<PanelRenderOptions>(
    () => ({
      presentation: {
        ...grafanaRenderPresentation(
          theme2,
          isLogic,
          options.common?.isMeters,
          hasAnnots && !getGroupsLegend.at(-1)?.disabled
        ),
        onHover: onDeckHover,
        svgIconState: panel.svgIconState,
        onSvgIconReady,
      },
      preparation: renderPreparation,
      secondary: (input) =>
        buildSecondaryLayers(secondaryRenderDescriptors(isLogic, panel.layers), {
          ...dataClickProps,
          isDark: theme2.isDark,
          isMeters: options.common?.isMeters,
          getVisLayers: input.visibility,
          onHover: onDeckHover,
        }),
      onError: (error) => console.error(error),
    }),
    [
      panel,
      isLogic,
      hasAnnots,
      getGroupsLegend,
      onDeckHover,
      onSvgIconReady,
      renderPreparation,
      options,
      theme2,
      time,
      panel.layers,
      panel.svgIconState,
    ]
  );
  const {
    session: renderer,
    layers: renderedLayers,
    error: renderError,
  } = usePanelRenderSession(panel.controller, renderOptions);

  useEffect(() => {
    // Native event callbacks borrow this ref; commit-phase binding changes no render inputs.

    rendererRef.current = renderer;
  }, [renderer]);

  useEffect(() => {
    if (!getViewState) {
      return;
    }
    const { longitude, latitude } = getViewState;
    setLocalViewState(getViewState);
    setSelCoord({ type: 'Point', coordinates: [longitude, latitude] });
  }, [getViewState]);

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
        }}
      />
    );
  }, [visLayers, panel.scene.render.commentFeatures]);

  const memoMenu = useMemo(() => {
    return <Menu graph={graph} panelId={panel.props.id} eventBus={eventBus} {...{ options, data, panel, rootStore }} />;
  }, [options, panel.layers, graphVersion, data, rootStore]);

  const onLabelClick = useNodeLegendClick({
    scene: panel.scene,
    hasAnnots,
    getGroupsLegend,
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
        <RenderDiagnostics error={renderError} editing={editing} hidden={hideDiagnostics} />
        <GraphFrameDiagnostics state={panel.scene.view} editing={editing} hideDiagnostics={hideDiagnostics} />
      </div>

      <Tooltip
        tooltipReactionKey={panel.scene.renderRevision}
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
