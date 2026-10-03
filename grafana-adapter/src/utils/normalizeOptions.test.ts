import { areMapViewConfigsEqual } from '@vaduga/mapgl-core/utils';
import { normalizeOptions, persistFreshPanelOptions } from './normalizeOptions';

describe('persistFreshPanelOptions', () => {
  it('persists normalized options with a starter data layer for a fresh panel', () => {
    const options = {
      dataLayers: [],
      common: {
        customOption: 'preserved',
      },
    };
    const onOptionsChange = jest.fn();

    const persisted = persistFreshPanelOptions(options, onOptionsChange);

    expect(persisted).toBe(true);
    expect(onOptionsChange).toHaveBeenCalledTimes(1);
    const normalized = onOptionsChange.mock.calls[0][0];
    expect(normalized).toEqual(
      expect.objectContaining({
        common: expect.objectContaining({
          customOption: 'preserved',
        }),
        dataLayers: [
          expect.objectContaining({
            type: 'markers',
            name: 'new markers layer',
          }),
        ],
        view: expect.objectContaining({
          allLayers: true,
          id: 'fit',
          zoom: 15,
        }),
      })
    );
    expect(normalized.common.hideDiagnostics).toBe(false);
    expect(options.dataLayers).toEqual([]);
  });

  it('does not rewrite options that already contain a data layer', () => {
    const onOptionsChange = jest.fn();

    const persisted = persistFreshPanelOptions(
      {
        dataLayers: [
          {
            type: 'markers',
            name: 'existing layer',
            config: {},
          },
        ],
      },
      onOptionsChange
    );

    expect(persisted).toBe(false);
    expect(onOptionsChange).not.toHaveBeenCalled();
  });

  it('preserves the configured view when the panel already has a data layer', () => {
    const normalized = normalizeOptions({
      dataLayers: [
        {
          type: 'markers',
          name: 'existing layer',
          config: {},
        },
      ],
      view: {
        id: 'coords',
        lon: 12,
        lat: 34,
        zoom: 5,
      },
    });

    expect(normalized.view).toEqual(
      expect.objectContaining({
        id: 'coords',
        lon: 12,
        lat: 34,
        zoom: 5,
      })
    );
  });

  it('preserves the diagnostic visibility preference', () => {
    const normalized = normalizeOptions({
      common: {
        hideDiagnostics: true,
      },
      dataLayers: [
        {
          type: 'markers',
          name: 'existing layer',
          config: {},
        },
      ],
    });

    expect(normalized.common.hideDiagnostics).toBe(true);
  });
});
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
