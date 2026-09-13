import { useCallback } from 'react';
import type { VizLegendItem } from '@grafana/ui';
import { ANNOTS_LABEL } from '../types/defaults';
import type { VisLayers } from '../store/VisLayers';

export function useNodeLegendClick({
  visLayers,
  hasAnnots,
  getGroupsLegend,
  setVisRefresh,
  setMobxLegendRefresh,
}: {
  visLayers: VisLayers;
  hasAnnots: boolean;
  getGroupsLegend: VizLegendItem[];
  setVisRefresh: (value: number) => void;
  setMobxLegendRefresh: (value: number) => void;
}) {
  return useCallback(
    (clickItem: VizLegendItem) => {
      const active_indexes = visLayers.getActiveGroups();
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

      visLayers.setActiveGroups(newStates);
      setVisRefresh(Math.random() + 1);
      setMobxLegendRefresh(Math.random() + 1);
    },
    [getGroupsLegend, visLayers, hasAnnots, setVisRefresh, setMobxLegendRefresh]
  );
}
