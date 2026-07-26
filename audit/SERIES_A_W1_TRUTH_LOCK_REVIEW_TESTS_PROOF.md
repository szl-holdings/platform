# Series A W1 Truth Lock Review Tests — Proof Packet

Generated: 2026-07-26

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
5. Bind the schema, Zenodo DOI pointers, and generation provenance to canonical
   values during verification.
6. Scan metric claims across adjacent wrapped prose while retaining the source
   line and respecting Markdown and code structure boundaries.

## Patch

- Added focused remote-evidence and unavailable-claim tests.
- Added import guards so test imports cannot regenerate the truth artifact or
  scan the entire repository as a side effect.
- Improved claim diagnostics to name the unavailable canonical metric.
- Recognized `current` and `currently` modifiers in the exact bypass form.
- Extended `pnpm truth:check` to include remote recomputation.
- Rejected DOI or `generated_by` edits unless provenance uses the canonical,
  versioned generator identity, independent of merge, squash, or branch history
  shape.
- Added adjacent-line claim scanning with exact numeric source-line mapping.
- Kept separate table rows, list items, code/object records, and completed
  sentences from leaking context into one another.

## Verification

No UI surface or route changed, so screenshots and route checks are not
applicable.

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile --offline` | PASS |
| `pnpm truth:check` | PASS |
| Local and independently sourced remote truth recomputation | PASS |
| Truth schema and suppression-allowlist validation | PASS |
| Focused truth tests | PASS — 32/32 |
| Full numeric-claim drift scan | PASS |
| Strict documentation claims | PASS — 26/26 |
| Biome check for changed TypeScript and `package.json` | PASS |
| `git diff --check` | PASS |

Exact signed commit and remote CI results are recorded in the pull-request
handoff.
