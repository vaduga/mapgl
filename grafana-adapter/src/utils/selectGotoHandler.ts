import type { handlerProps } from '../components/Menu/ReactSelectSearch';
import { SelectNodeEvent } from './bus.events';

export const selectGotoHandler = async ({
  pId,
  value,
  graphId,
  eventBus,
  coord,
  select,
  fly,
  edge,
  edgeId,
  zoomIn,
}: Partial<handlerProps>) => {
  const payload: SelectNodeEvent['payload'] = {
    ...(graphId !== undefined && { graphId }),
    ...(value !== undefined && { nodeId: value }),
    ...(select !== undefined && { select }),
    ...(edge !== undefined ? { edge } : edgeId !== undefined ? { edgeId } : {}),
    ...(coord !== undefined && { coord }),
    ...(fly !== undefined && { fly }),
    ...(zoomIn !== undefined && { zoomIn }),
    pId: pId as number,
  };
  eventBus?.publish({
    type: 'selectNode',
    payload,
  });
};
