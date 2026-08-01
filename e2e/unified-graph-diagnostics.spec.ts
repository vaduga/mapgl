import { expect, test } from '@grafana/plugin-e2e';

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
