import { resolveGraphInteraction, type GraphInteraction } from '../../graph/frame/interaction';
import type { GraphFrameSnapshot } from '../../graph/frame/types';
import { findEdge, getNodeData, Graph, type Edge, type Node } from '../../graph/main';
import type { EffectiveRenderState } from '../../runtime/GraphScene';
import type { FocusRef } from '../../store/PointStore';
import type { TooltipAnchor } from './TooltipView';

export interface TooltipScene {
  readonly snapshot?: GraphFrameSnapshot;
  readonly render: Pick<EffectiveRenderState, 'graph' | 'edgeIndex' | 'features'>;
  readonly isRouted?: boolean;
}

/** Retained identity contains no graph object, numeric edge reference or native source. */
export interface GraphTooltipTarget {
  readonly kind: 'node' | 'edge';
  readonly key: string;
  readonly id: string;
  readonly namespaceId: string;
  readonly hop?: {
    readonly unit: number;
    readonly ordinal: number;
    readonly source: string;
    readonly target: string;
  };
}

export interface GraphTooltipState {
  readonly target: GraphTooltipTarget;
  readonly anchor: TooltipAnchor;
  readonly context?: GraphTooltipTarget;
  readonly section?: { readonly id: string; readonly direction: 'incoming' | 'outgoing' };
}

export interface TooltipInspection {
  readonly target: GraphTooltipTarget;
  readonly title: string;
  readonly interaction?: GraphInteraction;
  readonly graph: Graph;
  readonly node?: Node;
  readonly edge?: Edge;
  readonly edgeRef?: number;
  readonly feature: Record<string, any>;
  readonly isRouted: boolean;
}

const nodeKey = (node: Node) => JSON.stringify([(node.parent as Graph | undefined)?.id, node.id]);

function edgeInspection(scene: TooltipScene, edge: Edge, interaction?: GraphInteraction): TooltipInspection {
  const { edgeIndex } = scene.render;
  const edgeRef = edgeIndex.getEdgeRef(edge);
  const routed = scene.isRouted !== false;
  const recordRef =
    interaction?.kind === 'edge'
      ? interaction.record.recordRef
      : edgeRef === undefined
        ? undefined
        : edgeIndex.getEdgeRecordRef(edgeRef);
  const snapshot = scene.snapshot;
  const hop =
    routed &&
    edgeRef !== undefined &&
    interaction?.kind === 'edge' &&
    interaction.edgeRef !== undefined &&
    recordRef !== undefined &&
    snapshot
      ? {
          unit: edgeIndex.getEdgeUnitRef(edgeRef) - snapshot.relations.getRecordUnitStart(recordRef),
          ordinal: edgeIndex.getEdgeSegmentOrdinal(edgeRef),
          source: nodeKey(edge.source),
          target: nodeKey(edge.target),
        }
      : undefined;
  const id = interaction?.kind === 'edge' ? interaction.record.id : String(edge.data?.edgeId ?? edge.id);
  return {
    target: {
      kind: 'edge',
      key: interaction?.key ?? edge.id,
      id,
      namespaceId: String((edge.source.parent as Graph).id),
      ...(hop && { hop }),
    },
    title: String(edge.data?.dataRecord?.locName ?? edge.source.id),
    interaction,
    graph: edge.source.parent as Graph,
    node: edge.source,
    edge,
    edgeRef,
    feature: edge.data?.dataRecord ?? {},
    isRouted: routed,
  };
}

function inputState(scene: TooltipScene) {
  return { snapshot: scene.snapshot, graph: { edgeIndex: scene.render.edgeIndex }, features: scene.render.features };
}

