# Killinchu public-surface source-binding refresh — 2026-10-11

**Workcell:** `platform-truth-killinchu-20261011`
**Scope:** Platform's exact Killinchu `/api/build-info` public-surface contract.
**Evidence class:** MEASURED for the commands and bounded HTTP reads below. This is a source and validation change, not a Killinchu deployment or production-readiness decision.

## Context and plan

The scheduled [Truth drift run 38119131810](https://github.com/szl-holdings/platform/actions/runs/38119131810) failed at `pnpm surfaces:check` because `killinchu-build-info-api` no longer matched the pinned source-binding body. Later pull-request and push checks skip live public-surface verification, so their success does not clear this failure.

Plan: update only the verified Killinchu source revision, deployment-manifest SHA-256, and advertised attestation ID; retain exact-body validation; make the previous complete binding and forged fields fail in tests; update the matching registry, generated manifest, and known-gap note. Keep the registry-wide `observed_at=2026-10-07T12:31:38.131Z` unchanged because the other approved surfaces were not reobserved for this patch.

The older [Platform PR #906](https://github.com/szl-holdings/platform/pull/906) remains open and untouched. It changes broader truth and dependency files and conflicted with current `main` in nine paths when checked with `git merge-tree --write-tree main review/pr906`; this successor addresses the current single-surface failure without importing that unrelated delta.

## Source and provider evidence

| Observation | Result and limit |
| --- | --- |
| `gh api repos/szl-holdings/killinchu/git/ref/heads/main --jq .object.sha` | `32760a15fcecfe50211654713d7e4e6a86d947fa` at the read. |
| [Killinchu `hf-sync.yml` run 38124775327](https://github.com/szl-holdings/killinchu/actions/runs/38124775327) | SUCCESS at that exact source SHA. |
| `gh run download 38124775327 --repo szl-holdings/killinchu -n hf-deploy-evidence` and SHA-256 of its `hf-deploy-manifest.json` | `e03e46480aa33c0edc4260969c8d04f9fbb18ffc980eabc4e571090cb639a91c`. The downloaded artifact was kept outside the repository. |
| `gh attestation verify hf-deploy-manifest.json -R szl-holdings/killinchu` | Exit 0. The returned verified statement binds this subject digest to `szl-holdings/killinchu`, `hf-sync.yml`, `refs/heads/main`, source SHA `32760a15fcecfe50211654713d7e4e6a86d947fa`, and run 38124775327. |
| Bounded GET `https://szlholdings-killinchu.hf.space/api/build-info` | HTTP 200 JSON reported the same build and receipt source SHA, manifest digest, and attestation ID `54763629`. The ID is an API claim; the signature verification independently binds the manifest digest and source, not that numeric ID. |

The read and signature verification support the exact source/manifest contract. They do not prove the running Space's complete bytes equal the manifest, durable ledger state, aggregate health, or production readiness.

## Patch and verification

- Updated the three strict constants and the corresponding test fixture. Added rejection cases for the previous complete binding, a forged manifest digest, and a forged attestation ID/URL. Existing malformed-body, duplicate-key, receipt-scope, and readiness negatives remain.
- Updated the Killinchu registry note and the deterministic `artifacts/PUBLIC_SURFACES.json` projection. Preserved the historical registry-wide observation timestamp and other surface entries.
- Clarified the current single-surface evidence in `docs/operations/known-gaps.md`; no artifact readiness or route changed.

| Command | Result |
| --- | --- |
| `corepack pnpm install --filter . --frozen-lockfile --ignore-scripts` | PASS with pinned pnpm 10.26.1 in a sparse, isolated checkout. |
| `corepack pnpm exec tsx tools/truth/generate-public-surfaces.ts --check` | PASS; generated manifest matches registry bytes. |
| `corepack pnpm exec tsx --test tools/truth/public-surfaces.test.ts` | PASS, 37/37 tests including exact-body and negative controls. |
| `corepack pnpm surfaces:check` | PASS, live routes verified in a bounded local run. |
| `corepack pnpm surfaces:freshness` | PASS, live routes and the unchanged observation age verified. |
| `git diff --check` | PASS. |
| `pnpm typecheck` before the install | NOT PASS: machine fallback pnpm 11.25.0 conflicts with repository pin 10.26.1. |
| `corepack pnpm typecheck` before the install | NOT PASS: sparse checkout had no `turbo` yet. |
| `corepack pnpm typecheck` after root-only install | NOT PASS: Turbo child tasks resolved the machine fallback pnpm 11.25.0. This environment issue is distinct from the changed files; exact-head hosted typecheck is still required for merge. |
| `pnpm qa:routes` | NOT RUN; no route or UI file changed. No screenshot is applicable. |

Protected PR checks, merge, and a fresh hosted manual live witness are separate release gates. A green local probe alone does not close the scheduled workflow incident.
