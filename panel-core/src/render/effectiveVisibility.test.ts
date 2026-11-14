import { PanelController } from '../runtime/PanelController';
import { createVisibility } from '../store';
import { arrayColumn } from '../data';
import { metricGraphInput, metricGraphSource } from '../../examples/neutral';
import { PanelRenderSession } from './session';
import { captureEffectiveVisibility } from './effectiveVisibility';
import { captureRenderInput, prepareGraphRender } from './graph';

async function fixture(multi = false) {
  const controller = new PanelController();
  const a = {
    ...metricGraphSource('a', [1, 2]),
    nodeId: arrayColumn('id', ['A', 'C']),
    target: arrayColumn('target', [multi ? '["A","B","C"]' : 'B', null]),
    sourceNamespace: arrayColumn('ns', ['shop', 'shop']),
    targetNamespace: arrayColumn('nsB', [multi ? 'shop' : 'data', 'shop']),
    routeNamespaces: multi ? arrayColumn('pathNs', [['shop', 'data', 'shop'], undefined]) : undefined,
  };
  const b = {
    ...metricGraphSource('b', [1, 2]),
    index: 1,
    key: 'second',
    nodeId: arrayColumn('id', ['B', 'D']),
    target: arrayColumn('target', [null, null]),
    sourceNamespace: arrayColumn('ns', ['data', 'data']),
  };
  const first = metricGraphInput(a),
    second = metricGraphInput(b);
  await controller.update({
    layers: [
      { ...first.layers[0], layerIndex: 0 },
      { ...second.layers[0], layerIndex: 1 },
    ],
  });
  expect(controller.scene.render.features).toHaveLength(4);
  const features = controller.scene.render.features.map((feature, index) => ({
    ...feature,
    layerName: index < 2 ? 'layer-A' : 'layer-B',
    style: { ...feature.style, group: { ...feature.style.group, groupIdx: index < 2 ? 0 : 1 } },
  }));
  const annotations = controller.scene.render.annotations.slice();
  annotations[2 * 4 + 3] = 254;
  controller.scene.update({ features, annotations });
  controller.scene.replaceVisibility(
    createVisibility({
      graph: controller.scene.render.graph,
      groupCount: 2,
      isLogic: true,
      isRouted: true,
      dataLayers: ['layer-A', 'layer-B'].map((name) => ({ name, type: 'markers' })),
    })
  );
  return controller;
}
const presentation = { isLogic: true, isRouted: true, graphVisibilityName: null };
function hide(controller: PanelController, name: string, visible: boolean) {
  const find = (tree: any[]): any =>
    tree.find((layer) => layer.name === name) ?? tree.map((layer) => find(layer.children)).find(Boolean);
  controller.scene.setVisibility(find(controller.scene.visibility.getLayerTree()), visible, 'children', []);
}

it('partitions nodes by owner, resolves local picks canonically and retains independent buffers on layer toggles', async () => {
  const controller = await fixture();
  const session = new PanelRenderSession(controller, { presentation });
  await session.build();
  const base = session.frame!;
  expect(base.bundle.nodes!.map((layer) => layer.id)).toEqual(['graph-nodes-view-layer-A', 'graph-nodes-view-layer-B']);
  expect(base.prepared.collections.map((collection) => [...collection.nodeRefs!])).toEqual([
    [0, 1],
    [2, 3],
  ]);
  expect(
    session.resolvePick({ picked: true, featureType: 'points', index: 0, layer: base.bundle.nodes![1] })
  ).toMatchObject({ id: 'B', namespaceId: 'data' });
  const positions = base.prepared.collections.map((collection) => collection.points.positions.value);
  const edges = base.bundle.edges![0].props.data;
  hide(controller, 'layer-A', false);
  await session.build();
  expect(session.frame!.bundle.nodes!.map((layer) => layer.props.visible)).toEqual([false, true]);
  expect(session.frame!.prepared.geometry).toBe(base.prepared.geometry);
  expect(session.frame!.prepared.collections.map((collection) => collection.points.positions.value)).toEqual(positions);
  expect(session.frame!.bundle.edges![0].props.data).toBe(edges);
  expect(session.frame!.prepared.positionState).toBeUndefined();
  hide(controller, 'layer-A', true);
  await session.build();
  expect(session.frame!.bundle.nodes!.map((layer) => layer.props.visible)).toEqual([true, true]);
  session.dispose();
  controller.dispose();
});

it('requires both endpoints and keeps annotation overlay visibility independent from group filtering', async () => {
  const controller = await fixture();
  const input = () => captureRenderInput(controller, presentation);
  const geometry = prepareGraphRender(input()).geometry;
  const feature = Object.values(geometry.routed).flat()[0];
  const visible = () => captureEffectiveVisibility(input()).edge(feature);
  expect(visible()).toBe(true);
  for (const layer of ['layer-A', 'layer-B', 'shop', 'data']) {
    hide(controller, layer, false);
    expect(visible()).toBe(false);
    hide(controller, layer, true);
    expect(visible()).toBe(true);
  }
  controller.scene.toggleGroup(0);
  expect(visible()).toBe(false);
  const firstGroup = captureEffectiveVisibility(input());
  controller.scene.toggleGroup(1);
  expect(visible()).toBe(true);
  expect(captureEffectiveVisibility(input()).groupTrigger).toBe(firstGroup.groupTrigger);
  expect(captureEffectiveVisibility(input()).groupCategories).toEqual([0, 1]);
  controller.scene.toggleGroup(0);
  expect(visible()).toBe(false);
  controller.scene.toggleGroup(1);
  expect(visible()).toBe(true);
  controller.scene.toggleAnnotations();
  expect(controller.scene.visibility.annotationsVisible).toBe(false);
  expect(controller.scene.visibility.selectedGroups.size).toBe(0);
  expect(visible()).toBe(true);
  controller.scene.toggleGroup(0);
  expect(visible()).toBe(false);
  controller.scene.toggleAnnotations();
  expect(controller.scene.visibility.annotationsVisible).toBe(true);
  expect(controller.scene.visibility.selectedGroups).toEqual(new Set([0]));
  expect(visible()).toBe(false);
  controller.scene.toggleGroup(0);
  expect(visible()).toBe(true);
  hide(controller, 'layer-B', false);
  expect(visible()).toBe(false);
  controller.dispose();
});



it('filters hop fragments by their own endpoints without adding intermediate-node conditions to whole-edge arcs', async () => {
  const controller = await fixture(true);
  const input = () => captureRenderInput(controller, presentation);
  const prepared = prepareGraphRender(input());
  const hops = Object.values(prepared.geometry.routed).flat();
  const arc = Object.values(prepared.geometry.arcs).flat()[0];
  expect(hops).toHaveLength(2);
  controller.scene.toggleGroup(0);
  const visibility = captureEffectiveVisibility(input());
  expect(hops.map(visibility.edge)).toEqual([false, false]);
  expect(visibility.edge(arc)).toBe(true);
  controller.dispose();
});
