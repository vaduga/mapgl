import { GraphDiagnosticCollector } from './diagnostics';
import type { GraphFrameDiagnostic } from './types';

describe('GraphDiagnosticCollector', () => {
  it('merges aggregate counts while retaining only bounded source examples', () => {
    const source: GraphFrameDiagnostic = {
      code: 'invalid-path',
      severity: 'warning',
      message: 'Invalid routed path',
      count: 100_000,
      examples: [
        { context: { frameIndex: 0, rowIndex: 1 }, value: 'first' },
        { context: { frameIndex: 0, rowIndex: 2 }, value: 'second' },
      ],
    };
    const collector = new GraphDiagnosticCollector(3);

    collector.add('invalid-path', 'warning', 'Invalid routed path', { frameIndex: 0, rowIndex: 0 }, 'existing');
    collector.addAll([source]);

    expect(collector.result()).toEqual([
      {
        code: 'invalid-path',
        severity: 'warning',
        message: 'Invalid routed path',
        count: 100_001,
        examples: [
          { context: { frameIndex: 0, rowIndex: 0 }, value: 'existing' },
          { context: { frameIndex: 0, rowIndex: 1 }, value: 'first' },
          { context: { frameIndex: 0, rowIndex: 2 }, value: 'second' },
        ],
      },
    ]);
  });

  it('merges counts without fabricating examples', () => {
    const collector = new GraphDiagnosticCollector();

    collector.addAll([
      {
        code: 'empty-graph',
        severity: 'info',
        message: 'Empty graph',
        count: 50,
        examples: [],
      },
    ]);

    expect(collector.result()[0]).toMatchObject({ count: 50, examples: [] });
  });
});
