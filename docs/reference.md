# Reference

This page is a compact behavior reference for Mapgl panel configuration and dataframe semantics.

For workflow-oriented setup guidance, see [Panel configuration](documentation.md).

## Mode model

- **Node Graph ortho** in **Basemap layer** enables abstract node graph mode.
- Any real basemap enables network geomap mode.
- Geo coordinates are optional in graph mode.
- Auto-layout edge routing applies in graph mode.

## Fresh panel defaults

- A panel without data layers initializes with one **Markers and links** layer.
- Its initial map view is **Fit to data**, with a maximum zoom of `15`.
- Panels that already contain a data layer retain their configured map view.

## Graph diagnostics

- Fatal and recoverable graph-frame diagnostic alerts remain visible for two seconds in dashboard mode and ten seconds in panel edit mode.
- The recoverable alert uses the neutral heading **Graph data contains issues** because a diagnostic may represent a skipped row or edge, or an adjustment such as removing only an unresolved intermediate path node.
- A new diagnostic result starts a new display interval for the current mode.
- Dashboard mode shows a count-only summary. Panel edit mode shows each diagnostic and its total as an outer bullet, with retained frame, field, row, and value examples as nested bullets. A final nested bullet reports additional occurrences beyond the bounded examples.
- Entering or exiting panel edit mode shows the current diagnostic again with the content and timeout for the new mode; reloading is not required.
- **Other -> Hide diagnostic messages** suppresses graph-frame diagnostic alerts in both modes. It does not hide the dedicated **No graph data** state.

## Field semantics

- **Data**: optional frame/query filter for a layer.
- **Vertex A**: source node ID field. This is the main node identity field.
- **Vertex B**: target node ID or path definition. If set, Mapgl can generate links.
- **Edge ID**: optional link identity. Use unique values for separate parallel links. Reuse one value only for consecutive, datasource-ordered rows that form a continuous route; each row keeps its user-facing properties on the matching route portion.
- **Vertex A namespace**: optional source namespace for graph mode.
- **Vertex B namespace**: optional target namespace for graph mode.
- **Search by**: extra fields exposed to panel search.
- **coordinates**: optional; used for Geo placement.

## Dataframe model

- Nodes and links are generated from the same records.
- A single record may define a node and also define a link from that node.
- Separate node and edge tables are not required.
- If your datasource returns separate node and edge tables, use Grafana transformations to prepare the dataframe Mapgl should read.
- Multiple configured **Markers and links** layers are composed in data-layer order into one graph.
- Each graph layer retains its own frame matcher, field mappings, styles, edge options, and LayerSwitcher identity.
- Cross-layer targets are resolved after every configured graph layer has contributed its nodes.

## Dataframe contract

- The optional layer **Data** setting selects the input frame before topology data is read.
- Every non-empty **Vertex A** value identifies a node in its source namespace.
- Repeated node IDs refer to the same node. The first row that introduces a node supplies its node properties, but later rows may still define links.
- A non-empty **Vertex B** defines either a direct target or a route from the row's **Vertex A**.
- Source and final target nodes must resolve after all configured graph layers have supplied their nodes.
- Without a non-empty **Edge ID**, link identity defaults to `source-finalTarget`.
- Use different **Edge ID** values when repeated source-target pairs must remain separate parallel links.
- Reuse one **Edge ID** only for rows that intentionally describe successive portions of one route. Those rows must be consecutive, remain in datasource order, and connect end-to-start.
- User-facing fields from each valid route row remain associated with its displayed route portion for styling and tooltips.

Practical implication: choose one stable identity per logical link, preserve query ordering for multi-row routes, and use unique identities for parallel links.

## Deduplication rules

- Duplicate node IDs do not create additional nodes.
- Node properties come from the first record that introduced the node.
- Duplicate node rows may still contribute link data.
- Repeated links with the same edge key are coalesced.
- Link display properties, metrics, labels, widths, and colors come from the first record that created that edge key.
- Later rows with the same edge key may refresh route/path data for that logical link.
- Empty **Edge ID** values fall back to the default `source-target` edge key.

## Edge key behavior

| Case                                                  | Edge key                        | Result                                                                                                 |
| ----------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| No **Edge ID** configured                             | `Vertex A + "-" + final target` | repeated source-target rows become one logical link                                                    |
| **Edge ID** configured with unique values             | **Edge ID** value               | each unique value creates a separate link or routed multi-hop edge with its own row properties         |
| **Edge ID** configured but repeated for a simple link | repeated **Edge ID** value      | rows are treated as the same logical link                                                              |
| **Edge ID** repeated across valid ordered route rows  | repeated **Edge ID** value      | continuous rows display as one route; each row keeps properties on its corresponding displayed portion |
| **Edge ID** configured but empty                      | `Vertex A + "-" + final target` | same as no **Edge ID** for that row                                                                    |

