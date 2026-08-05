import { getFittedDimensions } from './nodeGeometry';
import { getNodeIconAtlasSourceSize } from './svgIconAtlas';

describe('user SVG atlas source planning', () => {
  it('uses a small source tier for sparse small icons', () => {
    expect(
      getNodeIconAtlasSourceSize(2, {
        requiredDisplaySize: 20,
        devicePixelRatio: 1,
        qualityMargin: 1.5,
      })
    ).toBe(60);
  });

  it('accounts for display size, DPR, and quality margin', () => {
    expect(
      getNodeIconAtlasSourceSize(1, {
        requiredDisplaySize: 200,
        devicePixelRatio: 2,
        qualityMargin: 1.5,
      })
    ).toBe(1020);
  });

  it('selects a packing-safe fallback when the requested tier cannot fit all entries', () => {
    expect(
      getNodeIconAtlasSourceSize(200, {
        requiredDisplaySize: 200,
        devicePixelRatio: 2,
        qualityMargin: 1.5,
      })
    ).toBeLessThan(1020);
  });

  it.each([
    ['square', { width: 20, height: 20 }, { width: 60, height: 60 }],
    ['wide', { width: 40, height: 20 }, { width: 60, height: 30 }],
    ['tall', { width: 20, height: 40 }, { width: 30, height: 60 }],
  ])('preserves %s SVG aspect ratio in fitted visual fixtures', (_name, source, expected) => {
    expect(getFittedDimensions(60, source.width, source.height)).toEqual(expected);
  });
});
