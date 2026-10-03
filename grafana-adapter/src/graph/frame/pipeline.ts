import { PanelController, type PanelControllerStages, type GraphScene } from '@vaduga/mapgl-core/runtime';
import type { GrafanaTheme2 } from '@grafana/data';
import {
  type GraphPipelineInput,
  type GraphPipelineState,
  type GraphBuildOptions,
} from '@vaduga/mapgl-core/graph/frame';

import { LatestAsyncGate } from '@vaduga/mapgl-core/utils';
import type { GraphFrameOptions, GraphNormalizationInput, GrafanaGraphVisualConfig } from './types';
import { bindGraphFrames } from './normalize';
import { GrafanaSourceResolver } from '../../data';
import { compileGraphVisualConfig } from './visual';
export type { GraphPipelineState } from '@vaduga/mapgl-core/graph/frame';

let nextPipelineId = 0;

export interface GrafanaGraphPipelineLayerInput {
  readonly options: GraphFrameOptions;
  readonly graphOptions?: GraphBuildOptions;
  readonly visualConfig: GrafanaGraphVisualConfig;
}
export interface GrafanaGraphPipelineInput {
  readonly data: GraphNormalizationInput['data'];
  readonly layers: readonly GrafanaGraphPipelineLayerInput[];
  readonly theme: GrafanaTheme2;
}
export interface GrafanaGraphPipelineStages extends PanelControllerStages {
  readonly bind?: typeof bindGraphFrames;
}
export class GrafanaGraphPipeline {
  sourceResolver?: GrafanaSourceResolver;
  private readonly pipelineId = ++nextPipelineId;
  private baselineFrames?: GrafanaGraphPipelineInput['data']['series'];
  private baselineSignature?: string;
  private baselineRevision = 0;
  private candidateResolver?: GrafanaSourceResolver;
  private readonly gate = new LatestAsyncGate();
  readonly controller: PanelController;
  constructor(
    private readonly stages: Partial<GrafanaGraphPipelineStages> = {},
    scene?: GraphScene
  ) {
    this.controller = new PanelController(
      {
        ...stages,
        prepareCommit: (state) => {
          const prepared = stages.prepareCommit?.(state);
          return {
            ...prepared,
            apply: () => {
              this.sourceResolver = this.candidateResolver;
              prepared?.apply?.();
            },
          };
        },
      },
      scene
    );
  }
  get state(): import('@vaduga/mapgl-core/graph/frame').GraphPanelPipelineState | undefined {
    return this.controller.state;
  }
  run(input: GrafanaGraphPipelineInput) {
    this.controller.invalidate();
    const signature = JSON.stringify(
      input.data.series.map((frame) => [
        frame.refId,
        frame.name,
        frame.fields.map((field) => [field.name, field.config, field.values]),
      ])
    );
    if (
      signature !== this.baselineSignature ||
      input.data.series.some((frame, index) => frame !== this.baselineFrames?.[index])
    ) {
      this.baselineFrames = [...input.data.series];
      this.baselineSignature = signature;
      this.baselineRevision++;
    }
    const revision = `pipeline-${this.pipelineId}-${this.baselineRevision}`;
    return this.gate.run(async (isCurrent) => {
      const layerInputs = input.layers;
      const bound = await (this.stages.bind ?? bindGraphFrames)({
        ...input,
        revision,
        options: layerInputs[0].options,
        normalizationLayers: layerInputs.map((layer, layerIndex) => ({ layerIndex, options: layer.options })),
      });
      if (!isCurrent()) {
        return undefined;
      }
      const evaluateVisuals: NonNullable<GraphPipelineInput['evaluateVisuals']> = (sources) => {
        const effectiveFrames = bound.frames.map((frame, sourceIndex) => {
          const source = sources.find((source) => source.index === sourceIndex);
          return {
            ...frame,
            fields: frame.fields.map((field) =>
              source?.overlaidProperties?.has(field.name)
                ? {
                    ...field,
                    state: undefined,
                    display: undefined,
                    config: { ...field.config },
                    values: Array.from({ length: frame.length }, (_, rowIndex) => source.value(field.name, rowIndex)),
                  }
                : field
            ),
          };
        });
        return layerInputs.map((layer) =>
          compileGraphVisualConfig(layer.visualConfig, effectiveFrames, input.theme, bound.revision)
        );
      };
      const configs = layerInputs.map((layer) =>
        compileGraphVisualConfig(layer.visualConfig, bound.frames, input.theme, bound.revision)
      );
      const compiled: GraphPipelineInput = {
        diagnostics: bound.normalization.diagnostics,
        layers: layerInputs.map((layer, index) => ({
          layerIndex: index,
          options: layer.options,
          sources: bound.normalization.layers.find((boundLayer) => boundLayer.layerIndex === index)?.sources ?? [],
          graphOptions: layer.graphOptions,
          visualConfig: configs[index],
        })),
        evaluateVisuals,
        resolveColor: (name) => input.theme.visualization.getColorByName(name),
      };
      this.candidateResolver = new GrafanaSourceResolver(bound.revision, bound.frames);
      const result = await this.controller.update(compiled);
      return result;
    });
  }
  invalidate(): void {
    this.gate.invalidate();
    this.controller.invalidate();
  }
  dispose(): void {
    this.gate.dispose();
    this.controller.dispose();
  }
}
