import {Queue} from 'queue-typescript'
import {Assert} from '../utils/assert'
import {Edge} from './edge'
import {Entity} from './entity'
import {Node} from './node'
import {NodeCollection} from './nodeCollection'
import {action, autorun, computed, makeObservable, observable, toJS} from "mobx";
import {
    CommentsData,
    CoordRef,
    DeckLine, BiColProps
} from "../utils/interfaces";
import {CoordsConvert} from "../utils";
import {paraboloid, getMidpoint, segregatePath} from '../utils/utils.graph'

import {Units} from "@turf/helpers";
import distance from "@turf/distance";
import {GeomEdge} from "@msagl/core";

type EdgeTuple = [number[],number]  ///widxs, lidx
/** This class keeps the connection between the nodes and the edges of the graph. The nodes of a Graph can also be Graphs.  */
export class Graph extends Node {
  root?: any;
  isLogic: boolean = false;
  comments: CommentsData = {}
  wasm2Edges: Array<Edge[]> = [];
  wasm_edge_vertice_ids: Array<EdgeTuple> = [];

  groupCounts: Map<number, number> = new Map();

  positionRanges: [number, number][] = [];

  disposeAutorun = () => {
  }

    /** Version the graph. A version is a number that is incremented every time the graph is updated. */
  public version = 0;
  /** Is a panel root graph */
  private isRoot: boolean = false;

  constructor(id = '__graph__', isRoot = false, isLogic = true) {
    super(id)
    this.isRoot = isRoot
    this.isLogic = isLogic
    this.findNode = this.findNode.bind(this);
    this.addNode = this.addNode.bind(this);
    this.setEdge = this.setEdge.bind(this);
    this._bumpVersion = this._bumpVersion.bind(this);
    this.setRoot = this.setRoot.bind(this);
    this.findNodeRecursive = this.findNodeRecursive.bind(this);

    makeObservable(this, {
      version: observable,
      _bumpVersion: action,
      getVersion: computed,
      getEdgesGeometry: computed,
      getComments: computed,
      groupCounts: observable,
      getGroupCounts: computed,
      addNode: action,
      setEdge: action,
      addToGroup: action,
      rmFromGroup: action,
    });

    //autorun(() => console.log('v.', toJS(this.getVersion)));
    //autorun(() => console.log('nodecollection', toJS(this.nodeCollection)));
  }

  addToGroup = (idx: number, wasmId: number) => {
    const groupIds = this.groupCounts.get(idx)
    if (groupIds) {
      this.groupCounts.set(idx, groupIds+1)
    } else {
      this.groupCounts.set(idx, 1);
    }
  }

  rmFromGroup = (idx: number, wasmId: number) => {
    const groupIds = this.groupCounts.get(idx);
    if (groupIds) {
      this.groupCounts.set(idx, groupIds-1);
      if (groupIds === 0) {
        //this.groupWasmIds.delete(idx);
      }
    }
  }

  get getGroupCounts() {
    return this.groupCounts
  }

  /// Untouched MSAGLJS graph

  remove(node: Node) {
    this.nodeCollection.remove(node)
  }
  /** Removes itself from under the parent.
   *  Also removes all the edges leading out of the graph.
   */
  removeSubgraph() {
    const parent = this.parent as Graph
    if (parent) parent.removeNode(this)

    for (const c of this.outGoingEdges()) {
      if (c.attachedAtSource) {
        c.node.removeOutEdge(c.edge)
      } else {
        c.node.removeInEdge(c.edge)
      }
    }
  }
  /** returns the objects that show how the edge is adjacent to a node  that is outside of the graph */
  *outGoingEdges(): IterableIterator<{edge: Edge; node: Node; attachedAtSource: boolean}> {
    for (const e of this.outEdges) {
      const t = e.target
      if (!this.isAncestor(t)) {
        yield {edge: e, node: t, attachedAtSource: false}
      }
    }
    for (const e of this.inEdges) {
      const s = e.source
      if (!this.isAncestor(s)) {
        yield {edge: e, node: s, attachedAtSource: true}
      }
    }
    for (const n of this.nodesBreadthFirst) {
      for (const e of n.outEdges) {
        const t = e.target
        if (t === this) continue
        if (!this.isAncestor(t)) {
          yield {edge: e, node: t, attachedAtSource: false}
        }
      }
      for (const e of n.inEdges) {
        const s = e.source
        if (s === this) continue
        if (!this.isAncestor(s)) {
          yield {edge: e, node: s, attachedAtSource: true}
        }
      }
    }
  }
  isAncestor(entity: Entity): boolean {
    for (const ant of entity.getAncestors()) {
      if (ant === this) {
        return true
      }
    }

    return false
  }
  /**  Iterates over all connected components of the graph and for each component
   * returns all its nodes with "this" as the parent
   */

