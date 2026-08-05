import { expect, test } from '@grafana/plugin-e2e';

import { installWebglTextureDiagnostics, readWebglTextureSnapshot } from './helpers/webgl-textures';

const NODE_GRAPH_DASHBOARD = 'mapgl_node_graph_with_subgraphs.json';

test('captures live WebGL texture memory after node graph rendering', async ({
  gotoDashboardPage,
  readProvisionedDashboard,
}, testInfo) => {
  const dashboard = await readProvisionedDashboard({ fileName: NODE_GRAPH_DASHBOARD });
  const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid });
  await installWebglTextureDiagnostics(dashboardPage.ctx.page);

  // Reload so the init script runs before deck.gl and the panel create their contexts.
  await dashboardPage.ctx.page.reload();
  const panel = dashboardPage.getPanelByTitle('Multi-hop routing');
  await panel.scrollIntoView();
  await panel.locator.locator('canvas').first().waitFor({ state: 'visible' });
  await dashboardPage.ctx.page.waitForFunction(
    () => (window.__mapglTextureDiagnostics?.snapshot().textureCount ?? 0) > 0,
    undefined,
    { timeout: 10_000 }
  );

  const snapshot = await readWebglTextureSnapshot(dashboardPage.ctx.page);
  expect(snapshot.textureCount).toBeGreaterThan(0);
  expect(snapshot.totalBytes).toBeGreaterThan(0);
  const rgba32FloatTextureBytes = snapshot.textures
    .filter(({ internalFormat }) => internalFormat === 34836)
    .reduce((sum, texture) => sum + texture.bytes, 0);
  await testInfo.attach('nodegraph-after.png', {
    body: await panel.locator.screenshot({ animations: 'disabled' }),
    contentType: 'image/png',
  });
  await expect(panel.locator).toHaveScreenshot('nodegraph-shader.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixels: 3000,
  });
  await testInfo.attach('webgl-texture-after.json', {
    body: JSON.stringify(
      {
        after: snapshot,
        rgba32FloatTextureBytes,
        before: {
          observedTextureBytes: 134 * 1024 * 1024,
          svgAtlasBytes: 8 * 1024 * 4096 * 4,
          svgAtlasCount: 8,
        },
      },
      null,
      2
    ),
    contentType: 'application/json',
  });
  console.log(
    `Mapgl WebGL texture memory after render: ${snapshot.totalBytes} bytes across ${snapshot.textureCount} textures; ` +
      `${rgba32FloatTextureBytes} bytes in RGBA32F textures; ` +
      `${snapshot.contextLosses} context losses / ${snapshot.contextRestores} restores`
  );
});
