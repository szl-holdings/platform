# Defense Unicorns × SZL Holdings — meshing proposal

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Audience:** Andrew Greene (co-founder, Defense Unicorns)
**Date:** 2026-05-16

Read order:

1. [`00_executive_summary.md`](./00_executive_summary.md) — the ask, the
   offer, the two fixes, the meshing thesis.
2. [`01_uds_audit.md`](./01_uds_audit.md) — UDS surface audit + the
   linked commit `72327d9` line-by-line.
3. [`02_field_gap_analysis.md`](./02_field_gap_analysis.md) — the field
   scan and the SZL landing-zone gap matrix.
4. [`03_szl_anatomy.md`](./03_szl_anatomy.md) — what SZL has, sourced
   from `packages/payload/raw/`.
5. [`04_mesh_plan.md`](./04_mesh_plan.md) — the five integration planes.
6. [`05_two_fixes.md`](./05_two_fixes.md) — the two shippable PRs.
7. [`06_warhacker_brief.md`](./06_warhacker_brief.md) — the event-day
   one-page brief.
8. [`07_appendix_links.md`](./07_appendix_links.md) — every cited source.

Companion files:

- [`skeletons/`](./skeletons/) — `zarf.yaml` and `uds-bundle.yaml`
  skeletons for Plane 1.
- [`szl-holdings/`](./szl-holdings/) — the real, on-disk Plane 1
  artifacts: three Zarf packages (`a11oy/`, `sentra/`, `amaru/`) and
  the top-level UDS bundle (`uds-mesh/`).
- [`tuesday/`](./tuesday/) — the Tuesday packet for Andrew (deck, demo
  script, evidence appendix).
- [`_sources/`](./_sources/) — cached HTML and JSON for every external
  source cited above (reproducibility).

## Which bundle to run for the demo

Two bundle files live in
[`szl-holdings/uds-mesh/`](./szl-holdings/uds-mesh/):

- **`uds-bundle.local.yaml` — demo default.** What we run for Andrew
  and any offline / dry-run. Each package entry uses
  `path: ../<app>/deploy`, so `uds-cli bundle create` builds the three
  Zarf packages locally. No GHCR pull, no published-package
  dependency.

  ```sh
  cd docs/proposals/defense-unicorns/szl-holdings/uds-mesh
  uds-cli bundle create . -f uds-bundle.local.yaml --confirm
  uds-cli bundle deploy uds-bundle-szl-mesh-amd64-0.1.0.tar.zst --confirm
  ```

- **`uds-bundle.yaml` — production path.** References the three
  packages at `ghcr.io/szl-holdings/packages/{a11oy,sentra,amaru}:1.0.0-alpha`.
  Use this once the packages are published — i.e. for downstream
  adopters pulling the bundle from a registry rather than building
  from source.

See [`szl-holdings/uds-mesh/README.md`](./szl-holdings/uds-mesh/README.md)
for the full walk-through, and
[`szl-holdings/uds-mesh/preflight.sh`](./szl-holdings/uds-mesh/preflight.sh)
for the one-shot static + live validation.
