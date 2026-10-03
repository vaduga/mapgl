import { expect, test } from '@grafana/plugin-e2e';
import type { PanelModel } from '@grafana/data';

import {
  enableGraphE2E,
  graphE2EQuery,
  graphRoot,
  readGraphSummary,
  UNIFIED_GRAPH_DASHBOARD,
  waitForGraph,
} from './helpers/graph';

test('shows the empty graph state for a frame with no rows', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: UNIFIED_GRAPH_DASHBOARD });
  const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid, queryParams: graphE2EQuery() });
  const panel = dashboardPage.getPanelByTitle('Empty graph');
  await panel.scrollIntoView();
  await waitForGraph(panel, 'empty');
  await expect(panel.locator.getByTestId('graph-frame-empty')).toContainText('No graph data');
});

test('reports a fatal diagnostic when a configured node field is missing', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: UNIFIED_GRAPH_DASHBOARD });
  const panelEditPage = await gotoPanelEditPage({
    dashboard: { uid: dashboard.uid },
    id: '3',
  });
  await enableGraphE2E(panelEditPage.ctx.page);
  await waitForGraph(panelEditPage.panel, 'fatal');
  const diagnostic = panelEditPage.panel.locator.getByTestId('graph-frame-fatal');
  await expect(diagnostic).toContainText('Graph data cannot be rendered');
  await expect(diagnostic).toContainText('missingNode');
  await expect(diagnostic.getByRole('list', { name: 'Diagnostic details' })).toBeVisible();
});

test('keeps valid nodes and edges while reporting invalid paths and dangling targets', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: UNIFIED_GRAPH_DASHBOARD });
  const panelEditPage = await gotoPanelEditPage({
    dashboard: { uid: dashboard.uid },
    id: '4',
  });
  await enableGraphE2E(panelEditPage.ctx.page);
  await waitForGraph(panelEditPage.panel);

  const summary = await readGraphSummary(panelEditPage.panel);
  expect(summary.nodeCount).toBe(2);
  expect(summary.edgeCount).toBe(2);

  const diagnostic = graphRoot(panelEditPage.panel).getByTestId('graph-frame-recoverable');
  await expect(diagnostic).toContainText('invalid target or routed path');
  await expect(diagnostic).toContainText('does not resolve to a normalized node');
  await expect(diagnostic).toContainText('unresolved intermediate node');
});

test('shows concise dashboard diagnostics and preserves the empty state when alerts are hidden', async ({
  readProvisionedDashboard,
  gotoDashboardPage,
  request,
}) => {
  const fixture = await readProvisionedDashboard({ fileName: UNIFIED_GRAPH_DASHBOARD });
  const uid = `mapgl-diagnostics-${Date.now()}`;
  const panels = (fixture as unknown as { panels: PanelModel[] }).panels.slice(1).map((panel, index) => ({
    ...panel,
    gridPos: { x: index * 8, y: 0, w: 8, h: 10 },
  }));
  const save = () =>
    request.post('/api/dashboards/db', {
      data: { dashboard: { title: uid, uid, panels, schemaVersion: 42 }, overwrite: true },
    });
  expect((await save()).ok()).toBe(true);
  try {
    const dashboard = await gotoDashboardPage({ uid, queryParams: graphE2EQuery() });
    for (const [title, kind] of [
      ['Missing configured field', 'fatal'],
      ['Partially valid graph', 'recoverable'],
    ]) {
      const diagnostic = dashboard.getPanelByTitle(title).locator.getByTestId(`graph-frame-${kind}`);
      await expect(diagnostic).toContainText('data issue');
      await expect(diagnostic).toContainText('Open the panel editor for details.');
      await expect(diagnostic.getByRole('list', { name: 'Diagnostic details' })).toBeHidden();
    }
    panels.forEach((panel) => {
      panel.options.common.hideDiagnostics = true;
    });
    expect((await save()).ok()).toBe(true);
    await dashboard.goto({ queryParams: graphE2EQuery() });
    await expect(dashboard.getPanelByTitle('Empty graph').locator.getByTestId('graph-frame-empty')).toContainText(
      'No graph data'
    );
    await expect(dashboard.ctx.page.getByTestId('graph-frame-fatal')).toBeHidden();
    await expect(dashboard.ctx.page.getByTestId('graph-frame-recoverable')).toBeHidden();
  } finally {
    expect((await request.delete(`/api/dashboards/uid/${uid}`)).ok()).toBe(true);
  }
});
