import { Graph } from '@vaduga/mapgl-core/graph/main';
import { GrafanaRuntimeSubscriptions } from './subscriptions';
import type { GrafanaRuntimeSubscriptionContext } from './contracts';

const context = (revision: string, enabled = true): GrafanaRuntimeSubscriptionContext => ({
  graph: new Graph('root'),
  revision,
  options: { enabled },
  publish: jest.fn(),
});

it('retains panel bindings and transports across graph refresh, without awaiting transport startup', async () => {
  let finish!: (value: { dispose: () => void }) => void;
  const transportDispose = jest.fn();
  const start = jest.fn(
    () =>
      new Promise<{ dispose: () => void }>((resolve) => {
        finish = resolve;
      })
  );
  const graphDispose = jest.fn();
  const owner = new GrafanaRuntimeSubscriptions([
    { id: 'live', lifetime: 'panel', start },
    { id: 'annotations', start: () => ({ dispose: graphDispose }) },
  ]);
  owner.updatePanel(context('first'));
  const selectionStart = jest.fn(() => jest.fn());
  const binding = { id: 'selection', keys: ['bus'], start: selectionStart };
  const release = owner.bindPanel(binding);
  expect(selectionStart).toHaveBeenCalledTimes(1);
  expect(owner.bindPanel(binding)).toBe(release);
  await owner.start(context('first'));
  await owner.start(context('replacement'));
  expect(start).toHaveBeenCalledTimes(1);
  expect(graphDispose).toHaveBeenCalledTimes(1);
  owner.dispose();
  finish({ dispose: transportDispose });
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(transportDispose).toHaveBeenCalledTimes(1);
});

it('reconciles enabled/configured transports and uses the latest publisher', async () => {
  const dispose = jest.fn();
  let publish!: GrafanaRuntimeSubscriptionContext['publish'];
  const start = jest.fn((scope: GrafanaRuntimeSubscriptionContext) => {
    publish = scope.publish;
    return { dispose };
  });
  const owner = new GrafanaRuntimeSubscriptions([
    {
      id: 'live',
      lifetime: 'panel',
      start,
      isEnabled: (scope) => (scope.options as { enabled: boolean }).enabled,
      connectionKey: (scope) => scope.sources,
    },
  ]);
  const first = context('first');
  owner.updatePanel(first);
  await new Promise((resolve) => setTimeout(resolve, 0));
  const next = context('next');
  owner.updatePanel(next);
  const event = { type: 'live.node.metric.updated', nodeId: 'A', metric: 'metric', value: 10 } as const;
  publish(event);
  expect(first.publish).not.toHaveBeenCalled();
  expect(next.publish).toHaveBeenCalledWith(event);
  owner.updatePanel(context('disabled', false));
  publish(event);
  expect(next.publish).toHaveBeenCalledTimes(1);
  expect(dispose).toHaveBeenCalledTimes(1);
  owner.updatePanel(context('enabled'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  owner.updatePanel({ ...context('configured'), sources: [] });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(start).toHaveBeenCalledTimes(3);
  owner.dispose();
  expect(dispose).toHaveBeenCalledTimes(3);
});

it('cleans up replaced bindings once and ignores releases belonging to old identities', () => {
  const owner = new GrafanaRuntimeSubscriptions([]);
  const cleanups = [jest.fn(), jest.fn()];
  const signals: AbortSignal[] = [];
  const start = (index: number) => (signal: AbortSignal) => {
    signals.push(signal);
    return cleanups[index];
  };
  const oldRelease = owner.bindPanel({ id: 'selection', keys: ['old-bus'], start: start(0) });
  const release = owner.bindPanel({ id: 'selection', keys: ['new-bus'], start: start(1) });
  oldRelease();
  expect(signals[0].aborted).toBe(true);
  expect(signals[1].aborted).toBe(false);
  release();
  owner.dispose();
  expect(cleanups[0]).toHaveBeenCalledTimes(1);
  expect(cleanups[1]).toHaveBeenCalledTimes(1);
});
