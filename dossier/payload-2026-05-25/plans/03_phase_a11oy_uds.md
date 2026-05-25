# Phase 3 — A11oy UDS / Zarf payload

## Goal
Produce a single, signed, declaratively-deployable artifact that drops A11oy
(core + Phase-2 formulas + provenance manifest) into a Defense-Unicorns UDS
bundle via `zarf package deploy`.

## New artifact

`artifacts/a11oy-uds/` (kind: `payload`, no preview path)
- `zarf.yaml` — Zarf v1 package definition.
  - kind: `ZarfPackageConfig`
  - components:
    - `a11oy-core` — built `@a11oy/core` + `@a11oy/connection` tarballs.
    - `a11oy-formulas` — Lean compiled `.olean`s + TS shims from Phase 2.
    - `a11oy-provenance` — `MANIFEST.json` with `sha256` for every file,
      build timestamp, git SHA, payload version.
  - images: none (pure data/code payload; UDS hosts execute Node).
- `scripts/build.sh` — runs `pnpm a11oy:uds:build`, which:
  1. `pnpm -r build` for `@a11oy/*` and `@platform/agi-forecast`.
  2. Copies build outputs into `artifacts/a11oy-uds/build/`.
  3. Generates `MANIFEST.json` (sorted file list + sha256s + sizes).
  4. `zarf package create ./ --output dist/a11oy-uds/`
  5. Optional `cosign sign-blob dist/a11oy-uds/*.tar.zst` if `COSIGN_KEY`
     env var is present; otherwise emits `.sha256` sidecar.
- `README.md` — operator-facing deploy instructions:
  - prerequisites: `zarf` >= v0.36, optional `cosign` >= v2.
  - deploy: `zarf package deploy a11oy-uds-<version>.tar.zst`.
  - verify: `zarf package inspect …` + `cosign verify-blob …`.
  - rollback: `zarf package remove a11oy-uds`.

## Validation
- `bash artifacts/a11oy-uds/scripts/build.sh` produces a non-empty
  `.tar.zst` under `dist/a11oy-uds/`.
- `zarf package inspect` on the produced tarball lists exactly the
  components declared in `zarf.yaml`.
- `MANIFEST.json` round-trips: recompute every sha256 from the unpacked
  tarball, assert equality.

## Risks / fallbacks
- `zarf` and `cosign` binaries may not be present on the Replit container.
  Add a `make-bootstrap.sh` that installs them via the package manager
  skill, and gate the build step on their presence.
- If signing is unavailable, the build still completes and emits unsigned
  `.sha256` sidecars; deploy README documents this as the "dev-mode" path.
