import type { ViewState } from '../types';
import { runInAction } from 'mobx';
import { type Edge, bumpGraphVersion } from '../graph/main';
import type { ElementKey } from '../store/PointStore';
import { MetricOverlays, sameMetricRow, type MetricUpdate } from '../data/metricOverlays';
import {
  GraphFramePipeline,
  type GraphPipelineInput,
  graphPipelineSources,
  type GraphPipelineStages,
} from '../graph/frame/pipeline';
import { applyGraphVisualState, createGraphFrameViewState } from '../graph/frame/visualState';
import type { GraphFrameViewState } from '../graph/frame/types';
import { RootStore } from '../store/RootStore';
import { GraphScene, type EffectiveRenderState } from './GraphScene';
import type { VisLayers } from '../store/VisLayers';

import {
  createGraphPanelRenderState,
  resolveGraphPanelLayout,
  type GraphPanelLayoutState,
  type GraphPanelRenderState,
  type GraphPanelPipelineState,
} from '../graph/frame/graphPanelRuntime';

export interface SceneCommit {
  readonly render?: Partial<EffectiveRenderState>;
  readonly visibility?: VisLayers;
  readonly apply?: () => void;
  readonly project?: () => void;
}

export interface PanelControllerStages extends Omit<
  GraphPipelineStages<GraphPanelLayoutState, GraphPanelRenderState>,
  'commit'
> {
  readonly prepareCommit?: (state: GraphPanelPipelineState) => SceneCommit;
}

export type PanelNotification =
  | { readonly type: 'commit' | 'visual'; readonly state: GraphPanelPipelineState }
  | { readonly type: 'status'; readonly view: GraphFrameViewState }
  | { readonly type: 'selection'; readonly node?: ElementKey }
  | { readonly type: 'viewport'; readonly value: ViewState };

