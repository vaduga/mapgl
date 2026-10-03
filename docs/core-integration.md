# Core and Grafana integration

MapGL ships two public packages. `@vaduga/mapgl-core` contains platform-neutral graph, visual, runtime, interaction, and render code. `@vaduga/mapgl-grafana-adapter` contains native Grafana data binding, field processing, plugin construction, UI, services, and panel integration. OSS plugin shell consumes both; extension plugin shells may additionally register extended capabilities. The dependency direction is adapter to core. Public packages never depend on extension code.

## Source contract

`GraphSource` is an ordered, immutable revision of indexed columns and positions. A property name identifies a column; a row reference contains revision, source key/index, row index, and optional layer index. Hosts retain native provenance themselves. Canonical core normalization resolves node identity, namespaces, routes, repeated edge units, cross-source targets, packed storage, and diagnostics. Paths/polygons/GeoJSON and basemaps reach shared presentation as prepared geometry; fetching, variables, native bindings and editors stay in the integration.

The Grafana adapter captures column values before asynchronous binding. Bound topology and visual compilation borrow that capture. `GrafanaSourceResolver` rejects obsolete references, including an old row index reused by a new frame. Primary and contributing unit references retain their own provenance.

## Visual contract

Compiled channels carry source scope and property identity; native field ranges remain in compiler closures. Their outputs are colors, text, numbers, symbols and optional gauge fractions/stops. The adapter resolves native mappings, thresholds, field overrides, formatting, palette names and theme colors. It caches gauge stops and display processors for the compiled source/configuration. No native field object is attached to a channel.

Core combines these outputs with MapGL rules, groups and scaling. Min/Max direction, clamping, capacity fallbacks, independent dimensions and per-unit visuals remain shared behavior. Theme/configuration changes recompile presentation. Effective node radius and arrow geometry participate in layout signatures.

## Runtime and ownership

`PanelController` owns the concrete MapGL pipeline, accepted/effective scene publication, status and neutral Point/View stores. Its input is one ordered array of prepared layers; each layer binds source roles, graph settings and compiled visuals, and visual recompilation returns that same ordered configuration array. Generic stage machinery stays inside the concrete controller: there is no separate GraphRuntime publication bridge or duplicate accepted state/status in the adapter. Hosts provide prepared results, preparation/layout/render stages and resources, and observe committed read models and semantic notifications. Host configuration uses the `host` command origin; user commands emit notifications. Grafana bindings compose controller-owned interaction/viewport state with native events, legend entries, tooltip provenance and time behavior. Host and extension services supply native events and resources. Extensions receive narrow service readers; edit persistence and transports remain integration-owned.

`GraphScene` owns effective rendering separately from the accepted pipeline baseline. Renderers, geometry, and interaction readers use its graph, positions, visual buffers, projection, visibility, and layout together. Edits and namespace projection can differ from the query baseline without rewriting packed topology; the controller owns scene publication. Position edits copy borrowed baseline positions before writing. Scene transactions publish one coherent revision; generation checks reject updates targeting a replaced or cleared scene. The React panel owns native integration resources and composes these services. Both `Mapgl.tsx` files and their render orchestration remain unchanged. Existing store getter names used by those consumers remain; duplicate writable aliases were removed, leaving one read spelling and explicit selection actions. A wholesale naming migration belongs with future renderer work.

Geometry receives explicit graph, position, layout, route, projection, and provider inputs. Host bindings receive explicit controller, scene, native configuration and resource readers. The layer switcher issues visibility commands; it does not calculate or publish namespace projections. There is no panel-shaped compatibility context.

Updates prepare candidate graph decoration, visual buffers and layout before publication. A compatible visual-only update borrows immutable packed topology. Geometry changes decorate a candidate graph. Stale generations cannot commit, fatal failures retain the accepted rendering, and valid empty input commits an empty state. Native integration services own workers, icons, transports and extension-engine cleanup. Worker waits, SVG fetches and providers honor cancellation; generation checks also reject late results.

Live metric updates form sparse revision-scoped overlays. They never write native DataFrame cells or packed topology. Query and live updates share the evaluator. Live patches retain unrelated visuals and geometry; query refreshes recompute range-dependent peers. Concurrent metric updates coalesce, and a new accepted query clears previous overlays. Extension edit overlays retain separate persistence and projection ownership.

Extension clustering reads graph, positions, annotations and filters from the provider context, and engine/WASM from its service reader. Jitter consumes prepared position ranges and bounds. Resolved live metric patches are applied beside the extension runtime; the Grafana binding resolves saved fields, formats time and manages host lifetimes. Typed subscription lifecycle methods accept native contexts directly, without a graph-keyed context registry.

## Integration resources and React

`MapglViewport` receives `mapLibreAssets: { moduleUrl, workerUrl }`; `GeoBasemap` receives the same values as `assets`. The Grafana adapter's `getMapLibreAssets()` resolves these URLs from the deployed plugin public path. Other hosts supply their own asset URLs. Preserve MapLibre's three native ESM assets and alias react-maplibre's unused package fallback to `components/maplibre-gl-fallback`; bundling its shared module while also copying it for the worker duplicates that functionality.

Core worker clients and icon management receive injected resource factories/loaders. The Grafana adapter resolves Grafana public paths and owns worker/blob cleanup. Provider setup occurs in committed React effects with cleanup/reconnect. Graph computation starts independently of viewport attachment. A disposed panel integration recreates its resource/controller generation during setup/cleanup/setup.

## Other platforms

Grafana annotations, alert interpretation, time events and annotation tooltips remain Grafana-only. They supply optional prepared overlay colors and opaque metadata. A host without annotations needs no replacement API.

Perses adapters are deferred. Future work should bind Perses query results into source views, compile its own presentation settings, translate semantic actions and supply resources/providers. These contracts support that work without promising substitutes for every Grafana facility.

## Verification and packaging


Run `core:check-isolation` after building core to audit imports, emitted declarations, export targets and package metadata. `core:check-consumer` checks every entry point in an isolated installation containing no Grafana or adapter package and runs a neutral controller/render example. The isolated consumer constructs MapGL binary node collections and the MapGL node-layer factory without Grafana installed, establishing a usable platform boundary. The check selects WebGL-only graphics exports and accounts only for MSAGL's existing TypeScript 6 `PointSet` iterator declaration mismatch.

`core:pack` builds both public packages in dependency order and reports content-hashed archives. OSS can build independently, with no packaging.
