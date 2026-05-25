# @szl-holdings/payload

> **DEPRECATED for artifact consumers (task #5142).** The "dark" artifact
> landing / about / lineage surfaces (sentra, conduit, a11oy) now import
> panel facts, the V7 ribbon facts, the thesis lineage / papers, the org
> summary, and the DOI ledger count from **`@szl-holdings/szl-doctrine`**
> — which re-exports the same constants from this package. New artifact
> code must depend on szl-doctrine, not on this package directly. A drift
> guardrail (`pnpm run check:payload-doctrine-drift`) fails CI if any file
> under `artifacts/*/src` re-introduces a direct `@szl-holdings/payload`
> import.
>
> The package itself is still the canonical source of truth for the raw
> payload bytes and is consumed transitively by szl-doctrine and directly
> by the api-server (out of scope for the migration). Do not delete.

Canonical SZL Holdings machine-to-machine handoff payload, formalized as a
real pnpm workspace package.

## What's inside

```
packages/payload/
├── raw/               # 314 staged files — DO NOT modify by hand
│   ├── payload.json   # master manifest + file_integrity (SHA-256 + size)
│   ├── dev1_thesis/
│   ├── dev2_runtime/
│   ├── dev3_agi_v5/
│   ├── dev4_ops/
│   ├── github_pro/
│   └── _files/
├── src/
│   ├── index.ts       # browser-safe typed constants (DOCTRINE, REPOS, PANEL_FACTS, …)
│   └── server.ts      # Node-only: loads every raw JSON via fs.readFileSync
├── scripts/verify-integrity.mjs
└── test/contract.test.ts
```

## Why a package, not `/tmp/payload`

The previous handoff lived under `/tmp/payload`, which is wiped between
container boots and is invisible to the bundler. By formalizing the bundle
as `@szl-holdings/payload` we get:

- Single source of truth for doctrine constants (replay root, Λ floor,
  byline, ORCID, license allowlist).
- Bundler-visible imports from every artifact, with treeshakeable browser
  surface (`./src/index.ts`) and a fs-backed Node surface (`./src/server.ts`).
- Reproducible SHA-256 verification of every staged file via
  `pnpm --filter @szl-holdings/payload verify`.
- A contract test that fails CI if any GovernancePanel literal drifts from
  the canonical payload.

## Imports

Browser / panels:

```ts
import { DOCTRINE, PANEL_FACTS, REPOS, panelRepoFacts } from "@szl-holdings/payload";
```

API server (Node only):

```ts
import { COMPONENTS, MASTER } from "@szl-holdings/payload/server";
```

## Public API surface (`/api/payload/*`)

Allowlisted in `global-auth-enforcer` because `payload.json` declares
`ingestion_policy: "PUBLIC_ONLY"` and the entire bundle is intended to be
public.

| Route | Returns |
|-------|---------|
| `GET /api/payload`           | Doctrine + org summary + component index |
| `GET /api/payload/thesis`    | `dev1_thesis/thesis_payload.json`        |
| `GET /api/payload/runtime`   | `dev2_runtime/runtime_payload.json`      |
| `GET /api/payload/agi_v5`    | `dev3_agi_v5/agi_v5_payload.json`        |
| `GET /api/payload/ops`       | `dev4_ops/ops_payload.json`              |
| `GET /api/payload/github`    | `github_pro/{inventory,clone_manifest}.json` |
| `GET /api/payload/integrity` | SHA-256 + size manifest for every raw file   |

## How the package stays drift-free

`src/index.ts` does **not** transcribe any payload value. Every constant is
*derived at module-load time* from raw JSON via `resolveJsonModule` imports
(`../raw/payload.json`, `../raw/github_pro/github_inventory.json`,
`../raw/dev2_runtime/runtime_payload.json`). The raw files themselves are
verified against `payload.json.file_integrity` by the integrity script. So
the chain is:

```
raw/*.json  ──verify-integrity (SHA-256)──►  trusted raw
trusted raw ──JSON imports────────────────►  DOCTRINE / REPOS / PANEL_FACTS
PANEL_FACTS ──contract test (77 cases)────►  GovernancePanels.tsx
```

If any link in the chain drifts, either `verify` or the contract test fails.

## Integrity verification

```sh
pnpm --filter @szl-holdings/payload verify                # strict
pnpm --filter @szl-holdings/payload verify -- --accept-known-deltas   # CI
```

Walks `raw/`, computes `sha256` + byte-size for every file, compares against
`raw/payload.json.file_integrity`, and exits non-zero on any mismatch,
missing file, or extra-on-disk file. Structural deltas that pre-date the
package (and cannot be reconciled without modifying `raw/`) are declared
auditably in `integrity-deltas.json`; only the `--accept-known-deltas` /
`ACCEPT_KNOWN_DELTAS=1` flag downgrades those specific entries to warnings.
Undeclared drift is always a hard error.

## Contract test

```sh
pnpm --filter @szl-holdings/payload test
```

Three layers (77 cases):

1. **raw → exports** — every `DOCTRINE` / `ORG_SUMMARY` / `REPOS` /
   `PUSH_QUEUE` / `DOI_LEDGER_COUNT` field equals the corresponding raw
   JSON field (including 12-char `latestCommitSha` exactly as the inventory
   records it — no padding, no fabrication).
2. **exports → PANEL_FACTS** — every `PANEL_FACTS.*` string equals the
   formatter applied to the derived exports.
3. **PANEL_FACTS → panels** — for each of the 7 `GovernancePanels.tsx`:
   no forbidden canonical literal (full replay root, ORCID, full/short
   arxiv SHA, own-repo full-name) appears anywhere; **and** every
   `<Row value={EXPR} />` is statically extracted and evaluated against a
   sandbox bound to the package surface, proving the expression resolves
   cleanly from payload exports (not from local transcribed constants).

## Out of scope

- Modifying `raw/` contents (the bundle is signed off).
- Panel layout refactors (this task only swaps the data source).
