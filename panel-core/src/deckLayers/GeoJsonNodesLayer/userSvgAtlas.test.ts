import { createUserSvgAtlasPlan, getUserSvgVariantKey } from './userSvgAtlas';

describe('user SVG variant keys', () => {
  it('tracks only user-SVG raster inputs', () => {
    const input = {
      iconName: 'router',
      revision: 4,
      tintMode: 'canvasTint',
      tintColor: 'rgba(1, 2, 3, 1)',
    };

    expect(getUserSvgVariantKey(input)).toBe('svg:router:4:canvasTint:rgba(1, 2, 3, 1)');
    expect(getUserSvgVariantKey({ ...input })).toBe(getUserSvgVariantKey(input));
  });

  it('returns no atlas key without a user icon', () => {
    expect(
      getUserSvgVariantKey({
        revision: 1,
        tintMode: 'none',
      })
    ).toBeUndefined();
  });

  it('reports a sparse, deduplicated atlas plan with stable ownership', () => {
    const variants = new Map([
      ['svg:router:4:none:base', 20],
      ['svg:switch:4:none:base', 10],
    ]);
    const plan = createUserSvgAtlasPlan(variants, { revision: 4, devicePixelRatio: 1 });

    expect(plan.sourceTier).toBe(60);
    expect(plan.diagnostics).toMatchObject({
      activeKeys: ['svg:router:4:none:base', 'svg:switch:4:none:base'],
      entryCount: 3,
      sourceTier: 60,
      width: 1024,
      height: 64,
      estimatedRgbaBytes: 1024 * 64 * 4,
    });
    expect(createUserSvgAtlasPlan(new Map(), { revision: 5 }).diagnostics).toMatchObject({
      ownershipGeneration: '5:empty',
      entryCount: 0,
      estimatedRgbaBytes: 0,
    });
  });
});
