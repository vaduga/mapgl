# @vaduga/mapgl-grafana-adapter

Public Grafana integration for `@vaduga/mapgl-core`, shared by OSS and extended plugin shells. This package depends on core; core never imports the adapter. Extentions code is supplied through feature registration and host service closures.

Ownership includes DataFrame capture and binding, native matchers and location discovery, field configuration and display processors, mappings/thresholds/themes, gauge formatting, plugin factory, native editors, tooltip/data-link/legend UI, options/events, annotations/time, native providers, and Grafana-served resources.

`GrafanaGraphPipeline` captures datasource values under a revision, binds neutral topology sources, compiles source-scoped visual channels, and updates its neutral `controller`. Its accepted `sourceResolver` resolves native primary/contributing rows only for the exact committed revision. Core receives indexed source views and compiled channels, never native fields or DataFrames. Display processing does not modify host source fields.

`MapPanelRuntime` composes that pipeline with Grafana integration. Source work starts before viewport attachment. Subscriptions and store connections run after React commit, reconnect explicitly, and dispose with their generation. Worker and icon resources belong to the panel instance. Both editions retain native saved-panel settings.

Grafana annotation/time behavior remains optional and platform-specific. It produces `overlayColor` plus opaque `metadata.grafanaAnnotations`; shared render primitives consume only prepared colors. No Perses annotation substitute is required or implemented.

OSS plugin builds directly from both workspace packages. `npm run core:pack` creates content-hashed archives for both packages;

`GrafanaGraphPipeline` accepts one ordered layer array and compiles each layer once. `MapPanelRuntime` supplies commit preparation to the controller; it owns host resources, while the controller publishes the accepted scene and status. Fullscreen portal relocation is Grafana DOM behavior and lives here.

`GrafanaRuntimeSubscriptions` uses the core lifecycle controller with the native context type directly. Graph subscriptions remain revision-scoped; panel bindings and enabled transports retain their independent lifetimes. No graph-keyed native-context registry is needed.

Render orchestration belongs to core. The Grafana adapter translates native layers into neutral secondary descriptors, translates legend actions into scene commands, and resolves tooltip/source rows through native provenance. Both Grafana shells use `PanelRenderSession` and `render/react` directly; neutral render utilities are no longer forwarded through this adapter. Native annotations publish copied effective buffers under their captured scene generation.
