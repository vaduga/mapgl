import turfbbox from '@turf/bbox';
import { FeatSource } from 'mapLib';
import { colTypes, RGBAColor, FIXED_COLOR_LABEL } from 'mapLib/utils';
import { FieldType, SelectableValue } from '@grafana/data';
import { svgToDataURL } from '../deckLayers/OrthoLayer/donutChart';
import { MarkersConfig } from '../layers/data/markersLayer';
import { Rule } from '../editor/Groups/rule-types';
import { MapLayerState, PLUGIN_ID, SvgTintMode } from '../types';

type SvgIconVariant = {
  svgDataUrl: string;
  svgText?: string;
  width?: number;
  height?: number;
};

type SvgIconRecord = SvgIconVariant & {
  colorVariants?: Record<string, SvgIconVariant>;
  colorVariantPromises?: Record<string, Promise<SvgIconVariant | undefined>>;
};

function parseObjFromString(str) {
  // Regular expression to extract key-value pairs
  const regex = /(\w+)\s*=\s*(\w+)/g;
  const matches = str.match(regex);

  // Create an object to store key-value pairs
  const obj: any = {};

  if (!matches) {
    return obj; // Return null if no matches found
  }

  // Iterate over matches and populate the object
  matches.forEach((match) => {
    const [_, key, value] = match.match(/(\w+)\s*=\s*(\w+)/);
    obj[key] = value;
  });

  return obj;
}

function makeColorLighter(color: RGBAColor) {
  if (!Array.isArray(color) || color.length !== 4) {
    return [145, 145, 45, 255]; // Default to a lighter opaque yellow
  }
  return color.map(
    (value, index) => (index === 3 ? Math.min(value, 255) : Math.min(value + 45, 255)) // Lighten RGB, keep alpha unchanged
  ) as RGBAColor;
}

function makeColorDarker(color: RGBAColor) {
  if (!Array.isArray(color) || color.length !== 4) {
    return [55, 55, 0, 255]; // Default to a darker opaque yellow
  }
  return color.map(
    (value, index) => (index === 3 ? Math.min(value, 255) : Math.max(value - 45, 0)) // Darken RGB, keep alpha unchanged
  ) as RGBAColor;
}

const toRGB4Array = (hexColor: string, opacity?): RGBAColor => {
  if (!hexColor) {
    return [0, 0, 0, 0];
  }
  const rgbStr = hexToRgba(hexColor);
  const matches = (rgbStr as string)?.match(/[\d.]+/g);
  if (!matches || matches.length < 3) {
    return [0, 0, 0, 0];
  }

  const rgba = matches.slice(0).map(Number) as RGBAColor;
  rgba[3] = opacity !== undefined ? Math.round((rgba[3] ?? 1) * 255 * opacity) : (rgba[3] ?? 1) * 255;

  return rgba;
};

function hexToRgba(hexColor) {
  //if (!hexColor) {return hexColor}
  // Remove the "#" character from the beginning of the hexColor string
  if (hexColor.startsWith('#')) {
    hexColor = hexColor.slice(1);
  }

  // Check if the hexColor string includes an alpha channel value
  let alpha = 1;
  if (hexColor.length === 8) {
    alpha = parseInt(hexColor.substr(6, 2), 16) / 255;
    hexColor = hexColor.substr(0, 6);
  }

  // Convert the hexColor string to separate red, green, and blue components
  const red = parseInt(hexColor.substr(0, 2), 16);
  const green = parseInt(hexColor.substr(2, 2), 16);
  const blue = parseInt(hexColor.substr(4, 2), 16);

  // Return the RGBA color value in the "rgba(r, g, b, a)" format
  if (alpha !== 1) {
    return `rgba(${red},${green},${blue},${alpha.toFixed(2)})`;
  } else {
    return `rgb(${red},${green},${blue})`;
  }
}

