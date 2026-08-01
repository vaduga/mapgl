import React from 'react';
import { EmptyState } from '@grafana/ui';

import type { GraphFrameDiagnostic, GraphFrameViewState } from '../../graph/frame';
import {
  PanelDiagnosticAlert,
  PanelDiagnosticDetails,
  TransientPanelDiagnostics,
  type PanelDiagnostic,
} from './PanelDiagnostics';

export interface GraphFrameDiagnosticsProps {
  readonly state: GraphFrameViewState;
  readonly editing?: boolean;
  readonly hideDiagnostics?: boolean;
}

function diagnosticCount(diagnostics: readonly GraphFrameDiagnostic[]): number {
  return diagnostics.reduce((count, diagnostic) => count + diagnostic.count, 0);
}

function exampleLabel(example: GraphFrameDiagnostic['examples'][number]): string {
  const parts = [
    example?.context.frameRefId && `frame ${example.context.frameRefId}`,
    example?.context.fieldName && `field ${example.context.fieldName}`,
    example?.context.rowIndex !== undefined && `row ${example.context.rowIndex}`,
  ].filter(Boolean);
  const context = parts.join(', ') || 'Example';
  const value = valueLabel(example.value);
  return value === undefined ? context : `${context}: ${value}`;
}

function valueLabel(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  try {
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function DiagnosticSummary({ diagnostics }: { diagnostics: readonly GraphFrameDiagnostic[] }) {
  const count = diagnosticCount(diagnostics);

  return (
    <>
      <div>
        {count} data {count === 1 ? 'issue' : 'issues'}
      </div>
      <div>Open the panel editor for details.</div>
    </>
  );
}

export function GraphFrameDiagnostics({ state, editing = false, hideDiagnostics = false }: GraphFrameDiagnosticsProps) {
  const diagnostics = React.useMemo<readonly PanelDiagnostic[]>(
    () =>
      state.diagnostics.map((diagnostic) => ({
        code: diagnostic.code,
        message: diagnostic.message,
        count: diagnostic.count,
        examples: diagnostic.examples.map((example) => ({ label: exampleLabel(example) })),
      })),
    [state.diagnostics]
  );

  if (state.phase === 'idle' || state.phase === 'loading') {
    return null;
  }

  if (state.phase === 'empty') {
    return (
      <div data-testid="graph-frame-empty">
        <EmptyState message="No graph data" variant="not-found" role="status">
          {editing && (
            <TransientPanelDiagnostics
              identity={state.diagnostics}
              active={diagnostics.length > 0}
              editing
              hidden={hideDiagnostics}
            >
              <PanelDiagnosticDetails diagnostics={diagnostics} />
            </TransientPanelDiagnostics>
          )}
        </EmptyState>
      </div>
    );
  }

  if (state.phase === 'fatal') {
    return (
      <PanelDiagnosticAlert
        diagnostics={diagnostics}
        testId="graph-frame-fatal"
        title={
          state.hasCommittedState
            ? 'Graph refresh failed; showing the previous result'
            : 'Graph data cannot be rendered'
        }
        severity="error"
        editing={editing}
        hidden={hideDiagnostics}
        dashboardContent={<DiagnosticSummary diagnostics={state.diagnostics} />}
      />
    );
  }

  if (!state.diagnostics.length) {
    return null;
  }

  const hasWarning = state.diagnostics.some((diagnostic) => diagnostic.severity === 'warning');
  return (
    <PanelDiagnosticAlert
      diagnostics={diagnostics}
      testId="graph-frame-recoverable"
      title="Graph data contains issues"
      severity={hasWarning ? 'warning' : 'info'}
      editing={editing}
      hidden={hideDiagnostics}
      dashboardContent={<DiagnosticSummary diagnostics={state.diagnostics} />}
    />
  );
}
