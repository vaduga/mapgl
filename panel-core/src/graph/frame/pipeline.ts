import { LatestAsyncGate, type LatestAsyncGuard } from '../../utils/LatestAsyncGate';
import { getLayoutNodeRadius, resolveLayoutArrowStyle } from '../utils/layout-geometry';
import { buildGraphFromSnapshot } from './buildGraph';
import { normalizeGraphSources, type GraphSourceNormalizationInput, type GraphBoundLayer } from './normalizeSources';
import type { MetricUpdate } from '../../data/metricOverlays';
import type { SourceView } from '../../data/sources';
import { PackedRelationFlags } from './packedRelations';
import { createGraphBuildDataSignature } from './signature';
import type {
  GraphBuildOptions,
  GraphBuiltState,
  GraphCommittedRuntimeState,
  GraphFatalResult,
  GraphFrameSnapshot,
  GraphLayoutStage,
  GraphStageResult,
  GraphVisualConfig,
  GraphVisualState,
  GraphVisualInput,
} from './types';
import { resolveGraphVisuals } from './visual';

type Awaitable<T> = T | Promise<T>;

export interface GraphPipelineInput {
  readonly layers: readonly GraphPipelineLayerInput[];
  readonly diagnostics?: GraphFrameSnapshot['diagnostics'];
  readonly snapshot?: GraphFrameSnapshot;
  readonly evaluateVisuals?: (sources: readonly SourceView[]) => readonly GraphVisualConfig[];
  readonly resolveColor?: (name: string) => string;
}

export interface GraphPipelineLayerInput extends GraphBoundLayer {
  readonly graphOptions?: GraphBuildOptions;
  readonly visualConfig: GraphVisualConfig;
}

/** A source can participate in several configured layers while retaining one revision identity. */
export function graphPipelineSources(input: GraphPipelineInput): ReadonlyArray<import('../../data').GraphSource> {
  return [
    ...new Map(
      input.layers.flatMap((layer) => layer.sources.map((source) => [source.index, source] as const))
    ).values(),
  ];
}

export interface GraphPipelineLayoutContext {
  readonly input: GraphPipelineInput;
  readonly snapshot: GraphFrameSnapshot;
  readonly graph: GraphBuiltState;
  readonly visual: GraphVisualState;
  readonly isCurrent: LatestAsyncGuard;
  readonly signal?: AbortSignal;
}

export interface GraphPipelineRenderContext<TLayoutState> extends GraphPipelineLayoutContext {
  readonly layout: GraphLayoutStage<TLayoutState>;
}

export interface GraphPipelineStages<TLayoutState, TRenderState> {
  readonly isolateGraph?: boolean;
  readonly normalize?: (input: GraphSourceNormalizationInput) => Awaitable<GraphStageResult<GraphFrameSnapshot>>;
  readonly buildGraph?: (
    snapshot: GraphFrameSnapshot,
    options?: GraphBuildOptions
  ) => Awaitable<GraphStageResult<GraphBuiltState>>;
  readonly resolveVisuals?: (input: GraphVisualInput) => Awaitable<GraphStageResult<GraphVisualState>>;
  readonly layout: (context: GraphPipelineLayoutContext) => Awaitable<TLayoutState>;
  readonly render: (context: GraphPipelineRenderContext<TLayoutState>) => Awaitable<TRenderState>;
  readonly commit?: (
    state: GraphCommittedRuntimeState<GraphBuiltState, GraphVisualState, TLayoutState, TRenderState>
  ) => void;
  readonly commitVisuals?: (state: GraphPipelineState<TLayoutState, TRenderState>) => void;
  readonly notify?: (
    state: GraphCommittedRuntimeState<GraphBuiltState, GraphVisualState, TLayoutState, TRenderState>
  ) => Awaitable<void>;
}

export type GraphPipelineState<TLayoutState, TRenderState> = GraphCommittedRuntimeState<
  GraphBuiltState,
  GraphVisualState,
  TLayoutState,
  TRenderState
>;

export class GraphFramePipeline<TLayoutState, TRenderState> {
  private readonly gate = new LatestAsyncGate();
  private committed?: GraphPipelineState<TLayoutState, TRenderState>;
  private committedBuildSignature?: string;
  private committedLayoutSignature?: string;
  private version = 0;

  constructor(private readonly stages: GraphPipelineStages<TLayoutState, TRenderState>) {}

  get state(): GraphPipelineState<TLayoutState, TRenderState> | undefined {
    return this.committed;
  }

