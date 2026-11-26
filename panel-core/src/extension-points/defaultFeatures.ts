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
  NamespaceBoundaryRecord,
  NamespaceProjectionContext,
  NamespaceProjectionResult,
  NamespaceProjectionStrategy,
  ProjectedEdgeVisibilityContext,
  ProjectedEdgeVisibilityStrategy,
  TooltipEdgeRecord,
  TooltipEdgeSectionContributor,
} from './contracts';
import type { Edge, Graph, GraphEdgeIndex } from '../graph/main';
import { inheritedShift } from '../graph/utils';
import { noopRuntimeSubscriptionProvider } from './runtimeSubscriptions';

export function createDefaultFeatureRegistry(): MapglFeatureRegistry {
  return {
    tooltipEdgeSections: [adjacentEdgeTooltipSectionContributor],
    runtimeSubscriptionProviders: [noopRuntimeSubscriptionProvider],
    namespaceProjectionStrategies: [defaultNamespaceProjectionStrategy],
    projectedEdgeVisibilityStrategies: [],
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

export const defaultNamespaceProjectionStrategy: NamespaceProjectionStrategy = {
  id: 'core.default-namespace-filtering',
  project: () => ({
    contractsHiddenNamespaces: false,
  }),
};

export function applyNamespaceProjectionStrategies(
  strategies: NamespaceProjectionStrategy[],
  context: NamespaceProjectionContext
): NamespaceProjectionResult {
  return strategies.reduce<NamespaceProjectionResult>((acc, strategy) => {
    const result = strategy.project(context);
    return {
      contractsHiddenNamespaces: result.contractsHiddenNamespaces ?? acc.contractsHiddenNamespaces,
    };
  }, {});
}

type LayoutGraphBoundsLike = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export function getLayoutNamespaceBoundaries(
  { graph, layoutGraphBounds, layerShift, applyLayerShift, includeRoot }: NamespaceBoundaryContext
): NamespaceBoundaryRecord[] {
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
}

export function isProjectedEdgeVisible(
  strategies: readonly ProjectedEdgeVisibilityStrategy[],
  context: ProjectedEdgeVisibilityContext
): boolean {
  return strategies.every((strategy) => strategy.isVisible(context));
}

export function getCurveSegmentHidden(
  strategies: readonly EdgeOffsetStrategy[],
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
  strategies: readonly EdgeOffsetStrategy[],
  context: EdgeOffsetStrategyContext
): EdgeRenderDecision[] {
  return strategies.flatMap((strategy) => strategy.decide(context));
}

export function getClusterLayers(providers: ClusterLayerProvider[], context: ClusterLayerProviderContext): unknown[] {
  return providers.flatMap((provider) => provider.createLayers(context));
}
