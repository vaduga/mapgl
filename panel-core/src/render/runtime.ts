import { DataHoverEvent, type EventBus, type GrafanaTheme2 } from '@grafana/data';
import type { VizLegendItem } from '@grafana/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { throttleTime } from 'rxjs';
import { ThresholdEdgeChangeEvent } from '../utils';

export class MapglRenderGeneration {
  private generation = 0;
  private disposed = false;

  begin(): () => boolean {
    const generation = ++this.generation;
    return () => !this.disposed && generation === this.generation;
  }

  invalidate(): void {
    this.generation += 1;
  }

  dispose(): void {
    this.disposed = true;
    this.invalidate();
  }
}

export function useLatestRenderCommit<T>(commit: (value: T) => void, onError?: (error: unknown) => void) {
  const generationRef = useRef(new MapglRenderGeneration());
  const commitRef = useRef(commit);
  const errorRef = useRef(onError);

  useEffect(() => {
    commitRef.current = commit;
    errorRef.current = onError;
  }, [commit, onError]);

  useEffect(() => {
    const generation = new MapglRenderGeneration();
    generationRef.current = generation;
    return () => generation.dispose();
  }, []);

  return useCallback(async (build: () => Promise<T> | T): Promise<boolean> => {
    const isCurrent = generationRef.current.begin();
    try {
      const value = await build();
      if (!isCurrent()) {
        return false;
      }
      commitRef.current(value);
      return true;
    } catch (error) {
      if (isCurrent()) {
        errorRef.current?.(error);
      }
      return false;
    }
  }, []);
}

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
  fieldConfig,
  theme,
  initialTime,
}: {
  eventBus: EventBus;
  fieldConfig: MapglFieldConfig;
  theme: GrafanaTheme2;
  initialTime: number;
}) {
  const [time, setTime] = useState(initialTime);
  const configuredLegend = useMemo(
    () => edgeLegendItems(fieldConfig.defaults.thresholds?.steps, theme),
    [fieldConfig.defaults.thresholds?.steps, theme]
  );
  const [eventLegend, setEventLegend] = useState<VizLegendItem[] | null>(null);

  useEffect(() => {
    const hoverSub = eventBus
      .getStream(DataHoverEvent)
      .pipe(throttleTime(50))
      .subscribe((event) => {
        const nextTime = event.payload?.point?.time;
        if (nextTime) {
          setTime(nextTime);
        }
      });
    const thresholdSub = eventBus.subscribe(ThresholdEdgeChangeEvent, (event) => {
      const thresholds = (event.payload as unknown as { thresholds?: EdgeThresholdStep[] })?.thresholds;
      if (thresholds) {
        setEventLegend(edgeLegendItems(thresholds, theme));
      }
    });

    return () => {
      hoverSub.unsubscribe();
      thresholdSub.unsubscribe();
    };
  }, [eventBus, theme]);

  return { time, edgeLegend: eventLegend ?? configuredLegend };
}

export function useSvgIconRefresh(refresh: () => void): () => void {
  const frameRef = useRef<number | null>(null);
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    []
  );

  return useCallback(() => {
    if (frameRef.current !== null) {
      return;
    }
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      refreshRef.current();
    });
  }, []);
}

export function useDelayedHover(action: (info: any) => void, delayMs = 100) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionRef = useRef(action);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  return useCallback(
    (info: any) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (!info?.picked) {
        return;
      }
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        actionRef.current(info);
      }, delayMs);
    },
    [delayMs]
  );
}
