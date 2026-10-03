export type SvgIconLoader = (
  names: string[],
  icons: Record<string, any>,
  controller: AbortController
) => Promise<unknown>;

export type SvgIconRenderState = {
  revision: number;
  icons: Readonly<Record<string, any>>;
  signature: string;
};

export type SvgIconRequest = {
  requiredIconNames: Set<string>;
  signature: string;
};

export type SvgIconCache = Map<string, any>;

export class SvgIconManager {
  constructor(private readonly load: SvgIconLoader) {}
  private icons: Record<string, any> = {};
  private revision = 0;
  private signature = '';
  private requestId = 0;
  private loadController: AbortController | null = null;
  private readonly iconCache: SvgIconCache = new Map();

  get state(): SvgIconRenderState {
    return {
      revision: this.revision,
      icons: this.icons,
      signature: this.signature,
    };
  }

  get cache(): SvgIconCache {
    return this.iconCache;
  }

  async resolve(request: SvgIconRequest): Promise<SvgIconRenderState | undefined> {
    const requestId = ++this.requestId;
    this.loadController?.abort();
    this.loadController = new AbortController();
    const controller = this.loadController;

    const candidateIcons = { ...this.icons };
    const newNames = newUniqueIconNames(candidateIcons, request.requiredIconNames);
    try {
      if (newNames.length) {
        await this.load(newNames, candidateIcons, controller);
      }
    } catch (ex: any) {
      if (ex?.name === 'AbortError') {
        return undefined;
      }
      throw ex;
    }

    if (controller.signal.aborted || requestId !== this.requestId) {
      return undefined;
    }

    this.icons = candidateIcons;
    if (newNames.length || request.signature !== this.signature) {
      this.revision++;
      this.signature = request.signature;
      this.iconCache.clear();
    }

    return this.state;
  }

  abort() {
    this.loadController?.abort();
  }

  dispose() {
    this.abort();
    this.requestId++;
    this.icons = {};
    this.iconCache.clear();
    this.signature = '';
  }
}

function newUniqueIconNames(oldSvgIcons: Record<string, any>, newIconNames: Set<string>): string[] {
  return [...newIconNames].filter((icon) => !oldSvgIcons?.[icon]);
}
