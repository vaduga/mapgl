import {
    DataFrame,
    Field,
    FieldType,
    formattedValueToString,
    getDisplayProcessor,
    getTimeZone,
    getTimeZones, GrafanaTheme2
} from '@grafana/data';
import { TextDimensionConfig, TextDimensionMode } from '@grafana/schema';

import { DimensionSupplier } from './types';
import { findField, getLastNotNullFieldValue } from './utils';

//---------------------------------------------------------
// Resource dimension
//---------------------------------------------------------

export function getTextDimension(frame: DataFrame | undefined, config: TextDimensionConfig, theme: GrafanaTheme2): DimensionSupplier<string> {
    const field = config.field ? findField(frame, config.field) : frame?.fields.find((f) => f.type === FieldType.string);
    return getTextDimensionForField(field, theme, config);
}

export function getTextDimensionForField(
    field: Field | undefined,
    theme: GrafanaTheme2,
    config: TextDimensionConfig
): DimensionSupplier<string> {
    let v = config.fixed;
    const mode = config.mode ?? TextDimensionMode.Fixed;
    if (mode === TextDimensionMode.Fixed) {
        return {
            isAssumed: !Boolean(v),
            fixed: v,
            value: () => v,
            get: (i) => v,
        };
    }

    if (mode === TextDimensionMode.Template) {
        const disp = (v: unknown) => {
            return `TEMPLATE[${config.fixed} // ${v}]`;
        };
        if (!field) {
            v = disp('');
            return {
                isAssumed: true,
                fixed: v,
                value: () => v,
                get: (i) => v,
            };
        }
        return {
            field,
            get: (i) => disp(field.values[i]),
            value: () => disp(getLastNotNullFieldValue(field)),
        };
    }

    if (!field) {
        return {
            isAssumed: true,
            fixed: v,
            value: () => v,
            get: (i) => v,
        };
    }

    if (!field.display) {
        field.display = getDisplayProcessor({
            field,
            theme
        });
        const disp = getDisplayProcessor({ field, theme });
    }

    let disp = (v: unknown) => formattedValueToString(field.display!(v));
    return {
        field,
        get: (i) => disp(field.values[i]),
        value: () => disp(getLastNotNullFieldValue(field)),
    };
}
