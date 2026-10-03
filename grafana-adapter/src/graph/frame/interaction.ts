import type { ScopedVars } from '@grafana/data';
import { resolveGraphInteraction, type GraphInteraction } from '@vaduga/mapgl-core/graph/frame';
import { GrafanaSourceResolver } from '../../data';
export * from '@vaduga/mapgl-core/graph/frame';
export function resolvePanelGraphInteraction(
  input: { readonly scene: import('@vaduga/mapgl-core/runtime').GraphScene } | undefined,
  info: any
): GraphInteraction | undefined {
  const scene = input?.scene;
  return resolveGraphInteraction(
    { snapshot: scene?.baseline?.snapshot, graph: scene?.baseline?.graph.state, features: scene?.render.features },
    info
  );
}

export function resolveGraphInteractionRow(resolver: GrafanaSourceResolver | undefined, interaction: GraphInteraction) {
  const resolved = resolver?.resolve(interaction.row);
  return resolved ? { ...resolved, row: interaction.row } : undefined;
}

export function getGraphInteractionScopedVars(interaction: GraphInteraction): ScopedVars {
  return Object.fromEntries(
    Object.entries(interaction.values)
      .filter((entry): entry is [string, string] => entry[1] !== undefined)
      .map(([name, value]) => [name, { text: value, value }])
  );
}
