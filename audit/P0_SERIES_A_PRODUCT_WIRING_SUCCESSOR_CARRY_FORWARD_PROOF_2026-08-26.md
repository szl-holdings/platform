# P0 Series A Product Wiring - Successor Carry-Forward Proof Packet

Recorded: `2026-08-26T15:22:07.9962399-04:00`

## Verdict

`SUCCESSOR_SOURCE_READY / PR656_REPAIRED_HOSTED_CAPTURE_IMPORTED / SUCCESSOR_FINAL_HEAD_CI_PENDING`

This append-only packet carries Platform PR #656 forward onto current `origin/main` after PR #656 closed and became conflicting. It preserves the no-merge, no-deploy, no-force-push boundary and does not claim production runtime or customer use.

## Required proof fields

| Field | Value |
|---|---|
| `workcell_id` | `P0-SERIES-A-PRODUCT-WIRING-20260811` |
| `agent` | Codex |
| `objective` | Rebase/carry forward the P0 A11oy Series A product wiring onto current main, import the repaired hosted capture evidence, and leave only successor-head CI/review/merge as protected residuals. |
| `plan_summary` | Read doctrine/status/gaps, replay the PR #656 source stack onto current `origin/main`, preserve truth labels, import repaired screenshot artifact `9409395738`, update task/gap/catalog dispositions, run focused validation, commit, push, and open/refresh a successor PR. |
| `proof_level` | Level 3 - source plus hosted presentation evidence for PR #656 final head; successor branch release proof remains pending final-head CI. |
| `recorded_at` | `2026-08-26T15:22:07.9962399-04:00` |
| `recorded_by` | Codex |

## Source boundary

| Field | Evidence |
|---|---|
| Repository | `szl-holdings/platform` |
| Prior PR | #656, closed |
| Prior final head | `0ca011c41184f809bddf184ca494f08224f71791` |
| Current base | `origin/main` at `7383a30ffc2765e6b25a92026915b32e6fa0fda7` |
| Successor branch | `codex/series-a-proof-successor-20260826` |
| Successor replay commits | `37e8e7d21`, `a6f05a37c`, `7ec039eac`, `f3bc16cda` |

## Patch summary

- Replayed the P0 `/a11oy/start` product source, operational-state contract, route wiring, package tests, capture script, and smoke-route changes onto current `origin/main` without rewriting the closed PR branch.
- Resolved current-main conflicts only in source-of-truth and known-gaps text, preserving the canonical 46-workflow count and the A11oy exact-head screenshot workflow language.
- Replaced the superseded screenshot files with repaired hosted artifact `9409395738` from run `32376800750` and updated `audit/screenshot-catalog.md` with per-file hashes and proof status.
- Updated `.codex/tasks/P0_SERIES_A_PRODUCT_WIRING_20260811.md` and `docs/operations/known-gaps.md` to distinguish old PR evidence, successor branch state, and remaining protected gates.

## Repaired hosted capture evidence

Run [`32376800750`](https://github.com/szl-holdings/platform/actions/runs/32376800750) completed successfully on PR #656 final head `0ca011c41184f809bddf184ca494f08224f71791`. Artifact `9409395738` reported digest `sha256:cbe034bfd9b28c68fee191913c0dfe0ed6ecbbceb36d991db45c0a36c1a0b823`.

Metadata records `PASS`, `scroll_origin: true`, HTTP 200, expected heading visible, six tabs exercised, no horizontal overflow, zero console errors, zero page errors, and zero undeclared API requests for all five viewports: 320, 390, 768, 1366, and 1728 CSS pixels. Local byte inspection confirmed the imported PNG hashes match the metadata, and the metadata sidecar hashes to `55979e0cb408bac56d074fa794ed58bfa20e111fdd095dc72df0725100cdb3a4`.

## Local validation on successor branch

| Check | Result | Notes |
|---|---|---|
| Direct package-manager validation (`pnpm --filter @workspace/a11oy test`, `pnpm --filter @workspace/a11oy typecheck`, `pnpm --filter @workspace/a11oy-runtime test -- operational-source-state`) | `BLOCKED_BY_POLICY_GATE` | The repo's dependency status check invoked `pnpm install` and failed closed on ignored build scripts for `@google/genai`, `core-js`, `esbuild`, `isolated-vm`, `onnxruntime-node`, and `protobufjs`. No `pnpm approve-builds` or gate weakening was performed. |
| `node --test artifacts/a11oy/test/series-a-contract.test.mjs` | `PASS` | 10/10 Series A product/evidence contract tests passed after updating the contract to the repaired hosted capture while retaining the superseded-run assertion. |
| `node node_modules/.pnpm/typescript@6.0.3/node_modules/typescript/lib/tsc.js -p lib/a11oy-fabric/tsconfig.json --noEmit --pretty false` | `PASS` | Focused fabric contract typecheck completed with no diagnostics. |
| `node node_modules/.pnpm/typescript@6.0.3/node_modules/typescript/lib/tsc.js -p artifacts/a11oy/tsconfig.json --noEmit --pretty false` | `INCONCLUSIVE_LOCAL_TIMEOUT` | The compiler emitted no diagnostics but did not complete within the local bound. The A11oy production build completed successfully. |
| `node ../../node_modules/.pnpm/vite@8.0.16_@types+node@25._32b7b6ad736f56ad03919a64d857fcb4/node_modules/vite/bin/vite.js build --config vite.config.ts` from `artifacts/a11oy` | `PASS` | Production build completed and emitted `SeriesAView-D5UktmTG.js`. |
| `node scripts/docs/check-docs-claims.js` | `PASS` | All 26 documentation/source claims verified. |
| `curl.exe -sS -I http://127.0.0.1:4110/a11oy/start` after `vite preview --host 127.0.0.1 --port 4110` | `PASS` | Built preview returned HTTP 200 with security headers, including CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, and nosniff. |
| Local screenshot hash verifier | `PASS` | All five imported PNG SHA-256 values match metadata; metadata sidecar SHA-256 is `55979e0cb408bac56d074fa794ed58bfa20e111fdd095dc72df0725100cdb3a4`. |
| Focused Biome check | `PASS` | Changed A11oy source and contract test pass after safe import-order fixes. |

## Non-claims

This packet does not claim protected merge, deployment, live domain state, production runtime, external-font delivery, live GraphQL resolvers, live Omnia mutations, Hugging Face publication, customer use, revenue, compliance certification, or model-performance results. Successor branch CI and protected review remain required before merge.