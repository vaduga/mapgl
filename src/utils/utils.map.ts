import {getAppEvents} from "@grafana/runtime";
import {MapLayerState, MapViewConfig} from "../types";
import {centerPointRegistry, MapCenterID} from "../view";
import {Position} from "geojson";
import {WebMercatorViewport} from "@deck.gl/core";
import {FeatSource, AttributeRegistry } from "mapLib";
import {colTypes, DEFAULT_CLUSTER_SCALE, ViewState} from "mapLib/utils";
import {handlerProps} from "../components/Selects/ReactSelectSearch";
import {AppEvents} from "@grafana/data";

import {SelectNodeEvent} from "./bus.events";
import {getBounds} from "./utils.plugin";


/** For Yamaps3 external script loading
 * Extra security measure to check if the script has
 * already been included in the DOM
 */
const scriptAlreadyExists = () =>
    document.querySelector('script#ymaps3-script') !== null

/**
 * Append the script to the document.
 * Whenever the script has been loaded it will
 * set the isLoaded state to true.
 */
const appendYaScript = (yMapsKey: string | undefined, onLoadCallback) => {
    const script = document.createElement('script')
    script.id = 'ymaps3-script'
    script.src = `https://api-maps.yandex.ru/3.0/?apikey=${yMapsKey}&lang=en_EN`
    script.async = true
    script.onload = () => onLoadCallback(true)
    document.body.append(script)
};

function initViewExtent(view: ViewState, config: MapViewConfig, width, height, layers, visLayers, panel) {
    const v: any = centerPointRegistry.getIfExists(config.id);
    if (v) {
        let { lon, lat, zoom } = v;
        let coord: Position | undefined = undefined
        if (v.lat == null) {   // maplibre can''t handle nuls
            if (v.id === MapCenterID.Coordinates) {
                coord = [config.lon ?? 0, config.lat ?? 0];
            } else if (v.id === MapCenterID.Fit) {
                const viewport = new WebMercatorViewport({ width, height });

                let minLng, minLat, maxLng, maxLat
                const configZoom = config.zoom ?? config.maxZoom;
                const maxZoom = (configZoom && configZoom > 0) ? configZoom: 18


                    const extent = getLayersExtent(layers, config.allLayers, config.lastOnly, config.layer);
                    [minLng, minLat, maxLng, maxLat] = getBounds(panel, extent) || []


                if ([minLng, minLat, maxLng ,maxLat].every(el=>el !==undefined)) {
                    const bounds = [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]];
                    const padding = config.padding ?? 5;

                    try {
                        const denormalizedZoom = denormalizeZoom(!panel.isLogic, maxZoom);
                        ({ longitude:lon, latitude: lat, zoom } = viewport.fitBounds(bounds, {maxZoom: denormalizedZoom, padding}));

                    }
                    catch (e) {
                        // console.log(`fit bounds for maxZoom ${maxZoom} and padding ${padding} error: `, e)
                        const appEvents = getAppEvents();
                        appEvents.publish({
                            type: AppEvents.alertWarning.name,
                            payload: [`fit bounds for maxZoom ${maxZoom} and padding ${padding} error: out of bounds?`],
                        });
                    }
                }

                // if no query points in auto mode
                if (!lon) {
                    ({ lon, lat, zoom } = v);
                }
                coord = [ lon ?? 0, lat?? 0 ]

            } else {
                // TODO: view requires special handling
            }

        } else {
            coord = [v?.lon ?? 0, v?.lat ?? 0];
        }

        if (coord) {
            view.longitude = coord[0]
            view.latitude = coord[1]
        }
        if (zoom !== undefined) {
            view.zoom = zoom
            view.yZoom = zoom +1
        }

    }

    if (config.maxZoom) {
        view.maxZoom = config.maxZoom;
    }
    if (config.minZoom !== undefined) {
        view.minZoom =config.minZoom;
    }
    if (config.zoom && v?.id !== MapCenterID.Fit) {
        view.zoom = config.zoom;
        view.yZoom = config.zoom + 1;
    }

    if ([view.longitude, view.latitude, view.zoom].every(el=>el !==undefined)) {
        view.target = [view.longitude, view.latitude,  view.zoom!]; // for ortho logic view
    }

}


function getLayersExtent(
    layers: MapLayerState[] = [],
    allLayers = false,
    lastOnly = false,
    layer: string | undefined
): any {

    /// WAY TO OPTIMIZE THE GRAPH, but we have other layers (polygons, geojson, etc)
    // /// ALL LAYERS
    // if (allLayers) {
    //     return panel.positions
    //     // Return everything from all layers
    //     //return (l as FeatSource).features //?? [];
    // }
    // const positionRanges = (l as FeatSource).positionRanges
    // //// LASTONLY
    // const lastIdx = positionRanges[positionRanges.length-1].at(-1)
    // if (lastIdx !== undefined) {
    //     return [lastIdx]
    // }
    // /// ONE LAYER
    // const layerPositions = positionRanges.flatMap(([min, max]) =>
    //     Array.from({ length: max - min + 1 }, (_, i) => min + i)
    // );
    // return layerPositions


    const res =  layers
        .filter((l) => !l.isBasemap)
        .flatMap((ll) => {
            const l = ll.layer;
            if (l) {    ///instanceof VectorLayer
                if (allLayers) {
                    // Return everything from all layers
                    return (l as FeatSource).features //?? [];
                } else if (lastOnly && layer === ll.options.name) {
                    // Return last only for selected layer
                    const feat = (l as FeatSource).features;
                    const featOfInterest = feat[feat.length - 1];
                    const geo = featOfInterest//?.getGeometry();
                    if (geo) {
                        return [geo] //?? [];
                    }
                    return [];
                } else if (!lastOnly && layer === ll.options.name) {
                    // Return all points for selected layer
                    return (l as FeatSource).features //?? [];
                }
                return [];
            } else {
                return [];
            }
        })
        //.reduce(extend, []);
    return res
}

const selectGotoHandler = async ({pId, value, graphId, eventBus, coord, select, fly, edge, zoomIn}: Partial<handlerProps>) => {
    const payload: SelectNodeEvent['payload'] = {
        ...(graphId !== undefined && { graphId }),
        ...(value !== undefined && { nodeId: value }),
        ...(select !== undefined && { select }),
        ...(edge !== undefined && { edgeId: edge.id }),
        ...(coord !== undefined && { coord }),
        ...(fly !== undefined && { fly }),
        ...(zoomIn !== undefined && { zoomIn }),
        pId: pId as number,
    };
    eventBus?.publish({
        type: 'selectNode',
        payload,
    });
};

function denormalizeZoom(isWebmercator, normalizedZoom) {
    if (isWebmercator) {
        return normalizedZoom;
    } else {
        // Transform [0, 17] to [-5, 5]
        return (normalizedZoom / 17) * 10 - 5;
    }
}


export {
    scriptAlreadyExists,
    appendYaScript, initViewExtent, getLayersExtent, selectGotoHandler
}
