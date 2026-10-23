import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PanelController } from '../../runtime/PanelController';
import { metricGraphInput, metricGraphSource } from '../../../examples/neutral';
import { arrayColumn, type GraphSource } from '../../data/sources';
import type { Graph } from '../../graph/main';
import { GraphHighlighter } from '../../deckLayers/GraphHighlighter';
import { getMapglFeatureServices } from '../../extension-points/featureServices';
import {
  GraphTooltip,
  TooltipPropertyTable,
  tooltipProperties,
  inspectGraphTooltip,
  rebindGraphTooltip,
  graphTooltipSections,
} from './GraphTooltip';

let controller: PanelController;
beforeEach(() => {
  controller = new PanelController();
});
afterEach(() => {
  cleanup();
  controller.dispose();
});
const currentScene = () => ({ snapshot: controller.state!.snapshot, render: controller.scene.render });

it('renders chosen plain values and host links as text in the supplied order', () => {
  const activate = jest.fn();
  const { container } = render(
    <TooltipPropertyTable
      properties={tooltipProperties([
        ['zero', 0],
        ['false', false],
        ['null', null],
        ['list', [1, 2]],
        ['object', { a: 3 }],
        ['text', '<img src=x onerror=bad()>'],
      ])}
      links={[{ key: 'native', label: 'Native action', href: '#details', onClick: activate }]}
    />
  );
  expect([...container.querySelectorAll('th')].map((element) => element.textContent)).toEqual([
    'zero',
    'false',
    'null',
    'list',
    'object',
    'text',
    'Link',
  ]);
  for (const value of ['0', 'false', 'null', '[1,2]', '{"a":3}', '<img src=x onerror=bad()>']) {
    expect(screen.getByText(value, { selector: 'td' })).toBeInTheDocument();
  }
  expect(container.querySelector('img')).toBeNull();
  fireEvent.click(screen.getByRole('link', { name: 'Native action' }));
  expect(activate).toHaveBeenCalledTimes(1);
});

it('selects adjacency, previews another object, restores the pin and clears it', async () => {
  await controller.update(metricGraphInput(metricGraphSource('first', [1, 2, 3])));
  const feature = controller.scene.render.features[1];
  const info = { x: 20, y: 30, index: 1, picked: true, object: { properties: feature } };
  const node = inspectGraphTooltip(currentScene(), info)!.target;
  controller.selectElement({ kind: 'node', id: node.id, namespaceId: node.namespaceId });
  const store = controller.stores.pointStore;
  store.setTooltipObject({ ...info });
  const notifications = jest.fn();
  controller.subscribe(notifications);
  const selected = jest.fn();
  const { rerender } = render(
    <GraphTooltip
      controller={controller}
      info={info}
      getContent={() => ({ properties: tooltipProperties([['metric', 1]]) })}
      onSelect={selected}
    />
  );
  expect(screen.getByRole('dialog', { name: 'node-1' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'incoming' }));
  expect(store.isDefDir).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'outgoing edges count' }));
  expect(store.isDefDir).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'incoming' }));
  expect(store.isDefDir).toBe(false);
  const connection = document.querySelector<HTMLButtonElement>('.mapgl-tooltip-connection')!;
  // Adjacency stays a single ID row; fragment endpoints belong in inspection data.
  expect(connection.textContent).toBe(connection.dataset.tooltipConnection);
  fireEvent.mouseEnter(connection);
  expect(controller.stores.pointStore.getHasFocusHighlight).toBe(true);
  fireEvent.click(connection);
  expect(store.getSelectedNode?.id).toBe(node.id);
  expect(store.getSelEdges).toEqual([controller.scene.render.edgeIndex.getEdge(0)]);
  expect(notifications).not.toHaveBeenCalled();
  expect(selected).toHaveBeenCalledWith(
    expect.objectContaining({ interaction: expect.objectContaining({ kind: 'edge' }) })
  );
  expect(document.querySelectorAll('.mapgl-tooltip-connection')).toHaveLength(1);
  expect(document.querySelector('[data-selected="true"] .mapgl-tooltip-connection')).not.toBeNull();
  expect(screen.getByRole('dialog', { name: 'node-1' })).toBeInTheDocument();
  const pin = controller.stores.pointStore.graphTooltip;
  const content = () => ({});
  rerender(
    <GraphTooltip
      controller={controller}
      info={{ x: 200, y: 100, picked: true, index: 2, object: { properties: controller.scene.render.features[2] } }}
      getContent={content}
    />
  );
  expect(screen.getByRole('tooltip', { name: 'node-2' })).toBeInTheDocument();
  expect(controller.stores.pointStore.graphTooltip).toEqual(pin);
  rerender(<GraphTooltip controller={controller} info={{ picked: false, index: -1 }} getContent={content} />);
  expect(screen.getByRole('dialog', { name: 'node-1' })).toBeInTheDocument();
  expect(controller.stores.pointStore.graphTooltip?.anchor).toEqual({ x: 20, y: 30 });
  expect(document.querySelector('[data-selected="true"]')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'close' }));
  expect(controller.stores.pointStore.graphTooltip).toBeUndefined();
  expect(screen.queryByTestId('graph-tooltip')).not.toBeInTheDocument();
});

