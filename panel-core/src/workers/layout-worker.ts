import type { LayoutRequest } from '../graph/utils/layout-worker-types';
import { dispatchLayout } from '../graph/utils/layout-dispatch';
import { getLayoutTransferables } from '../graph/utils/layout-result';

interface LayoutWorkerOnMessage {
  (event: MessageEvent<LayoutRequest>): void;
}

type LayoutWorkerScope = {
  onmessage: LayoutWorkerOnMessage | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
};

const workerScope = self as unknown as LayoutWorkerScope;

workerScope.onmessage = async ({ data }: MessageEvent<LayoutRequest>) => {
  try {
    const result = await dispatchLayout(data);
    workerScope.postMessage(result, getLayoutTransferables(result));
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      requestId: data.requestId,
      message: error instanceof Error ? (error.stack ?? error.message) : String(error),
    });
  }
};
