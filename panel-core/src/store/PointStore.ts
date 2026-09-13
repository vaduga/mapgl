import { makeAutoObservable } from 'mobx';
import type { RootStore } from './RootStore';
import { blankHoverInfo, FIXED_COLOR_LABEL } from '@mapgl/panel-core/types/defaults';
import {
  BiColProps,
  colTypes,
  QueryHost,
  type Info,
  type MapLayerState,
  type ViewState,
} from '@mapgl/panel-core/types';
import type { MarkersConfig } from '@mapgl/panel-core/layers/data';
import { Edge, findEdge, getGraphData, getNodeData, Graph, Node } from '@mapgl/panel-core/graph';
import { inheritedShift } from '@mapgl/panel-core/graph/utils';
import { DataFrame, dateTime } from '@grafana/data';
import { findField } from '@mapgl/panel-core/grafana_core/app/features/dimensions';
import { getStyleDimension } from '@mapgl/panel-core/utils/geomap_utils';
import { getStyleConfigState } from '@mapgl/panel-core/style/utils';

import { toRGB4Array } from '@mapgl/panel-core/deckLayers/utils';
import { SelectNodeEvent } from '@mapgl/panel-core/utils';
import type { Unsubscribable } from 'rxjs';
import type { DeckGLRefWithViewManager } from '@mapgl/panel-core/types';
import { GraphHighlighter } from '../deckLayers/GraphHighlighter';
import { resolveFeatureGroup } from '@mapgl/panel-core/editor';
import { resolvePanelGraphInteraction, syncGraphEdgeGroupOverrides } from '@mapgl/panel-core/graph/frame';

export interface PointStoreHooks {
  editable?: boolean;
  allowUnindexedEdges?: boolean;
  findEdge?: (graph: Graph, id: string) => Edge | undefined;
  selectionView?: (view: ViewState, graphId?: string) => ViewState;
  ignorePickingInfo?: (info: any) => boolean;
  onLiveHostUpdate?: (store: PointStore, update: any, isCurrent: () => boolean) => Promise<boolean>;
}

export class PointStore {
  root: RootStore;
  mode: 'modify' | 'view' = 'view';
  editable = false;
  isDrawerOpen = false;
  isEdgeListed = false;
  isReversed = false; /// node->edges paths direction reversed
  selectedNode: Node | undefined | null = undefined;
  isShowCenter: ViewState | undefined = undefined;
  selEdges: Edge[] = [];
  focusedNodeId: string | null = null;
  focusedNodeGraphId: string | null = null;
  focusedEdgeId: string | null = null;
  focusedEdgeGraphId: string | null = null;
  focusedEdges: Edge[] = [];
  focusRevision = 0;
  graphHighlighter = new GraphHighlighter();
  commentOpenIdx = -1;
  selCoord:
    | {
        coordinates: [number, number];
        type: 'Point';
      }
    | undefined = undefined;
  log: QueryHost[] = [];

  tooltipObject: Info = blankHoverInfo;
  logTooltipObject: Info = blankHoverInfo;
  private eventSub?: Unsubscribable;
  private subscribedEventBus?: RootStore['eventBus'];
  private subscribe: () => Unsubscribable;
  private disposed = false;
  private liveUpdates = new Map<string, number>();

