import type { LayoutRequest, LayoutResult } from '../graph/utils/layout-worker-types';
import { getLayoutResult } from '../graph/utils/layout-worker-runner';
import { getElkLayoutResult } from '../graph/utils/elk-layout';

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
    const result = data.engine === 'ELK' ? await getElkLayoutResult(data) : getLayoutResult(data);
    workerScope.postMessage(result, getLayoutTransferables(result));
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      requestId: data.requestId,
      message: error instanceof Error ? (error.stack ?? error.message) : String(error),
    });
  }
};

export function getLayoutTransferables(result: LayoutResult): Transferable[] {
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
