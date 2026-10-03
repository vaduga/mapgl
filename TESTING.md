# Testing

`npm run test:ci` checks public source, test, helper and example dependencies before running Jest. Core tests use neutral data; adapter tests cover Grafana frame binding, formatting and lifecycle behavior. Keep unique numerical, ownership, disposal, stale-work and provenance checks close to their source. Consumer-specific implementations and fixtures belong in their consumer repository.

Run the source checks and frontend build with:

```sh
npm run test:ci
npm run typecheck
npm run lint
npm run build
```

For the compiled neutral consumer, build the local core first, then run its existing isolation checks:

```sh
npm run build --workspace @vaduga/mapgl-core
npm run core:check-isolation
npm run core:check-consumer
```

These commands use sources and temporary dependency copies; packaging is a separate release operation.

Browser tests live in `e2e/*.spec.ts`. They use public provisioning and delete dashboards they create. Rendered gauge, icon and visibility expectations are version-specific canvas images; review new images before accepting updates. Fresh-panel edits compare the same image before and after the edit. Unit tests retain deterministic diagnostic timers and renderer failure/recovery.

After every frontend rebuild, restart `mapgl` and any validation containers before running browser checks. For the declared Grafana 11.6.0 and 13.2.3 validation servers:

```sh
docker restart mapgl mapgl-oss-validation-oss-minimum-1 mapgl-oss-validation-oss-current-1
GRAFANA_URL=http://127.0.0.1:3008 npm run e2e -- --workers=1
GRAFANA_URL=http://127.0.0.1:3009 npm run e2e -- --workers=1
```

Do not treat image updates as a passing comparison. Run again without `--update-snapshots` after reviewing the images. Browser result folders are ignored by Git and lint.
