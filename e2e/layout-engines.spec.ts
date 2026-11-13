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

test('MSAGL worker routes both terminal shapes and arrow modes in all orientations', async ({
  dashboardPage,
  page,
}) => {
  test.setTimeout(120_000);
  await dashboardPage.goto();
  const failures = await page.evaluate(async () => {
    const worker = new Worker('/public/plugins/vaduga-mapgl-panel/layout-worker.mjs', { type: 'module' });
    const errors: string[] = [];
    let id = 0;
    try {
      for (const routing of ['Splines', 'Rectilinear'])
        for (const direction of ['LR', 'RL', 'TB', 'BT'])
          for (const cards of [false, true])
            for (const arrow of [0, 1, -1, 2]) {
              const requestId = ++id;
              const request = {
                requestId,
                operation: 'layout',
                engine: 'MSAGL',
                routing,
                direction,
                cards,
                layerSeparation: 100,
                nodeSeparation: 40,
                rootGraphId: 'root',
                positionsLength: 4,
                graphs: [{ id: 'root' }],
                nodes: [
                  { id: 'a', graphId: 'root', wasmId: 0, radius: 15, width: 80, height: 40 },
                  { id: 'b', graphId: 'root', wasmId: 1, radius: 15, width: 80, height: 40 },
                ],
                edges: [
                  {
                    id: 'ab',
                    sourceId: 'a',
                    sourceGraphId: 'root',
                    targetId: 'b',
                    targetGraphId: 'root',
                    sourceArrowLength: arrow === -1 || arrow === 2 ? 8 : undefined,
                    targetArrowLength: arrow === 1 || arrow === 2 ? 8 : undefined,
                  },
                ],
              };
              const result: any = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(Error('worker timeout')), 10000);
                worker.onmessage = ({ data }) => {
                  clearTimeout(timeout);
                  resolve(data);
                };
                worker.onerror = (event) => {
                  clearTimeout(timeout);
                  reject(Error(event.message));
                };
                worker.postMessage(request);
              });
              const label = `${routing}/${direction}/cards=${cards}/arrow=${arrow}`;
              if (result.type === 'error' || result.routing !== routing || !result.curveGroups?.[0]?.types.length) {
                errors.push(`${label}: missing requested route`);
                continue;
              }
              const flag = result.arrows.flags[0] ?? 0;
              const expected = (arrow === -1 || arrow === 2 ? 1 : 0) | (arrow === 1 || arrow === 2 ? 2 : 0);
              if (flag !== expected) errors.push(`${label}: arrow flags ${flag}`);
              for (const [bit, tips, index] of [
                [1, result.arrows.sourceTips, 0],
                [2, result.arrows.targetTips, 1],
              ] as const) {
                if (!(flag & bit)) continue;
                const dx = Math.abs(tips[0] - result.positions[index * 2]);
                const dy = Math.abs(tips[1] - result.positions[index * 2 + 1]);
                const distance = cards
                  ? Math.min(Math.abs(dx - 40), Math.abs(dy - 20))
                  : Math.abs(Math.hypot(dx, dy) - 15);
                if (distance > 0.1) errors.push(`${label}: terminal ${bit} is ${distance} from boundary`);
              }
            }
    } finally {
      worker.terminate();
    }
    return errors;
  });
  expect(failures).toEqual([]);
});
