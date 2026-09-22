import type {
  ClusterLayerProvider,
  ClusterLayerProviderContext,
  CurveSegmentVisibilityContext,
  DerivedVisLayerContext,
  DerivedVisLayerContributor,
  DerivedVisLayerSpec,
  EdgeOffsetStrategy,
  EdgeOffsetStrategyContext,
  EdgeRenderDecision,
  MapglFeatureRegistry,
  NamespaceBoundaryContext,
  NamespaceBoundaryProvider,
  NamespaceBoundaryRecord,
  NamespaceProjectionContext,
  NamespaceProjectionResult,
  NamespaceProjectionStrategy,
  PointPositionStrategy,
  PointPositionStrategyContext,
  ProjectedTerminalGeometryContext,
  ProjectedTerminalGeometryResult,
  ProjectedTerminalGeometryStrategy,
  TooltipEdgeRecord,
  TooltipEdgeSectionContributor,
  ViewportFitStrategy,
} from './contracts';
import type { Edge, Graph, GraphEdgeIndex } from '@mapgl/panel-core/graph';
import { inheritedShift } from '../graph/utils';
import { annotationTimeRuntimeSubscriptionProvider, noopRuntimeSubscriptionProvider } from './runtimeSubscriptions';

export function createDefaultFeatureRegistry(): MapglFeatureRegistry {
  return {
    tooltipEdgeSections: [adjacentEdgeTooltipSectionContributor],
    runtimeSubscriptionProviders: [annotationTimeRuntimeSubscriptionProvider, noopRuntimeSubscriptionProvider],
    viewportFitStrategies: [defaultViewportFitStrategy],
    pointPositionStrategies: [noopPointPositionStrategy],
    namespaceProjectionStrategies: [defaultNamespaceProjectionStrategy],
    namespaceBoundaryProviders: [defaultNamespaceBoundaryProvider],
    projectedTerminalGeometryStrategies: [],
    edgeOffsetStrategies: [defaultEdgeOffsetStrategy],
    clusterLayerProviders: [],
    derivedVisLayerContributors: [],
  };
}

export function getDerivedVisLayers(
  contributors: DerivedVisLayerContributor[],
  context: DerivedVisLayerContext
): DerivedVisLayerSpec[] {
  return contributors.flatMap((contributor) => contributor.getLayers(context));
}

export const adjacentEdgeTooltipSectionContributor: TooltipEdgeSectionContributor = {
  id: 'core.adjacent-edges',
  getSections: ({ adjacentEdges, edgeIndex }) => {
    const incoming = dedupeTooltipEdges(adjacentEdges?.incoming ?? []).map((edge) =>
      createTooltipEdgeRecord(edge, edgeIndex)
    );
    const outgoing = dedupeTooltipEdges(adjacentEdges?.outgoing ?? []).map((edge) =>
      createTooltipEdgeRecord(edge, edgeIndex)
    );

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

function createTooltipEdgeRecord(edge: Edge, edgeIndex?: GraphEdgeIndex): TooltipEdgeRecord {
  const edgeRef = edgeIndex?.getEdgeRef(edge) ?? edge.data?.edgeRef;
  return {
    id: String(edge.data?.recordRef ?? edge.data?.edgeId ?? edge.id),
    edge,
    source: edge.source,
    target: edge.target,
    properties: edge.data?.dataRecord,
    ...(typeof edgeRef === 'number' && { edgeRef }),
  };
}

function dedupeTooltipEdges(edges: Edge[]): Edge[] {
  const seen = new Set<string>();

  return edges.filter((edge) => {
    const key = edge.data?.recordRef ?? edge.data?.edgeId ?? edge.id;
    if (seen.has(String(key))) {
      return false;
    }

    seen.add(String(key));
    return true;
  });
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

type LayoutGraphBoundsLike = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export const defaultNamespaceBoundaryProvider: NamespaceBoundaryProvider = {
  id: 'core.msagl-layout-bounds',
  getBoundaries: ({ graph, layoutGraphBounds, layerShift, applyLayerShift, includeRoot }) => {
    if (!layoutGraphBounds) {
      return [];
    }

    const namespaces = (includeRoot ? [graph] : []).concat(Array.from(graph.subgraphsBreadthFirst()) as Graph[]);
    return namespaces.reduce<NamespaceBoundaryRecord[]>((records, namespace) => {
      const bounds = layoutGraphBounds.get(namespace.id) as LayoutGraphBoundsLike | undefined;
      if (!bounds) {
        return records;
      }

      const [dx, dy] = applyLayerShift ? inheritedShift(namespace.id, layerShift ?? {}) : [0, 0];

      records.push({
        namespace: namespace.id,
        bounds: [bounds.minX + dx, bounds.minY + dy, bounds.maxX + dx, bounds.maxY + dy],
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

export function getProjectedTerminalGeometry(
  strategies: ProjectedTerminalGeometryStrategy[],
  context: ProjectedTerminalGeometryContext
): ProjectedTerminalGeometryResult | null | undefined {
  for (const strategy of strategies) {
    const result = strategy.project(context);
    if (result !== undefined) {
      return result;
    }
  }

  return undefined;
}

export function getCurveSegmentHidden(
  strategies: EdgeOffsetStrategy[],
  context: CurveSegmentVisibilityContext
): Uint8Array | undefined {
  for (const strategy of strategies) {
    const hidden = strategy.getCurveSegmentHidden?.(context);
    if (hidden !== undefined) {
      return hidden;
    }
  }
  return undefined;
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

export function getClusterLayers(providers: ClusterLayerProvider[], context: ClusterLayerProviderContext): unknown[] {
  return providers.flatMap((provider) => provider.createLayers(context));
}
