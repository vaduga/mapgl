import type { Texture } from '@luma.gl/core';
import type { ShaderModule } from '@luma.gl/shadertools';

import { DONUT_GAUGE_BAR_OUTER_RADIUS_RATIO } from './donutData';

export type DonutShaderProps = {
  texture: Texture;
  textureWidth: number;
  recordTexels: number;
  gaugeYSign: number;
  gaugeBarWidthFactor: number;
  gaugeSegmentCount: number;
  gaugeSegmentSpacing: number;
  gaugeShowThresholds: number;
};

type DonutShaderUniforms = {
  textureWidth: number;
  recordTexels: number;
  gaugeYSign: number;
  gaugeBarWidthFactor: number;
  gaugeSegmentCount: number;
  gaugeSegmentSpacing: number;
  gaugeShowThresholds: number;
};

type DonutShaderBindings = {
  donut_texture: Texture;
};

const uniformBlock = /* glsl */ `\
layout(std140) uniform donutUniforms {
  float textureWidth;
  float recordTexels;
  float gaugeYSign;
  float gaugeBarWidthFactor;
  float gaugeSegmentCount;
  float gaugeSegmentSpacing;
  float gaugeShowThresholds;
} donut;
`;

export const donutShaders = {
  name: 'donut',
  vs: uniformBlock,
  fs: `${uniformBlock}\nuniform sampler2D donut_texture;`,
  uniformTypes: {
    textureWidth: 'f32',
    recordTexels: 'f32',
    gaugeYSign: 'f32',
    gaugeBarWidthFactor: 'f32',
    gaugeSegmentCount: 'f32',
    gaugeSegmentSpacing: 'f32',
    gaugeShowThresholds: 'f32',
  },
  getUniforms: (props?: DonutShaderProps | {}) => {
    if (!props || !('texture' in props)) {
      return {};
    }
    return {
      donut_texture: props.texture,
      textureWidth: props.textureWidth,
      recordTexels: props.recordTexels,
      gaugeYSign: props.gaugeYSign,
      gaugeBarWidthFactor: props.gaugeBarWidthFactor,
      gaugeSegmentCount: props.gaugeSegmentCount,
      gaugeSegmentSpacing: props.gaugeSegmentSpacing,
      gaugeShowThresholds: props.gaugeShowThresholds,
    };
  },
} as const satisfies ShaderModule<DonutShaderProps, DonutShaderUniforms, DonutShaderBindings>;

