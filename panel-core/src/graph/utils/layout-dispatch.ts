import type { LayoutEngineConfig, LayoutRequest, LayoutResult } from './layout-worker-types';

type LayoutRunner = (request: LayoutRequest) => LayoutResult | Promise<LayoutResult>;
type LayoutLoaders = Record<LayoutEngineConfig, () => Promise<LayoutRunner>>;

/** Host delivery owns the loader; shared dispatch owns selection and error attribution. */
export function createLayoutDispatcher(loaders: LayoutLoaders) {
  const pending = new Map<LayoutEngineConfig, Promise<LayoutRunner>>();
  return async (request: LayoutRequest): Promise<LayoutResult> => {
    const engine = request.engine ?? 'MSAGL';
    try {
      let loading = pending.get(engine);
      if (!loading) {
        loading = loaders[engine]();
        pending.set(engine, loading);
        loading.catch(() => pending.delete(engine));
      }
      return await (
        await loading
      )(request);
    } catch (error) {
      throw new Error(`${engine} layout failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}

export const dispatchLayout = createLayoutDispatcher({
  MSAGL: () => import(/* webpackChunkName: "layout-msagl" */ './layout-worker-runner').then((m) => m.getLayoutResult),
  ELK: () => import(/* webpackChunkName: "layout-elk" */ './elk-layout').then((m) => m.getElkLayoutResult),
});
