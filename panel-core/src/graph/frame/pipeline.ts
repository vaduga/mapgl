import type { GrafanaTheme2 } from '@grafana/data';

import { LatestAsyncGate, type LatestAsyncGuard } from '../../utils/LatestAsyncGate';
import { getLayoutNodeRadius, resolveLayoutArrowStyle } from '../utils/layout-geometry';
import { buildGraphFromSnapshot } from './buildGraph';
import { normalizeGraphFrames } from './normalize';
import { PackedRelationFlags } from './packedRelations';
import { createGraphBuildDataSignature } from './signature';
import type {
  GraphBuildOptions,
  GraphBuiltState,
  GraphCommittedRuntimeState,
  GraphFatalResult,
  GraphFrameOptions,
  GraphFrameSnapshot,
  GraphLayoutStage,
  GraphNormalizationInput,
  GraphStageResult,
  GraphVisualConfig,
  GraphVisualState,
} from './types';
import { resolveGraphVisuals } from './visual';

type Awaitable<T> = T | Promise<T>;

export interface GraphPipelineInput extends GraphNormalizationInput {
  readonly graphOptions?: GraphBuildOptions;
  readonly visualConfig: GraphVisualConfig;
  readonly layers?: readonly GraphPipelineLayerInput[];
  readonly theme: GrafanaTheme2;
}

export interface GraphPipelineLayerInput {
  readonly options: GraphFrameOptions;
  readonly graphOptions?: GraphBuildOptions;
  readonly visualConfig: GraphVisualConfig;
}

export interface GraphPipelineLayoutContext {
  readonly input: GraphPipelineInput;
  readonly snapshot: GraphFrameSnapshot;
  readonly graph: GraphBuiltState;
  readonly visual: GraphVisualState;
  readonly isCurrent: LatestAsyncGuard;
}

export interface GraphPipelineRenderContext<TLayoutState> extends GraphPipelineLayoutContext {
  readonly layout: GraphLayoutStage<TLayoutState>;
}

export interface GraphPipelineStages<TLayoutState, TRenderState> {
  readonly normalize?: (input: GraphNormalizationInput) => Awaitable<GraphStageResult<GraphFrameSnapshot>>;
  readonly buildGraph?: (
    snapshot: GraphFrameSnapshot,
    options?: GraphBuildOptions
  ) => Awaitable<GraphStageResult<GraphBuiltState>>;
  readonly resolveVisuals?: (input: {
    readonly data: GraphPipelineInput['data'];
    readonly snapshot: GraphFrameSnapshot;
    readonly graph: GraphBuiltState;
    readonly config: GraphVisualConfig;
    readonly theme: GrafanaTheme2;
  }) => Awaitable<GraphStageResult<GraphVisualState>>;
  readonly layout: (context: GraphPipelineLayoutContext) => Awaitable<TLayoutState>;
  readonly render: (context: GraphPipelineRenderContext<TLayoutState>) => Awaitable<TRenderState>;
  readonly commit?: (
    state: GraphCommittedRuntimeState<GraphBuiltState, GraphVisualState, TLayoutState, TRenderState>
  ) => void;
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
      const normalize = this.stages.normalize ?? normalizeGraphFrames;
      const layerInputs = input.layers?.length ? input.layers : undefined;
      const graphOptions = layerInputs
        ? {
            layers: layerInputs.map((layer) => layer.graphOptions ?? {}),
          }
        : input.graphOptions;
      const normalized = await normalize({
        data: input.data,
        options: input.options,
        ...(layerInputs && {
          normalizationLayers: layerInputs.map((layer, layerIndex) => ({
            layerIndex,
            options: layer.options,
          })),
        }),
      });
      if (!normalized.ok) {
        return normalized;
      }
      if (!isCurrent()) {
        return undefined;
      }

      const snapshot = normalized.value;
      const buildSignature = graphBuildSignature(snapshot, graphOptions);
      const reusableGraph = this.committedBuildSignature === buildSignature ? this.committed : undefined;
      const graphResult = reusableGraph
        ? success(reusableGraph.graph.state, normalized.diagnostics, normalized.empty)
        : await (this.stages.buildGraph ?? buildGraphFromSnapshot)(snapshot, graphOptions);
      if (!graphResult.ok) {
        return graphResult;
      }
      if (!isCurrent()) {
        return undefined;
      }

      const resolveVisuals = this.stages.resolveVisuals ?? resolveGraphVisuals;
      const visualResult = await resolveVisuals({
        data: input.data,
        snapshot,
        graph: graphResult.value,
        config: input.visualConfig,
        ...(layerInputs && { configs: layerInputs.map((layer) => layer.visualConfig) }),
        theme: input.theme,
      });
      if (!visualResult.ok) {
        return visualResult;
      }
      if (!isCurrent()) {
        return undefined;
      }

      const layoutSignature = graphLayoutSignature(snapshot, input, visualResult.value, graphOptions);
      const reusableLayout = this.committedLayoutSignature === layoutSignature ? this.committed : undefined;
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

  invalidate(): void {
    this.gate.invalidate();
  }

  dispose(): void {
    this.gate.dispose();
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
    options?.layers ?? null,
  ]);
}

function graphLayoutSignature(
  snapshot: GraphFrameSnapshot,
  input: GraphPipelineInput,
  visual: GraphVisualState,
  graphOptions?: GraphBuildOptions
): string {
  const layerOptions = input.layers?.length ? input.layers.map(({ options }) => options) : [input.options];
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
