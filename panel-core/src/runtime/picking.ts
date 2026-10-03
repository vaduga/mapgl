import { Graph } from '../graph/main';
import { resolveGraphInteraction } from '../graph/frame/interaction';
import type { GraphScene } from './GraphScene';
import type { FocusRef } from '../store/PointStore';

export function resolvePickingFocus(
  scene: { baseline?: Pick<NonNullable<GraphScene['baseline']>, 'snapshot'>; render: GraphScene['render'] },
  info: any
): FocusRef | undefined {
  if (!info?.picked) {
    return undefined;
  }
  const state = {
    snapshot: scene.baseline?.snapshot,
    graph: { edgeIndex: scene.render.edgeIndex },
    features: scene.render.features,
  };
  const interaction = resolveGraphInteraction(state, info);
  if (interaction?.kind === 'node') {
    return { kind: 'node', id: interaction.record.id, namespaceId: interaction.record.namespaceId };
  }
  if (interaction?.kind === 'edge') {
    return {
      kind: 'edge',
      id: interaction.runtimeId ?? interaction.record.id,
      namespaceId: interaction.record.sourceNamespaceId,
    };
  }
  // A frame-backed pick that failed resolution belongs to an obsolete snapshot.
  const object = info.object;
  if (
    info.graphInteraction ||
    object?.graphInteraction ||
    object?.properties?.graphInteraction ||
    object?.graphFrame ||
    object?.properties?.graphFrame ||
    object?.feature?.properties?.graphFrame
  ) {
    return undefined;
  }
  let props = info.object?.properties ?? info.object;
  const points = info.sourceLayer?.props?.data?.points ?? info.layer?.props?.data?.points;
  let nodePick = false;
  if (points && (info.featureType === 'points' || info.viewport?.id === '3d-scene') && info.index !== -1) {
    props = scene.render.features[points.featureIds?.value?.[info.index]];
    nodePick = true;
  } else if (info.object?.pointIndex !== undefined) {
    nodePick = true;
  }
  if (nodePick && props?.locName) {
    const graph = props.graph instanceof Graph ? props.graph : scene.render.graph;
    const node = graph.findNode(props.locName) ?? scene.render.graph.findNodeRecursive(props.locName);
    if (node) {
      return {
        kind: 'node',
        id: node.id,
        namespaceId: String((node.parent as Graph | undefined)?.id ?? graph.id ?? ''),
      };
    }
  }
  const edgeId = info.object?.edgeId ?? info.object?.properties?.edgeId;
  const graph = info.object?.properties?.graph ?? info.object?.feature?.properties?.graph;
  return edgeId ? { kind: 'edge', id: edgeId, namespaceId: String(graph?.id ?? '') } : undefined;
}
