import { AttributeRegistry } from './attributeRegistry';
import { Entity } from '@msagl/core/dist/structs/entity';
import type { Node } from '@msagl/core';

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

  toString(): string {
    return '(' + this.source.toString() + '->' + this.target.toString() + ')';
  }
}
