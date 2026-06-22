import type { EventBus, PanelData } from '@grafana/data';

import { ALERTING_NUMS, ALERTING_STATES } from '../types/defaults';
import type { Edge, Graph, GraphEdgeIndex, Node } from '@mapgl/panel-core/graph';
import { getGraphNodeMap, getNodeData } from '@mapgl/panel-core/graph';
import type { DeckLine, Feature, ViewState } from '@mapgl/panel-core/types';

export type MapglEdition = 'oss' | 'extended';

export interface MapglPanelFeature {
  id: string;
  register(registry: MapglFeatureRegistry): void;
}

export interface MapglFeatureRegistry {
  tooltipEdgeSections: TooltipEdgeSectionContributor[];
  runtimeSubscriptionProviders: RuntimeSubscriptionProvider[];
  viewportFitStrategies: ViewportFitStrategy[];
  pointPositionStrategies: PointPositionStrategy[];
  namespaceProjectionStrategies: NamespaceProjectionStrategy[];
  namespaceBoundaryProviders: NamespaceBoundaryProvider[];
  edgeOffsetStrategies: EdgeOffsetStrategy[];
  clusterLayerProviders: ClusterLayerProvider[];
  derivedVisLayerContributors: DerivedVisLayerContributor[];
}

export interface MapglFeatureServices extends MapglFeatureRegistry {
  edition: MapglEdition;
}

export interface BuildMapglFeatureServicesOptions {
  edition: MapglEdition;
  features?: MapglPanelFeature[];
}

let activeFeatureServices: MapglFeatureServices | undefined;

export function setMapglFeatureServices(services: MapglFeatureServices): void {
  activeFeatureServices = services;
}

export function getMapglFeatureServices(): MapglFeatureServices {
  activeFeatureServices ??= buildMapglFeatureServices({ edition: 'oss' });
  return activeFeatureServices;
}

export function buildMapglFeatureServices({
  edition,
  features = [],
}: BuildMapglFeatureServicesOptions): MapglFeatureServices {
  const registry = createDefaultFeatureRegistry();

  for (const feature of features) {
    feature.register(registry);
  }

  return {
    ...registry,
    edition,
  };
}

export function createDefaultFeatureRegistry(): MapglFeatureRegistry {
  return {
    tooltipEdgeSections: [adjacentEdgeTooltipSectionContributor],
    runtimeSubscriptionProviders: [annotationTimeRuntimeSubscriptionProvider, noopRuntimeSubscriptionProvider],
    viewportFitStrategies: [defaultViewportFitStrategy],
    pointPositionStrategies: [noopPointPositionStrategy],
    namespaceProjectionStrategies: [defaultNamespaceProjectionStrategy],
    namespaceBoundaryProviders: [defaultNamespaceBoundaryProvider],
    edgeOffsetStrategies: [defaultEdgeOffsetStrategy],
    clusterLayerProviders: [],
    derivedVisLayerContributors: [],
  };
}

export interface DerivedVisLayerContext {
  graph: Graph;
  isLogic: boolean;
  replaceVariables: (value: string) => string;
  useMockData?: boolean;
}

export interface DerivedVisLayerSpec {
  label: string;
  name: string;
  group: string;
  visible: boolean;
  fold?: boolean;
  indeterminate?: boolean;
  parentIndex?: number | null;
  combine?: boolean | null;
}

export interface DerivedVisLayerContributor {
  id: string;
  getLayers(context: DerivedVisLayerContext): DerivedVisLayerSpec[];
}

export function getDerivedVisLayers(
  contributors: DerivedVisLayerContributor[],
  context: DerivedVisLayerContext
): DerivedVisLayerSpec[] {
  return contributors.flatMap((contributor) => contributor.getLayers(context));
}

export interface TooltipEdgeRecord {
  id: string;
  edge: Edge;
  source?: Node;
  target?: Node;
  line?: DeckLine;
  properties?: Record<string, unknown>;
}

export interface TooltipEdgeSection {
  id: string;
  incomingLabel: string;
  outgoingLabel: string;
  incoming: TooltipEdgeRecord[];
  outgoing: TooltipEdgeRecord[];
  pinnedMetadata?: Record<string, unknown>;
}

export interface TooltipEdgeSectionContext {
  graph: Graph;
  edgeIndex?: GraphEdgeIndex;
  node?: Node;
  edge?: Edge;
  feature?: Feature;
  adjacentEdges?: TooltipAdjacentEdges;
  data?: PanelData;
  options?: unknown;
}

