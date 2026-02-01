import {svgToDataURL} from '../OrthoLayer/donutChart';

type IconMapping = {
  [key: string]: {
    mask: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    anchorX?: number;
    anchorY?: number;
  };
};

const svgAtlas = `<?xml version="1.0" encoding="utf-8"?>
<svg width="256" height="128" version="1.1" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 32" overflow="visible" xml:space="preserve">
<g> <rect fill="none" width="8" height="16"/> <polygon points="1.65,14.35 0.94,13.65 6.59,8 0.94,2.35 1.65,1.65 8,8 	"/>
</g>
<g> <rect x="8" fill="none" width="8" height="8"/> <polygon points="12.65,7.35 11.94,6.65 14.59,4 11.94,1.35 12.65,0.65 16,4 	"/>
</g>
<g> <rect x="8" y="8" fill="none" width="8" height="8"/> <polyline points="14.59,12 11.94,9.35 12.65,8.65 16,12 	"/>
</g>
<g> <rect x="16" fill="none" width="8" height="8"/> <polyline points="20,1 24,4 20,7 	"/>
</g>
<g> <rect x="48" fill="none" width="8" height="8"/> <path d="M50,3c0.55,0,1,0.45,1,1s-0.45,1-1,1s-1-0.45-1-1S49.45,3,50,3 M50,2c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S51.1,2,50,2 L50,2z"/>
</g>
<g> <rect x="48" y="8" fill="none" width="8" height="8"/> <path d="M51,10c1.1,0,2,0.9,2,2s-0.9,2-2,2s-2-0.9-2-2S49.9,10,51,10 M51,9c-1.66,0-3,1.34-3,3s1.34,3,3,3s3-1.34,3-3S52.66,9,51,9 L51,9z"/>
</g>
<g> <rect x="32" fill="none" width="8" height="16"/> <polyline points="36,3 40,8 36,13 	"/>
</g>
<g> <rect x="24" fill="none" width="8" height="8"/> <polyline points="26,2 32,4 26,6 	"/>
</g>
<g> <rect x="16" y="8" fill="none" width="8" height="8"/> <polyline points="20,9 24,12 20,12 	"/>
</g>
<g> <rect x="24" y="8" fill="none" width="8" height="8"/> <polyline points="26,10 32,12 26,12 	"/>
</g>
<g> <rect x="56" fill="none" width="8" height="8"/> <circle cx="58" cy="4" r="2"/>
</g>
<g> <rect x="56" y="8" fill="none" width="8" height="8"/> <circle cx="59" cy="12" r="3"/>
</g>
</svg>
`

export const iconAtlas = svgToDataURL(svgAtlas);

const imageScale = 1;

function scale(mapping: IconMapping, s: number): IconMapping {
  for (const key in mapping) {
    const m = mapping[key];
    m.x *= s;
    m.y *= s;
    m.width *= s;
    m.height *= s;
    if (m.anchorX) m.anchorX *= s;
    if (m.anchorY) m.anchorY *= s;
  }
  return mapping;
}

export const iconMapping = scale(
  {
    caret: {
      mask: true,
      x: 32,
      y: 0,
      width: 32,
      height: 32,
      anchorX: 32,
    },
    'half-caret': {
      mask: true,
      x: 32,
      y: 32,
      width: 32,
      height: 32,
      anchorX: 32,
    },
    'caret-lg': {
      mask: true,
      x: 0,
      y: 0,
      width: 32,
      height: 64,
      anchorX: 32,
    },
    triangle: {
      mask: true,
      x: 64,
      y: 0,
      width: 32,
      height: 32,
      anchorX: 32,
    },
    'triangle-ex': {
      mask: true,
      x: 64,
      y: 0,
      width: 32,
      height: 32,
    },
    'half-triangle': {
      mask: true,
      x: 64,
      y: 32,
      width: 32,
      height: 32,
      anchorX: 32,
    },
    'half-triangle-ex': {
      mask: true,
      x: 64,
      y: 32,
      width: 32,
      height: 32,
    },
    'triangle-n': {
      mask: true,
      x: 104,
      y: 4,
      width: 24,
      height: 24,
      anchorX: 24,
    },
    'triangle-n-ex': {
      mask: true,
      x: 96,
      y: 0,
      width: 32,
      height: 32,
      anchorX: 8,
    },
    'half-triangle-n': {
      mask: true,
      x: 96,
      y: 32,
      width: 32,
      height: 32,
      anchorX: 32,
    },
    'half-triangle-n-ex': {
      mask: true,
      x: 96,
      y: 32,
      width: 32,
      height: 32,
      anchorX: 8,
    },
    'triangle-w': {
      mask: true,
      x: 128,
      y: 0,
      width: 32,
      height: 64,
      anchorX: 32,
    },
    'triangle-w-ex': {
      mask: true,
      x: 128,
      y: 0,
      width: 32,
      height: 64,
    },
    'circle-ex': {
      mask: true,
      x: 192,
      y: 0,
      width: 32,
      height: 32,
      anchorX: 0,
    },
    'circle-lg-ex': {
      mask: true,
      x: 192,
      y: 32,
      width: 32,
      height: 32,
      anchorX: 0,
    },
    dot: {
      mask: true,
      x: 224,
      y: 0,
      width: 32,
      height: 32,
      anchorX: 8,
    },
    'dot-ex': {
      mask: true,
      x: 224,
      y: 0,
      width: 32,
      height: 32,
      anchorX: 0,
    },
    'dot-lg': {
      mask: true,
      x: 224,
      y: 32,
      width: 32,
      height: 32,
      anchorX: 12,
    },
    'dot-lg-ex': {
      mask: true,
      x: 224,
      y: 32,
      width: 32,
      height: 32,
      anchorX: 0,
    },
  },
  imageScale,
);
