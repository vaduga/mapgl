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
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ graph: latest.graph, options: latest.options, signal: expect.any(AbortSignal) })
    );
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
    expect(onDataChange).toHaveBeenCalledWith(
      expect.objectContaining({ graph: update.graph, options: update.options, signal: expect.any(AbortSignal) })
    );
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

it('does not start later providers after disposal during asynchronous startup', async () => {
  const pending = deferred<RuntimeSubscription>();
  const dispose = jest.fn();
  const later = jest.fn(() => ({ dispose: jest.fn() }));
  const controller = new RuntimeSubscriptionController([
    { id: 'pending', start: () => pending.promise },
    { id: 'later', start: later },
  ]);
  const starting = controller.start(context('old'));
  controller.dispose();
  pending.resolve({ dispose });
  await starting;
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(later).not.toHaveBeenCalled();
});

it('suppresses stale publication and invalidates pending annotation updates', async () => {
  let startup!: RuntimeSubscriptionContext;
  const updates: RuntimeSubscriptionContext[] = [];
  const controller = new RuntimeSubscriptionController([
    {
      id: 'events',
      start: (value) => {
        startup = value;
        return {
          dispose: jest.fn(),
          onDataChange: (value) => {
            updates.push(value);
          },
        };
      },
    },
  ]);
  const input = context('panel');
  await controller.start(input);
  controller.onDataChange(input);
  controller.onDataChange(input);
  expect(updates[0].signal?.aborted).toBe(true);
  expect(updates[1].signal?.aborted).toBe(false);
  controller.dispose();
  startup.publish({ type: 'live.node.metric.updated', nodeId: 'node', metric: 'metric', value: 7 });
  expect(input.publish).not.toHaveBeenCalled();
  expect(updates[1].signal?.aborted).toBe(true);
});

it('disposes successful providers when a later startup fails and can restart', async () => {
  const dispose = jest.fn();
  const start = jest.fn().mockRejectedValueOnce(new Error('failed')).mockResolvedValue({ dispose: jest.fn() });
  const controller = new RuntimeSubscriptionController([
    { id: 'first', start: () => ({ dispose }) },
    { id: 'failing', start },
  ]);
  await expect(controller.start(context('first'))).rejects.toThrow('failed');
  expect(dispose).toHaveBeenCalledTimes(1);
  await controller.start(context('retry'));
  controller.dispose();
  expect(dispose).toHaveBeenCalledTimes(2);
});

it('keeps concurrent panels independent and re-evaluates capability changes on restart', async () => {
  const starts: RuntimeSubscriptionContext[] = [];
  const provider: RuntimeSubscriptionProvider = {
    id: 'capability',
    isEnabled: (value) => (value.options as { enabled?: boolean }).enabled === true,
    start: (value) => {
      starts.push(value);
      return { dispose: jest.fn() };
    },
  };
  const first = new RuntimeSubscriptionController([provider]);
  const second = new RuntimeSubscriptionController([provider]);
  const enabled = { ...context('enabled'), options: { enabled: true } };
  await first.start(enabled);
  await second.start(enabled);
  await first.start({ ...enabled, options: { enabled: false } });
  expect(starts).toHaveLength(2);
  expect(starts[0].signal?.aborted).toBe(true);
  expect(starts[1].signal?.aborted).toBe(false);
  await first.start(enabled);
  expect(starts).toHaveLength(3);
  first.dispose();
  second.dispose();
});
