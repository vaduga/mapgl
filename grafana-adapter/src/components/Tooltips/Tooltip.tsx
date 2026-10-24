import React, { type ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { SeriesIcon, TextLink, useStyles2, useTheme2, VizTooltipContainer } from '@grafana/ui';
import { css } from '@emotion/css';
import type { GrafanaTheme2 } from '@grafana/data';
import { getThemeVariables } from '../../render/grafanaThemeVars';
import { toRgbaString } from '@vaduga/mapgl-core/deckLayers/utils';
import { type DataFrame, type Field, FieldType, type InterpolateFunction } from '@grafana/data';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema';
import {
  GraphTooltip,
  TooltipView,
  type TooltipContent,
  type TooltipInspection,
  type TooltipFrameProps,
} from '@vaduga/mapgl-core/components/Tooltips/GraphTooltip';
import type { PanelController } from '@vaduga/mapgl-core/runtime';
import type { DisplayedRenderFrame } from '@vaduga/mapgl-core/render/session';
import type { MapglFeatureServices } from '@vaduga/mapgl-core/featureContracts';
import { blankHoverInfo } from '@vaduga/mapgl-core/types/defaults';
import { colTypes } from '@vaduga/mapgl-core/types';
import { getGrafanaAnnotations } from '../../types/annotations';
import type { GrafanaSourceResolver } from '../../data';
import { getGraphInteractionScopedVars, resolveGraphInteractionRow } from '../../graph/frame/interaction';
import { getDisplayValuesAndLinks } from './DataHoverView';

interface TooltipAlternateContext {
  readonly properties: Readonly<Record<string, unknown>>;
}

const baseProps = ['ack', 'msg', 'all_annots', 'liveUpd', 'liveMetric'];

export interface GrafanaTooltipProps {
  controller: PanelController;
  frame?: DisplayedRenderFrame;
  sourceResolver?: Pick<GrafanaSourceResolver, 'resolve'>;
  featureServices?: Pick<MapglFeatureServices, 'tooltipEdgeSections'>;
  data: { series: DataFrame[] };
  info: any;
  setHoverInfo(info: any): void;
  time: number;
  isClosed?: boolean;
  isRouted?: boolean;
  dataLayers: any[];
  replaceVariables?: InterpolateFunction;
  renderAlternateContent?(context: TooltipAlternateContext): ReactNode;
  renderActions?(): ReactNode;
  isEditHandle?(object: any): boolean;
}

function TooltipBase({
  controller,
  frame,
  sourceResolver,
  featureServices,
  data,
  info,
  setHoverInfo,
  time,
  isClosed = false,
  isRouted,
  dataLayers,
  replaceVariables,
  renderAlternateContent,
  renderActions,
  isEditHandle,
}: GrafanaTooltipProps) {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const store = controller.stores.pointStore;
  const pinned = store.getTooltipObject;
  const activeInfo = info?.object && info.index !== -1 ? info : pinned;
  const props = activeInfo?.object?.properties ?? activeInfo?.object;
  const close = () => {
    store.setTooltipObject(blankHoverInfo);
    setHoverInfo({});
  };
  const renderFrame = ({ anchor, pinned, children }: TooltipFrameProps) => (
    <VizTooltipContainer
      className={styles.viz}
      allowPointerEvents={pinned}
      position={anchor}
      offset={{ x: Number.parseFloat(theme.spacing(1.25)), y: Number.parseFloat(theme.spacing(1.25)) }}
    >
      <div style={getThemeVariables(theme)}>{children}</div>
    </VizTooltipContainer>
  );
  const content = (feature: Record<string, any>, inspection?: TooltipInspection): TooltipContent | undefined => {
    const interaction = inspection?.interaction;
    const row =
      interaction && sourceResolver
        ? resolveGraphInteractionRow(sourceResolver as GrafanaSourceResolver, interaction)
        : undefined;
    const layerName = feature.layerName ?? feature.featSource?.layerName;
    const layer = dataLayers.find((layer) => layer.name === layerName);
    if ((layer?.isShowTooltip ?? activeInfo?.layer?.props?.isShowTooltip) === false) {
      return undefined;
    }
    const visibleFields = layer?.displayProperties ?? activeInfo?.layer?.props?.displayProperties;
    const displayProps = visibleFields?.length ? [...visibleFields, ...baseProps] : [...baseProps];
    if (feature.isComment) {
      displayProps.push('text');
    }
    const frameRefId = feature.frameRefId ?? feature.featSource?.frameRefId;
    let source = interaction
      ? row?.frame
      : (data.series.find((source) => source.refId === frameRefId || source.name === frameRefId) ?? data.series[0]);
    let rowIndex = row?.rowIndex ?? feature.rowIndex ?? activeInfo?.object?.rowIndex;
    const entries = feature.isComment
      ? Object.entries(feature)
      : feature.geoJsonProps && Object.entries(feature.geoJsonProps);
    if (entries) {
      source = {
        fields: entries.map(([name, value]) => ({
          name,
          values: [value],
          type: FieldType.string,
          config: { description: 'GeoJson' },
        })),
        length: 1,
      };
      rowIndex = 0;
    }
    if (!source || rowIndex === undefined) {
      return {};
    }
    const extraFields: Field[] = baseProps
      .filter((key) => key !== 'all_annots' && feature[key] !== undefined)
      .map((name) => ({ name, values: [feature[name]], type: FieldType.string, config: {} }));
    const columnIndex = source.fields.findIndex(
      (field) =>
        field.name ===
        (interaction?.kind === 'edge' ? (layer?.optional?.edgeId ?? layer?.edgeIdField) : layer?.locField)
    );
    const result = getDisplayValuesAndLinks(
      source,
      displayProps,
      baseProps,
      extraFields,
      getGrafanaAnnotations(feature),
      time,
      rowIndex,
      columnIndex,
      SortOrder.None,
      TooltipDisplayMode.Single,
      interaction ? getGraphInteractionScopedVars(interaction) : undefined,
      replaceVariables
    );
    return result
      ? {
          properties: result.displayValues.map((value, index) => ({
            key: `${index}/${value.name}`,
            label: value.name,
            text: value.valueString,
            highlight: value.highlight,
          })),
          links: result.links.map((link, index) => ({
            key: String(index),
            label: link.title,
            href: link.href,
            target: link.target,
            onClick: link.onClick,
          })),
        }
      : {};
  };
  if (isClosed || isEditHandle?.(activeInfo?.object)) {
    return null;
  }
  const alternate = renderAlternateContent?.({ properties: props ?? {} });
  if (alternate) {
    return renderFrame({ anchor: { x: activeInfo.x, y: activeInfo.y }, pinned: false, children: alternate });
  }
  // Native non-graph overlays reuse the portable table without inventing graph identity.
  if (
    props?.isComment ||
    props?.geoJsonProps ||
    (activeInfo?.object?.geometry?.type === 'Polygon' && props?.namespaceLabel !== undefined) ||
    [colTypes.Path, colTypes.Polygons].includes(props?.featSource?.colType)
  ) {
    const prepared = content(props);
    return prepared ? (
      <TooltipView
        title={String(props.locName ?? (props.isComment ? 'Comment' : 'Properties'))}
        anchor={{ x: activeInfo.x, y: activeInfo.y }}
        pinned={activeInfo === pinned || Boolean(activeInfo.mapglPinned)}
        dark={theme.isDark}
        {...prepared}
        actions={renderActions?.()}
        isListed={() => false}
        onToggle={() => {}}
        onSelect={() => {}}
        onClose={close}
        renderFrame={renderFrame}
      />
    ) : null;
  }
  return (
    <GraphTooltip
      controller={controller}
      scene={
        frame
          ? { snapshot: frame.input.snapshot, render: frame.input.render, isRouted: frame.input.presentation.isRouted }
          : undefined
      }
      isRouted={isRouted}
      info={info}
      dark={theme.isDark}
      featureServices={featureServices}
      getContent={(inspection) => content(inspection.feature, inspection)}
      presentation={{
        renderLink: (link) => (
          <TextLink
            href={link.href}
            external={link.target === '_blank'}
            weight="medium"
            inline={false}
            onClick={link.onClick}
          >
            {link.label}
          </TextLink>
        ),
        renderEdgeDecorations: (record) => (
          <span className={styles.seriesIcons}>
            {[record.edge.data?.dataRecord?.arcStyle?.sideA, record.edge.data?.dataRecord?.arcStyle?.sideB].map(
              (side, index) =>
                side?.color && <SeriesIcon key={index} title={side.colorField} color={toRgbaString(side.color)} />
            )}
          </span>
        ),
      }}
      renderFrame={renderFrame}
      renderActions={renderActions}
      onClose={() => setHoverInfo({})}
    />
  );
}

export const Tooltip = observer(TooltipBase);

const getStyles = (theme: GrafanaTheme2) => ({
  viz: css`
    isolation: isolate;
    z-index: ${theme.zIndex.tooltip} !important;
    border-radius: ${theme.shape.radius.default};
    ul {
      list-style-type: none;
    }
    .mapgl-tooltip-title-row {
      line-height: 1;
      display: flex;
      align-items: center;
    }
    .mapgl-tooltip-sections,
    .mapgl-tooltip-heading > li:not(.mapgl-tooltip-title-row) {
      padding-block: ${theme.spacing(0.25)};
      line-height: 1;
    }
  `,
  seriesIcons: css`
    margin-left: ${theme.spacing(0.5)};
    display: flex;
    align-items: center;
    gap: ${theme.spacing(0.5)};
  `,
});
