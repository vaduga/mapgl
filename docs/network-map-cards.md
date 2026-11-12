# Network maps: ELK layout, node cards and line labels

An optional Kubernetes-aligned network map enhancements on top of the Node Graph ortho basemap:
a layered layout across namespace boxes (nodes inside boxes follow the flow), nodes drawn as cards that
show their numbers, and labels along each line that do not pile up.

![Network map with node cards (demo data)](src/img/screenshots/screenshot1.png)

The demo dashboard is `provisioning/dashboards/mapgl_network_cards.json` (TestData CSV, no
datasource needed). It has the same seven frames a Prometheus-backed map returns.

## What changes

| Feature | Option | Default |
|---|---|---|
| ELK layered layout | Basemap: **Layout engine** = ELK (`basemap.config.layoutEngine: "ELK"`) | MSAGL |
| Node cards | Basemap: **Node cards** (`basemap.config.nodeCards: true`) | off |
| Template text | Style text: **Template** (`text.mode: "template"`, `text.fixed: "${field}…"`) | — |
| Moving pulses on routed lines | Edge Styles **Animate** (`edgeStyle.animate: true`), following Arrow | off |
| Labels at both ends and in the middle of routed lines | arcStyle sideA / sideB text with `showStat2: true`, edgeStyle text | — |

### ELK layout

ELK `layered` lays out the whole graph at once (`INCLUDE_CHILDREN`), so nodes inside a namespace
box take part in the left-to-right flow instead of being packed box by box. **Edge routing**
Rectilinear gives orthogonal lines; Splines gives curves. **Layout direction**, **Layer
separation** and **Node separation** apply to the root and to every box (ELK does not inherit
spacing into boxes).

A hub with many callers would put them all in one column, far taller than the panel is wide.
The layering caps a column at `max(4, ceil(sqrt(nodes)))` nodes (Coffman-Graham), and node
placement uses network simplex, so callers spread over a few columns.

### Node cards

Each node is drawn as a box sized to its text, edged in its group colour (falling back to the
node colour). Lines start and end on the card border, not on a circle. Cards and their text
belong to the same layer group as the labels, so a card never hides another card's text.

Card size, in layout units: width = longest line × font size × 0.6 + 20, height = lines × font
size × 1.2 + 10. Non-ASCII characters (such as ↑ ↓) count as 1.7 characters.

### Template text

Text mode **Template** fills `${field name}` with the field's display value (unit, decimals and
mappings applied), from the node's row. Use `\n` for more lines:

```json
"text": {"mode": "template", "fixed": "${src_label}\n↑ ${Value #F}  ↓ ${Value #G}"}
```

### Line labels (routed mode)

With the `$routed` dashboard variable set to 1, lines follow the layout. Each line carries:

- arcStyle **sideA** text next to the source end and **sideB** text next to the target end
  (`showStat2: true` turns on the per-side style), for example what each end sent;
- edgeStyle text in the middle, drawn as a badge in the line colour (for example a deny count).

Configure each side through **Arc Styles -> Side A / Side B -> Text label** and **Font size**. Text may use a different field from Color. Focus reveals all configured labels regardless of **Edge labels always on**; that option controls idle labels.

A line too short for three labels side by side gets them stacked at its middle; the end labels
then get an arrow for their direction (`→ 3.40 Mb/s`, `← 19 Mb/s`). All labels are then placed
once for the whole map: middle badges first, each label takes its first free spot along its
line (clear of cards and of labels already placed), and an unfocused label with no free spot is dropped. Focused labels receive priority and a stacked fallback.
An empty or blank text (for example a value mapping of 0 to `" "`) draws nothing.

Arrow heads are capped at 16 layout units, so thick lines keep small arrows.

## Data shape

One `merge` transformation joins the frames. Node rows come first: a node takes its values
from its first row.

| Frame | Rows | Fields |
|---|---|---|
| C | one per node | `src_id`, `src_label`, `src_kind` (group), `src_box` (namespace box; `.` nests, as in `outside.EU`), value |
| A | one per line | `src_id`, `dst_id`, `edge_id`, `src_box`, `dst_box`, bit/s (line width) |
| B | one per line | same keys, deny count (line colour and middle badge) |
| D / E | one per line | same keys, what the source / destination sent (sideA / sideB text) |
| F / G | one per node | `src_id`, what the node sent / received (card text) |

F and G rows carry only `src_id`, so merge adds them to the node's row. Return them only for
nodes in C, or merge makes a new node for each extra row.

## Example panel options

```json
"basemap": {"type": "blank", "config": {
  "layoutEngine": "ELK", "nodeCards": true, "edgeRouting": "Rectilinear",
  "layoutDirection": "LR", "layerSeparation": 150, "nodeSeparation": 20}},
"dataLayers": [{"type": "markers", "locField": "src_id", "parField": "dst_id",
  "optional": {"edgeId": "edge_id", "vertexA_NS": "src_box", "vertexB_NS": "dst_box", "nsSeparator": "."},
  "config": {
    "style": {"text": {"mode": "template", "fixed": "${src_label}\n↑ ${Value #F}  ↓ ${Value #G}"},
              "textConfig": {"fontSize": 12}, "useGroups": true},
    "edgeStyle": {"animate": true, "arrow": 1, "size": {"field": "Value #A", "min": 1, "max": 10},
                  "color": {"field": "Value #B"}, "text": {"mode": "field", "field": "Value #B"}},
    "arcStyle": {
      "sideA": {"text": {"mode": "field", "field": "Value #D"}, "color": {"field": "Value #D"}},
      "sideB": {"text": {"mode": "field", "field": "Value #E"}, "color": {"field": "Value #E"}}},
    "showStat2": true}}]
```

The demo dashboard holds the full panel JSON, including the overrides for units and colours.

## Tests

`npm run test:ci` covers the card box size, edges ending on card borders, hub spreading, label
placement, stacking and declutter, and template text (`elk-layout.test.ts`,
`layout-geometry.test.ts`, `route-labels.test.ts`, `text.test.ts`).
