import { createTheme, FieldType, toDataFrame } from '@grafana/data';
import { TextDimensionMode } from '@grafana/schema';
import { getTextDimension } from './text';

describe('template text dimension', () => {
  it('fills ${field} with each row\'s formatted value', () => {
    const frame = toDataFrame({
      fields: [
        { name: 'name', type: FieldType.string, values: ['api', 'db'] },
        { name: 'Value #D', type: FieldType.number, values: [1500, 2], config: { unit: 'bps' } },
      ],
    });
    const text = getTextDimension(frame, { mode: TextDimensionMode.Template, fixed: '${name}\n↑ ${Value #D}${none}' }, createTheme());
    expect(text.get(0)).toBe('api\n↑ 1.50 kb/s');
    expect(text.get(1)).toBe('db\n↑ 2 b/s');
  });
});
