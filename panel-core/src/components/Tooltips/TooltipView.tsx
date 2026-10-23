import React, { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { TooltipEdgeRecord, TooltipEdgeSection } from '../../extension-points/contracts';
import { TooltipEdgeSectionList, type TooltipEdgeDirection, type TooltipEdgeIconName } from './tooltipEdgeSections';
import { TooltipIconButton } from './TooltipIcon';
import { tooltipSkin } from './tooltipSkin';
import { TooltipPropertyTable, type TooltipContent, type TooltipLink } from './TooltipContent';

export interface TooltipAnchor {
  readonly x: number;
  readonly y: number;
}

export interface TooltipFrameProps {
  readonly anchor: TooltipAnchor;
  readonly pinned: boolean;
  readonly dark?: boolean;
  readonly children: ReactNode;
}

export interface TooltipPresentation {
  readonly renderLink?: (link: TooltipLink) => ReactNode;
  readonly renderEdgeDecorations?: (record: TooltipEdgeRecord) => ReactNode;
}

export interface TooltipViewProps extends TooltipContent {
  readonly title: string;
  readonly presentation?: TooltipPresentation;
  readonly selectedEdgeId?: string;
  readonly anchor: TooltipAnchor;
  readonly pinned: boolean;
  readonly dark?: boolean;
  readonly originalEdge?: TooltipEdgeRecord;
  readonly sections?: TooltipEdgeSection[];
  readonly getIconName?: (section: TooltipEdgeSection, direction: TooltipEdgeDirection) => TooltipEdgeIconName;
  readonly actions?: ReactNode;
  readonly isListed: (section: TooltipEdgeSection, direction: TooltipEdgeDirection) => boolean;
  readonly onToggle: (section: TooltipEdgeSection, direction: TooltipEdgeDirection) => void;
  readonly onFocus?: (records: TooltipEdgeRecord[]) => void;
  readonly onFocusEnd?: () => void;
  readonly onSelect: (record: TooltipEdgeRecord) => void;
  readonly onClose: () => void;
  readonly renderFrame?: (props: TooltipFrameProps) => ReactNode;
}

/** Coordinates are relative to the graph container, never to the host document. */
export function TooltipFrame({
  anchor,
  pinned,
  dark,
  children,
  constrainToParent = true,
}: TooltipFrameProps & { constrainToParent?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const pinnedPosition = useRef<{ anchor: TooltipAnchor; left: number; top: number } | undefined>(undefined);
  const [position, setPosition] = useState<CSSProperties>({ left: anchor.x + 10, top: anchor.y + 10 });
  useLayoutEffect(() => {
    if (!constrainToParent) {
      setPosition({ left: anchor.x + 10, top: anchor.y + 10 });
      return;
    }
    const element = ref.current;
    const parent = element?.parentElement;
    if (!element || !parent) {
      return;
    }
    const fit = () => {
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      const saved = pinnedPosition.current;
      const restore = pinned && saved?.anchor.x === anchor.x && saved.anchor.y === anchor.y;
      const left = restore
        ? Math.max(8, Math.min(saved.left, width - 148))
        : Math.max(8, Math.min(anchor.x + 10, width - element.offsetWidth - 8));
      const top = restore
        ? Math.max(8, Math.min(saved.top, height - 48))
        : Math.max(8, Math.min(anchor.y + 10, height - element.offsetHeight - 8));
      const maxWidth = Math.max(1, Math.min(400, width - (pinned ? left : 8) - 8));
      const maxHeight = Math.max(1, height - (pinned ? top : 8) - 8);
      if (pinned) {
        pinnedPosition.current = { anchor, left, top };
      }
      setPosition((previous) =>
        previous.left === left &&
        previous.top === top &&
        previous.maxHeight === maxHeight &&
        previous.maxWidth === maxWidth
          ? previous
          : { left, top, maxWidth, maxHeight }
      );
    };
    fit();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(fit);
    observer?.observe(parent);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, [anchor.x, anchor.y, pinned, constrainToParent]);
  return (
    <div
      ref={ref}
      className="mapgl-tooltip-frame"
      style={{
        position: 'absolute',
        zIndex: 20,
        width: 'max-content',
        minWidth: 140,
        maxWidth: constrainToParent ? 'min(400px, calc(100% - 16px))' : 400,
        maxHeight: constrainToParent ? 'calc(100% - 16px)' : undefined,
        overflow: 'auto',
        pointerEvents: pinned ? 'auto' : 'none',
        padding: 'var(--theme-spacing-1, 8px)',
        borderRadius: 6,
        border: '1px solid var(--theme-border-weak, #b9c2cf)',
        background: `var(--theme-background-primary, ${dark ? '#252b35' : '#fff'})`,
        color: `var(--theme-text-primary, ${dark ? '#e5eaf3' : '#172033'})`,
        boxShadow: '0 3px 14px #0002',
        fontSize: 'var(--theme-font-size-body, 13px)',
        lineHeight: 1.4,
        ...position,
      }}
    >
      {children}
    </div>
  );
}

export function TooltipView({
  title,
  anchor,
  pinned,
  dark,
  originalEdge,
  sections = [],
  getIconName,
  actions,
  properties,
  links,
  isListed,
  onToggle,
  onFocus,
  onFocusEnd,
  onSelect,
  onClose,
  renderFrame,
  presentation,
  selectedEdgeId,
}: TooltipViewProps) {
  const swatches = (record: TooltipEdgeRecord) => (
    <span className="mapgl-tooltip-series-icons">
      {[record.edge.data?.dataRecord?.arcStyle?.sideA, record.edge.data?.dataRecord?.arcStyle?.sideB].map(
        (side, index) =>
          side?.color && (
            <span
              key={index}
              role="img"
              aria-label={String(side.colorField ?? 'Edge color')}
              title={side.colorField}
              style={{
                display: 'inline-block',
                width: 14,
                height: 4,
                borderRadius: 2,
                background: `rgba(${side.color[0]},${side.color[1]},${side.color[2]},${(side.color[3] ?? 255) / 255})`,
              }}
            />
          )
      )}
    </span>
  );
  const edgeRow = (record: TooltipEdgeRecord) => (
    <li
      key={record.id}
      onMouseEnter={() => onFocus?.([record])}
      onMouseLeave={onFocusEnd}
      data-selected={selectedEdgeId === record.edge.id || undefined}
    >
      <div className="mapgl-tooltip-edge-row">
        <button
          type="button"
          className="mapgl-tooltip-connection"
          data-tooltip-connection={String(record.edge.data?.edgeId ?? record.edge.id)}
          title={record.source && record.target ? `${record.source.id} → ${record.target.id}` : undefined}
          onClick={() => onSelect(record)}
        >
          <span>{String(record.edge.data?.edgeId ?? record.edge.id)}</span>
          {presentation?.renderEdgeDecorations ? presentation.renderEdgeDecorations(record) : swatches(record)}
        </button>
      </div>
    </li>
  );
  const children = (
    <div
      className={`${tooltipSkin} mapgl-tooltip`}
      data-testid="graph-tooltip"
      data-pinned={pinned}
      data-theme={dark ? 'dark' : 'light'}
      role={pinned ? 'dialog' : 'tooltip'}
      aria-label={title}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <ul className="mapgl-tooltip-heading">
        <li className="mapgl-tooltip-title-row">
          {pinned && (
            <TooltipIconButton
              icon="x"
              className="mapgl-tooltip-close"
              aria-label="close"
              title="close"
              onClick={onClose}
            />
          )}
          <span className="mapgl-tooltip-title">{title}</span>
          {pinned && actions}
        </li>
        {originalEdge && edgeRow(originalEdge)}
        <TooltipEdgeSectionList
          sections={sections}
          classNames={{
            header: 'mapgl-tooltip-section',
            headerRow: 'mapgl-tooltip-sections',
            countButton: 'mapgl-tooltip-count',
            trigger: 'mapgl-tooltip-trigger',
          }}
          isListed={isListed}
          onToggle={onToggle}
          onFocus={onFocus}
          onFocusEnd={onFocusEnd}
          renderEdge={edgeRow}
          getIconName={getIconName}
        />
      </ul>
      <TooltipPropertyTable properties={properties} links={links} renderLink={presentation?.renderLink} />
    </div>
  );
  const props = { anchor, pinned, dark, children };
  return <>{renderFrame ? renderFrame(props) : <TooltipFrame {...props} />}</>;
}
