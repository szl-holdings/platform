# P1 Series A capture authority — Proof Packet

- **workcell_id:** P1_SERIES_A_CAPTURE_AUTHORITY_20261003
- **agent:** Codex
- **objective:** Prevent the candidate-owned screenshot rail from declaring
  GitHub-hosted authority based on caller-controlled environment variables.
- **base_source:** szl-holdings/platform
  `f2f8df6f89056e9104587674ccec0855dd5b177a`
- **evidence_class:** MEASURED for commands personally run; DECLARED for the
  patch design; UNAVAILABLE for hosted capture pending a new dispatch.
- **proof_level:** 3 — Evidence Proof (zero UI surfaces changed; screenshot N/A)
- **recorded_at:** 2026-10-03T07:01:00Z
- **recorded_by:** Codex

## Plan summary

The plan was recorded before the source patch in
`.codex/tasks/P1_SERIES_A_CAPTURE_AUTHORITY_20261003.md`. Make candidate
capture authority local under all environment values, protect that invariant
with a forged-environment test, preserve the source/served-byte rail, run
focused checks, and promote through a new protected PR from current main.

## Patch summary

- `scripts/qa/capture-series-a-proof.mjs` no longer reads `GITHUB_ACTIONS`
  or `GITHUB_*` to infer authority. It emits top-level
  `authority: LOCAL_NON_AUTHORITATIVE` and `hosted_gate_admissible: false`,
  uses actual process OS/architecture, and always checks the source branch.
- `scripts/qa/series-a-proof-helpers.mjs` provides one frozen local
  authority value and records the physical execution provider as `UNKNOWN`.
- The helper behavioral test forges GitHub workflow variables in a child
  process and verifies the authority stays local and immutable. The Series A
  and product-wiring contract tests assert the new boundary.
- `docs/operations/known-gaps.md` records the source defect and pending
  hosted observation. No UI component, route, workflow, dependency, lockfile,
  or source screenshot was changed.

## Test results

| Command | Exit | Observation |
|---|---:|---|
| `corepack pnpm --version` | 0 | Repository pin 10.26.1 available. |
| `corepack pnpm typecheck` before patch | 1 | Could not start: `turbo` absent; no dependencies installed in the sparse checkout. |
| `corepack pnpm --filter @workspace/a11oy test` first run | 1 | Found missing local `ws` link and one newer product test asserting the unsafe hosted label. |
| `corepack pnpm --filter @workspace/a11oy test` final run | 0 | 29/29 passed, including forged GitHub environment and source contracts. An ignored local junction supplied the existing lockfile-matching `ws@8.21.0`; no manifest changed. |
| `node --check` on the original four JavaScript modules, then all five edited JavaScript files | 0, 0 | All syntax checks passed. |
| `biome check` on all five edited JavaScript files | 0 | No errors; two informational template-literal suggestions. |
| `corepack pnpm typecheck` after patch | 1 | Same dependency absence as baseline; no typecheck pass claimed. |
| `corepack pnpm docs:claims-check` initial attempts | 1, 1 | Sparse checkout omitted `scripts/docs`, then `lib/db`; neither was a claim failure in the full tree. |
| `corepack pnpm docs:claims-check` after materializing source paths | 0 | All 26 documentation claims verified. |
| Targeted credential-pattern `rg` scan | 2, then 1 | First invocation had a flag parse error; corrected scan produced no matches (exit 1 is expected for no match). |
| `git diff --check` | 0 | No whitespace errors. |

## Screenshot disposition

N/A: this patch changes screenshot metadata authority and test code, not a UI
surface. The PR #668 images remain historical local captures; they are not
relabeled as hosted or refreshed by this packet.

## Verification notes

The focused test runs the helper under forged `GITHUB_ACTIONS=true` and
workflow/run variables. It observes a frozen, reused
`LOCAL_NON_AUTHORITATIVE` object. Source contracts reject a candidate
`VERIFIED_GITHUB_RUNTIME` path and require
`hosted_gate_admissible: false`. The production capture script and helper
contain no GitHub environment or hosted-authority promotion branch.

The protected controller is a separate main-owned workflow. Its prior pnpm
permission failure was repaired in PR #690, but no successful new
`workflow_dispatch` capture has been observed for this successor as of this
record. Hosted CI, source merge, deployment, and customer runtime remain
separate evidence states.

### Exact-head follow-up, 2026-10-03

**followup_recorded_at:** 2026-10-03T07:34:00Z. The packet's original
`recorded_at` above applies only to the initial local verification record.

The source commit `bc06fa733ad0cb000e1c4cfd5eda00aa9daba348` was
published normally as PR #884. GitHub reports its commit signature valid for
`stephenlutar2-hash`; local `git log -1 --show-signature` also reported a good
signature and the commit carries a DCO trailer. This is source publication,
not protected promotion.

The protected controller was dispatched from main for PR #884's exact commit
as [run 37106028221](https://github.com/szl-holdings/platform/actions/runs/37106028221).
Its capture-contract step passed, but candidate dependency-root preparation
failed before screenshot publication. The run produced no capture artifact or
issue receipt. Hosted screenshot evidence therefore remains **UNAVAILABLE**;
the controller is being repaired separately. The failed run is not a pass.

PR #884's first CI pass is also not green. Its unit job failed in an existing
Atelier continuity concurrent-initialization test outside this patch, and
both dependency-audit and Grype High-severity gates failed on inherited
[`node-forge 1.4.0`](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
and [`braces 3.0.3`](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
lockfile entries. The PR does not edit the lockfile or those packages. The
two advisories currently name no patched version. These findings remain
blocking; no security gate is relaxed and no merge is claimed. Codex's hosted
review bot returned a review-usage-limit response, so its review is
**UNAVAILABLE** for this head.

## Public claim and security checks

No product capability or customer claim is added. The known-gap language
states source behavior and unavailable hosted evidence. This patch adds no
credential, signing key, `.env` content, database operation, or external
effect. A targeted pattern scan found no matching key material. The final
staged diff and hosted security checks remain promotion gates.

## Known gaps update

`docs/operations/known-gaps.md` now records the environment-forged
provenance defect and the pending hosted capture. `docs/APP_STATUS.md` is
unchanged because this patch does not alter artifact readiness.
