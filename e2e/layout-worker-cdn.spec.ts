import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { expect, test } from '@grafana/plugin-e2e';
import { graphE2EQuery, readGraphSummary, UNIFIED_GRAPH_DASHBOARD, waitForGraph } from './helpers/graph';

test('lays out a graph when the layout worker is served from a different origin', async ({
  page,
  gotoDashboardPage,
  readProvisionedDashboard,
}) => {
  const workerSource = await readFile('dist/layout-worker.mjs');
  let workerRequests = 0;
  const cdn = createServer((request, response) => {
    if (request.url !== '/layout-worker.mjs') {
      response.writeHead(404).end();
      return;
    }
    workerRequests++;
    response.writeHead(200, {
      'Content-Type': 'text/javascript',
      'Access-Control-Allow-Origin': '*',
    });
    response.end(workerSource);
  });
  await new Promise<void>((resolve) => cdn.listen(0, '127.0.0.1', resolve));
  try {
    const address = cdn.address();
    if (!address || typeof address === 'string') {
      throw new Error('Test CDN did not start');
    }
    const cdnOrigin = `http://127.0.0.1:${address.port}`;
    // Model the CDN asset base without changing Grafana's own scripts or adding
    // a production test hook. Keep all other URL construction unchanged.
    await page.addInitScript((origin) => {
      const NativeURL = window.URL;
      window.URL = class extends NativeURL {
        constructor(url: string | URL, base?: string | URL) {
          super(url, url === 'layout-worker.mjs' ? origin : base);
        }
      };
    }, cdnOrigin);

    const dashboard = await readProvisionedDashboard({ fileName: UNIFIED_GRAPH_DASHBOARD });
    const dashboardPage = await gotoDashboardPage({ uid: dashboard.uid, queryParams: graphE2EQuery() });
    expect(new URL(page.url()).origin).not.toBe(cdnOrigin);
    const panel = dashboardPage.getPanelByTitle('Unified graph');
    await waitForGraph(panel);
    const summary = await readGraphSummary(panel);
    expect(summary.nodeCount).toBe(4);
    expect(summary.edgeCount).toBeGreaterThan(0);
    expect(workerRequests).toBeGreaterThan(0);
  } finally {
    await new Promise<void>((resolve, reject) => cdn.close((error) => (error ? reject(error) : resolve())));
  }
});
