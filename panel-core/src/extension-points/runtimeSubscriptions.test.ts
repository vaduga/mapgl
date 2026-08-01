import type { Graph } from '../graph/main';
import {
  annotationTimeRuntimeSubscriptionProvider,
  RuntimeSubscriptionController,
  type RuntimeSubscription,
  type RuntimeSubscriptionContext,
  type RuntimeSubscriptionProvider,
} from './featureContracts';

function context(id: string): RuntimeSubscriptionContext {
  return {
    graph: {} as Graph,
    options: { id },
    publish: jest.fn(),
  };
}

describe('RuntimeSubscriptionController', () => {
  it('enables annotation-time updates only when annotation frames are present', () => {
    const withoutAnnotations = {
      ...context('none'),
      data: { annotations: [] } as unknown as RuntimeSubscriptionContext['data'],
    };
    const withAnnotations = {
      ...context('annotations'),
      data: { annotations: [{}] } as unknown as RuntimeSubscriptionContext['data'],
    };

    expect(annotationTimeRuntimeSubscriptionProvider.isEnabled?.(withoutAnnotations)).toBe(false);
    expect(annotationTimeRuntimeSubscriptionProvider.isEnabled?.(withAnnotations)).toBe(true);
  });

  it('replays the latest data change received while subscriptions are starting', async () => {
    let finishStart: ((subscription: RuntimeSubscription) => void) | undefined;
    const onDataChange = jest.fn();
    const provider: RuntimeSubscriptionProvider = {
      id: 'async',
      start: () =>
        new Promise((resolve) => {
          finishStart = resolve;
        }),
    };
    const controller = new RuntimeSubscriptionController([provider]);
    const start = controller.start(context('start'));

    controller.onDataChange(context('first'));
    const latest = context('latest');
    controller.onDataChange(latest);
    finishStart?.({ dispose: jest.fn(), onDataChange });
    await start;

    expect(onDataChange).toHaveBeenCalledTimes(1);
    expect(onDataChange).toHaveBeenCalledWith(latest);
  });

  it('dispatches subsequent data changes immediately after startup', async () => {
    const onDataChange = jest.fn();
    const provider: RuntimeSubscriptionProvider = {
      id: 'sync',
      start: () => ({ dispose: jest.fn(), onDataChange }),
    };
    const controller = new RuntimeSubscriptionController([provider]);
    await controller.start(context('start'));

    const update = context('update');
    controller.onDataChange(update);

    expect(onDataChange).toHaveBeenCalledTimes(1);
    expect(onDataChange).toHaveBeenCalledWith(update);
  });

  it('drops queued data changes when disposed before startup completes', async () => {
    let finishStart: ((subscription: RuntimeSubscription) => void) | undefined;
    const onDataChange = jest.fn();
    const provider: RuntimeSubscriptionProvider = {
      id: 'async',
      start: () =>
        new Promise((resolve) => {
          finishStart = resolve;
        }),
    };
    const controller = new RuntimeSubscriptionController([provider]);
    const start = controller.start(context('start'));

    controller.onDataChange(context('queued'));
    controller.dispose();
    finishStart?.({ dispose: jest.fn(), onDataChange });
    await start;

    expect(onDataChange).not.toHaveBeenCalled();
  });
});
