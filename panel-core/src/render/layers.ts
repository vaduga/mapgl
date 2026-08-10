import type { Layer } from '@deck.gl/core';

export type RenderLayer = Layer<any>;

export interface RenderLayerBundle {
  secondary?: readonly RenderLayer[];
  bounds?: readonly RenderLayer[];
  baseEdges?: readonly RenderLayer[];
  edges?: readonly RenderLayer[];
  nodes?: readonly RenderLayer[];
  path?: RenderLayer | null;
  pathExtension?: RenderLayer | null;
  pathNumbers?: RenderLayer | null;
  comments?: RenderLayer | null;
  labels?: readonly RenderLayer[];
  cluster?: RenderLayer | null;
}

export interface ComposeRenderLayersOptions {
  nodesBeforeEdges?: boolean;
  transient?: ReadonlyArray<RenderLayer | null | undefined>;
}

function compact(layers: ReadonlyArray<RenderLayer | null | undefined>): RenderLayer[] {
  return layers.filter((layer): layer is RenderLayer => layer != null);
}

export function composeRenderLayers(
  bundle: RenderLayerBundle,
  { nodesBeforeEdges = false, transient = [] }: ComposeRenderLayersOptions = {}
): RenderLayer[] {
  const nodesAndEdges = nodesBeforeEdges
    ? [...(bundle.nodes ?? []), ...(bundle.edges ?? [])]
    : [...(bundle.edges ?? []), ...(bundle.nodes ?? [])];
  const layers = compact([
    ...(bundle.secondary ?? []),
    ...(bundle.bounds ?? []),
    ...(bundle.baseEdges ?? []),
    ...nodesAndEdges,
    bundle.comments,
    ...(bundle.labels ?? []),
  ]);

  if (bundle.path) {
    layers.unshift(bundle.path);
  }

  layers.push(...compact([bundle.pathExtension, bundle.pathNumbers, ...transient, bundle.cluster]));
  return layers;
}

export function replaceRenderLayers(
  current: readonly RenderLayer[],
  replacements: ReadonlyArray<RenderLayer | null | undefined>,
  removeIds: readonly string[] = []
): RenderLayer[] {
  const replacementById = new Map(
    compact(replacements)
      .filter((layer) => layer.id != null)
      .map((layer) => [layer.id, layer])
  );
  const removed = new Set(removeIds);

  return current.filter((layer) => !removed.has(layer.id)).map((layer) => replacementById.get(layer.id) ?? layer);
}

export function withTransientLayers(
  baseLayers: readonly RenderLayer[],
  transient: ReadonlyArray<RenderLayer | null | undefined>,
  transientIds: readonly string[],
  beforeLayerId?: string
): RenderLayer[] {
  const ids = new Set(transientIds);
  const result = baseLayers.filter((layer) => !ids.has(layer.id));
  const nextTransient = compact(transient);
  const beforeIndex = beforeLayerId ? result.findIndex((layer) => layer.id === beforeLayerId) : -1;
  if (beforeIndex < 0) {
    return [...result, ...nextTransient];
  }
  return [...result.slice(0, beforeIndex), ...nextTransient, ...result.slice(beforeIndex)];
}
