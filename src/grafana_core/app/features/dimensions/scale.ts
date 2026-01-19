import {DataFrame, Field, getMinMaxAndDelta} from '@grafana/data';
import {ScaleDimensionConfig, ScaleDimensionMode} from '@grafana/schema';

import { DimensionSupplier, ScaleDimensionOptions } from './types';
import { findField, getLastNotNullFieldValue } from './utils';

//---------------------------------------------------------
// Scale dimension
//---------------------------------------------------------
interface MyScaleDimensionConfig extends ScaleDimensionConfig{
    capacity?: string;
}

export function getScaledDimension(
    frame: DataFrame | undefined,
    config: MyScaleDimensionConfig,
    capFieldName?: string,
): DimensionSupplier<number> {
    return getScaledDimensionForField(findField(frame, config?.field), config, undefined, findField(frame, capFieldName));
}

export function getScaledDimensionForField(
    field: Field | undefined,
    config: MyScaleDimensionConfig,
    mode?: ScaleDimensionMode,
    capacity?: Field | undefined,
): DimensionSupplier<number> {
    if (!field) {
        const v = config.fixed ?? 0;
        return {
            isAssumed: Boolean(config.field?.length) || !config.fixed,
            fixed: v,
            value: () => v,
            get: () => v,
        };
    }
    const info = getMinMaxAndDelta(field);
    const delta = config.max - config.min;
    const values = field.values;
    if (values.length < 1 || delta <= 0 || info.delta <= 0) {
        return {
            fixed: config.min,
            value: () => config.min,
            get: () => config.min,
        };
    }

    let scaled = (percent: number) => config.min + percent * delta;
    if (mode === ScaleDimensionMode.Quad) {
        const maxArea = Math.PI * (config.max / 2) ** 2;
        const minArea = Math.PI * (config.min / 2) ** 2;
        const deltaArea = maxArea - minArea;

        // quadratic scaling (px area)
        scaled = (percent: number) => {
            let area = minArea + deltaArea * percent;
            return Math.sqrt(area / Math.PI) * 2;
        };
    }

    const get = (i: number) => {

        const min = capacity? 0 : info.min!
        const delta = capacity? capacity.values[i] - min : info.delta;
        const value = field.values[i];
        let percent = 0;
        if (value !== -Infinity) {
            percent = (value - min) / delta;
        }
        if (percent > 1) {
            percent = 1;
        } else if (percent < 0) {
            percent = 0;
        }
        return scaled(percent);
    };

    return {
        get,
        value: () => get(getLastNotNullFieldValue(field)),
        field,
    };
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
    let { min, max } = validateScaleOptions(options);
    if (!copy) {
        copy = {} as ScaleDimensionConfig;
    }

    if (copy.max == null) {
        copy.max = max;
    }
    if (copy.min == null) {
        copy.min = min;
    }
    // Make sure the order is right
    if (copy.min > copy.max) {
        const tmp = copy.max;
        copy.max = copy.min;
        copy.min = tmp;
    }
    // Validate range
    if (copy.min < min) {
        copy.min = min;
    }
    if (copy.max > max) {
        copy.max = max;
    }

    if (copy.fixed == null) {
        copy.fixed = copy.min + (copy.max - copy.min) / 2.0;
    }

    // Make sure the field value is within the absolute range
    if (!copy.field) {
        if (copy.fixed > max) {
            copy.fixed = max;
        } else if (copy.fixed < min) {
            copy.fixed = min;
        }
    }
    return copy;
}
