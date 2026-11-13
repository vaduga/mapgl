import {
  createRouteLabelDataByGraph,
  declutterRouteLabels,
  getRouteLabelCandidates,
  getRouteLabels,
  pointAlong,
} from './route-labels';

describe('route labels', () => {
  it('finds the point at a fraction of a polyline', () => {
    expect(
      pointAlong(
        [
          [0, 0],
          [10, 0],
          [10, 10],
        ],
        0.5
      )
    ).toEqual([10, 0]);
    expect(
      pointAlong(
        [
          [0, 0],
          [10, 0],
          [10, 10],
        ],
        0.75
      )
    ).toEqual([10, 5]);
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
      arcStyle: { showStat2: true, sideA: { text: '10 Mb/s', color: [0, 0, 255, 255] }, sideB: { text: '1 Mb/s' } },
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

  it('does not invent side labels when the middle style is copied by a consumer', () => {
    const middle = { text: 'authored hop' };
    const copied = { properties: { edgeStyle: { ...middle }, arcStyle: { sideA: middle, sideB: middle } } };
    expect(getRouteLabels(line(400, copied)).map((label) => label.text)).toEqual(['authored hop']);
  });

  it('stacks the labels mid-line, with direction arrows, when the line is short', () => {
    const labels = getRouteLabels(line(80, feature));
    expect(labels.map((l) => [l.text, l.position[0], Math.round(l.position[1])])).toEqual([
      ['3 denied', 40, 0],
      ['→ 10 Mb/s', 40, -14],
      ['← 1 Mb/s', 40, 14],
    ]);
  });

  it('uses independent side font sizes and ignores blank text', () => {
    const styled = {
      properties: {
        ...feature.properties,
        arcStyle: { showStat2: true, sideA: { text: 'large', textConfig: { fontSize: 20 } }, sideB: { text: '  ' } },
      },
    };
    const candidates = getRouteLabelCandidates(line(500, styled));
    expect(candidates.map((c) => [c.text, c.fontSize, c.hh])).toEqual([
      ['large', 20, 13],
      ['3 denied', 10, 6.5],
    ]);
  });

  it("moves a label off a card or another line's label, and drops it when no spot is clear", () => {
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

it('skips sampling edges without configured text', () => {
  const subarray = jest.fn(() => {
    throw new Error('unnecessary curve sampling');
  });
  expect(
    getRouteLabelCandidates({
      length: 1,
      features: [{ properties: { edgeStyle: { text: '  ' } } }],
      segmentFeatureIndexes: [0],
      attributes: { getControlPoints: { value: { subarray } }, getSegment: {}, getCurveType: {} },
    } as any)
  ).toEqual([]);
  expect(subarray).not.toHaveBeenCalled();
});

it('jumps past tall obstacles while retaining every focused label', () => {
  const candidate: any = {
    text: 'focused',
    fontSize: 10,
    featureIndex: 0,
    kind: 'middle',
    spots: [[0, 0]],
    hw: 10,
    hh: 7,
    color: [1, 2, 3, 255],
    feature: { properties: {} },
  };
  const labels = declutterRouteLabels([candidate, candidate], [{ x: 0, y: 0, hw: 100, hh: 1e9 }], () => true);
  expect(labels).toHaveLength(2);
  expect(labels[0].position[1]).toBeGreaterThan(1e9 + 7);
  expect(labels[1].position[1] - labels[0].position[1]).toBeGreaterThanOrEqual(14);
});

it('prepares candidate anchors once and applies namespace shifts once', () => {
  const feature: any = { properties: {} };
  const candidates: any[] = ['a', 'b'].map((srcGraphId, i) => ({
    srcGraphId,
    feature,
    featureIndex: 0,
    text: srcGraphId,
    kind: 'middle',
    fontSize: 10,
    hw: 10,
    hh: 7,
    spots: [[0, 0]],
    color: [0, 0, 0, 255],
    shift: [i * 100, 0],
  }));
  const obstacles: any[] = [];
  const baseline = createRouteLabelDataByGraph(candidates, obstacles);
  expect(baseline.get('a')).toHaveLength(1);
  expect(baseline.get('b')).toHaveLength(1);
  expect(baseline.get('b')![0].position).toEqual([0, 0]);
  expect(createRouteLabelDataByGraph(candidates, obstacles)).toBe(baseline);
  expect(baseline.get('a')![0].idleVisible).toBe(true);
  const blocked = [{ x: 0, y: 0, hw: 200, hh: 200 }];
  const reserved = createRouteLabelDataByGraph(candidates, blocked);
  expect(reserved.get('a')).toHaveLength(1);
  expect(reserved.get('b')).toHaveLength(1);
  expect(reserved.get('a')![0].idleVisible).toBe(false);
  expect(reserved.get('a')![0].position[1]).toBe(0);
  const focused = reserved.get('a')!.placement!.resolve({ a: new Map([[0, 0]]) });
  expect(focused.get(reserved.get('a')![0])![1]).toBeGreaterThan(200);
  expect(createRouteLabelDataByGraph(candidates, blocked)).toBe(reserved);
});
it('indexed placement matches a linear reference across deterministic crowded fixtures', () => {
  let seed = 42;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const candidates: any[] = Array.from({ length: 300 }, (_, featureIndex) => ({
    feature: { properties: {} },
    featureIndex,
    text: String(featureIndex),
    fontSize: 10,
    kind: featureIndex % 3 ? 'end' : 'middle',
    hw: 5 + random() * 25,
    hh: 7,
    spots: Array.from({ length: 4 }, () => [Math.floor(random() * 500), Math.floor(random() * 300)]),
    color: [0, 0, 0, 255],
  }));
  const obstacles = [{ x: 250, y: 150, hw: 50, hh: 100 }];
  const taken = [...obstacles],
    expected: string[] = [];
  for (const c of [...candidates].sort((a, b) => Number(b.kind === 'middle') - Number(a.kind === 'middle'))) {
    const spot = c.spots.find(
      ([x, y]: number[]) => !taken.some((b) => Math.abs(x - b.x) < c.hw + b.hw && Math.abs(y - b.y) < c.hh + b.hh)
    );
    if (spot) {
      taken.push({ x: spot[0], y: spot[1], hw: c.hw, hh: c.hh });
      expected.push(`${c.text}:${spot}`);
    }
  }
  expect(declutterRouteLabels(candidates, obstacles).map((c) => `${c.text}:${c.position}`)).toEqual(expected);
});

it('declutters only focused labels when idle labels are hidden, without resampling candidates', () => {
  const candidates = Array.from({ length: 1000 }, (_, featureIndex) => ({
    srcGraphId: 'ns',
    featureIndex,
    text: String(featureIndex),
    fontSize: 10,
    kind: 'middle' as const,
    color: [0, 0, 0, 255],
    feature: { properties: {} } as any,
    spots: [[0, 0]] as [number, number][],
    hw: 10,
    hh: 7,
  }));
  const data = createRouteLabelDataByGraph(candidates, [], false).get('ns')!;
  const placement = data.placement!;
  expect(data.every((label) => !label.idleVisible && label.position[1] === 0)).toBe(true);
  const one = placement.resolve({ ns: new Map([[999, 0]]) });
  expect(one.size).toBe(1);
  expect(one.get(data[999])).toEqual([0, 0]);
  expect(placement.resolve({ ns: new Map([[999, 1]]) })).toBe(one);
  const two = placement.resolve({
    ns: new Map([
      [998, 0],
      [999, 0],
    ]),
  });
  expect(two.size).toBe(2);
  expect(two.get(data[998])).toEqual([0, 0]);
  expect(two.get(data[999])![1]).toBeGreaterThanOrEqual(14);
  expect(placement.resolve({}).size).toBe(0);
  expect(data.every((label) => label.position[1] === 0)).toBe(true);
});
it('prioritizes focused text over visible idle text and ignores prohibited labels', () => {
  const candidate = (featureIndex: number, eligible = true): any => ({
    srcGraphId: 'ns',
    featureIndex,
    eligible,
    text: String(featureIndex),
    fontSize: 10,
    kind: 'middle',
    color: [0, 0, 0, 255],
    feature: { properties: {} },
    spots: [[0, 0]],
    hw: 10,
    hh: 7,
  });
  const data = createRouteLabelDataByGraph([candidate(0), candidate(1), candidate(2, false)], [], true).get('ns')!;
  expect(data.map((label) => label.idleVisible)).toEqual([true, false, false]);
  const focused = data.placement!.resolve({
    ns: new Map([
      [1, 0],
      [2, 0],
    ]),
  });
  expect(focused.get(data[1])).toEqual([0, 0]);
  expect(focused.has(data[0])).toBe(false);
  expect(focused.has(data[2])).toBe(false);
  expect(data.placement!.resolve({}).get(data[0])).toEqual([0, 0]);
});
