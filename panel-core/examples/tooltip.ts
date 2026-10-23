import { createElement } from 'react';
import { PanelController } from '../src/runtime';
import { GraphTooltip, tooltipProperties } from '../src/components/Tooltips/GraphTooltip';

/** The host supplies fields; it does not construct native frames or expose renderer internals. */
export function plainGraphTooltip(controller: PanelController) {
  return createElement(GraphTooltip, {
    controller,
    getContent: (inspection) => ({
      properties: tooltipProperties([
        ['id', inspection.target.id, 'Identity'],
        ['namespace', inspection.target.namespaceId, 'Namespace'],
      ]),
    }),
  });
}
