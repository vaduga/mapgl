import { useCallback } from 'react';
import type { VizLegendItem } from '@grafana/ui';

import type { GraphScene } from '@vaduga/mapgl-core/runtime';

export function useNodeLegendClick({ scene }: { scene: GraphScene }) {
  return useCallback(
    (clickItem: VizLegendItem) => {
      if (clickItem.data?.annotationToggle) {
        scene.toggleAnnotations();
        return;
      }
      const id = clickItem.data?.groupIdx;
      if (id !== undefined) scene.toggleGroup(id);
    },
    [scene]
  );
}
