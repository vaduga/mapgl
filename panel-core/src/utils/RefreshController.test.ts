import { RefreshController } from './RefreshController';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('RefreshController', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('coalesces a burst of scheduled edits into one refresh', async () => {
    const refresh = jest.fn();
    const controller = new RefreshController({ delayMs: 150, refresh });

    controller.schedule();
    jest.advanceTimersByTime(100);
    controller.schedule();
    controller.schedule();
    jest.advanceTimersByTime(149);
    expect(refresh).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await Promise.resolve();

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('retains one trailing refresh when edits arrive during an active refresh', async () => {
    const firstRefresh = deferred();
    const refresh = jest
      .fn<Promise<void> | void, []>()
      .mockImplementationOnce(() => firstRefresh.promise)
      .mockResolvedValueOnce();
    const controller = new RefreshController({ delayMs: 150, refresh });

    controller.schedule();
    jest.advanceTimersByTime(150);
    await Promise.resolve();
    expect(refresh).toHaveBeenCalledTimes(1);

    controller.schedule();
    controller.schedule();
    jest.advanceTimersByTime(150);
    expect(refresh).toHaveBeenCalledTimes(1);

    firstRefresh.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
