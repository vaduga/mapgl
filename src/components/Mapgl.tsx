import { FullscreenWidget, CompassWidget } from '@deck.gl/widgets';
import { getDeckWidgetSkin } from './deckWidgetSkin';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { css } from '@emotion/css';
import { DataHoverEvent, GrafanaTheme2 } from '@grafana/data';
import { LegendDisplayMode, VizLegend, useStyles2, useTheme2, VizLegendItem } from '@grafana/ui';
import { observer } from 'mobx-react-lite';
import DeckGL from '@deck.gl/react';
import MapLibre, { AttributionControl } from '@vis.gl/react-maplibre';

import type { Graph } from 'mapLib';

import Menu from '../components/Menu';
import { useRootStore, toRGB4Array, genPrimaryLayers, selectGotoHandler, expandTooltip } from '../utils';
import { Tooltip } from './Tooltips/Tooltip';
import { MyPolygonsLayer } from '../deckLayers/PolygonsLayer/polygons-layer';
import { MyGeoJsonLayer } from '../deckLayers/GeoJsonStaticLayer/static-geojson-layer';
import { MyPathLayer } from '../deckLayers/PathLayer/path-layer';
import { PositionTracker } from './Geocoder/PositionTracker';
import {
  DARK_AUTO_HIGHLIGHT,
  LIGHT_AUTO_HIGHLIGHT,
  ALERTING_STATES,
  emptyBiCol,
  ALERTING_NUMS,
  ANNOTS_LABEL,
  NS_SEPARATOR,
  ComFeature,
  colTypes, ViewState, sortAnnotations, CommentsData
} from 'mapLib/utils';
import { throttleTime } from 'rxjs';
import { StateTime } from './Geocoder/StateTime';
import { Layer, MapView, OrbitView } from 'deck.gl';
import LayerSwitcher from './Selects/LayerSwitcher';
import { BinaryFeatureCollection, BinaryPointFeature } from '@loaders.gl/schema';

import { ThresholdEdgeChangeEvent } from '../utils/bus.events';
import { useFullscreenPortalBridge } from './hooks/useFullscreenPortalBridge';

