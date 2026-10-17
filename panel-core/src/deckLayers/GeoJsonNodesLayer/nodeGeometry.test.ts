import { getFittedGaugeValueTextSize, getGaugeValueContentBoxSide, getResolvedNodeArcColors } from './nodeGeometry';

describe('getResolvedNodeArcColors', () => {
  const properties = [{ style: { arcs: ['#ff0000', '#00ff00'] } }];

  it('resolves binary placeholder objects by feature index', () => {
    expect(getResolvedNodeArcColors(undefined, properties, new Uint16Array([0]), 0)).toEqual(['#ff0000', '#00ff00']);
  });
});

describe('gauge center value geometry', () => {
  const feature = (barWidthFactor: number, selected = false) => ({
    properties: {
      locName: selected ? 'selected' : 'node',
      style: {
        size: 100,
        gauge: { displayText: '42%' },
        arcOptions: { barWidthFactor },
      },
    },
  });

  it('fits the content box inside the current gauge opening', () => {
    const fullWidthBars = getGaugeValueContentBoxSide(feature(1));
    const thinBars = getGaugeValueContentBoxSide(feature(0.1));
    const selected = getGaugeValueContentBoxSide(feature(1, true), 'selected');

    expect(fullWidthBars).toBeCloseTo((100 * 0.73 * 0.94) / Math.SQRT2);
    expect(thinBars).toBeGreaterThan(fullWidthBars);
    expect(selected).toBeCloseTo(fullWidthBars * 1.3);
  });

  it('shrinks longer single-line values and handles empty content', () => {
    // Use consistent monospace metrics at the measurement font's 100px size.
    const getContext = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      measureText: (text: string) => ({ width: text.length * 62 }),
    } as CanvasRenderingContext2D);
    try {
      const side = 50;
      const shortTextSize = getFittedGaugeValueTextSize('8', side);
      const longTextSize = getFittedGaugeValueTextSize('123.45 GiB', side);

      expect(shortTextSize).toBeLessThanOrEqual(side * 0.88);
      expect(longTextSize).toBeLessThan(shortTextSize);
      expect(getFittedGaugeValueTextSize('', side)).toBe(0);
    } finally {
      getContext.mockRestore();
    }
  });
});
