import { useCallback } from 'react';
import type { VizLegendItem } from '@grafana/ui';
import { ANNOTS_LABEL } from '../types/annotations';

import type { GraphScene } from '@vaduga/mapgl-core/runtime';

export function useNodeLegendClick({
  scene,
  hasAnnots,
  getGroupsLegend,
}: {
  scene: GraphScene;
  hasAnnots: boolean;
  getGroupsLegend: VizLegendItem[];
}) {
  return useCallback(
    (clickItem: VizLegendItem) => {
      const active_indexes = scene.visibility.getActiveGroups().slice();
      const allChecked = active_indexes.every((item) => item);

      let newStates;
      if (hasAnnots && clickItem.data?.rawLabel === ANNOTS_LABEL) {
        active_indexes[active_indexes.length - 1] = active_indexes[active_indexes.length - 1] ? 0 : 1;
        newStates = active_indexes;
      } else {
        const itemIdx = clickItem.data.groupIdx;
        const unCheck = !allChecked && itemIdx > -1 && active_indexes[itemIdx];

        newStates = active_indexes.map((item, i) => {
          if (hasAnnots && i === itemIdx) {
            return 1;
          }

          if (i === itemIdx) {
            return 1;
          } else {
            return unCheck ? 1 : 0;
          }
        });
      }

      scene.setActiveGroups(newStates);
    },
    [getGroupsLegend, scene, hasAnnots]
  );
}
