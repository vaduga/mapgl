import { createLayoutDispatcher, dispatchLayout } from './layout-dispatch';
import type { LayoutRequest, LayoutResult } from './layout-worker-types';
import { LayoutWorkerClient } from './layout-worker-client';

const request: LayoutRequest = {
  requestId: 1,
  operation: 'layout',
  routing: 'Splines',
  direction: 'LR',
  layerSeparation: 60,
  nodeSeparation: 40,
  rootGraphId: 'root',
  positionsLength: 4,
  graphs: [{ id: 'root' }],
  nodes: [
    { id: 'a', graphId: 'root', wasmId: 0, radius: 10 },
    { id: 'b', graphId: 'root', wasmId: 1, radius: 10 },
  ],
  edges: [
    { id: 'ab', sourceId: 'a', sourceGraphId: 'root', targetId: 'b', targetGraphId: 'root', targetArrowLength: 8 },
  ],
};

it('loads only the requested engine and shares an in-flight load', async () => {
  let ready!: (runner: (input: LayoutRequest) => LayoutResult) => void;
  const runner = jest.fn((input: LayoutRequest) => ({ requestId: input.requestId }) as LayoutResult);
  const msagl = jest.fn(
    () =>
      new Promise<(input: LayoutRequest) => LayoutResult>((resolve) => {
        ready = resolve;
      })
  );
  const elk = jest.fn(async () => runner);
  const dispatch = createLayoutDispatcher({ MSAGL: msagl, ELK: elk });
  const first = dispatch(request);
  const second = dispatch({ ...request, requestId: 2 });
  expect(msagl).toHaveBeenCalledTimes(1);
  expect(elk).not.toHaveBeenCalled();
  ready(runner);
  expect((await first).requestId).toBe(1);
  expect((await second).requestId).toBe(2);
  await dispatch({ ...request, engine: 'ELK' });
  expect(elk).toHaveBeenCalledTimes(1);
});

it('identifies failed engines and retries rejected loads', async () => {
  const runner = () => ({ requestId: 1 }) as LayoutResult;
  const elk = jest.fn().mockRejectedValueOnce(new Error('asset unavailable')).mockResolvedValue(runner);
  const dispatch = createLayoutDispatcher({ MSAGL: async () => runner, ELK: elk });
  await expect(dispatch({ ...request, engine: 'ELK' })).rejects.toThrow('ELK layout failed: asset unavailable');
  await expect(dispatch({ ...request, engine: 'ELK' })).resolves.toMatchObject({ requestId: 1 });
  expect(elk).toHaveBeenCalledTimes(2);
});

it.each(['MSAGL', 'ELK'] as const)('returns complete transferable geometry from %s', async (engine) => {
  const result = await dispatchLayout({ ...request, engine });
  expect(result.positions).toHaveLength(4);
  expect(result.graphs[0].id).toBe('root');
  expect(result.curveGroups![0].edgeIndexes[0]).toBe(0);
  expect(result.arrows.flags[0]).toBe(2);
  expect(Array.from(result.positions).every(Number.isFinite)).toBe(true);
});

it('ignores cancelled engine responses and settles pending work on disposal', async () => {
  const worker = { postMessage: jest.fn(), onmessage: undefined as any };
  const dispose = jest.fn();
  const client = new LayoutWorkerClient(() => ({ worker: worker as unknown as Worker, dispose }));
  const abort = new AbortController();
  const old = client.post({ ...request, requestId: 10 }, abort.signal);
  const current = client.post({ ...request, requestId: 11, engine: 'ELK' });
  abort.abort();
  expect(await old).toBeUndefined();
  const reply = (requestId: number) =>
    worker.onmessage({
      data: {
        requestId,
        routing: 'Splines',
        positions: new Float64Array(4),
        graphs: [],
        arrows: {
          edgeIndexes: new Int32Array(),
          flags: new Uint8Array(),
          sourceTips: new Float64Array(),
          targetTips: new Float64Array(),
        },
      },
    });
  reply(10);
  reply(11);
  expect((await current)?.positions).toHaveLength(4);
  const pending = client.post({ ...request, requestId: 12 });
  client.dispose();
  expect(await pending).toBeUndefined();
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(await client.post(request)).toBeUndefined();
});
