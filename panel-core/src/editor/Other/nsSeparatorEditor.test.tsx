import {
  DEFAULT_NAMESPACE_SEPARATOR,
  getNamespaceSeparatorOptions,
  isValidNamespaceSeparator,
  resolveNamespaceSeparator,
} from './nsSeparatorEditor';

describe('namespace separator editor', () => {
  it('accepts one or two symbols only', () => {
    expect(isValidNamespaceSeparator('.')).toBe(true);
    expect(isValidNamespaceSeparator('--')).toBe(true);
    expect(isValidNamespaceSeparator('🧭')).toBe(true);
    expect(isValidNamespaceSeparator('')).toBe(false);
    expect(isValidNamespaceSeparator('abc')).toBe(false);
  });

  it('falls back to a selected dot when no separator is configured', () => {
    expect(resolveNamespaceSeparator(undefined)).toBe(DEFAULT_NAMESPACE_SEPARATOR);
    expect(getNamespaceSeparatorOptions(undefined).find((option) => option.value === '.')?.label).toBe('.');
  });

  it('adds a configured custom separator to the select options', () => {
    const custom = getNamespaceSeparatorOptions('--').find((option) => option.value === '--');

    expect(custom).toEqual({ label: '--', value: '--' });
    expect(resolveNamespaceSeparator('--')).toBe('--');
  });
});