  constructor(
    root: RootStore,
    private readonly hooks: PointStoreHooks = {}
  ) {
    this.root = root;
    const { panel, graph } = this.root;
    this.editable = hooks.editable ?? false;
    const replaceVariables = root.replaceVariables;
    const nodeId = replaceVariables('$nodeId');
    //const edgeId = replaceVariables('$edgeId');
    this.graphHighlighter.setGraph(graph, { edgeIndex: panel.graphEdgeIndex });
    let node, edge;
    if (nodeId !== '$nodeId') {
      node = this.root.graph.findNodeRecursive(nodeId);
    }
    // if (node && edgeId !== '$edgeId') {
    // for (const el of graph.deepEdges) {
    //   if (el.id === edgeId) {
    //     edge = el;
    //     //break;
    //   }
    // }
    if (node) {
      this.setSelectedNode(node, edge ? [edge] : []);
    }
    //}

    this.subscribe = () =>
      this.root.eventBus.subscribe(SelectNodeEvent, (evt) => {
        if (this.root.pId !== evt.payload.pId) {
          return;
        } //  && !isLogic  . logic layer crosshair selection

        const graph = this.root.graph;
        const isLogic = this.root.panel.isLogic;
        const { nodeId, edge: payloadEdge, edgeId, graphId, fly, coord, select, zoomIn } = evt.payload;

        let wasmId;
        if (nodeId || payloadEdge || edgeId || select) {
          let node;
          let edge = payloadEdge;
          let subGraph = graphId && Array.from(graph.graphs()).find((el) => el.id === graphId);
          if (subGraph) {
            node = (nodeId && subGraph.findNode(nodeId)) ?? subGraph;
            edge =
              edge ?? (edgeId ? (this.hooks.findEdge?.(subGraph, edgeId) ?? findEdge(subGraph, edgeId)) : undefined);
          } else {
            node = nodeId && graph.findNodeRecursive(nodeId);
            if (!edge && edgeId) {
              for (const el of graph.deepEdges) {
                if (el.id === edgeId) {
                  edge = el;
                  break;
                }
              }
            }
          }

          if (select || edge) {
            this.setSelectedNode(node ? node : undefined, edge ? [edge] : []);
          }
          wasmId = node && !(node instanceof Graph) ? getNodeData(node)?.wasmId : undefined;
        }

        if (wasmId !== undefined || coord) {
          const pos = panel.positions;
          const lng = pos[wasmId * 2];
          const lat = pos[wasmId * 2 + 1];

          const coordsFromValue = [lng, lat];

          if (coord || (lng && lat)) {
            const map = this.root.map;

            const longitude = coord ? coord[0] : coordsFromValue[0];
            const latitude = coord ? coord[1] : coordsFromValue[1];
            const scene = (map as DeckGLRefWithViewManager)?.deck?.viewManager.viewState[
              isLogic ? '3d-scene' : 'geo-view'
            ];
            const mapZoom = zoomIn ? (isLogic ? 1.5 : 18) : scene?.zoom;
            const zoom = isNaN(mapZoom) ? 2 : (mapZoom ?? 18);

            const initialViewState = {
              longitude,
              latitude,
              transitionDuration: 250,

              // bearing: 0,
              // pitch: 0,
              rotationX: -90,
              zoom,
              yZoom: zoom + 1,
              target: [longitude, latitude, isLogic ? 0 : zoom],
            };
            const viewState = this.hooks.selectionView?.(initialViewState, graphId) ?? initialViewState;
            if (select) {
              this.setSelCoord({
                type: 'Point',
                coordinates: [viewState.longitude, viewState.latitude],
              });
            }
            if (fly) {
              this.root.viewStore.setViewState(viewState);
              this.setIsShowCenter({ ...viewState });
            }
            this.setIsShowCenter({ ...viewState });
          }
        }
      });

    makeAutoObservable(this, {
      root: false,
      hooks: false,
      subscribe: false,
      eventSub: false,
      subscribedEventBus: false,
      liveUpdates: false,
    } as any);
    //autorun(() => console.log('getSelelectedNode', this.getSelectedNode))//, toJS(this.getSelFeature)));
  }

  get isDefDir() {
    return !this.isReversed;
  }

  get getIsShowCenter() {
    return this.isShowCenter;
  }

  setIsShowCenter = (viewState: ViewState) => {
    this.isShowCenter = viewState;
  };

  get getMode(): string {
    return this.mode;
  }

  get getEditable() {
    return this.editable;
  }

  setEditable = (editable: boolean) => {
    this.editable = editable;
  };

  get getCommentOpenIdx() {
    return this.commentOpenIdx;
  }

  get getisDrawerOpen() {
    return this.isDrawerOpen;
  }

  get getLog() {
    return this.log;
  }

  setLog = (payload) => {
    this.log = payload;
    if (this.log.length > 10) {
      this.log.splice(10);
    }
  };

  addLog = (point: QueryHost) => {
    this.log.unshift(point);
    if (this.log.length > 100) {
      this.log.pop();
    }
  };

  setMode = (mode) => {
    this.mode = mode;
  };

