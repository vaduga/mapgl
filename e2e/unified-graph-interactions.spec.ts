import { expect, test } from '@grafana/plugin-e2e';

import {
  graphE2EQuery,
  graphRoot,
  inspectGraphNode,
  readGraphSummary,
  UNIFIED_GRAPH_DASHBOARD,
  waitForGraph,
} from './helpers/graph';

test('toggles namespace and routed-edge visibility in the layer switcher', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: UNIFIED_GRAPH_DASHBOARD });
  const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid, queryParams: graphE2EQuery() });
  const panel = dashboardPage.getPanelByTitle('Unified graph');
  await panel.scrollIntoView();
  await waitForGraph(panel);

  const root = graphRoot(panel);
  await root.getByRole('button', { name: 'layers' }).click();
  const siteOne = root.getByRole('checkbox', { name: 'one', exact: true });
  await expect(siteOne).toBeChecked();
  await siteOne.uncheck();
  await expect.poll(async () => (await readGraphSummary(panel)).visibleNamespaces).not.toContain('site.one');

  const routed = root.getByRole('checkbox', { name: /routed/i });
  await routed.uncheck();
  await expect.poll(async () => (await readGraphSummary(panel)).routedVisible).toBe(false);
});

test('pins a node tooltip, exposes its data link, and closes it', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: UNIFIED_GRAPH_DASHBOARD });
  const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid, queryParams: graphE2EQuery() });
  const panel = dashboardPage.getPanelByTitle('Unified graph');
  await panel.scrollIntoView();
  await waitForGraph(panel);

  const tooltip = await inspectGraphNode(panel, 'site.one', 'A');
  await expect(tooltip).toContainText('A');
  await expect(tooltip.getByRole('link', { name: 'Open node details' })).toHaveAttribute(
    'href',
    'https://example.com/nodes/A'
  );
  await tooltip.getByRole('button', { name: 'close' }).click();
  await expect(tooltip).toBeHidden();
});
