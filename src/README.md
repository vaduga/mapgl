[//]: # ([![GitHub]&#40;https://img.shields.io/github/stars/vaduga/mapgl?style=social&#41;]&#40;https://github.com/vaduga/mapgl&#41;)
[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins%2Fvaduga-mapgl-panel&query=%24.downloads&logo=grafana&label=downloads)](https://grafana.com/grafana/plugins/vaduga-mapgl-panel)
[![Project Site](https://img.shields.io/badge/Project-site-blue)](https://mapgl.org)
[![Discord](https://img.shields.io/discord/973739619118088232?logo=discord&logoColor=%232490D7)](https://discord.gg/DZCAfzYwjC)
[![Telegram Url](https://img.shields.io/badge/Telegram-blue?logo=telegram)](https://t.me/mapgrafana)
[![YOUTUBE](https://img.shields.io/youtube/channel/subscribers/UCxjo9tNt0ApLBpB46m49wvw)](https://www.youtube.com/@mapgraf)
[✉️][email]

[//]: # '[![Change Log](https://img.shields.io/badge/Change-log-blue.svg?style=flat)](https://github.com/vaduga/mapgl/blob/main/CHANGELOG.md)'

Start a new panel with a mock node graph to test styles and modes.

---

### Node graph for metrics and traces

- Layered auto-layout and Geomap view
- Multi-step and parallel-edge routing
- Arc segments on nodes for visualizing multiple metrics
- TX/RX interface load visualization with dual-metric arcs
- Ad hoc filtering by layer and node group through the legend
- WebGL-accelerated rendering for large datasets
- Dynamic drill-down links to external panels
- Distributed tracing paths with per-span properties
- Namespace-based subgraphs

---

### 🕹️ Demo

[Playground](https://play.mapgl.org) with open configuration

---

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

### Data Format

<img
src="https://mapgl.org/img/screenshot3.png"
alt="Dataframe"
width="800"
/>

*Unified dataframe model for nodes and edges. Field names are examples only; Mapgl does not require fixed field names.  

See [Panel configuration](https://mapgl.org/documentation) for setup details and dataframe usage.

---

### Data Preparation

Use Grafana’s built-in transformations to prepare and merge data from:

- Zabbix
- Prometheus
- Postgres
- Any other datasource

[Netbox + Prometheus with drill-down](https://gfn-gp4l-rare.public.nmaas.eu/d/ae996h5rebcw0d/gp4l-topology-mapgl3a-netbox)</br>
[Netbox to Mapgl automation](https://github.com/hamptik/netbox2mapgl)</br>
[Zabbix events on geomap](https://mapgl.org/zabbix)</br>

---

### Field Config
Full support for native Grafana field config:


- `Thresholds` – value ranges with associated colors to visually indicate status
- `Mapping` – rename displayed values
- `Units` – measurement unit conversion
- `Overrides` – custom settings for specific metrics
- `DataLinks` – links to external dashboards or graphs

  **Node Group style** rules extend control over node color, icon, size, and line width.

---

[email]: mailto:arbitr38@gmail.com
