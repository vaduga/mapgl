import { getNsPrefixes, joinNsParts, splitNsId } from './utils.graph';

describe('namespace hierarchy IDs', () => {
  it('round-trips literal dots, percent signs, and backslashes inside hierarchy segments', () => {
    const id = joinNsParts(['site', 'core.edge', String.raw`rack\west%2E`]);

    expect(id).toBe(String.raw`site.core%2Eedge.rack\west%252E`);
    expect(splitNsId(id)).toEqual(['site', 'core.edge', String.raw`rack\west%2E`]);
    expect(getNsPrefixes(id).map(splitNsId)).toEqual([
      ['site'],
      ['site', 'core.edge'],
      ['site', 'core.edge', String.raw`rack\west%2E`],
    ]);
  });

  it('preserves ordinary dot-delimited namespace IDs', () => {
    expect(splitNsId('site.core.router')).toEqual(['site', 'core', 'router']);
    expect(getNsPrefixes('site.core.router')).toEqual(['site', 'site.core', 'site.core.router']);
  });
});
