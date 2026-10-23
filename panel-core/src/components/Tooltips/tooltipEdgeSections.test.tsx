import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TooltipEdgeSection } from '../../extension-points/featureContracts';
import { TooltipEdgeSectionList } from './tooltipEdgeSections';

const section: TooltipEdgeSection = {
  id: 'adjacent',
  incomingLabel: 'input',
  outgoingLabel: 'output',
  incoming: [{ id: 'edge-a', edge: {} as TooltipEdgeSection['incoming'][number]['edge'] }],
  outgoing: [],
};

it('toggles populated directions, focuses their edges and retains keyboard focus', () => {
  const onToggle = jest.fn();
  const onFocus = jest.fn();
  const props = {
    sections: [section, { ...section, id: 'empty', incoming: [] }],
    onToggle,
    onFocus,
    renderEdge: (record: TooltipEdgeSection['incoming'][number]) => <li>{record.id}</li>,
  };
  const { rerender } = render(<TooltipEdgeSectionList {...props} isListed={() => false} />);
  const trigger = screen.getByRole('button', { name: 'input' });
  expect(trigger).toHaveAttribute('aria-pressed', 'false');
  expect(screen.queryByRole('button', { name: 'output' })).not.toBeInTheDocument();
  expect(screen.queryByText('edge-a')).not.toBeInTheDocument();

  fireEvent.click(trigger);
  expect(onToggle).toHaveBeenCalledWith(section, 'incoming');
  const count = screen.getByRole('button', { name: 'input edges count' });
  fireEvent.mouseEnter(count);
  expect(onFocus).toHaveBeenCalledWith(section.incoming);
  fireEvent.click(count);
  expect(onToggle).toHaveBeenCalledTimes(2);
  const button = trigger;
  button.focus();

  rerender(<TooltipEdgeSectionList {...props} isListed={() => true} />);
  expect(screen.getByRole('button', { name: 'input' })).toBe(button);
  expect(button).toHaveAttribute('aria-pressed', 'true');
  expect(document.activeElement).toBe(button);
  expect(screen.getByText('edge-a')).toBeInTheDocument();
});
