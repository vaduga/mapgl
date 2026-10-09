import { reaction } from 'mobx';
import type { PanelController } from '../runtime/PanelController';
import { resolvePickingFocus } from '../runtime/picking';
import { findEdge, type Graph } from '../graph/main';
import type { FocusRef } from '../store/PointStore';
import { GraphHighlighter } from '../deckLayers/GraphHighlighter';
import { getDimmedGraphLayers } from '../deckLayers/focus-layers';
import {
  captureRenderInput,
  prepareGraphRender,
  buildPrimaryLayers,
  type CapturedRenderInput,
  type PreparedGraphRender,
  type PrimaryFactories,
  type RenderPresentation,
  type RenderPreparationOptions,
} from './graph';
import { composeRenderLayers, withTransientLayers, type RenderLayer, type RenderLayerBundle } from './layers';

export interface RenderBuildGuard {
  readonly signal: AbortSignal;
  readonly isCurrent: () => boolean;
}
export interface RenderExtension {
  readonly factories?: PrimaryFactories;
  readonly contributions?: RenderLayerBundle;
  readonly prepared?: Partial<PreparedGraphRender>;
  /** Installs private edit state only after this candidate is accepted. */
  readonly accept?: () => void;
  /** Only for resources owned by this contribution, never ordinary Deck layers. */
  readonly dispose?: () => void;
}
export interface PanelRenderOptions {
  readonly presentation: RenderPresentation;
  readonly preparation?: RenderPreparationOptions;
  readonly secondary?: (input: CapturedRenderInput) => readonly RenderLayer[];
  readonly extend?: (
    input: CapturedRenderInput,
    prepared: PreparedGraphRender,
    guard: RenderBuildGuard
  ) => RenderExtension | Promise<RenderExtension>;
  readonly onError?: (error: unknown) => void;
  readonly nodesBeforeEdges?: boolean;
  readonly ready?: boolean;
}
export interface DisplayedRenderFrame {
  readonly id: number;
  readonly input: CapturedRenderInput;
  readonly prepared: PreparedGraphRender;
  readonly bundle: RenderLayerBundle;
  readonly layers: readonly RenderLayer[];
  readonly extension?: RenderExtension;
}
export interface InstantRenderPatch {
  readonly base: DisplayedRenderFrame;
  readonly buckets?: Partial<RenderLayerBundle>;
  /** Reassemble from the session capture; this extension owns acceptance and cleanup. */
  readonly extension?: RenderExtension;
  readonly input?: never;
  readonly prepared?: never;
  readonly accept?: never;
  readonly dispose?: never;
}

/** Derived display lifetime. The caller retains its controller, worker and canvas. */
export class PanelRenderSession {
  private options: PanelRenderOptions;
  private sequence = 0;
  private presentationRevision = 0;
  private abort?: AbortController;
  private disposed = false;
  private queued = false;
  private scheduledSequence = 0;
  private readonly listeners = new Set<() => void>();
  private readonly unsubscribe: () => void;
  private readonly stopPresentation: () => void;
  private readonly stopFocus: () => void;
  private preparedCache?: {
    revision: number;
    presentation: string;
    options: PanelRenderOptions['preparation'];
    prepared: PreparedGraphRender;
  };
  private _frame?: DisplayedRenderFrame;
  private _error?: string;
  private _layers: readonly RenderLayer[] = [];
  private transients: readonly RenderLayer[] = [];
  private transientIds: readonly string[] = [];
  private beforeTransient?: string;
  private highlighter?: GraphHighlighter;
  private seenRevision: number;
  private seenPresentation: number;

