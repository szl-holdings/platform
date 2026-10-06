# A11oy kernel-mutation hardening proof

- `workcell_id`: `A11OY-WAKE-RECEIPT-HARDENING-20261005`
- `truth_successor_workcell_id`: `A11OY-KERNEL-TRUTH-20261005`
- `credential_separation_successor_workcell_id`:
  `A11OY-KERNEL-AUTH-SEPARATION-20261005`
- `read_boundary_successor_workcell_id`:
  `A11OY-KERNEL-READ-BOUNDARY-20261005`
- `prepared_date`: `2026-10-05` America/New_York; verification completed on
  `2026-10-06` UTC
- `implementation_commits`: `c65edd118dae25678b98307ee0f9f5bc85db7b7a`,
  `4e633b08464afd00f4228b962821bc3f66c361e0`,
  `b0c6c6070caafef7a0e2aa4712a151e5a5d54e0c`,
  `99305772172270109f1023da6987a6ca32445847`
- `source_tree`: `d9fb20160c0fe8b18d4d21ab667060646771653d`
- `pre_patch_source`: `b758bcfbc177236876c524e27cb2e765c87e00d7`
- `module_sha256`: `0b045cd3f61d1060d9aafc7340ffe00d6328f9a560cce285867ba85ae62d1c73`
- `authentication_commit_module_sha256`: `6353b2902378f3c3ec2b7749ac254ac3d4fe84610ecc0f16671e08d4d562a445`
- `proof_level`: Level 2, local source and test evidence; no UI surface changed
- `runtime_authority`: `LOCAL_NON_AUTHORITATIVE`
- `hosted_state`: `UNOBSERVED`

This packet records a source-level security correction and focused local
verification. It does **not** claim that the commit is deployed, that either
required secret is configured, that a hosted workflow has passed, or that a
live Space accepted or denied a request.

## Context

At pre-patch source `b758bcfbc177236876c524e27cb2e765c87e00d7`, the
scheduled `warm-flagships` workflow posted directly to
`/api/a11oy/v3/kernels/wake-receipt` without authentication. The vendorable
kernel handler accepted caller-controlled JSON and appended it to the SIGN
kernel's SQLite-backed, hash-linked Codex without an exact schema, a request
size bound, timestamp freshness, or durable idempotency. The forced `tick`
mutation had no authentication check; `start` and `stop` accepted an admin
credential through either a custom header or a query string. The estate audit
classified the exposed source path as a P1 security finding. Whether that
exact code was reachable on a hosted Space was not observed and is not
inferred here.

## Plan

1. Put every kernel mutation behind fail-closed, header-only Bearer
   authentication, using separate wake-receipt and administrator secrets and
   rejecting a configuration in which their values are equal.
2. Bound and validate the wake body before it can reach the ledger, including
   caller identity, revision, event, run identity, and freshness.
3. Make retries atomic and idempotent in SQLite, including across concurrent
   database connections, while rejecting key reuse with substantive drift.
4. Make the calling workflow fail before network activity when its dedicated
   secret is absent and fail on a non-conforming response.
5. Add dependency-free regression coverage, retain the existing controller
   contract, compile the Python sources, parse the workflow YAML, and perform
   an independent adversarial review.
6. Bound Codex pagination and state the still-open read-authorization and
   data-minimization decision explicitly.
7. Preserve every deployment, identity, durability, capacity, and signing
   boundary as an explicit residual rather than relabeling local tests as live
   closure.

## Patch

Commit `c65edd118dae25678b98307ee0f9f5bc85db7b7a` is titled
`fix(kernels): authenticate receipt mutations
[A11OY-WAKE-RECEIPT-HARDENING-20261005]`. It has tree
`24b619d654f2dffed9d084d7cebdc7c54a5335d2`, parent
`b758bcfbc177236876c524e27cb2e765c87e00d7`, and changes three files with
1,011 insertions and 38 deletions.

### Wake-receipt boundary

- The handler requires a dedicated `SZL_WAKE_RECEIPT_TOKEN` supplied as an
  `Authorization: Bearer` header. A missing, blank, non-ASCII,
  whitespace-bearing, or value outside the 32–512-byte accepted range leaves
  the service unavailable for this mutation; it does not fall back to
  anonymous access. This is a syntax/length gate, not an entropy measurement.
- Presented and configured credentials are compared as fixed-length SHA-256
  digests with `hmac.compare_digest`. Missing or incorrect credentials return
  an authentication failure without appending a receipt.
- The handler streams at most 1,024 bytes, so a false-small `Content-Length`
  cannot bypass the actual-body cap. It rejects an oversized declared length,
  a non-JSON media type, non-UTF-8 or malformed JSON, a non-object body, and
  duplicate JSON keys.
