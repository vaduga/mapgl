import React, { type ReactNode } from 'react';
import { TooltipIconButton } from './TooltipIcon';

import type {
  TooltipEdgeRecord,
  TooltipEdgeSection,
  TooltipEdgeSectionContributor,
  TooltipEdgeSectionContext,
} from '../../extension-points/featureContracts';

export type TooltipEdgeDirection = 'incoming' | 'outgoing';
export type TooltipEdgeIconName = React.ComponentProps<typeof TooltipIconButton>['icon'];

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
  onFocusEnd?(): void;
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
  onFocusEnd,
  renderEdge,
  getIconName = defaultIconName,
  getTooltip = defaultTooltip,
}: TooltipEdgeSectionListProps): React.ReactElement | null {
  const directionTrigger = (section: TooltipEdgeSection, direction: TooltipEdgeDirection) => {
    const records = section[direction];
    if (!records.length) {
      return null;
    }
    const listed = isListed(section, direction);
    const label = direction === 'incoming' ? section.incomingLabel : section.outgoingLabel;
    const toggle = () => onToggle(section, direction);
    return (
      <span className={classNames?.header}>
        <TooltipIconButton
          icon={getIconName(section, direction)}
          className={`${classNames?.trigger ?? ''} ${listed ? (classNames?.triggerActive ?? '') : ''}`}
          aria-label={label}
          aria-pressed={listed}
          title={getTooltip(section, direction)}
          onClick={toggle}
        />
        <button
          type="button"
          className={classNames?.countButton}
          aria-label={`${label} edges count`}
          onMouseEnter={() => onFocus?.(records)}
          onMouseLeave={onFocusEnd}
          onClick={toggle}
        >
          {`(${records.length})`}
        </button>
      </span>
    );
  };
  const directions: TooltipEdgeDirection[] = ['incoming', 'outgoing'];
  return (
    <>
      {sections
        .filter((section) => section.incoming.length || section.outgoing.length)
        .map((section) => (
          <React.Fragment key={section.id}>
            <span className={classNames?.headerRow}>
              {directionTrigger(section, 'incoming')}
              {directionTrigger(section, 'outgoing')}
            </span>
            {directions.map(
              (direction) =>
                section[direction].length > 0 &&
                isListed(section, direction) && (
                  <ul
                    key={direction}
                    className="mapgl-tooltip-edge-list"
                    aria-label={direction === 'incoming' ? section.incomingLabel : section.outgoingLabel}
                    tabIndex={section[direction].length > 10 ? 0 : undefined}
                  >
                    {section[direction].map((record, index) => (
                      <React.Fragment key={record.id}>{renderEdge(record, index, direction, section)}</React.Fragment>
                    ))}
                  </ul>
                )
            )}
          </React.Fragment>
        ))}
    </>
  );
}

function defaultIconName(_section: TooltipEdgeSection, direction: TooltipEdgeDirection): TooltipEdgeIconName {
  return direction === 'outgoing' ? 'arrow-up' : 'arrow-down';
}

function defaultTooltip(section: TooltipEdgeSection, direction: TooltipEdgeDirection): string {
  return direction === 'incoming' ? section.incomingLabel : section.outgoingLabel;
}
