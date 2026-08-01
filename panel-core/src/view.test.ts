import { normalizeOptions } from './utils/normalizeOptions';
import { areMapViewConfigsEqual } from './view';

describe('areMapViewConfigsEqual', () => {
  it('does not treat an unrelated fresh-panel option edit as a map-view change', () => {
    const before = normalizeOptions(undefined);
    const after = normalizeOptions({
      ...before,
      common: {
        ...before.common,
        isShowLegend: !before.common.isShowLegend,
      },
    });

    expect(before.view).not.toBe(after.view);
    expect(areMapViewConfigsEqual(before.view, after.view)).toBe(true);
  });

  it('detects a map-view option change', () => {
    expect(
      areMapViewConfigsEqual({ id: 'fit', allLayers: true, zoom: 15 }, { id: 'fit', allLayers: true, zoom: 12 })
    ).toBe(false);
  });
});
