import { FIXED_COLOR_LABEL } from '../../types/defaults';

export type SvgTintMode = 'none' | 'markup' | 'canvasTint';

export type SvgIconVariant = {
  svgDataUrl: string;
  svgText?: string;
  width?: number;
  height?: number;
};

export type SvgIconRecord = SvgIconVariant & {
  colorVariants?: Record<string, SvgIconVariant>;
  colorVariantPromises?: Record<string, Promise<SvgIconVariant | undefined>>;
};

export function svgToDataURL(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function resolveSvgTintMode(
  svgIcon: SvgIconRecord | undefined,
  requestedMode: SvgTintMode = 'none'
): SvgTintMode {
  void svgIcon;
  if (requestedMode === 'none') {
    return 'none';
  }

  return requestedMode;
}

export function getTintedSvgIcon(
  svgIcon: SvgIconRecord | undefined,
  color?: string,
  opts?: { mode?: SvgTintMode; onReady?: () => void; renderSize?: number }
): SvgIconVariant | undefined {
  if (!svgIcon || !color || color === FIXED_COLOR_LABEL) {
    return svgIcon;
  }

  const mode = resolveSvgTintMode(svgIcon, opts?.mode ?? 'none');
  if (mode === 'none') {
    return svgIcon;
  }
  const cacheKey = `${mode}:${color}${mode === 'canvasTint' && opts?.renderSize ? `:${opts.renderSize}` : ''}`;

  svgIcon.colorVariants ??= {};
  const cached = svgIcon.colorVariants[cacheKey];
  if (cached) {
    return cached;
  }

  if (mode === 'canvasTint') {
    svgIcon.colorVariantPromises ??= {};
    if (!svgIcon.colorVariantPromises[cacheKey]) {
      svgIcon.colorVariantPromises[cacheKey] = renderCanvasTintedSvgIcon(svgIcon, color, opts?.renderSize)
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
  const variant = {
    svgText,
    svgDataUrl,
    width: width ? parseInt(width, 10) : undefined,
    height: height ? parseInt(height, 10) : undefined,
  };
  svgIcon.colorVariants[cacheKey] = variant;
  return variant;
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

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function getCanvasTintSize(width: number, height: number, renderSize?: number) {
  if (!renderSize || !width || !height) {
    return { width, height };
  }

  const scale = renderSize / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function renderCanvasTintedSvgIcon(
  svgIcon: SvgIconRecord,
  color: string,
  renderSize?: number
): Promise<SvgIconVariant | undefined> {
  if (!svgIcon.svgDataUrl) {
    return undefined;
  }

  const image = await loadImageElement(svgIcon.svgDataUrl);
  const sourceWidth = svgIcon.width ?? image.naturalWidth ?? image.width;
  const sourceHeight = svgIcon.height ?? image.naturalHeight ?? image.height;
  const { width, height } = getCanvasTintSize(sourceWidth, sourceHeight, renderSize);

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

  //// add width and height
  const svgElement = xmlDoc.getElementsByTagName('svg')[0];

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
