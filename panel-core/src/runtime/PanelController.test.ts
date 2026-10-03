import { resolveSelection, selectionViewport } from './selection';
import { resolveGraphPanelLayout, createGraphPanelRenderState } from '../graph/frame/graphPanelRuntime';
import { defViewState } from '../types';
import { PanelController } from './PanelController';
import { metricGraphInput, metricGraphSource } from '../../examples/neutral';
import { applyGraphVisualState } from '../graph/frame/visualState';
import { getNodeData, Graph } from '../graph/main';
import { autorun, runInAction } from 'mobx';

function controller(layout?: () => Promise<null> | null) {
  return new PanelController({
    layout: async (context) => {
      await layout?.();
      return resolveGraphPanelLayout(context, undefined, async () => undefined);
    },
  });
}
describe('neutral panel controller', () => {
  it('ignores semantic selections whose node, edge or namespace no longer exists', async () => {
    const runtime = controller();
    await runtime.update(metricGraphInput(metricGraphSource('baseline', [0, 100])));
    const node = runtime.state!.graph.state.nodeByKey.values().next().value!;
    const namespaceId = (node.parent as Graph).id;
    runtime.selectElement({ kind: 'node', id: node.id, namespaceId });
    const selected = jest.fn();
    runtime.subscribe(selected);
    runtime.selectElement({ kind: 'node', id: 'removed', namespaceId });
    runtime.selectElement({ kind: 'edge', id: 'removed', namespaceId });
    runtime.selectElement({ kind: 'node', id: node.id, namespaceId: 'removed' });
    expect(runtime.stores.pointStore.getSelectedNode).toBe(node);
    expect(selected).not.toHaveBeenCalled();
    runtime.dispose();
  });
  it('notifies selection observers for selecting, replacing, and clearing a node', async () => {
    const runtime = controller();
    await runtime.update(metricGraphInput(metricGraphSource('baseline', [0, 100])));
    const nodes = Array.from(runtime.state!.graph.state.nodeByKey.values());
    const selection = jest.fn();
    const dispose = autorun(() => selection(runtime.stores.pointStore.getSelectedNode));

    runtime.select({ id: nodes[0].id, namespaceId: String((nodes[0].parent as Graph).id) }, 'host');
    expect(selection).toHaveBeenLastCalledWith(nodes[0]);
    runtime.stores.pointStore.setSelectedNode(nodes[1]);
    expect(selection).toHaveBeenLastCalledWith(nodes[1]);

    await runtime.update(metricGraphInput(metricGraphSource('replacement', [100, 0])));
    const replacement = runtime.stores.pointStore.getSelectedNode;
    expect(replacement?.id).toBe(nodes[1].id);
    expect(replacement).not.toBe(nodes[1]);
    expect(selection).toHaveBeenLastCalledWith(replacement);

    runtime.select(undefined, 'host');
    expect(selection).toHaveBeenLastCalledWith(null);
    expect(selection).toHaveBeenCalledTimes(5);
    dispose();
    runtime.dispose();
  });
  it('does not invalidate selected edge lists when only focus changes', async () => {
    const runtime = controller();
    await runtime.update(metricGraphInput(metricGraphSource('baseline', [0, 100])));
    const observe = jest.fn();
    const dispose = autorun(() => observe(runtime.stores.pointStore.getSelEdges));
    runInAction(() => runtime.stores.pointStore.focusRevision++);
    expect(observe).toHaveBeenCalledTimes(1);
    await runtime.update(metricGraphInput(metricGraphSource('replacement', [100, 0])));
    expect(observe).toHaveBeenCalledTimes(2);
    dispose();
    runtime.dispose();
  });
  it('keeps visible attributes unchanged while geometry candidates wait and after failures', async () => {
    let release!: () => void;
    let wait = false;
    const runtime = controller(() =>
      wait
        ? new Promise((resolve) => {
            release = () => resolve(null);
          })
        : null
    );
    await runtime.update(metricGraphInput(metricGraphSource('baseline', [0, 100])));
    const baseline = runtime.state!;
    const firstNode = baseline.graph.state.nodeByKey.values().next().value!;
    expect(getNodeData(firstNode)?.feature?.style.size).toBe(5);
    wait = true;
    const candidate = runtime.update(metricGraphInput(metricGraphSource('replacement', [100, 0])));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(runtime.state).toBe(baseline);
    expect(getNodeData(firstNode)?.feature?.style.size).toBe(5);
    runtime.invalidate();
    release();
    await candidate;
    expect(runtime.state).toBe(baseline);
    runtime.dispose();
  });
  it('retains untouched range peers without changing query cells or packed topology, and rejects old revisions', async () => {
    const metrics = [0, 100, 50];
    const source = metricGraphSource('baseline', metrics);
    const runtime = controller();
    await runtime.update(metricGraphInput(source));
    const baseline = runtime.state!;
    const row = baseline.snapshot.nodes[1].primaryRow;
    const result = await runtime.patchMetrics([{ row, propertyKey: 'metric', value: 200 }]);
    expect(result?.ok).toBe(true);
    expect(metrics).toEqual([0, 100, 50]);
    expect(runtime.state!.visual.state.nodes.map((node) => node.style.size)).toEqual([5, 10, 7.5]);
    expect(runtime.state!.snapshot.relations).toBe(baseline.snapshot.relations);
    const next = metricGraphInput(metricGraphSource('new-query', [0, 100, 50]));
    await runtime.update(next);
    expect(runtime.state!.visual.state.nodes.map((node) => node.style.size)).toEqual([5, 10, 7.5]);
    expect(await runtime.patchMetrics([{ row, propertyKey: 'metric', value: 900 }])).toBeUndefined();
    runtime.dispose();
  });
  it('preserves selection keys across object replacement and commits valid empty results', async () => {
    const runtime = controller();
    await runtime.update(metricGraphInput(metricGraphSource('first', [0, 100])));
    const node = runtime.state!.graph.state.nodeByKey.values().next().value!;
    runtime.stores.pointStore.setSelectedNode(node);
    await runtime.update(metricGraphInput(metricGraphSource('second', [100, 0])));
    expect(runtime.stores.pointStore.getSelectedNode?.id).toBe(node.id);
    expect(runtime.stores.pointStore.getSelectedNode === node).toBe(false);
    await runtime.update(metricGraphInput(metricGraphSource('empty', [])));
    expect(runtime.view.phase).toBe('empty');
    expect(runtime.state!.visual.state.features).toHaveLength(0);
    runtime.dispose();
  });
  it('coalesces concurrent metrics and does not echo host commands', async () => {
    const runtime = controller();
    const events: string[] = [];
    runtime.subscribe((event) => events.push(event.type));
    runtime.setViewport({ ...defViewState, zoom: 1 }, 'host');
    runtime.select(undefined, 'host');
    expect(events).toEqual([]);
    runtime.setViewport({ ...defViewState, zoom: 2 });
    expect(events).toEqual(['viewport']);
    await runtime.update(metricGraphInput(metricGraphSource('baseline', [0, 100, 50])));
    const rows = runtime.state!.snapshot.nodes.map((node) => node.primaryRow);
    await Promise.all([
      runtime.patchMetrics([{ row: rows[0], propertyKey: 'metric', value: 100 }]),
      runtime.patchMetrics([{ row: rows[1], propertyKey: 'metric', value: 200 }]),
    ]);
    const sizes = runtime.state!.visual.state.nodes.map((node) => node.style.size);
    expect(sizes[0]).toBeCloseTo(5 + 5 / 3);
    expect(sizes.slice(1)).toEqual([10, 7.5]);
    runtime.dispose();
  });
  it('retains a valid commit when preparation fails', async () => {
    let fail = false;
    const runtime = new PanelController({
      render: createGraphPanelRenderState,
      prepareCommit: () => {
        if (fail) {
          throw new Error('feature preparation failed');
        }
        return {};
      },
    });
    await runtime.update(metricGraphInput(metricGraphSource('first', [0, 100])));
    const committed = runtime.state;
    fail = true;
    await expect(runtime.update(metricGraphInput(metricGraphSource('second', [100, 0])))).rejects.toThrow(
      'feature preparation failed'
    );
    expect(runtime.state).toBe(committed);
    expect(runtime.view.phase).toBe('fatal');
    runtime.dispose();
  });
});

