export interface RefreshControllerOptions {
  delayMs: number;
  isBlocked?: () => boolean;
  refresh: () => void | Promise<void>;
}

/** Coalesces refresh bursts and retains one trailing refresh while work is blocked or running. */
export class RefreshController {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private pending = false;
  private running = false;

  constructor(private readonly options: RefreshControllerOptions) {}

  schedule() {
    this.pending = true;
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.flush();
    }, this.options.delayMs);
  }

  resume() {
    if (this.timer === undefined) {
      this.flush();
    }
  }

  cancel() {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.pending = false;
  }

  private flush() {
    if (!this.pending || this.running || this.options.isBlocked?.()) {
      return;
    }

    this.pending = false;
    this.running = true;
    void Promise.resolve()
      .then(this.options.refresh)
      .finally(() => {
        this.running = false;
        this.resume();
      });
  }
}
