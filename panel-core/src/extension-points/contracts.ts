import type { EventBus, PanelData } from '@grafana/data';
import type { Position } from 'geojson';
import type { Edge, Graph, GraphEdgeIndex, Node } from '@mapgl/panel-core/graph';
import type { GraphRowRef } from '@mapgl/panel-core/graph/frame';
import type { CoordRef, DeckLine, Feature, ViewState } from '@mapgl/panel-core/types';

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
  projectedTerminalGeometryStrategies: ProjectedTerminalGeometryStrategy[];
  edgeOffsetStrategies: EdgeOffsetStrategy[];
  clusterLayerProviders: ClusterLayerProvider[];
  derivedVisLayerContributors: DerivedVisLayerContributor[];
}

export interface MapglFeatureServices extends MapglFeatureRegistry {
  edition: MapglEdition;
}

export interface BuildMapglFeatureServicesOptions {
  edition: MapglEdition;
  features?: readonly MapglPanelFeature[];
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

export interface TooltipEdgeRecord {
  id: string;
  edge: Edge;
  source?: Node;
  target?: Node;
  line?: DeckLine;
  properties?: Record<string, unknown>;
  edgeRef?: number;
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
  signal?: AbortSignal;
  graph: Graph;
  edgeIndex?: GraphEdgeIndex;
  data?: PanelData;
  options?: unknown;
  eventBus?: EventBus;
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

export interface ViewportFitContext {
  width: number;
  height: number;
  graph?: Graph;
  layers?: unknown[];
  visibleNamespaces?: Set<string>;
  namespaceBoundaries?: NamespaceBoundaryRecord[];
  projectedPositions?: Float64Array;
  options?: unknown;
}

export interface ViewportFitResult {
  viewState?: ViewState;
  bounds?: [minX: number, minY: number, maxX: number, maxY: number];
}

export interface ViewportFitStrategy {
  id: string;
  fit(context: ViewportFitContext): ViewportFitResult | undefined;
}

export interface PointPositionStrategyContext {
  graph: Graph;
  positions: Float64Array;
  visibleNamespaces?: Set<string>;
  options?: unknown;
  spatialIndex?: unknown;
  bounds?: [minX: number, minY: number, maxX: number, maxY: number];
  zoom?: number;
}

export interface PointPositionStrategy {
  id: string;
  apply(context: PointPositionStrategyContext): Float64Array | void;
}

export interface NamespaceProjectionContext {
  graph: Graph;
  edgeIndex?: GraphEdgeIndex;
  visibleNamespaces: Set<string>;
  allNamespaces?: Set<string>;
  positions: Float64Array;
  layerShift?: Record<string, [number, number]>;
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

export interface NamespaceBoundaryContext {
  graph: Graph;
  visibleNamespaces: Set<string>;
  positions: Float64Array;
  layoutGraphBounds?: Map<string, unknown>;
  layerShift?: Record<string, [number, number]>;
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

export type TerminalArrowTips = { start?: Position; end?: Position };

export interface ProjectedTerminalGeometryContext {
  positions?: Float64Array;
  edge: Edge;
  layerShift?: Record<string, [number, number]>;
  srcGraph: Graph;
  tarGraph: Graph;
  srcProjectionNamespace?: string;
  tarProjectionNamespace?: string;
  subPath: CoordRef[];
  pathsCoords: Position[];
  layoutArrowTips?: TerminalArrowTips;
  layoutGeometry?: Position[];
  isSrcContracted?: boolean;
  isContracted?: boolean;
  isTarContracted?: boolean;
}

export interface ProjectedTerminalGeometryResult {
  subPath: CoordRef[];
  pathsCoords: Position[];
  targetTerminalShift?: Position;
  layoutArrowTips?: TerminalArrowTips;
}

export interface ProjectedTerminalGeometryStrategy {
  id: string;
  project(context: ProjectedTerminalGeometryContext): ProjectedTerminalGeometryResult | null | undefined;
}

export type EdgeRenderDecisionType = 'visible' | 'offset' | 'reduced' | 'representative';

export interface EdgeRenderDecision {
  edge: Edge;
  type: EdgeRenderDecisionType;
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
}

export interface CurveSegmentVisibilityContext {
  segmentFeatureIndexes: Int32Array;
  features: ReadonlyArray<Pick<DeckLine, 'skip'> | undefined>;
}

export interface EdgeOffsetStrategy {
  id: string;
  decide(context: EdgeOffsetStrategyContext): EdgeRenderDecision[];
  getCurveSegmentHidden?(context: CurveSegmentVisibilityContext): Uint8Array | undefined;
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
