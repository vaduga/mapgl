import type { Color, PickingInfo } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';
import type { PanelController } from '../runtime/PanelController';
import type { EffectiveRenderState } from '../runtime/GraphScene';
import type { GraphFrameSnapshot } from '../graph/frame/types';
import { getGraphNsLabel, type Graph, type Node, type Edge } from '../graph/main';
import { getEdgesGeometry, type EdgeGeometryInput, type PreparedEdgeGeometry } from '../graph/utils/utils.graph-geom';
import {
  getNamespaceBoundaries,
  type NamespaceBoundaryRecord,
  type NamespaceBoundaryProvider,
} from '../extension-points/featureContracts';
import type { VisLayers } from '../store/VisLayers';
import type { SelectedIndexes } from '../store/PointStore';
import { colTypes, type GraphBiFeatCol, type LayerDragShift } from '../types';
import { BBOX_OUTLINE_COLOR, BBOX_OUTLINE_WIDTH } from '../types/defaults';
import { isVisible, toRGB4Array } from '../deckLayers/utils';
import {
  NodesGeojsonLayer,
  PlaceholderTextLayer,
  MainLabelTextLayer,
} from '../deckLayers/GeoJsonNodesLayer/nodes-geojson-layer';
import { EdgesGeojsonLayer } from '../deckLayers/GeoJsonEdgesLayer/edges-geojson-layer';
import { EdgeArrowLayer } from '../deckLayers/ArrowLayer/edge-arrow-layer';
import { MyArcLayer } from '../deckLayers/ArcLayer/arc-layer';
import { LineTextLayer } from '../deckLayers/TextLayer/text-layer';
import { MyIconLayer } from '../deckLayers/IconLayer/icon-layer';
import type { SvgIconRenderState } from '../utils/SvgIconManager';
import { buildGraphBinaryCollections } from './renderData';
import type { RenderLayer, RenderLayerBundle } from './layers';

export interface RenderPresentation {
  readonly isLogic: boolean;
  readonly graphVisibilityName?: string | null;
  readonly isRouted?: boolean;
  readonly isMeters?: boolean;
  readonly isDark?: boolean;
  readonly textColor?: string;
  readonly pointType?: string;
  readonly nodeVisibilityName?: string;
  readonly nodeIdSuffix?: string;
  readonly placeholders?: boolean;
  readonly labels?: boolean;
  readonly labelsInNodes?: boolean;
  readonly bounds?: boolean;
  readonly boundLabels?: boolean;
  readonly showAnnotations?: boolean;
  readonly overlayEnabled?: boolean;
  readonly pickable?: boolean;
  readonly labelPickable?: boolean;
  readonly autoHighlight?: boolean;
  readonly highlightColor?: Color;
  readonly onHover?: (info: PickingInfo) => void;
  readonly svgIconState?: SvgIconRenderState;
  readonly onSvgIconReady?: () => void;
  readonly resourceRevision?: number;
}

export interface CapturedRenderInput {
  readonly generation: number;
  readonly revision: number;
  readonly snapshot?: GraphFrameSnapshot;
  readonly render: EffectiveRenderState;
  readonly sourceEdgeIndex: EffectiveRenderState['edgeIndex'];
  readonly edgeIndexRevision: number;
  readonly graphs: readonly Graph[];
  readonly visibility: VisLayers;
  readonly layerShift: LayerDragShift;
  readonly projection: EdgeGeometryInput['projection'];
  readonly ready: boolean;
  readonly displayReady: boolean;
  readonly layoutIncludesProjection: boolean;
  readonly presentation: RenderPresentation & { readonly isRouted: boolean };
  readonly selectedNode: Node | null;
  readonly selectedIndexes: SelectedIndexes;
  readonly selectedEdges: readonly Edge[];
}

export interface RenderPreparationOptions {
  readonly edgeOffsetStrategies?: EdgeGeometryInput['edgeOffsetStrategies'];
  readonly terminalGeometryStrategies?: EdgeGeometryInput['terminalGeometryStrategies'];
  readonly resolveRoute?: EdgeGeometryInput['resolveRoute'];
  readonly boundaryProviders?: readonly NamespaceBoundaryProvider[];
  readonly boundaries?: readonly NamespaceBoundaryRecord[];
  readonly includeRootBounds?: boolean;
  readonly applyBoundaryShift?: boolean;
}

