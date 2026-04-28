# Reference

This page is a compact behavior reference for Mapgl panel configuration and dataframe semantics.

## Mode model

- Primary mode: **abstract node graph**
- Secondary mode: **network geomap**
- Geo coordinates are optional
- **Node graph ortho** in **Basemap layer** means graph mode with no geographic basemap

## Field semantics

- **Vertex A**: unique node ID
- **Vertex B**: target node ID or path definition; enables link generation
- **Edge ID**: optional unique edge key; enables separate parallel links for the same `Vertex A -> Vertex B` pair
- **Vertex A namespace**: optional source namespace for graph mode
- **Vertex B namespace**: optional target namespace for graph mode
- **Search by**: extra fields exposed to panel search
- **coordinates**: optional; used only for Geo placement

## Dataframe model

- Nodes and links are generated from the same records
- A single record may define a node and also define a link from that node
- Separate node and edge tables are not required

## Topology build algorithm

1. Read dataframe records.
2. Collect nodes from `Vertex A`.
3. Ignore duplicate nodes after the first occurrence.
4. Keep node properties from the first record that introduced the node.
5. Build links after node collection.
6. If `Edge ID` is not configured, treat repeated links for the same connection as duplicates.
7. If `Edge ID` is configured, keep repeated links for the same `Vertex A -> Vertex B` pair as separate parallel links.

## Deduplication rules

- Duplicate nodes are ignored.
- Node properties come from the first matching record only.
- Without `Edge ID`, duplicate links are ignored.
- Without `Edge ID`, link properties come from the first matching record only.
- With `Edge ID`, each record can produce its own link, even for the same `Vertex A -> Vertex B` pair.

## Parallel link rules

- Parallel links require **Edge ID**
- Parallel links are auto-layouted as separate paths
- Properties for parallel links are taken from each data record individually
- Per-link metrics, labels, widths, and colors may differ across parallel links
- In the open-source panel, parallel edge offset rendering is available in abstract node graph mode
- Parallel edge offset rendering on geomap is a Pro feature

## Node style base

**Node Styles** define the initial node appearance:

- size
- color
- opacity
- text
- arc sections

Node group matching and escalation happen after this base style is resolved.

## `thrColor`

- `thrColor` is injected by Mapgl during rendering
- Users do not add a dataframe column named `thrColor`
- `thrColor` is derived from the current node color result
- If **Node Styles -> Color** uses a metric field, `thrColor` usually comes from native Grafana thresholds for that field
- If **Node Styles -> Color** is fixed, the fixed color becomes the starting color

## Node group matching

Each node group can match on:

- any query field
- the special `thrColor` value

Node groups can define:

- label
- icon
- color override
- fixed size
- fixed width
- icon render mode
- icon offset

## Node group precedence

Resolution is cascading:

1. Resolve node color from **Node Styles**
2. Find all matching node groups
3. Choose the most specific matching group as the base for non-color properties
4. Resolve color separately from the best matching explicit group color override
5. If no group color override matches, fall back to the original node color

Implication:

- icon can come from one matching group
- color can come from another matching group
- if no group color override applies, color falls back to Grafana threshold output

## Node group priority signals

Higher-priority matches generally include:

- location plus `thrColor`
- more matched properties
- specific non-ephemeral rules over generic threshold-only matches

## Icon render mode

`icon render mode` controls whether a custom SVG icon uses its original artwork or inherits the resolved node color.

Tint source:

- matching group color override, if present
- otherwise resolved threshold color

Modes:

- **None**: keep original SVG colors
- **Markup recolor**: rewrite SVG `fill` and `stroke`
- **Canvas tint**: tint the rendered icon image after drawing

Use:

- **Markup recolor** for simple SVGs that recolor cleanly through markup
- **Canvas tint** for SVGs that do not recolor reliably through markup but look correct when tinted as rendered pixels

## Minimal examples

### Example: threshold-driven group match

Record:

```text
Vertex A=node-1, severity=2, role=router
```

Config:

- **Node Styles -> Color** uses `severity`
- Grafana thresholds resolve `severity=2` to red
- Group `Routers` matches `role=router` and sets icon `router`
- Group `Critical` matches `thrColor=red` and sets color `red`

Result:

- node icon comes from `Routers`
- node color comes from `Critical`

### Example: duplicate node

Records:

```text
1. Vertex A=node-1, role=router, label=Core
2. Vertex A=node-1, role=switch, label=Changed
```

Result:

- one node is created
- properties come from record `1`

### Example: repeated link without `Edge ID`

Records:

```text
1. Vertex A=A, Vertex B=B, bandwidth=10G
2. Vertex A=A, Vertex B=B, bandwidth=100G
```

Result:

- one link is created
- properties come from record `1`

### Example: repeated link with `Edge ID`

Records:

```text
1. Vertex A=A, Vertex B=B, Edge ID=xe-0/0/0, bandwidth=10G
2. Vertex A=A, Vertex B=B, Edge ID=xe-0/0/1, bandwidth=100G
```

Result:

- two parallel links are created
- each link keeps properties from its own record
