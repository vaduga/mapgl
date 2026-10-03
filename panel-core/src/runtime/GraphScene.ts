import type { NamespaceProjectionStrategy } from '../extension-points/contracts';
import {
  type NamespaceProjectionResult,
  applyNamespaceProjectionStrategies,
} from '../extension-points/featureContracts';

import type { GraphBuiltState, GraphFrameViewState } from '../graph/frame/types';
import type { GraphPanelPipelineState, GraphPanelRenderState } from '../graph/frame/graphPanelRuntime';
import { createGraphFrameViewState } from '../graph/frame/visualState';
import { Graph, GraphEdgeIndex } from '../graph/main';
import type { LayerTreeInfo } from '../store/visLayer';
import { VisLayers } from '../store/VisLayers';
import type { Rule } from '../style/groups/ruleTypes';
import type { BiColProps, LayerDragShift } from '../types';
import { CMN_NAMESPACE } from '../types/defaults';

export type EffectiveRenderState = Omit<GraphPanelRenderState, 'features' | 'groups' | 'edgeKeys'> & {
  readonly features: BiColProps[];
  readonly groups: Rule[];
  readonly edgeKeys: string[];
};

function emptyRender(): EffectiveRenderState {
  return {
    graph: new Graph(CMN_NAMESPACE),
    edgeIndex: new GraphEdgeIndex(),
    positions: new Float64Array(),
    graphBounds: new Map(),
    curveGroups: new Map(),
    edgeIndexes: new Map(),
    edgeKeys: [],
    arrowTips: new Map(),
    features: [],
    colors: new Uint8Array(),
    muted: new Uint8Array(),
    annotations: new Uint8Array(),
    groupIndices: new Uint8Array(),
    groups: [],
    commentFeatures: [],
    featureSources: [],
  };
}

/** Owns effective rendering independently of React and native panel inputs. */
export class GraphScene {
  private current = emptyRender();
  private generation = 0;
  revision = 0;
  renderRevision = 0;
  presentationRevision = 0;
  private readonly listeners = new Set<() => void>();
  private transactionDepth = 0;
  private notificationPending = false;
  private _baseline?: GraphPanelPipelineState;
  private _visibility = new VisLayers();
  private _layerShift: LayerDragShift = {};
  private _projection?: NamespaceProjectionResult;
  private _layoutIncludesProjection = false;
  private _ready = false;
  private _displayReady = false;
  private _view = createGraphFrameViewState({ phase: 'idle', pending: false });

  get baseline() {
    return this._baseline;
  }
  get visibility() {
    return this._visibility;
  }
  get layerShift(): LayerDragShift {
    return this._layerShift;
  }
  get projection() {
    return this._projection;
  }
  get layoutIncludesProjection() {
    return this._layoutIncludesProjection;
  }
  get ready() {
    return this._ready;
  }
  get displayReady() {
    return this._displayReady;
  }
  get pending() {
    return this._view.pending;
  }
  get view() {
    return this._view;
  }

  readGraph(): GraphBuiltState | undefined {
    return this._baseline
      ? {
          ...this._baseline.graph.state,
          graph: this.current.graph,
          edgeIndex: this.current.edgeIndex,
          positions: this.current.positions,
        }
      : undefined;
  }

  setStatus(view: GraphFrameViewState): void {
    this._view = Object.freeze(view);
    this.changed(false);
  }

  replaceVisibility(visibility: VisLayers): void {
    visibility.preserveSelections(this._visibility);
    this._visibility = visibility;
    this.changed();
  }

  setReadiness(ready: boolean, displayReady = ready, generation = this.generation): boolean {
    if (generation !== this.generation) {
      return false;
    }
    this._ready = ready;
    this._displayReady = displayReady;
    this.changed();
    return true;
  }

  replaceLayerShift(shift: LayerDragShift, generation = this.generation): boolean {
    if (generation !== this.generation) {
      return false;
    }
    this._layerShift = { ...shift };
    this.changed();
    return true;
  }

  setLayerShift(namespaceId: string, shift: [number, number], generation = this.generation): boolean {
    return this.replaceLayerShift({ ...this._layerShift, [namespaceId]: shift }, generation);
  }

  setLayoutProjected(projected: boolean, generation = this.generation): boolean {
    if (generation !== this.generation) {
      return false;
    }
    this._layoutIncludesProjection = projected;
    this.changed();
    return true;
  }

  publishProjection(
    projection: NamespaceProjectionResult | undefined,
    positions = projection?.positions ?? this.current.positions,
    generation = this.generation
  ): boolean {
    if (generation !== this.generation) {
      return false;
    }
    this._projection = projection;
    return this.update({ positions }, generation);
  }

