import { getNodeGroupsWithNodes, type Graph } from '../graph/main';
import type { Rule } from '../style/groups/ruleTypes';

export interface GroupLegendEntry {
  color: string;
  label: string;
  disabled: boolean;
  data: { rawLabel: string; groupIdx: number; hasNodes: boolean };
}
export function createGroupLegend(graph: Graph, groups: readonly Rule[], activeGroups: Uint8Array): GroupLegendEntry[] {
  const withNodes = getNodeGroupsWithNodes(graph);
  return groups.flatMap((group, index) => {
    if (!group.color) {
      return [];
    }
    const groupIdx = group.groupIdx ?? index;
    const label = group.label ?? group.color;
    return [
      {
        color: group.color,
        label,
        disabled: !activeGroups[groupIdx],
        data: { rawLabel: label, groupIdx, hasNodes: withNodes.has(groupIdx) },
      },
    ];
  });
}