it('keeps the canvas-picked edge at the top while an adjacent edge supplies the details', async () => {
  await controller.update(metricGraphInput(metricGraphSource('first', [1, 2, 3, 4])));
  const index = controller.scene.render.edgeIndex;
  const original = index.getEdge(0);
  const adjacent = index.getEdge(1);
  const reverse = index.getEdge(2);
  const store = controller.stores.pointStore;
  controller.selectElement({ kind: 'edge', id: original.id, namespaceId: (original.source.parent as Graph).id });
  store.setIsDefDir(false);
  expect(controller.stores.pointStore.getSelectedNode?.id).toBe(original.source.id);
  const action = jest.fn();
  const label = (edge: typeof original) => String(edge.data?.edgeId ?? edge.id);
  render(
    <GraphTooltip
      controller={controller}
      info={{ x: 20, y: 30, mapglPinned: true, object: { edgeRef: 0, edgeId: original.id } }}
      getContent={(inspection) => ({ properties: tooltipProperties([['inspected', inspection.target.id]]) })}
      renderActions={() => <button onClick={action}>Inspect details</button>}
      featureServices={{
        tooltipEdgeSections: [
          {
            id: 'test.extra',
            getSections: () => [
              {
                id: 'extra',
                incomingLabel: 'trespassing edges >',
                outgoingLabel: 'trespassing edges <',
                incoming: [{ id: reverse.id, edge: reverse, source: reverse.source, target: reverse.target }],
                outgoing: [{ id: adjacent.id, edge: adjacent, source: adjacent.source, target: adjacent.target }],
              },
            ],
          },
        ],
      }}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'trespassing edges <' }));
  expect(store.isDefDir).toBe(false);
  const rows = () => [...document.querySelectorAll<HTMLButtonElement>('[data-tooltip-connection]')];
  expect(rows().map((row) => row.dataset.tooltipConnection)).toEqual([label(original), label(adjacent)]);
  fireEvent.click(rows()[1]);
  expect(controller.stores.pointStore.getSelectedNode?.id).toBe(original.source.id);
  expect(controller.stores.pointStore.getSelEdges).toEqual([adjacent]);
  expect(rows().map((row) => row.dataset.tooltipConnection)).toEqual([label(original), label(adjacent)]);
  expect(document.querySelector('[data-field="inspected"] td')).toHaveTextContent(label(adjacent));
  expect(rows()[0].closest('li')).not.toHaveAttribute('data-selected');
  expect(rows()[1].closest('li')).toHaveAttribute('data-selected', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Inspect details' }));
  expect(action).toHaveBeenCalledTimes(1);
  act(() => store.setIsDefDir(true));
  expect(rows().map((row) => row.dataset.tooltipConnection)).toEqual([label(original), label(adjacent)]);
  fireEvent.click(screen.getByRole('button', { name: 'trespassing edges > edges count' }));
  expect(store.isDefDir).toBe(true);
  expect(rows().map((row) => row.dataset.tooltipConnection)).toEqual([label(original), label(reverse)]);
  fireEvent.click(screen.getByRole('button', { name: 'trespassing edges >' }));
  expect(rows().map((row) => row.dataset.tooltipConnection)).toEqual([label(original)]);
  act(() => {
    controller.selectElement({ kind: 'edge', id: adjacent.id, namespaceId: (adjacent.source.parent as Graph).id });
  });
  expect(controller.stores.pointStore.getSelectedNode?.id).toBe(adjacent.source.id);
});

it('decodes binary gauge hover picks even when Deck supplies no object', async () => {
  await controller.update(metricGraphInput(metricGraphSource('first', [1, 2])));
  const inspection = inspectGraphTooltip(
    { snapshot: controller.state!.snapshot, render: controller.scene.render },
    {
      picked: true,
      index: 0,
      viewport: { id: '3d-scene' },
      sourceLayer: { props: { data: { points: { featureIds: { value: Uint16Array.of(1) } } } } },
    }
  );
  expect(inspection?.target).toMatchObject({ kind: 'node', id: 'node-1' });
  expect(inspection?.interaction?.row.rowIndex).toBe(1);
});

