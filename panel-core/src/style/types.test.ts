import { describe, expect, it } from '@jest/globals';

import { DEFAULT_ARC_OPTIONS, isMetricDrivenArc, resolveArcOptions } from './types';

describe('arc option defaults and eligibility', () => {
  it('uses the compatibility defaults for omitted presentation settings', () => {
    expect(resolveArcOptions()).toEqual(DEFAULT_ARC_OPTIONS);
  });

  it('clamps and normalizes editor values before rendering', () => {
    expect(
      resolveArcOptions({
        barWidthFactor: -1,
        segments: 12.6,
        segmentSpacing: 3,
        showThresholds: false,
        gradient: false,
      })
    ).toEqual({
      barWidthFactor: 0.1,
      segments: 13,
      segmentSpacing: 1,
      showThresholds: false,
      gradient: false,
    });
  });

  it('defaults an invalid Gradient value to the enabled compatibility behavior', () => {
    expect(resolveArcOptions({ gradient: 'false' as any }).gradient).toBe(true);
  });

  it('enables gauge-only controls only for one field-driven arc', () => {
    expect(isMetricDrivenArc([{ field: 'load', fixed: '' }])).toBe(true);
    expect(isMetricDrivenArc([{ fixed: '#00ff00' }])).toBe(false);
    expect(isMetricDrivenArc([{ field: 'load', fixed: '' }, { fixed: '#00ff00' }])).toBe(false);
    expect(isMetricDrivenArc([])).toBe(false);
  });
});
