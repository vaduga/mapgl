import {
    collectGroups,
    getGraphLayers,
    loadSvgIcons,
    newUniqueIconNames, toRGB4Array,
} from "./utils.plugin";
import {Graph} from 'mapLib'
import {LineTextLayer} from "../deckLayers/TextLayer/text-layer";
import {MyIconLayer} from "../deckLayers/IconLayer/icon-layer";
import {MyArcLayer} from "../deckLayers/ArcLayer/arc-layer";
import {GeoJsonLayer, PathLayer, TextLayer} from "@deck.gl/layers";
import OrthoLayer from "../deckLayers/OrthoLayer/ortho-layer";
import {NS_SEPARATOR, DeckLine} from 'mapLib/utils'
import { Rule } from "editor/Groups/rule-types";
import {NodesGeojsonLayer} from "../deckLayers/GeoJsonNodesLayer/nodes-geojson-layer";
import {EdgesGeojsonLayer} from "../deckLayers/GeoJsonEdgesLayer/edges-geojson-layer";
import {EdgeArrowLayer} from "../deckLayers/ArrowLayer/edge-arrow-layer";
import {GeomapPanel} from "../GeomapPanel";
import {colTypes} from "mapLib/utils"
import {VisLayers} from "../store/visLayers";

async function genPrimaryLayers({
                              biCols,
                              lineFeatures,
                              commentFeatures,
                              layerProps
                          }) {

    let comments
    const lines: any[] = [];
    const arcsBase: any[] = [];
    const edgeLabels: any[] = [];
    const {
        theme,
        baseLayer,
        options,
        getVisLayers,
        isHyper,
        panel,
        isLogic,
    } = layerProps

    const icons: (GeoJsonLayer | OrthoLayer)[] = []

    const nodeLayer = NodesGeojsonLayer
    const lineLayer = EdgesGeojsonLayer
    const showGraph = isVisible(getVisLayers, {index: null, name: 'graph', group:'graph'});

    for (const col of biCols ?? []) {
            icons.push(
                isLogic ?
                    new OrthoLayer({
                        ...layerProps,
                        biCol: col,
                        visible: showGraph
                    })
                    : nodeLayer({
                        ...layerProps,
                        biCol: col,
                        visible: showGraph,
                    })
            );
    }


    /// Edges render

    const visible = showGraph && isVisible(getVisLayers, {index: null, name: colTypes.Edges, group: colTypes.Edges})

    if (lineFeatures && Object.keys(lineFeatures).length) {
        for (const [srcGraphId, features] of Object.entries(lineFeatures)) {
            if (!(features as DeckLine[])?.length) continue;

            if (!isHyper) {
                const props = {
                    ...layerProps,
                    srcGraphId,
                    lineFeatures: features,
                    visible,
                };

                lines.push(MyArcLayer(props));
                arcsBase.push(MyArcLayer({ ...props, isBase: true }));

                edgeLabels.push(
                    LineTextLayer({
                        getVisLayers,
                        id: srcGraphId,
                        data: features,
                        visible,
                        type: 'arcLabels',
                        options,
                        baseLayer,
                        theme,
                    })
                );
            } else {
                const linesCollection = {
                    type: 'FeatureCollection' as const,
                    features: (features as DeckLine[]).filter(Boolean),
                };

                const props = {
                    ...layerProps,
                    srcGraphId,
                    linesCollection,
                    visible,
                };

                lines.push(lineLayer(props));
                lines.push(EdgeArrowLayer(props));

            }
        }
    }

    if (commentFeatures?.length && isHyper) {
        comments = MyIconLayer({
            ...layerProps,
            data: commentFeatures
        })
     }

    return [icons, arcsBase, lines, comments, edgeLabels]

}

async function initGroups(groups: Rule[], layers, svgIcons, theme, loadController: AbortController, reload = false) {
    const nsLayers = layers?.slice(1) //reload ? 1 : 0)

    const iconNames = new Set<string>();

    collectGroups(groups, iconNames, nsLayers, theme)

    const newNames = newUniqueIconNames(svgIcons, iconNames)
    if (newNames.length) {
        await loadSvgIcons(newNames, svgIcons, loadController)
    }

}

function isVisible(getVisLayers, args: { index: number | null; name: string | null; group: string | null }) {
    const { index, name, group } = args;

    const [visible, indeterminate] =
    getVisLayers.getVisState(index, name, group) ?? [true, false];

    return visible && !indeterminate;
}


function genVisLayers(panel: GeomapPanel, props) {
    const {groups, isLogic, graph, hasAnnots, useMockData} = panel
    const {options, replaceVariables} = props
    const dataLayers = options.dataLayers
    const visLayers = new VisLayers()

    /// Layer Switcher

    const userLayers: {[key:string]: number} = {}
    if (dataLayers?.length ) {
        const nodeLayers = dataLayers?.filter(l => l.type === colTypes.Markers);
        const nodesCollections =  nodeLayers?.reduce((acc, el, index) => {
            acc.push([el, index]);
            return acc;
        }, []);

        const userColTypes = [...new Set((isLogic ? nodeLayers : dataLayers).map(el => el.type))]
        userColTypes.forEach((type:any) => {
            userLayers[type] = visLayers.addLayer(type, type,type, false ,true,false, null,false); /// parent idx
        });

        dataLayers.forEach(layer => {
            const parentIdx = userLayers[layer.type];
            if (parentIdx !== undefined) {
                visLayers.addLayer(layer.name, layer.name,layer.type, false,true,false, parentIdx,false)
            }
        });

        if (nodesCollections.length) {
            createDerivedLayers(visLayers, graph, isLogic, replaceVariables, useMockData);
        }
    }

    return visLayers
}

function createDerivedLayers (visLayers: VisLayers, graph: Graph, isLogic, replaceVariables, useMockData = false) {

    const hasComments = graph && !isLogic && graph.getComments.length

   visLayers.addLayer('graph', 'graph','graph',false,true,false,null,false)


    const hyperVar = useMockData ? '1' : replaceVariables(`$routed`)
    const parsed = parseInt(hyperVar, 10);
    const isHyper = !isNaN(parsed) && parsed > 0;

    const parentIdx = null
    visLayers.addLayer(colTypes.Circle, colTypes.Circle, colTypes.Circle,false ,true,false, parentIdx , false)
    visLayers.addLayer(colTypes.SVG, colTypes.SVG, colTypes.SVG,false ,true,false, parentIdx ,false)
    visLayers.addLayer(colTypes.Label, colTypes.Label, colTypes.Label,false ,true,false, parentIdx ,false)
    hasComments && visLayers.addLayer(colTypes.Comments, colTypes.Comments, colTypes.Comments,false ,true,false, parentIdx ,false)
    visLayers.addLayer(colTypes.Edges, colTypes.Edges, colTypes.Edges,false ,true,false, parentIdx ,false)
    visLayers.addLayer(colTypes.Hyperedges, colTypes.Hyperedges, colTypes.Hyperedges,false , isHyper,false, parentIdx , false)
};



export {
    genPrimaryLayers, initGroups, isVisible,  genVisLayers, createDerivedLayers
}
