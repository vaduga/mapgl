import type { PanelData, EventBus } from '@grafana/data';
import type {
  RuntimeSubscriptionContext as CoreContext,
  RuntimeSubscription as CoreSubscription,
  RuntimeSubscriptionProvider as CoreProvider,
} from '@vaduga/mapgl-core/featureContracts';
import type { Graph, Edge } from '@vaduga/mapgl-core/graph/main';
import type { ViewState } from '@vaduga/mapgl-core/types';
export interface GrafanaRuntimeSubscriptionContext extends CoreContext {
  readonly data?: PanelData;
  readonly eventBus?: EventBus;
  readonly time?: number;
  readonly annotationTables?: Array<[any, any]>;
  readonly annotationGraphs?: Graph[];
  readonly annotationBuffer?: Uint8Array;
  readonly onAnnotationsApplied?: () => void;
}
export type GrafanaRuntimeSubscription = CoreSubscription<GrafanaRuntimeSubscriptionContext>;
export type GrafanaRuntimeSubscriptionProvider = CoreProvider<GrafanaRuntimeSubscriptionContext> & {
  readonly lifetime?: 'panel' | 'graph';
  readonly connectionKey?: (context: GrafanaRuntimeSubscriptionContext) => unknown;
};

export interface GrafanaPanelBinding {
  readonly id: string;
  readonly keys: readonly unknown[];
  start(signal: AbortSignal): () => void;
}

export interface SelectionHooks {
  findEdge?: (graph: Graph, id: string) => Edge | undefined;
  selectionView?: (view: ViewState, graphId?: string) => ViewState;
}
