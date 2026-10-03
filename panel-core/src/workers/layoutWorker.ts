import type { LayoutWorkerResource } from '../graph/utils/layout-worker-client';

declare const __webpack_public_path__: string;

export function createLayoutWorker(): LayoutWorkerResource | undefined {
  if (typeof Worker === 'undefined') {
    return undefined;
  }

  const publicPath = new URL(__webpack_public_path__, document.baseURI);
  const workerUrl = new URL('layout-worker.mjs', publicPath);
  const worker = new Worker(workerUrl, { type: 'module' });

  return {
    worker,
    dispose: () => worker.terminate(),
  };
}
