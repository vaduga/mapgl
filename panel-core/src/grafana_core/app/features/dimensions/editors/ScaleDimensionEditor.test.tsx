import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import { toDataFrame } from '@grafana/data';
import { ScaleDimensionConfig } from '@grafana/schema';

import { ScaleDimensionEditor } from './ScaleDimensionEditor';

const originalGetContext = HTMLCanvasElement.prototype.getContext;

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    measureText: () => ({ width: 0 }),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

afterAll(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
});

const renderEditor = (value: ScaleDimensionConfig, onChange = jest.fn()) => {
  render(
    <ScaleDimensionEditor
      id="size-field"
      value={value}
      onChange={onChange}
      context={{
        data: [
          toDataFrame({
            name: 'nodes',
            fields: [{ name: 'metric', values: [0, 50, 100] }],
          }),
        ],
      }}
      item={
        {
          id: 'size',
          name: 'Size',
          settings: { min: 1, max: 100, filteredFieldType: 'number' },
        } as any
      }
    />
  );

  return onChange;
};

describe('ScaleDimensionEditor', () => {
  const descendingValue: ScaleDimensionConfig = {
    field: 'metric',
    fixed: 10,
    min: 20,
    max: 5,
  };

  it.each([
    ['Min', '30', { min: 30, max: 5 }],
    ['Max', '3', { min: 20, max: 3 }],
  ])('persists a descending range when %s crosses the other endpoint', (label, nextValue, expected) => {
    jest.useFakeTimers();
    const onChange = renderEditor(descendingValue);

    fireEvent.change(screen.getByLabelText(label), { target: { value: nextValue } });
    act(() => jest.advanceTimersByTime(500));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining(expected));
    expect(onChange.mock.calls.at(-1)?.[0]).not.toHaveProperty('inverted');
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('attaches scale direction guidance to the Min label', () => {
    renderEditor(descendingValue);

    expect(screen.getByText('Min').closest('label')?.contains(screen.getByTestId('info-circle'))).toBe(true);
    expect(screen.queryByText(/invert scale/i)).toBeNull();
  });
});