  setCommentOpenIdx = (i) => {
    this.commentOpenIdx = i;
  };

  setDrawerOpen = (flag) => {
    this.isDrawerOpen = flag;
  };

  setLogTooltipObject = (info: any) => {
    this.logTooltipObject = {
      ...info.object,
      cluster: false,
      object: info.object ?? {},
    };
  };

  setIsDefDir = (isDefDir: boolean) => {
    if (this.isDefDir === isDefDir) {
      return;
    }

    this.isReversed = !isDefDir;
    if (this.focusedNodeId || this.focusedEdgeId) {
      this.refreshGraphHighlighter();
    }
  };

  get getSelCoord() {
    return this.selCoord;
  }

  get getSelEdges() {
    return this.selEdges;
  }

  get getHasFocusHighlight() {
    return Boolean(this.focusedNodeId || this.focusedEdgeId || this.focusedEdges.length);
  }

  get getFocusRevision() {
    return this.focusRevision;
  }

  get getFocusedConnectedNodeIds() {
    void this.focusRevision;
    return this.graphHighlighter.getConnectedNodeIds();
  }

  get getFocusedConnectedEdgeIndexes() {
    void this.focusRevision;
    return this.graphHighlighter.getConnectedEdgeIndexes();
  }

  setSelCoord = (newSelCoord) => {
    this.selCoord = newSelCoord;
  };

  setSelEdges = (edges: Edge[]) => {
    this.selEdges = edges;
  };

  setFocusedNodeId = (nodeId: string | null, graphId?: string | null) => {
    this.graphHighlighter.setGraph(this.root.graph, { edgeIndex: this.root.panel.graphEdgeIndex });

    const nextGraphId = graphId ?? null;
    if (this.focusedNodeId === nodeId && this.focusedNodeGraphId === nextGraphId && !this.focusedEdgeId) {
      return;
    }

    this.focusedNodeId = nodeId;
    this.focusedNodeGraphId = nextGraphId;
    this.focusedEdgeId = null;
    this.focusedEdgeGraphId = null;
    this.focusedEdges = [];
    this.graphHighlighter.update({ sourceId: nodeId, graphId: nextGraphId, maxDepth: 1, isDefDir: this.focusIsDefDir });
    this.focusRevision += 1;
  };

  setFocusedEdgeId = (edgeId: string | null, graphId?: string | null) => {
    this.graphHighlighter.setGraph(this.root.graph, { edgeIndex: this.root.panel.graphEdgeIndex });

    const nextGraphId = graphId ?? null;
    if (this.focusedEdgeId === edgeId && this.focusedEdgeGraphId === nextGraphId && !this.focusedNodeId) {
      return;
    }

    this.focusedNodeId = null;
    this.focusedNodeGraphId = null;
    this.focusedEdgeId = edgeId;
    this.focusedEdgeGraphId = nextGraphId;
    this.focusedEdges = [];
    this.graphHighlighter.updateEdge({ edgeId, graphId: nextGraphId });
    this.focusRevision += 1;
  };

  setFocusedEdges = (edges: Edge[]) => {
    this.graphHighlighter.setGraph(this.root.graph, { edgeIndex: this.root.panel.graphEdgeIndex });

    this.focusedNodeId = null;
    this.focusedNodeGraphId = null;
    this.focusedEdgeId = null;
    this.focusedEdgeGraphId = null;
    this.focusedEdges = edges;
    this.graphHighlighter.updateEdges(edges);
    this.focusRevision += 1;
  };

  refreshGraphHighlighter = () => {
    this.graphHighlighter.setGraph(this.root.graph, { force: true, edgeIndex: this.root.panel.graphEdgeIndex });
    if (this.focusedEdges.length) {
      this.graphHighlighter.updateEdges(this.focusedEdges);
    } else if (this.focusedEdgeId) {
      this.graphHighlighter.updateEdge({ edgeId: this.focusedEdgeId, graphId: this.focusedEdgeGraphId });
    } else {
      this.graphHighlighter.update({
        sourceId: this.focusedNodeId,
        graphId: this.focusedNodeGraphId,
        maxDepth: 1,
        isDefDir: this.focusIsDefDir,
      });
    }
    this.focusRevision += 1;
  };

