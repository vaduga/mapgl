import type { Rule } from '../../style/groups/ruleTypes';
interface GraphLayoutConfig {
  readonly config?: unknown;
}
import type { BiColProps, CommentsData, ComFeature } from '../../types';
import type { FeatSource, Graph, GraphEdgeIndex } from '../main';
import {
  type GraphLayoutRequestInput,
  type GraphLayoutWorkerResult,
  type AutolayoutOptions,
  type LayoutArrowTips,
} from '../utils/layout-worker-client';
import type { LayoutCurveGroup, LayoutGraphResult } from '../utils/layout-worker-types';
import type { GraphPipelineLayoutContext, GraphPipelineRenderContext, GraphPipelineState } from './pipeline';
import type { GraphFrameSnapshot, GraphVisualState } from './types';
import { PACKED_INVALID_REF } from './packedRelations';
import { applyGraphVisualState } from './visualState';

export interface GraphPanelLayoutState {
  readonly positions: Float64Array;
  readonly graphBounds: ReadonlyMap<string, LayoutGraphResult>;
  readonly curveGroups: ReadonlyMap<string, LayoutCurveGroup>;
  readonly edgeIndexes: ReadonlyMap<string, number>;
  readonly edgeKeys: readonly string[];
  readonly arrowTips: ReadonlyMap<string, LayoutArrowTips>;
}

export interface GraphPanelRenderState extends GraphPanelLayoutState {
  readonly graph: Graph;
  readonly edgeIndex: GraphEdgeIndex;
  readonly features: readonly BiColProps[];
  readonly colors: Uint8Array;
  readonly muted: Uint8Array;
  readonly annotations: Uint8Array;
  readonly groupIndices: Uint8Array;
  readonly groups: readonly Rule[];
  readonly commentFeatures: readonly ComFeature[];
  readonly featureSources: readonly FeatSource[];
}

export type GraphPanelPipelineState = GraphPipelineState<GraphPanelLayoutState, GraphPanelRenderState>;

function unchangedLayoutState(positions: Float64Array): GraphPanelLayoutState {
  return Object.freeze({
    positions,
    graphBounds: new Map(),
    curveGroups: new Map(),
    edgeIndexes: new Map(),
    edgeKeys: Object.freeze([]),
    arrowTips: new Map(),
  });
}

export async function resolveGraphPanelLayout(
  context: GraphPipelineLayoutContext,
  basemap: GraphLayoutConfig | undefined,
  requestLayout: (input: GraphLayoutRequestInput) => Promise<GraphLayoutWorkerResult | undefined>
): Promise<GraphPanelLayoutState> {
  applyGraphVisualState(context.graph, context.visual);

  if (!context.input.layers[0].options.isLogic) {
    return unchangedLayoutState(context.graph.positions);
  }

  const result = await requestLayout({
    graph: context.graph.graph,
    positionsLength: context.graph.positions.length,
    autolayout: basemap?.config as AutolayoutOptions | undefined,
  });
  return result ?? unchangedLayoutState(context.graph.positions);
}

export function createGraphPanelRenderState(
  context: GraphPipelineRenderContext<GraphPanelLayoutState>
): GraphPanelRenderState {
  const commentFeatures = context.input.layers[0].options.isLogic
    ? []
    : createCommentFeatures({
        mode: 'frame',
        snapshot: context.snapshot,
        visual: context.visual,
        edgeIndex: context.graph.edgeIndex,
        resolveColor: context.input.resolveColor,
      });

  return Object.freeze({
    graph: context.graph.graph,
    edgeIndex: context.graph.edgeIndex,
    positions: context.layout.state.positions,
    graphBounds: context.layout.state.graphBounds,
    curveGroups: context.layout.state.curveGroups,
    edgeIndexes: context.layout.state.edgeIndexes,
    edgeKeys: context.layout.state.edgeKeys,
    arrowTips: context.layout.state.arrowTips,
    features: context.visual.features,
    colors: context.visual.colors,
    muted: context.visual.muted,
    annotations: context.visual.annotations,
    groupIndices: context.visual.groupIndices,
    groups: context.visual.groups,
    commentFeatures,
    featureSources: context.visual.featureSources,
  });
}

