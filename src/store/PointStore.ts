import { makeAutoObservable } from 'mobx';
import RootStore from './RootStore';
import { blankHoverInfo, colTypes, Info, ViewState } from 'mapLib/utils';
import { Edge, Graph, Node } from 'mapLib';
import { SelectNodeEvent } from '../utils/bus.events';
import { Subscription } from 'rxjs';
import type { DeckGLRefWithViewManager } from '../types';
import { GraphHighlighter } from '../deckLayers/graph-highlighter';

class PointStore {
  root: RootStore;
  mode: 'modify' | 'view' = 'view';
  editable = false;
  isDrawerOpen = false;
  isEdgeListed = false;
  isReversed = false; /// node->edges paths direction reversed
  selectedNode: Node | undefined | null;
  isShowCenter: ViewState | undefined;
  selEdges: Edge[] = [];
  hoveredNodeId: string | null = null;
  hoveredNodeGraphId: string | null = null;
  hoveredEdgeId: string | null = null;
  hoveredEdgeGraphId: string | null = null;
  hoveredEdges: Edge[] = [];
  hoverRevision = 0;
  hoverHighlighter = new GraphHighlighter();
  commentOpenIdx = -1;
  selCoord?: {
    coordinates: [number, number];
    type: 'Point';
  };

  tooltipObject: Info = blankHoverInfo;
  private eventSub = new Subscription();

  private getHyperedgeEdges(edge?: Edge): Edge[] {
    if (!edge) {
      return [];
    }

    const edgeId = edge.data?.edge_id;
    const hyperedgeEdges = edgeId !== undefined ? this.root.graph.getWasmId2Edges?.[edgeId] : undefined;
    return hyperedgeEdges?.length ? hyperedgeEdges : [edge];
  }