it('coalesces concurrent visual patches, rejects stale rows and leaves unrelated visuals unchanged', async () => {
  const runtime = controller();
  await runtime.update(metricGraphInput(metricGraphSource('first', [0, 100, 50])));
  const before = runtime.state!;
  const rows = before.snapshot.nodes.map((node) => node.primaryRow);
  await Promise.all([
    runtime.patchMetrics([{ row: rows[0], propertyKey: 'metric', value: 75 }]),
    runtime.patchMetrics([{ row: rows[1], propertyKey: 'metric', value: 200 }]),
  ]);
  expect(runtime.state!.visual.state.nodes[0]).not.toBe(before.visual.state.nodes[0]);
  expect(runtime.state!.visual.state.nodes[1]).not.toBe(before.visual.state.nodes[1]);
  expect(runtime.state!.visual.state.nodes[2]).toBe(before.visual.state.nodes[2]);
  expect(runtime.state!.graph).toBe(before.graph);
  const last = runtime.state;
  expect(await runtime.patchMetrics([{ row: rows[0], propertyKey: 'id', value: 'changed' }])).toBeUndefined();
  expect(runtime.state).toBe(last);
  await runtime.update(metricGraphInput(metricGraphSource('second', [0, 100, 50])));
  expect(await runtime.patchMetrics([{ row: rows[0], propertyKey: 'metric', value: 900 }])).toBeUndefined();
  runtime.dispose();
});

