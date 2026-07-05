import { FullscreenWidget, CompassWidget, LoadingWidget } from '@deck.gl/widgets';
import {
  PositionTracker,
  StateTime,
  useFullscreenPortalBridge,
  getDeckWidgetSkin,
  LayerSwitcher,
  Menu,
} from '@mapgl/panel-core/components';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { css, keyframes } from '@emotion/css';
import { DataHoverEvent, GrafanaTheme2 } from '@grafana/data';
import { LegendDisplayMode, VizLegend, useStyles2, useTheme2, VizLegendItem } from '@grafana/ui';
import { observer } from 'mobx-react-lite';
import DeckGL from '@deck.gl/react';
import MapLibre, { AttributionControl } from '@vis.gl/react-maplibre';

import {
  useRootStore,
  genPrimaryLayers,
  expandTooltip,
} from '../utils';
import { Tooltip } from './Tooltips/Tooltip';
import { MyGeoJsonLayer, MyPathLayer, MyPolygonsLayer, getDimmedGraphLayers } from '@mapgl/panel-core/deckLayers';
import { toRGB4Array } from '@mapgl/panel-core/deckLayers/utils';
import {
  DARK_AUTO_HIGHLIGHT,
  LIGHT_AUTO_HIGHLIGHT,
  emptyBiCol,
  ANNOTS_LABEL,
  NS_SEPARATOR,
} from '@mapgl/panel-core/types/defaults';
import {
  type DeckLine,
  colTypes,
  type ViewState,
  type CommentsData,
  type ComFeature,
  type GraphBiFeatCol,
} from '@mapgl/panel-core/types';
import {
  getEdgesGeometry,
} from '@mapgl/panel-core/graph/utils';
import {
  getGraphComments,
  getGraphPositionRanges,
  getGraphVersion,
  type Graph
} from '@mapgl/panel-core/graph';
import { throttleTime } from 'rxjs';
import { Layer, MapView, OrbitView } from 'deck.gl';
import { BinaryPointFeature } from '@loaders.gl/schema';
import { selectGotoHandler, ThresholdEdgeChangeEvent } from '@mapgl/panel-core/utils';

class AutolayoutLoadingWidget extends LoadingWidget {
  onRedraw(): void {}
}

