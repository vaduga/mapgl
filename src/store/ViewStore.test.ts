import { Graph } from '@mapgl/panel-core/graph';
import { VisLayers } from '@mapgl/panel-core/store';
import { isComputedProp } from 'mobx';

import ViewStore from './ViewStore';

function createVisLayers() {
  const visLayers = new VisLayers();
  visLayers.setActiveGroups(new Uint8Array([1]));
  return visLayers;
}

describe('ViewStore', () => {
  it('recomputes group legend items after root graph state is replaced', () => {
    class TestRoot {
      visLayers = createVisLayers();
      options = { dataLayers: [{ name: 'nodes', type: 'markers' }] };
      panel = {
        graph: new Graph('graph'),
        groups: [{ color: 'red', label: 'Before', groupIdx: 0 }],
        hasAnnots: false,
      };
    }
    const root = new TestRoot() as any;
    const store = new ViewStore(root, {} as any);

    expect(isComputedProp(store, 'getGroupsLegend')).toBe(false);
    expect(store.getGroupsLegend.map(({ label }) => label)).toEqual(['Before']);

    store.root.visLayers = createVisLayers();
    store.root.panel.graph = new Graph('graph');
    store.root.panel.groups = [{ color: 'blue', label: 'After', groupIdx: 0 }];

    expect(store.getGroupsLegend.map(({ label }) => label)).toEqual(['After']);
  });
});
