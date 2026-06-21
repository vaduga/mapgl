import type { LayoutRequest, LayoutResult } from '../graph/utils/layout-worker-types';
import { getLayoutResult } from '../graph/utils/layout-worker-runner';

interface LayoutWorkerOnMessage {
  (event: MessageEvent<LayoutRequest>): void;
}

type LayoutWorkerScope = {
  onmessage: LayoutWorkerOnMessage | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
};

const workerScope = self as unknown as LayoutWorkerScope;

workerScope.onmessage = ({ data }: MessageEvent<LayoutRequest>) => {
  try {
    const result = getLayoutResult(data);
    workerScope.postMessage(result, getTransferables(result));
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      requestId: data.requestId,
      message: error instanceof Error ? (error.stack ?? error.message) : String(error),
    });
  }
};

function getTransferables(result: LayoutResult): Transferable[] {
  return [
    result.positions.buffer,
    result.arrows.edgeIndexes.buffer,
    result.arrows.flags.buffer,
    result.arrows.sourceTips.buffer,
    result.arrows.targetTips.buffer,
    ...(result.curveGroups ?? []).flatMap((group) => [
      group.edgeIndexes.buffer,
      group.edgeSegmentOffsets.buffer,
      group.types.buffer,
      group.controlPoints.buffer,
      group.segments.buffer,
    ]),
  ];
}
