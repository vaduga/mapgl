import React, { useCallback, useId } from 'react';
import { css } from '@emotion/css';

import {
  FieldNamePickerConfigSettings,
  GrafanaTheme2,
  SelectableValue,
  StandardEditorProps,
  StandardEditorsRegistryItem,
} from '@grafana/data';
import { t } from '../../../../../utils/i18n';
import { TextDimensionConfig, TextDimensionMode } from '@grafana/schema';
import { Button, InlineField, InlineFieldRow, Input, RadioButtonGroup, useStyles2 } from '@grafana/ui';
import { ComboboxCompat } from '../../../../../components/Compat/ComboboxCompat';
import { frameHasName, useFieldDisplayNames, useMatcherSelectOptions } from '../../../../components/MatchersUI/utils';

import { TextDimensionOptions } from '../types';

const dummyFieldSettings = {
  settings: {},
} as StandardEditorsRegistryItem<string, FieldNamePickerConfigSettings>;

type Props = StandardEditorProps<TextDimensionConfig, TextDimensionOptions>;

export const TextDimensionEditor = ({ value, context, onChange }: Props) => {
  const styles = useStyles2(getStyles);
  const textOptions = [
    {
      label: t('dimensions.text-dimension-editor.label-fixed', 'Fixed'),
      value: TextDimensionMode.Fixed,
      description: t('dimensions.text-dimension-editor.description-fixed', 'Fixed value'),
    },
    {
      label: t('dimensions.text-dimension-editor.label-field', 'Field'),
      value: TextDimensionMode.Field,
      description: t('dimensions.text-dimension-editor.description-field', 'Display field value'),
    },
    //  { label: 'Template', value: TextDimensionMode.Template, description: 'use template text' },
  ];
  const labelWidth = 7;

  const onModeChange = useCallback(
    (mode: TextDimensionMode) => {
      onChange({
        ...value,
        mode,
      });
    },
    [onChange, value]
  );

  const onFieldChange = useCallback(
    (field?: string) => {
      onChange({
        ...value,
        field,
      });
    },
    [onChange, value]
  );

  const onFixedChange = useCallback(
    (fixed = '') => {
      onChange({
        ...value,
        fixed,
      });
    },
    [onChange, value]
  );

  const onClearFixed = () => {
    onFixedChange('');
  };

  const fieldInputId = useId();
  const valueInputId = useId();
  const templateInputId = useId();

  const mode = value?.mode ?? TextDimensionMode.Fixed;
  return (
    <>
      <InlineFieldRow>
        <InlineField
          className={styles.field}
          label={t('dimensions.text-dimension-editor.label-source', 'Source')}
          labelWidth={labelWidth}
          grow={true}
        >
          <div className={styles.inputWrap}>
            <RadioButtonGroup value={mode} options={textOptions} onChange={onModeChange} fullWidth />
          </div>
        </InlineField>
      </InlineFieldRow>
      {mode !== TextDimensionMode.Fixed && (
        <InlineFieldRow>
          <InlineField
            className={styles.field}
            label={t('dimensions.text-dimension-editor.label-field', 'Field')}
            labelWidth={labelWidth}
            grow={true}
          >
            <div className={styles.inputWrap}>
              <FieldNamePickerCompact
                className={styles.compactPicker}
                id={fieldInputId}
                context={context}
                value={value.field ?? ''}
                onChange={onFieldChange}
                item={dummyFieldSettings}
              />
            </div>
          </InlineField>
        </InlineFieldRow>
      )}
      {mode === TextDimensionMode.Fixed && (
        <InlineFieldRow key={value?.fixed}>
          <InlineField
            className={styles.field}
            label={t('dimensions.text-dimension-editor.label-value', 'Value')}
            labelWidth={labelWidth}
            grow={true}
          >
            <div className={styles.inputWrap}>
              <CompactStringInput
                id={valueInputId}
                className={styles.compactTextInput}
                value={value?.fixed}
                onChange={onFixedChange}
                suffix={
                  value?.fixed && (
                    <Button
                      aria-label={t('dimensions.text-dimension-editor.aria-label-clear-value', 'Clear value')}
                      icon="times"
                      variant="secondary"
                      fill="text"
                      size="sm"
                      onClick={onClearFixed}
                    />
                  )
                }
              />
            </div>
          </InlineField>
        </InlineFieldRow>
      )}
      {mode === TextDimensionMode.Template && (
        <InlineFieldRow>
          <InlineField
            className={styles.field}
            label={t('dimensions.text-dimension-editor.label-template', 'Template')}
            labelWidth={labelWidth}
            grow={true}
          >
            <div className={styles.inputWrap}>
              <CompactStringInput
                id={templateInputId}
                className={styles.compactTextInput}
                value={value?.fixed}
                onChange={onFixedChange}
              />
            </div>
          </InlineField>
        </InlineFieldRow>
      )}
    </>
  );
};

type FieldNamePickerCompactProps = StandardEditorProps<string, FieldNamePickerConfigSettings> & {
  className?: string;
};

