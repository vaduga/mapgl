# Changelog Mapgl

## 2.6.1
- fix: same-query layers and no-refId queries no longer panic due to positions buffer under-allocation
 
## 2.6.0
- auto-layout via Web Worker with shared memory for a non-blocking UX and no JSON-passthrough overhead
- refactor: types relocated, graph imports moved to the Web Worker, leaving only a thin shim in the main bundle  

## 2.5.0
- adjacent edges list in tooltip.
- graph highlighter via shader mask for instant nodes/edges picking.
- FIX: cross-namespace edges with > 1 segment

## 2.4.0
- edge routing modes: SugiyamaSplines/Rectilinear
- edge curve interpolation on GPU shaders

## 2.3.0
- icon color tint config for Node Groups [#8](https://github.com/vaduga/mapgl/issues/8)
- adhoc node group filter in the legend. GPU-fast
- SVGs (raw/donut) resampled for highres, boxed into circle boundaries. Simplify group rules (rm icon size)
- text labels offset from circle boundary (not from center point).

## 2.2.0
- namespace subgraphs support. Make your graph more branchy.
- revamped Group rules section [#6](https://github.com/vaduga/mapgl/issues/6)
- fix: group rules threshold options sync with node metric field [#5](https://github.com/vaduga/mapgl/issues/5)
- fix: scale on zoom for arrows and arc labels. Better arrow tips positioning.

## 2.1.0
- align styles with Grafana theme tokens. Theme support for widget buttons.
- hot patch for upstream FolderPickerTab **Grafana 12.4.0.** (No portal popups [#119187](https://github.com/grafana/grafana/issues/119187))
- robust svg loading for edge arrows under stricter Grafana environments (**v11.2.0**)
- update field pickers and matchers from Grafana core

## 2.0.1
- arrows config for edges in 'routed' view mode
- parallel edges support for arcs/hyperedges in nodegraph view
- cut edges at node boundary ports to prevent overlapping with semi-transparent nodes.
- show head node id in edge tooltip
- enlarge picked arc, edge

## 2.0.0
- Node Graph with autolayout and spline edge routing that respects node boundary curves. In addition to Geo mode.
- Arc sections on nodes for any metrics.
- Style config extends Grafana Geomap styles-from-dimensions concept with overrides for user-defined node groups
- Native Grafana Field config support: Thresholds, Mappings, Units, Overrides, Data links.
- Bi-metric Arcs (ex., for TX/RX)
- Ad-hoc filters by layers, node groups in the legend
- Unified (Graph+Geo) single dataframe for nodes and edges (same as in v.1) avoids hardcoded dataframe requirements of the native Geomap/NodeGraph.
- v1 -> v2 data migration is not required

## 1.6.1
- fix labels in thresholds config to work with Tooltip component since Grafana 10.3.0
- fix tooltip css classes for pointerEvents:all

## 1.6.0
- cluster legend-filter
- fullscreen and compass widgets

## 1.5.0
- point circle and text label dimensions
- svg icon rules collapsible + resource picker
- bugfix: cluster hull polygon onHover doesn't lag on large datasets

## 1.4.0
- alerting states from built-in Grafana annotations query. State colors for nodes and clusters
- see-through convex hull polygon for cluster area

## 1.3.0
- cluster max zoom menu select to control clusterization
- convex hull polygon shows cluster boundaries, cluster expansion zoom on click
- restore Grafana >=9.2.5 support
- fix performance issues with composite sublayers constantly recalculating. IconGeoJsonLayer (circles+icons+text) has been separated from IconClusterLayer

## 1.2.0
- svg icons for nodes
- text labels with collision filter.
- bug fixes: allow lineWidth custom size, no min/max

## 1.1.0
- Multi-source, multi-target support
- Switch path direction by declaring dashboard variable 'locRole'.
- Data-links: icon in tooltip to sets values for 'target' and 'source' dashboard variables.  
- Comment icons from specs inlined in intermediate coordinates (ex.: [37.560447,55.550818, 0, "comment", "green"])
- Aggregation nodes and offset for overlapping lines.
- stat1/stat2 switch to disable offset and show secondary metric
- edge labels in stat2 mode , aggregation nodes labels.

## 1.0.2
- Parent path as an array of coords or location IDs
- Aggregation nodes and offset for overlapping lines.
- Extended dotted line path to root.
- Bug fixes: isolate config options for different layers;

## 1.0.1
- Multi layers support
- PolygonsLayer, Path (LineStrings) layer from query
- Static GeoJson layer with FeatureCollection support from GeoJson file (url)
- Advanced thresholds processor for node group styles.
- Points show toggle

## 1.0.0
Initial release.
