import React, { useCallback, useMemo } from 'react';

import { type FieldNamePickerConfigSettings, type SelectableValue, type StandardEditorProps } from '@grafana/data';
import { Combobox, type ComboboxOption } from '@grafana/ui';
import { t } from '@mapgl/panel-core/utils/i18n';

import { useFieldDisplayNames, useMatcherSelectOptions, frameHasName } from './utils';

type Props = StandardEditorProps<string, FieldNamePickerConfigSettings> & {
  /** Additional options supplied by callers, such as panel-specific pseudo-fields. */
  options?: Array<ComboboxOption<string>>;
};

// Pick a field name out of the fields
export const FieldNamePicker = ({ value, onChange, context, item, id, options = [] }: Props) => {
  const settings: FieldNamePickerConfigSettings = item?.settings ?? {};
  const names = useFieldDisplayNames(context.data, settings?.filter);
  const fieldOptions = useMatcherSelectOptions(names, value, { baseNameMode: settings.baseNameMode });
  const selectOptions = useMemo(() => {
    const seen = new Set<string>();
    const uniqueOptions: Array<ComboboxOption<string>> = [];

    for (const option of [...options, ...fieldOptions]) {
      if (typeof option.value !== 'string' || seen.has(option.value)) {
        continue;
      }
      seen.add(option.value);
      uniqueOptions.push(option);
    }

    return uniqueOptions;
  }, [fieldOptions, options]);

  const selectedOption = selectOptions.find((v) => v.value === value);
  const suppliedOptionValues = useMemo(
    () => new Set(options.flatMap((option) => (typeof option.value === 'string' ? [option.value] : []))),
    [options]
  );

  const onChangeOption = useCallback(
    (opt: SelectableValue<string> | null) => {
      if (opt != null && !frameHasName(opt.value, names) && !suppliedOptionValues.has(opt.value ?? '')) {
        return;
      }
      onChange(opt?.value);
    },
    [names, onChange]
  );

  return (
    <Combobox
      id={id}
      value={selectedOption}
      options={selectOptions}
      onChange={onChangeOption}
      placeholder={
        settings.placeholderText ?? t('grafana-ui.matchers-ui.field-name-picker.placeholder', 'Select field')
      }
      // noOptionsMessage={settings.noFieldsMessage}
      width={settings.width}
      isClearable={settings.isClearable}
    />
  );
};
