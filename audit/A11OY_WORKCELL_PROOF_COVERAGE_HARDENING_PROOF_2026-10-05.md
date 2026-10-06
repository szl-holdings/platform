# A11oy Workcell proof-coverage hardening proof

- `workcell_id`: `A11OY-WORKCELL-PROOF-COVERAGE-20261002`
- `prepared_date`: `2026-10-05` America/New_York; the final run occurred on `2026-10-06` UTC
- `implementation_commits`: `52263cd38823eb9e21c5136d01505d99e0e43bd4`, `b758bcfbc177236876c524e27cb2e765c87e00d7`
- `captured_source`: `b758bcfbc177236876c524e27cb2e765c87e00d7`
- `captured_tree`: `ec9eb4859a3d4d97eb11f062a8cc3b52c42b0461`
- `receipt_state`: `VERIFIED`
- `receipt_authority`: `LOCAL_NON_AUTHORITATIVE`
- `proof_level`: Level 4, local exact-source evidence only
- `product_state`: active prototype / `Partial`
- `fixture_result`: `INCOMPLETE` — 8 of 17 obligations satisfied

This packet supersedes the current-evaluator claims in
[`A11OY_WORKCELL_PROOF_COVERAGE_PROOF_2026-10-02.md`](A11OY_WORKCELL_PROOF_COVERAGE_PROOF_2026-10-02.md).
It does not erase that packet's historical source evidence. The result proved
here is narrower: the hardened evaluator and browser presentation fail closed
for the recorded fixture and challenge cases at the exact captured source. It
does **not** certify a complete proof chain, a hosted deployment, production
execution, or cryptographic authenticity.

## Context

An adversarial review of the original 12-obligation inspector found four
material assurance gaps:

1. A fixture could reach `COMPLETE` without resolving an actual
   `ExecutionTrace` record.
2. Duplicate identifiers could be selected by collection order, making the
   result ambiguous and order-dependent.
3. Malformed proof-integrity fields could be accepted as though they were
   structurally usable evidence.
4. The browser screenshots were tied to a commit by documentation, but the
   server did not independently bind every served byte and browser assertion to
   that exact source identity.

The hardening objective was to remove those fail-open paths without inventing
missing evidence. The current `wc-001` fixture intentionally remains
`INCOMPLETE`; lower counts after adversarial mutations are evidence that the
inspector detects loss or contradiction, not evidence of production failure.

## Plan

1. Expand the evaluator from 12 to 17 independently reported obligations.
2. Require unique, resolved records and a causal Workcell → contract → action →
   evaluation → trace → policy/approval → proof chain.
3. Validate the packet's structural integrity and terminal checksum without
   relabeling structural checks as signature verification.
4. Assert the exact baseline, every challenge result, live-region text, and
   reset behavior in a real browser at five widths.
5. Build from a clean exact commit, serve only manifest-matching bytes, expose a
   source-identity endpoint, and require the interaction receipt to report that
   identity as `VERIFIED`.
6. Preserve failed capture attempts and open assurance boundaries instead of
   weakening the gate to obtain a green result.

## Patch

### Commit `52263cd38823eb9e21c5136d01505d99e0e43bd4`

`fix(a11oy): fail closed on proof evidence [A11OY-WORKCELL-PROOF-COVERAGE-20261002]`

- Expanded the evaluator to 17 obligations.
- Requires uniqueness for referenced signals, contracts, proof packets,
  execution traces, policy evaluations, and approval records. Zero or multiple
  matches remain `UNAVAILABLE`; collection order is no longer authority.
- Requires a resolved `ExecutionTrace` and checks causal trace, action, and
  MirrorEval lineage rather than agreement among bare IDs.
- Checks trace verification state and time, packet subject/context,
  policy/approval binding, SHA-256-shaped packet reference, non-empty payload,
  unique witnesses, parseable issue time, and terminal verification checksum.
- Keeps `COMPLETE` available only when all 17 obligations are `SATISFIED`.
- Updates the inspector copy to describe unique fixture records and state that
  even `COMPLETE` would not prove signatures, durable storage, operator
  identity, external attestation, or production execution.
