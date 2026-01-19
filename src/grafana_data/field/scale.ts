import { isNumber } from 'lodash';
import {
    Field,
    FieldConfig,
    FieldType,
    getFieldColorModeForField,
    GrafanaTheme2, NumericRange, reduceField,
    ReducerID,
    Threshold
} from "@grafana/data";
import {getActiveThresholdForValue} from "./thresholds";

export interface ColorScaleValue {
    percent: number; // 0-1
    threshold: Threshold | undefined;
    color: string;
}

export type ScaleCalculator = (value: number, i) => ColorScaleValue;

export function getScaleCalculator(field: Field, theme: GrafanaTheme2): ScaleCalculator {
    if (field.type === FieldType.boolean) {
        return getBooleanScaleCalculator(field, theme);
    }

    const mode = getFieldColorModeForField(field);
    const getColor = mode.getCalculator(field, theme);
    const info = field.state?.range ?? getMinMaxAndDelta(field);

    return (value: number, capacity: number) => {
        let percent = 0;
        const min  = capacity ? 0 : info.min
        const delta = capacity ? capacity - min! : info.delta
        if (value !== -Infinity) {
            percent = (value - min!) / delta;
            if (Number.isNaN(percent)) {
                percent = 0;
            }
        }

        const threshold = getActiveThresholdForValue(field, value, percent);

        return {
            percent,
            threshold,
            color: getColor(value, percent, threshold),
        };
    };
}

function getBooleanScaleCalculator(field: Field, theme: GrafanaTheme2): ScaleCalculator {
    const trueValue: ColorScaleValue = {
        color: theme.visualization.getColorByName('green'),
        percent: 1,
        threshold: undefined,
    };

    const falseValue: ColorScaleValue = {
        color: theme.visualization.getColorByName('red'),
        percent: 0,
        threshold: undefined,
    };

    const mode = getFieldColorModeForField(field);
    if (mode.isContinuous && mode.getColors) {
        const colors = mode.getColors(theme);
        trueValue.color = colors[colors.length - 1];
        falseValue.color = colors[0];
    }

    return (value: number) => {
        return Boolean(value) ? trueValue : falseValue;
    };
}

export function getMinMaxAndDelta(field: Field): NumericRange {
    if (field.type !== FieldType.number) {
        return { min: 0, max: 100, delta: 100 };
    }

    // Calculate min/max if required
    let min = field.config.min;
    let max = field.config.max;

    if (!isNumber(min) || !isNumber(max)) {
        if (field.values && field.values.length) {
            const stats = reduceField({ field, reducers: [ReducerID.min, ReducerID.max] });
            if (!isNumber(min)) {
                min = stats[ReducerID.min];
            }
            if (!isNumber(max)) {
                max = stats[ReducerID.max];
            }
        } else {
            min = 0;
            max = 100;
        }
    }

    return {
        min,
        max,
        delta: max! - min!,
    };
}

