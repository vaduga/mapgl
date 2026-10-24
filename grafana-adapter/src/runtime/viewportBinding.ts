import type { PanelController } from '@vaduga/mapgl-core/runtime';
import type { ViewState } from '@vaduga/mapgl-core/types';
import type { GrafanaPanelBinding } from './contracts';

/** Applies controller viewport changes to the Grafana host. */
export function viewportBinding(input: {
  readonly controller: PanelController;
  readonly applyViewport: (view: ViewState) => void;
}): GrafanaPanelBinding {
  return {
    id: 'grafana.viewport',
    keys: [input.controller],
    start: (signal) =>
      input.controller.subscribe((event) => {
        if (!signal.aborted && event.type === 'viewport') {
          input.applyViewport(event.value);
        }
      }),
  };
}
