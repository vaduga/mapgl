import { BLANK_USER_SVG_ICON, createUserSvgAtlas, createUserSvgAtlasPlan, getUserSvgVariantKey } from './userSvgAtlas';

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
      entryCount: 2,
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

  it('uses one atlas slot per active canvas-tint variant', () => {
    const variants = new Map([['svg:router:4:canvasTint:red', 20]]);

    expect(createUserSvgAtlasPlan(variants, { revision: 4 }).diagnostics.entryCount).toBe(1);
  });

  it('does not reserve a full cell for the blank icon', () => {
    const plan = createUserSvgAtlasPlan(new Map([['svg:router:4:none:base', 600]]), {
      revision: 4,
      devicePixelRatio: 1,
    });

    expect(plan.sourceTier).toBe(1020);
    expect(plan.diagnostics).toMatchObject({
      entryCount: 1,
      width: 1024,
      height: 1024,
      estimatedRgbaBytes: 1024 * 1024 * 4,
    });
  });

  it('builds a complete atlas and centers aspect-fitted sources in their slots', () => {
    const key = 'svg:router:4:none:base';
    const plan = createUserSvgAtlasPlan(new Map([[key, 20]]), { revision: 4, devicePixelRatio: 1 });
    const atlas = createUserSvgAtlas(plan, [
      { key, url: 'data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E', width: 60, height: 30 },
    ]);

    expect(atlas.iconAtlas).toMatch(/^data:image\/svg\+xml/);
    expect(atlas.iconMapping[BLANK_USER_SVG_ICON]).toEqual({ x: 62, y: 1, width: 1, height: 1, mask: false });
    expect(atlas.iconMapping[key]).toEqual({ x: 0, y: 15, width: 60, height: 30, mask: false });

    const markup = decodeURIComponent(atlas.iconAtlas!.split(',')[1]);
    expect(markup).toContain('width="1024" height="64"');
    expect(markup).toContain('href="data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E"');
  });
});