/** The controller is the authoritative committed graph owner for every host. */
export class PanelController {
  private baseline?: GraphPipelineInput;
  private overlays = new MetricOverlays();
  private pendingOverlays = this.overlays;
  private baselinePending = false;
  private pendingMetricUpdates: readonly MetricUpdate[] = [];
  private readonly pipeline: GraphFramePipeline<GraphPanelLayoutState, GraphPanelRenderState>;
  private readonly listeners = new Set<(event: PanelNotification) => void>();
  readonly stores: RootStore;
  private disposed = false;
  private request = 0;
  readonly scene: GraphScene;
  constructor(stages: Partial<PanelControllerStages> = {}, scene = new GraphScene()) {
    this.scene = scene;
    this.stores = new RootStore(() => this.scene.readGraph());
    const publish = (state: GraphPanelPipelineState, visualOnly: boolean) =>
      this.scene.transaction(() => {
        if (visualOnly) {
          stages.commitVisuals?.(state);
          applyGraphVisualState(state.graph.state, state.visual.state);
          const graph = this.scene.readGraph();
          if (graph && graph.graph !== state.graph.state.graph) {
            applyGraphVisualState(graph, state.visual.state);
          }
          this.scene.patchVisuals(state);
        } else {
          const prepared = stages.prepareCommit?.(state);
          applyGraphVisualState(state.graph.state, state.visual.state);
          this.scene.commit(state, prepared?.render);
          if (prepared?.visibility) {
            this.scene.replaceVisibility(prepared.visibility);
          }
          prepared?.apply?.();
          prepared?.project?.();
        }
        this.stores.onCommit();
        bumpGraphVersion(this.scene.render.graph);
        this.emit({ type: visualOnly ? 'visual' : 'commit', state });
      });
    this.pipeline = new GraphFramePipeline({
      ...stages,
      layout: stages.layout ?? ((context) => resolveGraphPanelLayout(context, undefined, async () => undefined)),
      render: stages.render ?? createGraphPanelRenderState,
      commit: (state) => publish(state, false),
      commitVisuals: (state) => publish(state, true),
    });
  }
  get state(): GraphPanelPipelineState | undefined {
    return this.scene.baseline;
  }
  get view(): GraphFrameViewState {
    return this.scene.view;
  }
  setStatus(view: GraphFrameViewState): void {
    if (!this.disposed) {
      this.scene.setStatus(view);
      this.emit({ type: 'status', view });
    }
  }
  subscribe(listener: (event: PanelNotification) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  private emit(event: PanelNotification): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Panel notification failed', error);
      }
    }
  }
  setViewport(value: ViewState, origin: 'host' | 'user' = 'user'): void {
    if (this.disposed) {
      return;
    }
    this.stores.viewStore.setViewState(value);
    if (origin === 'user') {
      this.emit({ type: 'viewport', value });
    }
  }
  select(node?: ElementKey, origin: 'host' | 'user' = 'user', pickedEdges: Edge[] = []): void {
    if (this.disposed) {
      return;
    }
    runInAction(() => this.stores.pointStore.select(node, pickedEdges));
    if (origin === 'user') {
      this.emit({ type: 'selection', node });
    }
  }
  async update(input: GraphPipelineInput) {
    this.pendingMetricUpdates = [];
    this.baselinePending = true;
    this.pendingOverlays = this.overlays;
    const promise = this.performUpdate(input);
    const request = this.request;
    try {
      const result = await promise;
      if (request === this.request && result?.ok) {
        this.baseline = input;
        this.overlays = new MetricOverlays();
        this.pendingOverlays = this.overlays;
      }
      return result;
    } finally {
      if (request === this.request) {
        this.baselinePending = false;
      }
    }
  }
  /** Individual property updates retain graph, layout and unrelated entity visuals. */
  async patchMetrics(updates: readonly MetricUpdate[]) {
    const baseline = this.baseline;
    if (!baseline?.evaluateVisuals || !updates.length || this.disposed || this.baselinePending) {
      return undefined;
    }
    for (const update of updates) {
      const source = graphPipelineSources(baseline).find((source) => source.index === update.row.sourceIndex);
      if (
        !source ||
        source.revision !== update.row.revision ||
        source.key !== update.row.sourceKey ||
        update.row.rowIndex < 0 ||
        update.row.rowIndex >= source.rowCount
      ) {
        return undefined;
      }
      // Topology/position roles remain bound to the query snapshot.
      if (
        baseline.layers.some((layer) =>
          layer.sources.some(
            (bound) =>
              bound.index === source.index &&
              [bound.nodeId, bound.target, bound.edgeId, bound.sourceNamespace, bound.targetNamespace].some(
                (column) => column?.key === update.propertyKey
              )
          )
        )
      ) {
        return undefined;
      }
    }
    if (this.state) {
      const snapshot = this.state.snapshot;
      const edgeUpdates = this.state.visual.state.edgeUnits.flatMap((unit) => {
        if (!unit) {
          return [];
        }
        const source = snapshot.nodes[snapshot.relations.getUnitSourceNodeRef(unit.unitRef)];
        const config = baseline.layers[unit.row.layerIndex ?? 0].visualConfig;
        return updates
          .filter(
            (update) =>
              sameMetricRow(update.row, source.primaryRow) &&
              config.node(unit.row.sourceIndex).colorKey === update.propertyKey &&
              config.edge(unit.row.sourceIndex).colorKey === update.propertyKey
          )
          .map((update) => ({ ...update, row: unit.row }));
      });
      updates = [...updates, ...edgeUpdates];
    }
    const overlays = this.pendingOverlays.withUpdates(updates);
    this.pendingOverlays = overlays;
    this.pendingMetricUpdates = [...this.pendingMetricUpdates, ...updates];
    const metricUpdates = this.pendingMetricUpdates;
    try {
      const sources = graphPipelineSources(baseline).map((source) => overlays.source(source));
      const visuals = baseline.evaluateVisuals(sources);
      const input: GraphPipelineInput = {
        ...baseline,
        snapshot: this.state?.snapshot,
        layers: baseline.layers.map((layer, index) => ({
          ...layer,
          sources: layer.sources.map((source) => overlays.source(source)),
          visualConfig: visuals[index],
        })),
      };
      const request = ++this.request;
      const result = await this.pipeline.patchMetrics(input, metricUpdates);
      if (request === this.request && result?.ok) {
        this.overlays = overlays;
      }
      return result;
    } finally {
      if (this.pendingOverlays === overlays) {
        this.pendingOverlays = this.overlays;
        this.pendingMetricUpdates = [];
      }
    }
  }

  private async performUpdate(input: GraphPipelineInput) {
    if (this.disposed) {
      return undefined;
    }
    const request = ++this.request;
    this.setStatus(createGraphFrameViewState({ phase: 'loading', pending: true, runtime: this.state }));
    try {
      const result = await this.pipeline.run(input);
      if (request === this.request && result && !result.ok) {
        this.setStatus(
          createGraphFrameViewState({
            phase: 'fatal',
            pending: false,
            runtime: this.state,
            diagnostics: result.diagnostics,
          })
        );
      }
      return result;
    } catch (error) {
      if (request === this.request && !this.disposed) {
        this.setStatus(createGraphFrameViewState({ phase: 'fatal', pending: false, runtime: this.state }));
      }
      throw error;
    }
  }
  invalidateGeometry(): void {
    this.request++;
    this.pipeline.invalidateGeometry();
  }
  clear(): void {
    this.scene.transaction(() => {
      this.request++;
      this.pipeline.clear();
      this.baseline = undefined;
      this.overlays = new MetricOverlays();
      this.pendingOverlays = this.overlays;
      this.baselinePending = false;
      this.pendingMetricUpdates = [];
      this.scene.clear();
      this.stores.onCommit();
      this.emit({ type: 'status', view: this.view });
    });
  }
  invalidate(): void {
    this.request++;
    this.pipeline.invalidate();
  }
  dispose(): void {
    this.clear();
    this.disposed = true;
    this.invalidate();
    this.pipeline.dispose();
    this.stores.dispose();
    this.baseline = undefined;
    this.listeners.clear();
  }
}
