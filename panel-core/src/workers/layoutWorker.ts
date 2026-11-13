import type { LayoutWorkerResource } from '../graph/utils/layout-worker-client';

declare const __webpack_public_path__: string;

export function createLayoutWorkerBootstrap(workerUrl: string): string {
  // Static imports join the initial module-worker graph and are checked against
  // worker-src. Dynamic imports use script-src, which permits the plugin CDN.
  // Queue messages while importing so the first layout request cannot be lost.
  return `const pending = [];
self.onmessage = event => pending.push(event);
await import(${JSON.stringify(workerUrl)});
for (const event of pending) self.onmessage(event);
`;
}

export function createLayoutWorker(): LayoutWorkerResource | undefined {
  if (typeof Worker === 'undefined') {
    return undefined;
  }

  const publicPath = new URL(__webpack_public_path__, document.baseURI);
  const workerUrl = new URL('layout-worker.mjs', publicPath);
  // The initial worker URL must share the document's origin. Grafana Cloud
  // serves plugin assets from a CDN, so import the module from a same-origin blob.
  const bootstrapUrl = URL.createObjectURL(
    new Blob([createLayoutWorkerBootstrap(workerUrl.href)], { type: 'application/javascript' })
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
