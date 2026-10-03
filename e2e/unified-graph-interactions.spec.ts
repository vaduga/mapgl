import { expect, test } from '@grafana/plugin-e2e';

import { graphE2EQuery, graphRoot, readGraphSummary, UNIFIED_GRAPH_DASHBOARD, waitForGraph } from './helpers/graph';

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
  await dashboardPage.refreshDashboard();
  await waitForGraph(panel);
  await expect(siteOne).not.toBeChecked();
  expect((await readGraphSummary(panel)).visibleNamespaces).not.toContain('site.one');
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

  const canvas = panel.locator.locator('canvas').last();
  const size = await canvas.boundingBox();
  expect(size).not.toBeNull();
  const tooltip = dashboardPage.ctx.page.getByTestId('graph-tooltip');
  const close = tooltip.getByRole('button', { name: 'close' });
  let pickedX = 16;
  for (; pickedX < size!.width && !(await close.isVisible()); pickedX += 16) {
    await canvas.click({ position: { x: pickedX, y: size!.height / 2 } });
    await canvas.hover({ position: { x: size!.width - 12, y: size!.height - 12 } });
    await expect(close)
      .toBeVisible({ timeout: 300 })
      .catch(() => {});
  }
  await expect(tooltip.getByRole('button', { name: 'close' })).toBeVisible();
  await expect(tooltip).toContainText('A');
  await expect(tooltip.getByRole('link', { name: 'Open node details' })).toHaveAttribute(
    'href',
    'https://example.com/nodes/A'
  );
  await tooltip.getByRole('button', { name: 'close' }).click();
  await expect(tooltip).toBeHidden();
  await canvas.click({ position: { x: pickedX - 16, y: size!.height / 2 } });
  await canvas.hover({ position: { x: size!.width - 12, y: size!.height - 12 } });
  await expect(tooltip).toBeVisible();
  await canvas.click({ position: { x: size!.width - 12, y: size!.height - 12 } });
  await expect(tooltip).toBeHidden();
});
