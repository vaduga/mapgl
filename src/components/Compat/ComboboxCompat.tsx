import React from 'react';
import { SelectableValue } from '@grafana/data';
import * as GrafanaUI from '@grafana/ui';

export type ComboboxCompatOption<T = string> = SelectableValue<T>;

type ComboboxCompatProps<T = string> = {
  createCustomValue?: boolean;
  allowCustomValue?: boolean;
  options?: Array<SelectableValue<T>>;
  value?: SelectableValue<T> | T | null;
  onChange?: (value: any) => void;
} & Record<string, any>;

export const ComboboxCompat = <T = string,>(props: ComboboxCompatProps<T>) => {
  const { createCustomValue, allowCustomValue, ...rest } = props;
  const Combobox = (GrafanaUI as any).Combobox;
  const Select = (GrafanaUI as any).Select;
  const Component = Combobox ?? Select;

  if (!Component) {
    return null;
  }

  if (!Combobox) {
    return <Component {...rest} allowCustomValue={allowCustomValue ?? createCustomValue} />;
  }

  return <Component {...rest} createCustomValue={createCustomValue ?? allowCustomValue} />;
};
