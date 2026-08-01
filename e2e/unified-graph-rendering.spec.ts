import { expect, test } from '@grafana/plugin-e2e';

import { graphE2EQuery, readGraphSummary, UNIFIED_GRAPH_DASHBOARD, waitForGraph } from './helpers/graph';

test('renders normalized nodes, edges, threshold colors, edge widths, and layout direction', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: UNIFIED_GRAPH_DASHBOARD });
  const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid, queryParams: graphE2EQuery() });
  const panel = dashboardPage.getPanelByTitle('Unified graph');
  await panel.scrollIntoView();
  await waitForGraph(panel);

  const summary = await readGraphSummary(panel);
  expect(summary.nodeCount).toBe(4);
  expect(summary.edgeCount).toBe(3);
  expect(summary.namespaceCount).toBe(2);
  expect(summary.layoutDirection).toBe('LR');
  expect(new Set(summary.nodeColors).size).toBeGreaterThan(1);
  expect(Math.min(...summary.edgeWidths)).toBe(2);
  expect(Math.max(...summary.edgeWidths)).toBe(10);
});

test('keeps the committed topology when an unrelated dashboard variable refreshes', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: UNIFIED_GRAPH_DASHBOARD });
  const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid, queryParams: graphE2EQuery() });
  const panel = dashboardPage.getPanelByTitle('Unified graph');
  await panel.scrollIntoView();
  await waitForGraph(panel);
  const before = await readGraphSummary(panel);

  const variable = dashboardPage.ctx.page.getByRole('combobox').first();
  await variable.click();
  await dashboardPage.ctx.page.getByRole('option', { name: 'two', exact: true }).click();

  await waitForGraph(panel);
  const after = await readGraphSummary(panel);
  expect(after.topologySignature).toBe(before.topologySignature);
  expect(after.nodeCount).toBe(before.nodeCount);
  expect(after.edgeCount).toBe(before.edgeCount);
});
