import {
  DONUT_INNER_RADIUS_RATIO,
  DONUT_RECORD_TEXELS,
  MAX_DONUT_SEGMENTS,
  MAX_DONUT_STRIPES,
  createDonutAtlas,
  createEqualDonutInput,
  getDonutInputKey,
  getDonutRecord,
  normalizeDonutInput,
} from './donutData';

describe('donut shader data', () => {
  it('preserves ordered and repeated node colors as equal segments', () => {
    const normalized = normalizeDonutInput(createEqualDonutInput(['#ff0000', '#00ff00', '#ff0000']));

    expect(normalized.segments).toHaveLength(3);
    expect(normalized.segments.map((segment) => segment.endFraction)).toEqual([1 / 3, 2 / 3, 1]);
    expect(normalized.segments[0].color).toEqual(normalized.segments[2].color);
    expect(normalized.innerRadius).toBe(DONUT_INNER_RADIUS_RATIO);
  });

  it('keeps weighted segment gaps when the explicit total is larger', () => {
    const normalized = normalizeDonutInput({
      segments: [
        { color: '#ff0000', count: 2 },
        { color: '#00ff00', count: 1 },
      ],
      total: 4,
    });

    expect(normalized.segments.map((segment) => segment.endFraction)).toEqual([0.5, 0.75]);
  });

  it('normalizes stripe fractions independently from donut totals', () => {
    const normalized = normalizeDonutInput({
      total: 100,
      segments: [{ color: '#ff0000', count: 50 }],
      stripes: [
        { color: '#111111', count: 1 },
        { color: '#222222', count: 3 },
      ],
    });

    expect(normalized.stripes.map((stripe) => stripe.endFraction)).toEqual([0.25, 1]);
  });

  it('handles empty inputs and missing node colors deterministically', () => {
    expect(normalizeDonutInput({})).toMatchObject({ segments: [], stripes: [] });
    expect(normalizeDonutInput(createEqualDonutInput([undefined])).segments[0].color).toEqual([0, 0, 0, 1]);
  });

  it('bounds segment and stripe records and reports truncation', () => {
    const normalized = normalizeDonutInput({
      segments: Array.from({ length: MAX_DONUT_SEGMENTS + 2 }, (_, index) => ({
        color: [index, 0, 0, 255],
        count: 1,
      })),
      stripes: Array.from({ length: MAX_DONUT_STRIPES + 1 }, (_, index) => ({
        color: [0, index, 0, 255],
        count: 1,
      })),
    });

    expect(normalized.segments).toHaveLength(MAX_DONUT_SEGMENTS);
    expect(normalized.stripes).toHaveLength(MAX_DONUT_STRIPES);
    expect(normalized.truncatedSegmentCount).toBe(2);
    expect(normalized.truncatedStripeCount).toBe(1);
  });

  it('deduplicates equivalent keys and exposes deterministic diagnostics', () => {
    const input = createEqualDonutInput(['#ff0000', '#00ff00']);
    const atlas = createDonutAtlas([
      ['first', input],
      ['first', input],
      ['second', input],
    ]);

    expect(atlas.recordByKey.size).toBe(2);
    expect(getDonutRecord(atlas, 'first')).toBe(0);
    expect(getDonutRecord(atlas, 'second')).toBe(1);
    expect(getDonutRecord(atlas, 'missing')).toBe(-1);
    expect(getDonutRecord(atlas, undefined)).toBe(-1);
    expect(atlas.recordTexels).toBe(DONUT_RECORD_TEXELS);
    expect(atlas.diagnostics).toMatchObject({
      transport: 'rgba32float-texture',
      ownershipGeneration: 'first||second',
      recordCount: 2,
      segmentCount: 4,
      stripeCount: 0,
      estimatedBytes: atlas.data.byteLength,
    });
  });

  it('creates stable visual keys independently of caller identity', () => {
    expect(getDonutInputKey(createEqualDonutInput(['#ff0000', '#00ff00']))).toBe(
      getDonutInputKey(createEqualDonutInput(['#ff0000', '#00ff00']))
    );
    expect(getDonutInputKey(createEqualDonutInput(['#00ff00', '#ff0000']))).not.toBe(
      getDonutInputKey(createEqualDonutInput(['#ff0000', '#00ff00']))
    );
  });

  it('keeps deterministic visual fixtures for node, cluster, and annotation variants', () => {
    const fixtures = [
      createEqualDonutInput(['#ff0000']),
      createEqualDonutInput(['#ff0000', '#00ff00', '#0000ff', '#ff0000']),
      {
        total: 10,
        segments: [
          { color: '#ff0000', count: 2 },
          { color: '#00ff00', count: 3 },
        ],
        stripes: [
          { color: '#111111', count: 1 },
          { color: '#222222', count: 2 },
          { color: '#333333', count: 1 },
          { color: '#444444', count: 1 },
        ],
      },
    ];

    const atlas = createDonutAtlas(fixtures.map((input, index) => [`fixture-${index}`, input] as const));
    expect(atlas.recordByKey.size).toBe(3);
    expect(atlas.diagnostics).toMatchObject({
      recordCount: 3,
      segmentCount: 7,
      stripeCount: 4,
      estimatedBytes: atlas.data.byteLength,
    });
  });
});
