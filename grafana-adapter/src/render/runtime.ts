import { createGroupLegend as createCoreGroupLegend } from '@vaduga/mapgl-core/store';
import type { Graph } from '@vaduga/mapgl-core/graph/main';
import type { Rule } from '@vaduga/mapgl-core/style';
import { ALERTING_STATES, ANNOTS_LABEL } from '../types/annotations';
import { DataHoverEvent, type EventBus, type GrafanaTheme2, type PanelData } from '@grafana/data';
import type { VizLegendItem } from '@grafana/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { throttleTime } from 'rxjs';
import type { GrafanaRuntimeSubscriptions } from '../runtime/subscriptions';
import { ThresholdEdgeChangeEvent } from '../utils/bus.events';

interface EdgeThresholdStep {
  color: string;
  value: number | null;
}

interface MapglFieldConfig {
  defaults: { thresholds?: { steps?: EdgeThresholdStep[] } };
}

function edgeLegendItems(steps: EdgeThresholdStep[] | undefined, theme: GrafanaTheme2): VizLegendItem[] {
  return (steps ?? []).map((step) => ({
    color: theme.visualization.getColorByName(step.color),
    label: [null, undefined, -Infinity].includes(step.value) ? '-Inf' : String(step.value),
    yAxis: 1,
    disabled: false,
  }));
}

export function useEventState({
  eventBus,
  subscriptions,
  fieldConfig,
  theme,
  data,
}: {
  eventBus: EventBus;
  subscriptions: GrafanaRuntimeSubscriptions;
  fieldConfig: MapglFieldConfig;
  theme: GrafanaTheme2;
  data: PanelData;
}) {
  const latestData = useRef(data);
  useEffect(() => {
    latestData.current = data;
  }, [data]);
  const [hoverTime, setHoverTime] = useState<{ data: PanelData; time: number }>();
  // A hover belongs to one data refresh; new data returns annotations to the range end immediately.
  const time = hoverTime?.data === data ? hoverTime.time : data.timeRange.to.valueOf();
  const configuredLegend = useMemo(
    () => edgeLegendItems(fieldConfig.defaults.thresholds?.steps, theme),
    [fieldConfig.defaults.thresholds?.steps, theme]
  );
  const [eventLegend, setEventLegend] = useState<VizLegendItem[] | null>(null);

  useEffect(
    () =>
      subscriptions.bindPanel({
        id: 'grafana.hover-time-and-edge-thresholds',
        keys: [eventBus, theme],
        start: (signal) => {
          const hoverSub = eventBus
            .getStream(DataHoverEvent)
            .pipe(throttleTime(50))
            .subscribe((event) => {
              const nextTime = event.payload?.point?.time;
              if (!signal.aborted && nextTime != null) {
                setHoverTime({ data: latestData.current, time: nextTime });
              }
            });
          const thresholdSub = eventBus.subscribe(ThresholdEdgeChangeEvent, (event) => {
            const thresholds = (event.payload as unknown as { thresholds?: EdgeThresholdStep[] })?.thresholds;
            if (!signal.aborted && thresholds) {
              setEventLegend(edgeLegendItems(thresholds, theme));
            }
          });

          return () => {
            hoverSub.unsubscribe();
            thresholdSub.unsubscribe();
          };
        },
      }),
    [subscriptions, eventBus, theme]
  );

  return { time, edgeLegend: eventLegend ?? configuredLegend };
}

export function createGroupLegend(
  graph: Graph,
  groups: readonly Rule[],
  activeGroups: Uint8Array,
  hasLayers: boolean,
  hasAnnotations: boolean
): VizLegendItem[] {
  if (!hasLayers) {
    return [];
  }
  const entries: VizLegendItem[] = createCoreGroupLegend(graph, groups, activeGroups).map((entry) => ({
    ...entry,
    yAxis: 1,
  }));
  if (hasAnnotations) {
    const groupIdx = groups.length;
    entries.push({
      color: ALERTING_STATES.Alerting,
      label: ANNOTS_LABEL,
      yAxis: 1,
      disabled: !activeGroups[groupIdx],
      data: { rawLabel: ANNOTS_LABEL, groupIdx, hasNodes: false },
    });
  }
  return entries;
}
