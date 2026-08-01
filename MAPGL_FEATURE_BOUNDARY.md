# Mapgl Public Feature Boundary

Last reviewed: 2026-07-05

This file describes the public feature boundary of the Mapgl Grafana panel, `vaduga-mapgl-panel`. It is meant for duplicate-feature review discussions and for setting expectations about what the Mapgl maintainer considers a copy of the plugin's public functionality.

This is a living document, not a complete feature-boundary inventory. It will be expanded over time.

## Policy Context

Grafana's current plugin publishing docs say plugin submissions are reviewed case by case. Grafana's plugin publishing and signing criteria also list forking or derivative works and duplication of an existing plugin among reasons a plugin may be denied signing or publishing.

This document does not decide Grafana policy. It states the Mapgl maintainer's public feature boundary for `vaduga-mapgl-panel`.

## Core Feature Boundary

The primary Mapgl feature boundary is **routed links as a first-class primitive in a node graph**.

A Mapgl link can be direct or follow an ordered route through intermediate graph nodes or geographic waypoints. **Edge ID** gives that link a stable identity, including trace branches, physical paths, and parallel links. Fields from the input rows remain available on the corresponding displayed portions for styling, metrics, labels, and tooltips.

The distinctive observable behavior is the combination of:

- direct and routed links in one dataframe contract
- intermediate nodes and coordinate waypoints
- stable identities for logical and parallel links
- ordered multi-row trace and service routes
- row-aware styling and interaction along a displayed route
- the same topology model in abstract graph and geographic modes

Exact supported input shapes, ordering requirements, and examples belong in the [behavior reference](docs/reference.md). This boundary document states the public capability; it does not describe the internal relation model used to implement it.

## Why It Matters

Multi-hop edges make Mapgl useful for domains where a simple source-target link loses important structure:

- **Distributed traces**: a trace branch can be shown as one logical multi-hop edge while each span keeps duration, status, operation, method, or span ID fields.
- **Physical network paths**: a link can represent the actual path through switches, routers, sites, patch panels, fiber segments, or coordinate waypoints.
- **Structured service graphs**: an edge can express a dependency path through intermediate services instead of collapsing everything into one direct link.
- **Abstract topology modeling**: intermediate nodes on edges add structure without requiring users to split the visualization into unrelated tables or layers.

## Copy Boundary

The Mapgl maintainer considers another Grafana panel to be functionally copying the core Mapgl feature if it implements a substantially similar public contract, especially when several of these behaviors appear together:

- A source field, target/path field, and edge-key field equivalent to Mapgl's **Vertex A**, **Vertex B**, and **Edge ID** semantics.
- A node graph where `target` may be a path through intermediate graph nodes, not just a direct endpoint.
- Treating ordered rows with the same edge key as successive portions of one logical route or trace branch.
- Preserving per-row or per-span properties on the corresponding displayed route portions.
- Showing those route portions with their own styling, metrics, labels, tooltip values, highlighting, or adjacent-edge relations.
- Rendering these paths in an automatically laid out abstract node graph, not only as static map polylines.
- Advertising compatibility with Mapgl-style trace, service path, or physical path dataframe semantics.
- Recreating Mapgl's node-group cascade on top of Grafana thresholds: injected `thrColor`, threshold/fixed-color fallback groups, field-matched group rules, separate icon/color/size/width/dash/tint resolution, and group legend/filter behavior.
- Advertising Grafana-threshold-aware node groups that behave like Mapgl's cascading group system rather than ordinary field overrides.

A generic graph panel with direct node-to-node links is not the same feature. A generic geomap line/path layer is not the same feature. The distinctive boundary is the combination of dataframe-driven route identity, intermediate topology, graph-mode routing, and row-aware displayed link behavior.

## Supporting Feature Boundaries

The multi-hop edge primitive is surrounded by several public behaviors that are also part of Mapgl's distinctive feature set.

### Unified Node and Link Dataframe

Mapgl builds nodes and links from the same Grafana dataframe records.

- **Vertex A** creates or selects the source node.
- **Vertex B** creates a link when present.
- A single row can define a node and a link from that node.
- Separate node and edge tables are not required.
- Duplicate node IDs do not create duplicate nodes.
- Duplicate node rows may still contribute link data.

This contract lets users prepare topology from any Grafana datasource using normal Grafana transformations.

### Edge Identity and Deduplication

Mapgl's edge identity model is part of the public behavior:

- Without **Edge ID**, repeated `Vertex A -> final target` rows become one logical link.
- With unique **Edge ID** values, repeated source-target pairs can render as separate parallel links.
- With the same **Edge ID**, rows are treated as one logical edge.
- For trace-like data, ordered and continuous rows with the same **Edge ID** can describe successive portions of one route while preserving per-row fields.

This is more specific than simply drawing multiple lines between nodes.

### Path-Aware Vertex B

`Vertex B` is not only a target field. It can be a path definition.

