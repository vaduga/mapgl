import {isVisible, toRGB4Array} from '../../utils';
import {PolygonLayer} from '@deck.gl/layers';
import {colTypes, DARK_HULL_HIGHLIGHT, LIGHT_HULL_HIGHLIGHT} from "mapLib/utils";

const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
};

const MyPolygonsLayer = (props) => {
    const {
        data,
        getSelectedFeIndexes,
        highlightColor,
        onHover,
        iconMapping = ICON_MAPPING,
        colType = colTypes.Polygons,
        theme2,
        panel,
        getVisLayers,
        index,
        name,
        pickable,
        options
    } = props;

    const Poly = isVisible(getVisLayers, {index: null, name, group: colTypes.Polygons})
    const units = options.common?.isMeters ? "meters" : "pixels"
    // @ts-ignore
    return new PolygonLayer({
        visible: colType === colTypes.Hull ? true : Poly,
        highlightColor,
        // Interactive props
        pickable,
        //autoHighlight: colType !== colTypes.Hull,
        id: colType+'-'+index,
        //order,
        iconMapping,
        data,
        onHover,
        // onClick: ()=> {
        //     setHoverInfo({})
        //     setHoverCluster(null)
        //     setTooltipObject({});
        // },
        selectedFeatureIndexes: getSelectedFeIndexes?.[colTypes.Polygons] ?? [],
        getPolygon: (d: any) => colType === colTypes.Hull ? d : d.geometry.coordinates,
        filled: true,
        lineWidthUnits: units,
        stroked: colType !== colTypes.Hull,
        // @ts-ignore
        getFillColor: (d) => {
            if (colType === colTypes.Hull) {
                return toRGB4Array(theme2.isDark ? DARK_HULL_HIGHLIGHT : LIGHT_HULL_HIGHLIGHT, 1)
            }

            const {style} = d.properties
            const {color, group, opacity} = style
            return toRGB4Array(group?.color ?? color, opacity)
        },
        //extruded: true,
        getElevation: (d)=> d.properties?.height ?? 0,
        // lineWidthMaxPixels: 1,
        //getLineWidth: 1,
        getLineColor: (d: any) => {
            const {style} = d.properties
            const {color, opacity, group} = style
            return toRGB4Array(group?.color ?? color, opacity)
        },
        getPointRadius: 100,
        getLineWidth: (d: any) =>{
            const {style} = d.properties
            return style.size
        },
    });
};

export { MyPolygonsLayer };
