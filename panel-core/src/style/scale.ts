import type { ValueColumn } from '../data';

export interface ScaleRange {
  min: number;
  max: number;
}

export interface ScaleOutput extends ScaleRange {
  fixed?: number;
  field?: string;
}

export interface ScaleChannel {
  readonly fixed?: number;
  readonly isAssumed?: boolean;
  get(rowIndex: number): number;
  value(): number;
}

/** Host adapters provide effective metric bounds; core owns interpolation. */
export function createScaleChannel({
  metric,
  range,
  output,
  capacity,
  quadratic = false,
}: {
  metric?: ValueColumn<any>;
  range?: ScaleRange;
  output: ScaleOutput;
  capacity?: ValueColumn<any>;
  quadratic?: boolean;
}): ScaleChannel {
  if (!metric) {
    const fixed = output.fixed ?? 0;
    return { fixed, isAssumed: Boolean(output.field?.length) || !output.fixed, get: () => fixed, value: () => fixed };
  }
  const inputDelta = range ? range.max - range.min : 0;
  const outputDelta = output.max - output.min;
  if (!metric.length || outputDelta === 0 || inputDelta <= 0) {
    return { fixed: output.min, get: () => output.min, value: () => output.min };
  }
  const interpolate = quadratic
    ? (percent: number) => Math.sqrt(output.min ** 2 + (output.max ** 2 - output.min ** 2) * percent)
    : (percent: number) => output.min + percent * outputDelta;
  const get = (index: number) => {
    const min = capacity ? 0 : range!.min;
    const delta = capacity ? capacity.get(index) - min : inputDelta;
    const value = metric.get(index);
    // Preserve established handling of null, NaN, zero capacity and -Infinity.
    // In particular, NaN is not converted to a valid percentage.
    const percent = value === -Infinity ? 0 : (value - min) / delta;
    return interpolate(Math.min(1, Math.max(0, percent)));
  };
  return {
    get,
    value: () => {
      let index = metric.length - 1;
      while (index >= 0 && metric.get(index) == null) {
        index--;
      }
      return get(index < 0 ? 0 : index);
    },
  };
}

/** Output endpoints are independently bounded; their order is meaningful. */
export function validateScaleRange<T extends Partial<ScaleOutput>>(config: T, limits: ScaleRange): T & ScaleOutput {
  const result = config as T & ScaleOutput;
  result.min = Math.min(limits.max, Math.max(limits.min, result.min ?? limits.min));
  result.max = Math.min(limits.max, Math.max(limits.min, result.max ?? limits.max));
  result.fixed ??= result.min + (result.max - result.min) / 2;
  if (!result.field) {
    result.fixed = Math.min(limits.max, Math.max(limits.min, result.fixed));
  }
  return result;
}
