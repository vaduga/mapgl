import { act, render, screen } from '@testing-library/react';
import React from 'react';

import type { GraphFrameDiagnostic, GraphFrameViewState } from '../../graph/frame';
import { GraphFrameDiagnostics } from './GraphFrameDiagnostics';

const diagnostic: GraphFrameDiagnostic = {
  code: 'missing-node-id-field',
  severity: 'fatal',
  message: 'Configured node field is missing',
  count: 2,
  examples: [
    {
      context: {
        frameRefId: 'Query A',
        fieldName: 'source',
        rowIndex: 4,
      },
      value: null,
    },
  ],
};

function state(overrides: Partial<GraphFrameViewState>): GraphFrameViewState {
  return {
    phase: 'ready',
    pending: false,
    hasCommittedState: true,
    diagnostics: [],
    ...overrides,
  };
}

describe('GraphFrameDiagnostics', () => {
  it('shows a concise fatal summary on dashboards and explains the retained baseline', () => {
    render(<GraphFrameDiagnostics state={state({ phase: 'fatal', diagnostics: [diagnostic] })} />);

    expect(screen.getByText('Graph refresh failed; showing the previous result')).toBeInTheDocument();
    expect(screen.getByText('2 data issues')).toBeInTheDocument();
    expect(screen.getByText('Open the panel editor for details.')).toBeInTheDocument();
    expect(screen.queryByText('Configured node field is missing')).not.toBeInTheDocument();
    expect(screen.queryByText(/row 4/)).not.toBeInTheDocument();
  });

  it('shows only the recoverable count and edit-mode hint on dashboards', () => {
    const recoverable: readonly GraphFrameDiagnostic[] = [
      {
        ...diagnostic,
        code: 'missing-edge-id-field',
        severity: 'warning',
        message: 'Configured edge ID field was not found in a selected frame',
        count: 1,
      },
      {
        ...diagnostic,
        code: 'dangling-target',
        severity: 'warning',
        message: 'Edge target does not resolve to a normalized node',
        count: 1,
      },
    ];

    render(<GraphFrameDiagnostics state={state({ diagnostics: recoverable })} />);

    expect(screen.getByText('Graph data contains issues')).toBeInTheDocument();
    expect(screen.getByText('2 data issues')).toBeInTheDocument();
    expect(screen.getByText('Open the panel editor for details.')).toBeInTheDocument();
    expect(screen.queryByText('Configured edge ID field was not found in a selected frame')).not.toBeInTheDocument();
    expect(screen.queryByText('Edge target does not resolve to a normalized node')).not.toBeInTheDocument();
    expect(screen.queryByText(/row 4/)).not.toBeInTheDocument();
  });

  it('shows frame, field, row, and example details while editing', () => {
    jest.useFakeTimers();
    render(<GraphFrameDiagnostics state={state({ phase: 'fatal', diagnostics: [diagnostic] })} editing />);

    expect(screen.getByText(/frame Query A, field source, row 4/)).toHaveTextContent(
      'frame Query A, field source, row 4: null'
    );
    expect(screen.getByRole('list', { name: 'Diagnostic details' })).toBeInTheDocument();
    expect(screen.getByText(/Configured node field is missing/)).toHaveTextContent('2 occurrences');
    expect(screen.getByText('1 more occurrence')).toBeInTheDocument();
    expect(screen.queryByText('Open the panel editor for details.')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('nests retained examples and summarizes occurrences beyond the example bound', () => {
    jest.useFakeTimers();
    render(
      <GraphFrameDiagnostics
        state={state({
          diagnostics: [
            {
              ...diagnostic,
              count: 148,
              examples: [
                diagnostic.examples[0],
                {
                  context: {
                    frameRefId: 'Query B',
                    fieldName: 'vertexB_path',
                    rowIndex: 27,
                  },
                  value: 'M2',
                },
              ],
            },
          ],
        })}
        editing
      />
    );

    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(screen.getByText('frame Query B, field vertexB_path, row 27: M2')).toBeInTheDocument();
    expect(screen.getByText('146 more occurrences')).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('dismisses dashboard diagnostics after two seconds', () => {
    jest.useFakeTimers();
    render(<GraphFrameDiagnostics state={state({ diagnostics: [diagnostic] })} />);

    act(() => jest.advanceTimersByTime(1999));
    expect(screen.getByTestId('graph-frame-recoverable')).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByTestId('graph-frame-recoverable')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('dismisses edit-mode diagnostics after ten seconds', () => {
    jest.useFakeTimers();
    render(<GraphFrameDiagnostics state={state({ phase: 'fatal', diagnostics: [diagnostic] })} editing />);

    act(() => jest.advanceTimersByTime(9999));
    expect(screen.getByTestId('graph-frame-fatal')).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByTestId('graph-frame-fatal')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('shows the current diagnostic again when entering or exiting panel edit mode', () => {
    jest.useFakeTimers();
    const currentState = state({ phase: 'fatal', diagnostics: [diagnostic] });
    const { rerender } = render(<GraphFrameDiagnostics state={currentState} />);

    act(() => jest.advanceTimersByTime(2000));
    expect(screen.queryByTestId('graph-frame-fatal')).not.toBeInTheDocument();

    rerender(<GraphFrameDiagnostics state={currentState} editing />);
    expect(screen.getByTestId('graph-frame-fatal')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Diagnostic details' })).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(9999));
    expect(screen.getByTestId('graph-frame-fatal')).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByTestId('graph-frame-fatal')).not.toBeInTheDocument();

    rerender(<GraphFrameDiagnostics state={currentState} />);
    expect(screen.getByTestId('graph-frame-fatal')).toBeInTheDocument();
    expect(screen.getByText('2 data issues')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Diagnostic details' })).not.toBeInTheDocument();

    act(() => jest.advanceTimersByTime(2000));
    expect(screen.queryByTestId('graph-frame-fatal')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('shows a new dashboard diagnostic result after the previous result was dismissed', () => {
    jest.useFakeTimers();
    const firstState = state({ diagnostics: [diagnostic] });
    const { rerender } = render(<GraphFrameDiagnostics state={firstState} />);

    act(() => jest.advanceTimersByTime(2000));
    expect(screen.queryByTestId('graph-frame-recoverable')).not.toBeInTheDocument();

    rerender(
      <GraphFrameDiagnostics
        state={state({
          diagnostics: [
            {
              ...diagnostic,
              code: 'dangling-target',
              message: 'Edge target does not resolve to a normalized node',
              count: 1,
            },
          ],
        })}
      />
    );

    expect(screen.getByTestId('graph-frame-recoverable')).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1999));
    expect(screen.getByTestId('graph-frame-recoverable')).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    expect(screen.queryByTestId('graph-frame-recoverable')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it('uses the shared empty state when a successful graph result has no nodes', () => {
    render(<GraphFrameDiagnostics state={state({ phase: 'empty' })} />);

    expect(screen.getByTestId('graph-frame-empty')).toHaveTextContent('No graph data');
  });

  it('hides diagnostic messages without hiding the empty state', () => {
    render(
      <GraphFrameDiagnostics state={state({ phase: 'empty', diagnostics: [diagnostic] })} editing hideDiagnostics />
    );

    expect(screen.getByTestId('graph-frame-empty')).toHaveTextContent('No graph data');
    expect(screen.queryByText('Configured node field is missing')).not.toBeInTheDocument();
  });

  it('hides fatal and recoverable diagnostic alerts when configured', () => {
    const { rerender } = render(
      <GraphFrameDiagnostics state={state({ phase: 'fatal', diagnostics: [diagnostic] })} hideDiagnostics />
    );

    expect(screen.queryByTestId('graph-frame-fatal')).not.toBeInTheDocument();

    rerender(<GraphFrameDiagnostics state={state({ diagnostics: [diagnostic] })} hideDiagnostics />);
    expect(screen.queryByTestId('graph-frame-recoverable')).not.toBeInTheDocument();
  });
});
