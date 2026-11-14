import { getNodeData } from '../graph/main';
import type { CapturedRenderInput } from './graph';

/** One captured visibility decision per canonical node, shared by all primitives. */
export interface EffectiveVisibility {
  readonly key: string;
  readonly groupCategories: number[];
  readonly groupCategory: (properties: any) => number;
  readonly groupTrigger: string;
  readonly node: (properties: any) => boolean;
  readonly group: (properties: any) => boolean;
  readonly namespace: (properties: any) => boolean;
  readonly dataLayer: (id: string | undefined) => boolean;
  readonly edge: (feature: any) => boolean;
}
const cache = new WeakMap<
  object,
  { key: string; edgeIndex: object; visibility: EffectiveVisibility }
>();

export function captureEffectiveVisibility(input: CapturedRenderInput): EffectiveVisibility {
  const vis = input.visibility;
  const key = JSON.stringify([
    vis.getLayerTree(),
    [...vis.getActiveGroups()],
    [...(vis.selectedGroups ?? [])],
    input.projection?.rendererFiltering,
  ]);
  const previous = cache.get(input.render.features);
  if (previous?.key === key && previous.edgeIndex === input.render.edgeIndex) return previous.visibility;
  const names = new Set(vis.getVisibleGraphNamespaces());
  const layers = vis.getLayerTree().flatMap((layer) => (layer.group === 'markers' ? layer.children : []));
  const dataLayer = (id: string | undefined) => {
    const layer = layers.find((layer) => layer.name === id);
    return !layer || (layer.visible && !layer.indeterminate);
  };
  const group = (properties: any) => {
    return vis.passesGroup(properties?.style?.group?.groupIdx);
  };
  const groupId = (properties: any) => properties?.style?.group?.groupIdx ?? -1;
  const groups = [...new Set(input.render.features.map(groupId))];
  // The usual multi-group path changes only category uniforms, not attributes.
  // Large group domains use a bounded boolean category to stay within Deck's 128-category budget.
  const booleanGroups = groups.length > 128;
  const groupCategory = booleanGroups ? (properties: any) => Number(group(properties)) : groupId;
  const groupCategories = booleanGroups ? [1] : groups.filter((id) => vis.passesGroup(id === -1 ? undefined : id));
  const groupTrigger = booleanGroups ? key : 'node-groups';
  const namespace = (properties: any) => {
    const id = properties?.graph?.id;
    return id === undefined || names.has(id);
  };
  const passesLayerAndGroup = (properties: any) =>
    !!properties && dataLayer(properties.layerName) && group(properties);
  const node = (properties: any) => passesLayerAndGroup(properties) && namespace(properties);
  const contracted = input.projection?.rendererFiltering === 'none';
  const values = new Uint8Array(input.render.features.length);
  input.render.features.forEach((properties, index) => {
    // Pro hides original node symbols/cards, but an edge may still terminate
    // at that namespace's contracted anchor. Its data-layer/group gates remain.
    values[index] = Number(passesLayerAndGroup(properties) && (contracted || namespace(properties)));
  });
  const nodeVisible = (endpoint: any) => {
    const ref = getNodeData(endpoint)?.wasmId;
    return ref !== undefined && values[ref] === 1;
  };
  const edge = (feature: any) => {
    const ref = feature?.edgeRef;
    if (!Number.isInteger(ref) || ref < 0 || ref >= input.render.edgeIndex.edgeCount) return false;
    const record = input.render.edgeIndex.getEdgeRecordRef(ref);
    const arc = feature.sourcePosition !== undefined;
    const [start, end] = input.render.edgeIndex.getRecordRange(record);
    const source = input.render.edgeIndex.getEdge(arc ? start : ref).source;
    const target = input.render.edgeIndex.getEdge(arc ? end - 1 : ref).target;
    return nodeVisible(source) && nodeVisible(target);
  };
  const visibility = { key, node, group, groupCategory, groupCategories, groupTrigger, namespace, dataLayer, edge };
  cache.set(input.render.features, {
    key,
    edgeIndex: input.render.edgeIndex,
    visibility,
  });
  return visibility;
}
