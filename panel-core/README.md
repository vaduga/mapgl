# @vaduga/mapgl-core

Shared MapGL topology, visual composition, runtime, and deck.gl presentation. This package has no Grafana SDK, DataFrame, datasource, native UI, or adapter dependency. Its TypeScript configuration is standalone.

Hosts bind immutable, ordered `GraphSource` views with indexed node/target/namespace columns, positions, property access, and a source revision. `normalizeGraphSources` owns graph identity, route resolution, packed relations, provenance, and bounded diagnostics. A row reference is valid only for its source key, index, and revision.

Hosts compile `GraphStyleChannels`: colors, formatted text, numeric sizes, symbols, and optional gauge inputs. Channels carry source scope and property identity; native compiler closures own field ranges. Core owns MapGL scaling, rule/group precedence, per-unit edge composition, layout invalidation, and GPU attributes. Native field configuration objects remain in host compiler closures.

`PanelController` owns a concrete MapGL pipeline, its accepted/effective `GraphScene`, status, and neutral Point/View stores. There is no separate graph-publication bridge. It accepts an ordered `GraphPipelineInput.layers` array of options, bound sources, build settings and compiled visual configuration; recompilation returns one configuration per layer. It stages updates, exposes `state` and `view`, emits semantic notifications, and supports `select`, `setViewport`, `patchMetrics`, `invalidateGeometry`, `clear`, and `dispose`. Pass `origin: 'host'` to selection/viewport commands when applying host configuration to avoid action echoes. Selection uses semantic keys across graph replacement.

Metric overlays are sparse, revision-scoped values over an immutable query baseline. Query/live values use the same evaluator. Live patches update affected rows and matching outgoing edges while retaining graph, layout, positions and unrelated visuals; a query refresh recalculates all peers. A new accepted baseline clears overlays; obsolete references and topology-role updates are rejected. Compatible color/text changes reuse layout; changed effective radius/arrow geometry invalidates it.

Inject layout-worker creation through `LayoutWorkerClient`, and icon loading through `SvgIconManager`. Providers use revision-scoped neutral contexts with cancellation and disposal. Native workers, icons, transports and extension engines own their resource lifetimes. Late results cannot publish into a disposed generation.

The Grafana plugin uses the separate `@vaduga/mapgl-grafana-adapter` package. Annotation queries, alert states, time behavior, data links, native field processing, and editors belong there. Core accepts optional prepared overlay colors and opaque host metadata.

The public Perses adapter in `../mapgl-perses/perses-adapter` binds JSON sources and owns its controller/worker session. Both Grafana editions and Perses use the same core render session. Core does not reproduce native field-processing APIs.

See [the standalone integration example](examples/neutral.ts) and [integration documentation](../docs/core-integration.md). Verification from the OSS repository:

```sh
npm run build --workspace @vaduga/mapgl-core
npm run core:check-isolation
npm run core:check-consumer
```

The consumer check copies neutral dependencies into a temporary installation, checks every published declaration, and exercises normalization, visuals, overlays, the shared render session/default factories, focus and copy-on-write without Grafana, Perses SDKs or private packages installed.

## Render lifetime

`@vaduga/mapgl-core/render/graph` captures effective scene inputs and prepares named routed/arc geometry, renderer indexes, binary collections, bounds and comments. `buildPrimaryLayers` owns node/placeholder/label, edge/arrow/arc and bound composition. Settings are explicit neutral values; factories receive no native panel, saved options or theme object. Narrow node/edge/bounds substitutions and prepared bundle contributions support private editions.

`@vaduga/mapgl-core/render/session` exports `PanelRenderSession`. It observes scene commands, selection, mode and focus, publishes coherent displayed frames, and sequences full and instant requests together. Freshness checks cover scene generation, effective render revision, edge-index revision, presentation revision, cancellation and disposal. Failed candidates retain the displayed frame; accepted empty scenes retain optional secondary geometry. Decode picks through the displayed frame before applying semantic commands to the current controller. Source-row resolution remains adapter-owned and rejects expired revisions.

Positions and overlays use targeted copy-on-write. `GraphEdgeIndex.snapshot()` shares packed arrays behind a stable read header; index mutations replace affected tables, and metric edits copy their table once while it is shared. Renderer mappings live with the prepared frame and accepted PointStore indexes, never on graph edges. Focus and transient hull/center layers reuse prepared geometry and binary collections.

React consumers use `usePanelRenderSession(controller, options)` from `render/react`; an integration that owns its renderer uses `useRenderFrame(renderer)`. Memoize the typed options object with consumed presentation/resource inputs, keep preparation options stable, and issue scene commands for geometry/visibility changes. The binding observes the options object directly; there is no separate dependency-list argument. Publication must not become an input dependency. SVG state retains object identity until a resource revision changes. The renderer disposes only its subscriptions and explicitly owned contributions; the caller owns controller, worker, icons and canvas.
