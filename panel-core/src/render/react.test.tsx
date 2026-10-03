import { getReadyViewport } from './runtime';
import React, { StrictMode, useMemo } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { PanelController } from '../runtime/PanelController';
import { SvgIconManager } from '../utils/SvgIconManager';
import { metricGraphInput, metricGraphSource } from '../../examples/neutral';
import { usePanelRenderSession } from './react';

it('exposes a renderer error to hosts without reconfiguring or rebuilding on notification', async () => {
  const controller = new PanelController();
  await controller.update(metricGraphInput(metricGraphSource('first', [0, 100])));
  const extend = jest.fn(() => ({}));
  const options = { presentation: { isLogic: true }, extend };
  const hook = renderHook(() => usePanelRenderSession(controller, options));
  await waitFor(() => expect(hook.result.current.frame).toBeDefined());
  const frame = hook.result.current.frame;
  extend.mockImplementation(() => {
    throw Error('Renderer unavailable');
  });
  await act(async () => {
    await hook.result.current.session!.build();
  });
  expect(hook.result.current.error).toBe('Renderer unavailable');
  expect(hook.result.current.frame).toBe(frame);
  const count = extend.mock.calls.length;
  await act(async () => {
    await Promise.resolve();
  });
  expect(extend).toHaveBeenCalledTimes(count);
  extend.mockImplementation(() => ({}));
  await act(async () => {
    await hook.result.current.session!.build();
  });
  expect(hook.result.current.error).toBeUndefined();
  hook.unmount();
  controller.dispose();
});

it('settles after publication and presentation rerenders under StrictMode, then replaces the controller lifetime', async () => {
  const first = new PanelController(),
    second = new PanelController();
  await first.update(metricGraphInput(metricGraphSource('first', [0, 100])));
  await second.update(metricGraphInput(metricGraphSource('second', [5])));
  const icons = new SvgIconManager(async () => undefined);
  const extend = jest.fn(() => ({}));
  const hook = renderHook(
    ({ controller }) => {
      const options = useMemo(
        () => ({
          presentation: { isLogic: true, svgIconState: icons.state },
          extend,
        }),
        [icons.state]
      );
      return usePanelRenderSession(controller, options);
    },
    { initialProps: { controller: first }, wrapper: StrictMode }
  );
  await waitFor(() => expect(hook.result.current.frame).toBeDefined());
  const accepted = hook.result.current.session!;
  const calls = extend.mock.calls.length;
  await act(async () => {
    hook.rerender({ controller: first });
  });
  expect(extend).toHaveBeenCalledTimes(calls);
  expect(hook.result.current.session).toBe(accepted);
  await act(async () => {
    await icons.resolve({ requiredIconNames: new Set(), signature: 'ready' });
    hook.rerender({ controller: first });
  });
  expect(extend).toHaveBeenCalledTimes(calls + 1);
  await act(async () => {
    hook.rerender({ controller: second });
  });
  await waitFor(() => expect(hook.result.current.frame?.input.generation).toBe(second.scene.version));
  expect(hook.result.current.session).not.toBe(accepted);
  expect(await accepted.build()).toBeUndefined();
  hook.unmount();
  await first.update(metricGraphInput(metricGraphSource('still-owned', [5])));
  expect(first.view.phase).toBe('ready');
  first.dispose();
  second.dispose();
  icons.dispose();
});

describe('viewport readiness', () => {
  it('waits for initialization before accessing viewports', () => {
    const viewport = { width: 800, height: 600 };
    const getViewports = jest.fn(() => [viewport]);
    const deck = { isInitialized: false, getViewports };
    expect(getReadyViewport(deck)).toBeUndefined();
    expect(getViewports).not.toHaveBeenCalled();
    deck.isInitialized = true;
    expect(getReadyViewport(deck)).toBe(viewport);
  });
});
