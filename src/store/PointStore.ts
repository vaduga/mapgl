import {makeAutoObservable, toJS} from 'mobx';
import RootStore from './RootStore';
import {blankHoverInfo, colTypes, FIXED_COLOR_LABEL, Info, QueryHost, ViewState} from 'mapLib/utils'
import {Edge, Graph, Node} from "mapLib";
import {Deck} from "@deck.gl/core";
import {SelectNodeEvent} from "../utils/bus.events";

class PointStore {
  root: RootStore;
  mode: 'modify' | 'view' = 'view'
  editable = false
  isDrawerOpen = false;
  isEdgeListed = false;
  selectedNode: Node | undefined | null;
  isShowCenter: ViewState | undefined
  selEdges: Edge[] = [];
  commentOpenIdx = -1;
  selCoord?: {
    coordinates: [number,number],
    type: "Point"
  }

  tooltipObject: Info = blankHoverInfo;

  constructor(root: RootStore) {
    this.root = root;
    const {panel, graph, subs, eventBus, pId, } = this.root
    const isLogic = panel.isLogic;
    const replaceVariables = root.replaceVariables

    const nodeId = replaceVariables('$nodeId');
    //const edgeId = replaceVariables('$edgeId');
    let node, edge
    if (nodeId !== '$nodeId') node = this.root.graph.findNodeRecursive(nodeId)
    // if (node && edgeId !== '$edgeId') {
    // for (const el of graph.deepEdges) {
    //   if (el.id === edgeId) {
    //     edge = el;
    //     //break;
    //   }
    // }
    if (node) {
      this.setSelectedNode(node, edge ? [edge] : [] )
    }
    //}

      subs.add(
          eventBus.subscribe(SelectNodeEvent, (evt) => {
           //  console.log('evt.payload', evt.payload)

            if (pId !== evt.payload.pId) return //  && !isLogic  . logic layer crosshair selection

            const {nodeId, edgeId, graphId, fly, coord, select, zoomIn} = evt.payload

              let wasmId
              if (nodeId || edgeId || select) {
                let node, edge
                let subGraph = graphId && graph
                if (subGraph) {
                      node = (nodeId && subGraph.findNode(nodeId)) ?? subGraph
                      edge = edgeId && subGraph.nodeCollection.getEdgesMap[edgeId]
                } else
                  {
                  node = nodeId && graph.findNodeRecursive(nodeId)
                  if (edgeId) {
                     for (const el of graph.deepEdges) {
                       if (el.id === edgeId) {
                         edge = el;
                         break;
                       }
                    }
                  }
                }

                if (select || edge) {
                  this.setSelectedNode(node? node : undefined, edge ? [edge] : [])
                }
                wasmId = node?.data?.wasmId
              }

            if (fly && (wasmId !== undefined || coord))
            {

              const pos = panel.positions
              const lng = pos[wasmId*2]
              const lat = pos[wasmId*2+1]

              const coordsFromValue = [lng, lat];

              if (coord || (lng && lat)) {
                const map = this.root.map

                const longitude =  coord ? coord[0] : coordsFromValue[0]
                const latitude =  coord ? coord[1] : coordsFromValue[1]
                //@ts-ignore
                const scene = (map as Deck)?.deck?.viewManager.viewState[isLogic ? '3d-scene' : 'geo-view']
                const mapZoom = zoomIn ? (isLogic? 1.5 : 18) : scene?.zoom
                const zoom =  isNaN(mapZoom) ? 2 : mapZoom ?? 18

                const viewState = {
                  longitude,
                  latitude,
                  transitionDuration: 250,
                  rotationX: -90,
                  zoom,
                  yZoom: zoom +1,
                  target: [longitude, latitude, zoom]
                }
                if (select) {
                  this.setSelCoord({type: 'Point', coordinates: [viewState.longitude, viewState.latitude]})
                }
                this.root.viewStore.setViewState(viewState);
                this.setIsShowCenter({...viewState})

              }
            }

            }
          )
      );


    makeAutoObservable(this);
     //autorun(() => console.log('getSelelectedNode', this.getSelectedNode))//, toJS(this.getSelFeature)));
  }

  get getIsShowCenter(){
    return this.isShowCenter
  }

  setIsShowCenter = (viewState:ViewState) => {
    this.isShowCenter = viewState
  }

  get getSelCoord() {
    return this.selCoord;
  }

  setSelCoord = (newSelCoord) => {
    this.selCoord = newSelCoord;
  }

  setSelEdges =(edges: Edge[])=> {
    this.selEdges = edges
  }

  setDrawerOpen =(flag)=> {
    this.isDrawerOpen = flag
  }

  get getTooltipObject() {
    return this.tooltipObject;
  }

  setTooltipObject = (info: any) => {
    this.tooltipObject = info
  };

  get getSelectedIdxs(): Map<string, Record<string, number[]>> | [] {
    const selectedIds = new Map();
    const dataRecord = this.getSelectedNode?.data
    if (!dataRecord) {
      return selectedIds
    }
    const selFeatLayerName = (this.getSelectedNode.parent as Graph).id;
    const index = dataRecord.idx
    const selEdges = this.selEdges

    if (index !== undefined) {
      const prevNodes= selectedIds.get(colTypes.Nodes)

            selectedIds.set(colTypes.Nodes, {...prevNodes, [selFeatLayerName]: [index]});

        if (selEdges?.length) {
            const edgesByLayer = selEdges.reduce<Record<string, number[]>>(
                (acc, e) => {
                    if (e.id == null || e.lineId == null) return acc;
                    const layerId = String((e.source.parent as Graph).id);
                    (acc[layerId] ??= []).push(e.lineId);
                    return acc;
                },
                {}
            );
            selectedIds.set(colTypes.Edges, edgesByLayer);
        }

    }
    return selectedIds;
  }

  get getSelectedNode() {
    return this.selectedNode;
  }

  setSelectedNode = (node: Node | undefined | null, pickedEdges: Edge[] = []) => {
      if (node === null || node === undefined) this.selectedNode = null
      if (node) {
        this.selectedNode = node
        const feature = node?.data?.feature
        if (!feature) {return}
      }

    if (!pickedEdges?.length)  {
      this.setSelEdges([]);
      return;
    }

    this.setSelEdges(pickedEdges);

  };

}

export default PointStore;


