import { test, expect } from '@grafana/plugin-e2e';
import { waitForGraph } from './helpers/graph';

for (const engine of ['MSAGL', 'ELK']) {
  for (const cards of [false, true]) {
    for (const { arrow, direction } of [
      { arrow: 0, direction: 'LR' },
      { arrow: 1, direction: 'RL' },
      { arrow: -1, direction: 'TB' },
      { arrow: 2, direction: 'BT' },
    ]) {
      test(`${engine} renders ${cards ? 'cards' : 'circles'} and reveals routed labels on focus (${direction}, arrow ${arrow})`, async ({
        readProvisionedDashboard,
        request,
        gotoDashboardPage,
        page,
      }) => {
        const fixture: any = await readProvisionedDashboard({ fileName: 'mapgl_unified_graph_e2e.json' });
        const panel = structuredClone(fixture.panels[0]);
        const uid = `nodecards-${engine.toLowerCase()}-${Number(cards)}-${Date.now()}`;
        panel.title = 'Node cards regression';
        panel.targets = [{ ...panel.targets[0], csvContent: 'source,targetPath,label\nAlpha,Beta,Alpha\nBeta,,Beta' }];
        panel.fieldConfig = { defaults: {}, overrides: [] };
        panel.options.basemap.config = {
          layoutEngine: engine,
          nodeCards: cards,
          edgeRouting: cards ? 'Rectilinear' : 'Splines',
          layoutDirection: direction,
          layerSeparation: Number(process.env.MAPGL_TEST_SEPARATION ?? 300),
        };
        panel.options.common = {
          isShowSwitcher: true,
          isShowLegend: false,
          isShowEdgeLegend: false,
          isShowEdgeLabels: false,
          jitterPoints: false,
        };
        const layer = panel.options.dataLayers[0];
        layer.optional = { searchProps: ['source'] };
        delete layer.edgeIdField;
        layer.config = {
          style: {
            size: { fixed: 24 },
            color: { fixed: '#808080' },
            text: { mode: 'field', field: 'source' },
            textConfig: { fontSize: 16 },
          },
          edgeStyle: {
            size: { fixed: 4 },
            color: { fixed: '#808080' },
            arrow,
            text: { mode: 'fixed', fixed: 'middle' },
            textConfig: { fontSize: 16 },
          },
          showStat2: true,
          arcStyle: {
            sideA: {
              color: { fixed: '#ff0000' },
              text: { mode: 'fixed', fixed: 'source' },
              textConfig: { fontSize: 16 },
            },
            sideB: {
              color: { fixed: '#0000ff' },
              text: { mode: 'fixed', fixed: 'target' },
              textConfig: { fontSize: 16 },
            },
          },
        };
        expect(
          (
            await request.post('/api/dashboards/db', {
              data: { dashboard: { ...fixture, id: null, uid, title: uid, panels: [panel] }, overwrite: false },
            })
          ).ok()
        ).toBe(true);
        try {
          const errors: string[] = [];
          page.on('pageerror', (error) => errors.push(error.message));
          const dashboard = await gotoDashboardPage({
            uid,
            queryParams: new URLSearchParams({ 'var-routed': '1', mapglE2E: '1' }),
          });
          const rendered = dashboard.getPanelByTitle(panel.title);
          await rendered.scrollIntoView();
          await waitForGraph(rendered);
          const canvas = rendered.locator.locator('canvas').first();
          await expect(canvas).toBeVisible();
          const colors = async () => {
            const url = `data:image/png;base64,${(await canvas.screenshot()).toString('base64')}`;
            return page.evaluate(async (url) => {
              const bitmap = await createImageBitmap(await (await fetch(url)).blob());
              const canvas = document.createElement('canvas');
              canvas.width = bitmap.width;
              canvas.height = bitmap.height;
              const ctx = canvas.getContext('2d')!;
              ctx.drawImage(bitmap, 0, 0);
              bitmap.close();
              const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
              let red = 0,
                blue = 0,
                gray = 0;
              for (let i = 0; i < pixels.length; i += 4) {
                if (pixels[i] > 150 && pixels[i + 1] < 60 && pixels[i + 2] < 60) red++;
                if (pixels[i + 2] > 150 && pixels[i] < 60 && pixels[i + 1] < 60) blue++;
                if (pixels[i] > 90 && pixels[i] < 170 && pixels[i + 1] === pixels[i] && pixels[i + 2] === pixels[i])
                  gray++;
              }
              return { red, blue, gray };
            }, url);
          };
          await expect.poll(async () => (await colors()).gray).toBeGreaterThan(10);
          expect((await colors()).red).toBeLessThan(5);
          expect((await colors()).blue).toBeLessThan(5);
          await rendered.locator.getByRole('button', { name: 'search nodes', exact: true }).click();
          const search = rendered.locator.getByRole('combobox');
          await search.fill('Alpha');
          await page.getByRole('listbox').getByRole('option').first().click();
          await canvas.hover();
          for (let zoom = 0; zoom < 4; zoom++) {
            await page.mouse.wheel(0, 600);
            await page.waitForTimeout(150);
          }
          await canvas.screenshot({ path: `/tmp/oss-${engine}-${cards}-focus.png` });
          await expect.poll(async () => (await colors()).red).toBeGreaterThan(10);
          await expect.poll(async () => (await colors()).blue).toBeGreaterThan(10);
          expect(errors).toEqual([]);
          await canvas.screenshot({
            path: test.info().outputPath(`${engine}-${cards ? 'cards' : 'circles'}-focused.png`),
          });
        } finally {
          await request.delete(`/api/dashboards/uid/${uid}`);
        }
      });
    }
  }
}

