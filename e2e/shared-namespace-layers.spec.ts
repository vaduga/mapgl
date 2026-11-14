import { test, expect } from '@grafana/plugin-e2e';
import { graphE2EQuery, graphRoot, waitForGraph, UNIFIED_GRAPH_DASHBOARD } from './helpers/graph';

test('shares pickable primitives across 300 namespaces and filters objects within batches', async ({ readProvisionedDashboard, request, gotoDashboardPage, page }) => {
  test.setTimeout(120000);
  const fixture: any = await readProvisionedDashboard({ fileName: UNIFIED_GRAPH_DASHBOARD });
  let smallCount = 0;
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && /shader|layer|texture|attribute/i.test(message.text())) errors.push(message.text()); });
  for (const count of [10, 300]) {
    const panel = structuredClone(fixture.panels[0]);
    panel.title = `Shared namespaces ${count}`;
    panel.options.basemap.config = { ...panel.options.basemap.config, nodeCards: true, edgeRouting: 'Splines' };
    panel.options.common = { ...panel.options.common, isShowLegend: false, isShowEdgeLegend: false, isShowEdgeLabels: true };
    panel.options.dataLayers[0].config.style.arcs = [];
    panel.targets[0].csvContent = 'source,targetPath,edgeId,sourceNs,targetNs,nodeMetric,edgeWidth,label\n' +
      Array.from({ length: count }, (_, i) => `node-${i},target-${i},edge-${i},ns-${i},ns-${i},10,10,node-${i}\ntarget-${i},,,ns-${i},ns-${i},10,10,target-${i}`).join('\n');
    const uid = `shared-namespaces-${count}-${Date.now()}`;
    expect((await request.post('/api/dashboards/db', { data: { dashboard: { ...fixture, id: null, uid, title: uid, panels: [panel] } } })).ok()).toBe(true);
    try {
      const dashboard = await gotoDashboardPage({ uid, queryParams: graphE2EQuery() });
      const rendered = dashboard.getPanelByTitle(panel.title);
      await rendered.scrollIntoView();
      await waitForGraph(rendered);
      const root = graphRoot(rendered);
      const leafCount = () => root.evaluate((element: any) => {
        const { deck } = element.__mapglE2E();
        return deck?.layerManager?.getLayers().filter((layer: any) => !layer.isComposite && layer.props.pickable).length ?? 0;
      });
      await expect.poll(leafCount).toBeGreaterThan(0);
      const leaves = await leafCount();
      await test.info().attach(`pickable-leaves-${count}`, { body: JSON.stringify({ namespaces: count, pickableLeaves: leaves }), contentType: 'application/json' });
      expect(leaves).toBeLessThan(254);
      if (count === 10) smallCount = leaves;
      else expect(leaves).toBe(smallCount);
      for (const index of [0, Math.floor(count / 2), count - 1]) {
        const picked = await root.evaluate((element: any, name) => {
          const { deck, session } = element.__mapglE2E();
          const frame = session.frame;
          const ref = frame.input.snapshot.nodes.findIndex((node: any) => node.id === name);
          const position = frame.input.render.positions.subarray(ref * 2, ref * 2 + 2);
          const [x, y] = deck.getViewports()[0].project([position[0], position[1], 0]);
          return session.resolvePick(deck.pickObject({ x, y, radius: 0 }));
        }, `node-${index}`);
        expect(picked).toMatchObject({ kind: 'node', id: `node-${index}`, namespaceId: `ns-${index}` });
      }
      await root.getByRole('button', { name: 'layers', exact: true }).click();
      const namespace = root.getByRole('checkbox', { name: `ns-${Math.floor(count / 2)}`, exact: true });
      await namespace.focus();
      await namespace.press('Space');
      await expect(namespace).not.toBeChecked();
      const hidden = await root.evaluate((element: any, name) => {
        const { deck, session } = element.__mapglE2E();
        const frame = session.frame;
        const ref = frame.input.snapshot.nodes.findIndex((node: any) => node.id === name);
        const position = frame.input.render.positions.subarray(ref * 2, ref * 2 + 2);
        const [x, y] = deck.getViewports()[0].project([position[0], position[1], 0]);
        return session.resolvePick(deck.pickObject({ x, y, radius: 0 }));
      }, `node-${Math.floor(count / 2)}`);
      expect(hidden?.id).not.toBe(`node-${Math.floor(count / 2)}`);
      expect(await leafCount()).toBe(smallCount);
      await rendered.locator.locator('canvas').first().screenshot({ path: test.info().outputPath(`namespaces-${count}.png`) });
    } finally { await request.delete(`/api/dashboards/uid/${uid}`); }
  }
  expect(errors).toEqual([]);
});


