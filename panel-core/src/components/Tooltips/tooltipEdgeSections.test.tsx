import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TooltipEdgeSection } from '../../extension-points/featureContracts';
import { TooltipEdgeSectionList } from './tooltipEdgeSections';

jest.mock('@deck.gl/widgets', () => ({
  _Tooltip: ({ children }: { children: unknown }) => children,
}));

const section: TooltipEdgeSection = {
  id: 'adjacent',
  incomingLabel: 'input',
  outgoingLabel: 'output',
  incoming: [{ id: 'edge-a', edge: {} as TooltipEdgeSection['incoming'][number]['edge'] }],
  outgoing: [],
};

it('toggles populated directions and focuses their edges from the count control', () => {
  const onToggle = jest.fn();
  const onFocus = jest.fn();
  render(
    <TooltipEdgeSectionList
      sections={[section, { ...section, id: 'empty', incoming: [] }]}
      isListed={() => false}
      onToggle={onToggle}
      onFocus={onFocus}
      renderEdge={(record) => <li>{record.id}</li>}
    />
  );
  const trigger = screen.getByRole('button', { name: 'show input edges' });
  expect(trigger).toHaveAttribute('aria-pressed', 'false');
  expect(screen.queryByRole('button', { name: 'show output edges' })).not.toBeInTheDocument();
  expect(screen.queryByText('edge-a')).not.toBeInTheDocument();

  fireEvent.click(trigger);
  expect(onToggle).toHaveBeenCalledWith(section, 'incoming');
  const count = screen.getByRole('button', { name: 'input edges count' });
  fireEvent.mouseEnter(count);
  expect(onFocus).toHaveBeenCalledWith(section.incoming);
  fireEvent.click(count);
  expect(onToggle).toHaveBeenCalledTimes(2);
});

it('preserves keyboard focus and updates the pressed state and edge list', () => {
  const props = {
    sections: [section],
    onToggle: jest.fn(),
    renderEdge: (record: TooltipEdgeSection['incoming'][number]) => <li>{record.id}</li>,
  };
  const { rerender } = render(<TooltipEdgeSectionList {...props} isListed={() => false} />);
  const button = screen.getByRole('button', { name: 'show input edges' });
  button.focus();

  rerender(<TooltipEdgeSectionList {...props} isListed={() => true} />);
  expect(screen.getByRole('button', { name: 'hide input edges' })).toBe(button);
  expect(button).toHaveAttribute('aria-pressed', 'true');
  expect(document.activeElement).toBe(button);
  expect(screen.getByText('edge-a')).toBeInTheDocument();
});
