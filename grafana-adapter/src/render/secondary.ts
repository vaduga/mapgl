import type { MapLayerState } from '../types';
import type { SecondaryRenderDescriptor } from '@vaduga/mapgl-core/render';

/** Native layer registry translation ends here; core only sees prepared geometry. */
export function secondaryRenderDescriptors(
  isLogic: boolean,
  layers: readonly MapLayerState[]
): SecondaryRenderDescriptor[] {
  if (isLogic) {
    return [];
  }
  return layers.slice(1).flatMap((state) => {
    const kind = state.options.type;
    const layer = state.layer;
    if (
      typeof layer !== 'object' ||
      !layer ||
      !('features' in layer) ||
      ('colType' in layer && layer.colType === 'markers') ||
      !layer.features?.length ||
      (kind !== 'polygons' && kind !== 'path' && kind !== 'geojson')
    ) {
      return [];
    }
    return [
      { kind, name: state.options.name, features: layer.features, pickable: Boolean(state.options.isShowTooltip) },
    ];
  });
}
