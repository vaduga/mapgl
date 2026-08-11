import type { FieldConfigSource, Threshold } from '@grafana/data';

function thresholdLabel(step: Threshold): string {
  return [null, undefined, -Infinity].includes(step.value) ? '-Inf' : String(step.value);
}

export function updateThresholdColor(fieldConfig: FieldConfigSource, label: string, color: string): FieldConfigSource {
  const thresholds = fieldConfig.defaults.thresholds;
  if (!thresholds) {
    return fieldConfig;
  }

  let changed = false;
  const steps = thresholds.steps.map((step) => {
    if (thresholdLabel(step) !== label || step.color === color) {
      return step;
    }

    changed = true;
    return { ...step, color };
  });

  if (!changed) {
    return fieldConfig;
  }

  return {
    ...fieldConfig,
    defaults: {
      ...fieldConfig.defaults,
      thresholds: {
        ...thresholds,
        steps,
      },
    },
  };
}
