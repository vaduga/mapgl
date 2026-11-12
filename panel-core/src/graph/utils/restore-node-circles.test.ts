import { Curve, GeomEdge, GeomGraph, LineSegment, Point } from '@msagl/core';
import { addSnapshotEdge, addSnapshotNode, createGraphHierarchy, restoreNodeCircles } from './layout-worker-helpers';
import { getLayoutResult } from './layout-worker-runner';
import { resolveLayoutArrowLengths } from './layout-geometry';
import { pointOnCurve } from '../../deckLayers/GeoJsonEdgesLayer/curve-geometry';

for (const routing of ['Splines', 'Rectilinear'] as const) {
  for (const cards of [false, true]) {
    for (const width of [2, 10]) {
      it.each([0, 1, -1, 2])(`${routing}, cards=${cards}, width=${width}: joins pieces and arrow terminals (%s)`, (arrow) => {
        const lengths = resolveLayoutArrowLengths(arrow, width);
        const result = getLayoutResult({
          requestId: 1, operation: 'layout', routing, cards, direction: 'LR',
          layerSeparation: 60, nodeSeparation: 40, rootGraphId: 'root', positionsLength: 4,
          graphs: [{ id: 'root' }],
          nodes: [
            { id: 'a', graphId: 'root', wasmId: 0, radius: 10, width: 80, height: 40 },
            { id: 'b', graphId: 'root', wasmId: 1, radius: 10, width: 120, height: 40 },
          ],
          edges: [{ id: 'ab', sourceId: 'a', sourceGraphId: 'root', targetId: 'b', targetGraphId: 'root', sourceArrowLength: lengths.start, targetArrowLength: lengths.end }],
        });
        const group = result.curveGroups![0];
        let first: number[] | undefined, last: number[] | undefined;
        for (let i = 0; i < group.types.length; i++) {
          const cp = group.controlPoints.subarray(i * 8, i * 8 + 8);
          const [t, dt] = group.segments.subarray(i * 2, i * 2 + 2);
          const start = pointOnCurve(group.types[i], cp, t);
          const end = pointOnCurve(group.types[i], cp, t + dt);
          if (last) expect(Math.hypot(last[0] - start[0], last[1] - start[1])).toBeLessThan(0.001);
          first ??= start;
          last = end;
        }
        const flags = result.arrows.flags[0];
        for (const [index, endpoint] of [
          [0, flags & 1 ? Array.from(result.arrows.sourceTips.slice(0, 2)) : first!],
          [1, flags & 2 ? Array.from(result.arrows.targetTips.slice(0, 2)) : last!],
        ] as const) {
          const dx = Math.abs(endpoint[0] - result.positions[index * 2]);
          const dy = Math.abs(endpoint[1] - result.positions[index * 2 + 1]);
          if (cards) expect(Math.min(Math.abs(dx - (index ? 60 : 40)), Math.abs(dy - 20))).toBeLessThan(0.01);
          else expect(Math.hypot(dx, dy)).toBeCloseTo(10, 2);
        }
      });
    }
  }
}

describe('circle restoration after label-box routing', () => {
  it.each([0, 1, -1, 2])('keeps terminal segments connected for arrow mode %s', (arrow) => {
    const { rootGraph } = createGraphHierarchy('root', [{ id: 'root' }]);
    const source = addSnapshotNode(
      { id: 'a', graphId: 'root', wasmId: 0, radius: 10, width: 80, height: 40 },
      rootGraph
    );
    const target = addSnapshotNode({ id: 'b', graphId: 'root', wasmId: 1, radius: 10 }, rootGraph, new Point(200, 0));
    const edge = addSnapshotEdge(
      {
        id: 'ab',
        sourceId: 'a',
        sourceGraphId: 'root',
        targetId: 'b',
        targetGraphId: 'root',
        sourceArrowLength: arrow === -1 || arrow === 2 ? 12 : undefined,
        targetArrowLength: arrow === 1 || arrow === 2 ? 12 : undefined,
      },
      source,
      target
    );
    const geom = GeomEdge.getGeom(edge);
    geom.curve = LineSegment.mkPP(
      new Point(geom.sourceArrowhead ? 52 : 40, 0),
      new Point(geom.targetArrowhead ? 178 : 190, 0)
    );
    if (geom.sourceArrowhead) {geom.sourceArrowhead.tipPosition = new Point(40, 0);}
    if (geom.targetArrowhead) {geom.targetArrowhead.tipPosition = new Point(190, 0);}
    restoreNodeCircles(GeomGraph.getGeom(rootGraph));
    const pieces = geom.curve instanceof Curve ? geom.curve.segs : [geom.curve];
    for (let i = 1; i < pieces.length; i++) {
      expect(distance(pieces[i - 1].end, pieces[i].start)).toBeLessThan(0.001);
    }
    const sourceTerminal = geom.sourceArrowhead?.tipPosition ?? geom.curve.start;
    const targetTerminal = geom.targetArrowhead?.tipPosition ?? geom.curve.end;
    expect(distance(sourceTerminal, new Point(0, 0))).toBeCloseTo(10, 2);
    expect(distance(targetTerminal, new Point(200, 0))).toBeCloseTo(10, 2);
  });
});

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
