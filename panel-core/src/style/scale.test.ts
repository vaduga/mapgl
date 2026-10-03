import { arrayColumn } from '../data';
import { createScaleChannel, validateScaleRange } from './scale';

describe('neutral scale channels', () => {
  it('supports descending output, clamping, and independent endpoint validation', () => {
    const channel = createScaleChannel({
      metric: arrayColumn('metric', [-10, 0, 50, 100, 200]),
      range: { min: 0, max: 100 },
      output: { min: 20, max: 5 },
    });
    expect(Array.from({ length: 5 }, (_, i) => channel.get(i))).toEqual([20, 20, 12.5, 5, 5]);
    expect(validateScaleRange({ min: 80, max: 5 }, { min: 10, max: 50 })).toEqual({ min: 50, max: 10, fixed: 30 });
  });

  it('preserves capacity edge cases and source range fallback', () => {
    const channel = createScaleChannel({
      metric: arrayColumn('metric', [0, 5, 5, 5]),
      capacity: arrayColumn('capacity', [0, 0, null, undefined]),
      range: { min: 0, max: 10 },
      output: { min: 5, max: 20 },
    });
    expect(channel.get(0)).toBeNaN();
    expect(channel.get(1)).toBe(20);
    expect(channel.get(2)).toBe(20);
    expect(channel.get(3)).toBeNaN();
    const degenerate = createScaleChannel({
      metric: arrayColumn('metric', [10]),
      range: { min: 10, max: 10 },
      output: { min: 20, max: 5 },
    });
    expect(degenerate.get(0)).toBe(20);
  });

  it('uses fixed values without a metric and computes quadratic area scaling', () => {
    expect(createScaleChannel({ output: { min: 20, max: 5, fixed: 7 } }).get(0)).toBe(7);
    const channel = createScaleChannel({
      metric: arrayColumn('metric', [0, 50, 100]),
      range: { min: 0, max: 100 },
      output: { min: 10, max: 20 },
      quadratic: true,
    });
    expect(channel.get(1)).toBeCloseTo(Math.sqrt(250));
  });
});
