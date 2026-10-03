import { PanelController } from '../runtime/PanelController';
import { metricGraphInput, metricGraphSource } from '../../examples/neutral';
import { PanelRenderSession, type RenderExtension, type InstantRenderPatch } from './session';
import * as mobx from 'mobx';
import { prepareGraphRender, captureRenderInput, buildPrimaryLayers } from './graph';
import { replaceRenderLayers, composeRenderLayers } from './layers';
import { VisLayers } from '../store/VisLayers';
import { colTypes } from '../types';
import { GeoJsonLayer } from '@deck.gl/layers';
import { arrayColumn } from '../data';
import type { GraphPipelineInput } from '../graph/frame';
import { GraphEdgeIndex } from '../graph/main';
import { GraphHighlighter } from '../deckLayers/GraphHighlighter';

const presentation = {
  isLogic: true,
  isRouted: true,
  graphVisibilityName: null,
  labels: true,
  pointType: 'circle',
  pickable: true,
};
async function fixture(input: GraphPipelineInput = metricGraphInput(metricGraphSource('first', [0, 50, 100]))) {
  const controller = new PanelController({
    prepareCommit: (state) => {
      const visibility = new VisLayers();
      for (const graph of [state.graph.state.graph, ...state.graph.state.graph.subgraphsBreadthFirst()]) {
        visibility.addLayer(graph.id, graph.id, 'graph', false, true, false, null, false);
      }
      for (const type of [colTypes.Circle, colTypes.SVG, colTypes.Label, colTypes.Edges]) {
        visibility.addLayer(type, type, type, false, true, false, null, false);
      }
      visibility.setActiveGroups(new Uint8Array(20).fill(1));
      return { visibility };
    },
  });
  await controller.update(input);
  return controller;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

function checkPatchOwnership(base: import('./session').DisplayedRenderFrame, extension: RenderExtension) {
  const ambiguous = { base, extension, dispose: () => {} };
  // @ts-expect-error cleanup belongs solely to the extension, even through an intermediate variable
  const patch: InstantRenderPatch = ambiguous;
  const overridden = { base, extension, input: base.input };
  // @ts-expect-error the session captures input; callers cannot override it
  const capture: InstantRenderPatch = overridden;
  void patch;
  void capture;
}
void checkPatchOwnership;

it.each(['full', 'instant'])(
  'publishes a current %s error without graph work and clears it on recovery',
  async (kind) => {
    const controller = await fixture();
    const session = new PanelRenderSession(controller, { presentation });
    await session.build();
    const base = session.frame;
    const state = controller.state,
      view = controller.scene.view;
    const notify = jest.fn();
    session.subscribe(notify);
    const failure = () => {
      throw Error('render unavailable');
    };
    if (kind === 'full') {
      session.configure({ presentation, extend: failure });
      await session.build();
    } else {
      await session.instant(failure);
    }
    expect(session.frame).toBe(base);
    expect(session.error).toBe('render unavailable');
    expect(notify).toHaveBeenCalledTimes(1);
    expect(controller.state).toBe(state);
    expect(controller.scene.view).toBe(view);
    session.configure({ presentation });
    await session.build();
    expect(session.error).toBeUndefined();
    const obsolete = deferred<RenderExtension>();
    session.configure({
      presentation,
      extend: () =>
        obsolete.promise.then(() => {
          throw Error('obsolete');
        }),
    });
    const pending = session.build();
    session.configure({ presentation });
    await session.build();
    obsolete.resolve({});
    await pending;
    expect(session.error).toBeUndefined();
    expect(controller.state).toBe(state);
    expect(controller.scene.view).toBe(view);
    session.dispose();
    controller.dispose();
  }
);

it('borrows resources only for bucket patches and replaces supplied extension ownership', async () => {
  const controller = await fixture();
  const dispose = jest.fn();
  const session = new PanelRenderSession(controller, { presentation, extend: () => ({ dispose }) });
  await session.build();
  const extension = session.frame!.extension;
  await session.instant((base) => ({ base, buckets: { comments: null } }));
  expect(session.frame!.extension).toBe(extension);
  expect(dispose).not.toHaveBeenCalled();
  await session.instant((base) => ({ base, extension: {} }));
  expect(dispose).toHaveBeenCalledTimes(1);
  session.dispose();
  expect(dispose).toHaveBeenCalledTimes(1);
  controller.dispose();
});

it('prepares matching routed/arc indexes without touching graph metadata or borrowed positions', async () => {
  const controller = await fixture();
  const input = captureRenderInput(controller, presentation);
  const prepared = prepareGraphRender(input);
  expect(prepared.geometry.mappings.map((mapping) => mapping?.lineId)).toEqual([0, 1]);
  expect(prepared.geometry.mappings.map((mapping) => mapping?.arcId)).toEqual([0, 1]);
  expect(prepared.geometry.routed.external.map((feature) => feature.edgeRef)).toEqual([0, 1]);
  expect(input.render.graph).toBe(controller.scene.render.graph);
  const positions = input.render.positions.slice();
  controller.scene.editPosition(0, 9);
  const firstEdit = controller.scene.render.positions;
  controller.scene.editPosition(1, 12);
  expect(input.render.positions).toEqual(positions);
  expect(firstEdit[1]).toBe(positions[1]);
  expect(controller.scene.render.positions).not.toBe(firstEdit);
  controller.dispose();
});

it('rejects same-generation visual changes before a host can schedule another build', async () => {
  const controller = await fixture();
  const pending = deferred<RenderExtension>();
  const release = jest.fn(),
    accept = jest.fn();
  const startRevision = controller.scene.renderRevision;
  const session = new PanelRenderSession(controller, {
    presentation,
    extend: (input) => (input.revision === startRevision ? pending.promise : new Promise(() => {})),
  });
  const build = session.build();
  controller.scene.update({ colors: controller.scene.render.colors.slice() });
  pending.resolve({ accept, dispose: release });
  await build;
  expect(accept).not.toHaveBeenCalled();
  expect(release).toHaveBeenCalled();
  session.dispose();
  controller.dispose();
});

it.each(['visibility', 'projection', 'resource', 'edge-index'])(
  'rejects a pending candidate after same-generation %s changes',
  async (change) => {
    const controller = await fixture();
    const pending = deferred<RenderExtension>();
    const release = jest.fn(),
      accept = jest.fn();
    let first = true;
    const session = new PanelRenderSession(controller, {
      presentation,
      extend: () => {
        if (first) {
          first = false;
          return pending.promise;
        }
        return new Promise(() => {});
      },
    });
    const generation = controller.scene.version;
    const request = session.build();
    if (change === 'visibility') {
      controller.scene.replaceVisibility(controller.scene.visibility.snapshot());
    } else if (change === 'projection') {
      controller.scene.publishProjection(undefined, controller.scene.render.positions.slice());
    } else if (change === 'resource') {
      controller.scene.invalidatePresentation();
    } else {
      controller.scene.render.edgeIndex.setRecordMetrics(0, 500);
    }
    pending.resolve({ accept, dispose: release });
    await request;
    expect(controller.scene.version).toBe(generation);
    expect(accept).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
    session.dispose();
    controller.dispose();
  }
);

it('retains coherent output on failure, clears immediately during pending work and leaves controller ownership with its caller', async () => {
  const controller = await fixture();
  const session = new PanelRenderSession(controller, { presentation });
  await session.build();
  const frame = session.frame!;
  expect(frame.layers.map((layer) => layer.id)).toEqual([
    'edges-viewexternal',
    'edges-arrow-external',
    'external-view',
    'external-view-label-text',
  ]);
  const fail = jest.fn();
  session.configure({
    presentation,
    extend: () => {
      throw Error('factory failed');
    },
    onError: fail,
  });
  await session.build();
  expect(session.frame).toBe(frame);
  expect(fail).toHaveBeenCalled();
  const pending = deferred<RenderExtension>();
  session.configure({ presentation, extend: () => pending.promise });
  const build = session.build();
  controller.clear();
  expect(session.layers).toEqual([]);
  pending.resolve({});
  await build;
  expect(session.layers).toEqual([]);
  session.dispose();
  await controller.update(metricGraphInput(metricGraphSource('after-disposal', [5])));
  expect(controller.state?.snapshot.nodes).toHaveLength(1);
  controller.dispose();
});

it('orders instant and full requests together and preserves consecutive bucket insertions/removals', async () => {
  const controller = await fixture();
  const session = new PanelRenderSession(controller, { presentation });
  await session.build();
  const base = session.frame!;
  const pending = deferred<import('./session').InstantRenderPatch>();
  const edit = session.instant(() => pending.promise);
  await session.build();
  pending.resolve({ base, buckets: { nodes: [] } });
  expect(await edit).toBe(false);
  expect(session.frame?.bundle.nodes?.length).toBe(1);
  const a = { id: 'a' } as any,
    b = { id: 'b' } as any;
  const current = [a];
  expect(replaceRenderLayers(current, [b], ['a'])).toEqual([b]);
  expect(current).toEqual([a]);
  const inserted = new GeoJsonLayer({ id: 'inserted' });
  const beforeEdit = session.frame!;
  await session.instant((base) => ({ base, buckets: { comments: inserted, nodes: [] } }));
  const afterEdit = session.frame!;
  await session.instant((base) => ({ base, buckets: { labels: [] } }));
  expect(session.layers.map((layer) => layer.id)).toContain('inserted');
  expect(session.layers.map((layer) => layer.id)).not.toContain('external-view');
  expect(session.frame!.layers).toEqual(composeRenderLayers(session.frame!.bundle));
  expect(beforeEdit.bundle.nodes).toHaveLength(1);
  expect(afterEdit.bundle.labels).toHaveLength(1);
  await session.instant((base) => ({ base, buckets: { comments: null } }));
  expect(session.layers.map((layer) => layer.id)).not.toContain('inserted');
  expect(session.frame!.bundle.comments).toBeNull();
  session.dispose();
  controller.dispose();
});

it('publishes synchronous instant edits before returning to the caller', async () => {
  const controller = await fixture();
  const session = new PanelRenderSession(controller, { presentation });
  await session.build();
  const base = session.frame;
  const request = session.instant((base) => ({ base, buckets: { comments: null } }));
  expect(session.frame).not.toBe(base);
  expect(await request).toBe(true);
  session.dispose();
  controller.dispose();
});

it.each(['edge-index revision', 'edge-index replacement', 'scene generation'])(
  'rejects an instant candidate after its captured %s changes',
  async (change) => {
    const controller = await fixture();
    let waiting = false;
    const session = new PanelRenderSession(controller, {
      presentation,
      extend: () => (waiting ? new Promise(() => {}) : {}),
    });
    await session.build();
    waiting = true;
    const base = session.frame!;
    const pending = deferred<InstantRenderPatch>();
    const accept = jest.fn(),
      dispose = jest.fn();
    const request = session.instant(() => pending.promise);
    if (change === 'edge-index revision') {
      controller.scene.render.edgeIndex.setRecordMetrics(0, 500);
    } else if (change === 'edge-index replacement') {
      controller.scene.update({ edgeIndex: new GraphEdgeIndex() });
    } else {
      await controller.update(metricGraphInput(metricGraphSource('replacement', [10, 20])));
    }
    pending.resolve({ base, extension: { accept, dispose } });
    expect(await request).toBe(false);
    expect(session.frame).toBe(base);
    expect(session.layers).toEqual(base.layers);
    expect(accept).not.toHaveBeenCalled();
    expect(dispose).toHaveBeenCalledTimes(1);
    session.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
    controller.dispose();
  }
);

it.each([
  ['full', false],
  ['instant', false],
  ['full', true],
  ['instant', true],
])('keeps a committed %s frame when retirement throws (reporter throws: %s)', async (kind, reporterThrows) => {
  const controller = await fixture();
  const failure = Error('retired resource failed');
  const oldDispose = jest.fn(() => {
    throw failure;
  });
  const dispose = jest.fn(),
    accept = jest.fn();
  const onError = jest.fn(() => {
    if (reporterThrows) {
      throw Error('reporter failed');
    }
  });
  let extension: RenderExtension = { dispose: oldDispose };
  const session = new PanelRenderSession(controller, { presentation, extend: () => extension, onError });
  await session.build();
  const base = session.frame!;
  const geometry = {
    ...base.prepared.geometry,
    mappings: base.prepared.geometry.mappings.map((mapping) => ({ ...mapping!, lineId: 42 })),
  };
  const node = new GeoJsonLayer({ id: 'new-node' });
  extension = { prepared: { geometry }, factories: { node: () => node }, accept, dispose };
  const observations: unknown[] = [];
  session.subscribe(() => {
    observations.push({
      node: session.layers.find((layer) => layer.id === node.id),
      mapping: controller.stores.pointStore.renderIndex(controller.scene.render.edgeIndex.getEdge(0)),
    });
  });
  const request = kind === 'full' ? session.build() : session.instant((base) => ({ base, extension }));
  if (reporterThrows) {
    await expect(request).rejects.toThrow('reporter failed');
  } else {
    expect(await request).toBe(kind === 'full' ? session.frame : true);
  }
  expect(session.frame).not.toBe(base);
  expect(session.frame!.bundle.nodes).toEqual([node]);
  expect(session.frame!.prepared.geometry).toBe(geometry);
  expect(session.layers).toEqual(session.frame!.layers);
  expect(observations.length).toBeGreaterThan(0);
  expect(observations).toEqual(observations.map(() => ({ node, mapping: geometry.mappings[0] })));
  expect(accept).toHaveBeenCalledTimes(1);
  expect(oldDispose).toHaveBeenCalledTimes(1);
  expect(dispose).not.toHaveBeenCalled();
  expect(onError).toHaveBeenCalledWith(failure);
  session.dispose();
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(oldDispose).toHaveBeenCalledTimes(1);
  controller.dispose();
});

it.each(['full', 'instant'])('retains the displayed frame if deriving a %s candidate throws', async (kind) => {
  const controller = await fixture();
  const oldDispose = jest.fn(),
    dispose = jest.fn(),
    accept = jest.fn(),
    onError = jest.fn();
  let extension: RenderExtension = { dispose: oldDispose };
  const session = new PanelRenderSession(controller, { presentation, extend: () => extension, onError });
  await session.build();
  const base = session.frame!;
  const layers = session.layers;
  const edge = controller.scene.render.edgeIndex.getEdge(0);
  const mapping = controller.stores.pointStore.renderIndex(edge);
  extension = { accept, dispose };
  const failure = Error('highlight derivation failed');
  const spy = jest.spyOn(GraphHighlighter.prototype, 'setGraph').mockImplementationOnce(() => {
    throw failure;
  });
  expect(await (kind === 'full' ? session.build() : session.instant((base) => ({ base, extension })))).toBe(
    kind === 'full' ? undefined : false
  );
  spy.mockRestore();
  expect(session.frame).toBe(base);
  expect(session.layers).toBe(layers);
  expect(controller.stores.pointStore.renderIndex(edge)).toBe(mapping);
  expect(accept).not.toHaveBeenCalled();
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(oldDispose).not.toHaveBeenCalled();
  expect(onError).toHaveBeenCalledWith(failure);
  session.dispose();
  expect(oldDispose).toHaveBeenCalledTimes(1);
  expect(dispose).toHaveBeenCalledTimes(1);
  controller.dispose();
});

it.each(['full', 'instant'])('releases a rejected %s resource once even if its disposer throws', async (kind) => {
  const controller = await fixture();
  const onError = jest.fn();
  const session = new PanelRenderSession(controller, { presentation, onError });
  await session.build();
  const base = session.frame!;
  const failure = Error('rejected resource failed');
  const dispose = jest.fn(() => {
    throw failure;
  });
  let request: Promise<unknown>;
  if (kind === 'full') {
    const pending = deferred<RenderExtension>();
    session.configure({ presentation, onError, extend: () => pending.promise });
    request = session.build();
    session.invalidate();
    pending.resolve({ dispose });
  } else {
    const pending = deferred<InstantRenderPatch>();
    request = session.instant(() => pending.promise);
    session.invalidate();
    pending.resolve({ base, extension: { dispose } });
  }
  await request;
  expect(session.frame).toBe(base);
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(onError).toHaveBeenCalledWith(failure);
  session.dispose();
  controller.dispose();
});

it('attempts every owned cleanup before reporting failures and remains safe to dispose again', async () => {
  const controller = await fixture();
  const failure = Error('subscription cleanup failed');
  const subscribe = controller.scene.subscribe.bind(controller.scene);
  const unsubscribe = jest.fn();
  jest.spyOn(controller.scene, 'subscribe').mockImplementation((listener) => {
    const stop = subscribe(listener);
    unsubscribe.mockImplementation(() => {
      stop();
      throw failure;
    });
    return unsubscribe;
  });
  const stops: jest.Mock[] = [];
  const reaction = mobx.reaction;
  const reactionSpy = jest.spyOn(mobx, 'reaction').mockImplementation((...args) => {
    const disposer = reaction(...args);
    const stop = Object.assign(jest.fn(disposer), disposer);
    stops.push(stop);
    return stop;
  });
  const dispose = jest.fn();
  const onError = jest.fn(() => {
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(stops).toHaveLength(2);
    stops.forEach((stop) => expect(stop).toHaveBeenCalledTimes(1));
    expect(dispose).toHaveBeenCalledTimes(1);
    throw Error('reporter failed');
  });
  const session = new PanelRenderSession(controller, { presentation, extend: () => ({ dispose }), onError });
  reactionSpy.mockRestore();
  await session.build();
  expect(() => session.dispose()).toThrow('reporter failed');
  expect(onError).toHaveBeenCalledWith(failure);
  session.dispose();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  stops.forEach((stop) => expect(stop).toHaveBeenCalledTimes(1));
  expect(dispose).toHaveBeenCalledTimes(1);
  expect(await session.build()).toBeUndefined();
  controller.dispose();
});

it('assembles instant contributions in core and owns their acceptance and rejection cleanup', async () => {
  const controller = await fixture();
  const secondary = new GeoJsonLayer({ id: 'secondary' });
  const session = new PanelRenderSession(controller, { presentation, secondary: () => [secondary] });
  await session.build();
  const node = new GeoJsonLayer({ id: 'edited-node' });
  const accept = jest.fn(),
    dispose = jest.fn();
  expect(
    await session.instant((base) => ({
      base,
      extension: { factories: { node: () => node }, accept, dispose },
    }))
  ).toBe(true);
  expect(session.frame!.bundle.nodes).toEqual([node]);
  expect(session.frame!.bundle.secondary).toEqual([secondary]);
  expect(accept).toHaveBeenCalledTimes(1);
  const rejected = deferred<import('./session').InstantRenderPatch>();
  const base = session.frame!;
  const pending = session.instant(() => rejected.promise);
  session.invalidate();
  const rejectDispose = jest.fn(),
    rejectAccept = jest.fn();
  rejected.resolve({ base, extension: { dispose: rejectDispose, accept: rejectAccept } });
  expect(await pending).toBe(false);
  expect(rejectDispose).toHaveBeenCalledTimes(1);
  expect(rejectAccept).not.toHaveBeenCalled();
  expect(session.frame).toBe(base);
  session.dispose();
  expect(dispose).toHaveBeenCalledTimes(1);
  controller.dispose();
});

it('shares immutable index tables until an edit replaces a table, including shifted numeric references', async () => {
  const controller = await fixture();
  const index = controller.scene.render.edgeIndex;
  const before = index.snapshot();
  const secondEdge = before.getEdge(1);
  const vertexBuffer = before.getRecordVertexView(0).buffer;
  expect(index.snapshot()).toBe(before);
  expect(index.getRecordVertexView(0).buffer).toBe(vertexBuffer);
  index.replaceUnitEdges(0, []);
  index.replaceRecordVertexRefs(0, [0, 2, 1]);
  index.setRecordMetrics(0, 500);
  expect(index.getEdge(0)).toBe(secondEdge);
  expect(before.getEdge(1)).toBe(secondEdge);
  expect(before.edgeCount).toBe(2);
  expect([...before.getRecordVertexView(0)]).toEqual([0, 1]);
  expect(before.getRecordMetrics(0).primary).not.toBe(500);
  expect(index.snapshot()).not.toBe(before);
  controller.dispose();
});

it('decodes retained picks with the displayed frame and rejects expired semantic identities', async () => {
  const controller = await fixture();
  const session = new PanelRenderSession(controller, { presentation });
  await session.build();
  const frame = session.frame!;
  const pick = { picked: true, index: 1, featureType: 'points', layer: frame.bundle.nodes![0] };
  expect(session.resolvePick(pick)).toEqual({ kind: 'node', id: 'node-1', namespaceId: 'external' });
  session.configure({ presentation, extend: () => new Promise(() => {}) });
  await controller.update(metricGraphInput(metricGraphSource('replaced', [100])));
  expect(session.frame).toBe(frame);
  expect(session.resolvePick(pick)).toBeUndefined();
  expect(
    await controller.patchMetrics([
      { row: frame.input.snapshot!.nodes[1].primaryRow, propertyKey: 'metric', value: 10 },
    ])
  ).toBeUndefined();
  session.dispose();
  controller.dispose();
});

it('supports multi-layer namespaces, repeated routes and rich symbols through the same host-free factories', async () => {
  const first = {
    ...metricGraphSource('rich', [0, 50, 100, 25]),
    nodeId: arrayColumn('id', ['A', 'A', 'B', 'C']),
    target: arrayColumn('target', ['["A","B","C"]', '["A","B","C"]', null, null]),
    edgeId: arrayColumn('edge', ['route', 'route', undefined, undefined]),
    sourceNamespace: arrayColumn('namespace', ['site.one', 'site.one', 'site.one', 'site.one']),
    targetNamespace: arrayColumn('namespace', ['site.one', 'site.one', 'site.one', 'site.one']),
  };
  const second = {
    ...metricGraphSource('rich', [25, 75]),
    index: 1,
    key: 'second',
    nodeId: arrayColumn('id', ['D', 'E']),
    target: arrayColumn('target', ['E', null]),
    sourceNamespace: arrayColumn('namespace', ['site.two', 'site.two']),
    targetNamespace: arrayColumn('namespace', ['site.two', 'site.two']),
  };
  const controller = await fixture({ layers: [...metricGraphInput(first).layers, ...metricGraphInput(second).layers] });
  controller.scene.update({
    features: controller.scene.render.features.map((feature, index) => ({
      ...feature,
      style: {
        ...feature.style,
        arcs: ['#ff0000', '#00ff00'],
        group: { ...feature.style?.group, iconName: 'router' },
        ...(index === 0
          ? { gauge: { displayText: '42%', colorMode: 'thresholds', stops: [{ color: '#00ff00', endFraction: 0.42 }] } }
          : {}),
      },
    })),
  });
  const input = captureRenderInput(controller, {
    ...presentation,
    pointType: 'circle+icon',
    placeholders: true,
    bounds: true,
    boundLabels: true,
    svgIconState: {
      revision: 1,
      signature: 'rich',
      icons: { router: { svgDataUrl: 'data:image/svg+xml,<svg/>', width: 16, height: 16 } },
    },
  });
  const beforeEdges = Array.from({ length: input.render.edgeIndex.edgeCount }, (_, ref) => ({
    ...input.render.edgeIndex.getEdge(ref).data,
  }));
  const prepared = prepareGraphRender(input, {
    boundaries: [
      { namespace: 'site.one', bounds: [0, 0, 30, 40] },
      { namespace: 'site.two', bounds: [40, 0, 60, 20] },
    ],
  });
  expect(prepared.collections.map((collection) => collection.graph.id)).toEqual(
    expect.arrayContaining(['site.one', 'site.two'])
  );
  expect(prepared.geometry.routed['site.one']).toHaveLength(4);
  expect(prepared.geometry.mappings.slice(0, 4).map((mapping) => mapping?.lineId)).toEqual([0, 1, 2, 3]);
  expect(prepared.geometry.mappings.slice(0, 4).map((mapping) => mapping?.arcId)).toEqual([0, 0, 0, 0]);
  expect(prepared.bounds.features[0].geometry.center).toEqual([15, 20]);
  const bundle = buildPrimaryLayers(input, prepared);
  const node = bundle.nodes!.find((layer) => layer.id === 'site.one-view')!;
  const atlas = (node.props as any)._subLayerProps['points-circle'].donutAtlas;
  expect(node.props.pointType).toContain('icon');
  expect(atlas.diagnostics.gaugeRecordCount).toBe(1);
  expect(atlas.diagnostics.segmentCount).toBeGreaterThan(1);
  const override = new GeoJsonLayer({ id: 'editable-substitute' });
  const custom = buildPrimaryLayers(input, prepared, {
    factories: { node: () => [override], edge: () => [], bounds: () => override },
  });
  expect(custom.nodes).toContain(override);
  expect(custom.edges!.every((layer) => layer.id.startsWith('edges-arrow-'))).toBe(true);
  const arcInput = { ...input, presentation: { ...input.presentation, isRouted: false } };
  expect(composeRenderLayers(buildPrimaryLayers(arcInput, prepared)).map((layer) => layer.id)).toContain(
    'edges-arc-basesite.one'
  );
  expect(
    Array.from({ length: input.render.edgeIndex.edgeCount }, (_, ref) => input.render.edgeIndex.getEdge(ref).data)
  ).toEqual(beforeEdges);
  controller.dispose();
});

it('reuses preparation for focus, selection and transients while keeping mode and resource presentation current', async () => {
  const controller = await fixture();
  const preparation = { edgeOffsetStrategies: [] };
  const session = new PanelRenderSession(controller, { presentation, preparation });
  await session.build();
  const frame = session.frame!;
  controller.stores.pointStore.focus({ kind: 'node', id: 'node-0', namespaceId: 'external' });
  session.setTransient([new GeoJsonLayer({ id: 'hull' })], ['hull']);
  expect(session.frame).toBe(frame);
  expect(session.layers.map((layer) => layer.id)).toContain('hull');
  controller.select({ id: 'node-0', namespaceId: 'external' });
  await session.build();
  expect(session.frame!.prepared.geometry).toBe(frame.prepared.geometry);
  expect(session.frame!.prepared.collections).toBe(frame.prepared.collections);
  controller.stores.pointStore.setMode('modify');
  await session.build();
  expect(session.layers[0].props.opacity).toBe(1);
  controller.scene.invalidatePresentation();
  await session.build();
  expect(session.frame!.prepared.geometry).toBe(frame.prepared.geometry);
  session.configure({ presentation: { ...presentation, isDark: true, resourceRevision: 1 }, preparation });
  await session.build();
  expect(session.frame!.prepared.geometry).toBe(frame.prepared.geometry);
  expect(session.frame!.prepared.collections).toBe(frame.prepared.collections);
  expect(session.frame!.input.presentation.isDark).toBe(true);
  session.configure({ presentation, preparation: { ...preparation } });
  await session.build();
  expect(session.frame!.prepared.geometry).not.toBe(frame.prepared.geometry);
  session.dispose();
  controller.dispose();
});

it('takes routing from scene visibility without a shell reconfiguration', async () => {
  const controller = await fixture();
  const visibility = controller.scene.visibility.snapshot();
  visibility.addLayer(colTypes.Routed, colTypes.Routed, colTypes.Routed, false, true, false, null, false);
  controller.scene.replaceVisibility(visibility);
  const session = new PanelRenderSession(controller, { presentation: { ...presentation, isRouted: undefined } });
  await session.build();
  expect(session.frame!.input.presentation.isRouted).toBe(true);
  const routed = controller.scene.visibility.getLayerTree().find((layer) => layer.name === colTypes.Routed)!;
  controller.scene.setVisibility(routed, false, 'none', []);
  await Promise.resolve();
  expect(session.frame!.input.presentation.isRouted).toBe(false);
  expect(session.layers.map((layer) => layer.id)).toContain('edges-arc-baseexternal');
  session.dispose();
  controller.dispose();
});

it('retries readiness independently and releases contributed resources while preserving secondary layers on empty', async () => {
  const first = await fixture(),
    second = await fixture();
  const secondary = new GeoJsonLayer({ id: 'geo-secondary' });
  const release = jest.fn();
  const ready = new PanelRenderSession(first, {
    presentation,
    secondary: () => [secondary],
    extend: () => ({ dispose: release }),
  });
  const waiting = new PanelRenderSession(second, { presentation, ready: false });
  await ready.build();
  await waiting.build();
  expect(waiting.frame).toBeUndefined();
  waiting.configure({ presentation, ready: true });
  await waiting.build();
  expect(waiting.frame).toBeDefined();
  const waitingFrame = waiting.frame;
  first.clear();
  expect(ready.layers.map((layer) => layer.id)).toEqual(['geo-secondary']);
  expect(waiting.frame).toBe(waitingFrame);
  expect(release).toHaveBeenCalledTimes(1);
  ready.dispose();
  waiting.dispose();
  first.dispose();
  second.dispose();
});

it('clears graph picks and retains valid secondary output when empty-scene secondary preparation fails', async () => {
  const controller = await fixture();
  const secondary = new GeoJsonLayer({ id: 'geo-secondary' });
  const onError = jest.fn();
  let fail = false;
  const session = new PanelRenderSession(controller, {
    presentation,
    secondary: () => {
      if (fail) {
        throw Error('secondary unavailable');
      }
      return [secondary];
    },
    onError,
  });
  await session.build();
  const feature = session.frame!.prepared.geometry.routed.external[0];
  fail = true;
  controller.clear();
  expect(session.layers).toEqual([secondary]);
  expect(session.resolvePick({ picked: true, object: feature })).toBeUndefined();
  expect(onError).toHaveBeenCalledWith(Error('secondary unavailable'));
  expect(session.error).toBe('secondary unavailable');
  session.dispose();
  controller.dispose();
});