it('patches every matching outgoing repeated-row edge without touching other nodes', async () => {
  const base = metricGraphSource('repeated', [0, 25, 100, 50]);
  const ids = ['A', 'A', 'B', 'C'];
  const targets = ['B', 'C', 'C', undefined];
  const source = {
    ...base,
    nodeId: { key: 'id', length: 4, get: (index) => ids[index] },
    target: { key: 'target', length: 4, get: (index) => targets[index] },
    value: (key, index) => (key === 'id' ? ids[index] : base.value(key, index)),
  };
  const runtime = controller();
  await runtime.update(metricGraphInput(source));
  const before = runtime.state!;
  await runtime.patchMetrics([{ row: before.snapshot.nodes[0].primaryRow, propertyKey: 'metric', value: 75 }]);
  const after = runtime.state!.visual.state;
  expect(after.edgeUnits[0]!.metrics.color).toBe(75);
  expect(after.edgeUnits[1]!.metrics.color).toBe(75);
  expect(after.edgeUnits[2]).toBe(before.visual.state.edgeUnits[2]);
  expect(after.nodes[1]).toBe(before.visual.state.nodes[1]);
  expect(after.nodes[2]).toBe(before.visual.state.nodes[2]);
  runtime.dispose();
});

it('retains visible properties and discards overlays when visual publication fails', async () => {
  let fail = false;
  const runtime = new PanelController({
    commitVisuals: () => {
      if (fail) {
        throw new Error('visual publication failed');
      }
    },
  });
  await runtime.update(metricGraphInput(metricGraphSource('first', [0, 100, 50])));
  const before = runtime.state!;
  const rows = before.snapshot.nodes.map((record) => record.primaryRow);
  const node = before.graph.state.nodeByKey.get(before.snapshot.nodes[0].key)!;
  const data = getNodeData(node);
  fail = true;
  await expect(runtime.patchMetrics([{ row: rows[0], propertyKey: 'metric', value: 200 }])).rejects.toThrow(
    'visual publication failed'
  );
  expect(runtime.state).toBe(before);
  expect(getNodeData(node)).toBe(data);
  fail = false;
  await runtime.patchMetrics([{ row: rows[2], propertyKey: 'metric', value: 25 }]);
  expect(runtime.state!.visual.state.nodes[0]).toBe(before.visual.state.nodes[0]);
  expect(getNodeData(node)).toBe(data);
  expect(runtime.state!.visual.state.nodes[2].style.size).toBe(6.25);
  runtime.dispose();
});

it('completes selection and focus before notifying a host without an event echo', async () => {
  const runtime = controller();
  await runtime.update(metricGraphInput(metricGraphSource('graph', [0, 10])));
  const node = [...runtime.state!.graph.state.nodeByKey.values()][0];
  const edge = [...runtime.state!.graph.state.graph.deepEdges][0];
  const listener = jest.fn(() => ({
    node: runtime.stores.pointStore.getSelectedNode,
    edges: runtime.stores.pointStore.getSelEdges,
    focusedEdge: runtime.stores.pointStore.focusedEdgeId,
  }));
  runtime.subscribe(listener);
  runtime.select({ id: node.id, namespaceId: (node.parent as Graph).id }, 'user', [edge]);
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener.mock.results[0].value).toEqual({ node, edges: [edge], focusedEdge: edge.id });
  const resolved = resolveSelection(runtime.state!.graph.state.graph, { nodeId: node.id, edgeId: edge.id });
  expect(resolved).toEqual({ node, edge });
  runtime.dispose();
});

it('navigates to zero coordinates and rejects missing positions', () => {
  expect(selectionViewport({ coordinates: [0, 0], zoomIn: true }, undefined, [], true, 4)).toMatchObject({
    longitude: 0,
    latitude: 0,
    zoom: 1.5,
    target: [0, 0, 0],
  });
  expect(selectionViewport({ coordinates: [0, 0] }, undefined, [], false, 4)).toMatchObject({
    zoom: 4,
    target: [0, 0, 4],
  });
  expect(selectionViewport({}, undefined, [], true)).toBeUndefined();
});
