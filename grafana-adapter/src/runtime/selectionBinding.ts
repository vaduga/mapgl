import type { EventBus } from '@grafana/data';
import { type GraphScene, type PanelController, resolveSelection, selectionViewport } from '@vaduga/mapgl-core/runtime';
import type { GraphPanelLayoutState, GraphPanelRenderState } from '@vaduga/mapgl-core/graph/frame';
import type { ViewState } from '@vaduga/mapgl-core/types';
import type { GrafanaPanelBinding, SelectionHooks } from './contracts';
import { SelectNodeEvent } from '../utils/bus.events';
import type { Graph } from '@vaduga/mapgl-core/graph/main';

export interface SelectionBindingInput {
  readonly eventBus: EventBus;
  readonly panelId?: number;
  readonly controller: PanelController;
  readonly scene: GraphScene;
  readonly readIsLogic: () => boolean;
  readonly readZoom: () => number | undefined;
  readonly applyViewport: (view: ViewState) => void;
}

export function selectionBinding(input: SelectionBindingInput, hooks: SelectionHooks = {}): GrafanaPanelBinding {
  return {
    id: 'grafana.selection',
    keys: [input.eventBus, input.controller, input.panelId],
    start: (signal) => {
      const eventBus = input.eventBus;
      const published = new WeakSet<SelectNodeEvent>();
      const applySelection = (payload: SelectNodeEvent['payload'], updateSelection: boolean) => {
        const request = {
          nodeId: payload.nodeId,
          edgeId: payload.edgeId ?? payload.edge?.id,
          namespaceId: payload.graphId,
          coordinates: payload.coord,
          select: payload.select,
          fly: payload.fly,
          zoomIn: payload.zoomIn,
        };
        const { node, edge } = resolveSelection(input.scene.render.graph, request, hooks.findEdge);
        if (updateSelection && (payload.select || edge)) {
          input.controller.select(
            node ? { id: node.id, namespaceId: String((node.parent as Graph | undefined)?.id ?? '') } : undefined,
            'host',
            edge ? [edge] : []
          );
        }
        const isLogic = input.readIsLogic();
        const resolvedView = selectionViewport(request, node, input.scene.render.positions, isLogic, input.readZoom());
        if (resolvedView) {
          const view = hooks.selectionView?.(resolvedView, payload.graphId) ?? resolvedView;
          if (payload.select) {
            input.controller.stores.pointStore.setSelCoord({
              type: 'Point',
              coordinates: [view.longitude, view.latitude],
            });
          }
          if (payload.fly) {
            input.controller.setViewport(view);
          }
          input.controller.stores.pointStore.setIsShowCenter(view);
        }
      };
      const unsubscribeCommands = input.controller.subscribe((event) => {
        if (signal.aborted) {
          return;
        }
        if (event.type === 'selection') {
          const outgoing = new SelectNodeEvent({
            pId: input.panelId ?? 0,
            nodeId: event.node?.id,
            graphId: event.node?.namespaceId,
            select: true,
          });
          applySelection(outgoing.payload, false);
          published.add(outgoing);
          eventBus.publish(outgoing);
        } else if (event.type === 'viewport') {
          input.applyViewport(event.value);
        }
      });
      const subscription = eventBus.subscribe(SelectNodeEvent, (event) => {
        if (signal.aborted || published.has(event)) {
          return;
        }
        const payload = event.payload;
        if (input.panelId !== payload.pId) {
          return;
        }
        applySelection(payload, true);
      });
      return () => {
        unsubscribeCommands();
        subscription.unsubscribe();
      };
    },
  };
}