export function createGraphLayoutSignature(basemap?: GraphLayoutConfig): string {
  const config = basemap?.config as
    | {
        edgeRouting?: unknown;
        layoutDirection?: unknown;
        layerSeparation?: unknown;
        nodeSeparation?: unknown;
      }
    | undefined;
  return JSON.stringify({
    edgeRouting: config?.edgeRouting ?? null,
    layoutDirection: config?.layoutDirection ?? null,
    layerSeparation: config?.layerSeparation ?? null,
    nodeSeparation: config?.nodeSeparation ?? null,
  });
}

export function createGraphViewportFitSignature(
  snapshot: GraphFrameSnapshot,
  isLogic: boolean,
  basemap?: GraphLayoutConfig
): string {
  return JSON.stringify([
    isLogic,
    snapshot.topologySignature,
    isLogic ? null : snapshot.geometrySignature,
    isLogic ? createGraphLayoutSignature(basemap) : null,
  ]);
}

type CommentFeatureInput =
  | {
      mode: 'frame';
      snapshot: GraphFrameSnapshot;
      visual: GraphVisualState;
      edgeIndex: GraphEdgeIndex;
      resolveColor?: (name: string) => string;
    }
  | {
      mode: 'live';
      graphs: readonly Graph[];
      getComments: (graph: Graph) => CommentsData;
    };

export function createCommentFeatures(input: CommentFeatureInput): ComFeature[] {
  const features: ComFeature[] = [];
  let featureId = 0;

  const append = (value: {
    edgeId: string;
    commentEdgeId: string;
    text: string;
    layerName?: string;
    graph: Graph;
    locName?: string;
    index: number;
    iconColor: string;
    style: unknown;
    coords: number[];
  }) => {
    features.push({
      type: 'Feature',
      id: featureId++,
      edgeId: value.edgeId,
      comId: [value.commentEdgeId, value.index].join('|'),
      geometry: { type: 'Point', coordinates: value.coords },
      properties: {
        text: value.text,
        layerName: value.layerName ?? '',
        graph: value.graph,
        isComment: true,
        locName: value.locName ?? '',
        index: value.index,
        iconColor: value.iconColor,
        style: value.style,
      },
    });
  };

  if (input.mode === 'frame') {
    for (let edgeIndexValue = 0; edgeIndexValue < input.snapshot.relations.recordCount; edgeIndexValue++) {
      const primaryUnitRef = input.visual.edgePrimaryUnitRefs[edgeIndexValue];
      const visual = primaryUnitRef === PACKED_INVALID_REF ? undefined : input.visual.edgeUnits[primaryUnitRef];
      const edge = input.edgeIndex.getFirstRecordEdge(edgeIndexValue);
      const graph = visual?.feature.graph;
      if (!visual || !graph || !edge) {
        continue;
      }
      const cursor = input.snapshot.relations.createRouteCursor().resetToRecord(edgeIndexValue);
      while (cursor.moveNext()) {
        const coordinateRef = cursor.coordinateRef;
        if (coordinateRef === undefined) {
          continue;
        }
        const annotationRef = input.snapshot.relations.getCoordinateAnnotationRef(coordinateRef);
        if (annotationRef === undefined) {
          continue;
        }
        const text = input.snapshot.relations.getAnnotationText(annotationRef);
        if (!text.length) {
          continue;
        }
        const iconColor = input.snapshot.relations.getAnnotationColor(annotationRef);
        append({
          edgeId: edge.id,
          commentEdgeId: edge.id,
          text,
          layerName: visual.feature.layerName,
          graph,
          locName: visual.feature.locName,
          index: cursor.itemIndex,
          iconColor: typeof iconColor === 'string' ? (input.resolveColor?.(iconColor) ?? '#4ec2fc') : '#4ec2fc',
          style: visual.feature.style,
          coords: [
            input.snapshot.relations.getCoordinateLongitude(coordinateRef),
            input.snapshot.relations.getCoordinateLatitude(coordinateRef),
          ],
        });
      }
    }
    return features;
  }

  input.graphs.forEach((graph) => {
    Object.entries(input.getComments(graph)).forEach(([edgeId, orderMap]) => {
      orderMap?.forEach((comment) => {
        const { edge, text, iconColor, style, layerName, locName, coords, index } = comment;
        if (!edge || !text || !iconColor || !coords) {
          return;
        }
        append({
          edgeId: edge.id,
          commentEdgeId: edgeId,
          text,
          layerName,
          graph,
          locName,
          index,
          iconColor,
          style,
          coords,
        });
      });
    });
  });

  return features;
}