## Vertex B path rules

**Vertex B** can be:

- a target node ID, for example `B`
- a path array, for example `["B", "C"]`
- a JSON string containing a path array, depending on the datasource output

Path behavior:

- A simple string creates `[Vertex A, Vertex B]`.
- A single-item path array creates `[Vertex A, item]`.
- If a path array does not start with the current **Vertex A** value, Mapgl prepends **Vertex A**.
- The first usable path item must be a node ID.
- The final path item must resolve to a target node ID.
- Intermediate string items are treated as node IDs.
- Coordinate waypoints are used for routed Geo paths.
- Graph-mode auto-layout paths should use node IDs for path waypoints.
- Unresolved intermediate node IDs are skipped while the remaining valid route is retained.
- Malformed paths and paths with an unresolved source or final target are skipped.

Examples:

```text
# Direct target
Vertex A=A, Vertex B=B

# Graph route through intermediate nodes
Vertex A=A, Vertex B=["A", "B", "C"], Edge ID=route-1

# Geo route through a longitude/latitude waypoint
Vertex A=A, Vertex B=["A", [15, 55], "B"], Edge ID=geo-route-1
```

## Namespace rules

- Namespaces apply in graph mode.
- The default namespace is `external`.
- **Vertex A namespace** selects or creates the source node namespace.
- **Vertex B namespace** selects the target node namespace.
- Dot-separated namespace values create nested subgraphs, for example `site.core.router`.
- A target node must exist in the resolved target namespace for a link to be created.

## Parallel link rules

- Parallel links require unique **Edge ID** values.
- Parallel links are auto-layouted as separate paths.
- Properties for parallel links are taken from each data record individually.
- Per-link metrics, labels, widths, and colors may differ across parallel links.
- In the open-source panel, parallel edge offset rendering is available in abstract node graph mode.

## Ordered multi-row route rules

Trace and service-dependency data can describe one route across multiple rows:

- **Vertex A** identifies the starting service or node for each row.
- **Vertex B** identifies that row's direct target or route.
- **Edge ID** identifies the complete trace branch or logical route.
- Rows sharing that identity must be adjacent in the dataframe and remain in datasource order.
- The start of each later row must match the final node reached by the preceding row.
- Styling, metrics, and tooltip fields from each row remain associated with the corresponding displayed route portion.
- Parallel links that must remain separate use different **Edge ID** values.

Example:

```text
Vertex A        Vertex B            Edge ID   duration_ms status
api-gateway     payment-service     trace-42  18          ok
payment-service postgres-primary    trace-42  41          warn
```

These rows form one supported ordered route because they are consecutive and connect at `payment-service`. A repeated-ID row that does not continue end-to-start is unsupported input and is reported as a graph-data issue. Do not rely on how invalid groups are recovered or presented.

## Auto-layout options

- **Basemap layer -> Node Graph ortho -> Edge routing -> Splines** maps to `SugiyamaSplines`.
- **Basemap layer -> Node Graph ortho -> Edge routing -> Rectilinear** maps to `Rectilinear`.
- **Basemap layer -> Node Graph ortho -> Layout direction** maps to the MSAGL layer direction values `RL`, `LR`, `TB`, or `BT`.
- **Basemap layer -> Node Graph ortho -> Layer separation** maps to MSAGL `LayerSeparation`. Default: `60`.
- **Basemap layer -> Node Graph ortho -> Node separation** maps to MSAGL `NodeSeparation`. Default: `40`.
- These settings apply in abstract node graph mode, where Mapgl runs auto-layout.
- The settings are stored in the **Node Graph ortho** basemap layer config.

## Node style base

**Node Styles** define the initial node appearance:

- size
- color
- opacity
- text
- arc sections

Node group matching and escalation happen after this base style is resolved.

## Field-driven size scaling

- **Min** is the rendered size or line width at normalized percentage `0`.
- **Max** is the rendered size or line width at normalized percentage `1`.
- For ordinary field scaling, those percentages correspond to the selected metric field's minimum and maximum.
- For capacity-relative arc scaling, they correspond to zero and the row's capacity.
- When Min is less than Max, lower metrics render smaller and higher metrics render larger.
- When Min is greater than Max, lower metrics render larger and higher metrics render smaller.
- When Min equals Max, the rendered size is constant.
- Min and Max are independently limited to the style editor's allowed size range; they are not reordered.

