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
# Refresh the vendored binaries to match upstream and rewrite VENDOR.json.
pnpm --filter @szl-holdings/szl-doctrine run check:anatomy-drift -- --write
```

## How drift is enforced

The script `packages/szl-doctrine/scripts/check-anatomy-drift.ts` walks every
file listed in `VENDOR.json` and compares three things:

1. The SHA-256 of the source file under `.local/payload-v8/05_anatomy/figures/`.
2. The SHA-256 of the vendored copy under this directory.
3. The SHA-256 recorded in `VENDOR.json`.

Any mismatch (or any extra/missing file on either side) fails the build. The
check runs in CI as the **Anatomy Bundle Drift Check (blocking)** job in
`.github/workflows/ci.yml` and can be reproduced locally with:

```sh
pnpm --filter @szl-holdings/szl-doctrine run check:anatomy-drift
```
