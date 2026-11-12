import { getLayoutResult } from './layout-worker-runner';
import type { LayoutRequest } from './layout-worker-types';

// Three workloads in one namespace box that only talk to a peer outside the box. MSAGL lays each of
// them out as a separate component and packs them; the layout box must hold the label so they don't overlap.
function request(width?: number, height?: number): LayoutRequest {
  const lone = ['a', 'b', 'c'].map((id, wasmId) => ({ id, graphId: 'ns', wasmId, radius: 10, width, height }));
  return {
    requestId: 1,
    operation: 'layout',
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
  it('keeps labelled lone nodes in a box apart by their label box', () => {
    const { positions } = getLayoutResult(request(200, 50));
    expect(overlaps(positions, 200, 50)).toBe(false);
  });

  it('starts edges at the drawn circle, not at the label box', () => {
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
