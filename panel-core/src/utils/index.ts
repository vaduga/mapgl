import { svgToDataURL } from '../deckLayers/utils/svg';

export function addSVGattributes(svgText: string, replaceUse = false) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(svgText, 'image/svg+xml');

  if (replaceUse) {
    const useElements = xmlDoc.querySelectorAll('use');
    useElements.forEach((useElement) => {
      const href = useElement.getAttribute('xlink:href');
      if (href && href.startsWith('#')) {
        const symbol = xmlDoc.getElementById(href.substring(1));
        if (symbol) {
          const symbolContent = symbol.innerHTML;
          useElement.parentNode?.replaceChild(
            parser.parseFromString(symbolContent, 'image/svg+xml').documentElement,
            useElement
          );
        }
      }
    });
  }

  const svgElement = xmlDoc.getElementsByTagName('svg')[0];
  let width = svgElement.getAttribute('width');
  let height = svgElement.getAttribute('height');
  const viewBox = svgElement.getAttribute('viewBox');
  if ((!width || !height) && viewBox) {
    const viewBoxValues = viewBox.split(' ').map(parseFloat);
    width = viewBoxValues[2]?.toString();
    height = viewBoxValues[3]?.toString();

    svgElement.setAttribute('width', width);
    svgElement.setAttribute('height', height);
  }

  const svgTextMod = new XMLSerializer().serializeToString(xmlDoc);
  const svgDataUrl = svgToDataURL(svgTextMod);
  return { svgText: svgTextMod, svgDataUrl, width, height };
}

export * from './actions';
export * from './bus.events';
export * from './layers';
export * from './map';
export * from './plugin';
export * from './provider';
export * from './svgIconManager';