  run(
    input: GraphPipelineInput
  ): Promise<GraphStageResult<GraphPipelineState<TLayoutState, TRenderState>> | undefined> {
    return this.gate.run(async (isCurrent) => {
      const normalize = this.stages.normalize ?? normalizeGraphSources;
      const layerInputs = input.layers;
      const graphOptions = { layers: layerInputs.map((layer) => layer.graphOptions ?? {}) };
      const normalized = input.snapshot
        ? success(input.snapshot, input.snapshot.diagnostics, !input.snapshot.nodes.length)
        : await normalize({
            layers: input.layers.map((layer, layerIndex) => ({ ...layer, layerIndex })),
            diagnostics: input.diagnostics,
          });
      if (!normalized.ok) {
        return normalized;
      }
      if (!isCurrent()) {
        return undefined;
      }

      const snapshot = normalized.value;
      const buildSignature = graphBuildSignature(snapshot, graphOptions);
      const reusableGraph =
        !this.stages.isolateGraph && this.committedBuildSignature === buildSignature ? this.committed : undefined;
      let graphResult = reusableGraph
        ? success(reusableGraph.graph.state, normalized.diagnostics, normalized.empty)
        : await (this.stages.buildGraph ?? buildGraphFromSnapshot)(snapshot, graphOptions);
      if (!graphResult.ok) {
        return graphResult;
      }
      if (!isCurrent()) {
        return undefined;
      }

      const resolveVisuals = this.stages.resolveVisuals ?? resolveGraphVisuals;
      let visualResult = await resolveVisuals({
        sources: graphPipelineSources(input),
        snapshot,
        graph: graphResult.value,
        configs: layerInputs.map((layer) => layer.visualConfig),
      });
      if (!visualResult.ok) {
        return visualResult;
      }
      if (!isCurrent()) {
        return undefined;
      }

      const layoutSignature = graphLayoutSignature(snapshot, input, visualResult.value, graphOptions);
      const reusableLayout = this.committedLayoutSignature === layoutSignature ? this.committed : undefined;
      if (reusableGraph && !reusableLayout) {
        graphResult = await (this.stages.buildGraph ?? buildGraphFromSnapshot)(snapshot, graphOptions);
        if (!graphResult.ok || !isCurrent()) {
          return graphResult.ok ? undefined : graphResult;
        }
        visualResult = await resolveVisuals({
          sources: graphPipelineSources(input),
          snapshot,
          graph: graphResult.value,
          configs: layerInputs.map((layer) => layer.visualConfig),
        });
        if (!visualResult.ok || !isCurrent()) {
          return visualResult.ok ? undefined : visualResult;
        }
      }
      const graph = Object.freeze({ snapshot, state: graphResult.value });
      const visual = Object.freeze({ snapshot, state: visualResult.value });
      const layout: GraphLayoutStage<TLayoutState> = reusableLayout
        ? Object.freeze({
            signature: layoutSignature,
            state: reusableLayout.layout.state,
            reused: true,
          })
        : Object.freeze({
            signature: layoutSignature,
            state: await this.stages.layout({
              input,
              snapshot,
              graph: graphResult.value,
              visual: visualResult.value,
              isCurrent,
              signal: isCurrent.signal,
            }),
            reused: false,
          });
      if (!isCurrent()) {
        return undefined;
      }

      const renderState = await this.stages.render({
        input,
        snapshot,
        graph: graphResult.value,
        visual: visualResult.value,
        layout,
        isCurrent,
        signal: isCurrent.signal,
      });
      if (!isCurrent()) {
        return undefined;
      }

      const committed: GraphPipelineState<TLayoutState, TRenderState> = Object.freeze({
        version: ++this.version,
        snapshot,
        graph,
        visual,
        layout,
        render: Object.freeze({ snapshot, state: renderState }),
        diagnostics: normalized.diagnostics,
      });
      const previous = this.committed;
      const previousBuildSignature = this.committedBuildSignature;
      const previousLayoutSignature = this.committedLayoutSignature;
      this.committed = committed;
      this.committedBuildSignature = buildSignature;
      this.committedLayoutSignature = layoutSignature;
      try {
        this.stages.commit?.(committed);
      } catch (error) {
        this.committed = previous;
        this.committedBuildSignature = previousBuildSignature;
        this.committedLayoutSignature = previousLayoutSignature;
        this.version--;
        throw error;
      }
      await this.stages.notify?.(committed);

      return success(committed, normalized.diagnostics, normalized.empty);
    });
  }