- Strengthens unit, source-contract, and browser assertions, and upgrades the
  source-bound wrapper to serve only the bytes in its clean-build manifest.
- Marks the older proof packet as historical and records the residual gap in
  the known-gap register.

The commit changed eight files with 1,192 insertions and 91 deletions.

### Commit `b758bcfbc177236876c524e27cb2e765c87e00d7`

`fix(a11oy): honor explicit proof browser [A11OY-WORKCELL-PROOF-COVERAGE-20261002]`

The first exact-source capture exposed that the canonical capture process did
not honor `PLAYWRIGHT_CHROMIUM_PATH`. This follow-up validates an absolute
explicit executable path, uses it when supplied, and records only its source
and basename in proof metadata. A source-contract assertion prevents the
support from disappearing silently. The commit changed two files with 29
insertions and 3 deletions.

## Test

All listed passing checks used the existing workspace installation. The final
source-bound wrapper did not perform a new dependency install, so it does not
claim the installed dependency bytes as authoritative promotion evidence.

| Check | Result |
| --- | --- |
| `pnpm --filter @workspace/a11oy test:series-a` | PASS — 38/38 tests |
| Direct `workcell-proof-coverage.test.ts` run | PASS — 12/12 evaluator tests |
| Direct `product-wiring-contract.test.mjs` run | PASS — 10/10 source-contract tests |
| `pnpm --filter @workspace/a11oy typecheck` | PASS |
| `pnpm --filter @workspace/a11oy build` | PASS — 3,346 modules transformed |
| Scoped Biome check | PASS |
| `pnpm docs:claims-check` | PASS — 26/26 claim checks |
| Node syntax checks | PASS |
| `git diff --check` | PASS |
| Final exact-source canonical capture | PASS — 75/75 captures, 0 failures |
| Final exact-source interaction matrix | PASS — 180/180 states at 320, 390, 768, 1366, and 1728 px |
| Served source identity | `VERIFIED` in the interaction receipt |

The 180-state matrix covers 15 initial routes at all five widths, Workcell
filters and navigation, replay and demo transitions, proof-chain interactions,
all four proof-coverage challenge states plus reset, and mobile-drawer behavior.
Every record reports `PASS`.

## Screenshot

The filenames use the client date (`2026-10-05`); the receipt retains the exact
UTC capture times on `2026-10-06`.

| Evidence | Exact observation |
| --- | --- |
| [Desktop, 1366×900 viewport](../docs/assets/screenshots/current/a11oy-workcell-proof-coverage-hardened-desktop-2026-10-05.png) | `/a11oy/workcells/wc-001/replay`; captured `2026-10-06T03:28:11.162Z`; HTTP 200; SHA-256 `33886e8549c9f58e3b727f6f9cf370d23b215e4771c496ee27ad0a5c408d869a`; 376,572 bytes |
| [Mobile, 390×900 viewport](../docs/assets/screenshots/current/a11oy-workcell-proof-coverage-hardened-mobile-2026-10-05.png) | `/a11oy/workcells/wc-001/replay`; captured `2026-10-06T03:28:06.069Z`; HTTP 200; SHA-256 `a462d2ed21900c0ad2751578782982448e2af6b0c13a67f5fa1ca35420b5b245`; 379,802 bytes |

Visual inspection of both retained PNGs confirmed a loaded A11oy application
frame, the Workcell replay detail, the hardened 17-obligation inspector, and
the honest `INCOMPLETE` 8/17 baseline. Desktop and mobile layouts remain
readable with no clipped content, overlay, error, or placeholder state. The
browser receipt independently reports no horizontal overflow, clipped
elements, text overflow, unnamed controls, undersized controls, console errors,
page errors, request failures, bad responses, or undeclared requests for these
captures. Scroll-reveal checks reached the page bottom and returned to the top.

These are browser-generated captures of the exact served build. No image edit,
synthetic generation, post-capture compositing, or content replacement was
used.

## Verify

### Baseline obligations

