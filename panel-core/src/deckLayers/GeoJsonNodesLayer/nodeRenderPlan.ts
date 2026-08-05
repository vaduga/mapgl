import { colTypes } from '@mapgl/panel-core/types';

import { isVisible } from '../utils/visibility';

export const getNodePointType = (requestedPointType: string | undefined, hasActiveUserSvg: boolean): string => {
  return (requestedPointType ?? 'circle+icon+text')
    .split('+')
    .filter((type) => type !== 'icon' || hasActiveUserSvg)
    .join('+');
};

export const getNodeLayerVisibility = (getVisLayers: any) => ({
  circle: isVisible(getVisLayers, {
    index: null,
    name: colTypes.Circle,
    group: colTypes.Circle,
  }),
  svg: isVisible(getVisLayers, {
    index: null,
    name: colTypes.SVG,
    group: colTypes.SVG,
  }),
  labels: isVisible(getVisLayers, {
    index: null,
    name: colTypes.Label,
    group: colTypes.Label,
  }),
});
