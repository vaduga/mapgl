import { describe, expect, it } from '@jest/globals';

import { Field, FieldType } from '@grafana/data';
import { ScaleDimensionConfig, ScaleDimensionMode } from '@grafana/schema';

import { getScaledDimensionForField, validateScaleConfig } from './scale';

const numericField = (values: number[], name = 'metric'): Field<number> => ({
  name,
  type: FieldType.number,
  config: {},
  values,
});

const scaleConfig = (overrides: Partial<ScaleDimensionConfig> = {}): ScaleDimensionConfig => ({
  field: 'metric',
  fixed: 10,
  min: 5,
  max: 20,
  ...overrides,
});

describe('validateScaleConfig', () => {
  const options = { min: 1, max: 100 };

  it.each([
    ['ascending', 5, 20],
    ['descending', 20, 5],
    ['equal', 10, 10],
  ])('preserves %s endpoint order', (_name, min, max) => {
    expect(validateScaleConfig(scaleConfig({ min, max }), options)).toMatchObject({ min, max });
  });

  it('populates missing endpoints from the editor defaults', () => {
    const config = scaleConfig() as Partial<ScaleDimensionConfig>;
    delete config.min;
    delete config.max;

    expect(validateScaleConfig(config as ScaleDimensionConfig, options)).toMatchObject({ min: 1, max: 100 });
  });

  it.each([
    ['Min below the lower limit', -10, 20, 1, 20],
    ['Min above the upper limit', 120, 20, 100, 20],
    ['Max below the lower limit', 20, -10, 20, 1],
    ['Max above the upper limit', 20, 120, 20, 100],
  ])('clamps %s independently', (_name, min, max, expectedMin, expectedMax) => {
    expect(validateScaleConfig(scaleConfig({ min, max }), options)).toMatchObject({
      min: expectedMin,
      max: expectedMax,
    });
  });

  it('preserves fixed-value validation independently of endpoint order', () => {
    expect(validateScaleConfig(scaleConfig({ field: undefined, fixed: 120, min: 20, max: 5 }), options)).toMatchObject({
      fixed: 100,
      min: 20,
      max: 5,
    });
  });
});

describe('getScaledDimensionForField', () => {
  it.each([
    ['ascending', scaleConfig({ min: 5, max: 20 }), [5, 12.5, 20]],
    ['descending', scaleConfig({ min: 20, max: 5 }), [20, 12.5, 5]],
  ])('interpolates an %s linear range', (_name, config, expected) => {
    const dimension = getScaledDimensionForField(numericField([0, 50, 100]), config);

    expect([dimension.get(0), dimension.get(1), dimension.get(2)]).toEqual(expected);
  });

  it('clamps values before descending interpolation', () => {
    const field = numericField([0, 50, 100]);
    const dimension = getScaledDimensionForField(field, scaleConfig({ min: 20, max: 5 }));

    field.values[0] = -10;
    field.values[2] = 110;

    expect(dimension.get(0)).toBe(20);
    expect(dimension.get(2)).toBe(5);
  });

  it('supports descending quadratic area scaling', () => {
    const dimension = getScaledDimensionForField(
      numericField([0, 50, 100]),
      scaleConfig({ min: 20, max: 10 }),
      ScaleDimensionMode.Quad
    );

    expect(dimension.get(0)).toBeCloseTo(20);
    expect(dimension.get(1)).toBeCloseTo(Math.sqrt(62.5) * 2);
    expect(dimension.get(2)).toBeCloseTo(10);
  });

  it('supports descending capacity-relative scaling', () => {
    const dimension = getScaledDimensionForField(
      numericField([0, 25, 100]),
      scaleConfig({ min: 20, max: 5 }),
      undefined,
      numericField([100, 100, 100], 'capacity')
    );

    expect([dimension.get(0), dimension.get(1), dimension.get(2)]).toEqual([20, 16.25, 5]);
  });

  it('returns the fixed value when no metric field is available', () => {
    const dimension = getScaledDimensionForField(undefined, scaleConfig({ fixed: 13, min: 20, max: 5 }));

    expect(dimension.fixed).toBe(13);
    expect(dimension.get(0)).toBe(13);
  });

  it.each([
    ['equal visual endpoints', numericField([0, 50, 100]), scaleConfig({ min: 10, max: 10 }), 10],
    ['an empty metric field', numericField([]), scaleConfig({ min: 20, max: 5 }), 20],
    ['a degenerate metric field', numericField([7, 7, 7]), scaleConfig({ min: 20, max: 5 }), 20],
  ])('returns Min for %s', (_name, field, config, expected) => {
    const dimension = getScaledDimensionForField(field, config);

    expect(dimension.get(0)).toBe(expected);
  });
});