const Mapgl = ({ panel, annots, initMapRef, fieldConfig, source, options, data, replaceVariables, eventBus }) => {
  const HOVER_HIGHLIGHT_DELAY_MS = 100;
  const rootStore = useRootStore();
  const { pointStore, viewStore } = rootStore;
  const { setVisRefresh: setMobxLegendRefresh } = viewStore;

  const { isShowEdgeLegend, isShowLegend, isShowSwitcher } = options.common || {};
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
  const { isLogic, visLayers, graph } = panel;
  const hidePendingLogicLayout = isLogic && !panel.layoutReady && !panel.layoutDisplayReady;
  const graphVersion = getGraphVersion(graph);
  const clusters = Array.from(graph.subgraphsBreadthFirst()) as Graph[];
  const graphs: Graph[] = [graph as Graph].concat(clusters);

  // isRouted is the only 'layer' that is active even in indeterminate state
  const [isRouted = false] = visLayers.getVisState(null, colTypes.Routed, colTypes.Routed) ?? [];

  const mapLibreRef: any = useRef(null);

  const deckRef = useRef(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { fullscreenContainer } = useFullscreenPortalBridge(containerRef);

  const [visRefresh, setVisRefresh] = useState(1);
  const [hoverInfo, setHoverInfo] = useState({});
  const [layers, setLayers] = useState<Layer[]>([]);
  const [localViewState, setLocalViewState] = useState<ViewState>(getViewState);
  const timeZone = replaceVariables('$__timezone');
  const [time, setTime] = useState<any>(data.timeRange?.to.unix() * 1000);
  const [edgeLegend, setEdgeLegend] = useState<VizLegendItem[]>([]);
  const hasAnnots = !!data.annotations?.length;
  const layerCount = panel.layers.length;

  const lineFeaturesRef = useRef<Record<string, DeckLine[]>>({});
  const svgTintRefreshFrameRef = useRef<number | null>(null);
  const hoverHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    panel.refreshRuntimeSubscriptions({
      time,
      annotationTables: annots,
      annotationGraphs: graphs,
      annotationBuffer: panel.annots,
    });
  }, [time, annots]);

  useEffect(() => {
    setTime(getTime);
  }, [getTime]);

  useEffect(() => {
    const edgeThres: VizLegendItem[] = [];

    const thresholds = fieldConfig.defaults.thresholds;
    thresholds?.steps?.forEach((s, i) =>
      edgeThres.push({
        color: theme2.visualization.getColorByName(s.color),
        label: [null, undefined, -Infinity].includes(s.value) ? '-Inf' : s.value,
        yAxis: 1,
        disabled: false,
      })
    );

    setEdgeLegend(edgeThres);
  }, [panel.layers]);

  useEffect(() => {
    const sub0 = eventBus
      .getStream(DataHoverEvent)
      .pipe(throttleTime(50))
      .subscribe({
        next: (event) => {
          const time = event.payload?.point?.time;
          if (time) {
            // && !getGroupsLegend?.at(-1)?.disabled) {
            setTime(time);
          }
        },
      });

    const sub1 = eventBus.subscribe(ThresholdEdgeChangeEvent, (evt) => {
      if (evt.payload?.thresholds) {
        const arr: VizLegendItem[] = [];
        evt.payload.thresholds?.forEach((s, i) =>
          arr.push({
            color: theme2.visualization.getColorByName(s.color),
            label: [null, undefined, -Infinity].includes(s.value) ? '-Inf' : s.value,
            yAxis: 1,
            disabled: false,
          })
        );
        setEdgeLegend(arr);
      }
    });

    return () => {
      sub0.unsubscribe();
      sub1.unsubscribe();
    };
  }, [eventBus]);

  useEffect(() => {
    return () => {
      if (svgTintRefreshFrameRef.current !== null) {
        cancelAnimationFrame(svgTintRefreshFrameRef.current);
      }
      if (hoverHighlightTimeoutRef.current !== null) {
        clearTimeout(hoverHighlightTimeoutRef.current);
      }
    };
  }, []);

  const onMapLoad = useCallback(() => {
    initMapRef(deckRef);
  }, []);

  const onSvgIconReady = useCallback(() => {
    if (svgTintRefreshFrameRef.current !== null) {
      return;
    }

    svgTintRefreshFrameRef.current = requestAnimationFrame(() => {
      svgTintRefreshFrameRef.current = null;
      setVisRefresh((refresh) => refresh + 1);
    });
  }, []);

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

  const onDeckHover = useCallback(
    (info: any) => {
      setHoverInfo(info);

      if (hoverHighlightTimeoutRef.current !== null) {
        clearTimeout(hoverHighlightTimeoutRef.current);
        hoverHighlightTimeoutRef.current = null;
      }

      if (!info?.picked) {
        return;
      }

      hoverHighlightTimeoutRef.current = setTimeout(() => {
        hoverHighlightTimeoutRef.current = null;
        setFocusedNodeFromPickingInfo(info);
      }, HOVER_HIGHLIGHT_DELAY_MS);
    },
    [setFocusedNodeFromPickingInfo]
  );

  const layerProps = {
    //<editor-fold desc="layerProps">
    ...dataClickProps,
    theme2,
    graph: panel.graph,
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
    flushSync(() => {
      if (!getViewState) {
        return;
      }
      const { longitude, latitude } = getViewState;
      setLocalViewState(getViewState);
      setSelCoord({ type: 'Point', coordinates: [longitude, latitude] });
    });
  }, [getViewState]);

  /// init render

  const getLayers = () => {
    const secLayers: any = [];

    const secDataLayers = panel.layers
      .slice(1)
      .filter((el) => el.layer.colType !== colTypes.Markers && el.layer.features?.length);
    let poly = 0,
      path = 0,
      geojson = 0;
    !isLogic &&
      secDataLayers.forEach((l) => {
        const features = l.layer.features;
        const { name, isShowTooltip } = l.options;
        const pickable = !!isShowTooltip;
        switch (l.options.type) {
          case colTypes.Polygons:
            secLayers.push(
              MyPolygonsLayer({
                ...layerProps,
                pickable,
                name,
                index: poly,
                data: features,
              })
            );
            poly++;
            break;
          case colTypes.Path:
            secLayers.push(
              MyPathLayer({
                ...layerProps,
                pickable,
                name,
                index: path,
                data: features,
                type: 'path',
              })
            );
            path++;
            break;
          case colTypes.GeoJson:
            const featCollection = {
              type: 'FeatureCollection',
              features,
            };
            secLayers.push(
              MyGeoJsonLayer({
                ...layerProps,
                pickable,
                name,
                index: geojson,
                data: featCollection,
              })
            );
            geojson++;
            break;
        }
      });

    let initComments: CommentsData = {};
    const edgesGeometry = hidePendingLogicLayout ? [{}, {}] : getEdgesGeometry(panel);
    const initLineFeatures: any = isRouted ? edgesGeometry[0] : edgesGeometry[1];
    lineFeaturesRef.current = initLineFeatures ?? {};
    refreshGraphHighlighter();

    if (!isLogic) {
      for (const subGraph of graphs) {
        const comments = getGraphComments(subGraph);
        if (Object.keys(comments).length) {
          initComments = { ...initComments, ...comments };
        }
      }
    }

    let counter = 0;
    const commentFeatures: ComFeature[] = [];
    Object.entries(initComments)?.forEach(([edgeId, orderMap]) => {
      orderMap?.forEach((comment) => {
        const { edge, text, iconColor, style, graph, layerName, locName, coords, index } = comment;
        if (edge && text && iconColor && coords) {
          commentFeatures.push({
            type: 'Feature',
            id: counter,
            edgeId: edge.id,
            comId: [edgeId, index].join('|'),
            geometry: {
              type: 'Point',
              coordinates: coords,
            },
            properties: {
              text,
              layerName,
              graph,
              isComment: true,
              locName,
              index,
              iconColor,
              style,
            },
          });
          counter++;
        }
      });
    });

    /// Graphs nodes

    const { groupIndices, annots } = panel;
    const visNamespaces = visLayers.getCategories()[1];
    const biCols: GraphBiFeatCol[] = hidePendingLogicLayout
      ? []
      : graphs
          .filter((g) => visNamespaces.includes(g.id))
          .sort((a, b) => {
            const lenA = a.id.split(NS_SEPARATOR).length;
            const lenB = b.id.split(NS_SEPARATOR).length;
            return lenA - lenB;
          })
          .map((g, i) => {
            const { colors, muted, annots } = panel;

            const positionRanges = getGraphPositionRanges(g);
            const { features } = panel;

            if (!features?.length) {
              return null;
            }

            // Concatenate all the sliced chunks into one new Float64Array
            const totalCount = positionRanges.reduce((sum, [start, endExclusive]) => sum + (endExclusive - start), 0);

            const cutPositions = new Float64Array(totalCount * 2);
            const cutColors: Uint8Array = new Uint8Array(totalCount * 4);
            const cutMuted: Uint8Array = new Uint8Array(totalCount * 4);
            const cutAnnots: Uint8Array = new Uint8Array(totalCount * 4);
            const cutGroupIndices: Uint8Array = new Uint8Array(totalCount);
            let offset = 0;

            const featureIds = { value: new Uint16Array(totalCount), size: 1 };
            const globalFeatureIds = { value: new Uint32Array(totalCount), size: 1 };

            for (let [start, end] of positionRanges) {
              if (!end) {
                end = start;
              }
              cutPositions.set(panel.positions.subarray(start * 2, end * 2), offset * 2);
              cutColors.set(colors.subarray(start * 4, end * 4), offset * 4);
              cutMuted.set(muted.subarray(start * 4, end * 4), offset * 4);
              cutAnnots.set(annots.subarray(start * 4, end * 4), offset * 4);
              cutGroupIndices.set(groupIndices.subarray(start, end), offset);

              for (let i = start; i < end; i++) {
                globalFeatureIds.value[offset] = offset;
                featureIds.value[offset++] = i; // `i` is your global index
              }
            }

            const biColors = hasAnnots && !getGroupsLegend.at(-1)?.disabled ? cutAnnots : cutMuted;
            return {
              ...emptyBiCol,
              shape: 'binary-feature-collection',
              graph: g,
              groupIndices,
              annots,
              points: {
                type: 'Point',
                positions: { value: cutPositions, size: 2 },
                attributes: {
                  getFillColor: { value: biColors, size: 4, normalized: true },
                  getColor: { value: cutColors, size: 4, normalized: true }, /// label use no opacity
                },
                featureIds,
                globalFeatureIds,
                numericProps: {},
                properties: features,
                // numericProps: {  /// for points it can be derived from index, for lines - datarecord has other rowIndex, considering multiple edges
                // rowIndex: {value: featureIds, size: 1},
                // },
              } as unknown as BinaryPointFeature,
            } as GraphBiFeatCol;
          })
          .filter((el): el is GraphBiFeatCol => el !== null);

    const res = genPrimaryLayers({
      layerProps,
      biCols,
      lineFeatures: initLineFeatures,
      commentFeatures,
    });

    const [bboxes, icons, arcsBase, lines, comments, edgeLabels] = res;

    const nextLayers = [
      ...secLayers,
      ...bboxes,
      ...arcsBase,
      ...lines,
      ...icons,
      ...(comments ? [comments] : []),
      ...edgeLabels,
    ].filter((el) => el !== null && el !== undefined);

    flushSync(() => {
      setLayers(nextLayers);
    });
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
  }, [graphVersion, getTooltipObject, time, getViewState, visRefresh]);

  const memoLayerSwitcher = useMemo(() => {
    return (
      <LayerSwitcher
        {...{
          theme: theme2,
          label: 'layers',
          className: '',
          panel,
          setVisRefresh,
        }}
      />
    );
  }, [visLayers]);

  const memoMenu = useMemo(() => {
    return <Menu eventBus={eventBus} {...{ options, data, panel, rootStore }} />;
  }, [options, panel.layers, graphVersion, data, rootStore]);

  const memoPositionTracker = useMemo(() => {
    return (
      <div className={s.timeNcoords}>
        {!!getGroupsLegend?.find((el) => el.label === ANNOTS_LABEL) && <StateTime time={time} />}
        {!isLogic && <PositionTracker isLogic={panel.isLogic} selectedCoord={getSelCoord} />}
      </div>
    );
  }, [getSelCoord, time, getGroupsLegend]);

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

  const memoEdgeLegend = useMemo(() => {
    if (!edgeLegend?.length) {
      return null;
    }

    return (
      <div className={s.edgeLegend}>
        <VizLegend
          className={s.compactLegend}
          displayMode={LegendDisplayMode.List}
          placement="bottom"
          items={edgeLegend}
        />
      </div>
    );
  }, [edgeLegend]);

  const memoLegend = useMemo(() => {
    if (!getGroupsLegend?.length) {
      return null;
    }

    return (
      <div className={s.nodesLegend}>
        <VizLegend
          className={s.compactLegend}
          displayMode={LegendDisplayMode.List}
          placement="bottom"
          items={getGroupsLegend.filter(
            (item, i) => item.data.hasNodes || (hasAnnots && i === getGroupsLegend.length - 1)
          )}
          onLabelClick={(item) => onLabelClick(item)}
        />
      </div>
    );
  }, [getGroupsLegend, hasAnnots]);

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
    <div className={s.container} ref={containerRef}>
      <DeckGL
        widgets={widgets}
        views={views}
        ref={deckRef}
        layers={renderedLayers}
        initialViewState={deckViewState}
        controller={{
          dragMode: 'pan',
          dragRotate: !isLogic,
          doubleClickZoom: false,
          scrollZoom: { smooth: false, speed: 0.005 },
          inertia: true,
        }}
        onClick={(info) => expandTooltip(info, panel, eventBus, panel.map, dataClickProps, selectGotoHandler)}
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

      <Tooltip
        data={data}
        panel={panel}
        time={time}
        eventBus={eventBus}
        isRouted={isRouted}
        info={hoverInfo}
        setHoverInfo={setHoverInfo}
        dataLayers={options.dataLayers}
      />

      {(isShowEdgeLegend || isShowLegend) && (
        <div className={s.legendStack}>
          {isShowEdgeLegend && !isRouted && memoEdgeLegend}
          {isShowLegend && memoLegend}
        </div>
      )}

      {!panel.layoutInProgress && memoMenu}
      {memoPositionTracker}
      {isShowSwitcher && memoLayerSwitcher}
    </div>
  );
};