  get render(): EffectiveRenderState {
    return this.current;
  }
  get version(): number {
    return this.generation;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  transaction<T>(apply: () => T): T {
    this.transactionDepth++;
    try {
      return apply();
    } finally {
      this.transactionDepth--;
      if (!this.transactionDepth && this.notificationPending) {
        this.notify();
      }
    }
  }

  private changed(renderChanged = true): void {
    this.revision++;
    if (renderChanged) {
      this.renderRevision++;
    }
    this.notificationPending = true;
    if (!this.transactionDepth) {
      this.notify();
    }
  }

  private notify(): void {
    this.notificationPending = false;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        console.error('Scene notification failed', error);
      }
    }
  }

  commit(state: GraphPanelPipelineState, changes: Partial<EffectiveRenderState> = {}): void {
    this._baseline = state;
    this.generation++;
    this.current = Object.freeze({
      ...state.render.state,
      features: [...state.render.state.features],
      groups: [...state.render.state.groups],
      edgeKeys: [...state.render.state.edgeKeys],
      ...changes,
    });
    this._projection = undefined;
    this._layoutIncludesProjection = false;
    this._ready = this._displayReady = true;
    this._view = createGraphFrameViewState({
      phase: state.snapshot.nodes.length ? 'ready' : 'empty',
      pending: false,
      runtime: state,
      diagnostics: state.diagnostics,
    });
    this.changed();
  }

  /** Publish only visual fields while retaining edits, projection and generation. */
  patchVisuals(state: GraphPanelPipelineState): boolean {
    if (this._baseline?.snapshot !== state.snapshot) {
      return false;
    }
    this._baseline = state;
    const visual = state.render.state;
    const previousGroupCount = this.current.groups.length;
    if (visual.groups.length > previousGroupCount) {
      const active = this._visibility.getActiveGroups();
      const extended = new Uint8Array(visual.groups.length + Math.max(0, active.length - previousGroupCount)).fill(1);
      extended.set(active.subarray(0, previousGroupCount));
      // Preserve trailing auxiliary visibility entries when a new color group appears.
      extended.set(active.subarray(previousGroupCount), visual.groups.length);
      this._visibility.setActiveGroups(extended);
    }
    this.current = Object.freeze({
      ...this.current,
      features: [...visual.features],
      colors: visual.colors,
      muted: visual.muted,
      annotations: visual.annotations,
      groupIndices: visual.groupIndices,
      groups: [...visual.groups],
      featureSources: visual.featureSources,
    });
    this._view = createGraphFrameViewState({
      phase: state.snapshot.nodes.length ? 'ready' : 'empty',
      pending: false,
      runtime: state,
      diagnostics: state.diagnostics,
    });
    this.changed();
    return true;
  }

  /** A delayed edit/layout result may only replace the generation it prepared. */
  update(changes: Partial<EffectiveRenderState>, generation = this.generation): boolean {
    if (generation !== this.generation) {
      return false;
    }
    this.current = Object.freeze({ ...this.current, ...changes });
    this.changed();
    return true;
  }

  editPosition(index: number, value: number): void {
    const positions = this.current.positions.slice();
    positions[index] = value;
    this.update({ positions });
  }

  setActiveGroups(groups: Uint8Array): void {
    this._visibility.setActiveGroups(groups);
    this.changed();
  }

  invalidateGeometry(): void {
    this.changed();
  }

  invalidatePresentation(): void {
    this.presentationRevision++;
    this.changed(false);
  }

  setVisibility(
    layer: LayerTreeInfo,
    visible: boolean,
    style: 'children' | 'group' | 'none',
    strategies: NamespaceProjectionStrategy[]
  ): void {
    const apply = (entry: LayerTreeInfo) => {
      this._visibility.setVisible(entry.index, entry.name, entry.group, visible);
      if (entry.group && !entry.combine && style === 'children') {
        entry.children.forEach(apply);
      }
    };
    apply(layer);
    this.project(strategies);
  }

  project(strategies: NamespaceProjectionStrategy[]): void {
    const render = this.render;
    const projection = applyNamespaceProjectionStrategies(strategies, {
      graph: render.graph,
      edgeIndex: render.edgeIndex,
      positions: render.positions,
      visibleNamespaces: new Set(this._visibility.getVisibleNamespaces()),
      allNamespaces: new Set([
        render.graph.id,
        ...Array.from(render.graph.subgraphsBreadthFirst(), (graph) => graph.id),
      ]),
      layerShift: this._layerShift,
    });
    this.publishProjection(projection);
  }

  clear(): void {
    this.generation++;
    this._baseline = undefined;
    this.current = Object.freeze(emptyRender());
    this._projection = undefined;
    this._layoutIncludesProjection = false;
    this._ready = this._displayReady = false;
    // Visibility belongs to the panel lifetime; the next tree reconciles removed graph layers.
    this._layerShift = {};
    this._view = createGraphFrameViewState({ phase: 'idle', pending: false });
    this.changed();
  }
}
