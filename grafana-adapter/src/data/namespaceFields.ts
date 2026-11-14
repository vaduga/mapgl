/** Datasources may supply namespace paths as native arrays or JSON string cells. */
export function parseNamespaceValue(value: unknown): unknown {
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}
