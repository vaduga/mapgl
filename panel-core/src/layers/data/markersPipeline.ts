import type { GrafanaTheme2, PanelData } from '@grafana/data';

import type { GraphPipelineInput, GraphPipelineLayerInput } from '../../graph/frame';
import type { StyleConfig } from '../../style/types';
import { CMN_NAMESPACE, MOC_LOC_FIELD } from '../../types/defaults';
import {
  defaultMarkersOptional,
  defaultMarkersOptions,
  type MarkersConfig,
  type MarkersLayerOptions,
} from './markersDefaults';
import { mockEdgeGraphData, mockTextConfig } from './mockData';

export interface MarkersPipelineOptions {
  readonly data: PanelData;
  readonly layer: MarkersLayerOptions<Partial<MarkersConfig>>;
  readonly theme: GrafanaTheme2;
  readonly isLogic: boolean;
  readonly useMockData: boolean;
  readonly layoutSignature?: string;
  readonly layerIndex?: number;
  readonly groupIndexOffset?: number;
}

export interface MarkersLayersPipelineOptions extends Omit<MarkersPipelineOptions, 'layer' | 'layerIndex'> {
  readonly layers: ReadonlyArray<{
    readonly layer: MarkersLayerOptions<Partial<MarkersConfig>>;
    readonly layerIndex: number;
  }>;
}

export const mergeMarkersStyleConfig = (defaults: StyleConfig, configured?: StyleConfig): StyleConfig => ({
  ...defaults,
  ...configured,
  size: { ...defaults.size, ...configured?.size } as StyleConfig['size'],
  color: { ...defaults.color, ...configured?.color } as StyleConfig['color'],
  textConfig: { ...defaults.textConfig, ...configured?.textConfig },
});

type LegacyMarkersIdentityConfig = {
  isNestEdges?: boolean;
  vertexA_NS?: string;
  vertexB_NS?: string;
  nsSeparator?: string;
};

export function resolveMarkersConfig(configured?: Partial<MarkersConfig>, useMockData = false): MarkersConfig {
  return {
    ...defaultMarkersOptions,
    ...configured,
    style: mergeMarkersStyleConfig(defaultMarkersOptions.style, {
      ...configured?.style,
      ...(useMockData && {
        text: mockTextConfig,
      }),
    }),
    edgeStyle: mergeMarkersStyleConfig(defaultMarkersOptions.edgeStyle, {
      ...configured?.edgeStyle,
      ...(useMockData &&
        configured?.edgeStyle?.arrow === undefined && {
          arrow: 1,
        }),
    }),
    arcStyle: {
      sideA: mergeMarkersStyleConfig(defaultMarkersOptions.arcStyle.sideA, configured?.arcStyle?.sideA),
      sideB: mergeMarkersStyleConfig(defaultMarkersOptions.arcStyle.sideB, configured?.arcStyle?.sideB),
    },
    arcConfig: {
      ...defaultMarkersOptions.arcConfig,
      ...configured?.arcConfig,
      capacity: {
        ...defaultMarkersOptions.arcConfig.capacity,
        ...configured?.arcConfig?.capacity,
      },
    },
  };
}

export function getMarkersPipelineData(data: PanelData, useMockData: boolean): PanelData {
  return useMockData ? { ...data, series: [mockEdgeGraphData] } : data;
}

export function createMarkersPipelineInput(options: MarkersPipelineOptions): GraphPipelineInput {
  const data = getMarkersPipelineData(options.data, options.useMockData);
  const config = resolveMarkersConfig(options.layer.config, options.useMockData);
  const legacyIdentity = options.layer.config as (Partial<MarkersConfig> & LegacyMarkersIdentityConfig) | undefined;
  const legacyEdgeIdField = typeof options.layer.edgeIdField === 'string' ? options.layer.edgeIdField : undefined;
  const optional = {
    ...defaultMarkersOptional,
    ...options.layer.optional,
    edgeId: options.layer.optional?.edgeId ?? legacyEdgeIdField,
    wrapEdges: options.layer.optional?.wrapEdges ?? options.layer.isWrapEdges,
    isNestEdges:
      options.layer.optional?.isNestEdges ?? options.layer.isNestEdges ?? legacyIdentity?.isNestEdges,
    vertexA_NS: options.layer.optional?.vertexA_NS ?? legacyIdentity?.vertexA_NS,
    vertexB_NS: options.layer.optional?.vertexB_NS ?? legacyIdentity?.vertexB_NS,
    nsSeparator:
      options.layer.optional?.nsSeparator ?? legacyIdentity?.nsSeparator ?? defaultMarkersOptional.nsSeparator,
  };
  const nodeIdField = options.layer.locField ?? MOC_LOC_FIELD;

  return {
    data,
    options: {
      layerName: options.layer.name,
      query: options.layer.query,
      nodeIdField,
      targetField: options.useMockData ? 'target' : options.layer.parField,
      edgeIdField: options.useMockData ? 'edgeId' : optional.edgeId,
      // Namespace fields are a graph-mode feature. Geo mode has one shared
      // namespace so stale saved panel config cannot split geographic nodes.
      sourceNamespaceField: options.isLogic ? optional.vertexA_NS : undefined,
      targetNamespaceField: options.isLogic ? optional.vertexB_NS : undefined,
      namespaceSeparator:
        options.isLogic && (optional.vertexA_NS || optional.vertexB_NS)
          ? optional.nsSeparator
          : undefined,
      location: options.layer.location,
      defaultNamespace: CMN_NAMESPACE,
      isLogic: options.isLogic,
      layoutSignature: options.layoutSignature,
    },
    graphOptions: {
      layerIndex: options.layerIndex,
      wrap: (optional.wrapEdges ?? 0) as number,
      nest: (optional.isNestEdges ?? false) as boolean,
    },
    visualConfig: {
      layerName: options.layer.name,
      layerIndex: options.layerIndex,
      locationField: nodeIdField,
      isLogic: options.isLogic,
      style: config.style,
      edgeStyle: config.edgeStyle,
      arcStyle: config.arcStyle,
      arcConfig: config.arcConfig,
      groups: config.style.useGroups ? config.groups : undefined,
      groupIndexOffset: options.groupIndexOffset,
      showStat2: config.showStat2,
    },
    theme: options.theme,
  };
}

export function createMarkersLayersPipelineInput(options: MarkersLayersPipelineOptions): GraphPipelineInput {
  if (!options.layers.length) {
    throw new Error('At least one markers layer is required');
  }

  let groupIndexOffset = options.groupIndexOffset ?? 0;
  const inputs = options.layers.map(({ layer, layerIndex }) => {
    const config = resolveMarkersConfig(layer.config, options.useMockData);
    const input = createMarkersPipelineInput({
      ...options,
      layer,
      layerIndex,
      groupIndexOffset,
    });
    if (config.style.useGroups) {
      groupIndexOffset += config.groups?.length ?? 0;
    }
    return input;
  });
  const first = inputs[0];
  const layers: readonly GraphPipelineLayerInput[] = Object.freeze(
    inputs.map(({ options: layerOptions, graphOptions, visualConfig }) =>
      Object.freeze({
        options: layerOptions,
        graphOptions,
        visualConfig,
      })
    )
  );

  return {
    ...first,
    layers,
  };
}
