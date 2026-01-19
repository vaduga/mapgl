
import {BiColProps, Comment, CommentsData, CoordRef} from "./interfaces";
import {Graph} from "../structs/graph";
import {Node} from "../structs/node";
import {Edge} from "../structs/edge";
import {
    GeomGraph,
    LayerDirectionEnum,
    layoutGeomGraph,
    SugiyamaLayoutSettings, Point as MSPoint, CurveFactory,
    GeomEdge, Graph as MSGraph,
} from "@msagl/core";

import {EdgeRoutingMode} from "@msagl/core/src/routing/EdgeRoutingMode";
import {Position} from "geojson";

import midpoint from "@turf/midpoint";

function sortAnnotations (annotations: any[]) {
    return annotations.sort((a, b) => {
        const stateOrder = { 'Alerting': 1, 'Pending': 2, 'Normal': 3 };

        const stateA = a.newState.startsWith('Alerting') ? 'Alerting' :
            a.newState.startsWith('Pending') ? 'Pending' : 'Normal';

        const stateB = b.newState.startsWith('Alerting') ? 'Alerting' :
            b.newState.startsWith('Pending') ? 'Pending' : 'Normal';

        return stateOrder[stateA] - stateOrder[stateB];
    })
}

interface PushPathProps {
    graphA: Graph;
    graphB: Graph;
    panel: any;
    parPath: CoordRef[];
    layerIdx?: number;
    edgeId?: string;
    dataRecord: BiColProps;
    commentsData: CommentsData;
    theme: any;
}

function pushPath (props: PushPathProps) {
    let {graphA,
        graphB, panel, parPath, layerIdx, edgeId: assignedEdgeId, dataRecord, commentsData, theme} = props
    const {isLogic, graph} = panel

    const {setEdge: setEdgeA, findNode: findNode} = graphA
    const findEdgeA = graphA.nodeCollection.findEdge

    const sourceId = parPath[0]
    const targetId = parPath.at(-1)

    if (typeof targetId !== 'string' || typeof sourceId !== 'string') {
        //console.warn('no src or target id in path: ', parPath)
        return
    }

    let sourceNode = findNode(sourceId)
    let targetNode = findNode(targetId)
    if (!targetNode || !sourceNode) {
        //console.warn(`no ${!targetNode ? 'target '+targetId : 'source '+sourceId} node in ${parPath}. isEdit: ${isEdit}`)
        return}

    const wasmVerticeIds: number | undefined[] = [];
    const nodes: string[] = []
    const parPathSan: CoordRef[] = []
    parPath.forEach( (coordRef: CoordRef, i: number )=> {
        const is_node = typeof coordRef === 'string'
        if (is_node) {
            const node = findNode(coordRef)
            if (node) {
                const wasmId = node.data.wasmId
                wasmVerticeIds.push(wasmId)
                nodes.push(coordRef)
                parPathSan.push(coordRef)
            }
            else {
               //console.warn(`Node ${coordRef} in parPath but not in "${graphA.id}" namespace?`)
            }
        }
        else if (!panel.isLogic && Array.isArray(coordRef)){
            wasmVerticeIds.push(undefined)
            parPathSan.push(coordRef)
        }

        }
        )
    if (!wasmVerticeIds.length) {return}

    const edgeId = assignedEdgeId ?? sourceId+'-'+targetId
    let edge = findEdgeA(edgeId)
    let edge_id
    if (!edge) {
        const newVerticeIds = wasmVerticeIds //createEdge(wasmVerticeIds, layerIdx, wrap, aMetric, bMetric, cMetric) // new Uint32Array(wasmVerticeIds),
        graph.getEdgeVerticeIds.push([newVerticeIds, layerIdx])

        edge_id = graph.getEdgeVerticeIds.length - 1

        const data =  {
            dataRecord,
            parPath: parPathSan,
            edge_id,
            edgeId
        }

        const multiEdges: Edge[] = []

        if (isLogic && nodes.length > 2) {
            const [segrPath, segrCoords] = parPath.length ? segregatePath(parPathSan, panel.positions, findNode) : []
            segrPath.forEach((frag: any, i: number) => {
                const idx = i ? '--'+i : ''
                const extraId = edgeId+ idx
                const start = frag[0].item.id
                const end = frag.at(-1).item.id
                const dummy = setEdgeA(extraId, start, end as string)
                if (dummy) {
                    dummy.setData(data)
                    multiEdges.push(dummy)
                }
            })
        }
        else {
            // @ts-ignore
            edge = setEdgeA(edgeId, sourceId, targetId, graphB)
            if (!edge) {
                console.warn('edge from rxdb not found in your datasource. Mixed namespaces? (edgeId, sourceId, targetId)', edgeId, sourceId, targetId)
                return}
            edge?.setData(data)
            multiEdges.push(edge)
        }
        graph.getWasmId2Edges[edge_id] = multiEdges

    }


    ///////// comments

            parPath.forEach((element: CoordRef, index: number) => {
                if (Array.isArray(element) && element.length > 2) {
                    const text = element[3] as string
                    const iconColor = element[4] as string;
                    const hexColor = iconColor && theme.visualization.getColorByName(iconColor);

                    const {style, layerName} = dataRecord || {}
                    if (text !== undefined && style) {
                        const comment: Comment = {
                            text,
                            iconColor: hexColor ?? '#4ec2fc',
                            style,
                            root: graphA,
                            layerName,
                            index,
                            coords: element.slice(0, 2) as [number, number],
                            edge
                        };
                        if (!commentsData[edgeId]) {
                            commentsData[edgeId] = new Map();
                        }
                        commentsData[edgeId].set(index, comment);
                    }
                }
            })
}

