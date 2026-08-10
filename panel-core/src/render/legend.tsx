import React from 'react';
import { LegendDisplayMode, VizLegend, type VizLegendItem } from '@grafana/ui';
import { ANNOTS_LABEL } from '../types/defaults';
import { PositionTracker } from '../components/Geocoder/PositionTracker';
import { StateTime } from '../components/Geocoder/StateTime';

interface LegendStackProps {
  edgeLegend: VizLegendItem[];
  nodeLegend: VizLegendItem[];
  hasAnnotations: boolean;
  isRouted: boolean;
  showEdgeLegend?: boolean;
  showNodeLegend?: boolean;
  onNodeLabelClick: (item: VizLegendItem) => void;
  classes: { legendStack: string; edgeLegend: string; nodesLegend: string; compactLegend: string };
}

export function LegendStack({
  edgeLegend,
  nodeLegend,
  hasAnnotations,
  isRouted,
  showEdgeLegend,
  showNodeLegend,
  onNodeLabelClick,
  classes,
}: LegendStackProps) {
  if (!showEdgeLegend && !showNodeLegend) {
    return null;
  }

  const visibleNodes = nodeLegend.filter(
    (item, index) => item.data.hasNodes || (hasAnnotations && index === nodeLegend.length - 1)
  );
  return (
    <div className={classes.legendStack}>
      {showEdgeLegend && !isRouted && edgeLegend.length > 0 && (
        <div className={classes.edgeLegend}>
          <VizLegend
            className={classes.compactLegend}
            displayMode={LegendDisplayMode.List}
            placement="bottom"
            items={edgeLegend}
          />
        </div>
      )}
      {showNodeLegend && visibleNodes.length > 0 && (
        <div className={classes.nodesLegend}>
          <VizLegend
            className={classes.compactLegend}
            displayMode={LegendDisplayMode.List}
            placement="bottom"
            items={visibleNodes}
            onLabelClick={onNodeLabelClick}
          />
        </div>
      )}
    </div>
  );
}

export function PositionStatus({
  className,
  groupsLegend,
  time,
  isLogic,
  selectedCoord,
}: {
  className: string;
  groupsLegend: VizLegendItem[];
  time: number;
  isLogic: boolean;
  selectedCoord: any;
}) {
  return (
    <div className={className}>
      {groupsLegend.some((item) => item.label === ANNOTS_LABEL) && <StateTime time={time} />}
      {!isLogic && <PositionTracker isLogic={isLogic} selectedCoord={selectedCoord} />}
    </div>
  );
}
