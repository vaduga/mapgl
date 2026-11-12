import { getLayoutResult } from './layout-worker-runner';
import type { LayoutRequest } from './layout-worker-types';

// Three nodes inside a namespace, each connected to a peer outside it.
function request(width?: number, height?: number, cards = false): LayoutRequest {
  const lone = ['a', 'b', 'c'].map((id, wasmId) => ({ id, graphId: 'ns', wasmId, radius: 10, width, height }));
  return {
    requestId: 1,
    operation: 'layout',
    cards,
    routing: 'Splines',
    direction: 'LR',
    layerSeparation: 60,
    nodeSeparation: 40,
    rootGraphId: 'root',
    positionsLength: 8,
    graphs: [{ id: 'root' }, { id: 'ns', parentId: 'root' }],
    nodes: [...lone, { id: 'peer', graphId: 'root', wasmId: 3, radius: 10 }],
    edges: lone.map(({ id }) => ({ id, sourceId: id, sourceGraphId: 'ns', targetId: 'peer', targetGraphId: 'root' })),
  };
}

function overlaps(positions: Float64Array, width: number, height: number): boolean {
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      const dx = Math.abs(positions[i * 2] - positions[j * 2]);
      const dy = Math.abs(positions[i * 2 + 1] - positions[j * 2 + 1]);
      if (dx < width && dy < height) {
        return true;
      }
    }
  }
  return false;
}

describe('layout worker runner', () => {
  it('keeps cards apart by their drawn rectangles', () => {
    const { positions } = getLayoutResult(request(200, 50, true));
    expect(overlaps(positions, 200, 50)).toBe(false);
  });

  it('lays circles out independently of label boxes and relayouts when cards change', () => {
    const circle = getLayoutResult(request(200, 50));
    expect(circle).toEqual(getLayoutResult(request()));
    expect(getLayoutResult(request(200, 50, true)).positions).not.toEqual(circle.positions);
    const { positions, curveGroups } = getLayoutResult(request(200, 50));
    const group = curveGroups!.find((g) => g.graphId === 'ns')!;
    group.edgeIndexes.forEach((edgeIndex, local) => {
      const first = group.edgeSegmentOffsets[local] * 8; // first control point of the first segment
      const [x, y] = [group.controlPoints[first], group.controlPoints[first + 1]];
      const dist = Math.hypot(x - positions[edgeIndex * 2], y - positions[edgeIndex * 2 + 1]);
      expect(dist).toBeCloseTo(10, 0);
    });
  });
});