  /** Updates visual properties without graph construction, layout or full commit preparation. */
  patchMetrics(input: GraphPipelineInput, updates: readonly MetricUpdate[]) {
    return this.gate.run(async (isCurrent) => {
      const previous = this.committed;
      if (!previous) {
        return undefined;
      }
      const snapshot = previous.snapshot;
      const graph = previous.graph.state;
      const visual = await (this.stages.resolveVisuals ?? resolveGraphVisuals)({
        sources: graphPipelineSources(input),
        snapshot,
        graph,
        configs: input.layers.map((layer) => layer.visualConfig),
        metricPatch: { previous: previous.visual.state, updates },
      });
      if (!visual.ok || !isCurrent()) {
        return visual.ok ? undefined : visual;
      }
      const layout = Object.freeze({ ...previous.layout, reused: true });
      const render = await this.stages.render({
        input,
        snapshot,
        graph,
        visual: visual.value,
        layout,
        isCurrent,
        signal: isCurrent.signal,
      });
      if (!isCurrent()) {
        return undefined;
      }
      const committed = Object.freeze({
        ...previous,
        version: ++this.version,
        layout,
        visual: Object.freeze({ snapshot, state: visual.value }),
        render: Object.freeze({ snapshot, state: render }),
      });
      this.committed = committed;
      try {
        this.stages.commitVisuals?.(committed);
      } catch (error) {
        this.committed = previous;
        this.version--;
        throw error;
      }
      return success(committed, committed.diagnostics, !snapshot.nodes.length);
    });
  }

  invalidateGeometry(): void {
    this.invalidate();
    this.committedBuildSignature = undefined;
    this.committedLayoutSignature = undefined;
  }

  clear(): void {
    this.invalidateGeometry();
    this.committed = undefined;
  }

  invalidate(): void {
    this.gate.invalidate();
  }

  dispose(): void {
    this.gate.dispose();
    this.committed = undefined;
  }
}

function graphBuildSignature(snapshot: GraphFrameSnapshot, options?: GraphBuildOptions): string {
  return JSON.stringify([
    'gb2',
    snapshot.topologySignature,
    snapshot.geometrySignature,
    createGraphBuildDataSignature(snapshot),
    options?.layerIndex ?? null,
    options?.wrap ?? null,
    options?.nest ?? null,
    options?.layers ?? null,
  ]);
}

function graphLayoutSignature(
  snapshot: GraphFrameSnapshot,
  input: GraphPipelineInput,
  visual: GraphVisualState,
  graphOptions?: GraphBuildOptions
): string {
  const layerOptions = input.layers.map(({ options }) => options);
  const hasGeoLayer = layerOptions.some(({ isLogic }) => !isLogic);
  const hasLogicLayer = layerOptions.some(({ isLogic }) => isLogic);

  return JSON.stringify([
    'gl2',
    snapshot.topologySignature,
    hasGeoLayer ? snapshot.geometrySignature : null,
    layerOptions.map(({ layoutSignature }) => layoutSignature ?? null),
    hasLogicLayer ? (graphOptions ?? null) : null,
    hasLogicLayer ? graphLogicLayoutGeometrySignature(snapshot, visual) : null,
  ]);
}

function graphLogicLayoutGeometrySignature(snapshot: GraphFrameSnapshot, visual: GraphVisualState): unknown {
  const nodeVisuals = new Map(visual.nodes.map((record) => [record.key, record] as const));
  return [
    snapshot.nodes.map(({ key }) => [key, getLayoutNodeRadius(nodeVisuals.get(key)?.style.size)]),
    Array.from({ length: snapshot.relations.recordCount }, (_, index) => {
      const unitStart = snapshot.relations.getRecordUnitStart(index);
      const unitCount = snapshot.relations.getRecordUnitCount(index);
      const explicit = Boolean(snapshot.relations.getRecordFlags(index) & PackedRelationFlags.explicitId);
      return [
        snapshot.relations.getRecordKey(index),
        Array.from({ length: explicit ? unitCount : Math.min(unitCount, 1) }, (_, unitOffset) => {
          const style = visual.edgeUnits[unitStart + unitOffset]?.style;
          const arrow = resolveLayoutArrowStyle(style?.arrow, style?.size);
          return [arrow.arrow, arrow.length ?? null];
        }),
      ];
    }),
  ];
}

function success<T>(value: T, diagnostics: GraphFatalResult['diagnostics'], empty: boolean): GraphStageResult<T> {
  return Object.freeze({
    ok: true,
    value,
    diagnostics,
    empty,
  });
}
