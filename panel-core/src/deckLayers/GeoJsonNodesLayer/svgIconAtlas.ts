import { getFittedDimensions } from './nodeGeometry';

const MAX_ICON_SOURCE_SIZE = 1020;
const ICON_ATLAS_WIDTH = 1024;
const SAFE_ICON_ATLAS_HEIGHT = 4096;
const ICON_ATLAS_BUFFER = 4;
const ICON_SOURCE_SIZE_TIERS = [1020, 508, 252, 124, 60, 28, 12, 4, 1];

function svgToDataURL(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getSvgViewBox(svgElement: SVGElement, fallbackWidth?: number, fallbackHeight?: number) {
  const currentViewBox = svgElement.getAttribute('viewBox');
  if (currentViewBox) {
    return currentViewBox;
  }

  const widthAttr = Number(svgElement.getAttribute('width'));
  const heightAttr = Number(svgElement.getAttribute('height'));
  const width = widthAttr || fallbackWidth;
  const height = heightAttr || fallbackHeight;

  return width && height ? `0 0 ${width} ${height}` : undefined;
}

function getSizedSvgMarkup(svgIcon, { width, height }: { width: number; height: number }) {
  if (!svgIcon?.svgText) {
    return null;
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(svgIcon.svgText, 'image/svg+xml');
  const svgElement = xmlDoc.getElementsByTagName('svg')[0];

  if (!svgElement) {
    return null;
  }

  const viewBox = getSvgViewBox(svgElement, svgIcon.width, svgIcon.height);
  if (viewBox) {
    svgElement.setAttribute('viewBox', viewBox);
  }

  svgElement.setAttribute('width', String(width));
  svgElement.setAttribute('height', String(height));
  svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  return new XMLSerializer().serializeToString(svgElement);
}

function getPackedSvgIcon(svgIcon, sourceBoxSize: number) {
  if (!svgIcon?.svgDataUrl) {
    return null;
  }

  const fittedSize = getFittedDimensions(sourceBoxSize, svgIcon.width, svgIcon.height);
  const packedSize = {
    width: Math.max(1, Math.round(fittedSize.width)),
    height: Math.max(1, Math.round(fittedSize.height)),
  };
  const packedSvg =
    getSizedSvgMarkup(svgIcon, packedSize) ??
    `
  <svg width="${packedSize.width}" height="${packedSize.height}"
    viewBox="0 0 ${packedSize.width} ${packedSize.height}"
    xmlns="http://www.w3.org/2000/svg">
    <image href="${svgIcon.svgDataUrl}" x="0" y="0"
      width="${packedSize.width}" height="${packedSize.height}"
      preserveAspectRatio="xMidYMid meet" />
  </svg>`;

  return {
    svgText: packedSvg,
    svgDataUrl: svgToDataURL(packedSvg),
    width: packedSize.width,
    height: packedSize.height,
  };
}

function getNodeIconAtlasSourceSize(
  entryCount: number,
  options?: { requiredDisplaySize?: number; devicePixelRatio?: number; qualityMargin?: number }
) {
  const normalizedEntryCount = Math.max(1, Math.ceil(entryCount));
  const requiredDisplaySize = Math.max(1, options?.requiredDisplaySize ?? 1);
  const devicePixelRatio = Math.max(1, options?.devicePixelRatio ?? 1);
  const qualityMargin = Math.max(1, options?.qualityMargin ?? 1.5);
  const requiredSourceSize = Math.min(MAX_ICON_SOURCE_SIZE, requiredDisplaySize * devicePixelRatio * qualityMargin);
  const ascendingTiers = [...ICON_SOURCE_SIZE_TIERS].reverse();

  for (const sourceSize of ascendingTiers) {
    if (sourceSize < requiredSourceSize) {
      continue;
    }
    const cellSize = sourceSize + ICON_ATLAS_BUFFER;
    const columnCount = Math.max(1, Math.floor(ICON_ATLAS_WIDTH / cellSize));
    const rowCount = Math.ceil(normalizedEntryCount / columnCount);

    if (rowCount * cellSize <= SAFE_ICON_ATLAS_HEIGHT) {
      return sourceSize;
    }
  }

  for (let index = ascendingTiers.length - 1; index >= 0; index--) {
    const sourceSize = ascendingTiers[index];
    const cellSize = sourceSize + ICON_ATLAS_BUFFER;
    const columnCount = Math.max(1, Math.floor(ICON_ATLAS_WIDTH / cellSize));
    if (Math.ceil(normalizedEntryCount / columnCount) * cellSize <= SAFE_ICON_ATLAS_HEIGHT) {
      return sourceSize;
    }
  }

  return 1;
}

export { getNodeIconAtlasSourceSize, getPackedSvgIcon, svgToDataURL };
