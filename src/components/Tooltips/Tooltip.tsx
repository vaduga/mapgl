import React, { useState } from 'react';
import { selectGotoHandler, toRgbaString, useRootStore } from '../../utils';
import { css } from '@emotion/css';
import { IconButton, SeriesIcon, useStyles2, useTheme2, VizTooltipContainer } from '@grafana/ui';
import { DataFrame, Field, FieldType, GrafanaTheme2 } from '@grafana/data';
import { BiColProps, colTypes } from 'mapLib/utils';
import { DataHoverView } from './DataHoverView';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema';

import { Node, Edge } from 'mapLib';

const includes = ['ack', 'msg', 'all_annots', 'liveUpd']; //liveStat
const TOOLTIP_OFFSET = 10;

function dedupeHyperedgeList(edges: Edge[]): Edge[] {
  const seen = new Set<string>();

  return edges.filter((edge) => {
    const key = edge.data?.edge_id ?? edge.data?.edgeId ?? edge.id;
    if (seen.has(String(key))) {
      return false;
    }

    seen.add(String(key));
    return true;
  });
}

const Tooltip = ({
  data,
  panel,
  info,
  eventBus,
  setHoverInfo,
  time,
  isClosed = false,
  isHyper,
  dataLayers,
}) => {
  const s = useStyles2(getStyles);
  const { pointStore, pId } = useRootStore();
  const theme = useTheme2();
  const [selIdx, setSelIdx] = useState(-1);
  const [trespassDir, setTrespassDir] = useState<boolean | undefined>();

  if (!info || !Object.entries(info).length) {
    return null;
  }

  const {
    getTooltipObject,
    setTooltipObject,
    isDefDir,
    setIsDefDir,
    setEdgeListed,
    getisEdgeListed,
  } = pointStore;

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

  let { x, y, object, coordinate, featureType, index, layer: deckLayer } = info;

  let props = object?.properties ?? object;
  let rowIndex;

  if (!x && !y && !coordinate) {
    return;
  }

  const points = deckLayer?.props.data.points;
  if (points && (featureType === 'points' || info.viewport?.id === '3d-scene') && index !== -1) {
    const featureIds = points.featureIds;
    const features = panel.features;
    const idx = featureIds?.value[index];

    props = (features as BiColProps[])[idx];
    rowIndex = props?.rowIndex;
  }

  let pinned = false;
  if (!props || index === -1) {
    if (isClosed) {
      return null;
    }
    ({ x, y, object } = getTooltipObject); // pinned object
    if (!x && !y) {
      return;
    }
    props = object.properties;
    pinned = true;
  }

  const { edgeId } = object || {};

  rowIndex = rowIndex ?? object?.rowIndex ?? object?.properties?.rowIndex; //?? featureIds?.value?.[index];  // pinned && lines && other collections ?? binary nodes row index

  const layerProps = info.layer?.props;
  const { frameRefId, locName, layerName, layerIdx, root: graph } = props || {};
  const edge: Edge = edgeId !== undefined && graph?.nodeCollection?.getEdgesMap[edgeId];
  const edge_id = edge?.data?.edge_id;
  const eNode = edge?.[isDefDir ? 'source' : 'target'];
  const findNode = graph?.findNode;
  const pickedNode: Node = eNode ?? findNode?.(locName);
  const pickedFeature = pickedNode?.data.feature;

  const layer: any = dataLayers.length && layerName && dataLayers.find((l) => l.name === layerName);
  const isShowTooltip = layer?.isShowTooltip ?? layerProps?.isShowTooltip ?? true;
  if (!isShowTooltip) {
    return null;
  }

  const DP = layer?.displayProperties ?? layerProps?.displayProperties;
  const baseProps = includes;
  let displayProps = DP?.length ? DP.concat(baseProps) : baseProps;

  const isComment = props['isComment'];
  if (isComment) {
    displayProps = [...displayProps, 'text'];
  }

  const segrPath = props.segrPath;
  const hasTrespassAnchor = Boolean(edge && segrPath);
  const isTrespass = hasTrespassAnchor || Boolean(props.isTrespass);

  if (!edge) {
    pointStore.hoverHighlighter.setGraph(panel.graph);

    const inEdges = dedupeHyperedgeList(pointStore.hoverHighlighter.getInEdges(pickedNode));
    const outEdges = dedupeHyperedgeList(pointStore.hoverHighlighter.getOutEdges(pickedNode));

    if (inEdges.length) {
      props.inEdges = inEdges;
    }
    if (outEdges.length) {
      props.outEdges = outEdges;
    }
  }

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
    ? data.series.find((el) => el.refId === frameRefId || el.name === frameRefId) ?? data.series[0]
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
    hoverPayload.all_annots = all_annots; //root ? filteredProps.all_annots : all_annots // point vs line
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
    const value = props[name];
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

  const ConnectedEdges = () => {
    const genLi = (node, edge: Edge, i?) => {
      const dataRecord = edge.data?.dataRecord;
      const arcStyle = dataRecord?.arcStyle;
      const { sideB, sideA } = arcStyle || {};
      const aField = sideA?.colorField;
      const bField = sideB?.colorField;
      const edgeId = edge.data?.edgeId;

      //&& parent === getSelectedNode --- would need pinned tooltip rerender
      return (
        <li key={edgeId}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: i === selIdx ? theme.colors.secondary.shade : undefined,
            }}
          >
            {/*{pinned && <SetVarsIcon {...{nodeId: node?.id, edgeId, isDefDir}}/>}*/}
            <a
              onClick={() => {
                setSelIdx(i);
                selectGotoHandler({
                  pId,
                  value: node?.id,
                  edge,
                  eventBus,
                  graphId: graph.id,
                  select: true,
                  fly: false,
                });
                setTooltipObject({
                  ...getTooltipObject,
                  object: {
                    edgeId: object?.edgeId,
                    properties: {
                      ...dataRecord,
                      edgeId,
                      locName: props.locName,
                      ...(isTrespass && { isTrespass: true }),
                      inEdges: props.inEdges,
                      outEdges: props.outEdges,
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
    const { inEdges, outEdges, parents } = props;
    const inLen = inEdges?.length ?? 0;
    const outLen = outEdges?.length ?? 0;
    const toLines = inEdges?.map((e: Edge, i) => genLi(e.source, e, i));
    const revLines = outEdges?.map((e: Edge, i) => genLi(e.target, e, i + inLen));
    const adjacentEdges = (edge ? [edge] : parents)?.map((e, i) => genLi(pickedNode, e, parents?.length > 1 && i)) ?? [];
    const inEdgesLabel = isTrespass ? 'trespassing edges right' : 'incoming';
    const outEdgesLabel = isTrespass ? 'trespassing edges left' : 'outgoing';

    const renderLines = (lines, listIsDefDir?: boolean) => {
      if (!lines?.length) {
        return null;
      }
      const isListed = getisEdgeListed && (isTrespass ? trespassDir === listIsDefDir : isDefDir === listIsDefDir);
      return (
        isListed && (
          <ul>
            {lines.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        )
      );
    };

    const EdgeListTrigger = ({ label, listIsDefDir, isListed, lineCount }) => (
      <span className={s.edgeListHeader}>
        <IconButton
          className={`${s.edgeListTrigger} ${isListed ? s.edgeListTriggerActive : ''}`}
          size="sm"
          aria-label={`${isListed ? 'hide' : 'show'} ${label} edges`}
          aria-pressed={isListed}
          variant="secondary"
          name={listIsDefDir ? 'arrow-up' : 'arrow-down'}
          onClick={() => handleEdgeTriggerClick(listIsDefDir)}
          {...(!isListed && { tooltip: `${label} edges` })}
        />
        <button
          type="button"
          className={s.edgeListCountText}
          aria-label="highlight all"
          onClick={() => (isListed ? handleEdgeCountClick(listIsDefDir) : handleEdgeTriggerClick(listIsDefDir))}
          title="highlight all"
        >
          {`(${lineCount})`}
        </button>
      </span>
    );

    const renderAdjacentHeader = () => {
      if (isTrespass || (!toLines?.length && !revLines?.length)) {
        return null;
      }

      const inListed = getisEdgeListed && !isDefDir;
      const outListed = getisEdgeListed && isDefDir;
      return (
        <span className={s.edgeListHeaderRow}>
          {toLines?.length && (
            <EdgeListTrigger
              label={inEdgesLabel}
              listIsDefDir={false}
              isListed={inListed}
              lineCount={toLines.length}
            />
          )}
          {revLines?.length && (
            <EdgeListTrigger
              label={outEdgesLabel}
              listIsDefDir={true}
              isListed={outListed}
              lineCount={revLines.length}
            />
          )}
        </span>
      );
    };

    return (
      <>
        <ul style={{ listStyle: 'none' }}>
          {props.locName && (
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
              <span>{props.locName}</span>
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
          {renderAdjacentHeader()}
          {renderLines(toLines, false)}
          {renderLines(revLines, true)}
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
      offset={{ x: TOOLTIP_OFFSET, y: TOOLTIP_OFFSET }}
    >
      {<ConnectedEdges />}
      <DataHoverView {...hoverPayload} />
    </VizTooltipContainer>
  );
};
export { Tooltip };

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
