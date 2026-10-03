import { GrafanaRuntimeSubscriptions } from '../runtime/subscriptions';
import React, { type PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Subject } from 'rxjs';
import { dateTime, LoadingState, type PanelData } from '@grafana/data';
import { useDelayedHover, useLatestRenderCommit, useEventState } from './runtime';

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
  it('commits only the newest async build and ignores completion after unmount', async () => {
    const commits: string[] = [];
    const resolvers: Array<(value: string) => void> = [];
    const wrapper = ({ children }: PropsWithChildren) => <React.StrictMode>{children}</React.StrictMode>;
    const { result, unmount } = renderHook(() => useLatestRenderCommit<string>((value) => commits.push(value)), {
      wrapper,
    });
    const build = () => new Promise<string>((resolve) => resolvers.push(resolve));

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    await act(async () => {
      first = result.current(build);
      second = result.current(build);
      resolvers[0]('old');
      await first;
      resolvers[1]('new');
      await second;
    });
    expect(commits).toEqual(['new']);

    let afterUnmount!: Promise<boolean>;
    act(() => {
      afterUnmount = result.current(build);
      unmount();
    });
    await act(async () => {
      resolvers[2]('disposed');
      await afterUnmount;
    });
    expect(commits).toEqual(['new']);
  });

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