  *getClusteredConnectedComponents(): IterableIterator<Array<Node>> {
    const processed = new Set<Node>()
    const q = new Queue<Node>()
    for (const v of this.nodesBreadthFirst) {
      if (processed.has(v)) continue
      processed.add(v)
      q.enqueue(v)
      const component = new Set<Node>()
      do {
        const u = q.dequeue()
        if (u.parent === this) {
          component.add(u)
        }
        for (const w of this.reachableFrom(u)) {
          if (!processed.has(w)) {
            processed.add(w)
            q.enqueue(w)
          }
        }
      } while (q.length > 0)
      yield Array.from(component)
    }
  }
  private *reachableFrom(u: Node): IterableIterator<Node> {
    for (const e of u.outEdges) {
      yield e.target
    }
    for (const e of u.inEdges) {
      yield e.source
    }
    if (u instanceof Graph) {
      yield* u.shallowNodes
    }
    if (u.parent != this) {
      yield u.parent as Node
    }
  }
  hasSomeAttrOnIndex(index: number): boolean {
    for (const n of this.nodesBreadthFirst) {
      if (n.getAttr(index)) return true
    }
    for (const n of this.deepEdges) {
      if (n.getAttr(index)) return true
    }
    return false
  }
  *graphs(): IterableIterator<Graph> {
    for (const g of this.nodeCollection.graphs) {
      yield g
    }
  }

  noEmptySubgraphs(): boolean {
    for (const g of this.subgraphsBreadthFirst()) {
      if (g.shallowNodeCount === 0) return false
    }
    return true
  }

  hasSubgraphs(): boolean {
    for (const n of this.shallowNodes) if (n instanceof Graph) return true
    return false
  }

  /** iterates breadth first  */
  *subgraphsBreadthFirst(): IterableIterator<Graph> {
    for (const n of this.nodesBreadthFirst) {
      if (n instanceof Graph) yield (<Graph>n);
    }
  }

  isEmpty() {
    return this.shallowNodeCount === 0
  }

  setEdge(id: string, sourceId: string, targetId: string, subGraphB?: Graph): Edge | undefined {
    const s = this.nodeCollection.findShallow(sourceId)
    if (s == null) return
    const t = subGraphB ? subGraphB.nodeCollection.findShallow(targetId) : this.nodeCollection.findShallow(targetId)
    if (t == null) return
    const newEdge = new Edge(id, s, t)
    if (this.isLogic) {
      //@ts-ignore
      const gbc: GeomEdge = new GeomEdge(newEdge)
      // gbc.sourceArrowhead = new Arrowhead()
      // gbc.targetArrowhead = new Arrowhead()
    }
    ///
    this.nodeCollection.addEdge(newEdge)
    ///
    return newEdge
  }

   /** Iterates over the nodes of the current graph but not entering the subgraphs.
   *  Yields the top subgraphs among the nodes as well
   */
  get shallowNodes(): IterableIterator<Node> {
    return this.nodeCollection.nodesShallow
  }
  /** Iterates over all the nodes of including the subgraphs.
   * The iteration happens in the breadth first pattern.
   */
  get nodesBreadthFirst(): IterableIterator<Node> {
    return this.nodesBreadthFirst_()
  }
  /** iterates breadth first  */
  private *nodesBreadthFirst_(): IterableIterator<Node> {
    for (const n of this.nodeCollection.nodesShallow) {
      yield n
      if (n instanceof Graph) {
        yield* n.nodesBreadthFirst
      }
    }
  }

