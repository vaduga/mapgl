import { Graph } from '../graph/main';
import { isVisible } from '../deckLayers/utils/visibility';
import { createVisibility } from '../store/visibility';
import { colTypes } from '../types';
import { GraphScene } from './GraphScene';

const markers = { name: 'nodes', type: colTypes.Markers };
const overlay = { name: 'overlay', type: colTypes.GeoJson };

function visibility(dataLayers = [markers, overlay], namespaces = ['root.rack'], isRouted = true) {
  const graph = new Graph('root');
  namespaces.forEach((name) => graph.addNode(new Graph(name)));
  return createVisibility({
    graph,
    groupCount: 2,
    isLogic: false,
    isRouted,
    dataLayers,
    derivedLayers: [{ label: 'clusters', name: 'clusters', group: 'clusters', visible: true }],
  });
}

it('keeps data, namespace and derived selections across refreshes and editor reordering', () => {
  const scene = new GraphScene();
  scene.replaceVisibility(visibility());
  const original = scene.visibility;
  for (const [name, group] of [
    ['overlay', colTypes.GeoJson],
    ['root.rack', 'root'],
    [colTypes.SVG, colTypes.SVG],
    ['clusters', 'clusters'],
    [colTypes.Routed, colTypes.Routed],
  ]) {
    original.setVisible(null, name, group, false);
  }
  original.setFold(original.getLayerTree().find((layer) => layer.name === 'graph')!.children[0].index, true);

  for (const dataLayers of [
    [markers, overlay],
    [overlay, markers],
    [markers, overlay],
  ]) {
    scene.replaceVisibility(visibility(dataLayers));
    for (const [name, group] of [
      ['overlay', colTypes.GeoJson],
      ['root.rack', 'root'],
      [colTypes.SVG, colTypes.SVG],
      ['clusters', 'clusters'],
      [colTypes.Routed, colTypes.Routed],
    ]) {
      expect(isVisible(scene.visibility, { index: null, name, group })).toBe(false);
    }
    expect(scene.visibility.getLayerTree().find((layer) => layer.name === 'graph')!.children[0].fold).toBe(true);
    expect(isVisible(scene.visibility, { index: null, name: 'nodes', group: colTypes.Markers })).toBe(true);
  }
  expect(scene.visibility).not.toBe(original);
});

it('initializes additions, drops removals and treats a changed layer type as a new layer', () => {
  const scene = new GraphScene();
  scene.replaceVisibility(visibility());
  scene.visibility.setVisible(null, 'overlay', colTypes.GeoJson, false);
  scene.visibility.setVisible(null, 'root.rack', 'root', false);
  scene.replaceVisibility(visibility([markers, { name: 'new', type: colTypes.GeoJson }], ['root.new']));
  expect(
    scene.visibility
      .getLayerTree()
      .find((layer) => layer.name === colTypes.GeoJson)!
      .children.map((l) => l.name)
  ).toEqual(['new']);
  expect(isVisible(scene.visibility, { index: null, name: 'new', group: colTypes.GeoJson })).toBe(true);
  expect(scene.visibility.getVisibleNamespaces()).not.toContain('root.rack');
  expect(scene.visibility.getVisibleNamespaces()).toContain('root.new');

  scene.replaceVisibility(visibility());
  expect(isVisible(scene.visibility, { index: null, name: 'overlay', group: colTypes.GeoJson })).toBe(true);
  expect(scene.visibility.getVisibleNamespaces()).toContain('root.rack');
  scene.visibility.setVisible(null, 'overlay', colTypes.GeoJson, false);
  scene.replaceVisibility(visibility([markers, { name: 'overlay', type: colTypes.Polygons }]));
  expect(isVisible(scene.visibility, { index: null, name: 'overlay', group: colTypes.Polygons })).toBe(true);
});

it('masks new children of a hidden parent before the switcher is opened and restores their own selections', () => {
  const scene = new GraphScene();
  scene.replaceVisibility(visibility());
  scene.visibility.setVisible(null, 'overlay', colTypes.GeoJson, false);
  scene.visibility.setVisible(null, colTypes.GeoJson, colTypes.GeoJson, false);
  scene.replaceVisibility(visibility([markers, overlay, { name: 'new', type: colTypes.GeoJson }]));
  expect(scene.visibility.getVisState(null, 'new', colTypes.GeoJson)).toEqual([true, true]);
  expect(isVisible(scene.visibility, { index: null, name: 'new', group: colTypes.GeoJson })).toBe(false);
  scene.visibility.setVisible(null, colTypes.GeoJson, colTypes.GeoJson, true);
  expect(isVisible(scene.visibility, { index: null, name: 'new', group: colTypes.GeoJson })).toBe(true);
  expect(isVisible(scene.visibility, { index: null, name: 'overlay', group: colTypes.GeoJson })).toBe(false);
});

it('retains overlay choices when the graph is cleared and keeps choices local to the panel', () => {
  const scene = new GraphScene();
  scene.replaceVisibility(visibility());
  scene.visibility.setVisible(null, 'overlay', colTypes.GeoJson, false);
  scene.clear();
  scene.replaceVisibility(visibility([overlay]));
  expect(isVisible(scene.visibility, { index: null, name: 'overlay', group: colTypes.GeoJson })).toBe(false);
  expect(scene.visibility.getLayerTree().map((layer) => layer.name)).toEqual([colTypes.GeoJson]);

  const freshPanel = new GraphScene();
  freshPanel.replaceVisibility(visibility([overlay]));
  expect(isVisible(freshPanel.visibility, { index: null, name: 'overlay', group: colTypes.GeoJson })).toBe(true);
});