  constructor(
    readonly controller: PanelController,
    options: PanelRenderOptions
  ) {
    this.options = options;
    this.seenRevision = controller.scene.renderRevision;
    this.seenPresentation = controller.scene.presentationRevision;
    this.unsubscribe = controller.scene.subscribe(() => {
      if (
        this.seenRevision === controller.scene.renderRevision &&
        this.seenPresentation === controller.scene.presentationRevision
      ) {
        return;
      }
      this.seenRevision = controller.scene.renderRevision;
      this.seenPresentation = controller.scene.presentationRevision;
      this.presentationRevision++;
      this.invalidate();
      // Empty/clear cannot leave an old graph selectable while another import is pending.
      if (!controller.scene.render.features.length) {
        this.publishEmpty();
      }
      this.schedule();
    });
    const points = controller.stores.pointStore;
    this.stopPresentation = reaction(
      () => [points.getSelectedNode?.id, points.getSelEdges.map((e) => e.id).join('\0'), points.mode],
      () => {
        this.presentationRevision++;
        this.invalidate();
        this.schedule();
      }
    );
    this.stopFocus = reaction(
      () => points.focusRevision,
      () => this.derive()
    );
    this.schedule();
  }
  get frame() {
    return this._frame;
  }
  get layers() {
    return this._layers;
  }
  get error() {
    return this._error;
  }
  private fail(error: unknown): void {
    this._error = error instanceof Error ? error.message : String(error);
    this.notify();
    this.options.onError?.(error);
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  private notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        this.options.onError?.(error);
      }
    }
  }
  configure(options: PanelRenderOptions): void {
    if (this.disposed) {
      return;
    }
    this.options = options;
    this.presentationRevision++;
    this.invalidate();
    this.schedule();
  }
  invalidate(): void {
    this.sequence++;
    this.abort?.abort();
  }
  private schedule(): void {
    this.scheduledSequence = this.sequence;
    if (this.queued || this.disposed) {
      return;
    }
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      if (!this.disposed && this.scheduledSequence === this.sequence) {
        void this.build();
      }
    });
  }
  private publishEmpty(): void {
    const input = captureRenderInput(this.controller, this.options.presentation);
    const prepared: PreparedGraphRender = {
      collections: [],
      geometry: { routed: {}, arcs: {}, mappings: [] },
      bounds: { type: 'FeatureCollection', features: [] },
      comments: [],
    };
    let secondary = this.frame?.bundle.secondary ?? [];
    let failure: { error: unknown } | undefined;
    try {
      secondary = this.options.secondary?.(input) ?? [];
    } catch (error) {
      failure = { error };
    }
    const bundle = { secondary };
    this.transients = [];
    this.transientIds = [];
    const frame = { id: ++this.sequence, input, prepared, bundle, layers: composeRenderLayers(bundle) };
    const highlighter = this.createHighlighter(frame);
    this.publish(frame, highlighter, this.deriveLayers(frame, highlighter));
    if (failure) {
      this.fail(failure.error);
    }
  }
  private inputIsCurrent(input: CapturedRenderInput): boolean {
    return (
      input.generation === this.controller.scene.version &&
      input.revision === this.controller.scene.renderRevision &&
      input.sourceEdgeIndex === this.controller.scene.render.edgeIndex &&
      input.edgeIndexRevision === input.sourceEdgeIndex.revision
    );
  }
  /** Also usable by non-React consumers and deterministic tests. */
  async build(): Promise<DisplayedRenderFrame | undefined> {
    if (this.disposed) {
      return;
    }
    this.invalidate();
    const id = this.sequence;
    const abort = (this.abort = new AbortController());
    const options = this.options;
    const revision = this.presentationRevision;
    const input = captureRenderInput(this.controller, options.presentation);
    const isCurrent = () =>
      !this.disposed &&
      !abort.signal.aborted &&
      id === this.sequence &&
      this.inputIsCurrent(input) &&
      revision === this.presentationRevision;
    const guard = { signal: abort.signal, isCurrent };
    if (!input.render.features.length) {
      this.publishEmpty();
      return this.frame;
    }
    if (options.ready === false) {
      return;
    }
    let extension: RenderExtension | undefined;
    let frame: DisplayedRenderFrame;
    let highlighter: GraphHighlighter;
    let layers: readonly RenderLayer[];
    let accepted = false;
    try {
      const preparation = options.preparation;
      const preparationPresentation = JSON.stringify([
        input.presentation.isLogic,
        input.presentation.showAnnotations,
        input.presentation.bounds,
      ]);
      let prepared: PreparedGraphRender;
      if (
        this.preparedCache?.revision === input.revision &&
        this.preparedCache.presentation === preparationPresentation &&
        this.preparedCache.options === options.preparation
      ) {
        prepared = this.preparedCache.prepared;
      } else {
        prepared = prepareGraphRender(input, preparation);
        this.preparedCache = {
          revision: input.revision,
          presentation: preparationPresentation,
          options: options.preparation,
          prepared,
        };
      }
      if (options.extend) {
        extension = await options.extend(input, prepared, guard);
      }
      if (!isCurrent()) {
        return;
      }
      prepared = { ...prepared, ...extension?.prepared };
      const bundle = this.assemble(input, prepared, extension, preparation, revision, options.secondary?.(input) ?? []);
      frame = {
        id,
        input,
        prepared,
        bundle,
        layers: composeRenderLayers(bundle, { nodesBeforeEdges: options.nodesBeforeEdges }),
        extension,
      };
      highlighter = this.createHighlighter(frame);
      layers = this.deriveLayers(frame, highlighter);
      if (!isCurrent()) {
        return;
      }
      if (this.frame?.extension !== extension) {
        extension?.accept?.();
      }
      accepted = true;
    } catch (error) {
      if (isCurrent()) {
        this.fail(error);
      }
      return;
    } finally {
      if (!accepted) {
        this.release(extension?.dispose);
      }
    }
    this.publish(frame, highlighter, layers);
    return frame;
  }
  private assemble(
    input: CapturedRenderInput,
    prepared: PreparedGraphRender,
    extension: RenderExtension | undefined,
    preparation: RenderPreparationOptions | undefined,
    revision: number,
    secondary: readonly RenderLayer[]
  ): RenderLayerBundle {
    return buildPrimaryLayers(input, prepared, {
      factories: extension?.factories,
      contributions: { ...extension?.contributions, secondary },
      edgeOffsetStrategies: preparation?.edgeOffsetStrategies,
      presentationRevision: revision,
    });
  }
  private createHighlighter(frame: DisplayedRenderFrame): GraphHighlighter {
    const highlighter = new GraphHighlighter();
    highlighter.setGraph(frame.input.render.graph, {
      edgeIndex: frame.input.render.edgeIndex,
      mappings: frame.prepared.geometry.mappings,
    });
    return highlighter;
  }
  private publish(frame: DisplayedRenderFrame, highlighter: GraphHighlighter, layers: readonly RenderLayer[]): void {
    const previous = this._frame;
    this._frame = frame;
    this._error = undefined;
    this.highlighter = highlighter;
    this._layers = layers;
    try {
      this.controller.stores.pointStore.setRenderIndexes(
        frame.input.sourceEdgeIndex,
        frame.prepared.geometry.mappings,
        frame.prepared.bounds.features.map((f) => f.properties.id)
      );
      this.notify();
    } finally {
      if (previous?.extension !== frame.extension) {
        this.release(previous?.extension?.dispose);
      }
    }
  }
  async instant(
    prepare: (
      base: DisplayedRenderFrame,
      guard: RenderBuildGuard,
      input: CapturedRenderInput
    ) => InstantRenderPatch | Promise<InstantRenderPatch>
  ): Promise<boolean> {
    const base = this.frame;
    if (
      !base ||
      this.disposed ||
      base.input.generation !== this.controller.scene.version ||
      base.input.sourceEdgeIndex !== this.controller.scene.render.edgeIndex ||
      base.input.edgeIndexRevision !== base.input.sourceEdgeIndex.revision
    ) {
      return false;
    }
    this.invalidate();
    const id = this.sequence;
    const captured = captureRenderInput(this.controller, this.options.presentation);
    const abort = (this.abort = new AbortController());
    const isCurrent = () =>
      !this.disposed &&
      !abort.signal.aborted &&
      id === this.sequence &&
      this.frame === base &&
      this.inputIsCurrent(captured);
    let patch: InstantRenderPatch | undefined;
    let frame: DisplayedRenderFrame;
    let highlighter: GraphHighlighter;
    let layers: readonly RenderLayer[];
    let accepted = false;
    try {
      const candidate = prepare(base, { signal: abort.signal, isCurrent }, captured);
      patch = candidate instanceof Promise ? await candidate : candidate;
      if (!isCurrent() || patch.base !== base) {
        return false;
      }
      const input = patch.extension ? captured : base.input;
      const prepared = { ...base.prepared, ...patch.extension?.prepared };
      const preparation = this.options.preparation;
      const bundle = {
        ...(patch.extension
          ? this.assemble(
              input,
              prepared,
              patch.extension,
              preparation,
              this.presentationRevision,
              base.bundle.secondary ?? []
            )
          : base.bundle),
        ...patch.buckets,
      };
      // Bucket-only patches borrow the displayed lifetime; supplied extensions replace it.
      const extension = patch.extension ?? base.extension;
      frame = {
        ...base,
        id,
        input,
        prepared,
        bundle,
        layers: composeRenderLayers(bundle, { nodesBeforeEdges: this.options.nodesBeforeEdges }),
        extension,
      };
      highlighter = this.createHighlighter(frame);
      layers = this.deriveLayers(frame, highlighter);
      if (!isCurrent()) {
        return false;
      }
      patch.extension?.accept?.();
      accepted = true;
    } catch (error) {
      if (isCurrent()) {
        this.fail(error);
      }
      return false;
    } finally {
      if (!accepted) {
        this.release(patch?.extension?.dispose);
      }
    }
    this.publish(frame, highlighter, layers);
    return true;
  }
  setTransient(layers: readonly RenderLayer[], ids: readonly string[], beforeId?: string): void {
    this.transients = layers;
    this.transientIds = ids;
    this.beforeTransient = beforeId;
    this.derive();
  }
  private derive(): void {
    const frame = this.frame;
    if (!frame || this.disposed) {
      return;
    }
    this._layers = this.deriveLayers(frame, this.highlighter!);
    this.notify();
  }
  private deriveLayers(frame: DisplayedRenderFrame, highlighter: GraphHighlighter): readonly RenderLayer[] {
    const points = this.controller.stores.pointStore;
    const p = frame.input.presentation;
    let layers = withTransientLayers(frame.layers, this.transients, this.transientIds, this.beforeTransient);
    if (points.mode === 'view' && points.getHasFocusHighlight && (p.isLogic || !p.isRouted)) {
      if (points.focusedEdges.length) {
        const edges = points.focusedEdges.flatMap((edge) => {
          const graph = frame.input.graphs.find((g) => g.id === (edge.source.parent as Graph).id);
          const captured = graph && findEdge(graph, edge.id);
          return captured ? [captured] : [];
        });
        highlighter.updateEdges(edges);
      } else if (points.focusedEdgeId) {
        highlighter.updateEdge({ edgeId: points.focusedEdgeId, graphId: points.focusedEdgeGraphId });
      } else {
        highlighter.update({
          sourceId: points.focusedNodeId,
          graphId: points.focusedNodeGraphId,
          isDefDir: points.isEdgeListed ? points.isDefDir : null,
        });
      }
      layers = getDimmedGraphLayers(layers, {
        connectedNodeIds: highlighter.getConnectedNodeIds(),
        connectedEdgeIndexes: highlighter.getConnectedEdgeIndexes(),
        isRouted: p.isRouted,
      });
    }
    return layers;
  }
  focusHover(info: any): void {
    const store = this.controller.stores.pointStore;
    store.focus(this.resolvePick(info?.picked ? info : store.getTooltipObject));
  }

  resolvePick(info: any): FocusRef | undefined {
    const frame = this.frame;
    if (!frame) {
      return;
    }
    const key = resolvePickingFocus(
      { baseline: frame.input.snapshot ? { snapshot: frame.input.snapshot } : undefined, render: frame.input.render },
      info
    );
    if (!key) {
      return;
    }
    const current = this.controller.scene.render.graph;
    const graph = ([current, ...current.subgraphsBreadthFirst()] as Graph[]).find(
      (graph) => graph.id === key.namespaceId
    );
    return graph && (key.kind === 'node' ? graph.findNode(key.id) : findEdge(graph, key.id)) ? key : undefined;
  }
  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.invalidate();
    this.listeners.clear();
    this.preparedCache = undefined;
    this.release(this.unsubscribe, this.stopPresentation, this.stopFocus, this.frame?.extension?.dispose);
  }
  private release(...cleanups: Array<(() => void) | undefined>): void {
    const errors: unknown[] = [];
    for (const cleanup of cleanups) {
      try {
        cleanup?.();
      } catch (error) {
        errors.push(error);
      }
    }
    for (const error of errors) {
      this.options.onError?.(error);
    }
  }
}
