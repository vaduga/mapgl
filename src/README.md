[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins%2Fvaduga-mapgl-panel&query=%24.downloads&logo=grafana&label=downloads
)](https://grafana.com/grafana/plugins/vaduga-mapgl-panel)
[![GitHub](https://img.shields.io/github/stars/vaduga/mapgl?style=social)](https://github.com/vaduga/mapgl)
[![Discord](https://img.shields.io/discord/973739619118088232?logo=discord&logoColor=%232490D7)](https://discord.gg/DZCAfzYwjC)
[![Telegram Url](https://img.shields.io/badge/Telegram-blue?logo=telegram )](https://t.me/mapgrafana)
[![Change Log](https://img.shields.io/badge/Change-log-blue.svg?style=flat)](https://github.com/vaduga/mapgl/blob/main/CHANGELOG.md)
[![Project Site](https://img.shields.io/badge/Project-site-blue)](https://mapgl.org)
[✉️][email]



Network **Geo map** / **Node Graph** with autolayout and spline edge routing.

Start new panel with a sample node graph to test styles and modes.

Full support for native Grafana field config:  Thresholds, Mappings, Units, Overrides, Data links.

---
### Screenshots

<img
src="https://mapgl.org/img/drilldown.png"
alt="Geomap"
width="600"
/>
<img
src="https://mapgl.org/img/graph0.png"
alt="NodeGraph"
width="600"
/>


---

### Features 

- **Node graph** with layered auto-layout or **Geomap view**
- Webgl GPU-acceleration for rendering large data volumes
- Arc sections on nodes for multiple metrics.
- Multi-segment routes
- Support for parallel routes
- Network interface TX/RX load visualization using bi-metric arcs
- Ad-hoc filtering by layers, node groups in the legend
- Dynamic drill-down data links to external panels

---

### Data Format

<img
src="https://mapgl.org/img/screenshot3.png"
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
