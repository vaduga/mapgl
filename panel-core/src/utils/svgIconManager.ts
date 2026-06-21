import { loadSvgIcons, newUniqueIconNames } from './plugin';

export type SvgIconRenderState = {
  revision: number;
  icons: Readonly<Record<string, any>>;
  signature: string;
};

export type SvgIconRequest = {
  requiredIconNames: Set<string>;
  signature: string;
};

export class SvgIconManager {
  private icons: Record<string, any> = {};
  private revision = 0;
  private signature = '';
  private requestId = 0;
  private loadController: AbortController | null = null;

  get state(): SvgIconRenderState {
    return {
      revision: this.revision,
      icons: this.icons,
      signature: this.signature,
    };
  }

  async resolve(request: SvgIconRequest): Promise<SvgIconRenderState | undefined> {
    const requestId = ++this.requestId;
    this.loadController?.abort();
    this.loadController = new AbortController();
    const controller = this.loadController;

    const newNames = newUniqueIconNames(this.icons, request.requiredIconNames);
    try {
      if (newNames.length) {
        await loadSvgIcons(newNames, this.icons, controller);
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

    if (newNames.length || request.signature !== this.signature) {
      this.revision++;
      this.signature = request.signature;
    }

    return this.state;
  }

  abort() {
    this.loadController?.abort();
  }
}
