import {Attribute} from './attribute'
import {AttributeRegistry} from './attributeRegistry'
import {Entity} from './entity'
import {Feature} from "../utils/interfaces";

export type Data = {
    wasmId: number;
    rxPtId?: number;
    feature?: Feature;
}

export class NodeData extends Attribute {
    clone(): Attribute {
        throw new Error('Method not implemented.')
    }
    rebind(e: Entity): void {
        this.entity = e
        this.bind(AttributeRegistry.NodeDataIndex)
    }

    constructor(entity: Entity, data: Data) {
        super(entity, AttributeRegistry.NodeDataIndex)
        this.data = data
    }
    static getFeatData(attrCont: Entity): NodeData {
        return attrCont?.getAttr(AttributeRegistry.NodeDataIndex)
    }
    data: Data
}
