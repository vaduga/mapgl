import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Graph } from '../../graph/main';
import { VisLayers } from '../../store/VisLayers';
import { GraphScene } from '../../runtime/index';
import type { NamespaceProjectionStrategy } from '../../extension-points/contracts';
import LayerSwitcher, { type LayerSwitcherBindings } from './LayerSwitcher';

jest.mock('@deck.gl/widgets', () => ({
  _Tooltip: ({ children }: { children: unknown }) => children,
}));

function panel() {
  const strategies: NamespaceProjectionStrategy[] = [];
  const scene = new GraphScene();
  const graph = new Graph('external');
  graph.addNode(new Graph('rack'));
  const visLayers = new VisLayers();
  visLayers.addLayer('rack', 'rack', 'graph', false, true, false, null, null);
  scene.update({ graph, positions: new Float64Array([10, 20, 70, 80]) });
  scene.replaceVisibility(visLayers);
  const owner: LayerSwitcherBindings = {
    visibility: scene.visibility,
    readComments: () => scene.render.commentFeatures,
    setVisibility: (...args) => scene.setVisibility(...args, strategies),
  };
  return { ...owner, scene, strategies };
}

it('accepts contracted and expanded positions before requesting edge rerouting and rendering', () => {
  const owner = panel();
  const expanded = owner.scene.render.positions!;
  const contracted = new Float64Array([10, 20, 50, 60]);
  owner.strategies.push({
    id: 'pure-projection',
    project: ({ visibleNamespaces }) => ({
      positions: visibleNamespaces.has('rack') ? expanded : contracted,
      contractsHiddenNamespaces: true,
      rendererFiltering: 'none',
    }),
  });
  const refresh = jest.fn(() => owner.scene.render.positions);
  render(<LayerSwitcher label="layers" bindings={owner} setVisRefresh={refresh} />);
  fireEvent.click(screen.getByRole('button', { name: 'layers' }));

  fireEvent.click(screen.getByRole('checkbox', { name: 'rack' }));
  expect(screen.getByRole('checkbox', { name: 'rack' })).not.toBeChecked();
  expect(owner.scene.render.positions).toBe(contracted);
  expect(refresh.mock.results[0].value).toBe(contracted);

  fireEvent.click(screen.getByRole('checkbox', { name: 'rack' }));
  expect(screen.getByRole('checkbox', { name: 'rack' })).toBeChecked();
  expect(owner.scene.render.positions).toBe(expanded);
  expect(refresh.mock.results[1].value).toBe(expanded);
});

it('retains positions when the namespace strategy only changes renderer filtering', () => {
  const owner = panel();
  const positions = owner.scene.render.positions;
  render(<LayerSwitcher label="layers" bindings={owner} setVisRefresh={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'layers' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'rack' }));
  expect(owner.scene.render.positions).toBe(positions);
});

it('keeps selections when refreshes and editor changes replace the tree with the switcher closed or open', () => {
  const owner = panel();
  const bindings = () => ({ ...owner, visibility: owner.scene.visibility });
  const refresh = jest.fn();
  const { rerender } = render(<LayerSwitcher label="layers" bindings={bindings()} setVisRefresh={refresh} />);
  fireEvent.click(screen.getByRole('button', { name: 'layers' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'rack' }));
  fireEvent.click(screen.getByRole('button', { name: 'layers' }));

  const replaceTree = () => {
    const next = new VisLayers();
    next.addLayer('new', 'new', 'geojson', false, true, false, null, null);
    next.addLayer('rack', 'rack', 'graph', false, true, false, null, null);
    owner.scene.replaceVisibility(next);
    rerender(<LayerSwitcher label="layers" bindings={bindings()} setVisRefresh={refresh} />);
  };
  replaceTree();
  expect(owner.scene.visibility.getVisibleNamespaces()).not.toContain('rack');
  fireEvent.click(screen.getByRole('button', { name: 'layers' }));
  expect(screen.getByRole('checkbox', { name: 'rack' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'new' })).toBeChecked();
  replaceTree();
  expect(screen.getByRole('checkbox', { name: 'rack' })).not.toBeChecked();
  fireEvent.click(screen.getByRole('checkbox', { name: 'rack' }));
  replaceTree();
  expect(screen.getByRole('checkbox', { name: 'rack' })).toBeChecked();
});
