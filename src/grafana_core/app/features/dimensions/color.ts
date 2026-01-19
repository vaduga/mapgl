import {
    DataFrame,
    Field,
    getFieldColorModeForField,
    GrafanaTheme2,
    getFieldConfigWithMinMax, DisplayProcessor,
} from '@grafana/data';
import { ColorDimensionConfig } from '@grafana/schema';

import { DimensionSupplier } from './types';
import { findField, getLastNotNullFieldValue } from './utils';
import {isEmpty} from "lodash";
import {getDisplayProcessor} from "../../../../grafana_data/field/displayProcessor";
import index from "eslint-plugin-jsdoc";

//---------------------------------------------------------
// Color dimension
//---------------------------------------------------------
interface MyColorDimensionConfig extends ColorDimensionConfig{
    capacity?: string;
}
export function getColorDimension(
    frame: DataFrame | undefined,
    config: MyColorDimensionConfig,
    theme: GrafanaTheme2,
    capFieldName?: string,
): DimensionSupplier<string> {
    return getColorDimensionForField(findField(frame, config.field), config, theme, findField(frame, capFieldName));
}

export function getColorDimensionForField(
    field: Field | undefined,
    config: ColorDimensionConfig,
    theme: GrafanaTheme2,
    capacity?: Field | undefined,
): DimensionSupplier<string> {
    if (!field) {
        const v = theme.visualization.getColorByName(config.fixed ?? 'grey');
        return {
            isAssumed: Boolean(config.field?.length) || !config.fixed,
            fixed: v,
            value: () => v,
            get: (i) => v,
        };
    }


    // Use the expensive color calculation by value
    const mode = getFieldColorModeForField(field);
    if (mode.isByValue || field.config.mappings?.length) {
        // Force this to use local min/max for range
        const config = getFieldConfigWithMinMax(field, true);
        if (config !== field.config) {
            field = { ...field, config };
            field.state = undefined;
        }

        const disp = getDisplayProcessor({ field, theme });
        const getColor = (value: unknown, capacity): string => {
            return disp(value, capacity).color ?? '#ccc';
        };

        return {
            field,
            get: (index: number): string => {
               return getColor(field!.values[index], capacity?.values[index])
            },
            value: () => getColor(getLastNotNullFieldValue(field!), getLastNotNullFieldValue(capacity!)),
        };
    }

    // Typically series or fixed color (does not depend on value)
    const fixed = mode.getCalculator(field, theme)(0, 0);
    return {
        fixed,
        value: () => fixed,
        get: (i) => fixed,
        field,
    };
}


