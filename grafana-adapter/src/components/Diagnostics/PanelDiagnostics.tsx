import { css } from '@emotion/css';
import type { GrafanaTheme2 } from '@grafana/data';
import React from 'react';
import { Alert, useStyles2 } from '@grafana/ui';

export interface PanelDiagnosticExample {
  readonly label: string;
}

export interface PanelDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly count: number;
  readonly examples: readonly PanelDiagnosticExample[];
}

export interface TransientPanelDiagnosticsProps {
  readonly identity: unknown;
  readonly active?: boolean;
  readonly editing?: boolean;
  readonly hidden?: boolean;
  readonly children: React.ReactNode;
}

export interface PanelDiagnosticAlertProps {
  readonly diagnostics: readonly PanelDiagnostic[];
  readonly title: string;
  readonly severity: React.ComponentProps<typeof Alert>['severity'];
  readonly editing?: boolean;
  readonly hidden?: boolean;
  readonly dashboardContent: React.ReactNode;
  readonly testId?: string;
}

const DASHBOARD_DIAGNOSTIC_TIMEOUT_MS = 2000;
const EDIT_DIAGNOSTIC_TIMEOUT_MS = 10000;

export function TransientPanelDiagnostics({
  identity,
  active = true,
  editing = false,
  hidden = false,
  children,
}: TransientPanelDiagnosticsProps) {
  const enabled = active && !hidden;
  const [dismissedIdentity, setDismissedIdentity] = React.useState<unknown>();

  React.useEffect(() => {
    if (!enabled) {
      setDismissedIdentity(undefined);
      return;
    }

    setDismissedIdentity(undefined);
    const timeout = window.setTimeout(
      () => setDismissedIdentity(identity),
      editing ? EDIT_DIAGNOSTIC_TIMEOUT_MS : DASHBOARD_DIAGNOSTIC_TIMEOUT_MS
    );

    return () => window.clearTimeout(timeout);
  }, [editing, enabled, identity]);

  if (!enabled || dismissedIdentity === identity) {
    return null;
  }

  return <>{children}</>;
}

export function PanelDiagnosticDetails({ diagnostics }: { diagnostics: readonly PanelDiagnostic[] }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.details}>
      <strong>Diagnostic details:</strong>
      <ul className={styles.list} aria-label="Diagnostic details">
        {diagnostics.map((diagnostic) => {
          const omittedCount = Math.max(0, diagnostic.count - diagnostic.examples.length);
          return (
            <li key={`${diagnostic.code}:${diagnostic.message}`}>
              {diagnostic.message}
              {diagnostic.count > 1 && ` (${diagnostic.count} occurrences)`}
              {diagnostic.examples.length > 0 && (
                <ul className={styles.examples}>
                  {diagnostic.examples.map((example, index) => (
                    <li key={`${diagnostic.code}-${index}`}>{example.label}</li>
                  ))}
                  {omittedCount > 0 && (
                    <li>
                      {omittedCount} more {omittedCount === 1 ? 'occurrence' : 'occurrences'}
                    </li>
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PanelDiagnosticAlert({
  diagnostics,
  title,
  severity,
  editing = false,
  hidden = false,
  dashboardContent,
  testId,
}: PanelDiagnosticAlertProps) {
  return (
    <TransientPanelDiagnostics identity={diagnostics} active={diagnostics.length > 0} editing={editing} hidden={hidden}>
      <Alert data-testid={testId} title={title} severity={severity}>
        {editing ? <PanelDiagnosticDetails diagnostics={diagnostics} /> : dashboardContent}
      </Alert>
    </TransientPanelDiagnostics>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  details: css({
    marginTop: theme.spacing(1),
  }),
  list: css({
    listStyleType: 'disc',
    listStylePosition: 'outside',
    margin: theme.spacing(0.5, 0, 0),
    paddingLeft: theme.spacing(3),

    '& > li + li': {
      marginTop: theme.spacing(0.5),
    },
  }),
  examples: css({
    listStyleType: 'circle',
    listStylePosition: 'outside',
    margin: theme.spacing(0.5, 0, 0),
    paddingLeft: theme.spacing(3),

    '& > li + li': {
      marginTop: theme.spacing(0.25),
    },
  }),
});
