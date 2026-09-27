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
  PointJitterStrategy,
  PointJitterStrategyContext,
  ProjectedTerminalGeometryContext,
  ProjectedTerminalGeometryResult,
  ProjectedTerminalGeometryStrategy,
  TooltipEdgeRecord,
  TooltipEdgeSectionContributor,
} from './contracts';
import type { Edge, Graph, GraphEdgeIndex } from '@mapgl/panel-core/graph';
import { inheritedShift } from '../graph/utils';
import { annotationTimeRuntimeSubscriptionProvider, noopRuntimeSubscriptionProvider } from './runtimeSubscriptions';

export function createDefaultFeatureRegistry(): MapglFeatureRegistry {
  return {
    tooltipEdgeSections: [adjacentEdgeTooltipSectionContributor],
    runtimeSubscriptionProviders: [annotationTimeRuntimeSubscriptionProvider, noopRuntimeSubscriptionProvider],
    pointJitterStrategies: [noopPointJitterStrategy],
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

export const noopPointJitterStrategy: PointJitterStrategy = {
  id: 'core.noop-point-jitter',
  apply: () => undefined,
};

export function applyPointJitterStrategies(
  strategies: PointJitterStrategy[],
  context: PointJitterStrategyContext
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