  setFocusedNodeFromPickingInfo = (info: any) => {
    if (!info?.picked) {
      this.setFocusedElement(null, null);
      return;
    }

    if (this.hooks.ignorePickingInfo?.(info)) {
      return;
    }

    const nodeRef = this.getNodeRefFromPickingInfo(info);
    if (nodeRef) {
      this.setFocusedNodeId(nodeRef.nodeId, nodeRef.graphId);
      return;
    }

    const edgeRef = this.getEdgeRefFromPickingInfo(info);
    this.setFocusedEdgeId(edgeRef?.edgeId ?? null, edgeRef?.graphId);
  };

  setFocusedElement = (nodeId: string | null, edgeId: string | null) => {
    if (nodeId) {
      this.setFocusedNodeId(nodeId);
    } else {
      this.setFocusedEdgeId(edgeId);
    }
  };

  setEdgeListed = (flag) => {
    if (this.isEdgeListed === flag) {
      return;
    }

    this.isEdgeListed = flag;
    if (this.focusedNodeId) {
      this.refreshGraphHighlighter();
    }
  };

  get getisEdgeListed() {
    return this.isEdgeListed;
  }

  private get focusIsDefDir(): boolean | null {
    return this.isEdgeListed ? this.isDefDir : null;
  }

  get getTooltipObject() {
    return this.tooltipObject;
  }

  setTooltipObject = (info: any) => {
    this.tooltipObject = info;
  };

  get getSelectedIdxs(): Map<string, Record<string, number[]>> | [] {
    const selectedIds = new Map();
    const selectedNode = this.getSelectedNode;
    const dataRecord =
      selectedNode instanceof Graph ? getGraphData(selectedNode) : selectedNode ? getNodeData(selectedNode) : undefined;
    if (!dataRecord) {
      return selectedIds;
    }
    const selFeatLayerName = (selectedNode?.parent as Graph).id;
    const index = dataRecord.idx;
    const selEdges = this.selEdges;

    if (index !== undefined) {
      const prevNodes = selectedIds.get(colTypes.Nodes);

      if (dataRecord.feature?.type === 'Polygon') {
        selectedIds.set(colTypes.Bboxes, [index]);
      } else {
        selectedIds.set(colTypes.Nodes, {
          ...prevNodes,
          [selFeatLayerName]: [index],
        });
      }

      if (selEdges?.length) {
        const edgesByLayer = selEdges.reduce<Record<string, number[]>>((acc, e) => {
          if (e.id == null) {
            return acc;
          }
          const layerId = String((e.source.parent as Graph).id);
          const edgeRef = this.root.panel.graphEdgeIndex.getEdgeRef(e);
          if (edgeRef === undefined && this.hooks.allowUnindexedEdges === false) {
            return acc;
          }
          const recordRef =
            edgeRef === undefined ? e.data.recordRef : this.root.panel.graphEdgeIndex.getEdgeRecordRef(edgeRef);
          const lineIds = [...this.root.panel.graphEdgeIndex.recordEdges(recordRef)]
            .map((x: any) => x?.lineId)
            .filter((id: any): id is number => typeof id === 'number');

          if (lineIds.length) {
            (acc[layerId] ??= []).push(...lineIds);
          }
          return acc;
        }, {});
        selectedIds.set(colTypes.Edges, edgesByLayer);
      }
    }
    return selectedIds;
  }

  get getSelectedNode() {
    return this.selectedNode;
  }

