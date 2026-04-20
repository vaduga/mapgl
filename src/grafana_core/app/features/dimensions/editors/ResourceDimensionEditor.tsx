import { useCallback } from 'react';
import * as React from 'react';

import { FieldNamePickerConfigSettings, StandardEditorProps, StandardEditorsRegistryItem } from '@grafana/data';
import { t } from '../../../../../utils/i18n';
import { ResourceDimensionConfig, ResourceDimensionMode } from '@grafana/schema';
import { InlineField, InlineFieldRow, RadioButtonGroup } from '@grafana/ui';
import { FieldNamePicker } from '../../../../components/MatchersUI/FieldNamePicker';

import { getPublicOrAbsoluteUrl } from '../resource';
import { MediaType, ResourceDimensionOptions, ResourceFolderName, ResourcePickerSize } from '../types';

import { ResourcePicker } from './ResourcePicker';

const dummyFieldSettings = {
  settings: {},
} as StandardEditorsRegistryItem<string, FieldNamePickerConfigSettings>;

export const ResourceDimensionEditor = (
  props: StandardEditorProps<ResourceDimensionConfig, ResourceDimensionOptions, unknown>
) => {
  const { value, context, onChange, item } = props;
  const labelWidth = 9;

  const onModeChange = useCallback(
    (mode: ResourceDimensionMode) => {
      onChange({
        ...value,
        mode,
      });
    },
    [onChange, value]
  );

  const onFieldChange = useCallback(
    (field = '') => {
      onChange({
        ...value,
        field,
      });
    },
    [onChange, value]
  );

  const onFixedChange = useCallback(
    (fixed?: string) => {
      onChange({
        ...value,
        fixed: fixed ?? '',
      });
    },
    [onChange, value]
  );

  const onClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange({ mode: ResourceDimensionMode.Fixed, fixed: '', field: '' });
  };

  const mode = value?.mode ?? ResourceDimensionMode.Fixed;
  const showSourceRadio = item.settings?.showSourceRadio ?? true;
  const mediaType = item.settings?.resourceType ?? MediaType.Icon;
  const folderName = item.settings?.folderName ?? ResourceFolderName.Networking;
  const maxFiles = item.settings?.maxFiles; // undefined leads to backend default
  let srcPath = '';
  if (mediaType === MediaType.Icon) {
    if (value?.fixed) {
      srcPath = getPublicOrAbsoluteUrl(value.fixed);
    } else if (item.settings?.placeholderValue) {
      srcPath = getPublicOrAbsoluteUrl(item.settings.placeholderValue);
    }
  }

  return (
    <>
      {mode !== ResourceDimensionMode.Fixed && (
        <InlineFieldRow>
          <InlineField
            label={t('dimensions.resource-dimension-editor.label-field', 'Field')}
            labelWidth={labelWidth}
            grow={true}
          >
            <FieldNamePicker
              context={context}
              value={value.field ?? ''}
              onChange={onFieldChange}
              item={dummyFieldSettings}
            />
          </InlineField>
        </InlineFieldRow>
      )}
      {mode === ResourceDimensionMode.Fixed && (
        <ResourcePicker
          onChange={onFixedChange}
          onClear={onClear}
          value={value?.fixed}
          src={srcPath}
          placeholder={item.settings?.placeholderText ?? 'Select a value'}
          name={niceName(value?.fixed) ?? ''}
          mediaType={mediaType}
          folderName={folderName}
          size={ResourcePickerSize.NORMAL}
          maxFiles={maxFiles}
        />
      )}
      {mode === ResourceDimensionMode.Mapping && (
        <InlineFieldRow>
          <InlineField
            label={t('dimensions.resource-dimension-editor.label-mappings', 'Mappings')}
            labelWidth={labelWidth}
            grow={true}
          >
            <div>TODO mappings editor!</div>
          </InlineField>
        </InlineFieldRow>
      )}
    </>
  );
};

export function niceName(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const idx = value.lastIndexOf('/');
  if (idx > 0) {
    return value.substring(idx + 1);
  }
  return value;
}