export function captureRenderInput(controller: PanelController, presentation: RenderPresentation): CapturedRenderInput {
  const scene = controller.scene;
  const render = scene.render;
  const visibility = scene.visibility.snapshot();
  return {
    generation: scene.version,
    revision: scene.renderRevision,
    snapshot: scene.baseline?.snapshot,
    render: { ...render, edgeIndex: render.edgeIndex.snapshot() },
    sourceEdgeIndex: render.edgeIndex,
    edgeIndexRevision: render.edgeIndex.revision,
    graphs: [render.graph, ...render.graph.subgraphsBreadthFirst()] as Graph[],
    visibility,
    layerShift: { ...scene.layerShift },
    projection: scene.projection,
    ready: scene.ready,
    displayReady: scene.displayReady,
    layoutIncludesProjection: scene.layoutIncludesProjection,
    presentation: {
      ...presentation,
      isRouted: presentation.isRouted ?? visibility.getVisState(null, colTypes.Routed, colTypes.Routed)[0],
    },
    selectedNode: controller.stores.pointStore.getSelectedNode,
    selectedIndexes: controller.stores.pointStore.selectedIndexes(),
    selectedEdges: [...controller.stores.pointStore.getSelEdges],
  };
}

export interface BoundaryFeature {
  type: 'Polygon';
  properties: { id: string; locName: string; namespaceLabel: string; graph: Graph };
  geometry: { type: 'Polygon'; coordinates: number[][][]; center: number[] };
}
export interface BoundaryCollection {
  type: 'FeatureCollection';
  features: BoundaryFeature[];
}

export function createBoundaryCollection(
  input: CapturedRenderInput,
  boundaries: readonly NamespaceBoundaryRecord[]
): BoundaryCollection {
  const graphs = new Map(input.graphs.slice(1).map((graph) => [graph.id, graph]));
  return {
    type: 'FeatureCollection',
    features: boundaries.flatMap((boundary) => {
      const graph = graphs.get(boundary.namespace);
      if (!graph) {
        return [];
      }
      const [minX, minY, maxX, maxY] = boundary.bounds;
      return [
        {
          type: 'Polygon' as const,
          properties: { id: graph.id, locName: graph.id, namespaceLabel: getGraphNsLabel(graph) ?? graph.id, graph },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [minX, minY],
                [maxX, minY],
                [maxX, maxY],
                [minX, maxY],
                [minX, minY],
              ],
            ],
            center: [(minX + maxX) / 2, (minY + maxY) / 2],
          },
        },
      ];
    }),
  };
}

export interface PreparedGraphRender {
  readonly collections: GraphBiFeatCol[];
  readonly geometry: PreparedEdgeGeometry;
  readonly bounds: BoundaryCollection;
  readonly comments: readonly unknown[];
  readonly namespaceBoundaries?: readonly NamespaceBoundaryRecord[];
}

export function prepareGraphRender(
  input: CapturedRenderInput,
  options: RenderPreparationOptions = {}
): PreparedGraphRender {
  const { render, presentation: p, visibility } = input;
  const hidden = p.isLogic && !input.ready && !input.displayReady;
  const geometry = hidden
    ? { routed: {}, arcs: {}, mappings: [] }
    : getEdgesGeometry({
        graph: render.graph,
        edgeIndex: render.edgeIndex,
        positions: render.positions,
        isLogic: p.isLogic,
        visibleNamespaces: visibility.getVisibleNamespaces(),
        layerShift: input.layerShift,
        projection: input.projection,
        layout: render,
        layoutReady: input.ready || input.displayReady,
        layoutIncludesProjection: input.layoutIncludesProjection,
        snapshot: input.snapshot,
        edgeOffsetStrategies: options.edgeOffsetStrategies ?? [],
        terminalGeometryStrategies: options.terminalGeometryStrategies ?? [],
        resolveRoute: options.resolveRoute,
      });
  const boundaries =
    p.bounds && p.isLogic && input.ready
      ? (options.boundaries ??
        getNamespaceBoundaries([...(options.boundaryProviders ?? [])], {
          graph: render.graph,
          positions: render.positions,
          visibleNamespaces: new Set(visibility.getVisibleNamespaces()),
          layoutGraphBounds: render.graphBounds,
          layerShift: input.layerShift,
          includeRoot: options.includeRootBounds,
          applyLayerShift: options.applyBoundaryShift,
        }))
      : [];
  return {
    geometry,
    bounds: createBoundaryCollection(input, boundaries),
    namespaceBoundaries: boundaries,
    comments: hidden ? [] : (render.commentFeatures ?? []),
    collections: buildGraphBinaryCollections({
      graphs: input.graphs,
      visibleNamespaces: visibility.getVisibleNamespaces(),
      ...render,
      showAnnotations: p.showAnnotations ?? false,
      hide: hidden,
    }),
  };
}

