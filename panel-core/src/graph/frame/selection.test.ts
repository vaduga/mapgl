import { toDataFrame } from '@grafana/data';

import { createGraphRowRef, resolveGraphFrames, selectGraphFrames } from './selection';
import type { GraphFrameOptions } from './types';

const options: GraphFrameOptions = {
  nodeIdField: 'source',
  targetField: 'target',
  edgeIdField: 'edgeId',
  sourceNamespaceField: 'sourceNs',
  targetNamespaceField: 'targetNs',
  isLogic: true,
};

describe('graph frame selection and field resolution', () => {
  const frames = [
    toDataFrame({
      refId: 'A',
      fields: [
        { name: 'source', values: ['a'] },
        { name: 'target', values: ['b'] },
        { name: 'edgeId', values: ['a-b'] },
        { name: 'sourceNs', values: ['one'] },
        { name: 'targetNs', values: ['one'] },
      ],
    }),
    toDataFrame({
      refId: 'B',
      fields: [{ name: 'source', values: ['b'] }],
    }),
  ];

  it('selects one matching frame and preserves its original index', () => {
    const selected = selectGraphFrames(frames, { id: 'byRefId', options: 'B' });

    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({ frameIndex: 1 });
    expect(selected[0].frame.refId).toBe('B');
  });

  it('keeps multiple frames in stable input order when no matcher is configured', () => {
    const selected = selectGraphFrames(frames);

    expect(selected.map(({ frameIndex, frame }) => [frameIndex, frame.refId])).toEqual([
      [0, 'A'],
      [1, 'B'],
    ]);
  });

  it('returns no selections when the configured matcher matches nothing', () => {
    expect(selectGraphFrames(frames, { id: 'byRefId', options: 'missing' })).toEqual([]);
  });

  it('resolves configured topology fields per frame', async () => {
    const selected = selectGraphFrames(frames, { id: 'byRefId', options: 'A' });
    const result = await resolveGraphFrames(selected, options);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value[0]).toMatchObject({
      nodeId: { name: 'source' },
      target: { name: 'target' },
      edgeId: { name: 'edgeId' },
      sourceNamespace: { name: 'sourceNs' },
      targetNamespace: { name: 'targetNs' },
    });
  });

  it('reports absent optional fields without rejecting a node-only frame', async () => {
    const selected = selectGraphFrames(frames, { id: 'byRefId', options: 'B' });
    const result = await resolveGraphFrames(selected, options);

    expect(result.ok).toBe(true);
    expect(result.diagnostics.map(({ code }) => code)).toEqual([
      'missing-target-field',
      'missing-edge-id-field',
      'missing-source-namespace-field',
      'missing-target-namespace-field',
    ]);
  });

  it('returns a fatal result when a selected frame lacks the node ID field', async () => {
    const selected = selectGraphFrames([
      toDataFrame({
        refId: 'Broken',
        fields: [{ name: 'other', values: ['a'] }],
      }),
    ]);
    const result = await resolveGraphFrames(selected, options);

    expect(result.ok).toBe(false);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: 'missing-node-id-field',
        severity: 'fatal',
        count: 1,
      }),
    ]);
  });

  it('creates stable frame and row identity', () => {
    const row = createGraphRowRef(selectGraphFrames(frames)[1], 4);

    expect(row).toEqual({
      frameIndex: 1,
      frameRefId: 'B',
      rowIndex: 4,
    });
  });
});
