[//]: # ([![Project Site]&#40;https://img.shields.io/badge/Project-site-blue&#41;]&#40;https://mapgl.org&#41;)
[![Downloads](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgrafana.com%2Fapi%2Fplugins%2Fvaduga-mapgl-panel&query=%24.downloads&logo=grafana&label=downloads)](https://grafana.com/grafana/plugins/vaduga-mapgl-panel)
[![Discord](https://img.shields.io/discord/973739619118088232?logo=discord&logoColor=%232490D7)](https://discord.gg/DZCAfzYwjC)
[![Telegram Url](https://img.shields.io/badge/Telegram-blue?logo=telegram)](https://t.me/mapgrafana)
[![YOUTUBE](https://img.shields.io/youtube/channel/subscribers/UCxjo9tNt0ApLBpB46m49wvw)](https://www.youtube.com/@mapgraf)
[![GitHub](https://img.shields.io/github/stars/vaduga/mapgl?style=social)](https://github.com/vaduga/mapgl)
[✉️][email]

[//]: # '[![Change Log](https://img.shields.io/badge/Change-log-blue.svg?style=flat)](https://github.com/vaduga/mapgl/blob/main/CHANGELOG.md)'

Start a new panel with a mock node graph to test styles and modes.


---

### Features

- **Node graph** with layered auto-layout or **Geomap view**
- Namespace subgraphs for a distributed graph.
- Webgl GPU-acceleration for rendering large data volumes
- Arc sections on nodes for multiple metrics.
- Multi-segment routes
- Support for parallel routes
- Network interface TX/RX load visualization using bi-metric arcs
- Ad-hoc filtering by layers, node groups in the legend
- Dynamic drill-down data links to external panels


---

### 🕹️ Demo

[Playground](https://play.mapgl.org) with open configuration

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

### Data Format

<img
src="https://mapgl.org/img/screenshot3.png"
alt="NodeGraph"
width="900"
/>

*Unified dataframe model for nodes and links. Field names are examples only; Mapgl does not require fixed field names.  

See [Panel configuration](https://mapgl.org/documentation) for setup details and dataframe usage.

---

### Data Preparation

Use Grafana’s built-in transformations to prepare and merge data from:

- Zabbix
- Prometheus
- Postgres
- Any other datasource

[Netbox+Prometheus with drill-down datalinks](https://gfn-gp4l-rare.public.nmaas.eu/d/ae996h5rebcw0d/gp4l-topology-mapgl3a-netbox)</br>
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