export interface PrimaryLayerProps {
  readonly isLogic: boolean;
  readonly isRouted: boolean;
  readonly isMeters: boolean;
  readonly isDark: boolean;
  readonly textColor?: string;
  readonly pickable?: boolean;
  readonly autoHighlight?: boolean;
  readonly highlightColor?: Color;
  readonly onHover?: RenderPresentation['onHover'];
  readonly svgIconState?: SvgIconRenderState;
  readonly onSvgIconReady?: () => void;
  readonly resourceRevision?: number;
  readonly presentationRevision: number;
  readonly overlayEnabled?: boolean;
  readonly getSelectedNode: Node | null;
  readonly getSelectedIdxs: SelectedIndexes;
  readonly getVisLayers: VisLayers;
  readonly usesRendererNamespaceFiltering: boolean;
  readonly layerShift: LayerDragShift;
  readonly edgeIndex: EffectiveRenderState['edgeIndex'];
  readonly layoutGeometry: Pick<EffectiveRenderState, 'curveGroups' | 'edgeKeys' | 'edgeIndexes'> & {
    edgeOffsetStrategies: EdgeGeometryInput['edgeOffsetStrategies'];
  };
}

export type LayerFactoryResult = RenderLayer | readonly RenderLayer[] | null | undefined;
export interface PrimaryFactories {
  readonly node?: (
    props: PrimaryLayerProps & { biCol: GraphBiFeatCol; visible: boolean; pointTypeOverride?: string; idSuffix: string }
  ) => LayerFactoryResult;
  readonly edge?: (
    props: PrimaryLayerProps & {
      srcGraphId: string;
      linesCollection: { type: 'FeatureCollection'; features: PreparedEdgeGeometry['routed'][string] };
      visible: boolean;
    }
  ) => LayerFactoryResult;
  readonly bounds?: (
    props: PrimaryLayerProps & { rects: BoundaryCollection; biCols: GraphBiFeatCol[]; id: string }
  ) => LayerFactoryResult;
}
export const normalizeLayers = (result: LayerFactoryResult): RenderLayer[] =>
  result ? (Array.isArray(result) ? [...result] : [result as RenderLayer]) : [];