| Obligation | Baseline | Meaning in this fixture |
| --- | --- | --- |
| `signal-records` | `UNAVAILABLE` | Referenced signal records do not resolve uniquely. |
| `contract-record` | `SATISFIED` | A unique inspected contract resolves. |
| `action-context` | `SATISFIED` | The Workcell and contract action context agrees. |
| `evaluation-lineage` | `SATISFIED` | The available evaluation lineage is internally consistent. |
| `contract-integrity` | `SATISFIED` | Required contract structure is present and well formed. |
| `origin-signal` | `SATISFIED` | The contract's origin-signal reference agrees with the Workcell reference. |
| `action-binding` | `SATISFIED` | The contract action matches the Workcell ActionBrief. |
| `trace-binding` | `UNAVAILABLE` | Trace IDs agree, but no `ExecutionTrace` record resolves in the supplied registry. |
| `policy-evaluation` | `UNAVAILABLE` | No unique referenced policy-evaluation record resolves. |
| `approval-binding` | `UNAVAILABLE` | The approval-required path lacks a resolvable approval record. |
| `proof-reference` | `SATISFIED` | The inspected contract contains a proof-packet reference. |
| `proof-subject` | `MISMATCH` | Packet subject does not match the required causal subject. |
| `proof-context` | `MISMATCH` | Packet context does not match the required causal context. |
| `proof-policy-binding` | `UNAVAILABLE` | There is no resolved policy record to bind to the packet. |
| `proof-approval-binding` | `UNAVAILABLE` | There is no resolved approval record to bind to the packet. |
| `proof-integrity` | `SATISFIED` | The packet has a SHA-256-shaped reference, payload, unique witnesses, and parseable issue time. This is not signature verification. |
| `terminal-state` | `MISMATCH` | Terminal status or the verification checksum is missing or malformed. |

Aggregate result: `INCOMPLETE`, 8/17 obligations satisfied.

### Adversarial browser cases

Each expectation below was asserted at all five widths. The browser checked the
aggregate state, exact count, all 17 per-obligation statuses, detail text,
polite live-region message, active-challenge label, and reset restoration.

| Scenario | Expected and observed result |
| --- | --- |
| Baseline | `INCOMPLETE` — 8/17 |
| Remove proof reference | `INCOMPLETE` — 6/17 |
| Substitute action ID | `INCOMPLETE` — 7/17 |
| Omit approval reference | `INCOMPLETE` — 8/17; approval-dependent evidence remains unavailable and the omission is named |
| Apply all three challenges | `INCOMPLETE` — 5/17 |
| Reset | Restores the exact baseline state, count, statuses, details, and live message |

No challenge can increase the aggregate to `COMPLETE`. Duplicate records,
missing registries, malformed integrity fields, mismatched lineage, and an
unresolved trace all fail closed.

## Proof

### Exact source and run identity

| Field | Value |
| --- | --- |
| Repository | `szl-holdings/platform` |
| Local ref | `work` |
| Source revision | `b758bcfbc177236876c524e27cb2e765c87e00d7` |
| Source tree | `ec9eb4859a3d4d97eb11f062a8cc3b52c42b0461` |
| Source commit time | `2026-10-06T03:23:10Z` |
| Capture environment | `local-exact-head` |
| Capture run identity | `codex-cloud-local-b758bcfbc-source-bound-capture` |
| Capture wrapper workcell identity | `P0-SERIES-A-PRODUCT-WIRING-20260811` |
| Authority | `LOCAL_NON_AUTHORITATIVE` |
| State | `VERIFIED` |
| Static server | In-process loopback, `no-store`, `/a11oy/` base path |
| Identity endpoint | `/a11oy/__source-identity.json` |
| Allowed browser origin | The run-local `http://127.0.0.1:34837` only |

The wrapper created a fresh temporary Vite build, served 348 manifest-bound
assets totaling 16,669,400 bytes, and rehashed the manifest after capture. The
pre- and post-capture manifest hashes match.

### Receipt and artifact hashes

