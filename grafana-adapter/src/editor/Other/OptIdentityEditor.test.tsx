import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { OptIdentityEditor } from './OptIdentityEditor';

jest.mock('@grafana/ui', () => ({
  useStyles2: () => ({}),
  CollapsableSection: ({ children }) => <div>{children}</div>,
  Field: ({ children }) => <div>{children}</div>,
  MultiSelect: ({ value, options, onChange }) => (
    <select
      multiple
      aria-label="Search by"
      value={value}
      onChange={(event) =>
        onChange(Array.from(event.currentTarget.selectedOptions, (option) => ({ value: option.value })))
      }
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

jest.mock('../../grafana_core/ui/components/MatchersUI/FieldNamePicker', () => ({
  FieldNamePicker: ({ item, onChange }) => <button onClick={() => onChange('edge-id')}>{item.name}</button>,
}));

function renderEditor(savedOptions: Record<string, unknown>) {
  const onChange = jest.fn();
  const options = { type: 'markers', name: 'nodes', parField: 'target', config: {}, ...savedOptions };
  render(
    <OptIdentityEditor
      context={{ options, instanceState: { options, onChange } } as any}
      item={
        {
          settings: {
            isLogic: false,
            isExtendedEdition: false,
            getQueryFields: async () => [
              { label: 'Alias', value: 'alias' },
              { label: 'Site', value: 'site' },
            ],
          },
        } as any
      }
      value={undefined}
      onChange={jest.fn()}
    />
  );
  return onChange;
}

describe('saved Search by options', () => {
  it.each([
    ['legacy fields', { searchProperties: ['alias'] }, ['alias']],
    ['new fields take precedence', { searchProperties: ['alias'], optional: { searchProps: ['site'] } }, ['site']],
    ['explicitly cleared fields', { searchProperties: ['alias'], optional: { searchProps: [] } }, []],
  ])('displays %s', async (_name, savedOptions, selected) => {
    renderEditor(savedOptions);
    await screen.findByRole('option', { name: 'Alias' });
    const select = screen.getByRole('listbox', { name: 'Search by' }) as HTMLSelectElement;
    expect(Array.from(select.selectedOptions, (option) => option.value)).toEqual(selected);
  });

  it('preserves legacy search fields when another identity option is edited', async () => {
    const onChange = renderEditor({ searchProperties: ['alias'] });
    await screen.findByRole('option', { name: 'Alias' });
    fireEvent.click(screen.getByRole('button', { name: 'Edge ID' }));

    const updated = onChange.mock.calls[0][0];
    expect(updated.optional).toMatchObject({ edgeId: 'edge-id', searchProps: ['alias'] });
    expect(updated).not.toHaveProperty('searchProperties');
  });

  it('saves an empty array and removes the legacy fields when Search by is cleared', async () => {
    const onChange = renderEditor({ searchProperties: ['alias'] });
    await screen.findByRole('option', { name: 'Alias' });
    const select = screen.getByRole('listbox', { name: 'Search by' }) as HTMLSelectElement;
    select.options[0].selected = false;
    fireEvent.change(select);

    const saved = JSON.parse(JSON.stringify(onChange.mock.calls[0][0]));
    expect(saved.optional.searchProps).toEqual([]);
    expect(saved).not.toHaveProperty('searchProperties');
  });
});
