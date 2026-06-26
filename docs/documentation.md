# Panel configuration

This page focuses on configuring the Mapgl panel in Grafana after your query already returns node and edge data.

Mapgl is a **dual-mode topology panel**, not a geomap-only panel:

- use **abstract node graph mode** when you want automatic topology layout without coordinates
- use **network geomap mode** when you want to place that topology on real map coordinates

The selected **Basemap layer** controls the mode. **Node Graph ortho** means graph mode with no geographic basemap. Any real basemap means Geo mode.

For exact dataframe semantics, deduplication, path handling, namespaces, and precedence rules, see [Reference](reference.md).

## Editor layout

Mapgl panel options are split into a few main areas:

- **Map view**: initial position and zoom.
- **Data layers**: add, select, reorder, or configure overlay layers. For topology data, use **Markers and links**.
- **Basemap layer**: the mode switch and map background settings. **Node Graph ortho** includes autolayout settings.
- **Other**: layer switcher, legends, sizing mode, and alert label options.

Most panel-specific topology work happens inside the **Markers and links** layer.

## Quick setup

1. Choose the mode in **Basemap layer**.
   Use **Node Graph ortho** for automatic graph layout, or choose a map basemap for Geo placement.
2. Add or select a **Markers and links** data layer.
3. If the panel receives multiple query frames, use **Data** to choose which frame feeds the layer.
4. Set **Vertex A** to the field that contains unique node IDs.
5. For Geo mode, make sure the layer has usable location fields.
   Coordinates are not required in graph mode.
6. Set **Vertex B** when rows should create links.
7. Set **Edge ID** when repeated **Vertex A -> Vertex B** links should be rendered in parallel.
8. Set **Edge ID** when you render traces and want each span to keep properties from its own row. Link order should be preserved by the datasource.
9. Configure **Node Styles**, **Edge Styles**, and **Node Groups**.

New graph-mode panels start with a small mock topology until a real **Vertex A** field is configured. This lets you test styles and rendering before a datasource is ready.

## Markers and links layer

This layer renders:

- nodes with colors from **Node Styles**, node groups, and Grafana thresholds
- optional donut-chart sections for multiple node metrics
- auto-layout routed links in graph mode
- direct Arc links with optional side A and side B metrics

### Data model

Mapgl builds nodes and links from the same input records. It does not require one table for nodes and a separate table for edges.

Mapgl is datasource-agnostic. It can work with any Grafana datasource, as long as the final dataframe contains the fields selected in the layer editor.

In practice, this usually means:

- query any datasource supported by Grafana
- use Grafana transformations when needed
- produce a dataframe with node IDs, optional link targets, and optional coordinate fields
- include any additional fields you want to use as node or link properties, metrics, labels, tooltip fields, search fields, or node group match conditions

The processing flow is:

1. Mapgl reads the dataframe and collects nodes from **Vertex A**.
2. After nodes are known, Mapgl makes links from **Vertex B**.
3. Styling, labels, and tooltips are then applied from the properties carried by each record.

This is why a single row can both define a node and create a link from that node to another node.

### Location and identity

These fields define how Mapgl builds the topology:

- **Vertex A**: unique node ID.
- **Vertex B**: target node ID or path array. If set, Mapgl draws links.
- **Edge ID**: optional edge key. Use a unique value for each parallel link that should stay separate. For traces, use it to bind consecutive span rows into one multi-hop edge while each span keeps properties from its own row.
- **Vertex A namespace**: optional namespace for source nodes in graph mode.
- **Vertex B namespace**: optional namespace for target nodes in graph mode.
- **Search by**: extra fields included in the panel search text.

Coordinates are not required for graph mode. They are only needed when you want Geo placement instead of auto-layout.

### Links and paths

For a simple link, set **Vertex B** to the target node ID.

For routed paths, **Vertex B** can contain a path array. Use this when the link should pass through intermediate nodes or coordinate waypoints. Exact path grammar is documented in [Reference](reference.md).

### Parallel links

Use **Edge ID** when the same **Vertex A -> Vertex B** pair can appear more than once and should stay as separate links.

Each parallel link needs its own **Edge ID** value. If repeated rows use the same edge key, Mapgl treats them as the same logical link.

In the open-source panel, parallel edge offset rendering is available in **abstract node graph** mode.

### Trace and service graph edges

