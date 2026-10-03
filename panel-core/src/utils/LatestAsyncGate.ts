export type LatestAsyncGuard = (() => boolean) & { readonly signal?: AbortSignal };

/**
 * Serializes async panel rebuilds while letting the newest request invalidate any
 * older request at its next async boundary.
 */
export class LatestAsyncGate {
  private requestId = 0;
  private disposed = false;
  private abort?: AbortController;
  private queue: Promise<void> = Promise.resolve();

  run<T>(task: (isCurrent: LatestAsyncGuard) => Promise<T>): Promise<T | undefined> {
    this.abort?.abort();
    const abort = (this.abort = new AbortController());
    const requestId = ++this.requestId;
    const previous = this.queue;
    let release!: () => void;

    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });

    return previous
      .catch(() => undefined)
      .then(async () => {
        if (!this.isCurrent(requestId)) {
          return undefined;
        }

        return task(Object.assign(() => this.isCurrent(requestId), { signal: abort.signal }));
      })
      .finally(release);
  }

  invalidate() {
    this.abort?.abort();
    this.requestId++;
  }

  dispose() {
    this.disposed = true;
    this.invalidate();
  }

  private isCurrent(requestId: number) {
    return !this.disposed && requestId === this.requestId;
  }
}
