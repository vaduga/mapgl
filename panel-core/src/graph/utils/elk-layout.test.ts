import { getElkLayoutResult } from './elk-layout';
import type { LayoutRequest } from './layout-worker-types';

// Namespace box "ns" with three workloads that all call "peer" outside the box.
function request(): LayoutRequest {
  const lone = ['a', 'b', 'c'].map((id, wasmId) => ({ id, graphId: 'ns', wasmId, radius: 10, width: 200, height: 50 }));
  return {
    requestId: 1,
    operation: 'layout',
    engine: 'ELK',
    routing: 'Splines',
    direction: 'LR',
    layerSeparation: 60,
    nodeSeparation: 20,
    rootGraphId: 'root',
    positionsLength: 8,
    graphs: [{ id: 'root' }, { id: 'ns', parentId: 'root' }],
    nodes: [...lone, { id: 'peer', graphId: 'root', wasmId: 3, radius: 10 }],
    edges: lone.map(({ id }) => ({ id, sourceId: id, sourceGraphId: 'ns', targetId: 'peer', targetGraphId: 'root' })),
  };
}

describe('ELK layout', () => {
  it.each(['LR', 'RL', 'TB', 'BT'] as const)('preserves flow through sibling namespaces in %s', async (direction) => {
    const input: LayoutRequest = {
      ...request(),
      direction,
      positionsLength: 6,
      graphs: [{ id: 'root' }, ...['left', 'middle', 'right'].map((id) => ({ id, parentId: 'root' }))],
      nodes: ['left', 'middle', 'right'].map((graphId, wasmId) => ({ id: 'node', graphId, wasmId, radius: 10 })),
      edges: [
        { id: 'first', sourceId: 'node', sourceGraphId: 'left', targetId: 'node', targetGraphId: 'middle' },
        { id: 'second', sourceId: 'node', sourceGraphId: 'middle', targetId: 'node', targetGraphId: 'right' },
      ],
    };
    const result = await getElkLayoutResult(input);
    const axis = direction === 'LR' || direction === 'RL' ? 0 : 1;
    const sign = direction === 'RL' || direction === 'BT' ? -1 : 1;
    expect(sign * (result.positions[2 + axis] - result.positions[axis])).toBeGreaterThan(0);
    expect(sign * (result.positions[4 + axis] - result.positions[2 + axis])).toBeGreaterThan(0);
  });

  it('stacks a box in the flow: callers left of the peer, labels apart, nodes inside their box', async () => {
    const { positions, graphs } = await getElkLayoutResult(request());
    const xy = (i: number) => [positions[i * 2], positions[i * 2 + 1]];
    for (let i = 0; i < 3; i++) {
      expect(xy(i)[0]).toBeLessThan(xy(3)[0]);
      for (let j = i + 1; j < 3; j++) {
        const [dx, dy] = [Math.abs(xy(i)[0] - xy(j)[0]), Math.abs(xy(i)[1] - xy(j)[1])];
        expect(dx >= 200 || dy >= 30).toBe(true); // 20 node + 15 label tall, 200 wide
      }
    }
    const box = graphs.find((g) => g.id === 'ns')!;
    for (let i = 0; i < 3; i++) {
      const [x, y] = xy(i);
      expect(x > box.minX && x < box.maxX && y > box.minY && y < box.maxY).toBe(true);
    }
  });

  it('starts edges on the drawn circle', async () => {
    const { positions, curveGroups } = await getElkLayoutResult(request());
    const group = curveGroups!.find((g) => g.graphId === 'ns')!;
    group.edgeIndexes.forEach((edgeIndex, local) => {
      const first = group.edgeSegmentOffsets[local] * 8;
      const dist = Math.hypot(
        group.controlPoints[first] - positions[edgeIndex * 2],
        group.controlPoints[first + 1] - positions[edgeIndex * 2 + 1]
      );
      expect(dist).toBeCloseTo(10, 0);
    });
  });
});

describe('ELK layout with node cards', () => {
  it('sizes nodes as cards and ends edges on the card border', async () => {
    const req = { ...request(), cards: true, routing: 'Rectilinear' as const };
    req.nodes = req.nodes.map((node) => ({ ...node, width: 120, height: 40 }));
    const { positions, curveGroups } = await getElkLayoutResult(req);
    const group = [...curveGroups!.values()][0];
    const [x0] = group.controlPoints; // first point of the first edge: right border of card a
    expect(x0).toBeCloseTo(positions[0] + 60, 0);
  });
});

describe('ELK layout of a hub', () => {
  it('spreads many callers over columns instead of one tall column', async () => {
    const callers = Array.from({ length: 25 }, (_, i) => ({ id: `c${i}`, graphId: `ns${i}`, wasmId: i, radius: 10 }));
    const req: LayoutRequest = {
      ...request(),
      positionsLength: 52,
      graphs: [{ id: 'root' }, ...callers.map((c) => ({ id: c.graphId, parentId: 'root' }))],
      nodes: [...callers, { id: 'hub', graphId: 'root', wasmId: 25, radius: 10 }],
      edges: callers.map((c) => ({
        id: c.id,
        sourceId: c.id,
        sourceGraphId: c.graphId,
        targetId: 'hub',
        targetGraphId: 'root',
      })),
    };
    const { graphs } = await getElkLayoutResult(req);
    const xs = graphs.filter((g) => g.id.startsWith('ns')).map((g) => g.minX);
    expect(new Set(xs.map(Math.round)).size).toBeGreaterThanOrEqual(4);
  });
});
