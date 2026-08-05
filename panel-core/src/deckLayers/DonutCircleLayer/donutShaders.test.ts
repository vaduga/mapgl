import { donutShaderInjection } from './donutShaders';

describe('donut shader visual contract', () => {
  it('retains ring, inner-fill, ordered-segment, stripe, and antialias paths', () => {
    expect(donutShaderInjection['fs:DECKGL_FILTER_COLOR']).toEqual(
      expect.stringContaining('float angleFraction = fract(atan(geometry.uv.x, geometry.uv.y) / MAPGL_TAU + 1.0);')
    );
    expect(donutShaderInjection['fs:DECKGL_FILTER_COLOR']).toEqual(
      expect.stringContaining('int stripeBase = 1 + MAPGL_MAX_DONUT_SEGMENTS * 2;')
    );
    expect(donutShaderInjection['fs:DECKGL_FILTER_COLOR']).toEqual(
      expect.stringContaining('float ringMix = smoothstep(innerRadius - innerEdgeWidth, innerRadius + innerEdgeWidth')
    );
    expect(donutShaderInjection['fs:DECKGL_FILTER_COLOR']).toEqual(
      expect.stringContaining('color = mix(innerColor, ringColor, ringMix);')
    );
  });
});
