import type { LayoutWorkerResource } from '../graph/utils/layout-worker-client';

declare const __webpack_public_path__: string;

export function createLayoutWorker(): LayoutWorkerResource | undefined {
  if (typeof Worker === 'undefined') {
    return undefined;
  }

  const publicPath = new URL(__webpack_public_path__, document.baseURI);
  const workerUrl = new URL('layout-worker.mjs', publicPath);
  // The initial worker URL must share the document's origin. Grafana Cloud
  // serves plugin assets from a CDN, so import the module from a same-origin blob.
  // A static import installs the worker's handlers before queued messages run.
  const bootstrapUrl = URL.createObjectURL(
    new Blob([`import ${JSON.stringify(workerUrl.href)};`], { type: 'application/javascript' })
  );

  try {
    const worker = new Worker(bootstrapUrl, { type: 'module' });
    return {
      worker,
      dispose: () => {
        worker.terminate();
        URL.revokeObjectURL(bootstrapUrl);
      },
    };
  } catch (error) {
    URL.revokeObjectURL(bootstrapUrl);
    throw error;
  }
}
