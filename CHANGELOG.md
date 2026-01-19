# Changelog Mapgl

## 2.0.0
- Node Graph with autolayout and spline edge routing that respects node boundary curves. In addition to Geo mode. 
- Arc sections on nodes for any metrics. 
- Style config extends Grafana Geomap styles-from-dimensions concept with overrides for user-defined node groups
- Native Grafana Field config support: Thresholds, Mappings, Units, Overrides, Data links.
- Bi-metric Arcs (ex., for TX/RX)
- Ad-hoc filters by layers, node groups in the legend
- Unified (Graph+Geo) single dataframe for nodes and edges (same as in v.1) avoids hardcoded dataframe requirements of the native Geomap/NodeGraph.
 
## 1.5.11
- Node Graph baselayer made default for new dashboards
- fix normalize zoom for clusters in nodegraph view

## 1.5.0
- draggable namespace polygons in nodegraph view 
- complete traces with aggregation and metrics reducers
- 3d projection for parallel arcs tilt in node graph view.

## 1.4.54
- autolayout tolerates boundary of fixed node size (group config)

## 1.4.53
- nodegraph 2-fragmented links layout fix
 
## 1.4.52
- nodegraph nodes contraction on namespace hide. Adapt bboxes

## 1.4.51
- cluster selection HullPolygon hide on zoom

## 1.4.5
- yandex maps v.3 support in Lite!
- plugin auth options change: 
- a.) auto API call to mapgl.org/api 
- b.) install free Mapgl App as offline authorizer

## 1.4.42 
- fix location search extra fields config (address, etc)

## 1.4.4
- token support for trial & grace periods

## 1.4.32
- feature toggles for LayerSwitcher and Edge legend
- hideable adjacent edges in node tooltip

## 1.4.31
- nested edges list opener

## 1.4.3 
- reducer for parallel edges by min/max/both metrics.

## 1.4.21
- fix: layer filter in node graph mode just contracts nodes. Center hub connections are always visible.

## 1.4.2
- enable right drawer in node graph. Mandatory hide adjacent edges in node tooltip.
- constant node size in Groups
- nested edges list in edge tooltip remastered

## 1.4.1
- hide adjacent edges list in tooltip (duplicates drawer functionality, takes space)
- fix maxZoom 20->21 for baselayers

##  1.4.0
- migrate to EdDSA (Ed25519) crypto for auth and fine-grained feature flags per domain. 

## 1.3.33
- var-nodeId enabled, 
- fix bug on panel dataChanged by dashboard-variables

## 1.3.3 
- merge promo/lite/plus into one plugin with dynamically loaded chunks.

## 1.3.2
- fix range per NS collection phase 

## 1.3.1
- Namespace nodes contraction with inter-namespace edges preserved with offset

## 1.3.0
- Groups section rules processor revised with more reasonable state-machine. 
- Groups apply even with fixed-color mode
- Groups by dataLayer. Does not reduce into common rules 
- Nested Namespaces autogen node graph with recursive visibility control

## 1.2.2
- fix ranges for namespace positions 

## 1.2.1
- fix frameIdx for multiple layers tooltip

## 1.2.0
- non-pickable Polygon layers with displayTooltip=false. Helps to pin the nodes tooltip
- arc color from Group config if node+edge+arc metric fields are the same
- jitterPoints global config in section 'Other'
- render layers by namespaces from field, rather than from datalayers

## 1.1.59

- compatibility patch for Grafana 10.2.0 up to 11.6.0. Grafana intercepts and wraps Promises with zone.js . This patch unwraps it.

## 1.1.58

- fix text labels for arcs with nodegraph basemap
- uni hypergraph for parallel edges with diff namespace nodes offset calc
- fix parentLine for ortho projection 

## 1.1.57

- fix node color style settings (fixed/color/groups)


