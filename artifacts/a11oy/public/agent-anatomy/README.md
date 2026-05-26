# Vendored agent-anatomy bundle

This directory contains the SZL Agent Anatomy bundle (16 figure binaries +
`figures.sha256` + `INDEX.md`) used by the A11oy agent-anatomy surface. They
are **vendored copies** of the canonical files shipped in the SZL Payload V8
bundle under `.local/payload-v8/05_anatomy/`.

## Vendoring rule

- **Source of truth:** `.local/payload-v8/05_anatomy/`
- **Vendored copy:** `artifacts/a11oy/public/agent-anatomy/`
- **Layout differences vs. source:** the 16 figures live under the source
  bundle's `figures/` subdir but are flattened to this directory's root for
  the public-asset URL; `INDEX.md` here is the upstream `anatomy_INDEX.md`,
  renamed. Both mappings are encoded as per-file `source` entries in
  [`VENDOR.json`](./VENDOR.json).
- **Relationship:** byte-for-byte identical. Every file in this directory
  must hash (SHA-256) to the value recorded in `VENDOR.json`, which in turn
  must match the SHA-256 of the source file it points to.

Do **not** hand-edit any file in this directory. If a figure needs to change,
update the upstream payload first, then re-vendor.

## How to re-vendor after upstream regenerates the payload

```sh
# Refresh every vendored payload-v8 bundle and rewrite each VENDOR.json.
# Add `--bundle agent-anatomy` to restrict to just this one.
pnpm --filter @szl-holdings/szl-doctrine run check:vendored-bundles -- --write
```

## How drift is enforced

The generalized script
`packages/szl-doctrine/scripts/check-vendored-bundles-drift.ts` runs in CI as
the **Vendored Bundle Drift Check (blocking)** job in
`.github/workflows/ci.yml` and can be reproduced locally with:

```sh
pnpm --filter @szl-holdings/szl-doctrine run check:vendored-bundles
```