export interface TooltipEdgeSectionContributor {
  id: string;
  getSections(context: TooltipEdgeSectionContext): TooltipEdgeSection[];
}

export interface TooltipAdjacentEdges {
  incoming?: Edge[];
  outgoing?: Edge[];
}

export const adjacentEdgeTooltipSectionContributor: TooltipEdgeSectionContributor = {
  id: 'core.adjacent-edges',
  getSections: ({ adjacentEdges }) => {
    const incoming = dedupeTooltipEdges(adjacentEdges?.incoming ?? []).map((edge) => createTooltipEdgeRecord(edge));
    const outgoing = dedupeTooltipEdges(adjacentEdges?.outgoing ?? []).map((edge) => createTooltipEdgeRecord(edge));

    if (!incoming.length && !outgoing.length) {
      return [];
    }

    return [
      {
        id: 'core.adjacent-edges',
        incomingLabel: 'incoming',
        outgoingLabel: 'outgoing',
        incoming,
        outgoing,
      },
    ];
  },
};

function createTooltipEdgeRecord(edge: Edge): TooltipEdgeRecord {
  return {
    id: String(edge.data?.edge_id ?? edge.data?.edgeId ?? edge.id),
    edge,
    source: edge.source,
    target: edge.target,
    properties: edge.data?.dataRecord,
  };
}

function dedupeTooltipEdges(edges: Edge[]): Edge[] {
  const seen = new Set<string>();

  return edges.filter((edge) => {
    const key = edge.data?.edge_id ?? edge.data?.edgeId ?? edge.id;
    if (seen.has(String(key))) {
      return false;
    }

    seen.add(String(key));
    return true;
  });
}

export type RuntimeUpdateEvent =
  | {
      type: 'edit.record.changed';
      operation: 'insert' | 'update';
      collection: 'edges';
      namespace: string;
      document: unknown;
    }
  | {
      type: 'live.node.metric.updated';
      nodeId: string;
      metric: string;
      value: unknown;
      metadata?: Record<string, unknown>;
    };

export interface RuntimeSubscriptionContext {
  graph: Graph;
  edgeIndex?: GraphEdgeIndex;
  data?: PanelData;
  options?: unknown;
  eventBus?: EventBus;
  panel?: unknown;
  time?: number;
  annotationTables?: Array<[any, any]>;
  annotationGraphs?: Graph[];
  annotationBuffer?: Uint8Array;
  onAnnotationsApplied?: () => void;
  publish(event: RuntimeUpdateEvent): void;
}

export interface RuntimeSubscription {
  dispose(): void;
  onDataChange?(context: RuntimeSubscriptionContext): void;
}

export interface RuntimeSubscriptionProvider {
  id: string;
  isEnabled?(context: RuntimeSubscriptionContext): boolean;
  start(context: RuntimeSubscriptionContext): RuntimeSubscription | Promise<RuntimeSubscription>;
}

export const noopRuntimeSubscriptionProvider: RuntimeSubscriptionProvider = {
  id: 'core.noop-runtime-subscription',
  isEnabled: () => false,
  start: () => ({
    dispose: () => undefined,
  }),
};

export const annotationTimeRuntimeSubscriptionProvider: RuntimeSubscriptionProvider = {
  id: 'core.annotation-time-runtime-subscription',
  start: () => ({
    dispose: () => undefined,
    onDataChange: (context) => {
      applyAnnotationTimeUpdate(context);
    },
  }),
};

export async function applyAnnotationTimeUpdate(context: RuntimeSubscriptionContext): Promise<void> {
  const time = context.time;
  const annotationTables = context.annotationTables;
  const graphs = context.annotationGraphs;
  const annotationBuffer = context.annotationBuffer;

  if (!time || !annotationTables?.length || !graphs?.length || !annotationBuffer) {
    return;
  }

  const { op, escape } = await import('arquero');
  let activeAnnotations: any[] = [];
  annotationTables.forEach(([annotTable, annotByInstance]) => {
    const filteredTable = annotByInstance.filter(escape((row) => row.timeEnd <= time));
    const summary = filteredTable.rollup({
      timeEnd: op.max('timeEnd'),
    });
    const annotations = annotTable.semijoin(summary).objects();
    if (annotations.length) {
      activeAnnotations = activeAnnotations.concat(annotations);
    }
  });

  graphs.forEach((graph) => {
    activeAnnotations.forEach(({ alertName, instance, data, newState, timeEnd }) => {
      const node = getGraphNodeMap(graph)?.get(instance);
      const feature = node ? getNodeData(node)?.feature : undefined;
      if (!feature) {
        return;
      }

      const newAnnotation = { alertName, newState, instance, timeEnd, data };
      const allAnnotations = feature.all_annots;
      if ((allAnnotations?.length && allAnnotations.length === annotationTables.length) || !allAnnotations) {
        feature.all_annots = [newAnnotation];
      } else {
        feature.all_annots = [...allAnnotations, newAnnotation];
      }
      feature.all_annots = sortRuntimeAnnotations(feature.all_annots ?? []);

      const annotationState = feature.all_annots?.[0]?.newState;
      const stateKey = Object.keys(ALERTING_STATES).find((state) => annotationState?.startsWith(state));
      if (stateKey) {
        const [, , stateRGBArray] = ALERTING_NUMS[stateKey];
        annotationBuffer.set(stateRGBArray, feature.id * 4);
      }
    });
  });

  context.onAnnotationsApplied?.();
}

