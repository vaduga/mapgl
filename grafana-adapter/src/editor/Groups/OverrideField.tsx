import {
  AutoSizeInput,
  Combobox,
  IconButton,
  InlineField,
  MultiSelect,
  Select,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import { OverField, Rule } from '@vaduga/mapgl-core/style';
import React, { ReactNode, useEffect, useState } from 'react';
import { DataFrame, FieldType, getFieldDisplayName, GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css } from '@emotion/css';
import { RuleOption } from './RuleItem';
import { t } from '@vaduga/mapgl-core/utils/i18n';
import { useFieldDisplayNames } from '../../grafana_core/ui/components/MatchersUI/utils';

interface OverrideFieldProps {
  overrideField: OverField;
  key: string;
  ID: string;

  nameTypeSetter: any;
  rule: Rule;
  valueSetter: any;
  remover: any;
  index: number;
  disabled: boolean;
  context: any;
}

export const OverrideField: React.FC<OverrideFieldProps> = (options: OverrideFieldProps) => {
  const styles = useStyles2(getThresholdFieldStyles);
  const theme = useTheme2();
  const fieldNames = useFieldDisplayNames(options.context.data ?? []);
  const [cachedThresholdOptions, setCachedThresholdOptions] = useState<RuleOption[]>([]);
  const hasData = Boolean(options.context.data && options.context.data.length > 0);
  const instanceState = options.context.instanceState;
  const selectedMetricField = options.context.options?.config?.style?.color?.field;
  const colorThresholds =
    (instanceState?.layer?.colorLegend ? { steps: instanceState.layer.colorLegend } : undefined) ??
    options.context.options?.config?.style?.color?.thresholds ??
    fieldNames.fields.get(selectedMetricField)?.config?.thresholds ??
    undefined;
  const tOptions: RuleOption[] =
    colorThresholds?.steps
      ?.map((t) => {
        if (t === undefined) {
          return null;
        }
        return {
          color: theme.visualization.getColorByName(t.color),
          label: t.color,
          value: t.value,
        };
      })
      .filter((t) => t !== null) ?? [];

  useEffect(() => {
    if (tOptions.length) {
      setCachedThresholdOptions(tOptions);
    }
  }, [tOptions]);

  if (hasData) {
    const frames: DataFrame[] = options.context.data;
    const fieldOptions = [{ value: 'threshold', label: 'threshold', name: 'thrColor', type: FieldType.enum }];
    const seen = new Set(['thrColor']);
    for (const frame of frames) {
      for (const field of frame.fields) {
        const { name, type } = field;
        if (seen.has(name)) {
          continue;
        }
        seen.add(name);
        const label = getFieldDisplayName(field, frame, frames);
        fieldOptions.push({ value: `display:${name}`, label, name, type });
        if (label !== name) {
          fieldOptions.push({
            value: `base:${name}`,
            label: t('grafana-ui.matchers.labels.base-field-name', '{{name}} (base field name)', { name }),
            name,
            type,
          });
        }
      }
    }
    const selectedName = options.overrideField.name;
    const selectedField = fieldOptions.find((field) => field.name === selectedName);
    const missingField =
      selectedName && !selectedField
        ? {
            value: `missing:${selectedName}`,
            label: t('grafana-ui.matchers.labels.not-found', '{{name}} (not found)', { name: selectedName }),
          }
        : undefined;
    const isThresField = options.overrideField.name === 'thrColor' && options.overrideField.type === 'enum';

    const thrColors = Array.isArray(options.overrideField.value) ? options.overrideField.value : [];
    const activeThresholdOptions = tOptions.length ? tOptions : cachedThresholdOptions;
    const fallbackOptions: RuleOption[] = thrColors.map((color) => ({
      color: theme.visualization.getColorByName(color),
      label: color,
      value: color as any,
    }));
    const mergedOptions = [
      ...activeThresholdOptions,
      ...fallbackOptions.filter(
        (fallback) => !activeThresholdOptions.some((option) => option.label === fallback.label)
      ),
    ];
    const storedOptions = thrColors.length ? mergedOptions.filter((t) => thrColors.includes(t.label)) : [];

    const renderOption = (option: SelectableValue<number>) =>
      (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: 'color' in option ? option.color : undefined,
              borderRadius: '50%',
              marginRight: 8,
            }}
          ></div>
          {option.value}
        </div>
      ) as ReactNode;

    return (
      <>
        <InlineField shrink label={'prop ' + (options.index + 1)}>
          <Combobox
            options={missingField ? [...fieldOptions, missingField] : fieldOptions}
            value={selectedField ?? missingField}
            placeholder={t('grafana-ui.matchers-ui.field-name-picker.placeholder', 'Select field')}
            onChange={({ value }) => {
              const field = fieldOptions.find((option) => option.value === value);
              if (field) {
                options.nameTypeSetter(options.index, field.name, field.type);
              }
            }}
          />
        </InlineField>
        {isThresField ? (
          // shrink label="thr"
          <InlineField>
            <MultiSelect
              options={mergedOptions}
              value={storedOptions}
              getOptionLabel={renderOption}
              onChange={(t: Array<SelectableValue<number>>) => {
                options.valueSetter(
                  options.index,
                  t.map((t) => String(t.label))
                );
                //setSelThresOpts(t)
              }}
            />
          </InlineField>
        ) : (
          <InlineField label="values">
            <AutoSizeInput
              minWidth={10}
              // disabled={!options.overrideField.name}
              onCommitChange={(v) => {
                options.valueSetter(options.index, v.currentTarget.value);
              }}
              defaultValue={options.overrideField.value}
              placeholder={'val1,val2...'}
            />
          </InlineField>
        )}
        <InlineField className={styles.rmButton}>
          <IconButton
            disabled={options.disabled}
            key="deleteThresholdField"
            variant="destructive"
            name="x"
            tooltip="remove property"
            onClick={() => options.remover(options.index)}
          />
        </InlineField>
      </>
    );
  }

  return <Select onChange={() => {}} disabled={true} />;
};

const getThresholdFieldStyles = (theme: GrafanaTheme2) => {
  return {
    colorPicker: css`
      padding: 0 ${theme.spacing(1)};
    `,
    rmButton: css`
      align-items: center;
    `,
  };
};
