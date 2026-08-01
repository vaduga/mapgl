import { fitCartesianBounds } from './map';

describe('fitCartesianBounds', () => {
  it('centers arbitrary Cartesian layout coordinates without latitude projection', () => {
    expect(fitCartesianBounds([100, 200, 300, 600], 1000, 500, { maxZoom: 5, padding: 50 })).toEqual({
      longitude: 200,
      latitude: 400,
      zoom: 0,
    });
  });

  it('honors the configured maximum zoom for small bounds', () => {
    expect(fitCartesianBounds([-1, -1, 1, 1], 1000, 500, { maxZoom: 3, padding: 0 })).toEqual({
      longitude: 0,
      latitude: 0,
      zoom: 3,
    });
  });
});
