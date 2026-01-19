import { AttributeRegistry } from './attributeRegistry'
import {Entity} from './entity'
import {Graph} from './graph'
import {Label} from './label'
import {Node} from './node'
import {BiColProps, CoordRef} from "../utils/interfaces";

/** characterize edge if it connects an node and its ancestor */
export enum ToAncestorEnum {
  /** the source and the target are siblings */
  None,
  /** the source is an ancestor of the target */
  FromAncestor,
  /** the target is an ancestor of the source */
  ToAncestor,
}

export type EdgeData = {
  edgeId: string,
  edge_id: number, // wasm
  parPath: CoordRef[],
  dataRecord: BiColProps,
  rxEdgeId?: string,
  isEph?: boolean,
  rPath?: CoordRef[],
  rWasmNodeIds?: number[]
}

export class Edge extends Entity {

  private _id: string
  /** the unique, in the parent graph, id of the edge */
  public get id(): string {
    return this._id
  }

  private _lineId: number | undefined

  public get lineId(): number | undefined {
    return this._lineId
  }

  label: Label | undefined
  source: Node
  target: Node
  constructor(id: string, s: Node, t: Node) {
    super()
    this._id = id;
    this.source = s
    this.target = t
    if (s !== t) {
      s.outEdges.add(this)
      t.inEdges.add(this)
    } else {
      s.selfEdges.add(this)
    }
  }

  setLineId(lineId: number) {this._lineId = lineId}

  get data() {
    return this.getAttr(AttributeRegistry.EdgeDataIndex)
  }

  setData(data: EdgeData) {
    this.setAttr(AttributeRegistry.EdgeDataIndex, data)
  }

  add() {
    if (this.source !== this.target) {
      this.source.outEdges.add(this)
      this.target.inEdges.add(this)
    } else {
      this.source.selfEdges.add(this)
    }
  }
  remove() {
    if (this.source !== this.target) {
      this.source.outEdges.delete(this)
      this.target.inEdges.delete(this)
    } else {
      this.source.selfEdges.delete(this)
    }
  }
  toString(): string {
    return '(' + this.source.toString() + '->' + this.target.toString() + ')'
  }
  isInterGraphEdge(): boolean {
    return this.source.parent !== this.target.parent
  }

  EdgeToAncestor(): ToAncestorEnum {
    if (this.source instanceof Graph) {
      if (this.target.isDescendantOf(<Graph>this.source)) return ToAncestorEnum.FromAncestor
    }
    if (this.target instanceof Graph) {
      if (this.source.isDescendantOf(<Graph>this.target)) return ToAncestorEnum.ToAncestor
    }
    return ToAncestorEnum.None
  }
}
