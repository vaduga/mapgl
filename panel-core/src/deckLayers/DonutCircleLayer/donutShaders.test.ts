import { donutShaderInjection } from './donutShaders';

describe('donut shader visual contract', () => {
  it('retains ring, inner-fill, ordered-segment, stripe, and antialias paths', () => {
    expect(donutShaderInjection['fs:DECKGL_FILTER_COLOR']).toEqual(
      expect.stringContaining('float orientedY = geometry.uv.y * donut.gaugeYSign;')
    );
    expect(donutShaderInjection['fs:DECKGL_FILTER_COLOR']).toEqual(
      expect.stringContaining('float angleFraction = fract(atan(geometry.uv.x, orientedY) / MAPGL_TAU + 1.0);')
    );
    expect(donutShaderInjection['fs:DECKGL_FILTER_COLOR']).toEqual(
      expect.stringContaining('int stripeBase = 1 + MAPGL_MAX_DONUT_SEGMENTS * 2;')
    );
    expect(donutShaderInjection['fs:DECKGL_FILTER_COLOR']).toEqual(
      expect.stringContaining(
        'float ringMix = smoothstep(ringInnerRadius - innerEdgeWidth, ringInnerRadius + innerEdgeWidth'
      )
    );
    expect(donutShaderInjection['fs:DECKGL_FILTER_COLOR']).toEqual(
      expect.stringContaining('color = mix(innerColor, ringColor, ringMix);')
    );
  });

  it('renders clockwise gradient bars, an inactive track, and a full-range outer circle', () => {
    const fragment = donutShaderInjection['fs:DECKGL_FILTER_COLOR'];

    expect(donutShaderInjection['vs:#decl']).toContain('instanceDonutGaugeValues');
    expect(donutShaderInjection['vs:#decl']).toContain('instanceDonutGaugeOptions');
    expect(donutShaderInjection['vs:#decl']).not.toContain('instanceDonutGaugeGradient');
    expect(fragment).toContain('bool gaugeMode = header.a > 0.5;');
    expect(fragment).toContain('vec4 gaugeOptions = vDonutGaugeOptions.x >= 0.0');
    expect(fragment).toContain('donut.gaugeBarWidthFactor,');
    expect(fragment).toContain('float gaugeFraction = fract(0.25 - atan(orientedY, geometry.uv.x)');
    expect(fragment).toContain('float barOuterRadius = 0.972;');
    expect(fragment).toContain('float rangeRadius = 0.996;');
    expect(fragment).toContain('float configuredBarCount = clamp(floor(gaugeOptions.y + 0.5), 1.0, 100.0);');
    expect(fragment).toContain('float barPosition = gaugeFraction * configuredBarCount;');
    expect(fragment).toContain('bool singleBarGauge = configuredBarCount <= 1.0;');
    expect(fragment).toContain('float barSlotMask = singleBarGauge');
    expect(fragment).toContain(': 1.0 - smoothstep(barHalfWidth - barAA, barHalfWidth + barAA, barDistance);');
    expect(fragment).toContain('float activeBar = vDonutGaugeValue < 0.0');
    expect(fragment).toContain(
      ': (singleBarGauge ? 1.0 : (fillFraction <= 0.0 ? 0.0 : step(barFraction, fillFraction)));'
    );
    expect(fragment).toContain('float colorFraction = singleBarGauge');
    expect(fragment).toContain('bool gradientGauge = gaugeOptions.w < 2.0;');
    expect(fragment).toContain('bool showThresholds = mod(gaugeOptions.w, 2.0) > 0.5;');
    expect(fragment).toContain('gradientGauge ? barFraction : gaugeFraction');
    expect(fragment).toContain('vec4 activeColor = gradientGauge');
    expect(donutShaderInjection['fs:#decl']).toContain('vec4 mapglGaugeDiscreteColor(float fraction, int stopCount)');
    expect(fragment).toContain('vec4 inactiveColor = vec4(0.34, 0.36, 0.40');
    expect(fragment).toContain('vec4 separatorColor = vec4(0.0);');
    expect(fragment).not.toContain('barGlow');
    expect(fragment).toContain('float rangeLineMask');
    expect(fragment).toContain('bool showThresholds = mod(gaugeOptions.w, 2.0) > 0.5;');
    expect(fragment).toContain('vec4 rangeColor = gradientGauge');
    expect(fragment).toContain('? mapglGaugeColor(gaugeFraction, segmentCount)');
    expect(fragment).toContain('ringColor = mix(ringColor, rangeColor, rangeLineMask);');
  });
});