function segregatePath(path: any[], pathCoords: Position[] , findNode: any): any[] {
    if (path.length === 0) {return [[]]}
    const pathConverted = path.map((p, i)=> typeof p ==='string' ? findNode(p) : p).filter(el=>el)

    const subarrays: any[] = [];
    const coordsSubarrays: any[] = [];
    let currentSubarray: any[] = [];
    let currentCoordsSubarray: any[] = [];
    for (let i = 0; i < pathConverted.length; i++) {
        const item = pathConverted[i];
        const coords = pathCoords[i]
        if (!coords) {
            //console.log('no coords', item, coords);
            continue;
        }
        const isNode = item.id

        if (isNode) {
            if (currentSubarray.length > 0) {     // at least fromNode already exists
                currentSubarray.push({item, gIdx: i, coords})
                currentCoordsSubarray.push(pathCoords[i])

                subarrays.push(currentSubarray);
                coordsSubarrays.push(currentCoordsSubarray)
                currentSubarray = [];
                currentCoordsSubarray = [];
            }

        }
        currentSubarray.push({item, gIdx: i, coords});
        currentCoordsSubarray.push(coords);
        if (!coords) {
            //console.log('coordinates not found: ', item, coords, i , pathCoords[i], pathCoords);
        }

    }

    return [subarrays, coordsSubarrays];
}

type ParPathEl = string | Position;

function isString(el: ParPathEl): el is string {
    return typeof el === "string";
}

/**
 * Returns indices of all string sentinels in parPath
 */
function getStringIndices(parPath: ParPathEl[]) {
    return parPath
        .map((el, i) => (isString(el) ? i : -1))
        .filter(i => i !== -1);
}

function replaceSegmentsWithPolylines(
    parPath: ParPathEl[],
    oldWasmIds: number[],
    polylines: Position[][]
) {
    const stringIdx = getStringIndices(parPath);

    if (stringIdx.length < 2) {
        return { parPath, wasmIds: oldWasmIds };
    }

    if (polylines.length !== getStringIndices(parPath).length - 1) {
        console.warn("Polyline / segment mismatch", { polylines, parPath });
    }

    const newParPath: ParPathEl[] = [];
    const newWasmIds: number[] = [];

    let polylineCursor = 0;

    for (let s = 0; s < stringIdx.length - 1; s++) {
        const start = stringIdx[s];
        const end = stringIdx[s + 1];

        // keep the string sentinel
        newParPath.push(parPath[start]);
        newWasmIds.push(oldWasmIds[start]);

        const poly = polylines[polylineCursor++] ?? [];

        for (const pt of poly) {
            newParPath.push(pt);
            newWasmIds.push(undefined as any);
        }

        // skip everything between start+1 .. end-1 (raw coords removed)
    }

    // keep last string
    const lastIdx = stringIdx.at(-1)!;
    newParPath.push(parPath[lastIdx]);
    newWasmIds.push(oldWasmIds[lastIdx]);

    return { parPath: newParPath, wasmIds: newWasmIds };
}