- The body must contain exactly `source`, `repository`, `run`, `run_attempt`,
  `sha`, `event`, and `ts`, all as strings. The canonical source and repository
  are allowlisted, the Git revision must be 40 lowercase hexadecimal
  characters, run fields are bounded decimal identifiers, and the event must
  be one of the enumerated workflow triggers.
- The timestamp must be a valid UTC second timestamp within plus or minus 300
  seconds of server time. Accepted input is normalized into a
  `szl.wake-receipt.v1` envelope before append.

### SQLite idempotency

- A durable uniqueness key of repository, workflow run, and run attempt is
  stored alongside the original entry identity and request hash.
- `BEGIN IMMEDIATE` encloses lookup, ledger append, and idempotency insert.
  Concurrent retries through distinct SQLite connections therefore return one
  first append and one replay in the focused test rather than two entries.
- A legitimate retry returns the original `entry_id` and `entry_hash`, marks
  `replay: true`, and reports the current Codex head. Reuse of the same key with
  substantive request drift returns HTTP 409.
- General Codex appends are also transaction-wrapped and rolled back on
  failure. These controls do not impose a rate, quota, retention policy, or
  multi-host database architecture.

### Administrative mutations

- `tick`, `start`, and `stop` all require a separate `SZL_ADMIN_TOKEN` through
  the standard Bearer header. Configured admin and wake tokens each must satisfy
  the 32–512 ASCII/no-whitespace syntax contract; if both accepted values are
  equal, both mutation gates fail closed with service unavailability.
- An unavailable or syntactically invalid server-side admin secret fails closed
  with service unavailability. A missing or incorrect presented token is
  unauthorized.
- The previous `x-szl-admin-token` header and `admin_token` query-string paths
  are rejected, keeping credentials out of URLs and applying one gate to all
  three mutation routes.

### Workflow caller

- `.github/workflows/warm-flagships.yml` now includes the kernel module and its
  tests in the controller contract and path triggers.
- The receipt job uses only the dedicated `SZL_WAKE_RECEIPT_TOKEN` binding and
  exits before `curl` when it is absent. It does not substitute the admin
  credential.
- The job constructs the exact bounded request fields, sends the secret only
  in the Bearer header, treats HTTP failure as job failure, caps the downloaded
  response, and rejects a response that does not match the expected receipt
  identity/hash/replay contract. The earlier failure-masking path is absent.

### Truth-state successor

Commit `4e633b08464afd00f4228b962821bc3f66c361e0` is titled
`fix(kernels): report unavailable substrate work honestly
[A11OY-KERNEL-TRUTH-20261005]`. It has tree
`08090886ffe105f67a920b1c52e424a9cdffd65e`, parent
`c65edd118dae25678b98307ee0f9f5bc85db7b7a`, and changes two files with 112
insertions and 31 deletions.

Before that successor, unconnected kernel subclasses inherited implementations
that reported named observe/act work as successful. The successor makes every
unconnected non-chain kernel across all five canonical organs return
`did_work=false` and `UNAVAILABLE: substrate adapter not connected`. `chain`
claims only verification of its local Codex hash links. A successful forced
tick's `alive=true` field proves only that the individual tick path completed;
it does not prove the scheduler is running or any external substrate acted.
Two dependency-free tests exercise 40 non-chain tick cases and each organ's
valid and tampered local-chain result.

### Credential-separation successor

Commit `b0c6c6070caafef7a0e2aa4712a151e5a5d54e0c` is titled
`fix(kernels): enforce credential separation
[A11OY-KERNEL-AUTH-SEPARATION-20261005]`. It has tree
`4d427c82e10d07c01eb42d98ae46b6b8d27bab01`, parent
`4e633b08464afd00f4228b962821bc3f66c361e0`, and changes two files with 30
insertions and one deletion.

This final successor closes the configuration edge case in which the two
separately named capabilities could be assigned the same value. It compares
the two accepted ASCII configurations and disables both mutation gates when
they are equal. A regression test proves that the shared value receives `503`
from both wake-receipt and forced-tick routes and appends no receipt.

### Read-boundary successor

Commit `99305772172270109f1023da6987a6ca32445847` is titled
`fix(kernels): bound Codex reads [A11OY-KERNEL-READ-BOUNDARY-20261005]`. It has
tree `d9fb20160c0fe8b18d4d21ab667060646771653d`, parent
`b0c6c6070caafef7a0e2aa4712a151e5a5d54e0c`, and changes two files with 50
insertions and six deletions.

The successor rejects Codex read limits outside 1–100 and offsets outside
0–10,000, preventing callers from requesting an unbounded result or
pathological scan position. It also removes the inaccurate claim that route
registration can never shadow an existing route: the caller must reserve the
organ prefix. The Codex read route remains unauthenticated in this source.
That is an explicit open authorization and data-minimization decision, not a
claim that every ledger entry is safe for public disclosure.

