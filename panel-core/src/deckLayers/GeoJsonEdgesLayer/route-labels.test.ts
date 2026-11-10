import { declutterRouteLabels, getRouteLabelCandidates, getRouteLabels, pointAlong } from './route-labels';

describe('route labels', () => {
  it('finds the point at a fraction of a polyline', () => {
    expect(pointAlong([[0, 0], [10, 0], [10, 10]], 0.5)).toEqual([10, 0]);
    expect(pointAlong([[0, 0], [10, 0], [10, 10]], 0.75)).toEqual([10, 5]);
  });

  const line = (x2: number, feature: any) =>
    ({
      length: 1,
      attributes: {
        getControlPoints: { value: Float32Array.from([0, 0, x2, 0, 0, 0, 0, 0]), size: 8 },
        getSegment: { value: Float32Array.from([0, 1]), size: 2 },
        getCurveType: { value: Uint8Array.from([0]), size: 1 },
      },
      features: [feature],
      segmentFeatureIndexes: Int32Array.from([0]),
    }) as any;
  const feature = {
    properties: {
      edgeStyle: { text: '3 denied', color: [255, 0, 0, 255], textConfig: { fontSize: 10 } },
      arcStyle: { sideA: { text: '10 Mb/s', color: [0, 0, 255, 255] }, sideB: { text: '1 Mb/s' } },
    },
  };

  it('puts each side by its end and the edge text between them, apart', () => {
    const labels = getRouteLabels(line(400, feature));
    // Middle badge placed first: it wins a contested spot.
    expect(labels.map((l) => [l.text, l.kind])).toEqual([
      ['3 denied', 'middle'],
      ['10 Mb/s', 'end'],
      ['1 Mb/s', 'end'],
    ]);
    const [m, a, b] = labels.map((l) => l.position[0]);
    // widths at font 10: 7, 6 and 8 chars * 6 + 8 padding
    expect(a).toBeCloseTo(6 + 25);
    expect(b).toBeCloseTo(400 - 6 - 22);
    expect(m - 28 > a + 25 && m + 28 < b - 22).toBe(true);
    expect(labels[2].color).toEqual([255, 0, 0, 255]); // no side colour: the line's
  });

  it('stacks the labels mid-line, with direction arrows, when the line is short', () => {
    const labels = getRouteLabels(line(80, feature));
    expect(labels.map((l) => [l.text, l.position[0], Math.round(l.position[1])])).toEqual([
      ['3 denied', 40, 0],
      ['→ 10 Mb/s', 40, -14],
      ['← 1 Mb/s', 40, 14],
    ]);
  });

  it('moves a label off a card or another line\'s label, and drops it when no spot is clear', () => {
    const [a] = getRouteLabelCandidates(line(400, feature));
    // A card over the first spot of the source label: it moves along the line.
    const [moved] = declutterRouteLabels([a], [{ x: 31, y: 0, hw: 10, hh: 10 }]);
    expect(moved.position[0]).toBeGreaterThan(31);
    // Everything blocked: dropped.
    expect(declutterRouteLabels([a], [{ x: 200, y: 0, hw: 400, hh: 10 }])).toEqual([]);
    // Two lines on top of each other: the second's labels move or go, none overlap.
    const both = declutterRouteLabels(
      [...getRouteLabelCandidates(line(400, feature)), ...getRouteLabelCandidates(line(400, feature))],
      []
    );
    const xs = both.map((l) => l.position[0]).sort((p, q) => p - q);
    expect(new Set(xs).size).toBe(xs.length);
    expect(both.filter((l) => l.kind === 'middle')).toHaveLength(2);
  });
});