| Object | SHA-256 |
| --- | --- |
| [Retained source-bound metadata](a11oy-workcell-proof-coverage-hardened-source-bound-metadata-2026-10-05.json.txt) | `c2d86053fa04854731dc23bc641efacae575db483830afa4195aede9cab3bf35` |
| Canonical `metadata.json` from the generated run | `9081594be429614aebf9e787ca4206c374cdb8431587b95e30dfc6868c92501f` |
| [Retained interaction receipt](a11oy-workcell-proof-coverage-hardened-interactions-2026-10-05.json.txt) | `1c6248f3fd5dc347ddcb6e79b342d1a26dc95758d60e989e038c0675f2a6a752` |
| Served-asset manifest, before and after capture | `de43cc7533f856653fc4bb9de54843973465e9c418b6803e424d15cc1ea7d500` |
| Served `index.html` | `554868ec088a9883d993c8b06451b5a8f7a81b5cea9aaf3c8c0fb8a6e15897c1` |
| Proof nonce digest | `9ef42f5ab81ab5e5944da90e48a1056d44318b6e112b4b8ef5e48b435c3b9afa` |
| Desktop PNG | `33886e8549c9f58e3b727f6f9cf370d23b215e4771c496ee27ad0a5c408d869a` |
| [Desktop metadata sidecar](a11oy-workcell-proof-coverage-hardened-desktop-2026-10-05.screenshot.json) | `670808e37b5f50a2d677605438c013d740eca5b5c3b4ef066d5155674c277b20` |
| Mobile PNG | `a462d2ed21900c0ad2751578782982448e2af6b0c13a67f5fa1ca35420b5b245` |
| [Mobile metadata sidecar](a11oy-workcell-proof-coverage-hardened-mobile-2026-10-05.screenshot.json) | `06ba4f36ad224b90bc3c094feeee1aa818486f0e1c0f234666055ef2a0f955a0` |

### Captured verifier-input hashes

| Input | SHA-256 |
| --- | --- |
| `audit/series-a-screenshot-capture-plan.json` | `7655fa40054d8f048bf55ac45f67c84c6bc52d3ec729ee4a7689002a96c2a384` |
| `scripts/qa/capture-series-a-product-matrix-proof.mjs` | `eb8855dc4e231261d062980998d80b31bc796f8cde1b984b882935a2cbef1427` |
| `scripts/qa/capture-screenshot-proof.mjs` | `feec1a25679ae0357f02dbcce0f3cd143e09c44a254c7019f879a7d9b6427d75` |
| `scripts/qa/screenshot-layout-helpers.mjs` | `df569643a305085326f679e4d0e4f121cbe8eea5dc91705dfc07824a5be81a4d` |
| `scripts/qa/a11oy-product-interactions.mjs` | `b695cb60421b48dc6ff451493cf8125b0aa30554e531e1d19b8e16da931c7284` |
| `artifacts/a11oy/vite.config.ts` | `2d34b628840080e0aaa78538a0c89d612c3c939480e48117f1b433d36bcfa713` |
| `artifacts/a11oy/src/index.css` | `5c0d6634f713a9df52ba1f35b793810329ae3f83a37a1079649201d71c1f3721` |
| `pnpm-lock.yaml` | `004b20e2c5a7d1e89c9933599badbf6e00fbdabdfaba7b99fa689779fb20ad3b` |
| Root `package.json` | `71104078d5822e36b4365e8118e95e1aa7f4baf5bcb7e130560d5d06462f6f5b` |

### Toolchain

| Tool | Recorded identity |
| --- | --- |
| Operating system | Linux `6.18.44`, x64 |
| Git | `2.52.0` |
| Node.js | `v24.19.0` |
| Declared package manager | `pnpm@10.26.1` |
| Vite | `8.0.16`; package manifest SHA-256 `a2b943431b51bfcc2e9386eecf8b4b3f6e4bf443e56d17b1f4c8495a61b4050c`; CLI SHA-256 `fa03478846d229651a3c6aa64833ba2c6cbf580a798b92bd8f47c7480bafb5d8` |
| Playwright | `1.60.0`; package manifest SHA-256 `cf92117ef1d8cbf1e4b2dffb63a0da552c0173bd6052f0f45711c0f00b79dc99` |
| Chromium | `151.0.7922.173`; explicit-environment-path source; executable basename `chromium` |

### Honest failed attempts and remediation

- An initial `52263cd38` exact-head run was interrupted before producing an
  admissible receipt. It is retained at
  `/tmp/proof-52263cd38-interrupted-20261006` for local forensic continuity and
  is not counted as proof.
