import { expect, test } from '@grafana/plugin-e2e';
import type { PanelModel } from '@grafana/data';
import { enableGraphE2E, graphE2EQuery, graphRoot, waitForGraph, UNIFIED_GRAPH_DASHBOARD } from './helpers/graph';

test('renders gauge bars, range rings, center values and opacity in graph and Geo modes', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
  request,
  page,
  grafanaVersion,
  gotoPanelEditPage,
}) => {
  test.setTimeout(60_000);
  const fixture = (await readProvisionedDashboard({ fileName: UNIFIED_GRAPH_DASHBOARD })) as unknown as {
    panels: Array<PanelModel & { targets: any[] }>;
  };
  const base = fixture.panels[0];
  const uid = `mapgl-gauges-${Date.now()}`;
  const panels = ['Graph', 'Geo'].map((mode, index) => ({
    ...base,
    id: index + 1,
    title: `${mode} gauges`,
    gridPos: { x: index * 12, y: 0, w: 12, h: 14 },
    fieldConfig: {
      defaults: { ...base.fieldConfig.defaults, min: 0, max: 100, unit: 'percent', decimals: 0 },
      overrides: [],
    },
    targets: [
      { ...base.targets[0], csvContent: 'source,targetPath,load,longitude,latitude\nA,B,25,10,50\nB,,75,20,50' },
    ],
    options: {
      ...base.options,
      view: mode === 'Geo' ? { id: 'coords', lat: 50, lon: 15, zoom: 4 } : base.options.view,
      basemap:
        mode === 'Graph'
          ? { type: 'blank', config: { layoutDirection: 'LR' } }
          : {
              type: 'fromjson',
              config: {
                url:
                  'data:application/json,' +
                  encodeURIComponent(JSON.stringify({ version: 8, sources: {}, layers: [] })),
              },
            },
      common: { isShowSwitcher: true, isShowLegend: false, isShowEdgeLegend: false, isMeters: false },
      dataLayers: [
        {
          ...base.options.dataLayers[0],
          edgeIdField: undefined,
          optional: {},
          config: {
            style: {
              color: { fixed: 'green' },
              opacity: 0.6,
              size: { fixed: 100 },
              arcs: [{ field: 'load', fixed: '' }],
              arcOptions: { segments: 24, segmentSpacing: 0.2, barWidthFactor: 0.7, showThresholds: true },
              useGroups: false,
            },
            edgeStyle: { color: { fixed: 'blue' }, size: { fixed: 2 }, opacity: 0.6 },
          },
        },
      ],
    },
  }));
  expect(
    (
      await request.post('/api/dashboards/db', {
        data: { dashboard: { title: uid, uid, schemaVersion: 42, panels }, overwrite: false },
      })
    ).ok()
  ).toBe(true);
  try {
    const dashboard = await gotoDashboardPage({ uid, queryParams: graphE2EQuery() });
    for (const mode of ['Graph', 'Geo']) {
      const panel = dashboard.getPanelByTitle(`${mode} gauges`);
      await panel.scrollIntoView();
      await waitForGraph(panel);
      await page.mouse.move(0, 0);
      await expect(panel.locator.locator('canvas').last()).toHaveScreenshot(
        `gauges-${mode.toLowerCase()}-${grafanaVersion}.png`,
        {
          animations: 'disabled',
          maxDiffPixelRatio: 0.005,
        }
      );
    }
    for (const panel of panels) {
      panel.options.dataLayers[0].config.style.useGroups = true;
      Object.assign(panel.options.dataLayers[0].config, {
        groups: [
          {
            label: 'A icon',
            iconName: 'networking/server',
            overrides: [{ name: 'source', type: 'string', value: 'A' }],
          },
        ],
      });
    }
    expect(
      (
        await request.post('/api/dashboards/db', {
          data: { dashboard: { title: uid, uid, schemaVersion: 42, panels }, overwrite: true },
        })
      ).ok()
    ).toBe(true);
    const loadedIcon = page.waitForResponse(
      (response) => response.url().endsWith('/networking/server.svg') && response.ok()
    );
    await dashboard.goto({ queryParams: graphE2EQuery() });
    await loadedIcon;
    for (const mode of ['Graph', 'Geo']) {
      const panel = dashboard.getPanelByTitle(`${mode} gauges`);
      await panel.scrollIntoView();
      await waitForGraph(panel);
      const canvas = panel.locator.locator('canvas').last();
      await expect(canvas).toHaveScreenshot(`mixed-${mode.toLowerCase()}-${grafanaVersion}.png`);
      const root = graphRoot(panel);
      await root.getByRole('button', { name: 'layers' }).click();
      for (const name of ['icon', 'label']) {
        await root.getByRole('checkbox', { name, exact: true }).uncheck();
        await root.getByRole('button', { name: 'layers' }).click();
        await page.mouse.move(0, 0);
        await expect(canvas).toHaveScreenshot(`without-${name}-${mode.toLowerCase()}-${grafanaVersion}.png`);
        await root.getByRole('button', { name: 'layers' }).click();
      }
    }
    const editor = await gotoPanelEditPage({ dashboard: { uid }, id: '1' });
    await enableGraphE2E(page);
    await waitForGraph(editor.panel);
    await editor.getCustomOptions('Data layers').expand();
    const sizeField = page
      .getByText('Size', { exact: true })
      .locator('xpath=ancestor::div[descendant::*[@role="combobox"]][1]');
    await sizeField.getByRole('combobox').click();
    await page.keyboard.type('load');
    await page.getByRole('listbox').getByRole('option', { name: 'load', exact: true }).click();
    const minimum = page.getByLabel('Min', { exact: true }).first();
    const maximum = page.getByLabel('Max', { exact: true }).first();
    await minimum.fill('120');
    await minimum.blur();
    await maximum.fill('40');
    await maximum.blur();
    await expect(minimum).toHaveValue('120');
    await expect(maximum).toHaveValue('40');
    await page
      .getByText('Min', { exact: true })
      .first()
      .locator('xpath=ancestor-or-self::label[1]')
      .locator('svg')
      .hover();
    await expect(page.getByText('Set Min greater than Max to make lower metric values appear larger.')).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(editor.panel.locator.locator('canvas').last()).toHaveScreenshot(
      `descending-size-${grafanaVersion}.png`
    );
  } finally {
    expect((await request.delete(`/api/dashboards/uid/${uid}`)).ok()).toBe(true);
  }
});