const Mapgl = ({ panel, annots, initMapRef, fieldConfig, source, options, data, replaceVariables, eventBus }) => {
  const { pointStore, viewStore } = useRootStore();
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
    setTooltipObject,
    setDrawerOpen,
    getSelCoord,
    getIsShowCenter,
    setIsShowCenter,
    //</editor-fold>
  } = pointStore;

  const { getViewState, getTime, getGroupsLegend } = viewStore;
  const { isLogic, visLayers, graph } = panel;
  const clusters = Array.from(graph.subgraphsBreadthFirst()) as Graph[];
  const graphs: Graph[] = [graph as Graph].concat(clusters);

  // isHyper is the only 'layer' that is active even in indeterminate state
  const [isHyper = false] = visLayers.getVisState(null, colTypes.Hyperedges, colTypes.Hyperedges) ?? [];

  const mapLibreRef: any = useRef(null);

  const deckRef = useRef(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { fullscreenContainer } = useFullscreenPortalBridge(containerRef);

  const [visRefresh, setVisRefresh] = useState(Math.random() + 1);
  const [hoverInfo, setHoverInfo] = useState({});
  const [layers, setLayers] = useState<Layer[]>([]);
  const [localViewState, setLocalViewState] = useState<ViewState>(getViewState);
  const timeZone = replaceVariables('$__timezone');
  const [time, setTime] = useState<any>(data.timeRange?.to.unix() * 1000);
  const [edgeLegend, setEdgeLegend] = useState<VizLegendItem[]>([]);
  const hasAnnots = !!data.annotations?.length;

  useEffect(() => {
    if (!time || !annots?.length) {
      return;
    }
    async function loadAnnots() {
      let newAnnots: any = [];
      const { op, escape } = await import('arquero');
      annots.forEach(([annotTable, annotByInstance]) => {
        const filteredTable = annotByInstance.filter(escape((row) => row.timeEnd <= time));
        const summary = filteredTable.rollup({
          timeEnd: op.max('timeEnd'),
          //rows: op.array_agg('index') // <-- aggregate row indices
        });
        const annots = annotTable
          .semijoin(summary) //.filter(escape((row,data) => row.timeEnd === op.max('timeEnd'))))
          .objects();
        if (annots.length) {
          newAnnots = newAnnots.concat(annots);
        }
      });

      graphs.forEach((s: any) => {
        newAnnots.forEach(({ alertName, instance, data, newState, timeEnd }) => {
          const nodeMap = s.nodeCollection.getNodeMap;
          const feature = nodeMap?.get(instance)?.data.feature;
          if (!feature) {
            return;
          }
          const newAnnot = { alertName, newState, instance, timeEnd, data };
          const all_annots = feature.all_annots;
          if ((all_annots?.length && all_annots?.length === annots.length) || !all_annots) {
            feature.all_annots = [newAnnot];
          } else if (all_annots) {
            feature.all_annots = [...all_annots, newAnnot];
          }
          feature.all_annots = sortAnnotations(feature.all_annots);
          const annotState = feature.all_annots?.[0]?.newState;
          const stateKey = Object.keys(ALERTING_STATES).find((st) => annotState?.startsWith(st));

          if (stateKey) {
            const [, , stateRGBArray] = ALERTING_NUMS[stateKey];
            const id = feature.id;
            panel.annots.set(stateRGBArray, id * 4);
          }
        });
      });
    }
    loadAnnots();
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

  const onMapLoad = useCallback(() => {
    initMapRef(deckRef);
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
    setIsShowCenter,
    setTooltipObject,
    setLocalViewState,
    setHoverInfo,
    setDrawerOpen,
    getTooltipObject,
    //</editor-fold>
  };

  const layerProps = {
    //<editor-fold desc="layerProps">
    ...dataClickProps,
    theme2,
    graph: panel.graph,
    panel,
    pickable: true,
    autoHighlight: true,
    highlightColor: toRGB4Array(theme2.isDark ? DARK_AUTO_HIGHLIGHT : LIGHT_AUTO_HIGHLIGHT, 1),
    onHover: setHoverInfo, //!hoverInfo.objects &&
    hasAnnots,
    setVisRefresh,
    getSelectedNode,
    getSelectedIdxs,
    getSelEdges,
    time,
    options,
    svgIcons: panel.svgIcons,
    setHoverInfo,
    hoverInfo,
    isHyper,
    getVisLayers: visLayers,
    getGroupsLegend,
    theme: theme2,
    baseLayer: panel.layers?.[0],
    isLogic,
    //</editor-fold>
  };

  const viewStateChanger = (c) => {
    flushSync(() => {
      const modView = {
        ...c.viewState,
        rotationX: -90,
      };
      setLocalViewState(modView);
    });
  };

  useEffect(() => {
    flushSync(() => {
      if (!getViewState) {
        return;
      }
      const { longitude, latitude } = getViewState;
      setLocalViewState(getViewState);
      setSelCoord({ type: 'Point', coordinates: [longitude, latitude] });
      setIsShowCenter(getViewState);
    });
  }, [getViewState]);

  /// init render

  const getLayers = () => {
    const secLayers: any = [];
    let newLayers: any = [];

    const secDataLayers = panel.layers
      .slice(1)
      .filter(el => el.layer.colType !== colTypes.Markers && el.layer.features?.length);
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

    newLayers = newLayers.concat(secLayers);

    let initComments: CommentsData = {};
    let initLineFeatures: any = isHyper ? graph.getEdgesGeometry[0] : graph.getEdgesGeometry[1];

    if (!isLogic) {
      for (const subGraph of graphs) {
        const getComments = subGraph.getComments;
        if (Object.keys(getComments).length) {
          initComments = { ...initComments, ...getComments };
        }
      }
    }

    let counter = 0;
    const commentFeatures: ComFeature[] = [];
    Object.entries(initComments)?.forEach(([edgeId, orderMap]) => {
      //@ts-ignore
      orderMap?.forEach((comment) => {
        const { edge, text, iconColor, style, root, layerName, locName, coords, index } = comment;
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
              // @ts-ignore
              root: root as Graph,
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
    const visNamespaces = visLayers.getCategories()
    // @ts-ignore
    const biCols: BinaryFeatureCollection & Array<{ layerName: string }> = graphs
      .filter((g) => visNamespaces.includes(g.id))
      .sort((a, b) => {
        const lenA = a.id.split(NS_SEPARATOR).length;
        const lenB = b.id.split(NS_SEPARATOR).length;
        return lenA - lenB;
      })
      .map((g, i) => {
        const { colors, muted, annots } = panel;

        const { positionRanges } = g;
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
            featureIds.value[offset++] = i; // `i` is your global index
          }
        }

        const biColors = hasAnnots && !getGroupsLegend.at(-1)?.disabled ? cutAnnots : cutMuted;
        return {
          ...emptyBiCol,
          opacity: 1,
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
            globalFeatureIds: featureIds,
            properties: features,
            // numericProps: {  /// for points it can be derived from index, for lines - datarecord has other rowIndex, considering multiple edges
            // rowIndex: {value: featureIds, size: 1},
            // },
          } as unknown as BinaryPointFeature,
        };
      })
      .filter((el) => el);

    async function prepLayers() {
      const res = await genPrimaryLayers({
        layerProps,
        biCols,
        lineFeatures: initLineFeatures,
        commentFeatures,
      });

      const [bboxes, icons, arcsBase, lines, comments, edgeLabels] = res;
      const icoLinesOrdered = [...bboxes, ...arcsBase, ...lines, ...icons];

      newLayers = newLayers.concat(icoLinesOrdered);

      if (comments) {
        newLayers.push(comments);
      }

      edgeLabels.forEach((l) => {
        newLayers.push(l);
      });

      flushSync(() => {
        setLayers(newLayers.filter((el) => el !== null && el !== undefined));
      });
    }
    prepLayers();
  };

  useEffect(() => {
    if (panel.layers.length < 2) {
      return;
    }
    getLayers();
  }, [graph.getVersion, getTooltipObject, time, getViewState, visRefresh]);

  const memoLayerSwitcher = useMemo(() => {
    return (
      <LayerSwitcher
        {...{ theme: theme2, label: 'layers', className: '', panel, setVisRefresh, setMobxLegendRefresh }}
      />
    );
  }, [visLayers]);

  const memoMenu = useMemo(() => {
    return <Menu eventBus={eventBus} {...{ options, time, timeZone, data, panel }} />;
  }, [options, panel.layers, graph.getVersion, data]);

  const memoPositionTracker = useMemo(() => {
    return (
      <div className={s.timeNcoords}>
        {!!getGroupsLegend?.find((el) => el.label === ANNOTS_LABEL) && <StateTime time={time} />}
        {!isLogic && <PositionTracker isLogic={panel.isLogic} />}
      </div>
    );
  }, [getSelCoord, time, getGroupsLegend]);

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
            (item, i) => item.data.count || (hasAnnots && i === getGroupsLegend.length - 1)
          )}
          onLabelClick={() => {}}
        />
      </div>
    );
  }, [getGroupsLegend]);

  const views = isLogic
    ? [new OrbitView({ id: '3d-scene', controller: true })]
    : [new MapView({ id: 'geo-view', controller: true })];
  const viewState = {};
  viewState[isLogic ? '3d-scene' : 'geo-view'] = localViewState;

  const widgets: any = [
    new FullscreenWidget({
      id: 'myfull',
      container: fullscreenContainer,
      placement: 'top-right',
      className: s.fullscreen,
    }),
  ];
  if (!isLogic) {
    widgets.push(new CompassWidget({ id: 'compass', placement: 'top-right', className: s.compass }));
  }

  ///// return
  return (
    <div className={s.container} ref={containerRef}>
      <DeckGL
        widgets={widgets}
        views={views}
        ref={deckRef}
        layers={layers}
        initialViewState={isLogic ? undefined : viewState}
        viewState={isLogic ? viewState : undefined}
        onViewStateChange={isLogic ? viewStateChanger : undefined}
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
              style={{ zIndex: theme2.zIndex.dropdown, position: 'absolute', top: 5, right: theme2.spacing(1.5) }}
            />
          </MapLibre>
        )}
      </DeckGL>

      <Tooltip
        data={data}
        panel={panel}
        time={time}
        eventBus={eventBus}
        info={hoverInfo}
        setHoverInfo={setHoverInfo}
        dataLayers={options.dataLayers}
      />

      {(isShowEdgeLegend || isShowLegend) && (
        <div className={s.legendStack}>
          {isShowEdgeLegend && !isHyper && memoEdgeLegend}
          {isShowLegend && memoLegend}
        </div>
      )}

      {memoMenu}
      {memoPositionTracker}
      {isShowSwitcher && memoLayerSwitcher}
    </div>
  );
};

export default observer(Mapgl);

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
    top: ${theme.spacing(5)};
    right: 0;
    ${getDeckWidgetSkin(theme)}
  `,
  compass: css`
    z-index: ${theme.zIndex.dropdown};
    position: absolute;
    top: ${theme.spacing(10)};
    right: 0;
    ${getDeckWidgetSkin(theme)}
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
    font-size: calc(${theme.typography.bodySmall.fontSize} * 0.85);
    bottom: ${theme.spacing(0.5)};
    right: ${theme.spacing(0.5)};
  `,
});
