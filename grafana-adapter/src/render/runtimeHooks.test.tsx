import { annotationTimeRuntimeSubscriptionProvider } from '../runtime/annotationTime';
import { GrafanaRuntimeSubscriptions } from '../runtime/subscriptions';
import { act, renderHook } from '@testing-library/react';
import { Subject } from 'rxjs';
import { dateTime, LoadingState, type PanelData } from '@grafana/data';
import { useEventState } from './runtime';
import { useDelayedHover } from '@vaduga/mapgl-core/render/runtime';

const theme = {
  visualization: { getColorByName: (color: string) => color },
} as any;

function panelData(to: number): PanelData {
  return {
    state: LoadingState.Done,
    series: [],
    timeRange: { from: dateTime(0), to: dateTime(to), raw: { from: dateTime(0), to: dateTime(to) } },
  };
}

describe('Mapgl runtime hooks', () => {
  it('owns hover and threshold subscriptions', () => {
    const hover = new Subject<any>();
    const unsubscribe = jest.fn();
    let thresholdHandler: ((event: any) => void) | undefined;
    const eventBus = {
      getStream: () => hover,
      subscribe: (_type, handler) => {
        thresholdHandler = handler;
        return { unsubscribe };
      },
    } as any;
    const fieldConfig = { defaults: { thresholds: { steps: [{ color: 'green', value: null }] } } } as any;
    const subscriptions = new GrafanaRuntimeSubscriptions([]);
    const data = panelData(10);
    const { result, unmount } = renderHook(() => useEventState({ subscriptions, eventBus, fieldConfig, theme, data }));
    expect(result.current.time).toBe(10);

    act(() => hover.next({ payload: { point: { time: 20 } } }));
    expect(result.current.time).toBe(20);
    expect(result.current.edgeLegend[0].label).toBe('-Inf');

    act(() => thresholdHandler?.({ payload: { thresholds: [{ color: 'red', value: 5 }] } }));
    expect(result.current.edgeLegend[0]).toMatchObject({ color: 'red', label: '5' });
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(hover.observed).toBe(false);
  });

  it('resets annotation time to the range end on refresh, even when the historical range is unchanged', () => {
    jest.useFakeTimers();
    const hover = new Subject<any>();
    const eventBus = {
      getStream: () => hover,
      subscribe: () => ({ unsubscribe: jest.fn() }),
    } as any;
    const subscriptions = new GrafanaRuntimeSubscriptions([]);
    const fieldConfig = { defaults: {} };
    const data = panelData(100);
    const { result, rerender, unmount } = renderHook(
      ({ data }) => useEventState({ subscriptions, eventBus, fieldConfig, theme, data }),
      { initialProps: { data } }
    );
    const observedTimes: number[] = [];
    expect(result.current.time).toBe(100);
    act(() => hover.next({ payload: { point: { time: 25 } } }));
    expect(result.current.time).toBe(25);
    rerender({ data });
    expect(result.current.time).toBe(25);

    rerender({ data: panelData(100) });
    observedTimes.push(result.current.time);
    act(() => jest.advanceTimersByTime(50));
    act(() => hover.next({ payload: { point: { time: 30 } } }));
    expect(result.current.time).toBe(30);
    rerender({ data: panelData(200) });
    observedTimes.push(result.current.time);
    rerender({ data: panelData(0) });
    observedTimes.push(result.current.time);
    expect(observedTimes).toEqual([100, 200, 0]);
    unmount();
    expect(hover.observed).toBe(false);
    jest.useRealTimers();
  });

  it('cleans up a pending delayed hover action', () => {
    jest.useFakeTimers();
    const action = jest.fn();
    const { result, unmount } = renderHook(() => useDelayedHover(action, 100));
    act(() => result.current({ picked: true }));
    unmount();
    act(() => jest.runAllTimers());
    expect(action).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});

it.each([0, 1])('enables annotation-time updates only with annotation frames (count: %i)', (count) => {
  expect(
    annotationTimeRuntimeSubscriptionProvider.isEnabled?.({
      graph: { id: 'annotations' },
      publish: jest.fn(),
      data: { annotations: Array(count).fill({}) },
    } as any)
  ).toBe(Boolean(count));
});
