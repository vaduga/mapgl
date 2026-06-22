# Mapgl Public Feature Boundary

Last reviewed: 2026-06-22

This file describes the public feature boundary of the Mapgl Grafana panel, `vaduga-mapgl-panel`. It is meant for duplicate-feature review discussions and for setting expectations about what the Mapgl maintainer considers a copy of the plugin's public functionality.

This is a living document, not a complete feature-boundary inventory. It will be expanded over time.

## Policy Context

Grafana's current plugin publishing docs say plugin submissions are reviewed case by case. Grafana's plugin publishing and signing criteria also list forking or derivative works and duplication of an existing plugin among reasons a plugin may be denied signing or publishing.

This document does not decide Grafana policy. It states the Mapgl maintainer's public feature boundary for `vaduga-mapgl-panel`.

## Core Feature Boundary

The primary Mapgl feature boundary is **multi-hop edges as a first-class primitive in a node graph**.

In Mapgl, an edge is not limited to one direct `source -> target` segment. A Grafana dataframe row can define a source node through **Vertex A**, and **Vertex B** can define either a target node or a path. That path can pass through intermediate graph nodes or coordinate waypoints. **Edge ID** gives the path a stable logical identity.

This makes a multi-hop path part of the topology model, not just a decorative polyline. The path participates in graph rendering, edge identity, tooltip data, highlighting, adjacent-edge lists, and row-based styling.

The most important semantics are:

- **Vertex B path semantics**: `Vertex B` can be a direct target, or a path array.
- **Intermediate topology**: path items can represent intermediate nodes, so an edge can traverse meaningful graph vertices before reaching its final target.
- **Stable edge identity**: `Edge ID` identifies one logical edge, trace branch, physical path, or parallel link.
- **Trace composition**: consecutive rows with the same `Edge ID` can be bound into one multi-hop edge.
- **Per-span properties**: each expanded span or routed fragment keeps the fields from the row that created it, including metrics, labels, status, tooltip fields, and style inputs.
- **Graph-mode routing**: in abstract node graph mode, multi-hop paths are expanded into routed edge fragments by the graph layout/rendering flow.

This is the main concept Mapgl treats as distinctive: a Grafana panel that models routed multi-hop paths as graph edges, where the logical edge can span intermediate nodes while each segment keeps its own row data.

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
- Binding repeated or consecutive rows with the same edge key into one logical multi-hop edge or trace branch.
- Preserving per-row or per-span properties after expanding a multi-hop edge into graph fragments.
- Showing multi-hop edge fragments with their own styling, metrics, labels, tooltip values, highlighting, or adjacent-edge relations.
- Rendering these paths in an automatically laid out abstract node graph, not only as static map polylines.
- Advertising compatibility with Mapgl-style trace, service path, or physical path dataframe semantics.

A generic graph panel with direct node-to-node links is not the same feature. A generic geomap line/path layer is not the same feature. The distinctive boundary is the combination of dataframe-driven path identity, multi-hop graph-edge semantics, graph-mode routing, and per-fragment row data retention.

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
- For trace-like data, consecutive rows with the same **Edge ID** can compose one multi-hop edge while preserving per-span row fields.

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

### Namespaced Graphs

Mapgl supports namespace-aware graph mode:

- source and target namespaces can be selected separately
- dot-separated namespace values create nested subgraphs
- namespace visibility is exposed through the layer switcher
- hidden namespaces affect edge and arc visibility in graph rendering

This lets a node graph represent grouped or nested topology without forcing users into one flat graph.

### Parallel Edges in Graph Mode

Mapgl supports parallel link identity and graph-mode offset rendering:

- unique **Edge ID** values preserve separate parallel links between the same nodes
- each parallel link can keep its own properties, metrics, labels, widths, and colors
- parallel edge offset rendering is available in abstract node graph mode

### Grafana-Native Styling and Tooltip Semantics

Mapgl's topology model is integrated with Grafana panel data and styling:

- node color, size, opacity, text, and arc sections come from configured fields
- Grafana thresholds can drive node and edge color
- node groups can match arbitrary fields or the injected `thrColor` value
- groups can provide icons, size, width, color overrides, and icon tint behavior
- edge styles can use row fields for width, color, and labels
- tooltips can show node, edge, and span fields from the source data
- configured search fields participate in panel search

These features are not individually unique in isolation, but they are part of the Mapgl topology workflow when combined with the multi-hop edge model.

## Example Boundaries

### Path Stored in Vertex B

For a non-trace topology, **Vertex B** can store the path directly. Assume the listed devices already exist as nodes in the layer:

```text
Vertex A       Vertex B                                                        Edge ID       capacity    status
site-router-a  ["patch-panel-7", "core-switch-1", "firewall-1", "wan-edge-1"]  fiber-path-17 10G         up
```

Mapgl can render `fiber-path-17` as one logical edge from `site-router-a` to `wan-edge-1`, routed through `patch-panel-7`, `core-switch-1`, and `firewall-1`. The intermediate nodes are part of the edge path, so the visual route carries topology structure instead of collapsing into one direct line.

### Trace Built From Consecutive Spans

Trace and span data often arrives as binary service-to-service rows rather than a full path array in each **Vertex B** value:

```text
Vertex A        Vertex B                                      Edge ID    duration_ms    status
api-gateway     "payment-service"                             trace-42   18             ok
payment-service "postgres-primary"                            trace-42   41             warn
```

Mapgl can treat these consecutive rows as one logical trace branch identified by `trace-42`. The branch expands through multiple graph vertices, while each span keeps the row fields that created it.

A plugin that implements the same source/path/key model, expands it into graph-mode multi-hop edge fragments, and preserves per-path or per-span row data is inside the Mapgl copy boundary.

## Outside This Boundary

The maintainer does not consider these ideas alone to copy Mapgl's feature boundary:

- a basic Grafana panel that draws direct node-to-node edges
- a geomap panel that draws standalone polylines
- a visualization that supports traces only as a separate trace viewer, without path edges in a node graph
- a graph panel that requires separate node and edge tables and has no path-aware edge primitive
- generic use of MapLibre, deck.gl, auto layout algorithms, Grafana thresholds, or SVG icons
- a panel that only implements ordinary parallel edges without multi-hop path semantics

The boundary is the public Mapgl behavior as a coherent topology model, with multi-hop edges as the defining primitive.

## Public References

- User guide: `./docs/documentation.md`
- Behavior reference: `./docs/reference.md`
- Grafana publish docs: <https://grafana.com/developers/plugin-tools/publish-a-plugin/publish-a-plugin.md>
- Grafana plugin criteria: <https://grafana.com/legal/plugins/#plugin-publishing-and-signing-criteria>