  setSelectedNode = (node: Node | undefined | null, pickedEdges: Edge[] = []) => {
    // node === undefined with selIds sets line id
    if (node === null || node === undefined) {
      this.selectedNode = null;
    }
    if (node) {
      this.selectedNode = node;
    }
    if (pickedEdges.length > 1) {
      this.setFocusedEdges(pickedEdges);
    } else if (pickedEdges[0]) {
      this.setFocusedEdgeId(pickedEdges[0].id, String((pickedEdges[0].source.parent as Graph)?.id ?? ''));
    } else if (node) {
      this.setFocusedNodeId(node.id, String((node.parent as Graph)?.id ?? ''));
    } else {
      this.setFocusedElement(null, null);
    }

    if (node) {
      const dataRecord = node instanceof Graph ? getGraphData(node) : getNodeData(node);
      const feature = dataRecord?.feature;
      if (!feature) {
        return;
      }
    }

    const selNode = this.selectedNode;

    this.graphHighlighter.setGraph(this.root.graph, { edgeIndex: this.root.panel.graphEdgeIndex });
    const edgeGroups = this.isDefDir
      ? this.graphHighlighter.getOutEdgeGroups(selNode)
      : this.graphHighlighter.getInEdgeGroups(selNode);
    if (!edgeGroups.length && !pickedEdges?.length) {
      this.setSelEdges([]);
      return;
    }

    const edges = selNode && edgeGroups.map((edges) => edges[0]).filter((edge) => edge !== undefined);

    const selEdges = pickedEdges?.length ? pickedEdges : node && Array.isArray(edges) && edges.length ? edges : [];
    this.setSelEdges(selEdges);
  };
  setUpdatedHost = (update: any): Promise<boolean> => {
    if (this.disposed) {
      return Promise.resolve(false);
    }
    const key = String(update.locName ?? '');
    const version = (this.liveUpdates.get(key) ?? 0) + 1;
    this.liveUpdates.set(key, version);
    const graph = this.root.graph;
    const data = this.root.data;
    const isCurrent = () =>
      !this.disposed && this.root.graph === graph && this.root.data === data && this.liveUpdates.get(key) === version;
    return this.hooks.onLiveHostUpdate?.(this, update, isCurrent) ?? Promise.resolve(false);
  };

  connect = () => {
    const eventBus = this.root.eventBus;
    if (this.eventSub && this.subscribedEventBus === eventBus) {
      return;
    }
    this.eventSub?.unsubscribe();
    this.disposed = false;
    this.subscribedEventBus = eventBus;
    this.eventSub = this.subscribe();
  };

  dispose = () => {
    this.disposed = true;
    this.liveUpdates.clear();
    this.eventSub?.unsubscribe();
    this.eventSub = undefined;
    this.subscribedEventBus = undefined;
  };

  private getNodeRefFromPickingInfo(info: any): { nodeId: string; graphId: string | null } | null {
    const interaction = resolvePanelGraphInteraction(this.root.panel, info);
    if (interaction?.kind === 'node') {
      return {
        nodeId: interaction.record.id,
        graphId: interaction.record.namespaceId,
      };
    }

    let props = info.object?.properties ?? info.object;
    const points = info.sourceLayer?.props?.data?.points ?? info.layer?.props?.data?.points;
    let isNodePick = false;

    if (points && (info.featureType === 'points' || info.viewport?.id === '3d-scene') && info.index !== -1) {
      const idx = points.featureIds?.value?.[info.index];
      props = this.root.panel.features?.[idx];
      isNodePick = true;
    } else if (info.object?.pointIndex !== undefined) {
      isNodePick = true;
    }

    if (!isNodePick) {
      return null;
    }

    const locName = props?.locName;
    if (!locName) {
      return null;
    }

    const graph = props.graph instanceof Graph ? props.graph : this.root.graph;
    const node = graph.findNode(locName) ?? this.root.graph.findNodeRecursive(locName);
    return node ? { nodeId: node.id, graphId: String((node.parent as Graph)?.id ?? graph.id ?? '') } : null;
  }

  private getEdgeRefFromPickingInfo(info: any): { edgeId: string; graphId: string | null } | null {
    const interaction = resolvePanelGraphInteraction(this.root.panel, info);
    if (interaction?.kind === 'edge') {
      return {
        edgeId: interaction.runtimeId ?? interaction.record.id,
        graphId: interaction.record.sourceNamespaceId,
      };
    }

    const object = info.object;
    const edgeId = object?.edgeId ?? object?.properties?.edgeId;
    if (!edgeId) {
      return null;
    }

    const graph = object?.properties?.graph ?? object?.feature?.properties?.graph;
    const graphId = graph instanceof Graph ? graph.id : (graph?.id ?? null);
    return { edgeId, graphId: graphId ? String(graphId) : null };
  }
}

export default PointStore;
