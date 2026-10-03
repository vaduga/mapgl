import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { observer } from 'mobx-react-lite';
import { PanelController, GraphScene } from '@vaduga/mapgl-core/runtime';
import { RootStoreProvider, useRootStore } from '@vaduga/mapgl-core/store';
import { metricGraphInput, metricGraphSource } from '../../../panel-core/examples/neutral';
import { SelectNodeEvent } from '../utils/bus.events';
import { selectionBinding } from '../runtime/selectionBinding';
import { GrafanaRuntimeSubscriptions } from '../runtime/subscriptions';

const SelectionReader = observer(() => {
  const { pointStore: interaction } = useRootStore();
  return <output data-testid="selection">{interaction.getSelectedNode?.id ?? 'none'}</output>;
});

it('propagates host selection through the stable root to React observers across graph replacement', async () => {
  const controller = new PanelController();
  await controller.update(metricGraphInput(metricGraphSource('baseline', [0, 100])));
  const nodes = Array.from(controller.state!.graph.state.nodeByKey.values());
  const listeners = new Set<(event: SelectNodeEvent) => void>();
  const eventBus = {
    publish: jest.fn((event: SelectNodeEvent) => listeners.forEach((listener) => listener(event))),
    subscribe: jest.fn((_type: unknown, listener: (event: SelectNodeEvent) => void) => {
      listeners.add(listener);
      return { unsubscribe: () => listeners.delete(listener) };
    }),
  };
  const scene = new GraphScene();
  scene.update({
    graph: controller.state!.graph.state.graph,
    edgeIndex: controller.state!.graph.state.edgeIndex,
    positions: new Float64Array(4),
  });
  const owner = new GrafanaRuntimeSubscriptions([]);
  const applyViewport = jest.fn();
  const input = {
    eventBus: eventBus as any,
    controller: controller as any,
    scene,
    panelId: 1,
    readIsLogic: () => true,
    readZoom: () => undefined,
    applyViewport,
  };
  const hooks = {
    selectionView: (view) => ({ ...view, longitude: view.longitude + 10, latitude: view.latitude + 20 }),
  };
  owner.bindPanel(selectionBinding(input, hooks));
  const root = controller.stores;
  const rendered = render(
    <RootStoreProvider store={root}>
      <SelectionReader />
    </RootStoreProvider>
  );
  expect(screen.getByTestId('selection')).toHaveTextContent('none');

  act(() => eventBus.publish(new SelectNodeEvent({ pId: 1, nodeId: nodes[0].id, select: true })));
  expect(screen.getByTestId('selection')).toHaveTextContent(nodes[0].id);
  expect(root.pointStore.getSelectedNode).toBe(nodes[0]);
  act(() =>
    controller.select({ id: nodes[1].id, namespaceId: controller.state!.snapshot.nodes[1].namespaceId }, 'host')
  );
  expect(screen.getByTestId('selection')).toHaveTextContent(nodes[1].id);
  expect(eventBus.publish).toHaveBeenCalledTimes(1);
  const pickedEdge = [...controller.state!.graph.state.graph.deepEdges][0];
  act(() =>
    controller.select({ id: nodes[1].id, namespaceId: controller.state!.snapshot.nodes[1].namespaceId }, 'user', [
      pickedEdge,
    ])
  );
  expect(root.pointStore.getSelEdges).toEqual([pickedEdge]);
  expect(root.pointStore.focusedEdgeId).toBe(pickedEdge.id);
  expect(eventBus.publish).toHaveBeenCalledTimes(2);
  expect(eventBus.subscribe).toHaveBeenCalledTimes(1);

  await act(async () => {
    await controller.update(metricGraphInput(metricGraphSource('replacement', [100, 0])));
  });
  expect(root.pointStore.getSelectedNode?.id).toBe(nodes[1].id);
  expect(root.pointStore.getSelectedNode).not.toBe(nodes[1]);
  expect(screen.getByTestId('selection')).toHaveTextContent(nodes[1].id);

  scene.update({ graph: controller.state!.graph.state.graph, edgeIndex: controller.state!.graph.state.edgeIndex });
  act(() => eventBus.publish(new SelectNodeEvent({ pId: 2, nodeId: nodes[0].id, select: true })));
  expect(root.pointStore.getSelectedNode?.id).toBe(nodes[1].id);
  act(() =>
    eventBus.publish(
      new SelectNodeEvent({ pId: 1, nodeId: nodes[0].id, select: true, fly: true, coord: [0, 0], zoomIn: true })
    )
  );
  expect(root.pointStore.getSelectedNode).toBe([...controller.state!.graph.state.nodeByKey.values()][0]);
  expect(root.viewStore.getViewState).toMatchObject({ longitude: 10, latitude: 20, zoom: 1.5 });
  expect(applyViewport).toHaveBeenCalledWith(expect.objectContaining({ longitude: 10, latitude: 20 }));
  owner.bindPanel(selectionBinding(input, hooks));
  expect(eventBus.subscribe).toHaveBeenCalledTimes(1);
  const originalBus = eventBus;
  const replacementListeners = new Set<(event: SelectNodeEvent) => void>();
  const replacementBus = {
    publish: jest.fn(),
    subscribe: jest.fn((_type, handler) => {
      replacementListeners.add(handler);
      return { unsubscribe: () => replacementListeners.delete(handler) };
    }),
  };
  owner.bindPanel(selectionBinding({ ...input, eventBus: replacementBus as any }, hooks));
  expect(listeners.size).toBe(0);
  expect(replacementListeners.size).toBe(1);
  act(() => originalBus.publish(new SelectNodeEvent({ pId: 1, nodeId: nodes[1].id, select: true })));
  expect(root.pointStore.getSelectedNode?.id).toBe(nodes[0].id);
  act(() => controller.select(undefined, 'host'));
  expect(screen.getByTestId('selection')).toHaveTextContent('none');
  rendered.unmount();
  owner.dispose();
  expect(listeners.size).toBe(0);
  expect(replacementListeners.size).toBe(0);
  controller.dispose();
});

import { defViewState } from '@vaduga/mapgl-core/types';

it('translates user commands without echoing host configuration and reconnects once', () => {
  const controller = new PanelController();
  const publish = jest.fn();
  const applyViewport = jest.fn();
  const owner = new GrafanaRuntimeSubscriptions([]);
  const input = {
    controller: controller as any,
    eventBus: { publish, subscribe: () => ({ unsubscribe: jest.fn() }) } as any,
    scene: new GraphScene(),
    panelId: 1,
    readIsLogic: () => false,
    readZoom: () => undefined,
    applyViewport,
  };
  owner.bindPanel(selectionBinding(input));
  owner.bindPanel(selectionBinding(input));
  controller.select({ id: 'A', namespaceId: 'site' });
  expect(publish).toHaveBeenCalledTimes(1);
  expect(publish.mock.calls[0][0].payload).toMatchObject({ pId: 1, nodeId: 'A', graphId: 'site' });
  controller.select({ id: 'B', namespaceId: 'site' }, 'host');
  controller.setViewport({ ...defViewState, zoom: 3 }, 'host');
  expect(publish).toHaveBeenCalledTimes(1);
  expect(applyViewport).not.toHaveBeenCalled();
  controller.setViewport({ ...defViewState, zoom: 4 });
  expect(applyViewport).toHaveBeenCalledTimes(1);
  owner.dispose();
  controller.select(undefined);
  expect(publish).toHaveBeenCalledTimes(1);
  controller.dispose();
});