For service dependency graphs and trace-like data, use **Vertex B** as the service path and **Edge ID** as the trace or branch key. Consecutive rows with the same **Edge ID** are bound into one multi-hop edge, and each span keeps styling and tooltip properties from the row that provided that span.

For example, a trace layer can use:

- **Vertex A**: source service
- **Vertex B**: service path, such as `["api-gateway", "order-service", "payment-service"]`
- **Edge ID**: trace branch ID shared by the consecutive span rows for that branch
- extra fields: duration, status, span IDs, method, cost, or other per-span properties

In graph mode, Mapgl expands trace rows into routed edge fragments. The shared **Edge ID** keeps the trace branch together as one multi-hop edge, while each span keeps the row properties from the record that created that span. Fields such as duration or cost can appear in edge tooltip.

## Node styles

Use **Node Styles** for the base appearance of nodes:

- **Size**: fixed value or numeric field-driven sizing.
- **Color**: fixed value or field-driven color with native Grafana thresholds.
- **Fill opacity**
- **Text label**
- **Arc sections**: extra metric segments when your topology uses them.

This is the foundation for group escalation. Node groups do not replace Grafana field config. They build on top of it.

## Node groups

Node groups are the most specific styling system in Mapgl. A group can define:

- legend label
- SVG icon
- color override
- fixed node size
- fixed line width
- icon render mode
- matching rules

Turn on **Node Groups -> Apply** to use configured group rules.

### Matching

Each group contains one or more match conditions. A condition can target:

- any query field from your dataframe
- the special **`thrColor`** field

`thrColor` is an internal value injected by Mapgl during rendering. You do not create a dataframe field with that name.

It is derived from the current node color result, usually from the node metric field and native Grafana thresholds.

Group resolution is cascading. In short:

- **Node Styles** establish the base color, size, and label behavior
- matching groups can provide icons, fixed sizes, fixed widths, and color overrides
- color can come from a different matching group than the icon
- if no matching group provides a color override, Grafana threshold color remains in effect

Exact precedence and matching rules are documented in [Reference](reference.md).

### Icon render mode

`icon render mode` controls whether the selected SVG icon should stay unchanged or be recolored from the resolved node color.

Available modes:

- **None**: use the original icon colors from the SVG file.
- **Markup recolor**: rewrite SVG `fill` and `stroke` values in the markup and replace them with the resolved color.
- **Canvas tint**: draw the icon to a canvas and tint the rendered pixels with the resolved color.

Use **Markup recolor** for simple SVG icons that should become clean single-color icons. Use **Canvas tint** when markup replacement is unreliable but rendered-pixel tinting looks correct. Use **None** when the icon should preserve its original multicolor artwork.

### Recommended pattern

For most dashboards, the cleanest setup is:

1. Use **Node Styles -> Color** with a metric field and Grafana thresholds.
2. Add node groups that match on **`thrColor`** for severity-aware behavior.
3. Add extra field matches such as site, role, vendor, or status class when you need more specific icons or sizing.
4. Only set **group color** when you intentionally want to override threshold color.

### Example

Assume:

- node color metric is `severity`
- Grafana thresholds make `severity=0` green, `1` yellow, `2` red
- group `Routers` matches `role=router` and sets icon `router`
- group `Critical` matches `thrColor=red` and sets color `red`

Result:

- a healthy router gets the **router icon** from `Routers`
- a critical router gets the **router icon** from `Routers`
- the same critical router gets the **red color** from `Critical`
- a non-router critical node still stays **red** because thresholds already resolved it red

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

## Node Graph ortho autolayout options

These settings are shown in **Basemap layer** when **Node Graph ortho** is selected:

- **Edge routing**: choose **Splines** for `SugiyamaSplines` or **Rectilinear**.
- **Layout direction**: choose the layer flow direction: right-to-left, left-to-right, top-to-bottom, or bottom-to-top.
- **Layer separation**: distance between adjacent layout layers. In the default right-to-left layout this mostly changes horizontal spacing and edge length.
- **Node separation**: distance between nodes within the same layout layer. In the default right-to-left layout this mostly changes vertical spacing.

## Practical advice

- Start with one **Markers and links** layer and get **Vertex A** and **Vertex B** working first.
- Use native Grafana thresholds for the base severity model.
- Use groups mainly for icon and size escalation.
- Add group color overrides only where threshold color is not enough.
- Use unique **Edge ID** values for parallel links.
- If group results look unexpected, check whether multiple groups match the same node. Mixed icon/color outcomes are valid behavior in Mapgl.