test('edge labels and animation always on setting survives dashboard save', async ({
  readProvisionedDashboard,
  request,
  gotoPanelEditPage,
  page,
}) => {
  test.setTimeout(90_000);
  const fixture: any = await readProvisionedDashboard({ fileName: 'mapgl_unified_graph_e2e.json' });
  const panel = structuredClone(fixture.panels[0]);
  const uid = `animate-save-${Date.now()}`;
  panel.options.common.isShowEdgeLabels = false;
  expect(
    (
      await request.post('/api/dashboards/db', {
        data: { dashboard: { ...fixture, id: null, uid, title: uid, panels: [panel] }, overwrite: false },
      })
    ).ok()
  ).toBe(true);
  try {
    const editor = await gotoPanelEditPage({ dashboard: { uid }, id: String(panel.id) });
    await editor.getCustomOptions('Other').expand();
    const setting = page.getByLabel('Edge labels and animation always on', { exact: true });
    await expect(setting).not.toBeChecked();
    await setting.check({ force: true });
    await expect(setting).toBeChecked();
    const dashboard = await editor.backToDashboard();
    await dashboard.ctx.page.getByRole('button', { name: 'Save dashboard', exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).last().click();
    await expect
      .poll(async () => {
        const saved = await request.get(`/api/dashboards/uid/${uid}`);
        return (await saved.json()).dashboard.panels[0].options.common.isShowEdgeLabels;
      })
      .toBe(true);
    await page.reload();
    const reopened = await gotoPanelEditPage({ dashboard: { uid }, id: String(panel.id) });
    await reopened.getCustomOptions('Other').expand();
    await expect(page.getByLabel('Edge labels and animation always on', { exact: true })).toBeChecked();
  } finally {
    await request.delete(`/api/dashboards/uid/${uid}`);
  }
});

test('side text editor switches Fixed, Field and Template controls', async ({
  readProvisionedDashboard,
  request,
  gotoPanelEditPage,
  page,
}) => {
  test.setTimeout(60_000);
  const fixture: any = await readProvisionedDashboard({ fileName: 'mapgl_unified_graph_e2e.json' });
  const panel = structuredClone(fixture.panels[0]);
  const uid = `side-editor-${Date.now()}`;
  panel.options.dataLayers[0].config.showStat2 = true;
  expect(
    (
      await request.post('/api/dashboards/db', {
        data: { dashboard: { ...fixture, id: null, uid, title: uid, panels: [panel] }, overwrite: false },
      })
    ).ok()
  ).toBe(true);
  try {
    const editor = await gotoPanelEditPage({ dashboard: { uid }, id: String(panel.id) });
    await editor.getCustomOptions('Data layers').expand();
    const side = page.getByText('Routed edge end', { exact: true }).first().locator('xpath=../../..');
    await expect(side.getByRole('combobox')).toHaveCount(1);
    await side.getByRole('radio', { name: 'Template' }).check({ force: true });
    await expect(side.getByRole('combobox')).toHaveCount(0);
    await side.getByRole('textbox').fill('sent ${label}');
    await expect(side.getByRole('textbox')).toHaveValue('sent ${label}');
    await side.getByRole('radio', { name: 'Fixed' }).check({ force: true });
    await expect(side.getByRole('combobox')).toHaveCount(0);
    await side.getByRole('textbox').fill('fixed text');
    await expect(side.getByRole('textbox')).toHaveValue('fixed text');
    await side.getByRole('radio', { name: 'Field' }).check({ force: true });
    await expect(side.getByRole('combobox')).toHaveCount(1);
  } finally {
    await request.delete(`/api/dashboards/uid/${uid}`);
  }
});
