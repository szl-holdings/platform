# Series A W1 Truth Lock Review Tests — Proof Packet

Generated: 2026-07-25

## Context and Plan

The Series A truth-lock repair now recomputes remote metrics from independent
sources and blocks numeric claims when canonical evidence is unavailable. This
follow-up binds both security properties to focused adversarial tests so later
refactors cannot silently restore either bypass.

The scoped plan was:

1. Isolate deterministic drift and claim-evaluation functions for direct tests.
2. Reject forged committed remote values and numeric values whose independent
   source is unavailable.
3. Reject unavailable canonical claims unless the exact path and literal are
   explicitly allowlisted.
4. Make the standard local truth gate execute live remote verification too.

## Patch

- Added focused remote-evidence and unavailable-claim tests.
- Added import guards so test imports cannot regenerate the truth artifact or
  scan the entire repository as a side effect.
- Improved claim diagnostics to name the unavailable canonical metric.
- Recognized `current` and `currently` modifiers in the exact bypass form.
- Extended `pnpm truth:check` to include remote recomputation.

## Verification

No UI surface or route changed, so screenshots and route checks are not
applicable.

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile --offline` | PASS |
| `pnpm truth:check` | PASS |
| Local and independently sourced remote truth recomputation | PASS |
| Truth schema and suppression-allowlist validation | PASS |
| Focused truth tests | PASS — 21/21 |
| Full numeric-claim drift scan | PASS |
| Strict documentation claims | PASS — 26/26 |
| Biome check for changed TypeScript and `package.json` | PASS |
| `git diff --check` | PASS |

Exact signed commit and remote CI results are recorded in the pull-request
handoff.
