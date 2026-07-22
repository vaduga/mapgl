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
    expect(normalized.dataLayers[0].config).toEqual(
      expect.objectContaining({
        style: expect.objectContaining({
          size: expect.objectContaining({ fixed: 25 }),
        }),
        edgeStyle: expect.objectContaining({
          color: expect.objectContaining({ fixed: 'dark-green' }),
        }),
        arcStyle: expect.objectContaining({
          sideA: expect.any(Object),
          sideB: expect.any(Object),
        }),
        arcConfig: expect.objectContaining({
          capacity: { fixed: 1 },
        }),
      })
    );
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
});
