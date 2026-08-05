import { getResolvedNodeArcColors } from './nodeGeometry';

describe('getResolvedNodeArcColors', () => {
  const properties = [{ style: { arcs: ['#ff0000', '#00ff00'] } }];

  it('resolves binary placeholder objects by feature index', () => {
    expect(getResolvedNodeArcColors(undefined, properties, new Uint16Array([0]), 0)).toEqual(['#ff0000', '#00ff00']);
  });

  it('resolves arc colors for geo-mode nodes', () => {
    expect(getResolvedNodeArcColors(undefined, properties, new Uint16Array([0]), 0)).toEqual(['#ff0000', '#00ff00']);
  });
});
