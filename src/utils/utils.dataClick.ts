import {Graph} from 'mapLib'
import {ViewState} from "mapLib/utils";
import {BiColProps} from "mapLib/utils";

export const expandTooltip = (info: any, panel:any, eventBus: any, map: any, dataClickProps: any, selectGotoHandler: any) => {
    const {setSelCoord,
        setIsShowCenter,
        setTooltipObject,
        setLocalViewState,
        pId
    } = dataClickProps
    const position = info.coordinate
    if (position) {
        const [longitude, latitude,] = position.map((e: number) => parseFloat(e.toFixed(6)))

        setSelCoord(
            {
                coordinates: [longitude, latitude],
                type: "Point"
            })
    }

    if (info.picked) {
        let { object, featureType, index, layer: deckLayer} = info;
        const {comId, edgeId} = object || {}
        let props = object?.properties ?? object
        let rowIndex

        const points = !props?.cluster && deckLayer?.props.data.points
        if (points && (featureType === 'points' || info.viewport?.id === '3d-scene') && index !== -1)  {
            const featureIds = points.featureIds
            const features = panel.features
            const idx = featureIds?.value[index]

            props = (features as BiColProps[])[idx]
            rowIndex = props?.rowIndex

            // for pinned tooltip
            object = {
                index,
                rowIndex,
                properties: features[idx]
            }
        }

        /// skip in favor of onClick in editable layers
        if (!props || info.object?.properties?.guideType) {return}
        const {frameRefId, locName, layerName, root} = props || {}

        const subGraph: Graph | undefined = props.root ?? info.object?.properties?.root // ?? for comments features
        const edge = subGraph?.nodeCollection?.getEdgesMap[edgeId]
        const eNode = edge?.['source']

        if (comId) {
            const {index} = props
            if (eNode) selectGotoHandler({pId, value: eNode.id, eventBus, select: true, fly: false, edge})
            return
        }

        if (locName) {
            const nodeMap = subGraph?.nodeCollection?.getNodeMap
            const node = eNode ?? nodeMap?.get(locName) ?? subGraph
            const feature = subGraph?.data?.feature ?? node?.data.feature
            const geom = feature?.geometry
            const OSM = map?.getZoom && map?.getZoom()
            if (geom)
            {
                const [longitude, latitude] = geom?.center ?? geom?.coordinates
                setIsShowCenter(
                    {
                        longitude,
                        latitude,
                        zoom: OSM ? OSM : 18,
                        bearing: 0,
                        pitch: 0
                    }
                )
            }

            setTooltipObject({...info, object}); // this pins tooltip

            if (node) selectGotoHandler({pId, value: node.id, graphId: subGraph?.id, eventBus, select: true, fly: false, edge})


        } else if (!props?.isHull) {
            // zoom on cluster click
            const {expZoom,exp_x,exp_y} = props || {}
            if (exp_x === undefined || !expZoom) {return}

            const newState = {
                longitude:exp_x,
                latitude:exp_y,
                target: [exp_x, exp_y],
                zoom: expZoom,
                yZoom: expZoom +1,
                transitionDuration: 250,
                rnd: Math.random()   /// to trigger zoom in/out on repeat click the same cluster
            }
            setLocalViewState(newState as ViewState);
        }

    } else {
        // reset tooltip by clicking blank space
        setIsShowCenter(null)
        selectGotoHandler({pId, eventBus, select: true})
        setTooltipObject({});
    }
}
