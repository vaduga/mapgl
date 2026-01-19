[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins%2Fvaduga-mapgl-panel&query=%24.downloads&logo=grafana&label=downloads
)](https://grafana.com/grafana/plugins/vaduga-mapgl-panel)![GitHub](https://img.shields.io/github/stars/vaduga/mapgl?style=social&#41;]&#40;https://github.com/vaduga/mapgl-community&#41;)
[![Discord](https://img.shields.io/discord/973739619118088232?logo=discord&logoColor=%232490D7)](https://discord.gg/DZCAfzYwjC)
[![Telegram Url](https://img.shields.io/badge/Telegram-blue?logo=telegram )](https://t.me/mapgrafana)
[![Project Site](https://img.shields.io/badge/Project-site-blue)](https://mapgl.org)
[✉️][email]

[//]: # ([![Change Log]&#40;https://img.shields.io/badge/Change-log-blue.svg?style=flat&#41;]&#40;https://github.com/vaduga/mapgl/blob/main/CHANGELOG.md&#41;)

A sample node graph is loaded on every new panel to try out styles and modes
### v1 -> v2 data migration is not required

Version 2.0 introduces a **Node Graph** view with autolayout and spline edge routing. In addition to Geo mode.  

Data model is compatible with v1 **Geo mode**, using the unified dataframe for nodes and edges.  
Panel config schema and UI for styling has been redesigned to be in line with standard Grafana behaviors.

Mapgl now fully supports native Grafana field config:  Thresholds, Mappings, Units, Overrides, Data links.

---
### Screenshots

<img
src="/public/plugins/vaduga-mapgl-panel/img/screenshots/screenshot1.png"
alt="Geomap"
width="900"
/>
<img
src="/public/plugins/vaduga-mapgl-panel/img/screenshots/screenshot2.png"
alt="NodeGraph"
width="900"
/>


---

### Network Topology 

- **Node graph** with layered auto-layout or **Geomap view**
- Arc sections on nodes for any metrics.
- Multi-segment routes
- Network interface TX/RX load visualization using bi-metric arcs
- Ad-hoc filters by layers, node groups in the legend
- Dynamic drill-down data links to external panels

---

### Data Format

<img
src="/public/plugins/vaduga-mapgl-panel/img/screenshots/screenshot3.png"
alt="NodeGraph"
width="900"
/>  

*Field names are examples only.
Unified (Graph+Geo) single dataframe for nodes and edges avoids hardcoded dataframe requirements of the native Geomap/NodeGraph.

Each data source record should contain:

- `node id` and `coordinates` for Geo view (not required for NodeGraph auto-layout)
- `parent id` or a full path with intermediate node IDs or raw coordinates
- `edge id` (optional, used to support parallel links)
- `node status` metric
- `transmit` and `receive` metrics for link load
---

### Data Preparation

Use Grafana’s built-in transformations to prepare and merge data from:

- Zabbix
- Prometheus
- Postgres
- Any other datasource

[Tutorial: Zabbix events on geomap](https://mapgl.org/zabbix)</br>
[Netbox+Prometheus with drill-down datalinks](https://gfn-gp4l-rare.public.nmaas.eu/d/ae996h5rebcw0d/gp4l-topology-mapgl3a-netbox)</br>

---
### 🕹️ Demo

[Playground](https://play.mapgl.org) with open configuration

### Grafana Field Config
- `Thresholds` – value ranges with associated colors to visually indicate status
- `Mapping` – rename displayed values
- `Units` – measurement unit conversion
- `Overrides` – custom settings for specific metrics
- `DataLinks` – links to external dashboards or graphs  
 

  **Node Group style** rules extend control over node color, icon, size, and line width.

---


[email]: mailto:arbitr38@gmail.com
