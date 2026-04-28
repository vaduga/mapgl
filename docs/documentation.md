# Panel configuration

This page focuses on configuring the Mapgl panel in Grafana after your query already returns node and edge data.

Mapgl is a **dual-mode topology panel**, not a geomap-only panel:

- use **abstract node graph mode** when you want automatic topology layout without coordinates
- use **network geomap mode** when you want to place that topology on real map coordinates

## Editor layout

Mapgl panel options are split into a few main areas:

- **Map view**: initial position and zoom.
- **Data layers**: add or select a layer. For topology data, use **Markers and links**.
- **Basemap layer**: tile/background settings for Geo mode only.
- **Other**: layer switcher, legends, sizing mode, and alert label options.

Most panel-specific work with topology happens inside the **Markers and links** layer.

In **Basemap layer**, **Node graph ortho** means the abstract node graph mode with no geographic basemap. Use it when you want topology auto-layout rather than map coordinates.

## Markers and links layer

This layer renders:

- nodes with status colors derived from the best-matching node group style, with fall back to native Grafana thresholds
- donut-chart icons for several metrics per node 
- spline-routed links between nodes (the 'routed' mode)
- direct-mode Arc links with dual-side metrics


### How topology is generated from the dataframe

Mapgl builds nodes and links from the same input records. It does not require one table for nodes and a separate table for edges.

Mapgl is datasource-agnostic. It can work with any Grafana datasource, as long as the final dataframe is prepared to provide the fields described in **Location and identity**.

In practice, this usually means:

- query any datasource supported by Grafana
- use Grafana transformations when needed
- produce a dataframe with the node, link, and optional coordinate fields that Mapgl expects
- include any additional fields you want to use as node or link properties, metrics, or node group match conditions

The processing flow is:

1. Mapgl reads the dataframe and collects nodes first.
2. After nodes are known, Mapgl makes links between them.
3. Styling and labels are then applied from the properties carried by each record.

This is why a single row can both define a node and create a link from that node to another node.

Exact deduplication and parallel-edge behavior is documented in [Reference](reference.md).

### Location and identity

These fields define how Mapgl builds the topology:

- **Vertex A**: unique node ID.
- **Vertex B**: target node ID or a path array. If set, Mapgl draws edges.
- **Edge ID**: optional unique edge key. Use it for parallel edges.
- **Vertex A namespace**: optional namespace for source nodes in graph mode.
- **Vertex B namespace**: optional namespace for target nodes in graph mode.
- **Search by**: extra fields used by panel search.

Coordinates are not required for graph mode. They are only needed when you want Geo placement instead of auto-layout.

### Parallel links

Use **Edge ID** when the same **Vertex A -> Vertex B** pair can appear more than once and should stay as separate links.

With **Edge ID**, Mapgl auto-layouts those repeated links as parallel paths and keeps per-link properties from each record.

Without **Edge ID**, repeated links for the same connection are treated as duplicates.

In the open-source panel, parallel edge offset rendering is available in **abstract node graph** mode.

### Node styles

Use **Node Styles** for the base appearance of nodes:

- **Size**: fixed value or numeric field-driven sizing.
- **Color**: fixed value or field-driven color with native Grafana thresholds.
- **Fill opacity**
- **Text label**
- **Arc sections**: enable extra metric segments when your topology uses them.

This is the foundation for group escalation. Node groups do not replace Grafana field config. They build on top of it.

## Node groups

Node groups are the most specific styling system in Mapgl. A group can define:

- legend label
- SVG icon
- color override
- fixed node size
- fixed line width
- icon render mode
- icon vertical offset
- matching rules

Turn on **Node Groups -> Apply** to use group rules.

### How matching works

Each group contains one or more match conditions. A condition can target:

- any query field from your dataframe
- the special **`thrColor`** field

`thrColor` is important: it is an internal value injected by Mapgl during rendering. You do not create a dataframe field with that name.

It is derived from the current node color result, usually from the node metric field and native Grafana thresholds.

### Icon render mode

`icon render mode` controls whether the selected SVG icon should stay unchanged or be recolored from the resolved node color.

The tint source is:

- the matching **group color override**, when a matching group provides one
- otherwise the node's current **threshold color** from **Node Styles**

So this setting is what makes an icon inherit threshold severity color while still using a custom SVG shape.

Available modes:

- **None**: use the original icon colors from the SVG file.
- **Markup recolor**: rewrite SVG `fill` and `stroke` values in the markup and replace them with the resolved color.
- **Canvas tint**: draw the icon to a canvas and tint the rendered pixels with the resolved color.

### When to use each tint mode

- Use **Markup recolor** for simple SVG icons that use regular `fill` and `stroke` attributes and should become a clean single-color icon.
- Use **Canvas tint** for icons that do not recolor reliably by markup replacement but still look correct when the rendered image is tinted after drawing.
- Use **None** when the icon should preserve its original multicolor artwork.

In practice, some icons tint well with **Canvas tint**, while others work better with **Markup recolor**. The right mode depends on how the original SVG is authored.

### Escalation behavior

Group resolution is cascading, not single-rule-only.

1. Mapgl first resolves the node color from **Node Styles**.
2. Mapgl checks all matching node groups.
3. The most specific matching group becomes the **base group** for non-color properties such as icon, size, width, offset, and label.
4. Color is resolved separately.
   If another matching group provides an explicit color override, that color can replace the base group color.
5. If no matching group provides a color override, Mapgl falls back to the original node color from Node Styles.
   That means native Grafana thresholds still control color.

This is why a node can:

- take its **icon** from one group
- take its **color** from another group
- still fall back to **Grafana thresholds** when no group color override matches

Exact precedence and matching rules are documented in [Reference](reference.md).

### Recommended pattern

For most dashboards, the cleanest setup is:

1. Use **Node Styles -> Color** with a metric field and Grafana thresholds.
2. Add node groups that match on **`thrColor`** for severity-aware behavior.
3. Add extra field matches such as site, role, vendor, or status class when you need more specific icons or sizing.
4. Only set **group color** when you intentionally want to override threshold color.

### Example

Assume:

- Node color metric is `severity`
- Grafana thresholds make `severity=0` green, `1` yellow, `2` red
- Group `Routers` matches `role=router` and sets icon `router`
- Group `Critical` matches `thrColor=red` and sets color `red`

Result:

- a healthy router gets the **router icon** from `Routers`
- a critical router gets the **router icon** from `Routers`
- the same critical router gets the **red color** from `Critical`
- a non-router critical node still stays **red** because thresholds already resolved it red

If you add a third group matching `role=router` and `thrColor=red`, that more specific rule can override the previous two.

## Edge styles

Use **Edge Styles** when `Vertex B` is configured:

- arrow direction
- line width
- color
- text for edge labels

If you enable **Arc styles**, Mapgl can style side A and side B independently and use a capacity field for metric normalization.

## Other panel options

Outside the layer editor:

- **Layer switcher**: show or hide the layer toggle UI.
- **Edge legend**: show legend for edge thresholds.
- **Groups legend**: show legend for node groups.
- **Meters for sizing**: scale sizes in Geo mode by map zoom.
- **VertexA name label in alert annotation**: field name used in alert annotation labels.

## Practical advice

- Start with one **Markers and links** layer and get IDs and paths working first.
- Use native Grafana thresholds for the base severity model.
- Use groups mainly for icon and size escalation.
- Add group color overrides only where threshold color is not enough.
- If group results look unexpected, check whether multiple groups match the same node. Mixed icon/color outcomes are valid behavior in Mapgl.
