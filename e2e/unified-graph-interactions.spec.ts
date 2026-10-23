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
  const tooltip = await inspectGraphNode(panel, 'site.one', 'A');
  await canvas.hover({ position: { x: size!.width - 12, y: size!.height - 12 } });
  await expect(tooltip.getByRole('button', { name: 'close' })).toBeVisible();
  await expect(tooltip).toContainText('A');
  await expect(tooltip.getByRole('link', { name: 'Open node details' })).toHaveAttribute(
    'href',
    'https://example.com/nodes/A'
  );
  // Scan the fixture's vertical node column using real WebGL hover picking.
  for (let y = 16; y < size!.height - 16; y += 16) {
    await canvas.hover({ position: { x: size!.width / 2, y } });
    if ((await tooltip.getAttribute('aria-label')) === 'D') {
      break;
    }
  }
  await expect(tooltip).toHaveAttribute('aria-label', 'D');
  await expect(tooltip).toHaveAttribute('role', 'tooltip');
  await expect(tooltip.getByRole('button', { name: 'close' })).toHaveCount(0);
  await canvas.hover({ position: { x: size!.width - 12, y: size!.height - 12 } });
  await expect(tooltip).toHaveAttribute('aria-label', 'A');
  await expect(tooltip).toHaveAttribute('role', 'dialog');
  const arrow = tooltip.getByRole('button', { name: 'outgoing', exact: true });
  await arrow.press('Enter');
  await expect(arrow).toHaveAttribute('aria-pressed', 'true');
  const connection = tooltip.locator('[data-tooltip-connection="edge-low"]');
  await expect(connection).toHaveCount(1);
  await expect(connection).toHaveText('edge-low');
  await connection.click();
  await expect(connection).toHaveCount(1);
  await expect(tooltip).toHaveAttribute('aria-label', 'A');
  await expect(tooltip.locator('[data-selected="true"] [data-tooltip-connection="edge-low"]')).toBeVisible();
  await expect(tooltip.getByRole('link', { name: 'Open node details' })).toHaveAttribute(
    'href',
    'https://example.com/nodes/edge-low'
  );
  await dashboardPage.ctx.page.screenshot({ path: '/tmp/mapgl-native-tooltip.png' });
  await tooltip.getByRole('button', { name: 'close' }).click();
  await expect(tooltip).toBeHidden();
  await inspectGraphNode(panel, 'site.one', 'A');
  await canvas.hover({ position: { x: size!.width - 12, y: size!.height - 12 } });
  await expect(tooltip).toBeVisible();
  await canvas.click({ position: { x: size!.width - 12, y: size!.height - 12 } });
  await expect(tooltip).toBeHidden();
});
