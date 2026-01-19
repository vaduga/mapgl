
import { ScatterplotLayer } from '@deck.gl/layers';
import {toRGB4Array} from "../../utils";
import {DARK_CENTER_PLOT, LIGHT_CENTER_PLOT} from "mapLib/utils";


const MyCenterPlot = (props)=> {

    const {
        getIsShowCenter: isShowCenter,
        theme
    } = props;

    const {longitude, latitude} = isShowCenter;
if (!longitude || !latitude) {return}

    return new ScatterplotLayer({
        id: 'centerplot-layer',
        data: [{coordinates: [longitude, latitude]}],
        pickable: false,
        opacity: 0.2,
        stroked: false,
        filled: true,
        radiusScale: 5,
        radiusMinPixels: 1,
        radiusMaxPixels: 18,
        lineWidthMinPixels: 1,
        getPosition: (d: any) => d.coordinates,
        getRadius: (d: any) => Math.sqrt(d.exits),
        getFillColor: (d: any) => toRGB4Array(theme.isDark ? DARK_CENTER_PLOT : LIGHT_CENTER_PLOT, 1),
        getLineColor: (d: any) => [0, 0, 0],
    });
}


export { MyCenterPlot };
