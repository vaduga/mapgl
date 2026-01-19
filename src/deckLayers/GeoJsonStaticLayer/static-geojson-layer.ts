import {isVisible, toRGB4Array} from '../../utils';
import { GeoJsonLayer } from '@deck.gl/layers';
import {colTypes} from "mapLib/utils";


const MyGeoJsonLayer = (props) => {
    const {
        data,
        onHover,
        highlightColor,
        index,
        name,
        pickable,
        getVisLayers,
        options
    } = props;

const Geo =  isVisible(getVisLayers, {index: null, name, group: colTypes.GeoJson});
    const units = options.common?.isMeters ? "meters" : "pixels"

    return new GeoJsonLayer({
        id: colTypes.GeoJson+index,
        //order,
        visible: Geo,
        data,
        pickable,
        onHover,
        //autoHighlight: true,
        highlightColor,
        stroked: true,
        filled: true,
        extruded: false,
        getElevation: d=> {
            return d.properties?.height ?? 0
        },
        pointType: 'circle',
        //lineWidthScale: 20,
        //lineWidthMinPixels: 2,
        //@ts-ignore
        getFillColor: (d: any) => {
            const {style} = d.properties
            const {color, group, opacity} = style
            const thresholdColor = group?.color ?? color
            return toRGB4Array(thresholdColor, opacity)
        },
        //@ts-ignore
        getLineColor: (d: any) => {
            const {style} = d.properties
            const {color, group, opacity} = style
            const thresholdColor = group?.color ?? color
            return toRGB4Array(thresholdColor, 1)
        },
        getPointRadius: 100,
        textSizeUnits: units,
        iconSizeUnits: units,
        pointRadiusUnits: units,
        lineWidthUnits: units,

        getLineWidth: (d: any) =>{
            const {style} = d.properties
            return style.size
        },
    });
};

export { MyGeoJsonLayer };