function sortRuntimeAnnotations(annotations: any[]): any[] {
  const stateOrder = { Alerting: 1, Pending: 2, Normal: 3 };

  return annotations.sort((a, b) => {
    const stateA = a.newState.startsWith('Alerting') ? 'Alerting' : a.newState.startsWith('Pending') ? 'Pending' : 'Normal';
    const stateB = b.newState.startsWith('Alerting') ? 'Alerting' : b.newState.startsWith('Pending') ? 'Pending' : 'Normal';

    return stateOrder[stateA] - stateOrder[stateB];
  });
}

export class RuntimeSubscriptionController {
  private subscriptions: RuntimeSubscription[] = [];
  private startVersion = 0;

  constructor(private readonly providers: RuntimeSubscriptionProvider[]) {}

  async start(context: RuntimeSubscriptionContext): Promise<void> {
    this.dispose();
    const version = ++this.startVersion;

    for (const provider of this.providers) {
      if (provider.isEnabled && !provider.isEnabled(context)) {
        continue;
      }

      const subscription = await provider.start(context);
      if (version !== this.startVersion) {
        subscription.dispose();
        continue;
      }

      this.subscriptions.push(subscription);
    }
  }

  onDataChange(context: RuntimeSubscriptionContext): void {
    this.subscriptions.forEach((subscription) => subscription.onDataChange?.(context));
  }

  dispose(): void {
    this.startVersion += 1;
    this.subscriptions.forEach((subscription) => subscription.dispose());
    this.subscriptions = [];
  }
}

export interface ViewportFitContext {
  width: number;
  height: number;
  graph?: Graph;
  layers?: unknown[];
  visibleNamespaces?: Set<string>;
  namespaceBoundaries?: NamespaceBoundaryRecord[];
  projectedPositions?: Float64Array;
  options?: unknown;
  panel?: unknown;
}

export interface ViewportFitResult {
  viewState?: ViewState;
  bounds?: [minX: number, minY: number, maxX: number, maxY: number];
}

export interface ViewportFitStrategy {
  id: string;
  fit(context: ViewportFitContext): ViewportFitResult | undefined;
}

export const defaultViewportFitStrategy: ViewportFitStrategy = {
  id: 'core.default-viewport-fit',
  fit: (context) => {
    const namespaceBounds = combineBoundaryRecords(context.namespaceBoundaries ?? []);
    if (namespaceBounds) {
      return { bounds: namespaceBounds };
    }

    const layerFeatures = getLayerExtentFeatures(context.layers, context.options);
    const layerBounds = getFeatureBounds(layerFeatures, context.projectedPositions);
    return layerBounds ? { bounds: layerBounds } : undefined;
  },
};

type ViewportFitOptionsLike = {
  allLayers?: boolean;
  lastOnly?: boolean;
  layer?: string;
};

type LayerLike = {
  isBasemap?: boolean;
  options?: { name?: string };
  layer?: {
    features?: unknown[];
  };
};

type FeatureLike = {
  type?: string;
  geometry?: { type?: string; coordinates?: unknown };
  id?: number;
};

function combineBoundaryRecords(
  records: NamespaceBoundaryRecord[]
): [minX: number, minY: number, maxX: number, maxY: number] | undefined {
  if (!records.length) {
    return undefined;
  }

  return records.reduce(
    (acc, record) => [
      Math.min(acc[0], record.bounds[0]),
      Math.min(acc[1], record.bounds[1]),
      Math.max(acc[2], record.bounds[2]),
      Math.max(acc[3], record.bounds[3]),
    ],
    [Infinity, Infinity, -Infinity, -Infinity] as [number, number, number, number]
  );
}

