import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import copy from 'copy-to-clipboard';
import { PositionTracker } from './PositionTracker';

jest.mock('@deck.gl/widgets', () => ({
  _Tooltip: ({ children }: { children: unknown }) => children,
}));
jest.mock('copy-to-clipboard', () => jest.fn(() => true));

beforeEach(() => jest.clearAllMocks());

it('formats displayed coordinates while copying the original GeoJSON', () => {
  const point = { type: 'Point', coordinates: [110.123456789, 53.98], properties: { site: 'rack' } };
  render(<PositionTracker isLogic={false} selectedCoord={point} />);

  expect(screen.getByText('110.123457')).toBeInTheDocument();
  expect(screen.getByText('53.980000')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Copy GeoJSON' }));
  expect(copy).toHaveBeenCalledWith(JSON.stringify(point));
});

it('keeps the focused copy button and uses the current coordinates after an update', () => {
  const original = { type: 'Point', coordinates: [10, 20] };
  const current = { type: 'Point', coordinates: ['30.5', '40.5'] };
  const { rerender } = render(<PositionTracker isLogic={false} selectedCoord={original} />);
  const button = screen.getByRole('button', { name: 'Copy GeoJSON' });
  button.focus();

  rerender(<PositionTracker isLogic={false} selectedCoord={current} />);
  expect(screen.getByRole('button', { name: 'Copy GeoJSON' })).toBe(button);
  expect(document.activeElement).toBe(button);
  fireEvent.click(button);
  expect(copy).toHaveBeenCalledWith(JSON.stringify(current));
});

it('shows logical coordinates without a GeoJSON copy control', () => {
  render(<PositionTracker isLogic selectedCoord={{ coordinates: [7, 8] }} />);
  expect(screen.getByText('7.000000')).toBeInTheDocument();
  expect(screen.getByText('8.000000')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Copy GeoJSON' })).not.toBeInTheDocument();
});
