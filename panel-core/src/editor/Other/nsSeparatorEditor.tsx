import type { StandardEditorProps } from '@grafana/data';
import { Combobox, type ComboboxOption } from '@grafana/ui';
import React from 'react';

const options: Array<ComboboxOption<string>> = [
  { label: '.', value: '.' },
  { label: ',', value: ',' },
  { label: '-', value: '-' },
];

export const DEFAULT_NAMESPACE_SEPARATOR = '.';

export const isValidNamespaceSeparator = (value: string): boolean => {
  const length = Array.from(value).length;
  return length > 0 && length <= 2;
};

export function resolveNamespaceSeparator(value: string | undefined): string {
  return value && isValidNamespaceSeparator(value) ? value : DEFAULT_NAMESPACE_SEPARATOR;
}

export function getNamespaceSeparatorOptions(value: string | undefined): Array<ComboboxOption<string>> {
  const selected = resolveNamespaceSeparator(value);
  return options.some((option) => option.value === selected)
    ? options
    : [...options, { label: selected, value: selected }];
}

export function NamespaceSeparatorEditor({ value, onChange }: StandardEditorProps<string>) {
  const selected = resolveNamespaceSeparator(value);
  const selectOptions = getNamespaceSeparatorOptions(value);

  const apply = (next: string | undefined) => {
    if (next && isValidNamespaceSeparator(next)) {
      onChange(next);
    }
  };

  return (
    <Combobox<string>
      aria-label="Namespace layers separator"
      createCustomValue
      customValueDescription="Use a one- or two-symbol separator"
      isClearable={false}
      onChange={(option) => apply(option.value)}
      options={selectOptions}
      value={selectOptions.find((option) => option.value === selected)}
    />
  );
}
