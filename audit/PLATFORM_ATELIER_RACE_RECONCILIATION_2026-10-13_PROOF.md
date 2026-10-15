# Atelier continuity race reconciliation — Proof Packet

- **workcell_id:** WC-PLATFORM-ATELIER-RACES-20261013
- **agent / recorded_by:** Codex review_platform, independently reviewed by review_projections
- **recorded_at:** 2026-10-13T18:57:35.504625+00:00
- **objective:** Reconcile #881/#885 while preserving newer protected marker admission and final-object retention.
- **plan_summary:** Compare immutable candidates against current main, compose narrow remaining repairs, run bounded filesystem regressions, and require full native admission before squash.
- **patch_summary:** Authenticate the initial bounded read before one same-file retry after publication hard-link retirement. Bind device, inode, size, mtime, mode, owner/group and byte digest; retry requires one link and the same authenticated bytes. Require the published key marker to remain present. Retain all regular index/object temporary candidates regardless of age.
- **screenshot_refs:** N/A — no UI surface, route or rendered interaction changed.
- **proof_level:** 2; tested local source, with full hosted admission separately required.

## Immutable source and reconciliation

Protected base: `331ef1ae3453ccc31bff3678a75c74320f9279c1` (#906).
The source/test composition was first reviewed on `aaa5417bd9a1fe755a5eaaa4e45bb29c8940370c`;
#906 changes no Atelier source. Its newer public-surface gap entries are preserved.
Original #881: `ff83592bf7fb2c1027d4419aaaf2d23aa14a5b7a`.
Original #885: `7c9a3af6a52f247caf7bd121b73d908b9f2ea381`.

The complete #885 authenticated-read function was composed onto main. Main's
exact temporary marker naming, authenticated first-start wait, foreign-key
rejection, stale-marker admission failure, and unexpected-entry rejection
remain intact. Main's stronger final-object retention is preserved: an index
snapshot and elapsed time cannot establish an orphan. The older #881 expiry-
based final-object deletion is superseded by that conservative policy.

Independent review confirmed that a one-hour mtime cleanup cannot establish
that a local publisher is dead. The candidate retains regular temporary files
while rejecting symlinks/unexpected file types. Abandoned candidates require
offline exclusive maintenance. Stale first-start marker candidates still
block admission without deletion; stale-marker admission and ordinary index/
object cleanup are deliberately separate boundaries.

The dated #885 proof remains unchanged in
[its immutable source history](https://github.com/szl-holdings/platform/blob/7c9a3af6a52f247caf7bd121b73d908b9f2ea381/audit/P1_ATELIER_CTIME_RACE_PROOF_20261003.md).
Earlier UNAVAILABLE results remain historical.

## Validation

| Command / observation | Exit | Result |
| --- | --- | --- |
| Native app Vitest suite, original app config | 1 | 32 cases passed; unchanged root-Unix-socket case timed out at its existing bound |
| Isolated unchanged root-socket case | 1 | Same timeout; repository case/config/timeout unchanged |
| Bounded plain Node Unix socket probe in fresh temporary directory | 0 | Reported ERROR / EPERM, confirming local environment restriction |
| New marker-disappearance native regression | 0 | One selected case passed |
| Independent peer bounded native selection | 0 | Twelve race/authority cases passed |
| Independent peer marker-disappearance case | 0 | One selected case passed |
| pnpm typecheck before editing | 1 | Cannot launch: turbo absent; full result UNAVAILABLE locally |
| pnpm typecheck after editing | 1 | Same missing turbo; native Typecheck remains mandatory |
| git diff --check | 0 | No whitespace errors |

Exact independently reviewed source SHA-256:
`c36c605d4407102ca85f4078c61fe724dd5ec8cb1c27bec3b8183f38ae54d9e4`.
Exact final regression-file SHA-256:
`7bff23bdd5bdb36ea1be9b3cc0f5105426538d290f5cd296a66515c9c599a601`.

New cases cover stable same-file retry, repeated metadata changes, replacement
with identical bytes, changed authentication bytes, first-start disappearance,
and actively paused index/object publications deliberately aged past the old
grace period. Existing regressions preserve growth/tampering, partial marker
writes, foreign-key rejection, single local lease, final-object retention,
encrypted replay, expiry and recovery boundaries.

This does not qualify the full suite as green locally. Hosted Linux CI must
execute the unchanged full suite including the socket case, plus full
Typecheck and all existing required checks, before normal protected squash.

## Boundaries

- **verification_notes:** Independent peer review found no blocking issue in the composed source, regression or documentation delta. Native hosted conclusions remain pending.
- **public_claim_check:** Per-process serialization/local filesystem lease do not establish distributed coordination, production identity, real provider completion or durable external-ledger evidence.
- **security_check:** No secrets, environment contents, provider/database effects, remote scanners, offensive operations or trust-policy bypasses were introduced or executed.
- **known_gaps_update:** Appended the temporary/final-object exclusive-maintenance gap while preserving every existing operational boundary.