function getLayerExtentFeatures(layers: unknown[] = [], options: unknown): FeatureLike[] {
  const { allLayers = false, lastOnly = false, layer } = (options ?? {}) as ViewportFitOptionsLike;

  return (layers as LayerLike[])
    .filter((item) => !item.isBasemap)
    .flatMap((item) => {
      const features = item.layer?.features ?? [];
      if (allLayers) {
        return features as FeatureLike[];
      }

      if (lastOnly && layer === item.options?.name) {
        const feature = features.at(-1);
        return feature ? [feature as FeatureLike] : [];
      }

      if (!lastOnly && layer === item.options?.name) {
        return features as FeatureLike[];
      }

      return [];
    });
}

function getFeatureBounds(
  features: FeatureLike[],
  positions?: Float64Array
): [minX: number, minY: number, maxX: number, maxY: number] | undefined {
  const coords = features.flatMap((feature) => getFeatureCoordinates(feature, positions));
  if (!coords.length) {
    return undefined;
  }

  return coords.reduce(
    (acc, [x, y]) => [Math.min(acc[0], x), Math.min(acc[1], y), Math.max(acc[2], x), Math.max(acc[3], y)],
    [Infinity, Infinity, -Infinity, -Infinity] as [number, number, number, number]
  );
}

function getFeatureCoordinates(feature: FeatureLike, positions?: Float64Array): Array<[number, number]> {
  if (feature.geometry?.coordinates) {
    return flattenCoordinates(feature.geometry.coordinates);
  }

  if (feature.id !== undefined && positions) {
    const x = positions[feature.id * 2];
    const y = positions[feature.id * 2 + 1];
    return Number.isFinite(x) && Number.isFinite(y) ? [[x, y]] : [];
  }

  return [];
}

function flattenCoordinates(value: unknown): Array<[number, number]> {
  if (!Array.isArray(value)) {
    return [];
  }

  if (typeof value[0] === 'number' && typeof value[1] === 'number') {
    return Number.isFinite(value[0]) && Number.isFinite(value[1]) ? [[value[0], value[1]]] : [];
  }

  return value.flatMap((item) => flattenCoordinates(item));
}

export interface PointPositionStrategyContext {
  graph: Graph;
  positions: Float64Array;
  visibleNamespaces?: Set<string>;
  options?: unknown;
  panel?: unknown;
  spatialIndex?: unknown;
  bounds?: [minX: number, minY: number, maxX: number, maxY: number];
  zoom?: number;
}

export interface PointPositionStrategy {
  id: string;
  apply(context: PointPositionStrategyContext): Float64Array | void;
}

export const noopPointPositionStrategy: PointPositionStrategy = {
  id: 'core.noop-point-position',
  apply: () => undefined,
};

export function applyPointPositionStrategies(
  strategies: PointPositionStrategy[],
  context: PointPositionStrategyContext
): Float64Array {
  let positions = context.positions;

  for (const strategy of strategies) {
    const nextPositions = strategy.apply({ ...context, positions });
    if (nextPositions) {
      positions = nextPositions;
    }
  }

  return positions;
}

export interface NamespaceProjectionContext {
  graph: Graph;
  edgeIndex?: GraphEdgeIndex;
  visibleNamespaces: Set<string>;
  allNamespaces?: Set<string>;
  positions: Float64Array;
  layerShift?: Record<string, [number, number]>;
  panel?: unknown;
}

export interface ProjectedEdge {
  edge: Edge;
  sourcePosition?: [number, number];
  targetPosition?: [number, number];
  visible: boolean;
}

export interface NamespaceProjectionResult {
  edges?: ProjectedEdge[];
  positions?: Float64Array;
  contractsHiddenNamespaces?: boolean;
  /**
   * Documents the filtering model when projection state is still applied by the renderer.
   * OSS currently keeps hidden namespace edge filtering in deck.gl DataFilterExtension categories.
   */
  rendererFiltering?: 'deck-category-filter' | 'none';
}

export interface NamespaceProjectionStrategy {
  id: string;
  project(context: NamespaceProjectionContext): NamespaceProjectionResult;
}

export const defaultNamespaceProjectionStrategy: NamespaceProjectionStrategy = {
  id: 'core.default-namespace-filtering',
  project: () => ({
    rendererFiltering: 'deck-category-filter',
  }),
};

