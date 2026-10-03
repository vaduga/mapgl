## Project knowledge

This repository contains a **Grafana plugin**.

You must read @./.config/AGENTS/instructions.md before doing changes.

Read these project docs before making documentation changes or changing panel configuration behavior:

- @./docs/documentation.md
- @./docs/reference.md

`docs/documentation.md` is the user-facing configuration guide.
`docs/reference.md` is the exact behavior and data-model reference.

## Local build validation

- **Must restart the Grafana container after every frontend rebuild** before browser validation. Rebuilding the plugin entry module changes its hash, and Grafana can fail to load the rebuilt module until restarted. For this repository, run `docker restart mapgl`.
