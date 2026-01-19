import {Attribute} from './attribute'
import {AttributeRegistry} from './attributeRegistry'
import {Entity} from './entity'
import {BiColProps, CoordRef, Feature} from "../utils/interfaces";

export type Data = {
    edge_id?: number,
    parPath: CoordRef[],
    rPath?: CoordRef[],
    rWasmNodeIds?: number[]
    dataRecord: BiColProps[]
}



export class EdgeData extends Attribute {
    dataRecord: any;
    clone(): Attribute {
        throw new Error('Method not implemented.')
    }
    rebind(e: Entity): void {
        this.entity = e
        this.bind(AttributeRegistry.EdgeDataIndex)
    }

    constructor(entity: Entity, data: Data) {
        super(entity, AttributeRegistry.EdgeDataIndex)
        this.data = data
    }
    static getEdgeData(attrCont: Entity): EdgeData {
        return attrCont?.getAttr(AttributeRegistry.EdgeDataIndex)
    }
    data: Data
}
