import { css } from '@emotion/css';
import { useCallback, useMemo } from 'react';

import { GrafanaTheme2, SelectableValue, StandardEditorProps } from '@grafana/data';
import { ColorDimensionConfig } from '@grafana/schema';
import { ColorPicker, useStyles2 } from '@grafana/ui';
import { ComboboxCompat } from '../../../../../components/Compat/ComboboxCompat';
import {useFieldDisplayNames, useMatcherSelectOptions} from "../../../../components/MatchersUI/utils";

import React from "react";

interface ColorDimensionSettings {
    isClearable?: boolean;
    baseNameMode?: string;
    placeholder?: string;
}

export const ColorDimensionEditor = (props: StandardEditorProps<ColorDimensionConfig, ColorDimensionSettings>) => {
    const fixedColorOption = useMemo(
        () => ({
            label: 'Fixed color',
            value: '_____fixed_____',
        }),
        []
    );
    const { value, context, onChange, item, id } = props;

    const defaultColor = 'dark-green';

    const styles = useStyles2(getStyles);
    const fieldName = value?.field;
    const isFixed = value && Boolean(!fieldName) && value?.fixed;
    const names = useFieldDisplayNames(context.data);
    const selectOptions = useMatcherSelectOptions(names, fieldName, {
        baseNameMode: item.settings?.baseNameMode,
        firstItem: fixedColorOption,
    });

    const onSelectChange = useCallback(
        (selection: SelectableValue<string> | null) => {
            if (!selection) {
                onChange(undefined);
                return;
            }

            const field = selection.value;
            if (field && field !== fixedColorOption.value) {
                onChange({
                    ...value,
                    field,
                });
            } else {
                const fixed = value?.fixed ?? defaultColor;
                onChange({
                    ...value,
                    field: undefined,
                    fixed,
                });
            }
        },
        [fixedColorOption.value, onChange, value]
    );

    const onColorChange = useCallback(
        (c: string) => {
            onChange({
                field: undefined,
                fixed: c ?? defaultColor,
            });
        },
        [onChange]
    );

    const selectedOption = isFixed ? fixedColorOption : selectOptions.find((v) => v.value === fieldName);
    return (
        <>
            <div className={styles.container}>
                <ComboboxCompat
                    id={id}
                    value={selectedOption}
                    options={selectOptions}
                    onChange={onSelectChange}
                    placeholder={item.settings?.placeholder}
                    {...(item.settings?.isClearable ? { isClearable: true } : { isClearable: false })} // silly TS issue
                />
                {isFixed && (
                    <div className={styles.picker}>
                        <ColorPicker color={value?.fixed} onChange={onColorChange} enableNamedColors={true} />
                    </div>
                )}
            </div>
        </>
    );
};

const getStyles = (theme: GrafanaTheme2) => ({
    container: css({
        display: 'flex',
        flexWrap: 'nowrap',
        justifyContent: 'flex-end',
        alignItems: 'center',
    }),
    picker: css({
        paddingLeft: theme.spacing(1),
    }),
});
