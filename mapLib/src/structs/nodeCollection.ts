import {Node} from './node'
import {Edge} from './edge'
import {Graph} from './graph'
import {action, autorun, computed, makeAutoObservable, makeObservable, observable, toJS} from "mobx";

export class NodeCollection {
  remove(node: Node) {
    this.nodeMap.delete(node.id)
  }

  addEdge(edge: Edge) {
    this._edgeMap[edge.id] = edge;
  }

  findEdge = (edgeId: string | number): Edge => {
    return this._edgeMap[edgeId];
  }

  get size(): number {
    return this.nodeMap.size
  }

  get getEdgesMap(): Record<string, Edge> {
    return this._edgeMap
  }

  /** List of object edges. */
      //private _edgeMap: Record<string, Edge> = {};
  _edgeMap: Record<string, Edge> = {};

  private *nodes_(): IterableIterator<Node> {
    for (const p of this.nodeMap.values()) yield p
  }

  private *graphs_(): IterableIterator<Graph> {
    for (const n of this.nodes_()) {
      if (n instanceof Graph) {
        yield n as Graph
      }
    }
  }

  constructor() {

    makeObservable(this, {
      nodeMap: observable,
      _edgeMap: observable,
      getNodeMap: computed,
      getEdgesMap: computed,
      remove: action
    }, {autoBind: true});

    this.findEdge = this.findEdge.bind(this);

    //autorun(() => console.log('auto getnodmap', toJS(this.getNodeMap)));
    //autorun(() => console.log('auto getEdgesMap', toJS(this.getEdgesMap)));
  }

  findShallow(id: string): Node | undefined {
    return this.nodeMap.get(id)
  }

  get nodesShallow(): IterableIterator<Node> {
    return this.nodes_()
  }

  get graphs(): IterableIterator<Graph> {
    return this.graphs_()
  }

  nodeMap: Map<string, Node> = new Map<string, Node>()

  get getNodeMap(): Map<string, Node> {
    return this.nodeMap
  }

  private *_edges() {
    // if we go over node.inEdges too then not self edges will be reported twice
    for (const node of this.nodeMap.values()) {
      for (const e of node.outEdges) {
        yield e
      }
      for (const e of node.selfEdges) {
        yield e
      }
    }
  }

  interGraphEdges(): IterableIterator<Edge> {
    throw new Error('not implemented')
  }

  get nodeShallowCount(): number {
    return this.nodeMap.size
  }

  // caution: it is a linear by the number of nodes method
  get edgeCount(): number {
    let count = 0
    for (const p of this.nodeMap.values()) {
      count += p.outDegree + p.selfDegree
    }
    return count
  }

  /**  returns the edges of shallow nodes */
  get edges(): IterableIterator<Edge> {
    return this._edges()
  }

  addNode(node: Node) {
    this.nodeMap.set(node.id, node)
  }

  nodeIsConsistent(n: Node): boolean {
    for (const e of n.outEdges) {
      if (e.source !== n) {
        return false
      }
      if (e.source === e.target) {
        return false
      }
    }
    for (const e of n.inEdges) {
      if (e.target !== n) {
        return false
      }

      if (e.source === e.target) {
        return false
      }
    }

    for (const e of n.selfEdges) {
      if (e.target !== e.source) {
        return false
      }
      if (e.source !== n) {
        return false
      }
    }

    return true
  }

  isConsistent(): boolean {
    for (const node of this.nodeMap.values()) {
      if (!this.nodeIsConsistent(node)) {
        return false
      }
    }
    return true
  }
}
