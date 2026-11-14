import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toDataFrame, FieldType } from '@grafana/data';
import { OptIdentityEditor } from './OptIdentityEditor';

jest.mock('@grafana/ui', () => ({
  useStyles2: () => ({}),
  CollapsableSection: ({ children }) => <div>{children}</div>,
  Field: ({ label, children }) => (
    <div>
      {label}
      {children}
    </div>
  ),
  MultiSelect: () => null,
  RadioButtonGroup: () => null,
  InlineSwitch: () => null,
}));
jest.mock('./NsSeparatorEditor', () => ({ NsSeparatorEditor: () => null }));
jest.mock('../../grafana_core/ui/components/MatchersUI/FieldNamePicker', () => ({
  FieldNamePicker: ({ item, context, onChange }) => (
    <button
      onClick={() => onChange('pathNs')}
      data-fields={context.data[0].fields
        .filter(item.settings.filter)
        .map((field) => field.name)
        .join(',')}
    >
      {item.name}
    </button>
  ),
}));

it.each([[['shop', 'data']], ['["shop","data"]']])(
  'keeps B visible for both scalar and array namespace fields (%j)',
  async (value) => {
    const frame = toDataFrame({
      fields: [
        { name: 'sourceNs', type: FieldType.string, values: ['shop'] },
        { name: 'pathNs', type: Array.isArray(value) ? FieldType.other : FieldType.string, values: [value] },
      ],
    });
    const onChange = jest.fn();
    const options = {
      type: 'markers',
      locField: 'node',
      parField: 'target',
      config: {},
      optional: { vertexA_NS: 'sourceNs', vertexB_NS: 'targetNs' },
    };
    const props = (options: any) =>
      ({
        context: { data: [frame], options, instanceState: { options, onChange } },
        item: { settings: { isLogic: true, isExtendedEdition: false, getQueryFields: async () => [] } },
      }) as any;
    const view = render(<OptIdentityEditor {...props(options)} />);
    expect(screen.getByRole('button', { name: 'Vertex B namespace' })).toBeInTheDocument();
    const selector = screen.getByRole('button', { name: 'Vertex A namespace' });
    expect(selector).toHaveAttribute('data-fields', 'sourceNs,pathNs');
    fireEvent.click(selector);
    expect(onChange.mock.calls[0][0].optional).toMatchObject({ vertexA_NS: 'pathNs', vertexB_NS: 'targetNs' });
    view.rerender(<OptIdentityEditor {...props(onChange.mock.calls[0][0])} />);
    expect(screen.getByRole('button', { name: 'Vertex B namespace' })).toBeInTheDocument();
    view.rerender(<OptIdentityEditor {...props({ ...options, locField: undefined })} />);
    expect(screen.getByRole('button', { name: 'Vertex B namespace' })).toBeInTheDocument();
    view.rerender(<OptIdentityEditor {...props({ ...options, parField: undefined })} />);
    expect(screen.queryByRole('button', { name: 'Vertex B namespace' })).not.toBeInTheDocument();
    view.rerender(<OptIdentityEditor {...props(options)} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Vertex B namespace' })).toBeInTheDocument());
  }
);
