import {isVisible, makeColorDarker, makeColorLighter, toRGB4Array} from '../../utils';
import {colTypes} from "mapLib/utils";
import { PathLayer } from '@deck.gl/layers';
import {BBOX_OUTLINE_COLOR, BBOX_OUTLINE_WIDTH, SEL_LINE_WIDTH_MULTIPLIER} from "mapLib/utils";
import {PathStyleExtension} from "@deck.gl/extensions";
import {toJS} from "mobx";

function MyPathLayer(props) {
    const {onHover, options, highlightColor, data, index, id, name, pickable = false, type, theme2, getVisLayers } = props
    const Path = name ? isVisible(getVisLayers, {index: null, name, group: colTypes.Path}) : true;

    const units = options.common?.isMeters ? "meters" : "pixels"
    return new PathLayer({
        visible: ['par-path-extension', 'par-path-line'].includes(type) ? true : Path,
        id: id ?? (colTypes.Path + '-'+ type + index),
        //order,
        data,
        autoHighlight: true,
        highlightColor,
        pickable: ['par-path-extension', 'par-path-line'].includes(type) ? false : pickable,
        //widthScale: 20,
        widthMinPixels: 0.5,
        capRounded: true,
        jointRounded: true,
        getPath: (d: any) => {
            switch (type) {
                case 'par-path-extension':
                    return d[0] //.geometry.coordinates.reduce((acc,cur)=> acc.concat(cur), [])//d
                    break
                case 'par-path-line':
                    return d[0] // coords
                    break
                default:
                    return d.geometry.coordinates
        }
        },
        getDashArray: type === 'par-path-extension' ? [5, 8] : null,
        dashJustified: true,
        dashGapPickable: true,
        //@ts-ignore
        extensions: [new PathStyleExtension({dash: true})],

        //@ts-ignore
        getColor: (d: any) => {

            switch (type) {
                case 'par-path-extension':
                    const ecolor = theme2.isDark ? makeColorLighter(d[1]) : makeColorDarker(d[1])
                    return ecolor
                    break
                case 'par-path-line':
                    const pcolor =  theme2.isDark ? makeColorLighter(d[1]) : makeColorDarker(d[1])
                    return pcolor
                    break
                case 'bbox':
                    return  toRGB4Array(BBOX_OUTLINE_COLOR)
                default:

                    const {style} = d.properties
                    const {color, opacity, group} = style
                    return toRGB4Array(group?.color ?? color, opacity)
            }

        },
          //  widthScale: 1.1,
        widthUnits: units,
        getWidth: (d: any) => {
            switch (type) {
                case 'par-path-extension':
                    return d[2] * SEL_LINE_WIDTH_MULTIPLIER
                    break
                case 'par-path-line':
                    return d[2] * SEL_LINE_WIDTH_MULTIPLIER
                    break
                case 'bbox':
                    return BBOX_OUTLINE_WIDTH
                    break
                /// path layer
                default:
                    const {style} = d.properties
                    return style.size
            }
            },
            //widthMaxPixels: 7,

        onHover,
    })
}

export { MyPathLayer };
