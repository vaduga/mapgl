import { describe, expect, it } from '@jest/globals';

import { DataFrame, Field, FieldType, GrafanaTheme2 } from '@grafana/data';

import { StyleConfigState } from '../style/types';
import { getStyleDimension } from './geomap_utils';

const numericField = (name: string, values: number[]): Field<number> => ({
  name,
  type: FieldType.number,
  config: {},
  values,
});

const dataFrame = (metric: number[], capacity?: number[]): DataFrame => ({
  name: 'styles',
  length: metric.length,
  fields: [numericField('metric', metric), ...(capacity ? [numericField('capacity', capacity)] : [])],
});

const styleState = (min: number, max: number, capacity = false): StyleConfigState => ({
  config: {
    size: {
      field: 'metric',
      fixed: 10,
      min,
      max,
    },
    ...(capacity ? { capacity: { field: 'capacity', fixed: 0 } } : {}),
  },
  fields: { size: 'metric' },
  base: { color: 'green', size: 10 },
});

describe('getStyleDimension scale direction', () => {
  const theme = {} as GrafanaTheme2;

  it('keeps node and edge style endpoint order independent', () => {
    const frame = dataFrame([0, 50, 100]);
    const nodeDimensions = getStyleDimension(frame, styleState(5, 20), theme);
    const edgeDimensions = getStyleDimension(frame, styleState(20, 5), theme);

    expect([nodeDimensions.size?.get(0), nodeDimensions.size?.get(2)]).toEqual([5, 20]);
    expect([edgeDimensions.size?.get(0), edgeDimensions.size?.get(2)]).toEqual([20, 5]);
  });

  it('passes a descending arc-side scale through capacity normalization', () => {
    const dimensions = getStyleDimension(dataFrame([0, 25, 100], [100, 100, 100]), styleState(20, 5, true), theme);

    expect([dimensions.size?.get(0), dimensions.size?.get(1), dimensions.size?.get(2)]).toEqual([20, 16.25, 5]);
  });
});
