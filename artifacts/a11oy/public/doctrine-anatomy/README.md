# Vendored anatomy figures

This directory contains the 16 anatomy binaries (8 PDFs + 8 PNGs) used by the
A11oy doctrine surface. They are **vendored copies** of the canonical figures
shipped in the SZL Payload V8 bundle.

## Vendoring rule

- **Source of truth:** `.local/payload-v8/05_anatomy/figures/`
- **Vendored copy:** `artifacts/a11oy/public/doctrine-anatomy/`
- **Relationship:** byte-for-byte identical. Every file in the vendored
  directory must hash (SHA-256) to the value recorded in
  [`VENDOR.json`](./VENDOR.json), which in turn must match the SHA-256 of the
  source file with the same name.

Do **not** hand-edit any binary in this directory. If a figure needs to change,
update the upstream payload first, then re-vendor.

## How to re-vendor after upstream regenerates the payload

```sh
# Refresh every vendored payload-v8 bundle (this one + all others) and rewrite
# each VENDOR.json. Pass --bundle doctrine-anatomy to restrict to just this one.
pnpm --filter @szl-holdings/szl-doctrine run check:vendored-bundles -- --write
```

## How drift is enforced

The generalized script
`packages/szl-doctrine/scripts/check-vendored-bundles-drift.ts` walks every
bundle listed in `packages/szl-doctrine/vendored-bundles.json` and, for each
file recorded in its `VENDOR.json`, compares three things:

1. The SHA-256 of the source file under `.local/payload-v8/...`.
2. The SHA-256 of the vendored copy.
3. The SHA-256 recorded in `VENDOR.json`.

Any mismatch (or any extra/missing file on either side) fails the build. The
check runs in CI as the **Vendored Bundle Drift Check (blocking)** job in
`.github/workflows/ci.yml` and can be reproduced locally with:

```sh
pnpm --filter @szl-holdings/szl-doctrine run check:vendored-bundles
```
