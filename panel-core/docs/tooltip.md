# Portable graph tooltip

`@vaduga/mapgl-core/components/Tooltips/GraphTooltip` is the graph-only inspection entry point. It exports the shared graph binding, property/link view and portable frame. It does not require Grafana, an adapter, a native panel or a geographic viewport.

```ts
import { createElement } from 'react';
import { GraphTooltip, tooltipProperties } from '@vaduga/mapgl-core/components/Tooltips/GraphTooltip';

const tooltip = createElement(GraphTooltip, {
  controller,
  scene: renderer.frame && {
    snapshot: renderer.frame.input.snapshot,
    render: renderer.frame.input.render,
    isRouted: renderer.frame.input.presentation.isRouted,
  },
  info: hoverInfo,
  getContent: (inspection) => ({
    properties: tooltipProperties([
      ['id', inspection.target.id, 'Identity'],
      ['namespace', inspection.target.namespaceId, 'Namespace'],
    ]),
  }),
});
```

Mount it in an absolutely positioned overlay spanning the graph viewport, with `pointer-events: none` on the overlay. The default frame enables pointer events only while pinned, bounds itself to the overlay and scrolls its own overflow. Adjacency/content changes keep the pinned position; a temporary hover preview uses its own position and returns to the saved pin on leave. A viewport resize can clamp the pin back into view. Feed hover picks through `info`. A click can call `inspectGraphTooltip` against the displayed scene and `controller.stores.pointStore.setGraphTooltip({ target: inspection.target, anchor: { x, y } })`. Blank selection clears the pinned graph tooltip. Callers continue to own the controller, renderer and React root.

Supply the displayed scene when picking comes from a render session. If omitted, the binding reads the current controller scene and observes its changes. Retained targets contain stable keys and optional route-unit/hop discriminators; they do not retain numeric edge references or graph objects. Removed or ambiguous targets are cleared. A non-routed view clears hop-specific inspection and reads the connection's primary row.

`getContent` supplies explicit readonly rows (`key`, `label`, `text`, optional `highlight`) and links (`key`, `label`, `href`, optional `target` and `onClick`). Return `undefined` to disable inspection for an element. `tooltipProperties` formats only explicitly supplied values; indexed source views are not enumerated. Formatting complex native values remains the host's responsibility.

Incoming/outgoing sections use the existing logical directed adjacency and feature-section contributors. Intermediate route nodes do not imply a new transitive-neighbor query. Relation hover restores the inspected focus on leave; relation clicks use the current controller selection and call `onSelect` with canonical identity and matching provenance. `onClose` lets the host restore its selection presentation without inventing another agent action.

Core owns the view and existing relation-section contributor contract. `featureServices` needs only its `tooltipEdgeSections` array; it supplies both ordinary adjacency and private relations such as trespassing edges in any Pro shell. Register a contributor that closes over the shell's private services and returns neutral edge records. There is no second extra-section callback. `renderActions(inspection)` supplies optional React header content; hosts compose actions and can reuse the exported `TooltipIconButton` for icon actions. Non-graph overlays such as clusters are composed outside `GraphTooltip`. `renderFrame` can replace the portable frame with a native container while reusing the same content and relation controls.

Selecting a connection from adjacency keeps the original node heading and the selected connection in its highlighted list row. For a tooltip opened by picking an edge, its original edge row stays fixed above adjacency while selection updates the details. A tooltip opened from a node does not gain an extra selected-edge row. Rows have no fragment subtitle. `presentation` lets the host supply native links and side-color markers. Close and adjacency/trespassing controls always use the shared `TooltipIconButton`; there are no button-rendering overrides. Grafana and other shells use the same SVGs, interaction states and CSS, with neutral host theme tokens. Icon hints use the browser-native `title` attribute.

Adjacency arrows preserve the MapGL catalog tooltip's selected state: a secondary idle glyph becomes a contrasting glyph on a primary filled, glyph-sized surface while expanded, with the theme's primary shade on hover. The fill persists after pointer leave. Core supplies all light/dark icon defaults, including close, hover and keyboard-focus colors, selected by the existing `dark` prop. Standalone hosts need no icon palette CSS or Grafana dependency. Inherited neutral tokens such as `--theme-accent`, `--theme-accent-border`, `--theme-accent-contrast`, `--theme-accent-hover` and `--tooltip-icon-secondary` can override those defaults. Core's private fallback tokens do not shadow host theme values.

Grafana's adapter prepares native field names, units/decimals/mappings, visibility, row-scoped data links and annotations. It supplies `VizTooltipContainer` and translates host events through existing panel bindings. Private consumers supply cluster, edit-handle and drawer behavior. MCP consumers supply their own document metadata and retain their existing explicit conversation action.

The compiling plain-data example is `panel-core/examples/tooltip.ts`; the isolated consumer check verifies its public export imports without Grafana packages.

The exported `TooltipFrame` defaults to bounding inspection within its parent. A shell whose tooltip may overflow its graph can supply `renderFrame={(props) => <TooltipFrame {...props} constrainToParent={false} />}` and allow overflow on the surrounding containers. This keeps the shared frame styling while placing it at the anchor plus 10px, without parent-size observation, clamping or resizing.
