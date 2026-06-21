import React, { type ReactNode, useState } from 'react';
import { css } from '@emotion/css';
import { IconButton, SeriesIcon, useStyles2, useTheme2, VizTooltipContainer } from '@grafana/ui';
import { DataFrame, Field, FieldType, GrafanaTheme2 } from '@grafana/data';
import { colTypes, type BiColProps } from '@mapgl/panel-core/types';
import { DataHoverView } from './DataHoverView';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { getTooltipEdgeSections, TooltipEdgeSectionList, type TooltipEdgeDirection } from './tooltipEdgeSections';
import {
  getMapglFeatureServices,
  type TooltipEdgeRecord,
  type TooltipEdgeSection,
} from '../../extension-points/featureContracts';

import { Node, Edge, findEdge, getNodeData, Graph } from '@mapgl/panel-core/graph';

const includes = ['ack', 'msg', 'all_annots', 'liveUpd']; //liveStat
const TOOLTIP_OFFSET_SCALE = 1.25;

export type CoreTooltipSelectGotoHandler = (args: {
  pId?: unknown;
  value?: unknown;
  edge?: Edge;
  eventBus?: unknown;
  graphId?: string;
  select?: boolean;
  fly?: boolean;
}) => void;

export interface CoreTooltipPointStore {
  graphHighlighter: {
    setGraph(graph: Graph, opts?: { edgeIndex?: unknown }): void;
    getInEdges(node: Node | undefined | null): Edge[];
    getOutEdges(node: Node | undefined | null): Edge[];
  };
  getMode?: string;
  getTooltipObject: any;
  setTooltipObject(info: any): void;
  isDefDir: boolean;
  setIsDefDir(value: boolean): void;
  setEdgeListed(value: boolean): void;
  setFocusedEdgeId(id: string, graphId: string): void;
  setFocusedEdges(edges: Edge[]): void;
  getSelectedNode: Node | Graph | null;
  setSelectedNode(node: Node | Graph | undefined | null, pickedEdges?: Edge[]): void;
  getisEdgeListed: boolean;
  getisDrawerOpen?: boolean;
  setDrawerOpen?(value: boolean): void;
}

export interface CoreTooltipExtraEdgeSectionContext {
  graph?: Graph;
  edgeIndex?: unknown;
  edge?: Edge;
  node?: Node;
  feature: any;
  panel: any;
  object: any;
  isRouted?: boolean;
  layerIdx?: unknown;
  data?: any;
}

export interface CoreTooltipProps {
  data: any;
  panel: any;
  info: any;
  eventBus?: unknown;
  setHoverInfo(info: any): void;
  time: number;
  isClosed?: boolean;
  isRouted?: boolean;
  dataLayers: any[];
  pointStore: CoreTooltipPointStore;
  pId?: unknown;
  selectGotoHandler: CoreTooltipSelectGotoHandler;
  toRgbaString(value: unknown): string;
  renderClusterTooltip?(info: any, props: any, x: number, y: number, isClosed: boolean): ReactNode;
  getExtraEdgeSections?(context: CoreTooltipExtraEdgeSectionContext): TooltipEdgeSection[];
  isEditHandle?(object: any, pointStore: CoreTooltipPointStore): boolean;
  showDrawerOpenButton?: boolean;
  tooltipReactionKey?: unknown;
}

