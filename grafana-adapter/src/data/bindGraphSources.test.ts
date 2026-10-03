import { toDataFrame } from '@grafana/data';
import { bindGraphFrames } from '../graph/frame/normalize';
import { GrafanaSourceResolver } from './bindGraphSources';

it('captures mutable frames by revision and rejects obsolete native references', async () => {
  const frame = toDataFrame({
    refId: 'A',
    fields: [
      { name: 'node', values: ['A', 'B'] },
      { name: 'metric', values: [10, 20] },
      { name: 'target', values: [['A', 'B'], null] },
    ],
  });
  const bound = await bindGraphFrames({
    revision: 'first',
    data: { series: [frame] },
    options: { nodeIdField: 'node', targetField: 'target', isLogic: true },
  });
  const source = bound.normalization.layers[0].sources[0];
  frame.fields[0].values[0] = 'replacement';
  frame.fields[1].values[0] = 900;
  frame.fields[2].values[0][0] = 'new-path';
  expect(source.target?.get(0)).toEqual(['A', 'B']);
  expect(source.nodeId.get(0)).toBe('A');
  expect(source.value('metric', 0)).toBe(10);
  // Native visual compilation and indexed binding borrow the same captured column.
  expect(bound.frames[0].fields[1].values[0]).toBe(10);
  const oldRow = { revision: 'first', sourceIndex: 0, sourceKey: 'A', rowIndex: 0 };
  expect(new GrafanaSourceResolver('first', bound.frames).resolve(oldRow)?.frame.fields[0].values[0]).toBe('A');
  expect(new GrafanaSourceResolver('second', [frame]).resolve(oldRow)).toBeUndefined();
  expect(new GrafanaSourceResolver('first', bound.frames).resolve({ ...oldRow, sourceKey: 'other' })).toBeUndefined();
});
