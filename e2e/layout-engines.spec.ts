import { test, expect } from '@grafana/plugin-e2e';

for (const engine of ['MSAGL', 'ELK'] as const) {
  test(`loads only the ${engine} layout engine in a real module worker`, async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    const assets: string[] = [];
    page.context().on('request', (request) => {
      if (request.url().includes('/public/plugins/vaduga-mapgl-panel/') && request.url().includes('.mjs'))
        assets.push(request.url());
    });
    const result = await page.evaluate(async (engine) => {
      const worker = new Worker('/public/plugins/vaduga-mapgl-panel/layout-worker.mjs', { type: 'module' });
      try {
        return await new Promise<{ positions: number[]; curves: number; arrows: number[] }>((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error('Layout worker timeout')), 15000);
          worker.onerror = (event) => {
            clearTimeout(timeout);
            reject(new Error(event.message));
          };
          worker.onmessage = ({ data }) => {
            clearTimeout(timeout);
            if (data.type === 'error') reject(new Error(data.message));
            else
              resolve({
                positions: Array.from(data.positions),
                curves: data.curveGroups.length,
                arrows: Array.from(data.arrows.flags),
              });
          };
          worker.postMessage({
            requestId: 1,
            operation: 'layout',
            engine,
            routing: 'Splines',
            direction: 'LR',
            layerSeparation: 60,
            nodeSeparation: 40,
            rootGraphId: 'root',
            positionsLength: 4,
            graphs: [{ id: 'root' }],
            nodes: [
              { id: 'a', graphId: 'root', wasmId: 0, radius: 10 },
              { id: 'b', graphId: 'root', wasmId: 1, radius: 10 },
            ],
            edges: [
              {
                id: 'ab',
                sourceId: 'a',
                sourceGraphId: 'root',
                targetId: 'b',
                targetGraphId: 'root',
                targetArrowLength: 8,
              },
            ],
          });
        });
      } finally {
        worker.terminate();
      }
    }, engine);
    expect(result.positions).toHaveLength(4);
    expect(result.positions.every(Number.isFinite)).toBe(true);
    expect(result.curves).toBe(1);
    expect(result.arrows).toEqual([2]);
    expect(assets.some((url) => url.includes(engine === 'ELK' ? 'elk' : 'msagl'))).toBe(true);
    expect(assets.some((url) => url.includes(engine === 'ELK' ? 'msagl' : 'elk'))).toBe(false);
  });
}