export const donutShaderInjection = {
  'vs:#decl': /* glsl */ `\
in float instanceDonutRecords;
in float instanceDonutOpacity;
in float instanceDonutGaugeValues;
in vec4 instanceDonutGaugeOptions;
out float vDonutRecord;
out float vDonutOpacity;
out float vDonutGaugeValue;
out vec4 vDonutGaugeOptions;
`,
  'vs:#main-end': /* glsl */ `\
vDonutRecord = instanceDonutRecords;
vDonutOpacity = instanceDonutOpacity;
vDonutGaugeValue = instanceDonutGaugeValues;
vDonutGaugeOptions = instanceDonutGaugeOptions;
`,
  'fs:#decl': /* glsl */ `\
in float vDonutRecord;
in float vDonutOpacity;
in float vDonutGaugeValue;
in vec4 vDonutGaugeOptions;

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

vec4 mapglGaugeColor(float fraction, int stopCount) {
  vec4 previousColor = mapglDonutPartColor(1, 0);
  float previousEnd = mapglDonutPartEnd(1, 0);
  if (fraction <= previousEnd || stopCount == 1) {
    return previousColor;
  }
  for (int index = 1; index < MAPGL_MAX_DONUT_SEGMENTS; index++) {
    if (index >= stopCount) {
      break;
    }
    vec4 nextColor = mapglDonutPartColor(1, index);
    float nextEnd = mapglDonutPartEnd(1, index);
    if (fraction <= nextEnd) {
      float span = max(nextEnd - previousEnd, 0.0001);
      return mix(previousColor, nextColor, clamp((fraction - previousEnd) / span, 0.0, 1.0));
    }
    previousColor = nextColor;
    previousEnd = nextEnd;
  }
  return previousColor;
}

vec4 mapglGaugeDiscreteColor(float fraction, int stopCount) {
  vec4 selectedColor = mapglDonutPartColor(1, 0);
  for (int index = 1; index < MAPGL_MAX_DONUT_SEGMENTS; index++) {
    if (index >= stopCount) {
      break;
    }
    float thresholdStart = mapglDonutPartEnd(1, index);
    if (fraction < thresholdStart) {
      break;
    }
    selectedColor = mapglDonutPartColor(1, index);
  }
  return selectedColor;
}
`,
  'fs:DECKGL_FILTER_COLOR': /* glsl */ `\
if (vDonutRecord >= 0.0) {
  vec4 header = mapglDonutTexel(0);
  int segmentCount = int(header.r + 0.5);
  int stripeCount = int(header.g + 0.5);
  float innerRadius = header.b;
  bool gaugeMode = header.a > 0.5;
  vec4 gaugeOptions = vDonutGaugeOptions.x >= 0.0
    ? vDonutGaugeOptions
    : vec4(
        donut.gaugeBarWidthFactor,
        donut.gaugeSegmentCount,
        donut.gaugeSegmentSpacing,
        donut.gaugeShowThresholds
      );
  bool gradientGauge = gaugeOptions.w < 2.0;
  bool showThresholds = mod(gaugeOptions.w, 2.0) > 0.5;
  float barWidthFactor = clamp(gaugeOptions.x, 0.1, 1.0);
  float ringInnerRadius = 1.0 - (1.0 - innerRadius) * barWidthFactor;
  float distanceFromCenter = length(geometry.uv);
  vec4 ringColor = color;
  vec4 innerColor = color;

  float orientedY = geometry.uv.y * donut.gaugeYSign;
  float angleFraction = fract(atan(geometry.uv.x, orientedY) / MAPGL_TAU + 1.0);
  if (gaugeMode && segmentCount > 0) {
    // Use the conventional atan(y, x) form with an explicit quarter-turn.
    // orientedY is the projection-adjusted local Y axis, so zero is at the
    // screen top and progress is clockwise in both MapView and OrbitView.
    float gaugeFraction = fract(0.25 - atan(orientedY, geometry.uv.x) / MAPGL_TAU);
    float fillFraction = clamp(vDonutGaugeValue, 0.0, 1.0);
    float radialAA = max(fwidth(distanceFromCenter), 0.0001);
    // Pull the bar band toward the edge so the reference ring does not float
    // away from the gauge segments.
    float barOuterRadius = ${DONUT_GAUGE_BAR_OUTER_RADIUS_RATIO.toFixed(3)};
    float barInnerRadius = barOuterRadius - (barOuterRadius - innerRadius) * barWidthFactor;
    ringInnerRadius = barInnerRadius;
    // Bias the thin full-range reference circle into the primitive boundary.
    // Its outer half is clipped by the unit circle, leaving no trailing pad.
    float rangeRadius = 0.996;
    float rangeHalfWidth = 0.012;
    float barBandMask = smoothstep(barInnerRadius - radialAA, barInnerRadius + radialAA, distanceFromCenter)
      * (1.0 - smoothstep(barOuterRadius - radialAA, barOuterRadius + radialAA, distanceFromCenter));

    float configuredBarCount = clamp(floor(gaugeOptions.y + 0.5), 1.0, 100.0);
    float normalizedSpacing = configuredBarCount > 1.0 ? clamp(gaugeOptions.z, 0.0, 1.0) : 0.0;
    float barSlotWidth = clamp(1.0 - normalizedSpacing * 0.4, 0.2, 1.0);
    float barHalfWidth = barSlotWidth * 0.5;
    float barPosition = gaugeFraction * configuredBarCount;
    float barPhase = fract(barPosition);
    float barDistance = abs(barPhase - 0.5);
    float barAA = min(max(fwidth(barPosition) * 0.3, 0.008), 0.05);
    bool singleBarGauge = configuredBarCount <= 1.0;
    // A single bar covers the complete circle. Do not run it through the
    // segmented slot edge mask, otherwise the wrapped 0/1 angle produces a
    // visible seam where the bar closes.
    float barSlotMask = singleBarGauge
      ? 1.0
      : 1.0 - smoothstep(barHalfWidth - barAA, barHalfWidth + barAA, barDistance);
    float barFraction = (floor(barPosition) + 0.5) / configuredBarCount;
    // With one configured bar, the bar represents the complete radial band.
    // Keep it active for every valid metric value (including the range
    // minimum) and sample its color at the metric's actual normalized value.
    // Otherwise values below the bar midpoint incorrectly render as the
    // subdued empty-track color.
    float activeBar = vDonutGaugeValue < 0.0
      ? 0.0
      : (singleBarGauge ? 1.0 : (fillFraction <= 0.0 ? 0.0 : step(barFraction, fillFraction)));

    float colorFraction = singleBarGauge
      ? fillFraction
      : (gradientGauge ? barFraction : gaugeFraction);
    vec4 activeColor = gradientGauge
      ? mapglGaugeColor(colorFraction, segmentCount)
      : mapglGaugeDiscreteColor(colorFraction, segmentCount);
    activeColor.a *= vDonutOpacity * layer.opacity;
    vec4 inactiveColor = vec4(0.34, 0.36, 0.40, 0.62 * vDonutOpacity * layer.opacity);
    vec4 separatorColor = vec4(0.0);
    vec4 barColor = mix(inactiveColor, activeColor, activeBar);

    ringColor = vec4(0.0);
    if (showThresholds) {
      float rangeDistance = abs(distanceFromCenter - rangeRadius);
      float rangeGlowMask = 1.0 - smoothstep(rangeHalfWidth, rangeHalfWidth + 0.055, rangeDistance);
      float rangeLineMask = 1.0 - smoothstep(rangeHalfWidth - radialAA, rangeHalfWidth + radialAA, rangeDistance);
      vec4 rangeColor = gradientGauge
        ? mapglGaugeColor(gaugeFraction, segmentCount)
        : mapglGaugeDiscreteColor(gaugeFraction, segmentCount);
      vec4 rangeGlowColor = rangeColor;
      rangeGlowColor.a *= rangeGlowMask * 0.24 * vDonutOpacity * layer.opacity;
      rangeColor.a *= vDonutOpacity * layer.opacity;
      ringColor = rangeGlowColor;
      ringColor = mix(ringColor, separatorColor, barBandMask);
      ringColor = mix(ringColor, barColor, barBandMask * barSlotMask);
      ringColor = mix(ringColor, rangeColor, rangeLineMask);
    } else {
      ringColor = mix(ringColor, separatorColor, barBandMask);
      ringColor = mix(ringColor, barColor, barBandMask * barSlotMask);
    }
  } else if (segmentCount > 0) {
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
  float ringMix = smoothstep(ringInnerRadius - innerEdgeWidth, ringInnerRadius + innerEdgeWidth, distanceFromCenter);
  color = mix(innerColor, ringColor, ringMix);
}
`,
} as const;
