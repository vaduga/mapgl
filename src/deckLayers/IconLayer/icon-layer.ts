import {isVisible, toRGB4Array} from '../../utils';
import { IconLayer } from '@deck.gl/layers';
import { colTypes } from 'mapLib/utils';
import {svgToDataURL} from "../OrthoLayer/donutChart";
import {DataFilterExtension} from "@deck.gl/extensions";

const MyIconLayer = (props) => {
  const {
    data,
    getSelectedFeIndexes,
    onHover,
    highlightColor,
    panel,
    getVisLayers,
  } = props;

  const visible = isVisible(getVisLayers, {index: null, name: colTypes.Comments, group: colTypes.Comments})
  const categories = getVisLayers.getCategories()

const svgico = svgToDataURL(`
<svg fill="#000000" height="800px" width="800px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
\t viewBox="0 0 512.051 512.051" xml:space="preserve">
<g>
\t<g>
\t\t<g>
\t\t\t<path d="M256.026,102.4c9.412,0,17.067-7.654,17.067-17.067c0-9.412-7.654-17.067-17.067-17.067
\t\t\t\tc-9.412,0-17.067,7.654-17.067,17.067C238.959,94.746,246.613,102.4,256.026,102.4z"/>
\t\t\t<path d="M298.692,307.2h-17.067c-4.719,0-8.533-3.814-8.533-8.533V162.176c0-4.727-3.849-8.576-8.576-8.576h-34.091
\t\t\t\tc-4.71,0-8.533,3.823-8.533,8.533c0,4.71,3.823,8.533,8.533,8.533h17.067c4.719,0,8.533,3.814,8.533,8.533v119.467
\t\t\t\tc0,4.719-3.814,8.533-8.533,8.533h-17.067c-4.71,0-8.533,3.823-8.533,8.533s3.823,8.533,8.533,8.533h68.267
\t\t\t\tc4.71,0,8.533-3.823,8.533-8.533S303.403,307.2,298.692,307.2z"/>
\t\t\t<path d="M332.826,0h-153.6C113.348,0,59.759,53.589,59.759,119.467v153.6c0,65.877,53.589,119.467,119.467,119.467h28.032
\t\t\t\tc8.064,0,14.635,6.571,14.635,14.635v84.403c0,9.088,5.589,16.725,14.251,19.482c2.125,0.674,4.267,0.998,6.374,0.998
\t\t\t\tc6.468,0,12.552-3.089,16.512-8.695l52.489-74.368c13.969-19.806,34.133-34.432,58.3-42.291
\t\t\t\tc49.331-16.051,82.475-61.722,82.475-113.63v-153.6C452.292,53.589,398.703,0,332.826,0z M256.026,51.2
\t\t\t\tc18.825,0,34.133,15.309,34.133,34.133c0,18.825-15.309,34.133-34.133,34.133s-34.133-15.309-34.133-34.133
\t\t\t\tC221.892,66.509,237.201,51.2,256.026,51.2z M298.692,341.333h-68.267c-14.114,0-25.6-11.486-25.6-25.6s11.486-25.6,25.6-25.6
\t\t\t\th8.533v-102.4h-8.533c-14.114,0-25.6-11.486-25.6-25.6s11.486-25.6,25.6-25.6h34.091c14.14,0,25.643,11.503,25.643,25.643
\t\t\t\tv127.957h8.533c14.114,0,25.6,11.486,25.6,25.6S312.806,341.333,298.692,341.333z"/>
\t\t</g>
\t</g>
</g>
</svg>
`)
  return new IconLayer({
    visible,
    highlightColor,
    onHover,
    id: colTypes.Comments,
    getIcon: () => ({
      url: svgico,
      width: 128,
      height: 128,
      mask: true
    }),
    data,
    selectedFeatureIndexes: getSelectedFeIndexes?.get(colTypes.Comments) ?? [],
    getPosition: (d: any) => d.geometry.coordinates,
    // @ts-ignore
    getColor: (d: any) => {
      const {iconColor} = d.properties
      return toRGB4Array(iconColor)
        },
    getSize: (d) => 5,
    sizeUnits: 'meters',
    sizeScale: 0.4,
    sizeMinPixels: 5,
    sizeMaxPixels: 45,
    getFilterCategory: d => {
      const {style, layerName} = d?.properties
      return layerName
    },
    filterCategories: categories,
    extensions: [new DataFilterExtension({categorySize: 1})],


// Interactive props
    pickable: true,
    autoHighlight: true,
  });
};

export { MyIconLayer };
