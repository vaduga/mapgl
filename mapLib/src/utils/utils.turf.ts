function SingleCoordsConvert(pathItem: any, panel: any, mode2D = true) {
    if (pathItem.id) {  // node
        const wasmId = pathItem.data.wasmId
        const lng = panel.positions[wasmId*2]
        const lat = panel.positions[wasmId*2+1]
        if (lng !== undefined && !lat !== undefined) {return [lng, lat]}
    } else if (Array.isArray(pathItem)) {
        return mode2D ? pathItem.slice(0,2) : pathItem}

    return null
}

function CoordsConvert(subPath: any, wasmIds: number[], positions: Float64Array, mode2D = true) {

    let p =  subPath.map((p: any, i: number)=> {
        if (typeof p === 'string') {
        const wasmId = wasmIds[i]
            const lng = positions[wasmId*2]
            const lat = positions[wasmId*2+1]
            if (lng !== undefined && !lat !== undefined) {return [lng, lat]}
            return [lng,lat]
        } else if (Array.isArray(p)) {
            return mode2D ? p.slice(0,2) : p}
        return null}).filter((el: any)=>el)

    return p

}

export {
    CoordsConvert, SingleCoordsConvert
}

