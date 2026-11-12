import { test, expect } from '@grafana/plugin-e2e';

for (const engine of ['MSAGL', 'ELK']) {
  for (const cards of [false, true]) {
    test(`${engine} renders ${cards ? 'cards' : 'circles'} and reveals routed labels on focus`, async ({
      readProvisionedDashboard, request, gotoDashboardPage, page,
    }) => {
      const fixture: any = await readProvisionedDashboard({ fileName: 'mapgl_unified_graph_e2e.json' });
      const panel = structuredClone(fixture.panels[0]);
      const uid = `nodecards-${engine.toLowerCase()}-${Number(cards)}-${Date.now()}`;
      panel.title = 'Node cards regression';
      panel.targets = [{ ...panel.targets[0], csvContent: 'source,targetPath,label\nAlpha,Beta,Alpha\nBeta,,Beta' }];
      panel.fieldConfig = { defaults: {}, overrides: [] };
      panel.options.basemap.config = { layoutEngine: engine, nodeCards: cards, edgeRouting: cards ? 'Rectilinear' : 'Splines', layoutDirection: 'LR', layerSeparation: 300 };
      panel.options.common = { isShowSwitcher: true, isShowLegend: false, isShowEdgeLegend: false, isShowEdgeLabels: false, jitterPoints: false };
      const layer = panel.options.dataLayers[0];
      layer.optional = { searchProps: ['source'] };
      delete layer.edgeIdField;
      layer.config = {
        style: { size: { fixed: 24 }, color: { fixed: '#808080' }, text: { mode: 'field', field: 'source' }, textConfig: { fontSize: 16 } },
        edgeStyle: { size: { fixed: 4 }, color: { fixed: '#808080' }, arrow: 2, animate: false, text: { mode: 'fixed', fixed: 'middle' }, textConfig: { fontSize: 16 } },
        showStat2: true,
        arcStyle: {
          sideA: { color: { fixed: '#ff0000' }, text: { mode: 'fixed', fixed: 'source' }, textConfig: { fontSize: 16 } },
          sideB: { color: { fixed: '#0000ff' }, text: { mode: 'fixed', fixed: 'target' }, textConfig: { fontSize: 16 } },
        },
      };
      expect((await request.post('/api/dashboards/db', { data: { dashboard: { ...fixture, id: null, uid, title: uid, panels: [panel] }, overwrite: false } })).ok()).toBe(true);
      try {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const dashboard = await gotoDashboardPage({ uid, queryParams: new URLSearchParams({ 'var-routed': '1' }) });
        const rendered = dashboard.getPanelByTitle(panel.title);
        await rendered.scrollIntoView();
        const canvas = rendered.locator.locator('canvas').first();
        await expect(canvas).toBeVisible();
        const colors = async () => {
          const url = `data:image/png;base64,${(await canvas.screenshot()).toString('base64')}`;
          return page.evaluate(async (url) => {
            const bitmap = await createImageBitmap(await (await fetch(url)).blob());
            const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d')!; ctx.drawImage(bitmap, 0, 0); bitmap.close();
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let red = 0, blue = 0, gray = 0;
            for (let i = 0; i < pixels.length; i += 4) {
              if (pixels[i] > 150 && pixels[i + 1] < 60 && pixels[i + 2] < 60) red++;
              if (pixels[i + 2] > 150 && pixels[i] < 60 && pixels[i + 1] < 60) blue++;
              if (pixels[i] > 90 && pixels[i] < 170 && pixels[i + 1] === pixels[i] && pixels[i + 2] === pixels[i]) gray++;
            }
            return { red, blue, gray };
          }, url);
        };
        await expect.poll(async () => (await colors()).gray).toBeGreaterThan(100);
        expect((await colors()).red).toBeLessThan(5);
        expect((await colors()).blue).toBeLessThan(5);
        await rendered.locator.getByRole('button', { name: 'search nodes', exact: true }).click();
        const search = rendered.locator.getByRole('combobox'); await search.fill('Alpha');
        await page.getByRole('listbox').getByRole('option').first().click();
        await canvas.screenshot({ path: `/tmp/oss-${engine}-${cards}-focus.png` });
        await expect.poll(async () => (await colors()).red).toBeGreaterThan(10);
        await expect.poll(async () => (await colors()).blue).toBeGreaterThan(10);
        expect(errors).toEqual([]);
        await canvas.screenshot({ path: test.info().outputPath(`${engine}-${cards ? 'cards' : 'circles'}-focused.png`) });
      } finally { await request.delete(`/api/dashboards/uid/${uid}`); }
    });
  }
}
