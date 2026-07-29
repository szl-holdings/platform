# Frontier preflight proof packet

**Workcell:** `FRONTIER-PREFLIGHT-2026-07-29`
**Base commit:** `a85afe8f924969fbd2e9fdff316b691dc494b61b`
**Evidence status:** **MEASURED / EXTERNAL FRONTIERS BLOCKED**

## Plan

Add one dependency-free, read-only command that measures the five unresolved
frontiers named in the CTO payload:

1. exact public npm versions;
2. the configured Decision-SLSA concept DOI;
3. the three vertical deployment targets;
4. local TPM readiness versus an authorized attestation result; and
5. hosted Datadog, Langfuse, and Arize proof availability.

The collector must use bounded requests, emit no credential values, distinguish
runtime health from conformance, and keep the current `0/3` result fail closed.

## Patch

- `scripts/frontier/frontier-preflight.mjs` implements the
  `szl.frontier-preflight.v1` collector and strict gate.
- `scripts/frontier/frontier-preflight.test.mjs` covers current failure modes,
  exact npm version matching, secret non-disclosure, and timeout bounds.
- `package.json` exposes `frontier:preflight`, `frontier:gate`, and
  `frontier:test`.
- `docs/conformance/VERTICAL_CONFORMANCE.md` records the current public
  david-leads state and documents the preflight boundary.
- `docs/operations/known-gaps.md` records the live result without closing any
  external gap.

No UI surface, route, deployment, repository visibility, workflow, ruleset, or
branch-protection setting was changed. Screenshot proof is not applicable.

## Test and live results

| Command | Exit | Observed result |
|---|---:|---|
| `node --check scripts/frontier/frontier-preflight.mjs` | 0 | Syntax valid |
| `node --test scripts/frontier/frontier-preflight.test.mjs` | 0 | 4/4 pass |
| `node --test packages/conformance/src/conformance.test.mjs` | 0 | 16/16 pass |
| `node --test scripts/release/verify-public-npm-artifacts.test.mjs` | 0 | 5/5 pass |
| `node scripts/release/verify-public-npm-artifacts.mjs` | 0 | Both retained tarballs verify against source contracts |
| `node --experimental-vm-modules scripts/docs/check-docs-claims.js` | 0 | 26/26 claims pass |
| `node scripts/frontier/frontier-preflight.mjs` | 0 | Measurement completed; report status `BLOCKED` |
| `node scripts/frontier/frontier-preflight.mjs --require-operational` | 1 | Strict gate correctly blocked |
| `git diff --check` | 0 | No whitespace errors |

The root `pnpm typecheck` baseline could not start because this clean worktree
did not have a runnable `node_modules/.bin/turbo`; an offline dependency-link
attempt and a direct Turbo invocation both exceeded the bounded execution
window. The changed runtime is dependency-free JavaScript and is covered by
the focused Node tests above.

## Live measurement

The read-only run at `2026-07-29T16:05:27.991Z` observed:

- npm: both exact `0.1.0` registry documents returned HTTP 404;
- DOI: concept DOI `10.5281/zenodo.19944926` still resolved to the Ouroboros
  Thesis v21 series, with record DOI `10.5281/zenodo.20490218`;
- verticals: `0/3` verified; Sentra passed `1/7` gates, Vessels passed `1/7`,
  and Insurance passed `0/7`;
- Killinchu: `/healthz` and `/readyz` returned JSON 200, while `/version` and
  `/evidence` returned HTML fallbacks; `receipt_minted=false`;
- David Leads: `/healthz` and `/readyz` returned JSON 200, while `/version` and
  `/evidence` returned JSON 404; `receipt_minted=false`;
- hardware: TPM present, attestation-capable, and PCR log matched hardware, but
  no quote tool or authorized attestation result was observed; and
- hosted observability: no credential inputs or production proof were
  available for Datadog, Langfuse, or Arize.

## Verification boundary

The command proves that the probes ran and records their current responses. It
does not prove npm publisher authority, DOI depositor authority, a complete
seven-gate vertical run, a signed hardware quote, a hosted vendor trace, or a
production receipt. Those frontiers remain `MEASURED`, `UNAVAILABLE`, or
`UNVERIFIED` as emitted by the report.