## Test

The implementation run and this proof assembly both observed the two focused
test suites passing at the exact implementation source:

| Check | Exit | Result |
| --- | ---: | --- |
| `PYTHONDONTWRITEBYTECODE=1 python .github/scripts/test_warm_flagships.py` | 0 | PASS — 14/14 existing controller tests |
| `PYTHONDONTWRITEBYTECODE=1 python packages/szl-kernels/tests/test_szl_kernels_organ.py` | 0 | PASS — 22/22 tests: 20 boundary/security and 2 truthfulness tests |
| `python -m py_compile` over the controller, its test, the kernel module, and its security test | 0 | PASS — 4/4 source files |
| Python `yaml.safe_load()` parse of `.github/workflows/warm-flagships.yml` | 0 | PASS |
| `git diff --check` | 0 | PASS |

The 20-test boundary/security contract covers unavailable and incorrect
credentials, cross-token rejection, equal configured-token rejection, valid
normalization, replay identity, conflicting idempotency reuse, simultaneous
retries across SQLite connections, stale and future timestamps, malformed and
oversized bodies, missing and unknown keys, caller spoofing, invalid
run/timestamp values, duplicate keys, media type, admin fail-closed behavior,
removal of legacy credentials, accepted administrator mutations, the
workflow's missing-secret guard, and bounded Codex pagination. The two
truthfulness tests cover the 40
non-chain tick cases and valid/tampered local chain verification across all five
canonical organs.

The 14-test controller suite continues to cover health classification,
incident lifecycle, report credential exclusion, the canonical roster, and
the separation of pull-request observation from protected-run mutation. No
network request or hosted deployment was used as evidence for these local
test results.

## Screenshot

`N/A` — the patch changes a Python API module, its tests, and a GitHub Actions
workflow. It does not change a browser UI surface, so no screenshot is offered
as proof.

## Verify

Independent read-only adversarial review occurred after each successor and a
final mutation review ran after `b0c6c6070`, followed by a bounded-read
successor and focused regression run at `993057721`. Review inspected the committed source,
workflow, tests, diff statistics, and evidence counts; re-checked the
authentication order, body bound, exact schema, clock-skew gate,
replay/conflict behavior, cross-connection append-once result, administrative
route coverage, legacy-credential rejection, equal-token fail-closed behavior,
truthful substrate state, and workflow guard. The final reviewer found no new
source-level code blocker in this scope and independently confirmed the 14/14
controller and 22/22 kernel results, Python compilation, and whitespace check.
Proof assembly separately parsed the workflow YAML successfully.

That result is deliberately scoped. “No new source-level code blocker” is not
a penetration test, deployment attestation, hosted CI result, secret audit,
availability claim, or proof that an internet-facing instance runs these
bytes.

## Proof

### Source binding

| Object | Identity |
| --- | --- |
| Repository | `szl-holdings/platform` |
| Authentication baseline | `c65edd118dae25678b98307ee0f9f5bc85db7b7a`; tree `24b619d654f2dffed9d084d7cebdc7c54a5335d2`; committed `2026-10-06T03:58:50Z` |
| Truth-state successor | `4e633b08464afd00f4228b962821bc3f66c361e0`; tree `08090886ffe105f67a920b1c52e424a9cdffd65e`; committed `2026-10-06T04:21:58Z` |
| Current credential-separation successor | `b0c6c6070caafef7a0e2aa4712a151e5a5d54e0c`; tree `4d427c82e10d07c01eb42d98ae46b6b8d27bab01`; committed `2026-10-06T04:30:18Z` |
| Current read-boundary successor | `99305772172270109f1023da6987a6ca32445847`; tree `d9fb20160c0fe8b18d4d21ab667060646771653d`; committed `2026-10-06T05:47:50Z` |
| Pre-patch parent | `b758bcfbc177236876c524e27cb2e765c87e00d7` |
| Kernel module | `packages/szl-kernels/deploy/szl_kernels_organ.py` |
| Authentication-baseline module SHA-256 | `6353b2902378f3c3ec2b7749ac254ac3d4fe84610ecc0f16671e08d4d562a445` |
| Current module SHA-256 | `0b045cd3f61d1060d9aafc7340ffe00d6328f9a560cce285867ba85ae62d1c73` |
| Current test SHA-256 | `e426d2f07e97df71d66ea6b263e21e01eb2a3e63e6674c323c00e2b62544c02d` |
| Evidence authority | Local exact-source tests and review only |

### Residual boundaries

