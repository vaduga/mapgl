import { makeAutoObservable } from 'mobx';
import RootStore from './RootStore';
import { blankHoverInfo, colTypes, Info, ViewState } from 'mapLib/utils';
import { Edge, Graph, Node } from 'mapLib';
import { SelectNodeEvent } from '../utils/bus.events';
import { Subscription } from 'rxjs';
import type { DeckGLRefWithViewManager } from '../types';
import { GraphHighlighter, type ConnectedEdgeIndex } from '../deckLayers/graph-highlighter';

class PointStore {
  root: RootStore;
  mode: 'modify' | 'view' = 'view';
  editable = false;
  isDrawerOpen = false;
  isEdgeListed = false;
  selectedNode: Node | undefined | null;
  isShowCenter: ViewState | undefined;
  selEdges: Edge[] = [];
  hoveredNodeId: string | null = null;
  hoveredEdgeId: string | null = null;
  hoveredConnectedNodeIds = new Set<string>();
  hoveredConnectedEdgeIndexes: ConnectedEdgeIndex[] = [];
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
    this.hoverHighlighter.setGraph(graph);
    const nodeId = replaceVariables('$nodeId');
    //const edgeId = replaceVariables('$edgeId');
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
            this.setHoveredEdgeId(edge.id);
          } else if (node) {
            this.setHoveredNodeId(node.id);
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

  get getIsShowCenter() {
    return this.isShowCenter;
  }

  setIsShowCenter = (viewState: ViewState) => {
    this.isShowCenter = viewState;
  };

  get getSelCoord() {
    return this.selCoord;
  }

  get getSelEdges() {
    return this.selEdges;
  }

  get getHasHoverHighlight() {
    return Boolean(this.hoveredNodeId || this.hoveredEdgeId);
  }

  get getHoverRevision() {
    return this.hoverRevision;
  }

  get getHoveredConnectedNodeIds() {
    return this.hoveredConnectedNodeIds;
  }

  get getHoveredConnectedEdgeIndexes() {
    return this.hoveredConnectedEdgeIndexes;
  }

  setSelCoord = (newSelCoord) => {
    this.selCoord = newSelCoord;
  };

  setSelEdges = (edges: Edge[]) => {
    this.selEdges = edges;
  };

  setHoveredNodeId = (nodeId: string | null) => {
    this.hoverHighlighter.setGraph(this.root.graph);

    if (this.hoveredNodeId === nodeId && !this.hoveredEdgeId) {
      return;
    }

    this.hoveredNodeId = nodeId;
    this.hoveredEdgeId = null;
    this.hoverHighlighter.update({ sourceId: nodeId, maxDepth: 1 });
    this.syncHoverHighlighterOutput();
    this.hoverRevision += 1;
  };

  setHoveredEdgeId = (edgeId: string | null) => {
    this.hoverHighlighter.setGraph(this.root.graph);

    if (this.hoveredEdgeId === edgeId && !this.hoveredNodeId) {
      return;
    }

    this.hoveredNodeId = null;
    this.hoveredEdgeId = edgeId;
    this.hoverHighlighter.updateEdge({ edgeId });
    this.syncHoverHighlighterOutput();
    this.hoverRevision += 1;
  };

  refreshHoverHighlighter = () => {
    this.hoverHighlighter.setGraph(this.root.graph, { force: true });
    if (this.hoveredEdgeId) {
      this.hoverHighlighter.updateEdge({ edgeId: this.hoveredEdgeId });
    } else {
      this.hoverHighlighter.update({ sourceId: this.hoveredNodeId, maxDepth: 1 });
    }
    this.syncHoverHighlighterOutput();
    this.hoverRevision += 1;
  };

  private syncHoverHighlighterOutput = () => {
    this.hoveredConnectedNodeIds = new Set(this.hoverHighlighter.getConnectedNodeIds());
    this.hoveredConnectedEdgeIndexes = [...this.hoverHighlighter.getConnectedEdgeIndexes()];
  };

  setHoveredNodeFromPickingInfo = (info: any) => {
    if (!info?.picked) {
      this.setHoveredElement(null, null);
      return;
    }

    const nodeId = this.getNodeIdFromPickingInfo(info);
    if (nodeId) {
      this.setHoveredNodeId(nodeId);
      return;
    }

    this.setHoveredEdgeId(this.getEdgeIdFromPickingInfo(info));
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

      selectedIds.set(colTypes.Nodes, { ...prevNodes, [selFeatLayerName]: [index] });

      if (selEdges?.length) {
        const edgesByLayer = selEdges.reduce<Record<string, number[]>>((acc, e) => {
          if (e.id == null || e.lineId == null) {
            return acc;
          }
          const layerId = String((e.source.parent as Graph).id);
          (acc[layerId] ??= []).push(e.lineId);
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

    if (!pickedEdges?.length) {
      this.setSelEdges([]);
      return;
    }

    this.setSelEdges(pickedEdges);
  };

  dispose = () => {
    this.eventSub.unsubscribe();
  };

  private getNodeIdFromPickingInfo(info: any): string | null {
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
    return node?.id ?? null;
  }

  private getEdgeIdFromPickingInfo(info: any): string | null {
    const object = info.object;
    const edgeId = object?.edgeId ?? object?.properties?.edgeId;
    return edgeId ?? null;
  }
}

export default PointStore;
