import {
    toRGB4Array, makeColorDarker, makeColorLighter
} from '../../utils';
import {Unit} from 'deck.gl'
import {Edge} from 'mapLib'
import {colTypes, RGBAColor, ALERTING_STATES} from "mapLib/utils";
import AnimatedBlobsLayer from "./animated-blobs-layer";
import GradientArcLayer from "./gradient-arc-layer";
import {DataFilterExtension} from "@deck.gl/extensions";
import {Matrix4} from "@math.gl/core";
export const MyArcLayer = (props) => {
    const {
        srcGraphId,
        lineFeatures,
        onHover,
        pickable,
        autoHighlight,
        highlightColor,
        time,
        isBase, baseLayer, theme,
        options,
        getVisLayers,
        getGroupsLegend,
        getSelEdges,
        visible
    } = props;

    const categories= getVisLayers.getCategories()
    const categorySize = 1

    type BartSegment = {
        properties
    };

    const lTheme = baseLayer?.options?.config?.theme
    const isAuto = !lTheme || lTheme === 'auto'
    const isDark = isAuto ? theme.isDark : lTheme === 'dark'

    const getColor =  (dir: 'sideA' | 'sideB', d): RGBAColor => {

        const {edgeStyle, arcStyle} = d.properties
        const all_annots =  d.properties.all_annots
        const {group, color} = arcStyle[dir]
        const opacity = edgeStyle.opacity
        const c = group?.color ?? color
        let muted = [...c] as RGBAColor;
        muted[3] = opacity !== undefined ? Math.round(opacity * 255) : muted[3];

        if (all_annots && !getGroupsLegend?.at(-1)?.disabled) {
            const annotState = all_annots?.[0]?.newState
            const color = annotState?.startsWith('Normal') ? ALERTING_STATES.Normal : annotState === 'Alerting' ? ALERTING_STATES.Alerting : ALERTING_STATES.Pending
            return toRGB4Array(color, 1)
        }

        const alterColor = (color)=> {
            return isDark ? makeColorLighter(color) : makeColorDarker(color)
        }

        if (getSelEdges?.find(el=>el.lineId === d.id) && isBase) { //d.edgeId
            muted = alterColor(muted) as RGBAColor
        }
        return isBase ? muted : alterColor(muted) as RGBAColor
    }
    const units: Unit = options.common?.isMeters ? "meters" : "pixels"

    const getWidth = (d)=> {
        const {arcStyle} = d.properties
    const getLineWidth = (dir) => {
        const { size } = arcStyle[dir];
        return size
    };
    const lineWidthA = getLineWidth('sideA');
    const lineWidthB = getLineWidth('sideB');
    const size = Math.max(lineWidthA, lineWidthB)
    return size * (getSelEdges?.find((el: Edge)=> el.id === d.edgeId) ? 2.2 : 1)
}
    const getHeight = (d: BartSegment)=> {
        const arcStyle = d?.properties.arcStyle
        const heightCoef = arcStyle?.arcConfig?.height;
        return heightCoef ?? 0.5
    }

    const layerProps = {
        visible,
        highlightColor,
        onHover,
        data: lineFeatures,
        getWidth,
        getHeight,
        getSourceColor: (d: BartSegment) => getColor('sideA', d),
        getTargetColor: (d: BartSegment) => getColor('sideB', d),
        getFilterCategory: d => {
            const {style, layerName, root} = d.properties
            return layerName
        },

        updateTriggers: {
            getLineColor: time,
            getTextColor: time,
            getFillColor: time
        },
        filterCategories: categories,
        extensions: [new DataFilterExtension({categorySize})],
        // Styles
        widthUnits: units,
        widthScale: 1,
        widthMinPixels: 0.1,
        //lineWidthMaxPixels: 15,
        // Interactive props
        pickable,
        autoHighlight,
    }

    return isBase?
        new GradientArcLayer({
            ...layerProps,
            id: colTypes.Edges+'-arc-base'+srcGraphId,

        })
        :
        new AnimatedBlobsLayer({ //<BartSegment>
        ...layerProps,
        id: colTypes.Edges+'-arc-blobs'+srcGraphId,
        //@ts-ignore
        getSourceArrow: (d: BartSegment) => d.properties.arcStyle?.sideA.arrow ?? 0,
        getTargetArrow: (d: BartSegment) => d.properties.arcStyle?.sideB.arrow ?? 0,
        // @ts-ignore
        getFrequency: d => 10,
        animationSpeed: 5,
        tailLength: 0.1,
        coef: 0.8,
    });
};