export default observer(Mapgl);

const layoutLoadingSpin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const getStyles = (theme: GrafanaTheme2) => ({
  page: css`
    padding: ${theme.spacing(3)};
    background-color: ${theme.colors.background.secondary};
    display: flex;
    justify-content: center;
  `,
  container: css`
    .maplibregl-ctrl-attrib-button {
      display: none;
    }
    background-color: ${theme.colors.background.secondary};
  `,
  fullscreen: css`
    z-index: ${theme.zIndex.dropdown};
    position: absolute;
    top: ${theme.spacing(1)};
    right: ${theme.spacing(1)};
    ${getDeckWidgetSkin(theme)}
  `,
  compass: css`
    z-index: ${theme.zIndex.dropdown};
    position: absolute;
    top: calc(${theme.spacing(1)} + var(--button-size, ${theme.spacing(3.5)}) + ${theme.spacing(1.5)});
    right: ${theme.spacing(1)};
    ${getDeckWidgetSkin(theme)}
  `,
  layoutLoading: css`
    z-index: ${theme.zIndex.dropdown};
    position: absolute;
    top: ${theme.spacing(1)};
    left: ${theme.spacing(1)};
    ${getDeckWidgetSkin(theme)}

    button.deck-widget-spinner {
      cursor: default;
    }

    button.deck-widget-spinner .deck-widget-icon {
      animation: ${layoutLoadingSpin} 1s linear infinite;
      mask: url("data:image/svg+xml,%3Csvg%20viewBox%3D'0%200%2024%2024'%20xmlns%3D'http://www.w3.org/2000/svg'%20fill%3D'none'%20stroke%3D'black'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpath%20d%3D'M21%2012a9%209%200%201%201-6.219-8.56'%2F%3E%3C%2Fsvg%3E") center / 70% 70% no-repeat;
      -webkit-mask: url("data:image/svg+xml,%3Csvg%20viewBox%3D'0%200%2024%2024'%20xmlns%3D'http://www.w3.org/2000/svg'%20fill%3D'none'%20stroke%3D'black'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpath%20d%3D'M21%2012a9%209%200%201%201-6.219-8.56'%2F%3E%3C%2Fsvg%3E") center / 70% 70% no-repeat;
    }
  `,
  layerSwitcher: css`
    z-index: ${theme.zIndex.dropdown};
    position: absolute;
    top: ${theme.spacing(7)};
    left: 0;

    overflow: hidden;
    pointer-events: all;
  `,
  legendStack: css`
    z-index: ${theme.zIndex.dropdown};
    position: absolute;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    pointer-events: none;
  `,
  edgeLegend: css`
    pointer-events: all;
    background: ${theme.colors.background.secondary};
  `,
  nodesLegend: css`
    padding-bottom: ${theme.spacing(0.5)};
    pointer-events: all;
    background: ${theme.colors.background.secondary};
  `,
  compactLegend: css`
    & > div {
      padding: ${theme.spacing(0.25)} ${theme.spacing(0.375)};
      gap: ${theme.spacing(0.25)} ${theme.spacing(0.75)};
    }

    & ul {
      display: flex;
      align-items: center;
      gap: ${theme.spacing(0.25)};
    }

    & li > span {
      padding-right: ${theme.spacing(0.5)};
      font-size: calc(${theme.typography.bodySmall.fontSize} * 1);
      line-height: 1.1;
    }

    & button {
      font-size: inherit;
      line-height: 1.1;
    }

    & svg {
      width: ${theme.spacing(1.5)};
      height: ${theme.spacing(1.5)};
    }
  `,
  timeNcoords: css`
    position: absolute;
    z-index: ${theme.zIndex.dropdown};
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    font-size: calc(${theme.typography.bodySmall.fontSize} * 0.85);
    line-height: 1;
    top: ${theme.spacing(1)};
    right: calc(${theme.spacing(1)} + var(--button-size, ${theme.spacing(3.5)}) + ${theme.spacing(1)});
    white-space: nowrap;
    pointer-events: all;
  `,
});
