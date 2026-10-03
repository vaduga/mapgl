import { AttributeRegistry } from './attributeRegistry';
import { Entity } from '@msagl/core/dist/structs/entity.js';
import type { Node } from '@msagl/core';

export class Edge extends Entity {
  private _id: string;
  /** the unique, in the parent graph, id of the edge */
  public get id(): string {
    return this._id;
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

  get data() {
    return this.getAttr(AttributeRegistry.EdgeDataIndex);
  }

  toString(): string {
    return '(' + this.source.toString() + '->' + this.target.toString() + ')';
  }
}