  constructor(root: RootStore) {
    this.root = root;
    const { panel, graph, subs, eventBus, pId } = this.root;
    const isLogic = panel.isLogic;
    const replaceVariables = root.replaceVariables;
    const nodeId = replaceVariables('$nodeId');
    //const edgeId = replaceVariables('$edgeId');
    this.hoverHighlighter.setGraph(graph);
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

    const selectNodeSub = eventBus.subscribe(SelectNodeEvent, (evt) => {
      if (pId !== evt.payload.pId) {
        return;
      } //  && !isLogic  . logic layer crosshair selection

      const { nodeId, edgeId, graphId, fly, coord, select, zoomIn } = evt.payload;

      let wasmId;
      if (nodeId || edgeId || select) {
        let node, edge;
        let subGraph = graphId && Array.from(graph.graphs()).find((el) => el.id === graphId);
        if (subGraph) {
          node = (nodeId && subGraph.findNode(nodeId)) ?? subGraph;
          edge = edgeId && subGraph.nodeCollection.getEdgesMap[edgeId];
        } else {
          node = nodeId && graph.findNodeRecursive(nodeId);
          if (edgeId) {
            for (const el of graph.deepEdges) {
              if (el.id === edgeId) {
                edge = el;
                break;
              }
            }
          }
        }

        if (select) {
          if (edge) {
            this.setHoveredEdgeId(edge.id, String((edge.source.parent as Graph)?.id ?? graphId ?? ''));
          } else if (node) {
            this.setHoveredNodeId(node.id, String((node.parent as Graph)?.id ?? graphId ?? ''));
          } else {
            this.setHoveredElement(null, null);
          }
        }

        if (select || edge) {
          this.setSelectedNode(node ? node : undefined, this.getHyperedgeEdges(edge));
        }
        wasmId = node?.data?.wasmId;
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
          const scene = (map as DeckGLRefWithViewManager)?.deck?.viewManager?.viewState?.[
            isLogic ? '3d-scene' : 'geo-view'
          ];
          const mapZoom = zoomIn ? (isLogic ? 1.5 : 18) : scene?.zoom;
          const zoom = isNaN(mapZoom) ? 2 : (mapZoom ?? 18);

          const viewState = {
            longitude,
            latitude,
            transitionDuration: 250,
            rotationX: -90,
            zoom,
            yZoom: zoom + 1,
            target: [longitude, latitude, zoom],
          };
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
    this.eventSub.add(selectNodeSub);
    subs.add(selectNodeSub);

    makeAutoObservable(this);
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

  setIsDefDir = (isDefDir: boolean) => {
    if (this.isDefDir === isDefDir) {
      return;
    }

    this.isReversed = !isDefDir;
    if (this.hoveredNodeId || this.hoveredEdgeId) {
      this.refreshHoverHighlighter();
    }
  };

  get getSelCoord() {
    return this.selCoord;
  }

  get getSelEdges() {
    return this.selEdges;
  }

  get getHasHoverHighlight() {
    return Boolean(this.hoveredNodeId || this.hoveredEdgeId || this.hoveredEdges.length);
  }

  get getHoverRevision() {
    return this.hoverRevision;
  }

  get getHoveredConnectedNodeIds() {
    return this.hoverHighlighter.getConnectedNodeIds();
  }

  get getHoveredConnectedEdgeIndexes() {
    return this.hoverHighlighter.getConnectedEdgeIndexes();
  }

  setSelCoord = (newSelCoord) => {
    this.selCoord = newSelCoord;
  };

  setSelEdges = (edges: Edge[]) => {
    this.selEdges = edges;
  };

  setHoveredNodeId = (nodeId: string | null, graphId?: string | null) => {
    this.hoverHighlighter.setGraph(this.root.graph);

    const nextGraphId = graphId ?? null;
    if (this.hoveredNodeId === nodeId && this.hoveredNodeGraphId === nextGraphId && !this.hoveredEdgeId) {
      return;
    }

    this.hoveredNodeId = nodeId;
    this.hoveredNodeGraphId = nextGraphId;
    this.hoveredEdgeId = null;
    this.hoveredEdgeGraphId = null;
    this.hoveredEdges = [];
    this.hoverHighlighter.update({ sourceId: nodeId, graphId: nextGraphId, maxDepth: 1, isDefDir: this.hoverIsDefDir });
    this.hoverRevision += 1;
  };

  setHoveredEdgeId = (edgeId: string | null, graphId?: string | null) => {
    this.hoverHighlighter.setGraph(this.root.graph);

    const nextGraphId = graphId ?? null;
    if (this.hoveredEdgeId === edgeId && this.hoveredEdgeGraphId === nextGraphId && !this.hoveredNodeId) {
      return;
    }

    this.hoveredNodeId = null;
    this.hoveredNodeGraphId = null;
    this.hoveredEdgeId = edgeId;
    this.hoveredEdgeGraphId = nextGraphId;
    this.hoveredEdges = [];
    this.hoverHighlighter.updateEdge({ edgeId, graphId: nextGraphId });
    this.hoverRevision += 1;
  };

  setHoveredEdges = (edges: Edge[]) => {
    this.hoverHighlighter.setGraph(this.root.graph);

    this.hoveredNodeId = null;
    this.hoveredNodeGraphId = null;
    this.hoveredEdgeId = null;
    this.hoveredEdgeGraphId = null;
    this.hoveredEdges = edges;
    this.hoverHighlighter.updateEdges(edges);
    this.hoverRevision += 1;
  };

  refreshHoverHighlighter = () => {
    this.hoverHighlighter.setGraph(this.root.graph, { force: true });
    if (this.hoveredEdges.length) {
      this.hoverHighlighter.updateEdges(this.hoveredEdges);
    } else if (this.hoveredEdgeId) {
      this.hoverHighlighter.updateEdge({ edgeId: this.hoveredEdgeId, graphId: this.hoveredEdgeGraphId });
    } else {
      this.hoverHighlighter.update({
        sourceId: this.hoveredNodeId,
        graphId: this.hoveredNodeGraphId,
        maxDepth: 1,
        isDefDir: this.hoverIsDefDir,
      });
    }
    this.hoverRevision += 1;
  };

  setHoveredNodeFromPickingInfo = (info: any) => {
    if (!info?.picked) {
      this.setHoveredElement(null, null);
      return;
    }

    const nodeRef = this.getNodeRefFromPickingInfo(info);
    if (nodeRef) {
      this.setHoveredNodeId(nodeRef.nodeId, nodeRef.graphId);
      return;
    }

    const edgeRef = this.getEdgeRefFromPickingInfo(info);
    this.setHoveredEdgeId(edgeRef?.edgeId ?? null, edgeRef?.graphId);
  };

  setHoveredElement = (nodeId: string | null, edgeId: string | null) => {
    if (nodeId) {
      this.setHoveredNodeId(nodeId);
    } else {
      this.setHoveredEdgeId(edgeId);
    }
  };

  setDrawerOpen = (flag) => {
    this.isDrawerOpen = flag;
  };

  setEdgeListed = (flag) => {
    if (this.isEdgeListed === flag) {
      return;
    }

    this.isEdgeListed = flag;
    if (this.hoveredNodeId) {
      this.refreshHoverHighlighter();
    }
  };

  get getisDrawerOpen() {
    return this.isDrawerOpen;
  }

  get getisEdgeListed() {
    return this.isEdgeListed;
  }

  private get hoverIsDefDir(): boolean | null {
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
    const dataRecord = this.getSelectedNode?.data;
    if (!dataRecord) {
      return selectedIds;
    }
    const selFeatLayerName = (this.getSelectedNode.parent as Graph).id;
    const index = dataRecord.idx;
    const selEdges = this.selEdges;

    if (index !== undefined) {
      const prevNodes = selectedIds.get(colTypes.Nodes);

      if (dataRecord.feature.type === 'Polygon') {
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
          const edge_id = e.data.edge_id;
          const edges = this.root.graph.getWasmId2Edges[edge_id] ?? [];

          const lineIds = edges.map((x: any) => x?.lineId).filter((id: any): id is number => typeof id === 'number');

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
    if (node === null || node === undefined) {
      this.selectedNode = null;
    }
    if (node) {
      this.selectedNode = node;
      const feature = node?.data?.feature;
      if (!feature) {
        return;
      }
    }

    const selNode = this.selectedNode;

    this.hoverHighlighter.setGraph(this.root.graph);
    const edgeGroups = this.isDefDir
      ? this.hoverHighlighter.getOutEdgeGroups(selNode)
      : this.hoverHighlighter.getInEdgeGroups(selNode);
    if (!edgeGroups.length && !pickedEdges?.length) {
      this.setSelEdges([]);
      return;
    }

    const edges = selNode && edgeGroups.map((edges) => edges[0]).filter((edge) => edge !== undefined);

    const selEdges = pickedEdges?.length ? pickedEdges : node && Array.isArray(edges) && edges.length ? edges : [];

    this.setSelEdges(selEdges);
  };

  dispose = () => {
    this.eventSub.unsubscribe();
  };

  private getNodeRefFromPickingInfo(info: any): { nodeId: string; graphId: string | null } | null {
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

    const graph = props.root instanceof Graph ? props.root : this.root.graph;
    const node = graph.findNode(locName) ?? this.root.graph.findNodeRecursive(locName);
    return node ? { nodeId: node.id, graphId: String((node.parent as Graph)?.id ?? graph.id ?? '') } : null;
  }

  private getEdgeRefFromPickingInfo(info: any): { edgeId: string; graphId: string | null } | null {
    const object = info.object;
    const edgeId = object?.edgeId ?? object?.properties?.edgeId;
    if (!edgeId) {
      return null;
    }

    const root = object?.properties?.root ?? object?.feature?.properties?.root;
    const graphId = root instanceof Graph ? root.id : (root?.id ?? null);
    return { edgeId, graphId: graphId ? String(graphId) : null };
  }

  private isClusterPickingInfo(info: any): boolean {
    const layerId = info.layer?.id ?? '';
    const sourceLayerId = info.sourceLayer?.id ?? '';
    const props = info.object?.properties ?? info.object;

    return layerId === 'icon-cluster' || sourceLayerId.startsWith('icon-cluster-') || Boolean(props?.cluster);
  }
}

export default PointStore;
