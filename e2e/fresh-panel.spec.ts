import { expect, test } from '@grafana/plugin-e2e';
import { graphE2EQuery, readGraphSummary, waitForGraph } from './helpers/graph';

test('starts a fresh panel and retains its view through an unrelated edit and save/reload', async ({
  dashboardPage,
  page,
  selectors,
  request,
  grafanaVersion,
}) => {
  test.setTimeout(60_000);
  await dashboardPage.goto({ queryParams: graphE2EQuery() });
  const panelEditPage = await dashboardPage.addPanel();
  const [grafanaMajor, grafanaMinor] = grafanaVersion.split('.').map(Number);
  if (grafanaMajor > 12 || (grafanaMajor === 12 && grafanaMinor >= 4)) {
    // plugin-e2e 3.14.0 toggles this picker even when Grafana 12.4+ opens it already.
    const allVisualizationsTab = panelEditPage.getByGrafanaSelector(
      selectors.components.Tab.title(selectors.constants.Tab.title)
    );
    if (!(await allVisualizationsTab.isVisible())) {
      await panelEditPage.getByGrafanaSelector(selectors.components.PanelEditor.toggleVizPicker).click();
    }
    await allVisualizationsTab.click();
    await panelEditPage.getByGrafanaSelector(selectors.components.PluginVisualization.item('Mapgl')).click();
    await expect(panelEditPage.getVisualizationName()).toHaveText('Mapgl');
  } else {
    await panelEditPage.setVisualization('Mapgl');
  }
  await waitForGraph(panelEditPage.panel);
  const before = await readGraphSummary(panelEditPage.panel);
  expect(before.nodeCount).toBeGreaterThan(0);
  const canvas = panelEditPage.panel.locator.locator('canvas').last();
  await expect(canvas).toHaveScreenshot(`fresh-${grafanaVersion}.png`);
  await panelEditPage.getCustomOptions('Other').getSwitch('Hide diagnostic messages').check();
  expect((await readGraphSummary(panelEditPage.panel)).topologySignature).toBe(before.topologySignature);
  await expect(canvas).toHaveScreenshot(`fresh-${grafanaVersion}.png`);
  await panelEditPage.setPanelTitle('Fresh Mapgl');
  const dashboard = await panelEditPage.backToDashboard();
  await dashboard.getByGrafanaSelector(selectors.components.NavToolbar.editDashboard.saveButton).click();
  const title = `mapgl-fresh-${Date.now()}`;
  await page.getByRole('textbox', { name: /title/i }).fill(title);
  const saved = page.waitForResponse((response) => {
    if (response.request().method() !== 'POST') {
      return false;
    }
    const path = new URL(response.url()).pathname;
    return (
      /^\/api\/dashboards\/db\/?$/.test(path) ||
      /^\/apis\/dashboard\.grafana\.app\/v[^/]+\/namespaces\/[^/]+\/dashboards\/?$/.test(path)
    );
  });
  await dashboard.getByGrafanaSelector(selectors.components.Drawer.DashboardSaveDrawer.saveButton).click();
  const response = await saved;
  expect(response.ok()).toBe(true);
  const savedDashboard = await response.json();
  const uid = savedDashboard.metadata?.name ?? savedDashboard.uid;
  expect(uid).toBeTruthy();
  const responseUrl = new URL(response.url());
  const deleteUrl = responseUrl.pathname.includes('/apis/dashboard.grafana.app/')
    ? `${responseUrl.pathname}/${uid}`
    : `/api/dashboards/uid/${uid}`;
  try {
    if (savedDashboard.spec?.panels) {
      expect(savedDashboard.spec.panels[0].options.common.hideDiagnostics).toBe(true);
    } else {
      const persisted = await request.get(`/api/dashboards/uid/${uid}`);
      expect((await persisted.json()).dashboard.panels[0].options.common.hideDiagnostics).toBe(true);
    }
    await page.reload();
    const panel = dashboard.getPanelByTitle('Fresh Mapgl');
    await waitForGraph(panel);
    expect((await readGraphSummary(panel)).topologySignature).toBe(before.topologySignature);
  } finally {
    expect((await request.delete(deleteUrl)).ok()).toBe(true);
  }
});