export function applyNamespaceProjectionStrategies(
  strategies: NamespaceProjectionStrategy[],
  context: NamespaceProjectionContext
): NamespaceProjectionResult {
  return strategies.reduce<NamespaceProjectionResult>((acc, strategy) => {
    const result = strategy.project(context);
    return {
      edges: result.edges ?? acc.edges,
      positions: result.positions ?? acc.positions,
      contractsHiddenNamespaces: result.contractsHiddenNamespaces ?? acc.contractsHiddenNamespaces,
      rendererFiltering: result.rendererFiltering ?? acc.rendererFiltering,
    };
  }, {});
}

export interface NamespaceBoundaryContext {
  graph: Graph;
  visibleNamespaces: Set<string>;
  positions: Float64Array;
  layoutGraphBounds?: Map<string, unknown>;
  layerShift?: Record<string, [number, number]>;
  panel?: unknown;
  padding?: number;
  includeRoot?: boolean;
  applyLayerShift?: boolean;
}

export interface NamespaceBoundaryRecord {
  namespace: string;
  bounds: [minX: number, minY: number, maxX: number, maxY: number];
  polygon?: unknown;
}

export interface NamespaceBoundaryProvider {
  id: string;
  getBoundaries(context: NamespaceBoundaryContext): NamespaceBoundaryRecord[];
}

type LayoutGraphBoundsLike = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export const defaultNamespaceBoundaryProvider: NamespaceBoundaryProvider = {
  id: 'core.msagl-layout-bounds',
  getBoundaries: ({ graph, layoutGraphBounds }) => {
    if (!layoutGraphBounds) {
      return [];
    }

    const subgraphs = Array.from(graph.subgraphsBreadthFirst()) as Graph[];
    return subgraphs.reduce<NamespaceBoundaryRecord[]>((records, subgraph) => {
      const bounds = layoutGraphBounds.get(subgraph.id) as LayoutGraphBoundsLike | undefined;
      if (!bounds) {
        return records;
      }

      records.push({
        namespace: subgraph.id,
        bounds: [bounds.minX, bounds.minY, bounds.maxX, bounds.maxY],
      });
      return records;
    }, []);
  },
};

export function getNamespaceBoundaries(
  providers: NamespaceBoundaryProvider[],
  context: NamespaceBoundaryContext
): NamespaceBoundaryRecord[] {
  const byNamespace = new Map<string, NamespaceBoundaryRecord>();

  for (const provider of providers) {
    for (const boundary of provider.getBoundaries(context)) {
      byNamespace.set(boundary.namespace, boundary);
    }
  }

  return Array.from(byNamespace.values());
}

export type EdgeRenderDecisionType = 'visible' | 'offset' | 'reduced' | 'representative';

export interface EdgeRenderDecision {
  edge: Edge;
  type: EdgeRenderDecisionType;
  lineId?: string | number;
  fragmentIndex?: number;
  representativeEdgeId?: string;
  coordinates?: [[number, number], [number, number]];
  offsetIndex?: number;
  offsetCount?: number;
  tiltDistance?: number;
  isOutgoingTilt?: boolean;
}

export interface EdgeOffsetStrategyContext {
  graph: Graph;
  edgeIndex?: GraphEdgeIndex;
  projectedEdges?: ProjectedEdge[];
  positions: Float64Array;
  visibleNamespaces?: Set<string>;
  panel?: unknown;
}

export interface EdgeOffsetStrategy {
  id: string;
  decide(context: EdgeOffsetStrategyContext): EdgeRenderDecision[];
}

export const defaultEdgeOffsetStrategy: EdgeOffsetStrategy = {
  id: 'core.default-edge-offset',
  decide: () => [],
};

export function getEdgeRenderDecisions(
  strategies: EdgeOffsetStrategy[],
  context: EdgeOffsetStrategyContext
): EdgeRenderDecision[] {
  return strategies.flatMap((strategy) => strategy.decide(context));
}

export interface ClusterLayerProviderContext {
  graph: Graph;
  positions: Float64Array;
  visibleNamespaces?: Set<string>;
  namespaceBoundaries?: NamespaceBoundaryRecord[];
  projectedEdges?: ProjectedEdge[];
  namespaceProjection?: NamespaceProjectionResult;
  annotations?: unknown;
  groupFilters?: unknown;
  panel?: unknown;
  layerProps?: unknown;
  graphLayers?: unknown[];
  layerShift?: Record<string, [number, number]>;
  maxZoom?: number;
  isLogic?: boolean;
  mode?: string;
}

export interface ClusterLayerProvider {
  id: string;
  createLayers(context: ClusterLayerProviderContext): unknown[];
}

export function getClusterLayers(
  providers: ClusterLayerProvider[],
  context: ClusterLayerProviderContext
): unknown[] {
  return providers.flatMap((provider) => provider.createLayers(context));
}