- The next `52263cd38` run failed because the canonical capturer ignored the
  explicit Chromium path while the pinned Playwright browser was unavailable.
  Its partial output is retained at
  `/tmp/proof-52263cd38-missing-browser-20261006` and is not counted as proof.
- The issue was repaired in `b758bcfbc`; the entire source-bound rail was then
  rerun against that exact clean commit. Only this final `VERIFIED` run supports
  the claims in this packet.

The failed attempts are not product regressions, but the second attempt exposed
a real reproducibility defect in the proof tooling. Recording and fixing it is
part of the assurance result.

## Remaining gaps and non-claims

- The current fixture is `INCOMPLETE` at 8/17. Missing unique signal, trace,
  policy, and approval records; mismatched packet subject/context; and malformed
  terminal evidence remain visible.
- `proof-integrity: SATISFIED` means only that the packet fields are
  structurally usable. No public-key signature, trust root, revocation status,
  transparency log, or external attestation was verified.
- The evaluator does not establish durable or append-only persistence,
  authenticated operator identity, authorization enforcement, an external side
  effect, customer use, or production execution.
- The local receipt does not prove parity with a hosted deployment, DNS/TLS
  posture, a remote branch, CI, a protected promotion gate, or live services.
- The system Chromium version is recorded, but this packet does not claim a
  cryptographic hash for the browser executable.
- This proof document and the retained evidence copies are documentation
  successors to the captured commit. The receipt binds the implementation and
  served build at `b758bcfbc`; it cannot recursively bind this later packet.

## Doctrine packet fields

| Field | Recorded value |
| --- | --- |
| `workcell_id` | `A11OY-WORKCELL-PROOF-COVERAGE-20261002` |
| `agent` | Codex / Pathfinder / PatchPilot / PixelProof / ClaimGuard / ProofSmith |
| `objective` | Make proof-coverage evaluation and exact-source browser evidence fail closed without manufacturing missing runtime evidence. |
| `plan_summary` | Expand and harden the evaluator, assert every baseline/challenge obligation in a real browser at five widths, and bind served bytes and interactions to an exact clean source. |
| `patch_summary` | Commits `52263cd38823eb9e21c5136d01505d99e0e43bd4` and `b758bcfbc177236876c524e27cb2e765c87e00d7`; 17-obligation evaluator, source-bound serving, stronger browser assertions, and explicit Chromium-path support. |
| `test_results` | The Test table above records every command/result, including 38/38 Series A tests, 12/12 evaluator tests, 10/10 wiring tests, typecheck, build, claim checks, 75/75 captures, and 180/180 browser states. |
| `screenshot_refs` | Desktop and mobile `/a11oy/workcells/wc-001/replay` captures above; complete entries in [`audit/screenshot-catalog.md`](screenshot-catalog.md). |
| `verification_notes` | Source revision, tree, build manifest, index, verifier inputs, interaction matrix, receipt hashes, and retained PNG hashes were independently cross-checked. The fixture remained honestly `INCOMPLETE` at 8/17. |
| `public_claim_check` | **PASS** — local structural assurance is separated from proof completeness, cryptographic verification, deployment, and production operation. |
| `security_check` | **PASS** — no secret, token, `.env` value, credential, or browser-path directory is recorded. |
| `known_gaps_update` | **RECORDED** — [`docs/operations/known-gaps.md`](../docs/operations/known-gaps.md) preserves the 8/17 fixture gaps and every non-claim above. |
| `proof_level` | Level 4, local exact-source evidence only. |
| `recorded_at` | `2026-10-06T04:16:52Z` |
| `recorded_by` | ProofSmith, with independent read-only claim review. |

## Conclusion

`VERIFIED` means that the exact local source at `b758bcfbc` built, served only
manifest-matching bytes, exposed a matching source identity, rendered all 75
planned captures without a recorded failure, and passed all 180 browser states.
The 17-obligation evaluator consistently preserved `INCOMPLETE` for the current
fixture and every adversarial challenge.

The appropriate public statement is therefore: **the local proof-coverage
inspector has exact-source evidence that its recorded structural checks fail
closed for the tested cases.** It is not appropriate to state that the Workcell
proof chain is complete, cryptographically verified, durably stored, externally
attested, deployed, or production-operational.