## `thrColor`

- `thrColor` is injected by Mapgl during rendering.
- Users do not add a dataframe column named `thrColor`.
- `thrColor` is derived from the current node color result.
- If **Node Styles -> Color** uses a metric field, `thrColor` usually comes from native Grafana thresholds for that field.
- If **Node Styles -> Color** is fixed, the fixed color becomes the starting color.

## Ephemeral and non-ephemeral groups

Mapgl evaluates two kinds of groups during node styling:

- **Non-ephemeral groups** are the groups users configure in **Node Groups**.
- **Ephemeral groups** are internal groups Mapgl creates while rendering.

A matching user-created group becomes the **non-ephemeral color source** only when its **group color** is set. That single group color covers every node matched by the group.

An **ephemeral `thrColor` match** means Mapgl created an internal threshold or fixed-color group for the node's resolved color. These groups are not stored in panel configuration and are not edited in **Node Groups**. They exist so threshold/fixed colors can still participate in fallback coloring, group indexing, legends, and filtering when no user-created group provides an explicit override.

If a user-created group matches but does not set a group color, the node can still take non-color properties from that group, such as icon, size, width, or tint mode. Its color falls back to the resolved ephemeral threshold color. In that case, the user-created group label does not appear in the groups legend because Mapgl does not have a stable defined color to show for that group.

Priority rule of thumb:

- user-created groups are preferred for icons, sizes, widths, and tint behavior
- a matching user-created group with an explicit color is preferred over internal threshold groups for color
- internal threshold groups preserve Grafana threshold color as the fallback

## Node group matching

Each node group can match on:

- any query field
- the special `thrColor` value

Matching behavior:

- Conditions inside one group are combined with AND.
- A group with no conditions matches every node with lowest priority.
- String values are comma-separated.
- Number values are comma-separated and parsed as integers.
- `thrColor` values are selected from threshold colors.

Node groups can define:

- label
- icon
- color override
- fixed size
- fixed width
- dashed edge line
- icon render mode

For node-group rules, `isDashed: true` renders matching edge strokes with the current `[4, 2]` dash pattern, relative to stroke width. An absent value leaves the edge solid unless another matching rule supplies the dashed flag.

## Node group priority

Matching groups are sorted by priority before style resolution.

Highest priority signals:

1. **Vertex A** field match plus `thrColor`
2. **Vertex A** field match plus additional field matches
3. **Vertex A** field match only
4. multiple matched properties including `thrColor`
5. user-created `thrColor` condition match
6. internally generated `thrColor` fallback match
7. catch-all or other lowest-priority match

The **Vertex A** field match means a group condition whose field name is the field selected in **Vertex A**.

## Node group precedence

Resolution is cascading:

1. Resolve the node's base color, size, opacity, and text from **Node Styles**.
2. Find all matching node groups.
3. Choose the base group from the highest-priority non-ephemeral match with a visual property.
4. If no such group exists, use the highest-priority non-ephemeral match.
5. If no non-ephemeral group matches, use the highest-priority matching group.
6. Resolve color separately from the highest-priority matching user-created group that has an explicit group color.
7. If no group color override matches, fall back to the original node color from **Node Styles**.
8. Resolve icon tint mode from the highest-priority matching group that defines one.

Implication:

- icon can come from one matching group
- color can come from another matching group
- size and width can come from the base group
- dashed edge line can come from the base group
- if no group color override applies, color falls back to Grafana threshold output

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
- **None** when the original SVG artwork should stay unchanged

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
- node properties come from record `1`
- record `2` can still create a link if it has **Vertex B**

### Example: repeated link without `Edge ID`

Records:

```text
1. Vertex A=A, Vertex B=B, bandwidth=10G
2. Vertex A=A, Vertex B=B, bandwidth=100G
```

Result:

- one logical link is created
- link properties come from record `1`

### Example: repeated link with unique `Edge ID`

Records:

```text
1. Vertex A=A, Vertex B=B, Edge ID=xe-0/0/0, bandwidth=10G
2. Vertex A=A, Vertex B=B, Edge ID=xe-0/0/1, bandwidth=100G
```

Result:

- two parallel links are created
- each link keeps properties from its own record

### Example: repeated `Edge ID`

Records:

```text
1. Vertex A=A, Vertex B=B, Edge ID=xe-0/0/0, bandwidth=10G
2. Vertex A=A, Vertex B=B, Edge ID=xe-0/0/0, bandwidth=100G
```

Result:

- one logical link is created
- link properties come from record `1`
