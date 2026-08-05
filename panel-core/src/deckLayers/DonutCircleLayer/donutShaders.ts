import type { Texture } from '@luma.gl/core';
import type { ShaderModule } from '@luma.gl/shadertools';

export type DonutShaderProps = {
  texture: Texture;
  textureWidth: number;
  recordTexels: number;
};

type DonutShaderUniforms = {
  textureWidth: number;
  recordTexels: number;
};

type DonutShaderBindings = {
  donut_texture: Texture;
};

const uniformBlock = /* glsl */ `\
layout(std140) uniform donutUniforms {
  float textureWidth;
  float recordTexels;
} donut;
`;

export const donutShaders = {
  name: 'donut',
  vs: uniformBlock,
  fs: `${uniformBlock}\nuniform sampler2D donut_texture;`,
  uniformTypes: {
    textureWidth: 'f32',
    recordTexels: 'f32',
  },
  getUniforms: (props?: DonutShaderProps | {}) => {
    if (!props || !('texture' in props)) {
      return {};
    }
    return {
      donut_texture: props.texture,
      textureWidth: props.textureWidth,
      recordTexels: props.recordTexels,
    };
  },
} as const satisfies ShaderModule<DonutShaderProps, DonutShaderUniforms, DonutShaderBindings>;

export const donutShaderInjection = {
  'vs:#decl': /* glsl */ `\
in float instanceDonutRecords;
in float instanceDonutOpacity;
out float vDonutRecord;
out float vDonutOpacity;
`,
  'vs:#main-end': /* glsl */ `\
vDonutRecord = instanceDonutRecords;
vDonutOpacity = instanceDonutOpacity;
`,
  'fs:#decl': /* glsl */ `\
in float vDonutRecord;
in float vDonutOpacity;

const int MAPGL_MAX_DONUT_SEGMENTS = 16;
const int MAPGL_MAX_DONUT_STRIPES = 4;
const float MAPGL_TAU = 6.283185307179586;

vec4 mapglDonutTexel(int offset) {
  int width = int(donut.textureWidth);
  int linearIndex = int(vDonutRecord) * int(donut.recordTexels) + offset;
  return texelFetch(donut_texture, ivec2(linearIndex % width, linearIndex / width), 0);
}

vec4 mapglDonutPartColor(int baseOffset, int index) {
  return mapglDonutTexel(baseOffset + index * 2);
}

float mapglDonutPartEnd(int baseOffset, int index) {
  return mapglDonutTexel(baseOffset + index * 2 + 1).r;
}
`,
  'fs:DECKGL_FILTER_COLOR': /* glsl */ `\
if (vDonutRecord >= 0.0) {
  vec4 header = mapglDonutTexel(0);
  int segmentCount = int(header.r + 0.5);
  int stripeCount = int(header.g + 0.5);
  float innerRadius = header.b;
  float distanceFromCenter = length(geometry.uv);
  vec4 ringColor = color;
  vec4 innerColor = color;

  if (segmentCount > 0) {
    float angleFraction = fract(atan(geometry.uv.x, geometry.uv.y) / MAPGL_TAU + 1.0);
    for (int index = 0; index < MAPGL_MAX_DONUT_SEGMENTS; index++) {
      if (index >= segmentCount) {
        break;
      }
      if (angleFraction <= mapglDonutPartEnd(1, index)) {
        ringColor = mapglDonutPartColor(1, index);
        ringColor.a *= vDonutOpacity * layer.opacity;
        break;
      }
    }
  }

  if (stripeCount > 0) {
    float stripeFraction = clamp((innerRadius - geometry.uv.y) / (innerRadius * 2.0), 0.0, 1.0);
    int stripeBase = 1 + MAPGL_MAX_DONUT_SEGMENTS * 2;
    for (int index = 0; index < MAPGL_MAX_DONUT_STRIPES; index++) {
      if (index >= stripeCount) {
        break;
      }
      if (stripeFraction <= mapglDonutPartEnd(stripeBase, index)) {
        innerColor = mapglDonutPartColor(stripeBase, index);
        innerColor.a *= vDonutOpacity * layer.opacity;
        break;
      }
    }
  }

  float innerEdgeWidth = max(fwidth(distanceFromCenter), 0.0001);
  float ringMix = smoothstep(innerRadius - innerEdgeWidth, innerRadius + innerEdgeWidth, distanceFromCenter);
  color = mix(innerColor, ringColor, ringMix);
}
`,
} as const;
