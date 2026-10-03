import { Graph } from '../graph/main';
import { colTypes } from '../types';
import { createVisibility } from './visibility';
import { createGroupLegend } from './legend';

it('builds graph namespaces, resolved routing and feature contributions without variable expansion', () => {
  const graph = new Graph('root');
  graph.addNode(new Graph('root.rack'));
  const visibility = createVisibility({
    graph,
    groupCount: 3,
    isLogic: true,
    isRouted: false,
    dataLayers: [
      { name: 'data', type: colTypes.Markers },
      { name: 'overlay', type: colTypes.GeoJson },
    ],
    derivedLayers: [{ label: 'clusters', name: 'clusters', group: 'clusters', visible: true }],
  });
  expect(visibility.getVisibleNamespaces()).toContain('root.rack');
  expect(visibility.getVisState(null, colTypes.Routed, colTypes.Routed)?.[0]).toBe(false);
  expect([...visibility.getActiveGroups()]).toEqual([1, 1, 1]);
  visibility.setActiveGroups(new Uint8Array([1, 0, 1]));
  expect(
    createGroupLegend(graph, [{ color: 'red', label: 'hot', groupIdx: 1 }] as any, visibility.getActiveGroups())
  ).toEqual([{ color: 'red', label: 'hot', disabled: true, data: { rawLabel: 'hot', groupIdx: 1, hasNodes: false } }]);
});
