import type { EffectiveVisibility } from '../render/effectiveVisibility';

export function edgeFilterProps(effective: EffectiveVisibility | undefined, includeSkip = false) {
  return {
    getFilterCategory: (object: any) => {
      const feature = object.feature ?? object;
      return (!includeSkip || !feature.skip) && (effective?.edge(feature) ?? true) ? 1 : 0;
    },
    filterCategories: [1],
    updateTriggers: { getFilterCategory: [effective?.key, includeSkip] },
  };
}