test('renders circles and donuts without cards covering the primitive', async ({ readProvisionedDashboard, request, gotoDashboardPage, page }) => {
  const fixture: any = await readProvisionedDashboard({ fileName: UNIFIED_GRAPH_DASHBOARD });
  const panel = structuredClone(fixture.panels[0]);
  panel.title = 'Shared donuts';
  panel.options.basemap.config = { nodeCards: false, layoutDirection: 'LR' };
  panel.options.common = { isShowSwitcher: true, isShowLegend: false, isShowEdgeLegend: false };
  delete panel.options.dataLayers[0].edgeIdField;
  panel.targets[0].csvContent = 'source,targetPath,load\nA,B,25\nB,,75';
  panel.options.dataLayers[0].config = { style: { color: { fixed: '#00ff00' }, opacity: 1, size: { fixed: 100 }, arcs: [{ field: 'load', fixed: '' }] }, edgeStyle: { color: { fixed: '#0000ff' }, size: { fixed: 2 } } };
  panel.fieldConfig = { defaults: { min: 0, max: 100, color: { mode: 'thresholds' }, thresholds: { mode: 'absolute', steps: [{ color: '#00ff00', value: null }, { color: '#ff0000', value: 50 }] } }, overrides: [] };
  const uid = `shared-donuts-${Date.now()}`;
  expect((await request.post('/api/dashboards/db', { data: { dashboard: { ...fixture, id: null, uid, title: uid, panels: [panel] } } })).ok()).toBe(true);
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error' && /luma.gl|deck:|shader|attribute|texture/i.test(message.text())) errors.push(message.text()); });
  try {
    const dashboard = await gotoDashboardPage({ uid, queryParams: graphE2EQuery() });
    const rendered = dashboard.getPanelByTitle(panel.title);
    await waitForGraph(rendered);
    await rendered.scrollIntoView();
    const root = graphRoot(rendered);
    await expect.poll(() => root.evaluate((element: any) => element.__mapglE2E()?.deck?.layerManager?.getLayers().some((layer: any) => layer.id.endsWith('points-circle')))).toBe(true);
    const canvas = rendered.locator.locator('canvas').first();
    const coloredPixels = async () => {
      const url = `data:image/png;base64,${(await canvas.screenshot()).toString('base64')}`;
      return page.evaluate(async (url) => {
        const image = await createImageBitmap(await (await fetch(url)).blob());
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0); image.close();
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let green = 0, red = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 1] > 150 && pixels[i] < 80 && pixels[i + 2] < 80) green++;
          if (pixels[i] > 150 && pixels[i + 1] < 80 && pixels[i + 2] < 80) red++;
        }
        return { green, red };
      }, url);
    };
    await expect.poll(async () => (await coloredPixels()).green).toBeGreaterThan(100);
    await expect.poll(async () => (await coloredPixels()).red).toBeGreaterThan(100);
    await canvas.screenshot({ path: '/tmp/shared-donuts.png' });
    expect(errors).toEqual([]);
  } finally { await request.delete(`/api/dashboards/uid/${uid}`); }
});