  dispose() {
    // Dispose of autorun

    if (this.disposeAutorun) {
      this.disposeAutorun();
    }
  }

  setRoot = (root: any) => { /////// RootStore class is not in maplib package
    this.root = root;
  }

  /**
   * Finds the node with the givin id belonging to a graph or one of its subgraphs.
   */
  findNodeRecursive(id: string): Node {
    const n = this.nodeCollection.findShallow(id)
    if (n) {
      return n
    }
    for (const g of this.shallowNodes) {
      if (g instanceof Graph) {
        const nn = g.findNodeRecursive(id)
        if (nn) return nn
      }
    }
    //@ts-ignore
    return null
  }
  /** Returns a node belonging to this graph having the same id.
   * If a node with the given id belongs to a subgraph than it would no be returned.
   * To find such a deeper nested node use findNodeRecursive
   */
  findNode(id: string): Node | undefined {
    return this.nodeCollection.findShallow(id)
  }
  /** iterates over the edges of the graph which adjacent to the nodes of the graph:
   * not iterating over the subgraphs
   */
  get shallowEdges() {
    return this.nodeCollection.edges
  }

  /** iterates over the edges of the graph including subgraphs */
  get deepEdges(): IterableIterator<Edge> {
    return this.deepEdgesIt()
  }

  private *deepEdgesIt() {
    for (const node of this.nodesBreadthFirst) {
      for (const e of node.outEdges) {
        yield e
      }
      for (const e of node.selfEdges) {
        yield e
      }
      for (const e of node.inEdges) {
        if (!this.isAncestor(e.source)) yield e
      }
    }
  }

  isConsistent(): boolean {
    if (this.parent) return (this.parent as Graph).isConsistent()

    return this.eachNodeIdIsUnique() && this.nodeCollection.isConsistent()
  }
  nodeIsConsistent(n: Node): boolean {
    return this.nodeCollection.nodeIsConsistent(n)
  }
  /** Detouches all the node's edges and removes the node from the graph.
   * This method does not change the parent of the node.
   */

  removeNode(node: Node): void {
    for (const e of node.outEdges) {
      e.target.inEdges.delete(e)
    }
    for (const e of node.inEdges) {
      e.source.outEdges.delete(e)
    }
    this.nodeCollection.remove(node)
    for (const p of this.subgraphsBreadthFirst()) {
      p.removeNode(node)
    }
  }

  /** adds a node to the graph */
  addNode(n: Node): Node {
    Assert.assert(this.findNodeRecursive(n.id) == null)
    /*Assert.assert(n.parent == null  || n.parent === this)*/
    n.parent = this
    this.nodeCollection.addNode(n)
    // Assert.assert(this.isConsistent())
    return n
  }

  /// was private originally

  nodeCollection: NodeCollection = new NodeCollection()
  get shallowNodeCount() {
    return this.nodeCollection.nodeShallowCount
  }

  get nodeCountDeep() {
    let count = this.nodeCollection.size
    for (const p of this.shallowNodes) {
      if (p instanceof Graph) {
        count += p.nodeCountDeep
      }
    }
    return count
  }

  get edgeCount() {
    return this.nodeCollection.edgeCount
  }

  // If n has an ancestor which is the graph child then return it.
  // Otherwise return null
  liftNode(n: Node): Node {
    while (n != null && n.parent !== this) {
      n = <Node>n.parent
    }
    return n
  }
  /** return the number of all edges in the graph, including the subgraphs */
  get deepEdgesCount(): number {
    let count = 0
    for (const p of this.nodesBreadthFirst) {
      count += p.outDegree + p.selfDegree
    }
    return count
  }
  eachNodeIdIsUnique(): boolean {
    const ids = new Set<string>()
    for (const n of this.nodesBreadthFirst) {
      if (ids.has(n.id)) {
        return false
      }
      ids.add(n.id)
    }
    return true
  }
  /** returns all the nodes under graph and the edges with at least one end adjacent to the graph */
  *allElements(): IterableIterator<Entity> {
    for (const n of this.allSuccessorsWidthFirst()) {
      yield n
      for (const e of n.selfEdges) {
        yield e
      }
      for (const e of n.outEdges) {
        yield e
      }
      for (const e of n.inEdges) {
        if (!this.isAncestor(e.source)) {
          yield e
        }
      }
    }
    yield* this.edges // uses get edges() of Node
  }
  *allSuccessorsWidthFirst(): IterableIterator<Node> {
    for (const n of this.shallowNodes) {
      yield n
    }
    for (const n of this.shallowNodes) {
      if (n instanceof Graph) {
        yield* n.allSuccessorsWidthFirst()
      }
    }
  }
  *allSuccessorsDepthFirst(): IterableIterator<Node> {
    for (const n of this.shallowNodes) {
      if (n instanceof Graph) {
        yield* n.allSuccessorsDepthFirst()
      }
      yield n
    }
  }