it('preserves route-unit rows, namespaces and parallel identities without storing numeric refs', async () => {
  const base = metricGraphSource('routes', [1, 2, 3, 4, 5, 6]);
  const source: GraphSource = {
    ...base,
    nodeId: arrayColumn('id', ['A', 'B', 'C', 'A', 'A', 'A']),
    sourceNamespace: arrayColumn('ns', ['One', 'Two', 'One', 'Other', 'One', 'One']),
    targetNamespace: arrayColumn('targetNs', [null, null, null, null, 'One', 'One']),
    target: arrayColumn('path', [null, null, null, null, ['A', 'B', 'C'], ['A', 'C']]),
    edgeId: arrayColumn('route', [null, null, null, null, 'route-1', 'route-2']),
    routeNamespaces: arrayColumn('routeNs', [
      undefined,
      undefined,
      undefined,
      undefined,
      ['One', 'Two', 'One'],
      ['One', 'One'],
    ]),
  };
  await controller.update(metricGraphInput(source));
  const scene = { snapshot: controller.state!.snapshot, render: controller.scene.render, isRouted: true };
  const hop = inspectGraphTooltip(scene, { object: { edgeRef: 1, edgeId: 'route-1--1' } })!;
  expect(hop.target.namespaceId).toBe('Two');
  expect(hop.interaction?.row.rowIndex).toBe(4);
  expect(hop.target.hop?.ordinal).toBe(1);
  expect(hop.target).not.toHaveProperty('edgeRef');
  expect(rebindGraphTooltip(scene, hop.target)?.edgeRef).toBe(1);
  const whole = rebindGraphTooltip({ ...scene, isRouted: false }, hop.target)!;
  expect(whole.target.hop).toBeUndefined();
  expect(whole.interaction?.kind === 'edge' && whole.interaction.unitRow).toBeUndefined();
  const node = scene.snapshot!.nodes.find((node) => node.id === 'A' && node.namespaceId === 'One')!;
  const inspection = inspectGraphTooltip(scene, { object: { properties: { graphFrame: { key: node.key } } } })!;
  const sections = graphTooltipSections(
    scene,
    inspection,
    new GraphHighlighter(),
    getMapglFeatureServices().tooltipEdgeSections
  );
  expect(sections[0].outgoing).toHaveLength(2);
  const other = scene.snapshot!.nodes.find((node) => node.id === 'A' && node.namespaceId === 'Other')!;
  const otherInspection = inspectGraphTooltip(scene, { object: { properties: { graphFrame: { key: other.key } } } })!;
  expect(
    graphTooltipSections(scene, otherInspection, new GraphHighlighter(), getMapglFeatureServices().tooltipEdgeSections)
  ).toEqual([]);
});

it('rebinds refreshed pins, rejects stale/removed identities and unsubscribes on unmount', async () => {
  await controller.update(metricGraphInput(metricGraphSource('first', [1, 2])));
  const oldScene = currentScene();
  const pick = { x: 1, y: 1, mapglPinned: true, object: { properties: oldScene.render.features[0] } };
  const old = inspectGraphTooltip(oldScene, pick)!;
  const getContent = jest.fn((inspection) => ({
    properties: tooltipProperties([['revision', inspection.interaction.row.revision]]),
  }));
  const { unmount } = render(<GraphTooltip controller={controller} info={pick} getContent={getContent} />);
  await act(async () => {
    await controller.update(metricGraphInput(metricGraphSource('second', [3, 4])));
  });
  expect(screen.getByText('second')).toBeInTheDocument();
  expect(inspectGraphTooltip(currentScene(), { ...pick, graphInteraction: old.interaction })).toBeUndefined();
  await act(async () => {
    await controller.update(metricGraphInput(metricGraphSource('empty', [])));
  });
  expect(rebindGraphTooltip(currentScene(), old.target)).toBeUndefined();
  expect(screen.queryByTestId('graph-tooltip')).not.toBeInTheDocument();
  expect(controller.stores.pointStore.graphTooltip).toBeUndefined();
  unmount();
  getContent.mockClear();
  await controller.update(metricGraphInput(metricGraphSource('third', [5, 6])));
  expect(getContent).not.toHaveBeenCalled();
});