Public path behavior includes:

- direct target node ID
- path arrays
- JSON strings containing path arrays
- automatic prepending of `Vertex A` when a path does not begin with the current source
- intermediate node IDs for graph-mode waypoints
- coordinate waypoints for routed Geo paths
- skipping invalid paths whose endpoints cannot be resolved

### Dual-Mode Topology Panel

Mapgl is a dual-mode topology panel:

- **Node Graph ortho** enables abstract node graph mode without geographic coordinates.
- Real basemaps enable network geomap mode.
- The same Markers and links layer can describe topology in either mode.
- Coordinates are optional in graph mode.
- Auto-layout edge routing applies in graph mode.

The feature boundary is not just "map plus graph"; it is the same topology data model working across abstract graph and geographic views.

### Grafana-Native Styling and Tooltip Semantics

Mapgl's topology model is integrated with Grafana panel data and styling:

- node color, size, opacity, text, and arc sections come from configured fields
- Grafana thresholds can drive node and edge color
- node groups can match arbitrary fields or the injected `thrColor` value
- groups can provide icons, size, width, color overrides for Grafana thresholds, and icon tint behavior
- edge styles can use row fields for width, color, and labels
- tooltips can show node, edge, and span fields from the source data
- configured search fields participate in panel search

These features are not individually unique in isolation, but they are part of the Mapgl topology workflow when combined with the multi-hop edge model.

### Node Groups Cascading Threshold System

Mapgl's **Node Groups** system is a distinct public feature boundary because it is not a flat set of style overrides. It is a cascading style resolver built on top of Grafana's native threshold output.

The public contract is:

- **Grafana threshold base**: **Node Styles -> Color** resolves the starting node color from Grafana field config thresholds, or from a fixed Grafana color.
- **Injected `thrColor`**: Mapgl injects `thrColor` during rendering so group rules can match the resolved threshold/fixed color without requiring users to create a dataframe column.
- **User groups plus ephemeral groups**: configured groups are user-visible rules; internal ephemeral groups preserve threshold/fixed colors for fallback coloring, group indexing, legends, and filtering.
- **Cascading precedence**: Mapgl sorts matching groups by match strength, including **Vertex A** matches, additional field matches, and `thrColor` matches.
- **Separated visual sources**: icon, size, line width, dashed edge styling, icon tint mode, and color can resolve from different matching groups.
- **Threshold fallback**: if no matching user-created group provides an explicit color, the node keeps the Grafana threshold color.
- **Group color override**: a user-created group overrides threshold color only when it explicitly sets a group color.
- **Icon tint inheritance**: SVG icons can keep original colors, use markup recolor, or use canvas tint from the resolved group or threshold color.
- **Edge style propagation**: matching node-group width and dashed-line settings can affect connected edge styling in the topology view.

The distinctive feature is the combination: Grafana thresholds remain the severity model, `thrColor` exposes that resolved color to group matching, and Mapgl then cascades multiple matching groups so different visual properties can come from different rules while preserving threshold color as the default.

A plugin is inside this supporting copy boundary if it recreates a substantially similar threshold-aware node-group resolver for a Grafana topology panel, especially when it combines `thrColor`-style matching, internal threshold fallback groups, multi-source visual property resolution, explicit group color override precedence, icon tint inheritance, and group legend/filter integration.

## User Contract Reference

Copyable dataframe examples for direct links, routed paths, ordered trace rows, parallel links, and geographic waypoints are maintained in the [panel configuration guide](docs/documentation.md) and [behavior reference](docs/reference.md). Keeping configuration details there gives users one normative contract while this document remains focused on the observable product boundary.

A plugin that implements a substantially similar source/route/identity contract, intermediate-node graph routing, and row-aware styling or interaction is inside the Mapgl copy boundary.

## Outside This Boundary

The maintainer does not consider these ideas alone to copy Mapgl's feature boundary:

- a basic Grafana panel that draws direct node-to-node edges
- a geomap panel that draws standalone polylines
- a visualization that supports traces only as a separate trace viewer, without path edges in a node graph
- a graph panel that requires separate node and edge tables and has no path-aware edge primitive
- generic use of MapLibre, deck.gl, auto layout algorithms, Grafana thresholds, or SVG icons
- ordinary Grafana threshold coloring, flat field-based style rules, or a simple group legend without Mapgl's cascading `thrColor` resolver
- a panel that only implements ordinary parallel edges without multi-hop path semantics

The boundary is the public Mapgl behavior as a coherent topology model, with routed links across intermediate nodes as the defining primitive.

## Public References

- User guide: `./docs/documentation.md`
- Behavior reference: `./docs/reference.md`
- Grafana publish docs: <https://grafana.com/developers/plugin-tools/publish-a-plugin/publish-a-plugin.md>
- Grafana plugin criteria: <https://grafana.com/legal/plugins/#plugin-publishing-and-signing-criteria>
