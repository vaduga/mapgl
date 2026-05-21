import { AttributeRegistry } from './attributeRegistry';
import { Graph } from './graph';
import { Entity, Label, type Node } from '@msagl/core';
import { BiColProps, CoordRef } from '../types';

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
  edgeId: string;
  edge_id: number; // wasm
  parPath: CoordRef[];
  dataRecord: BiColProps;
  rxEdgeId?: string;
  rPath?: CoordRef[];
  rWasmNodeIds?: number[];
};

export class Edge extends Entity {
  private _id: string;
  /** the unique, in the parent graph, id of the edge */
  public get id(): string {
    return this._id;
  }

  private _lineId: number | undefined;
  private _arcId: number | undefined;
  private _tiltDist?: number | undefined;
  private _isOutgoing?: boolean | undefined;

  public get lineId(): number | undefined {
    return this._lineId;
  }
  public get arcId(): number | undefined {
    return this._arcId;
  }
  public get tiltDist(): number | undefined {
    return this._tiltDist;
  }
  public get isOutgoing(): boolean | undefined {
    return this._isOutgoing;
  }

  label: Label | undefined;
  source: Node;
  target: Node;
  constructor(id: string, s: Node, t: Node) {
    super();
    this._id = id;
    this.source = s;
    this.target = t;
    if (s !== t) {
      (s.outEdges as Set<any>).add(this);
      (t.inEdges as Set<any>).add(this);
    } else {
      (s.selfEdges as Set<any>).add(this);
    }
  }

  setLineId(lineId: number) {
    this._lineId = lineId;
  }
  setArcId(arcId: number) {
    this._arcId = arcId;
  }

  setTiltDist(dist: number, isOutgoing: boolean) {
    this._tiltDist = dist;
    this._isOutgoing = isOutgoing;
  }

  get data() {
    return this.getAttr(AttributeRegistry.EdgeDataIndex);
  }

  setData(data: EdgeData) {
    this.setAttr(AttributeRegistry.EdgeDataIndex, data);
  }

  add() {
    if (this.source !== this.target) {
      (this.source.outEdges as Set<any>).add(this);
      (this.target.inEdges as Set<any>).add(this);
    } else {
      (this.source.selfEdges as Set<any>).add(this);
    }
  }
  remove() {
    if (this.source !== this.target) {
      (this.source.outEdges as Set<any>).delete(this);
      (this.target.inEdges as Set<any>).delete(this);
    } else {
      (this.source.selfEdges as Set<any>).delete(this);
    }
  }
  toString(): string {
    return '(' + this.source.toString() + '->' + this.target.toString() + ')';
  }
  isInterGraphEdge(): boolean {
    return this.source.parent !== this.target.parent;
  }

  EdgeToAncestor(): ToAncestorEnum {
    if (this.source instanceof Graph) {
      if (this.target.isDescendantOf(this.source as Graph)) {
        return ToAncestorEnum.FromAncestor;
      }
    }
    if (this.target instanceof Graph) {
      if (this.source.isDescendantOf(this.target as Graph)) {
        return ToAncestorEnum.ToAncestor;
      }
    }
    return ToAncestorEnum.None;
  }
}