const FieldNamePickerCompact = ({ value, onChange, context, item, id, className }: FieldNamePickerCompactProps) => {
  const settings: FieldNamePickerConfigSettings = item.settings ?? {};
  const names = useFieldDisplayNames(context.data, settings?.filter);
  const selectOptions = useMatcherSelectOptions(names, value, { baseNameMode: settings.baseNameMode });
  const selectedOption = selectOptions.find((v) => v.value === value);

  const onChangeOption = (opt: SelectableValue<string> | null) => {
    if (opt != null && !frameHasName(opt.value, names)) {
      return;
    }
    onChange(opt?.value);
  };

  return (
    <ComboboxCompat
      className={className}
      id={id}
      value={selectedOption}
      options={selectOptions}
      onChange={onChangeOption}
      placeholder={
        settings.placeholderText ?? t('grafana-ui.matchers-ui.field-name-picker.placeholder', 'Select field')
      }
      isClearable={settings.isClearable}
    />
  );
};

type CompactStringInputProps = {
  id?: string;
  value?: string;
  onChange: (value?: string) => void;
  suffix?: React.ReactNode;
  className?: string;
};

const CompactStringInput = ({ id, value, onChange, suffix, className }: CompactStringInputProps) => {
  const commitValue = (e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    let nextValue = value ?? '';

    if ('key' in e) {
      if (e.key !== 'Enter') {
        return;
      }
      nextValue = e.currentTarget.value.trim();
    } else {
      nextValue = e.currentTarget.value.trim();
    }

    if (nextValue === value) {
      return;
    }

    onChange(nextValue === '' ? undefined : nextValue);
  };

  return (
    <Input
      id={id}
      className={className}
      defaultValue={value || ''}
      onBlur={commitValue}
      onKeyDown={commitValue}
      suffix={suffix}
    />
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  field: css({
    width: '100%',
    flex: '1 1 auto',
    minWidth: 0,
    maxWidth: '100%',
    alignItems: 'center',

    '& > *': {
      flex: '1 1 auto',
      minWidth: 0,
      maxWidth: '100%',
    },
  }),
  inputWrap: css({
    width: '100%',
    flex: '1 1 auto',
    minWidth: 0,
    maxWidth: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    minHeight: theme.spacing(4),

    '& > *': {
      flex: '1 1 auto',
      minWidth: '0 !important',
      maxWidth: '100% !important',
      width: '100% !important',
      boxSizing: 'border-box',
    },

    '& [class*="inputWrapper"]': {
      minWidth: '0 !important',
      maxWidth: '100% !important',
      width: '100% !important',
      flex: '1 1 auto !important',
    },

    '& [class*="input"]': {
      minWidth: '0 !important',
      maxWidth: '100% !important',
    },

    '& [class*="select"]': {
      minWidth: '0 !important',
      maxWidth: '100% !important',
    },

    '& input': {
      minWidth: '0 !important',
      maxWidth: '100% !important',
      width: '100% !important',
    },

    '& [class*="radioButtonGroup"]': {
      minWidth: 0,
      maxWidth: '100%',
    },
  }),
  compactPicker: css({
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    height: theme.spacing(4),

    '& > *': {
      minWidth: '0 !important',
      maxWidth: '100% !important',
      width: '100% !important',
      height: `${theme.spacing(4)}px !important`,
    },

    '& [class*="control"]': {
      minWidth: '0 !important',
      maxWidth: '100% !important',
      width: '100% !important',
      boxSizing: 'border-box',
      minHeight: `${theme.spacing(4)}px !important`,
      height: `${theme.spacing(4)}px !important`,
      alignItems: 'center',
    },

    '& [class*="valueContainer"]': {
      width: '100%',
      minWidth: '0 !important',
      maxWidth: '100% !important',
      overflow: 'hidden',
      boxSizing: 'border-box',
      height: `${theme.spacing(4)}px !important`,
      minHeight: `${theme.spacing(4)}px !important`,
      paddingTop: '0 !important',
      paddingBottom: '0 !important',
      display: 'flex',
      alignItems: 'center',
    },

    '& [class*="singleValue"]': {
      maxWidth: '100%',
      lineHeight: `${theme.spacing(4)}px`,
    },

    '& [class*="indicatorsContainer"]': {
      height: `${theme.spacing(4)}px !important`,
      minHeight: `${theme.spacing(4)}px !important`,
    },

    '& [class*="indicatorContainer"]': {
      height: `${theme.spacing(4)}px !important`,
      minHeight: `${theme.spacing(4)}px !important`,
      paddingTop: 0,
      paddingBottom: 0,
    },
  }),
  compactTextInput: css({
    width: '100%',
    flex: '1 1 auto',
    minWidth: 0,
    maxWidth: '100%',

    '& > *': {
      display: 'block',
      flex: '1 1 auto',
      minWidth: '0 !important',
      maxWidth: '100% !important',
      width: '100% !important',
      boxSizing: 'border-box',
    },

    '& input': {
      minWidth: '0 !important',
      maxWidth: '100% !important',
      width: '100% !important',
      boxSizing: 'border-box',
      height: theme.spacing(4),
      minHeight: theme.spacing(4),
      textOverflow: 'ellipsis',
    },
  }),
});
