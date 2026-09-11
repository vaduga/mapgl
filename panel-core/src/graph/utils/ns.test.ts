import { getNsPrefixes, joinNsParts, splitNsId } from './utils.graph';

describe('namespace hierarchy IDs', () => {
  it('round-trips literal dots and backslashes inside hierarchy segments', () => {
    const id = joinNsParts(['site', 'core.edge', String.raw`rack\west`]);

    expect(splitNsId(id)).toEqual(['site', 'core.edge', String.raw`rack\west`]);
    expect(getNsPrefixes(id).map(splitNsId)).toEqual([
      ['site'],
      ['site', 'core.edge'],
      ['site', 'core.edge', String.raw`rack\west`],
    ]);
  });

  it('preserves ordinary dot-delimited namespace IDs', () => {
    expect(splitNsId('site.core.router')).toEqual(['site', 'core', 'router']);
    expect(getNsPrefixes('site.core.router')).toEqual(['site', 'site.core', 'site.core.router']);
  });
});
