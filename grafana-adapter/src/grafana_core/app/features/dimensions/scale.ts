import { DataFrame, Field, getMinMaxAndDelta } from '@grafana/data';
import { ScaleDimensionConfig, ScaleDimensionMode } from '@grafana/schema';

import { DimensionSupplier, ScaleDimensionOptions } from './types';
import { findField } from './utils';
import { createScaleChannel, validateScaleRange } from '@vaduga/mapgl-core/style';

//---------------------------------------------------------
// Scale dimension
//---------------------------------------------------------
interface MyScaleDimensionConfig extends ScaleDimensionConfig {
  capacity?: string;
}

export function getScaledDimension(
  frame: DataFrame | undefined,
  config: MyScaleDimensionConfig,
  capFieldName?: string
): DimensionSupplier<number> {
  return getScaledDimensionForField(findField(frame, config?.field), config, undefined, findField(frame, capFieldName));
}

export function getScaledDimensionForField(
  field: Field | undefined,
  config: MyScaleDimensionConfig,
  mode?: ScaleDimensionMode,
  capacity?: Field | undefined
): DimensionSupplier<number> {
  const info = field ? getMinMaxAndDelta(field) : undefined;
  const channel = createScaleChannel({
    metric: field ? { key: field.name, length: field.values.length, get: (i) => field.values[i] } : undefined,
    range: info ? { min: info.min!, max: info.max! } : undefined,
    capacity: capacity
      ? { key: capacity.name, length: capacity.values.length, get: (i) => capacity.values[i] }
      : undefined,
    output: config,
    quadratic: mode === ScaleDimensionMode.Quad,
  });
  return { ...channel, ...(field && channel.fixed === undefined && { field }) };
}

// This will mutate options
export function validateScaleOptions(options?: ScaleDimensionOptions): ScaleDimensionOptions {
  if (!options) {
    options = { min: 0, max: 1 };
  }
  if (options.min == null) {
    options.min = 0;
  }
  if (options.max == null) {
    options.max = 1;
  }

  return options;
}

/** Mutates and will return a valid version */
export function validateScaleConfig(copy: ScaleDimensionConfig, options: ScaleDimensionOptions): ScaleDimensionConfig {
  return validateScaleRange(copy ?? ({} as ScaleDimensionConfig), validateScaleOptions(options));
}