function getSmoothPolyline(edge: any): Position[] {
    const geom = GeomEdge.getGeom(edge);
    if (!geom?.source) return [];

    return Array.from(geom.getSmoothPolyPoints())
        .slice(1, -1)
        .map((p: any) => [p.x, p.y]);
}

function runLayout(panel: any) {
const graph = panel.graph as MSGraph
    const rootGraph =  GeomGraph.getGeom(graph)
    rootGraph.layoutSettings = new SugiyamaLayoutSettings();
    //@ts-ignore
    rootGraph.layoutSettings.layerDirection = LayerDirectionEnum.RL;
    //@ts-ignore
    rootGraph.layoutSettings.LayerSeparation = 60;
    rootGraph.layoutSettings.commonSettings.NodeSeparation = 40;
    //geomGraph.layoutSettings.commonSettings.edgeRoutingSettings.EdgeRoutingMode = EdgeRoutingMode.Spline//.SugiyamaSplines//Spline //Rectilinear //.SugiyamaSplines


    //console.log('Clusters,', Array.from(rootGraph.Clusters), Array.from(graph.getClusteredConnectedComponents()))

    layoutGeomGraph(rootGraph)

    //@ts-ignore
    const {getEdgeVerticeIds, wasm2Edges} = (graph as Graph);

    wasm2Edges.forEach(edges => {
        const edge0 = edges[0];
        const edgeId = edge0.data.edge_id;

        const parPath = edge0.data.parPath;
        const oldWasmIds = getEdgeVerticeIds[edgeId][0];

        // collect one polyline per hyperedge segment
        const polylines = edges.map(getSmoothPolyline);

        const { parPath: newParPath, wasmIds } =
            replaceSegmentsWithPolylines(parPath, oldWasmIds, polylines);

        edge0.data.parPath = newParPath;
        getEdgeVerticeIds[edgeId][0] = wasmIds;
    });

    for (const e of rootGraph.deepEdges) {
        if (e.source === e.target) {
            //console.warn("⚠️ Self-loop detected:", e);
        }
        if (!e.curve) {
            //@ts-ignore
            //  g.remove(e.edge.source)
        }
    }

    for (const n of rootGraph.nodesBreadthFirst) {
            const node = (n.node as unknown as Node)
            if (!node.data) continue
            const {feature, wasmId: id} = node.data
            panel.positions[id*2] = n.center.x
            panel.positions[id*2+1] = n.center.y
    }

}

function paraboloid(distance: number, sourceZ: number, targetZ: number, ratio: number, instanceHeights: number) {
    const deltaZ = targetZ - sourceZ;
    const dh = distance * instanceHeights;

    if (dh === 0) {
        // No height multiplier, so we interpolate between source and target Z
        return sourceZ + deltaZ * ratio;
    }

    const unitZ = deltaZ / dh;
    const p2 = unitZ * unitZ + 1.0;

    // Handle negative deltaZ by reversing source and target positions
    const dir = deltaZ < 0 ? 1 : 0;
    const z0 = dir ? targetZ : sourceZ;
    const r = dir ? 1.0 - ratio : ratio;

    // Compute the height at the given ratio along the arc
    return Math.sqrt(r * (p2 - r)) * dh + z0;
}

function getMidpoint(
    sourcePosition: Position,
    targetPosition: Position,
    isLogic: boolean
): [number, number] {
    if (isLogic) {
        // Cartesian midpoint
        return [
            (sourcePosition[0] + targetPosition[0]) / 2,
            (sourcePosition[1] + targetPosition[1]) / 2,
        ];
    } else {
        // Geospatial midpoint via Turf
        const pt = midpoint(sourcePosition, targetPosition);
        return pt.geometry.coordinates as [number, number];
    }
}

export type { PushPathProps };

export {
    pushPath, sortAnnotations, paraboloid, segregatePath, runLayout, getMidpoint
};

