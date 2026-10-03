# @vaduga/mapgl-core

Shared MapGL topology, visual composition, runtime, and deck.gl presentation. This package has no Grafana SDK, DataFrame, datasource, native UI, or adapter dependency. Its TypeScript configuration is standalone.

Hosts bind immutable, ordered `GraphSource` views with indexed node/target/namespace columns, positions, property access, and a source revision. `normalizeGraphSources` owns graph identity, route resolution, packed relations, provenance, and bounded diagnostics. A row reference is valid only for its source key, index, and revision.

Hosts compile `GraphStyleChannels`: colors, formatted text, numeric sizes, symbols, and optional gauge inputs. Channels carry source scope and property identity; native compiler closures own field ranges. Core owns MapGL scaling, rule/group precedence, per-unit edge composition, layout invalidation, and GPU attributes. Native field configuration objects remain in host compiler closures.

`PanelController` owns a concrete MapGL pipeline, its accepted/effective `GraphScene`, status, and neutral Point/View stores. There is no separate graph-publication bridge. It accepts an ordered `GraphPipelineInput.layers` array of options, bound sources, build settings and compiled visual configuration; recompilation returns one configuration per layer. It stages updates, exposes `state` and `view`, emits semantic notifications, and supports `select`, `setViewport`, `patchMetrics`, `invalidateGeometry`, `clear`, and `dispose`. Pass `origin: 'host'` to selection/viewport commands when applying host configuration to avoid action echoes. Selection uses semantic keys across graph replacement.

Metric overlays are sparse, revision-scoped values over an immutable query baseline. Query/live values use the same evaluator. Live patches update affected rows and matching outgoing edges while retaining graph, layout, positions and unrelated visuals; a query refresh recalculates all peers. A new accepted baseline clears overlays; obsolete references and topology-role updates are rejected. Compatible color/text changes reuse layout; changed effective radius/arrow geometry invalidates it.

Inject layout-worker creation through `LayoutWorkerClient`, and icon loading through `SvgIconManager`. Providers use revision-scoped neutral contexts with cancellation and disposal. Native workers, icons, transports and extension engines own their resource lifetimes. Late results cannot publish into a disposed generation.

The Grafana plugin uses the separate `@vaduga/mapgl-grafana-adapter` package. Annotation queries, alert states, time behavior, data links, native field processing, and editors belong there. Core accepts optional prepared overlay colors and opaque host metadata.

Perses implementation is deferred. A future adapter must bind sources, compile presentation channels, connect semantic actions, and provide its resources and transport integrations. Core does not reproduce Grafana's field-processing APIs.

See [the standalone integration example](examples/neutral.ts) and [integration documentation](../docs/core-integration.md). Verification from the OSS repository:

```sh
npm run build --workspace @vaduga/mapgl-core
npm run core:check-isolation
npm run core:check-consumer
```

The consumer check constructs real MapGL binary node collections and the MapGL node layer, and copies only neutral dependencies into a temporary installation, checks every published declaration, and exercises normalization, visuals, overlays, lifecycle, and render-layer composition without Grafana installed.
