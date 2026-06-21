import React, { type ReactNode } from 'react';
import { IconButton } from '@grafana/ui';

import type { TooltipEdgeRecord, TooltipEdgeSection, TooltipEdgeSectionContributor, TooltipEdgeSectionContext } from '../../extension-points/featureContracts';

export type TooltipEdgeDirection = 'incoming' | 'outgoing';
type TooltipEdgeIconName = React.ComponentProps<typeof IconButton>['name'];

export interface TooltipEdgeSectionListClassNames {
  header?: string;
  headerRow?: string;
  countButton?: string;
  trigger?: string;
  triggerActive?: string;
}

export interface TooltipEdgeSectionListProps {
  sections: TooltipEdgeSection[];
  classNames?: TooltipEdgeSectionListClassNames;
  isListed(section: TooltipEdgeSection, direction: TooltipEdgeDirection): boolean;
  onToggle(section: TooltipEdgeSection, direction: TooltipEdgeDirection): void;
  onFocus?(records: TooltipEdgeRecord[]): void;
  renderEdge(
    record: TooltipEdgeRecord,
    index: number,
    direction: TooltipEdgeDirection,
    section: TooltipEdgeSection
  ): ReactNode;
  getIconName?(section: TooltipEdgeSection, direction: TooltipEdgeDirection): TooltipEdgeIconName;
  getTooltip?(section: TooltipEdgeSection, direction: TooltipEdgeDirection): string;
}

export function getTooltipEdgeSections(
  contributors: TooltipEdgeSectionContributor[],
  context: TooltipEdgeSectionContext
): TooltipEdgeSection[] {
  return contributors.flatMap((contributor) =>
    contributor.getSections(context).filter((section) => section.incoming.length || section.outgoing.length)
  );
}

export function TooltipEdgeSectionList({
  sections,
  classNames,
  isListed,
  onToggle,
  onFocus,
  renderEdge,
  getIconName = defaultIconName,
  getTooltip = defaultTooltip,
}: TooltipEdgeSectionListProps): React.ReactElement | null {
  const visibleSections = sections.filter((section) => section.incoming.length || section.outgoing.length);

  if (!visibleSections.length) {
    return null;
  }

  return (
    <>
      {visibleSections.map((section) => (
        <React.Fragment key={section.id}>
          <span className={classNames?.headerRow}>
            {renderDirectionTrigger({
              section,
              direction: 'incoming',
              records: section.incoming,
              classNames,
              isListed,
              onToggle,
              onFocus,
              getIconName,
              getTooltip,
            })}
            {renderDirectionTrigger({
              section,
              direction: 'outgoing',
              records: section.outgoing,
              classNames,
              isListed,
              onToggle,
              onFocus,
              getIconName,
              getTooltip,
            })}
          </span>
          {renderDirectionLines(section, 'incoming', section.incoming, isListed, renderEdge)}
          {renderDirectionLines(section, 'outgoing', section.outgoing, isListed, renderEdge)}
        </React.Fragment>
      ))}
    </>
  );
}

interface RenderDirectionTriggerOptions {
  section: TooltipEdgeSection;
  direction: TooltipEdgeDirection;
  records: TooltipEdgeRecord[];
  classNames?: TooltipEdgeSectionListClassNames;
  isListed(section: TooltipEdgeSection, direction: TooltipEdgeDirection): boolean;
  onToggle(section: TooltipEdgeSection, direction: TooltipEdgeDirection): void;
  onFocus?(records: TooltipEdgeRecord[]): void;
  getIconName(section: TooltipEdgeSection, direction: TooltipEdgeDirection): TooltipEdgeIconName;
  getTooltip(section: TooltipEdgeSection, direction: TooltipEdgeDirection): string;
}

function renderDirectionTrigger({
  section,
  direction,
  records,
  classNames,
  isListed,
  onToggle,
  onFocus,
  getIconName,
  getTooltip,
}: RenderDirectionTriggerOptions): ReactNode {
  if (!records.length) {
    return null;
  }

  const listed = isListed(section, direction);
  const label = direction === 'incoming' ? section.incomingLabel : section.outgoingLabel;

  return (
    <span className={classNames?.header}>
      <IconButton
        className={`${classNames?.trigger ?? ''} ${listed ? (classNames?.triggerActive ?? '') : ''}`}
        size="sm"
        aria-label={`${listed ? 'hide' : 'show'} ${label} edges`}
        aria-pressed={listed}
        variant="secondary"
        name={getIconName(section, direction)}
        onClick={() => onToggle(section, direction)}
        tooltip={getTooltip(section, direction)}
      />
      <button
        type="button"
        className={classNames?.countButton}
        aria-label={`${label} edges count`}
        onMouseEnter={() => onFocus?.(records)}
        onClick={() => onToggle(section, direction)}
      >
        {`(${records.length})`}
      </button>
    </span>
  );
}

function renderDirectionLines(
  section: TooltipEdgeSection,
  direction: TooltipEdgeDirection,
  records: TooltipEdgeRecord[],
  isListed: (section: TooltipEdgeSection, direction: TooltipEdgeDirection) => boolean,
  renderEdge: (
    record: TooltipEdgeRecord,
    index: number,
    direction: TooltipEdgeDirection,
    section: TooltipEdgeSection
  ) => ReactNode
): ReactNode {
  if (!records.length || !isListed(section, direction)) {
    return null;
  }

  return (
    <ul>
      {records.map((record, index) => {
        const edgeNode = renderEdge(record, index, direction, section);
        return edgeNode ? <React.Fragment key={record.id}>{edgeNode}</React.Fragment> : null;
      })}
    </ul>
  );
}

function defaultIconName(_section: TooltipEdgeSection, direction: TooltipEdgeDirection): TooltipEdgeIconName {
  return direction === 'outgoing' ? 'arrow-up' : 'arrow-down';
}

function defaultTooltip(section: TooltipEdgeSection, direction: TooltipEdgeDirection): string {
  return `${direction === 'incoming' ? section.incomingLabel : section.outgoingLabel} edges`;
}
