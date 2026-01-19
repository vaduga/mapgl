import {Graph as G} from 'mapLib'
import {
  toRGB4Array,
} from '../../utils';
import {DeckLine} from 'mapLib'
import { GeoJsonLayer } from '@deck.gl/layers';
import {Geometry} from "geojson";
import {colTypes, PointFeatureProperties, RGBAColor, ALERTING_STATES} from "mapLib/utils";
import {DataFilterExtension} from "@deck.gl/extensions";
import {Matrix4} from "@math.gl/core";


export const EdgesGeojsonLayer = (props) => {
  const {
    srcGraphId,
    getSelectedIdxs,
    linesCollection,
    onHover,
    pickable,
    autoHighlight,
    highlightColor,
    time,
    options,
    visible,
    getVisLayers,
    getGroupsLegend,
    panel
  } = props;

  const selectedFeatureIndexes = getSelectedIdxs?.get(colTypes.Edges)?.[srcGraphId] ?? []

  const categories= getVisLayers.getCategories()
  const categorySize = 1

  const units = options.common?.isMeters ? "meters" : "pixels"
  return new GeoJsonLayer({
    visible,
    highlightColor,
    onHover,
    id: colTypes.Edges+'-view'+srcGraphId,
    data: linesCollection,
    updateTriggers: {
      getLineColor: time,
      getTextColor: time,
      getFillColor: time
    },
    getFilterCategory: d => {
      const {style, layerName, root} = d.properties || {}
      return layerName
    },
    filterCategories: categories,
    extensions: [new DataFilterExtension({categorySize})],
    getLineWidth: (d, k)=> {
      const {edgeStyle} = d.properties
      return selectedFeatureIndexes.includes(k.index) ? edgeStyle.size * 2 : edgeStyle.size
    },
    // @ts-ignore
    getLineColor: (d: DeckLine<Geometry, PointFeatureProperties>): RGBAColor => {

      const {edgeStyle, all_annots} = d.properties
      const {color, group, opacity} = edgeStyle

      if (all_annots && !getGroupsLegend?.at(-1)?.disabled) {
        const annotState = all_annots?.[0]?.newState
        const color = annotState?.startsWith('Normal') ? ALERTING_STATES.Normal : annotState === 'Alerting' ? ALERTING_STATES.Alerting : ALERTING_STATES.Pending
        return toRGB4Array(color, 1)
      }

      // group is defined only if nodes/edge metric field match
      const c = group?.color ?? color
      const muted = [...c] as RGBAColor;
      muted[3] = opacity !== undefined ? Math.round(opacity * 255) : muted[3];
      return muted
    },

    // Styles
    lineWidthUnits: units,
    lineWidthScale: 1,
    lineWidthMinPixels: 0.1,
    //lineWidthMaxPixels: 15,

    // Interactive props
    pickable,
    autoHighlight,
  });
};