function parseRoute(dsTarget) {
  if (typeof dsTarget === 'string' && (dsTarget.startsWith('[') || !parseInt(dsTarget, 10))) {
    try {
      return JSON.parse(dsTarget) ?? dsTarget;
    } catch (error) {
      return dsTarget ?? null;
    }
  } else {
    return dsTarget ?? null;
  }
}

function toRgbaString(arr) {
  if (!Array.isArray(arr) || arr.length < 3) {
    throw new Error('Input must be an array of exactly 4 elements.');
  }
  const alpha = arr[3] === undefined ? 1 : Math.max(0, Math.min(arr[3], 255)) / 255;
  return `rgba(${arr[0]}, ${arr[1]}, ${arr[2]}, ${alpha})`;
}

function replaceSvgPaintDeclarations(cssText: string, color: string) {
  return cssText.replace(/\b(fill|stroke)\s*:\s*(?!none\b)(?!url\()/gi, `$1:${color}`);
}

function replaceSvgPaintInStyleAttribute(styleValue: string, color: string) {
  return styleValue.replace(/\b(fill|stroke)\s*:\s*(?!none\b)(?!url\()([^;]+)/gi, (_, prop) => `${prop}:${color}`);
}

function recolorSvgMarkup(svgText: string, color: string) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgElement = xmlDoc.getElementsByTagName('svg')[0];

  if (!svgElement) {
    return svgText;
  }

  svgElement.setAttribute('color', color);

  xmlDoc.querySelectorAll('style').forEach((styleNode) => {
    if (styleNode.textContent) {
      styleNode.textContent = replaceSvgPaintDeclarations(styleNode.textContent, color);
    }
  });

  xmlDoc.querySelectorAll('*').forEach((element) => {
    const fill = element.getAttribute('fill');
    if (fill && fill !== 'none' && !fill.startsWith('url(')) {
      element.setAttribute('fill', color);
    }

    const stroke = element.getAttribute('stroke');
    if (stroke && stroke !== 'none' && !stroke.startsWith('url(')) {
      element.setAttribute('stroke', color);
    }

    const styleValue = element.getAttribute('style');
    if (styleValue) {
      element.setAttribute('style', replaceSvgPaintInStyleAttribute(styleValue, color));
    }
  });

  return new XMLSerializer().serializeToString(xmlDoc);
}

function resolveSvgTintMode(
  svgIcon: SvgIconRecord | undefined,
  requestedMode: SvgTintMode = 'none'
): SvgTintMode {
  void svgIcon;
  if (requestedMode === 'none') {
    return 'none';
  }

  return requestedMode;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function renderCanvasTintedSvgIcon(svgIcon: SvgIconRecord, color: string): Promise<SvgIconVariant | undefined> {
  if (!svgIcon.svgDataUrl) {
    return undefined;
  }

  const image = await loadImageElement(svgIcon.svgDataUrl);
  const width = svgIcon.width ?? image.naturalWidth ?? image.width;
  const height = svgIcon.height ?? image.naturalHeight ?? image.height;

  if (!width || !height) {
    return undefined;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return undefined;
  }

  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = color;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'destination-in';
  context.drawImage(image, 0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return {
    svgDataUrl: canvas.toDataURL('image/png'),
    width,
    height,
  };
}

function getTintedSvgIcon(
  svgIcon: SvgIconRecord | undefined,
  color?: string,
  opts?: { mode?: SvgTintMode; onReady?: () => void }
): SvgIconVariant | undefined {
  if (!svgIcon || !color || color === FIXED_COLOR_LABEL) {
    return svgIcon;
  }

  const mode = resolveSvgTintMode(svgIcon, opts?.mode ?? 'none');
  if (mode === 'none') {
    return svgIcon;
  }
  const cacheKey = `${mode}:${color}`;

  svgIcon.colorVariants ??= {};
  const cached = svgIcon.colorVariants[cacheKey];
  if (cached) {
    return cached;
  }

  if (mode === 'canvasTint') {
    svgIcon.colorVariantPromises ??= {};
    if (!svgIcon.colorVariantPromises[cacheKey]) {
      svgIcon.colorVariantPromises[cacheKey] = renderCanvasTintedSvgIcon(svgIcon, color)
        .then((variant) => {
          if (variant) {
            svgIcon.colorVariants![cacheKey] = variant;
            opts?.onReady?.();
          }
          delete svgIcon.colorVariantPromises?.[cacheKey];
          return variant;
        })
        .catch(() => {
          delete svgIcon.colorVariantPromises?.[cacheKey];
          return undefined;
        });
    }

    return svgIcon;
  }

  if (!svgIcon.svgText) {
    return svgIcon;
  }

  const recoloredSvgText = recolorSvgMarkup(svgIcon.svgText, color);
  const { svgText, svgDataUrl, width, height } = addSVGattributes(recoloredSvgText);
  const variant = { svgText, svgDataUrl, width: width ? parseInt(width) : undefined, height: height ? parseInt(height) : undefined };
  svgIcon.colorVariants[cacheKey] = variant;
  return variant;
}

function getFirstCoordinate(geojson) {
  if (!geojson) {
    return undefined;
  }

  if (geojson.type === 'Point') {
    return geojson.coordinates;
  } else if (geojson.type === 'MultiPoint' || geojson.type === 'LineString') {
    return geojson.coordinates[0];
  } else if (geojson.type === 'Polygon' || geojson.type === 'MultiLineString') {
    return geojson.coordinates[0][0];
  } else if (geojson.type === 'MultiPolygon') {
    return geojson.coordinates[0][0][0];
  }

  return undefined;
}

function genRndNums(n: number, count: number): number[] {
  if (count <= 0 || count > n + 1) {
    //console.error('Invalid count of numbers requested.');
    return [];
  }
  const uniqueNumbers: Set<number> = new Set();
  while (uniqueNumbers.size < count) {
    const randomNumber = Math.floor(Math.random() * (n + 1));
    uniqueNumbers.add(randomNumber);
  }
  return Array.from(uniqueNumbers);
}

function addSVGattributes(svgText: string, replaceUse = false) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(svgText, 'image/svg+xml');

  if (replaceUse) {
    // Find the first symbol element
    const symbol = xmlDoc.querySelector('symbol');

    const useElements = xmlDoc.querySelectorAll('use');
    // Iterate over each use element
    useElements.forEach((useElement) => {
      const href = useElement.getAttribute('xlink:href');
      // Check if the use element references a symbol
      if (href && href.startsWith('#')) {
        // Find the corresponding symbol
        const symbolId = href.substring(1);
        const symbol = xmlDoc.getElementById(symbolId);
        if (symbol) {
          // Replace the use element with the content of the symbol
          const symbolContent = symbol.innerHTML;
          useElement.parentNode?.replaceChild(
            parser.parseFromString(symbolContent, 'image/svg+xml').documentElement,
            useElement
          );
        }
      }
    });
  }

  //// add width and height
  let svgElement = xmlDoc.getElementsByTagName('svg')[0];

  let width = svgElement.getAttribute('width');
  let height = svgElement.getAttribute('height');
  const viewBox = svgElement.getAttribute('viewBox');
  // If non, get width and height from the viewBox attribute
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

const genValuesWithIncrement = (
  start: number,
  end: number,
  increment: number,
  slowStart = false
): SelectableValue[] => {
  const values: SelectableValue[] = [];
  let currentIncrement = slowStart ? 0.1 : increment;

  for (let value = start; value <= end; value += currentIncrement) {
    const roundedValue = parseFloat(value.toFixed(1));
    values.push({ value: roundedValue, label: roundedValue.toString() });

    // Switch to the provided increment after reaching 1
    if (roundedValue === 1) {
      currentIncrement = increment;
    }
  }

  return values;
};

async function parseSvgFileToString(
  svgIconName: string,
  uController: AbortController
): Promise<[string, SvgIconRecord] | null> {
  const signal = uController.signal;
  if (!svgIconName) {return null;}

  const isPublic = svgIconName.startsWith('public/');
  const localName = isPublic ? svgIconName : `public/plugins/${PLUGIN_ID}/img/icons/${svgIconName}.svg`;
  const svgFilePath = svgIconName.startsWith('http') ? svgIconName : localName;

  try {
    const response = await fetch(svgFilePath, { signal });
    if (signal.aborted) {throw new DOMException('Aborted', 'AbortError');}

    if (!response.ok) {
      throw new Error(`Failed to fetch SVG file. Status: ${response.status}`);
    }

    const svgString = await response.text();
    if (signal.aborted) {throw new DOMException('Aborted', 'AbortError');}

    const { svgText, svgDataUrl, width, height } = addSVGattributes(svgString);
    if (signal.aborted) {throw new DOMException('Aborted', 'AbortError');}

    return [
      svgIconName,
      {
        svgText,
        svgDataUrl,
        ...(width ? { width: parseInt(width) } : {}),
        ...(height ? { height: parseInt(height) } : {}),
      },
    ];
  } catch (error: any) {
    if (error?.name === 'AbortError') {throw error;}
    return null;
  }
}

async function loadSvgIcons(
  names: string[],
  svgIcons: Record<string, any>,
  loadController: AbortController
): Promise<Record<string, any>> {
  if (!names?.length) {return svgIcons;}

  try {
    const promises: Array<Promise<[string, SvgIconRecord] | null>> =
      names.map((name) => parseSvgFileToString(name, loadController));

    const res = await Promise.all(promises);

    res
      .filter((v): v is [string, SvgIconRecord] => v !== null)
      .forEach(([name, obj]) => {
        svgIcons[name] = obj;
      });

    return svgIcons;
  } catch (err: any) {
    if (err?.name === 'AbortError') {return svgIcons;} // silent abort
    throw err;
  }
}

function collectGroups(allGroups: Rule[], iconNames: Set<string>, nsLayers: MapLayerState[] | undefined, theme) {
  nsLayers?.forEach((layer) => {
    const groups: Rule[] = [];
    const featSource = layer.layer as FeatSource;

    const { style, groups: rules } = layer.options.config as MarkersConfig; //|| {}

    const { useGroups, color } = style || {};
    const { field, fixed } = color || {};
    if (useGroups) {
      rules?.forEach((rule: Rule) => {
        const gCopy = { ...rule, groupIdx: allGroups.length };
        groups.push(gCopy);
        allGroups.push(gCopy);
        if (rule.iconName) {iconNames.add(rule.iconName);}
      });
    }
    if (!field && fixed) {
      const hexColor = theme.visualization.getColorByName(fixed);
      const fixedGroup = {
        label: 'fix-' + hexColor,
        color: hexColor,
        groupIdx: allGroups.length,
        isEph: true,
        overrides: [
          {
            name: 'thrColor',
            type: FieldType.enum,
            value: [FIXED_COLOR_LABEL], //hexColor
          },
        ],
      };
      groups.push(fixedGroup);
      allGroups.push(fixedGroup);
    }
    featSource.setGroups(groups);
  });
}

function newUniqueIconNames(oldSvgIcons: Record<string, any>, newIconNames: Set<string>): string[] {
  return [...newIconNames].filter((icon) => !oldSvgIcons?.[icon]);
}

async function fillAnnots(locLabelName, annotations) {
  const { desc, escape, op, table } = await import('arquero');

  const newAnnots: any = [];
  try {
    annotations?.forEach((frame) => {
      const fields = frame.fields;
      if (fields) {
        const tableData = fields.reduce((acc, field) => {
          if (['time', 'timeEnd', 'text', 'color', 'newState', 'alertId', 'data'].includes(field.name)) {
            acc[field.name] = field.values;
          }
          return acc;
        }, {});

        const dataTable = table(tableData);
        const annotTable = dataTable
          .derive({
            alertName: escape((row, data) => parseObjFromString(row.text).alertname),
            instance: escape((row, data) => parseObjFromString(row.text).instance),
            //labels: escape((row, data) => parseObjFromString(row.text)),
          })
          .select('alertName', 'alertId', 'instance', 'time', 'timeEnd', 'color', 'newState', 'data') //'labels'
          ?.orderby(desc('timeEnd'));

        const maxAlertId = annotTable.rollup({ maxAlertId: op.max('alertId') }).get('maxAlertId', 0);

        for (let alertId = 0; alertId <= maxAlertId; alertId++) {
          const filteredAnnotTable = annotTable.filter(escape((row, data) => row.alertId === alertId));
          if (filteredAnnotTable.size) {
            const annotByInstance = filteredAnnotTable.groupby(locLabelName);

            newAnnots.push([filteredAnnotTable, annotByInstance]);
          }
        }
      }
    });
  } catch (e) {
    //console.log(err=> err)
  }

  return newAnnots;
}

function initBinaryProps(panel) {
  const ptLayers = getGraphLayers(panel);

  let newLen =
    ptLayers?.reduce((sum, el) => {
      const refId = el.options?.query?.options ?? el.query?.options;
      return sum + (refId ? panel.props.data.series.find((s) => s.refId === refId)?.length || 0 : 0);
    }, 0) ?? 0;

  const customQuery = panel.props.data?.request?.targets[0];

  const isSnapshot = customQuery?.queryType === 'snapshot';
  if (!newLen && isSnapshot) {
    newLen = customQuery?.snapshot?.[0]?.data.values[0]?.length;
  }
  if (!newLen && ptLayers?.length) {
    const s = panel.props.data?.series[0];
    if (s?.length && !panel.useMockData) {
      newLen = s.length; //dashboard DS
    } else if (panel.useMockData) {
      newLen = 8; /// mockEdgeGraphData len
    }
  }

  panel.positions = new Float64Array(newLen * 2);
  panel.colors = new Uint8Array(newLen * 4);
  panel.muted = new Uint8Array(newLen * 4);
  panel.annots = new Uint8Array(newLen * 4);
  panel.groupIndices = new Uint8Array(newLen);
}

function cutBinaryProps(panel) {
  const end = panel.vCount;
  panel.positions = panel.positions.slice(0, end * 2)
  panel.colors = panel.colors.slice(0, end * 4);
  panel.muted = panel.colors.slice(0, end * 4);
  panel.annots = panel.annots.slice(0, end * 4);
  panel.groupIndices = panel.groupIndices.slice(0, end);
}

function getGraphLayers(panel) {
  const dataLayers = panel.layers.length ? panel.layers.slice(1) : panel.props.options.dataLayers; /// init vs update layers config
  return dataLayers?.filter((el) => el.options?.type === colTypes.Markers || el.type === colTypes.Markers) ?? [];
}

function getBounds(panel, features) {
  const featureCollection = {
    type: 'FeatureCollection',
    features: features.map((f) => {
      if (f.type) {
        return { type: 'Feature', geometry: f.geometry };
      }
      const id = f.id;
      const positions = panel.positions;
      const lng = positions[id * 2];
      const lat = positions[id * 2 + 1];
      return { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] } };
    }),
  };

  //  bounds;
  return turfbbox(featureCollection as any);
}

export {
  toRGB4Array,
  genRndNums,
  getFirstCoordinate,
  hexToRgba,
  makeColorLighter,
  makeColorDarker,
  parseRoute,
  genValuesWithIncrement,
  loadSvgIcons,
  toRgbaString,
  parseObjFromString,
  addSVGattributes,
  fillAnnots,
  newUniqueIconNames,
  collectGroups,
  initBinaryProps,
  cutBinaryProps,
  getGraphLayers,
  getBounds,
  getTintedSvgIcon,
  resolveSvgTintMode,
};