1. **Not deployed.** At the packet's recorded cutoff, no remote push, merge,
   protected-branch admission, Space deployment, hosted exact-head test, or
   authorized live deny/accept/replay/readback sequence had been observed. This
   packet does not itself establish any subsequent remote publication or
   deployment.
2. **Secrets unconfigured and unobserved.** The source enforces unequal
   `SZL_WAKE_RECEIPT_TOKEN` and `SZL_ADMIN_TOKEN` values with a 32–512-byte
   ASCII/no-whitespace syntax boundary, but does not measure entropy. Their
   existence, matching configuration on GitHub and the hosted runtime,
   rotation, and operator custody were not observed. No secret value was read
   or recorded.
3. **Static credentials, not workload identity.** The implemented Bearer
   boundary uses long-lived static secrets. It is not repository-, workflow-,
   audience-, or run-bound OIDC. A staged migration to short-lived verified
   workload identity remains required; wake and admin authority must remain
   separate during that migration.
4. **No durable abuse/capacity policy.** The patch has no durable request-rate
   limit, per-principal quota, storage quota, or retention/compaction policy.
   Those controls must preserve the hash chain and idempotency semantics.
5. **Durability requires a persistent mount.** SQLite survives a process or
   image rebuild only when `SZL_CODEX_DIR` resolves to a persistent mounted
   directory. The default `/tmp/szl_codex` is not durable deployment evidence,
   and this packet does not test restore behavior.
6. **Signing can remain a placeholder.** When the host does not provide the
   expected signer, the module intentionally emits an explicitly labeled
   placeholder envelope. Hash linkage and an `entry_hash` do not establish
   cryptographic signer identity or signature verification.
7. **Legacy clients need coordinated migration.** Any caller still using the
   removed custom admin header or query parameter will now fail. Inventory,
   rollout, monitoring, and rollback for those callers remain operational
   work.
8. **Named substrate adapters remain unavailable.** Lifecycle and mutation
   contracts are tested with a dependency-free fake application/client. The
   source does not implement the named application adapters, and this packet
   does not establish real FastAPI startup/SSE integration, route-collision
   behavior, or continuous background execution.
9. **Codex reads have no authorization policy.** Pagination is now bounded to
   100 entries and an offset of 10,000, but `GET .../{name}/codex` remains
   unauthenticated. Before public exposure, classify the ledger data, bind
   reads to authenticated tenant/role policy, minimize response fields, and
   add deny/allow tests. No public-read decision is inferred here.

### Doctrine packet fields

| Field | Recorded value |
| --- | --- |
| `workcell_id` | `A11OY-WAKE-RECEIPT-HARDENING-20261005` with truth, credential-separation, and read-boundary successors identified above |
| `agent` | Codex / PatchPilot / ProofSmith / independent AuditTitan-style reviewer |
| `objective` | Fail closed on kernel mutation authority, append wake receipts idempotently, report unavailable substrate work honestly, prevent the admin and wake capabilities from sharing one configured credential, and bound Codex reads without overstating read authorization. |
| `plan_summary` | Authenticate every mutation; bound and normalize the wake request; make replay atomic; harden the workflow caller; correct kernel truth state; enforce credential inequality; bound read pagination; test and independently review exact committed sources. |
| `patch_summary` | Four forward-only commits implement the authentication/idempotency baseline, truthful unavailable-adapter behavior, equal-token fail-closed successor, and bounded Codex reads. |
| `test_results` | PASS — controller 14/14; kernel 22/22 (20 boundary/security + 2 truthfulness); focused Python compile; workflow YAML parse; `git diff --check`. |
| `screenshot_refs` | `N/A` — API, workflow, and dependency-free contract changes only. |
| `verification_notes` | Exact commits, trees, file hashes, counts, independent review, and residual boundaries are recorded above. No hosted test or deployment is inferred. |
| `public_claim_check` | PASS — source-level controls are separated from deployment/live claims. |
| `security_check` | PASS — no credential value or `.env` content is recorded. |
| `known_gaps_update` | `docs/operations/known-gaps.md`; hosted closure and residual controls remain open. |
| `recorded_at` | `2026-10-06T05:49:00Z` |
| `recorded_by` | ProofSmith with independent AuditTitan-style read-only adversarial review |

### Doctrine checks

- `public_claim_check`: PASS — the packet distinguishes implemented source
  controls from deployment and live runtime behavior.
- `security_check`: PASS — no secret, token value, `.env` content, or example
  production credential is recorded.
- `known_gaps_update`: the source-level closure and every residual above are
  recorded in `docs/operations/known-gaps.md`; hosted closure remains open.
- `screenshot_refs`: `N/A`; no UI surface changed.
- `recorded_at`: `2026-10-06T05:49:00Z`.
- `recorded_by`: ProofSmith, with an independent AuditTitan-style read-only
  adversarial review.
