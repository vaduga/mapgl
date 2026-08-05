import { colTypes } from '@mapgl/panel-core/types';

import { getNodeLayerVisibility, getNodePointType } from './nodeRenderPlan';

describe('node render plan', () => {
  it('omits IconLayer when no user SVG is active, including donut-only data', () => {
    expect(getNodePointType(undefined, false)).toBe('circle+text');
    expect(getNodePointType('circle+icon+text', true)).toBe('circle+icon+text');
  });

  it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])('keeps Circle and SVG visibility independent (%s, %s)', (circle, svg) => {
    const states = new Map<string, boolean[]>([
      [colTypes.Circle, [circle, false]],
      [colTypes.SVG, [svg, false]],
      [colTypes.Label, [true, false]],
    ]);
    const visibility = getNodeLayerVisibility({
      getVisState: (_index: null, name: string) => states.get(name),
    });

    expect(visibility).toEqual({ circle, svg, labels: true });
  });
});
