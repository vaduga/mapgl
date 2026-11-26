import { PanelController } from '../runtime/PanelController';
import { createVisibility } from '../store';
import { arrayColumn } from '../data';
import { metricGraphInput, metricGraphSource } from '../../examples/neutral';
import { PanelRenderSession } from './session';
import { captureEffectiveVisibility } from './effectiveVisibility';
import { buildPrimaryLayers, captureRenderInput, prepareGraphRender } from './graph';

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
  for (const layer of ['layer-A', 'layer-B']) {
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
  controller.dispose();
});

it('filters every fragment and arc by logical endpoints, independently of intermediate node visibility', async () => {
  const controller = await fixture(true);
  const input = () => captureRenderInput(controller, presentation);
  const prepared = prepareGraphRender(input());
  const hops = Object.values(prepared.geometry.routed).flat();
  const arc = Object.values(prepared.geometry.arcs).flat()[0];
  expect(hops).toHaveLength(2);
  controller.scene.toggleGroup(0);
  const visibleEdges = () => [...hops, arc].map(captureEffectiveVisibility(input()).edge);
  expect(visibleEdges()).toEqual([true, true, true]);

  // Both logical endpoints are in shop. Only the intermediate node is in data.
  hide(controller, 'data', false);
  expect(visibleEdges()).toEqual([true, true, true]);
  hide(controller, 'shop', false);
  expect(visibleEdges()).toEqual([false, false, false]);
  hide(controller, 'shop', true);
  expect(visibleEdges()).toEqual([true, true, true]);
  controller.dispose();
});

it('filters nodes and logical edges by independent endpoint tags without moving geometry', async () => {
  const controller = await fixture(true);
  const scene = controller.scene;
  const features = scene.render.features.map((feature, index) => ({
    ...feature,
    tags: [[['source']], [[], ['target']], [['intermediate']]][index],
  }));
  scene.update({ features });
  const input = () => captureRenderInput(controller, presentation);
  const positions = scene.render.positions;
  const prepared = prepareGraphRender(input());
  const hops = Object.values(prepared.geometry.routed).flat();
  const arc = Object.values(prepared.geometry.arcs).flat()[0];
  const visible = () => captureEffectiveVisibility(input());
  expect(scene.visibility.getTagLegendRows(features).get(0)?.get(1)).toEqual(new Set(['target']));
  expect(visible().edge(arc)).toBe(true);

  scene.toggleTag(0, 'source');
  expect(features.map(visible().node)).toEqual([true, false, true, true]);
  expect(hops.map(visible().edge)).toEqual([false, false]);
  expect(visible().edge(arc)).toBe(false);

  const routedLayers = buildPrimaryLayers(input(), prepared);
  const nodeLayer = routedLayers.nodes![0];
  expect(nodeLayer.props.filterCategories).toEqual([[0, 1], [1]]);
  expect(nodeLayer.props.getFilterCategory({ properties: features[0] })).toEqual([0, 1]);
  expect(nodeLayer.props.getFilterCategory({ properties: features[1] })).toEqual([0, 0]);
  expect(routedLayers.edges![0].props.getFilterCategory(hops[0])).toBe(0);
  const arcInput = captureRenderInput(controller, { ...presentation, isRouted: false });
  const arcLayers = buildPrimaryLayers(arcInput, prepareGraphRender(arcInput));
  expect(arcLayers.edges![0].props.getFilterCategory(arc)).toBe(0);

  scene.toggleTag(0, 'target', 1);
  expect(hops.map(visible().edge)).toEqual([false, false]);
  expect(visible().edge(arc)).toBe(false);
  const matchingFeatures = features.map((feature, index) =>
    index < 2 ? { ...feature, tags: [['source'], ['target']] } : feature
  );
  scene.update({ features: matchingFeatures });
  expect(hops.map(visible().edge)).toEqual([true, true]);
  expect(visible().edge(arc)).toBe(true);
  expect(scene.render.positions).toBe(positions);

  scene.update({ features: features.map((feature, index) => index === 1 ? { ...feature, tags: undefined } : feature) });
  expect(scene.visibility.selectedTags.get(0)?.get(0)).toEqual(new Set(['source']));
  expect(visible().edge(arc)).toBe(true);

  scene.toggleGroup(1);
  expect(visible().edge(arc)).toBe(false);
  scene.toggleTag(0, 'source');
  expect(visible().tag(features[2])).toBe(true);
  expect(scene.visibility.selectedGroups).toEqual(new Set([1]));
  controller.dispose();
});

it('applies selected tags only while an active node group supplies them', async () => {
  const controller = await fixture();
  const scene = controller.scene;
  const features = scene.render.features.map((feature, index) => ({
    ...feature,
    tags: [['first'], ['shared'], ['second'], ['shared']][index],
  }));
  scene.update({ features });
  scene.toggleTag(1, 'second');
  scene.toggleGroup(0);

  const visible = () => captureEffectiveVisibility(captureRenderInput(controller, presentation));
  expect(features.map(visible().node)).toEqual([true, true, false, false]);
  scene.toggleTag(1, 'second');
  expect(scene.visibility.selectedTags.get(1)?.get(0)).toEqual(new Set(['second']));

  scene.toggleGroup(1);
  expect(features.map(visible().node)).toEqual([true, true, true, false]);
  expect(scene.visibility.getTagLegendRows(features).get('shared')?.get(0)).toEqual(new Set(['shared']));
  scene.toggleTag('shared', 'shared');
  expect(features.map(visible().node)).toEqual([false, true, true, true]);
  scene.resetTags(1);
  expect(features.map(visible().node)).toEqual([false, true, false, true]);
  const regrouped = features.map((feature, index) =>
    index === 0 ? { ...feature, style: { ...feature.style, group: { groupIdx: 2 } } } : feature
  );
  scene.update({ features: regrouped });
  scene.toggleGroup(2);
  scene.toggleGroup(0);
  scene.toggleGroup(1);
  expect(scene.visibility.getTagLegendRows(regrouped, true).has('shared')).toBe(false);
  expect(regrouped.map(visible().node)).toEqual([true, false, false, false]);
  scene.toggleGroup(0);
  expect(scene.visibility.getTagLegendRows(regrouped, true).get('shared')?.get(0)).toEqual(new Set(['shared']));
  expect(regrouped.map(visible().node)).toEqual([false, true, false, false]);
  controller.dispose();
});
