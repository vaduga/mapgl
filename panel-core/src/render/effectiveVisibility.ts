import { getTagAxes } from '../store/VisLayers';
import type { BiColProps } from '../types';
import { getNodeData } from '../graph/main';
import type { CapturedRenderInput } from './graph';

/** One captured visibility decision per canonical node, shared by all primitives. */
export interface EffectiveVisibility {
  readonly key: string;
  readonly groupCategories: number[];
  readonly groupCategory: (properties: any) => number;
  readonly groupTrigger: string;
  readonly tag: (properties: { tags?: BiColProps['tags']; style?: { group?: { groupIdx?: number } } } | undefined) => boolean;
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
  const contracted = input.presentation.isRouted && Boolean(input.projection?.contractsHiddenNamespaces);
  const key = JSON.stringify([
    vis.getLayerTree(),
    [...vis.getActiveGroups()],
    [...(vis.selectedGroups ?? [])],
    Array.from(vis.selectedTags, ([group, axes]) => [group, Array.from(axes, ([axis, tags]) => [axis, [...tags]])]),
    contracted,
  ]);
  const previous = cache.get(input.render.features);
  if (previous?.key === key && previous.edgeIndex === input.render.edgeIndex) {return previous.visibility;}
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
  // Two Deck category channels allow 64 distinct values per channel.
  const sharedSelection = vis.selectedTags.get('shared');
  const availableShared = sharedSelection && vis.getTagLegendRows(input.render.features, true).get('shared');
  const sharedAxes = new Map<number, Set<string>>();
  for (const [axis, tags] of sharedSelection ?? []) {
    const available = new Set([...tags].filter((tag) => availableShared?.get(axis)?.has(tag)));
    if (available.size) sharedAxes.set(axis, available);
  }
  const tagFilterActive = vis.selectedTags.size > 0;
  const booleanGroups = groups.length > 64;
  const tag: EffectiveVisibility['tag'] = (properties) => {
    if (properties?.tags === undefined) return true;
    const axes = getTagAxes(properties.tags);
    const local = vis.selectedTags.get(properties.style?.group?.groupIdx);
    for (const [axis, tags] of sharedAxes) {
      if (!axes[axis]?.some((value) => tags.has(value) || local?.get(axis)?.has(value))) return false;
    }
    for (const [axis, tags] of local ?? []) {
      if (!sharedAxes.has(axis) && !axes[axis]?.some((value) => tags.has(value))) return false;
    }
    return true;
  };
  const groupCategory = booleanGroups ? (properties: any) => Number(group(properties)) : groupId;
  const groupCategories = booleanGroups ? [1] : groups.filter((id) => vis.passesGroup(id === -1 ? undefined : id));
  const groupTrigger = tagFilterActive || booleanGroups ? key : 'node-groups';
  const namespace = (properties: any) => {
    const id = properties?.graph?.id;
    return id === undefined || names.has(id);
  };
  const passesNodeFilters = (properties: any) =>
    !!properties && dataLayer(properties.layerName) && group(properties) && tag(properties);
  const node = (properties: any) => passesNodeFilters(properties) && namespace(properties);
  const values = new Uint8Array(input.render.features.length);
  input.render.features.forEach((properties, index) => {
    // Pro hides original node symbols/cards, but an edge may still terminate
    // at that namespace's contracted anchor. Its data-layer, group and tag gates remain.
    values[index] = Number(passesNodeFilters(properties) && (contracted || namespace(properties)));
  });
  const nodeVisible = (endpoint: any) => {
    const ref = getNodeData(endpoint)?.wasmId;
    return ref !== undefined && values[ref] === 1;
  };
  const edge = (feature: any) => {
    const ref = feature?.edgeRef;
    if (!Number.isInteger(ref) || ref < 0 || ref >= input.render.edgeIndex.edgeCount) {return false;}
    const record = input.render.edgeIndex.getEdgeRecordRef(ref);
    const [start, end] = input.render.edgeIndex.getRecordRange(record);
    const source = input.render.edgeIndex.getEdge(start).source;
    const target = input.render.edgeIndex.getEdge(end - 1).target;
    return nodeVisible(source) && nodeVisible(target);
  };
  const visibility = { key, node, group, groupCategory, groupCategories, groupTrigger, tag, namespace, dataLayer, edge };
  cache.set(input.render.features, {
    key,
    edgeIndex: input.render.edgeIndex,
    visibility,
  });
  return visibility;
}
