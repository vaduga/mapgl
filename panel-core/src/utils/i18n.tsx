import React from 'react';

type InterpolationValues = Record<string, string | number | boolean | null | undefined>;

export function t(_key: string, defaultValue: string, values?: InterpolationValues): string {
  if (!values) {
    return defaultValue;
  }

  return defaultValue.replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, name: string) => {
    const value = values[name];
    return value == null ? '' : String(value);
  });
}

type TransProps = {
  i18nKey?: string;
  children?: React.ReactNode;
};

export const Trans = ({ children }: TransProps) => <>{children}</>;

export async function initPluginTranslations(_pluginId: string): Promise<void> {}