export function buildPrimaryLayers(
  input: CapturedRenderInput,
  prepared: PreparedGraphRender,
  {
    factories = {},
    contributions = {},
    edgeOffsetStrategies = [],
    presentationRevision = 0,
  }: {
    factories?: PrimaryFactories;
    contributions?: RenderLayerBundle;
    edgeOffsetStrategies?: EdgeGeometryInput['edgeOffsetStrategies'];
    presentationRevision?: number;
  } = {}
): RenderLayerBundle {
  const p = input.presentation;
  const selectedIndexes = new Map(input.selectedIndexes);
  const selectedEdges: Record<string, number[]> = {};
  for (const edge of input.selectedEdges) {
    const ref = input.render.edgeIndex.getEdgeRef(edge);
    if (ref === undefined) {
      continue;
    }
    const record = input.render.edgeIndex.getEdgeRecordRef(ref);
    const [start, end] = input.render.edgeIndex.getRecordRange(record);
    for (let edgeRef = start; edgeRef < end; edgeRef++) {
      const mapping = prepared.geometry.mappings[edgeRef];
      if (mapping?.lineId !== undefined) {
        (selectedEdges[mapping.graphId] ??= []).push(mapping.lineId);
      }
    }
  }
  selectedIndexes.set(colTypes.Edges, selectedEdges);
  const boundIndex = prepared.bounds.features.findIndex((f) => f.properties.id === input.selectedNode?.id);
  if (boundIndex >= 0) {
    selectedIndexes.set(colTypes.Bboxes, [boundIndex]);
  }
  const common: PrimaryLayerProps = {
    ...p,
    isDark: p.isDark ?? false,
    isMeters: p.isMeters ?? false,
    getSelectedNode: input.selectedNode,
    getSelectedIdxs: selectedIndexes,
    getVisLayers: input.visibility,
    presentationRevision,
    usesRendererNamespaceFiltering: input.projection?.rendererFiltering !== 'none',
    layerShift: input.layerShift,
    edgeIndex: input.render.edgeIndex,
    layoutGeometry: {
      curveGroups: input.render.curveGroups,
      edgeKeys: input.render.edgeKeys,
      edgeIndexes: input.render.edgeIndexes,
      edgeOffsetStrategies,
    },
  };
  const bundle: RenderLayerBundle = { nodes: [], bounds: [], edges: [], baseEdges: [], labels: [] };
  const nodes: RenderLayer[] = [],
    labels: RenderLayer[] = [],
    edges: RenderLayer[] = [],
    baseEdges: RenderLayer[] = [],
    bounds: RenderLayer[] = [];
  for (const biCol of prepared.collections) {
    const props = {
      ...common,
      biCol,
      visible:
        isVisible(input.visibility, { index: null, name: biCol.graph.id, group: 'graph' }) &&
        (!p.nodeVisibilityName ||
          isVisible(input.visibility, { index: null, name: p.nodeVisibilityName, group: p.nodeVisibilityName })),
      pointTypeOverride: p.pointType,
      idSuffix: p.nodeIdSuffix ?? '',
    };
    nodes.push(...normalizeLayers((factories.node ?? NodesGeojsonLayer)(props)));
    if (p.placeholders) {
      nodes.push(PlaceholderTextLayer(props));
    }
    if (p.labels) {
      (p.labelsInNodes ? nodes : labels).push(
        MainLabelTextLayer({
          ...props,
          visible: isVisible(input.visibility, { index: null, name: biCol.graph.id, group: 'graph' }),
          pickable: p.labelPickable ?? p.pickable,
        })
      );
    }
  }
  const showGraph =
    p.graphVisibilityName === null ||
    isVisible(input.visibility, { index: null, name: p.graphVisibilityName ?? 'graph', group: 'graph' });
  const visible =
    showGraph && isVisible(input.visibility, { index: null, name: colTypes.Edges, group: colTypes.Edges });
  const geometry = p.isRouted ? prepared.geometry.routed : prepared.geometry.arcs;
  for (const [srcGraphId, features] of Object.entries(geometry)) {
    if (!features.length) {
      continue;
    }
    if (p.isRouted) {
      const props = {
        ...common,
        srcGraphId,
        visible,
        linesCollection: { type: 'FeatureCollection' as const, features },
      };
      edges.push(...normalizeLayers((factories.edge ?? EdgesGeojsonLayer)(props)), EdgeArrowLayer(props));
    } else {
      const props = { ...common, srcGraphId, visible, lineFeatures: features };
      edges.push(MyArcLayer(props));
      baseEdges.push(MyArcLayer({ ...props, isBase: true }));
      labels.push(LineTextLayer({ ...common, id: srcGraphId, data: features, visible, type: 'arcLabels' }));
    }
  }
  if (p.bounds && prepared.bounds.features.length) {
    const props = { ...common, id: 'bbox-polygons', rects: prepared.bounds, biCols: prepared.collections };
    bounds.push(
      ...normalizeLayers(
        factories.bounds
          ? factories.bounds(props)
          : new GeoJsonLayer({
              id: props.id,
              data: prepared.bounds as any,
              pickable: false,
              filled: false,
              stroked: true,
              getLineColor: toRGB4Array(BBOX_OUTLINE_COLOR),
              getLineWidth: BBOX_OUTLINE_WIDTH,
              lineWidthUnits: 'pixels',
            })
      )
    );
    if (p.boundLabels) {
      for (const feature of prepared.bounds.features) {
        const [[minX, minY], [maxX], [, maxY]] = feature.geometry.coordinates[0];
        bounds.push(
          LineTextLayer({
            ...common,
            id: 'bbox-' + feature.properties.id,
            data: [{ text: feature.properties.namespaceLabel, coordinates: [(minX + maxX) / 2, Math.max(minY, maxY)] }],
            visible: true,
            type: 'bbox',
          })
        );
      }
    }
  }
  return {
    ...bundle,
    nodes,
    labels,
    edges,
    baseEdges,
    bounds,
    ...(prepared.comments.length && p.isRouted
      ? { comments: MyIconLayer({ ...common, showGraph, data: prepared.comments }) }
      : {}),
    ...contributions,
  };
}