/** Decode only against the scene which produced the displayed pick. */
export function inspectGraphTooltip(scene: TooltipScene, info: any): TooltipInspection | undefined {
  if (!info) {
    return;
  }
  const interaction = resolveGraphInteraction(inputState(scene), info);
  const root = scene.render.graph;
  if (interaction?.kind === 'node') {
    const graph = [root, ...root.subgraphsBreadthFirst()].find((g) => g.id === interaction.record.namespaceId) as
      Graph | undefined;
    const node = graph?.findNode(interaction.record.id);
    if (node && graph) {
      return {
        target: { kind: 'node', key: interaction.key, id: node.id, namespaceId: graph.id },
        title: node.id,
        interaction,
        graph,
        node,
        feature: getNodeData(node)?.feature ?? {},
        isRouted: scene.isRouted !== false,
      };
    }
    return;
  }
  if (interaction?.kind === 'edge') {
    const { edgeIndex } = scene.render;
    const edgeRef = scene.isRouted === false ? undefined : interaction.edgeRef;
    const edge =
      edgeRef !== undefined && edgeRef < edgeIndex.edgeCount
        ? edgeIndex.getEdge(edgeRef)
        : edgeIndex.getFirstRecordEdge(interaction.record.recordRef);
    if (edge) {
      const result = edgeInspection(scene, edge, interaction);
      return scene.isRouted === false
        ? { ...result, edgeRef: undefined, target: { ...result.target, hop: undefined } }
        : result;
    }
    return;
  }
  const object = info.object;
  const feature = object?.properties ?? object?.feature?.properties ?? object;
  // Failed frame-backed picks are obsolete, not candidates for a label-only fallback.
  if (
    info.graphInteraction ||
    object?.graphInteraction ||
    feature?.graphFrame ||
    object?.feature?.properties?.graphFrame
  ) {
    return;
  }
  const graph = [root, ...root.subgraphsBreadthFirst()].find((g) => g.id === feature?.graph?.id) as Graph | undefined;
  const edgeId = object?.edgeId ?? object?.feature?.edgeId ?? feature?.edgeId;
  const edge = graph && edgeId !== undefined ? findEdge(graph, String(edgeId)) : undefined;
  if (edge) {
    return { ...edgeInspection(scene, edge), feature: { ...edge.data?.dataRecord, ...feature } };
  }
  const node = graph?.findNode(feature?.locName);
  return node && graph
    ? {
        target: { kind: 'node', key: nodeKey(node), id: node.id, namespaceId: graph.id },
        title: node.id,
        graph,
        node,
        feature: getNodeData(node)?.feature ?? feature,
        isRouted: scene.isRouted !== false,
      }
    : undefined;
}

/** Stable keys are rebound; old numeric references are never retained across frames. */
export function rebindGraphTooltip(scene: TooltipScene, target: GraphTooltipTarget): TooltipInspection | undefined {
  const snapshot = scene.snapshot;
  if (snapshot && target.kind === 'node') {
    const record = snapshot.nodeByKey.get(target.key);
    return record
      ? inspectGraphTooltip(scene, { object: { properties: { graphFrame: { key: record.key } } } })
      : undefined;
  }
  if (snapshot && target.kind === 'edge') {
    const recordRef = snapshot.relations.findRecordByKey(target.key);
    if (recordRef === undefined) {
      return;
    }
    let edgeRef: number | undefined;
    if (target.hop && scene.isRouted !== false) {
      const unit = snapshot.relations.getRecordUnitStart(recordRef) + target.hop.unit;
      if (target.hop.unit >= snapshot.relations.getRecordUnitCount(recordRef)) {
        return;
      }
      const [start, end] = scene.render.edgeIndex.getUnitRange(unit);
      edgeRef = start + target.hop.ordinal;
      if (edgeRef >= end) {
        return;
      }
      const edge = scene.render.edgeIndex.getEdge(edgeRef);
      if (nodeKey(edge.source) !== target.hop.source || nodeKey(edge.target) !== target.hop.target) {
        return;
      }
    }
    return inspectGraphTooltip(scene, {
      object: { edgeId: target.id, edgeRef, properties: { graphFrame: { key: target.key } } },
    });
  }
  const root = scene.render.graph;
  const graph = [root, ...root.subgraphsBreadthFirst()].find((g) => g.id === target.namespaceId);
  return graph
    ? inspectGraphTooltip(scene, {
        object: { ...(target.kind === 'edge' && { edgeId: target.id }), properties: { locName: target.id, graph } },
      })
    : undefined;
}

/** Runtime focus uses the fragment ID/namespace; public selection keeps the logical target. */
export function tooltipFocus(inspection: TooltipInspection): FocusRef {
  return inspection.edge
    ? { kind: 'edge', id: inspection.edge.id, namespaceId: String((inspection.edge.source.parent as Graph).id) }
    : { kind: 'node', id: inspection.target.id, namespaceId: inspection.target.namespaceId };
}

export function inspectTooltipEdge(scene: TooltipScene, edge: Edge) {
  const edgeRef = scene.render.edgeIndex.getEdgeRef(edge);
  return inspectGraphTooltip(scene, { object: { edgeRef, edgeId: edge.id, properties: edge.data?.dataRecord } });
}