export const Tooltip = ({
  data,
  panel,
  info,
  eventBus,
  setHoverInfo,
  time,
  isClosed = false,
  isRouted,
  dataLayers,
  pointStore,
  pId,
  selectGotoHandler,
  toRgbaString,
  renderClusterTooltip,
  getExtraEdgeSections,
  isEditHandle,
  showDrawerOpenButton = false,
  tooltipReactionKey,
}: CoreTooltipProps) => {
  void tooltipReactionKey;

  const s = useStyles2(getStyles);
  const theme = useTheme2();
  const tooltipOffset = Number.parseFloat(theme.spacing(TOOLTIP_OFFSET_SCALE));
  const [selIdx, setSelIdx] = useState(-1);
  const [extraEdgeSectionDirection, setExtraEdgeSectionDirection] = useState<TooltipEdgeDirection | undefined>();

  if (!info || !Object.entries(info).length) {
    return null;
  }

  const {
    getTooltipObject,
    setTooltipObject,
    isDefDir,
    setIsDefDir,
    setEdgeListed,
    setFocusedEdgeId,
    setFocusedEdges,
    getisDrawerOpen,
    getisEdgeListed,
  } = pointStore;

  const handleDrawerOpen = () => {
    pointStore.setDrawerOpen?.(!getisDrawerOpen);
  };

  const handleEdgeListed = (nextIsDefDir?: boolean) => {
    if (nextIsDefDir === undefined) {
      setEdgeListed(!getisEdgeListed);
      return;
    }

    if (getisEdgeListed && isDefDir === nextIsDefDir) {
      setEdgeListed(false);
      return;
    }

    setIsDefDir(nextIsDefDir);
    setEdgeListed(true);
  };
  const handleEdgeCountClick = (nextIsDefDir: boolean) => {
    if (!graph) {
      return;
    }

    setIsDefDir(nextIsDefDir);
    setSelIdx(-1);
    selectGotoHandler({
      pId,
      value: props.locName,
      graphId: graph.id,
      eventBus,
      select: true,
    });
  };
  const handleEdgeTriggerClick = (nextIsDefDir: boolean) => {
    handleEdgeListed(nextIsDefDir);
    handleEdgeCountClick(nextIsDefDir);
  };
  const handleEdgeCountExpand = (nextIsDefDir: boolean) => {
    if (!getisEdgeListed || isDefDir !== nextIsDefDir) {
      setEdgeListed(true);
    }

    handleEdgeCountClick(nextIsDefDir);
  };

  const handleEdgeListFocus = (edges: Edge[]) => {
    const focusableEdges = edges.filter((edge) => edge?.id && edge.source && edge.target);
    if (!focusableEdges.length) {
      return;
    }

    setSelIdx(-1);
    setFocusedEdges(focusableEdges);
  };
  const handleExtraEdgeSectionListed = (direction: TooltipEdgeDirection) => {
    if (getisEdgeListed && extraEdgeSectionDirection === direction) {
      setEdgeListed(false);
      return;
    }

    setExtraEdgeSectionDirection(direction);
    setEdgeListed(true);
  };

  let { x, y, object, coordinate, featureType, index, layer: deckLayer } = info;

  let props = object?.properties ?? object;
  let rowIndex;

  if (!x && !y && !coordinate) {
    return;
  }

  if (props?.cluster || info?.properties?.cluster) {
    return renderClusterTooltip?.(info, props, x, y, isClosed) ?? null;
  }

  const points = deckLayer?.props?.data?.points;
  if (points && (featureType === 'points' || info.viewport?.id === '3d-scene') && index !== -1) {
    const featureIds = points.featureIds;
    const features = panel.features;
    const idx = featureIds?.value[index];

    props = (features as BiColProps[])[idx];
    rowIndex = props?.rowIndex;
  }

  let pinned = false;
  const editHandle = isEditHandle?.(object, pointStore) ?? false;
  if (!props || editHandle || index === -1) {
    if (isClosed) {
      return null;
    }
    ({ x, y, object } = getTooltipObject); // pinned object
    if (!x && !y) {
      return;
    }
    props = object?.properties;
    if (!props) {
      return null;
    }
    pinned = true;
  }

  const { edgeId } = object || {};

  rowIndex = rowIndex ?? object?.rowIndex ?? object?.properties?.rowIndex; //?? featureIds?.value?.[index];  // pinned && lines && other collections ?? binary nodes row index

  const layerProps = info.layer?.props;
  const { frameRefId, locName, layerName, layerIdx, graph } = props || {};
  const edge: Edge | undefined = edgeId !== undefined && graph ? findEdge(graph, edgeId) : undefined;
  const eNode = edge?.[isDefDir ? 'source' : 'target'];
  const findNode = graph ? (id: string) => graph.findNode(id) : undefined;
  const pickedNode: Node = eNode ?? findNode?.(locName);
  const pickedFeature = pickedNode ? getNodeData(pickedNode)?.feature : props;

  const layer: any = dataLayers.length && layerName && dataLayers.find((l) => l.name === layerName);
  const isShowTooltip = layer?.isShowTooltip ?? layerProps?.isShowTooltip ?? true;
  if (!isShowTooltip) {
    return null;
  }

  const DP = layer?.displayProperties ?? layerProps?.displayProperties;
  const baseProps = includes;
  let displayProps = DP?.length ? DP.concat(baseProps) : baseProps;

  const isComment = props?.['isComment'];
  if (isComment) {
    displayProps = [...displayProps, 'text'];
  }

  const segrPath = props?.segrPath;
  const hasTrespassAnchor = Boolean(edge && segrPath);
  const isTrespass = hasTrespassAnchor || Boolean(props.isTrespass);
  const extraEdgeAnchor = props?.extraEdgeAnchor as
    | {
        edge?: Edge;
        node?: Node;
        locName?: unknown;
      }
    | undefined;
  const displayEdge = extraEdgeAnchor?.edge ?? edge;
  const displayNode = extraEdgeAnchor?.node ?? pickedNode;
  const displayLocName = extraEdgeAnchor?.locName ?? props?.locName;
  const preservedEdgeSections = Array.isArray(props?.edgeSections)
    ? (props.edgeSections as TooltipEdgeSection[])
    : [];
  const showTopEdge = Boolean(extraEdgeAnchor?.edge) || !preservedEdgeSections.length;
  let adjacentIncomingEdges: Edge[] = [];
  let adjacentOutgoingEdges: Edge[] = [];
  let extraEdgeSections: TooltipEdgeSection[] = [];

  if (isTrespass && getExtraEdgeSections) {
    extraEdgeSections = getExtraEdgeSections({
      graph,
      edgeIndex: panel.graphEdgeIndex,
      edge,
      node: pickedNode,
      feature: props,
      panel,
      object,
      isRouted,
      layerIdx,
      data,
    });
  } else if (!edge) {
    pointStore.graphHighlighter.setGraph(panel.graph, { edgeIndex: panel.graphEdgeIndex });

    adjacentIncomingEdges = pointStore.graphHighlighter.getInEdges(pickedNode);
    adjacentOutgoingEdges = pointStore.graphHighlighter.getOutEdges(pickedNode);
  }

  const tooltipEdgeSections =
    graph && !extraEdgeSections.length
      ? getTooltipEdgeSections(getMapglFeatureServices().tooltipEdgeSections, {
          graph,
          edgeIndex: panel.graphEdgeIndex,
          node: pickedNode,
          edge,
          feature: props,
          adjacentEdges: {
            incoming: adjacentIncomingEdges,
            outgoing: adjacentOutgoingEdges,
          },
          data,
        })
      : [];
  const displayedEdgeSections = extraEdgeSections.length
    ? extraEdgeSections
    : tooltipEdgeSections.length
      ? tooltipEdgeSections
      : preservedEdgeSections;

  /// geojson static or comment icon entries
  const entries = isComment ? Object.entries(props) : props['geoJsonProps'] && Object.entries(props['geoJsonProps']);
  const hoverPayload: any = {
    mode: TooltipDisplayMode.Single,
    sortOrder: SortOrder.None,
    time,
    displayProps,
    baseProps,
  };

  const frame: DataFrame | undefined = frameRefId
    ? (data.series.find((el) => el.refId === frameRefId || el.name === frameRefId) ?? data.series[0])
    : data.series[0];

  if (frame) {
    hoverPayload.data = frame;
    hoverPayload.rowIndex = rowIndex;
    hoverPayload.columnIndex = frame.fields.findIndex((v) =>
      ['edgesArcsBase', colTypes.Edges, colTypes.Edges + 'fallback'].includes(info?.layer?.id)
        ? v.name === layer?.edgeIdField
        : v.name === layer?.locField
    );
    const all_annots = props?.all_annots ?? pickedFeature?.all_annots;
    hoverPayload.all_annots = all_annots;
  }
  /// geojson static entries & comments
  if (Array.isArray(entries)) {
    const frame: any = { fields: [] };
    entries.forEach(([key, value]) => {
      frame.fields.push({
        name: key,
        values: [value],
        type: FieldType.string,
        config: { description: isComment ? 'CommentField' : 'GeoJson' },
      });
    });
    hoverPayload.data = frame;
    hoverPayload.rowIndex = 0; /// must be passed
  }

  const extraFields: Field[] = [];

  baseProps.forEach((name) => {
    if (name === 'all_annots') {
      return;
    }
    const value = props?.[name];
    if (value !== undefined) {
      extraFields.push({
        name,
        values: [value],
        type: FieldType.string,
        config: {},
      });
    }
  });

  hoverPayload.extraFields = extraFields;

  const renderConnectedEdges = () => {
    const genLi = (node, edge: Edge | undefined, i?, record?: TooltipEdgeRecord) => {
      if (!edge) {
        return null;
      }

      const dataRecord = edge.data?.dataRecord ?? record?.properties;
      const arcStyle = dataRecord?.arcStyle;
      const { sideB, sideA } = arcStyle || {};
      const aField = sideA?.colorField;
      const bField = sideB?.colorField;
      const edgeId = edge.data?.edgeId ?? edge.data?.edge_id ?? record?.id ?? edge.id;
      const targetNode = node ?? record?.target ?? edge.target;
      const edgeGraphId = String((edge.source?.parent as Graph | undefined)?.id ?? graph?.id ?? '');
      const pinnedGraph = dataRecord?.graph ?? edge.source?.parent ?? graph;

      //&& parent === getSelectedNode --- would need pinned tooltip rerender
      return (
        <li key={edgeId} onMouseEnter={() => edge.id && setFocusedEdgeId(edge.id, edgeGraphId)}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: i === selIdx ? theme.colors.secondary.shade : undefined,
            }}
          >
            <a
              onClick={() => {
                setSelIdx(i);
                pointStore.setSelectedNode(pointStore.getSelectedNode, [edge]);
                setTooltipObject({
                  ...getTooltipObject,
                  object: {
                    edgeId: edge.id,
                    properties: {
                      ...dataRecord,
                      edgeId,
                      graph: pinnedGraph,
                      locName: props?.locName,
                      ...(isTrespass && { isTrespass: true }),
                      ...(extraEdgeSections.length && { extraEdgeSections }),
                      ...(!extraEdgeSections.length && displayedEdgeSections.length && { edgeSections: displayedEdgeSections }),
                      ...(extraEdgeSections.length && {
                        extraEdgeAnchor: {
                          edge: displayEdge,
                          node: displayNode,
                          locName: displayLocName,
                        },
                      }),
                    },
                  },
                });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
            >
              <span>{edgeId}</span>
              <div className={s.seriesIcons}>
                {sideA?.color && <SeriesIcon title={aField} color={toRgbaString(sideA.color)} />}
                {sideB?.color && <SeriesIcon title={bField} color={toRgbaString(sideB.color)} />}
              </div>
            </a>
          </div>
        </li>
      );
    };
    const { parents } = props;
    const adjacentEdges =
      showTopEdge
        ? (displayEdge ? [displayEdge] : parents)?.map((e, i) => genLi(displayNode, e, parents?.length > 1 && i)) ?? []
        : [];
    const getSectionDirection = (direction: TooltipEdgeDirection) => direction === 'outgoing';
    const hasExtraEdgeSections = Boolean(extraEdgeSections.length);
    const isSectionListed = (_section: TooltipEdgeSection, direction: TooltipEdgeDirection) =>
      hasExtraEdgeSections
        ? getisEdgeListed && extraEdgeSectionDirection === direction
        : getisEdgeListed && isDefDir === getSectionDirection(direction);
    const handleSectionToggle = (_section: TooltipEdgeSection, direction: TooltipEdgeDirection) =>
      hasExtraEdgeSections ? handleExtraEdgeSectionListed(direction) : handleEdgeTriggerClick(getSectionDirection(direction));
    const renderSectionEdge = (
      record: TooltipEdgeRecord,
      index: number,
      direction: TooltipEdgeDirection,
      section: TooltipEdgeSection
    ) => {
      const offset = direction === 'outgoing' ? section.incoming.length : 0;
      return genLi(direction === 'outgoing' ? record.target : record.source, record.edge, index + offset, record);
    };
    const getSectionIconName = (_section: TooltipEdgeSection, direction: TooltipEdgeDirection) =>
      hasExtraEdgeSections ? (direction === 'outgoing' ? 'angle-left' : 'angle-right') : direction === 'outgoing' ? 'arrow-up' : 'arrow-down';
    const getSectionTooltip = (section: TooltipEdgeSection, direction: TooltipEdgeDirection) =>
      direction === 'outgoing' ? section.outgoingLabel : section.incomingLabel;

    return (
      <>
        <ul style={{ listStyle: 'none' }}>
          {displayLocName && (
            <li key="locName">
              {pinned && (
                <>
                  <IconButton
                    key="closeHint"
                    variant="destructive"
                    name="x"
                    size="sm"
                    tooltip={'close'}
                    tooltipPlacement="left"
                    onClick={() => {
                      setTooltipObject({});
                      setHoverInfo({});
                    }}
                  />
                </>
              )}

              {/*{'name: '}*/}
              <span>{displayLocName}</span>
              {showDrawerOpenButton && !getisDrawerOpen && pointStore.setDrawerOpen && (
                <IconButton
                  className={s.fab}
                  size="sm"
                  aria-label={'open drawer'}
                  key="nodeInfoFab"
                  onClick={handleDrawerOpen}
                  variant="primary"
                  name={'angle-right'}
                  tooltip="open drawer"
                />
              )}
            </li>
          )}

          {adjacentEdges.length > 1 && (
            <span>
              {`(${adjacentEdges.length})`}
              <IconButton
                className={s.fab}
                size="sm"
                aria-label={'show nested edges'}
                key="nestedEdgesWrap"
                onClick={() => handleEdgeListed()}
                variant="primary"
                name={getisEdgeListed ? 'angle-up' : 'angle-down'}
                {...(!getisEdgeListed && { tooltip: `${isDefDir ? 'outgoing' : 'incoming'} edges` })}
              />
            </span>
          )}

          {(adjacentEdges.length === 1 || getisEdgeListed) && adjacentEdges}
          <TooltipEdgeSectionList
            sections={displayedEdgeSections}
            classNames={{
              header: s.edgeListHeader,
              headerRow: s.edgeListHeaderRow,
              countButton: s.edgeListCountText,
              trigger: s.edgeListTrigger,
              triggerActive: s.edgeListTriggerActive,
            }}
            isListed={isSectionListed}
            onToggle={handleSectionToggle}
            onFocus={(records) => handleEdgeListFocus(records.map((record) => record.edge))}
            renderEdge={renderSectionEdge}
            getIconName={getSectionIconName}
            getTooltip={getSectionTooltip}
          />
        </ul>
      </>
    );
  };

  return (
    /// onClick={() => setHoverInfo({})}
    <VizTooltipContainer
      className={s.viz}
      allowPointerEvents={pinned}
      position={{ x, y }}
      offset={{ x: tooltipOffset, y: tooltipOffset }}
    >
      {renderConnectedEdges()}
      <DataHoverView {...hoverPayload} />
    </VizTooltipContainer>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  viz: css`
    isolation: isolate;
    z-index: ${theme.zIndex.tooltip} !important;
    border-radius: ${theme.shape.radius.default};
    ul {
      list-style-type: none;
    }
  `,
  seriesIcons: css`
    margin-left: ${theme.spacing(0.5)};
    display: flex;
    align-items: center;
    gap: ${theme.spacing(0.5)};
  `,
  fab: css`
    margin-left: ${theme.spacing(0.625)};
    //transform: scale(0.8);
    //position: absolute;
    //zIndex: 1;
    //top: 0;
    //left: 0;
    //right: 0;
    //margin: 0 auto;
  `,
  edgeListHeader: css`
    display: inline-flex;
    align-items: center;
    gap: ${theme.spacing(0.5)};
  `,
  edgeListHeaderRow: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    margin-top: ${theme.spacing(0.25)};
  `,
  edgeListCountText: css`
    padding: 0;
    border: 0;
    background: transparent;
    color: ${theme.colors.text.secondary};
    cursor: pointer;

    &:hover {
      color: ${theme.colors.text.primary};
      text-decoration: underline;
    }
  `,
  edgeListTrigger: css`
    margin-left: 0;
  `,
  edgeListTriggerActive: css`
    border-color: ${theme.colors.primary.border};
    background: ${theme.colors.primary.main};
    color: ${theme.colors.primary.contrastText};

    &:hover {
      border-color: ${theme.colors.primary.border};
      background: ${theme.colors.primary.shade};
      color: ${theme.colors.primary.contrastText};
    }
  `,
});