  /**
   * Clean up all the nodes in the graph.
   */
  resetNodes = (): void => {
    this.nodeCollection = new NodeCollection()
    this.positionRanges = []
  }


  get getNodes(): IterableIterator<Node> {
    return this.nodeCollection.nodesShallow;
  }

  /**
   * Clean up everything in the graph.
   */
  reset = (): void => {
    this.resetNodes();
    this.groupCounts = new Map()
    this.wasm2Edges = []
    this.wasm_edge_vertice_ids = []

    //this._bumpVersion();
  }

  /**
   * Trigger an update to the graph.
   */
  triggerUpdate = (): void => {
    this._bumpVersion();
  }

  /**
   * Check the equality of two graphs data by checking last update time stamp
   * @param  {Object} g Another graph to be compared against itself
   * @return {Bool}   True if the graph is the same as itself.
   */
  equals = (g: Graph): boolean => {
    if (!g || !(g instanceof Graph)) {
      return false;
    }
    return this.version === g.version;
  }

  _bumpVersion(): void {
    this.version += 1;
  }

  get getVersion() {
    return this.version;
  }

  get getComments() {
    return this.comments
  }

  get getWasmId2Edges() {
    return this.wasm2Edges
  }

  get getEdgeVerticeIds() {
    return this.wasm_edge_vertice_ids
  }

  get getEdgesGeometry() {

   const arcsFeatures: Record<string, any[]> = {};
   const features: Record<string, DeckLine[]> = {};

   const panel = this.root.panel
   const positions = panel.positions;

    this.wasm2Edges.forEach((edges, i ) => {
        if (!edges.length) {return}

        const edge = edges[0]
        const {source, data: edgeData} = edge
        const srcGraph = source.parent as Graph

        const findNode = this.findNode

        /// skip autolayout dummy edges
        if (!edgeData) {
          return
        }

        const dataRecord = edgeData?.dataRecord as BiColProps
        if (!dataRecord) {
        }

        const edge_id = edgeData?.edge_id

        const {
          parPath,
        } = edgeData || {}

        const locName = parPath[0]
        let subPath = parPath

        const wasmIds = this.wasm_edge_vertice_ids[i][0]
        let pathsCoords = CoordsConvert(subPath, wasmIds, positions, true);

       const [segrPath, segrCoords] = parPath.length ? segregatePath(subPath, pathsCoords, findNode) : []

       let coordinates = segrCoords

        /// fallback if no nodes found in parPath
        if (!segrPath.length) {
          if (Array.isArray(parPath)) {
              segrPath.push([{
              item: locName,
              gIdx: 0
            }, {item: parPath.at(-1), gIdx: 1}])
          }
        }

        const geomEdge: GeomEdge = GeomEdge.getGeom(edge)

      if (geomEdge?.source) {
           if (geomEdge?.curve?.start) {
             /// Remove node coordinates. Leave node boundary ports only.
            coordinates.forEach((c: string | any[], i: any)=> {
              if (c.length > 3) {
                coordinates[i] = c.slice(1, -1)
              }
            })

          } else {
            console.warn("Invalid controlPoints or polyPoints", locName, edge.id);
            coordinates = [coordinates]
          }

      }

      if (!coordinates.length) {
        return
      }

      const propsOverride = dataRecord /// as from frame initially (including duplicate records)
      const newFeature: DeckLine = {
        //id: counter,
        edgeId: edge.id,
        type: 'Feature',
        geometry: {
          type: 'MultiLineString',
          coordinates,
        },
        rowIndex: dataRecord?.rowIndex, // can't pick original index without explicitely stating it
        properties: {
          ...(propsOverride ?? {}),
          locName,
          segrPath
        }
      }

      const srcFeatureProps = newFeature.properties
      const sourcePosition = coordinates[0][0];
      const targetPosition = coordinates.at(-1).at(-1);

        if (!features[srcGraph.id]) {
            features[srcGraph.id] = [];
        }
        features[srcGraph.id].push(newFeature);
        edge.setLineId(features[srcGraph.id].length-1)

      /// Arcs
            const {arcStyle} = srcFeatureProps
            const heightCoef = arcStyle?.arcConfig.height
            const options = {units: 'meters' as Units}; // or 'miles', 'degrees', 'radians'

        function distance2D(a: number[], b: number[]) {
            const dx = b[0] - a[0];
            const dy = b[1] - a[1];
            return Math.sqrt(dx * dx + dy * dy);
        }

            const d = this.isLogic ? distance2D(sourcePosition, targetPosition) : distance(sourcePosition, targetPosition, options);
            const peakHeight = paraboloid(d, 0, 0, 0.5, heightCoef !== undefined ? heightCoef : 0.5); //isLogic ? 0 :
            const mid = getMidpoint(sourcePosition, targetPosition, this.isLogic);
            const midPoint = [...mid,
                peakHeight
            ];

            const arcData = {
                sourcePosition,
                targetPosition,
                midPoint,
                properties: srcFeatureProps,
                edgeId: edge.id
            };
        if (!arcsFeatures[srcGraph.id]) {
            arcsFeatures[srcGraph.id] = [];
        }
        arcsFeatures[srcGraph.id].push(arcData);


    })

    return [features, arcsFeatures]

  }


}


