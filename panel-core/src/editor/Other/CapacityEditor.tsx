import { css } from '@emotion/css';
import React, { useCallback, useMemo } from 'react';

import { GrafanaTheme2, SelectableValue, StandardEditorProps } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { ComboboxCompat } from '../../components/Compat/ComboboxCompat';

import { useFieldDisplayNames, useMatcherSelectOptions } from '../../grafana_core/components/MatchersUI/utils';

export const CapacityDimensionEditor = (props: StandardEditorProps) => {
  const { value, context, onChange, item } = props;
  const { settings } = item;
  const styles = useStyles2(getStyles);

  const fixedValueOption = useMemo(
    () => ({
      label: 'Calculated',
      value: '_____fixed_____',
    }),
    []
  );

  const fieldName = value?.field;
  const isFixed = Boolean(!fieldName);
  const names = useFieldDisplayNames(context.data);
  const selectOptions = useMatcherSelectOptions(names, fieldName, {
    firstItem: fixedValueOption,
    fieldType: settings?.filteredFieldType,
  });

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
      } else {
        validateAndDoChange({
          fixed: 1,
          field: undefined,
        });
      }
    },
    [validateAndDoChange, value]
  );

  const selectedOption = isFixed ? fixedValueOption : selectOptions.find((v) => v.value === fieldName);
  return (
    <ComboboxCompat
      value={selectedOption}
      options={selectOptions}
      onChange={onSelectChange}
      //noOptionsMessage="No fields found"
    />
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  range: css({
    paddingTop: theme.spacing(1),
  }),
});
