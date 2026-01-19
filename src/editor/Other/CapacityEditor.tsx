import { css } from '@emotion/css';
import React, { useCallback, useMemo } from 'react';

import { GrafanaTheme2, SelectableValue, StandardEditorProps } from '@grafana/data';
import { Select, useStyles2 } from '@grafana/ui';


import {
    ScaleDimensionOptions,
    validateScaleConfig,
    validateScaleOptions
} from "../../grafana_core/app/features/dimensions";
import {useFieldDisplayNames, useSelectOptions} from "../../grafana_core/components/MatchersUI/utils";


const fixedValueOption: SelectableValue<string> = {
    label: 'from calculations',
    value: '_____fixed_____',
};

export const CapacityDimensionEditor = (props: StandardEditorProps) => {
    const { value, context, onChange, item } = props;
    const { settings } = item;
    const styles = useStyles2(getStyles);

    const fieldName = value?.field;
    const isFixed = Boolean(!fieldName);
    const names = useFieldDisplayNames(context.data);
    const selectOptions = useSelectOptions(names, fieldName, fixedValueOption, settings?.filteredFieldType);

    // Validate and update
    const validateAndDoChange = useCallback(
        (v) => {
            // always called with a copy so no need to spread
            onChange(v);
        },
        [onChange]
    );

    const onSelectChange = useCallback(
        (selection: SelectableValue<string>) => {
            const field = selection.value;
            if (field && field !== fixedValueOption.value) {
                validateAndDoChange({
                    ...value,
                    field,
                });
            }
            else {
                validateAndDoChange({
                    fixed:1,
                    field: undefined,
                });
            }
        },
        [validateAndDoChange, value]
    );

    const selectedOption = isFixed ? fixedValueOption : selectOptions.find((v) => v.value === fieldName);
    return (
        <>
            <div>
                <Select
                    value={selectedOption}
                    options={selectOptions}
                    onChange={onSelectChange}
                    noOptionsMessage="No fields found"
                />
            </div>
        </>
    );
};

const getStyles = (theme: GrafanaTheme2) => ({
    range: css`
    padding-top: 8px;
  `,
});