export function* shallowConnectedComponents(graph: Graph): IterableIterator<Node[]> {
  const enqueueed = new Set<Node>()
  const queue = new Queue<Node>()
  for (const n of graph.shallowNodes) {
    if (enqueueed.has(n)) continue
    const nodes = new Array<Node>()
    enqueue(n, queue, enqueueed)
    while (queue.length > 0) {
      const s = queue.dequeue()
      nodes.push(s)
      for (const neighbor of neighbors(s)) {
        enqueue(neighbor, queue, enqueueed)
      }
    }
    yield nodes
  }
  function* neighbors(n: Node): IterableIterator<Node> {
    for (const e of n.outEdges) yield e.target
    for (const e of n.inEdges) yield e.source
  }
  function enqueue(n: Node, queue: Queue<Node>, enqueueed: Set<Node>) {
    if (!enqueueed.has(n)) {
      queue.enqueue(n)
      enqueueed.add(n)
    }
  }
}

/** sets a new Graph as the parent of the node */
export function setNewParent(newParent: Graph, node: Node) {
  if (node.parent) {
    const oldParent = node.parent as Graph
    oldParent.remove(node)
  }
  newParent.addNode(node)

  // let p = newParent
  // while (p.parent) p = p.parent as Graph
  // Assert.assert(p.isConsistent())
}

/** implements the google PageRank.
 * omega is the probability of following a link
 * */
export function pagerank(graph: Graph, omega: number): Map<Node, number> {
  let p = new Map<Node, number>()
  const n = graph.nodeCountDeep
  let initialVal = 1 / n
  for (const v of graph.nodesBreadthFirst) {
    p.set(v, initialVal)
  }
  // repeat 50 times
  for (let c = 0; c < 50; c++) {
    initialVal = (1 - omega) / n
    const q = new Map<Node, number>()
    for (const v of graph.nodesBreadthFirst) {
      q.set(v, initialVal)
    }

    //  forward propagation
    for (const v of graph.nodesBreadthFirst) {
      let qv = q.get(v)
      for (const edge of v.inEdges) {
        const u = edge.source
        //@ts-ignore
        qv += omega * (p.get(u) / u.outDegree)
      }
      //@ts-ignore
      q.set(v, qv)
    }
    p = q
  }

  return p
}
export function edgeNodesBelongToSet(e: Edge, s: Set<Node>): boolean {
  return s.has(e.source) && s.has(e.target)
}
