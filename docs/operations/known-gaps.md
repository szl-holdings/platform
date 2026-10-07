# SZL Holdings — Known Gaps Register (Security & Operations)

**Last updated:** 2026-10-07 (rev 36 — frontier candidate truth and Python delivery boundary)
**Owner:** Engineering / DevOps  
**Audience:** Enterprise architects, Series A technical advisors, incoming VP Engineering

This document is the canonical reference for known security, quality, and compliance gaps in the SZL Holdings platform. It consolidates findings from the internal risk register, the April 2026 hardening sprint, and the secrets remediation audit.

> **Freshness boundary for rev 36:** rev 36 adds only candidate local source
> boundaries recorded below; it does not re-observe any external
> state. It carries forward the four narrow, dated receipts scoped in rev 34:
> GitHub repository metadata, the Platform repository ruleset, the Hugging Face
> public-catalog snapshot, and bounded domain homepage transactions. Each
> receipt establishes only its recorded transaction at its
> `observed_at`/`observedAt` time. It does not make
> any wider repository, deployment, model, dataset, Space, DNS, certificate, or
> route state fresh. Unless a later section names one of those current receipts,
> dated external results below are **RETAINED HISTORY**, not present-tense
> status. Unobserved estate state remains **UNKNOWN / HOLD** under the
> [2026-10-05 prepublish audit](../../audit/SZL_ESTATE_PREPUBLISH_AUDIT_2026-10-05.md).

> **Current backend-topology boundary:** `artifacts/api-server` is a historical
> compatibility stub with only a narrow export and a typecheck script. Startable
> Express implementations currently present in source are
> `apps/alloy-runtime-api`, `apps/alloy-embedding-api`, and
> `apps/alloy-ingestion-orchestrator`; additional TypeScript and Python services
> exist under `services/*`, `workers/*`, and `apps/*`. Source presence does not
> establish deployment, provider, production authority, or customer-data use.
> Older dated entries below that name a large `artifacts/api-server` route tree
> describe their historical source state, not the current stub.

### AEF-INGEST-001 — retry/idempotency remains a production hold

Candidate source now makes the local AEF smoke exercise one real
ingest → hybrid-search → eval chain. Per-document retrieval indexing attempts
best-effort compensating deletes for completed writes when a later write fails,
and a mixed batch returns HTTP 207 with ordered per-document results while
retaining successful writes.
These are local in-memory regression results, not a pgvector, deployment, crash
recovery, or production-runtime witness.

`POST /v1/ingest` still has no durable tenant-scoped reservation or completed-
request registry keyed by `requestId`, no payload-fingerprint conflict check,
and no transactional source-replacement rule. A client retry can therefore run
the workflow again, and repeated ingestion of one source can accumulate chunks
with newly generated IDs. The gateway's compensating deletes also cannot make
the separate orchestrator store atomic across an adapter failure or process
crash. Exactly-once and duplicate-safe ingestion remain **UNAVAILABLE / HOLD**
for production claims until a durable idempotency record, conflict semantics,
source replacement, and real-adapter crash/retry tests exist. A process-local
response cache is not an accepted substitute.

Candidate source now enforces that boundary: production workflow submission,
ingest, index, eval, and approval-resume routes return HTTP 503 with
`DURABLE_ORCHESTRATOR_STATE_REQUIRED`; standalone orchestrator readiness reports
`EVALUATION_HOLD`. Production hybrid retrieval also rejects the in-memory store,
and aggregate embedding-API readiness remains HTTP 503 while retrieval,
evidence-ledger, or stateful workflow admission is held. These controls prevent
silent production admission. They do **not** implement
the missing durable stores, transactional approval resolution, idempotency, or
crash recovery, so this gap remains open.

The AEF evidence ledger is likewise not a production authority. Its default
store is process-local and the optional JSONL adapter is mutable and not
hash-chained. Production embed, rerank, hybrid-search, and multimodal-embed
routes now return HTTP 503 with `EVIDENCE_LEDGER_DURABILITY_REQUIRED` before
inference or evidence-ID minting; `/readyz` exposes the ledger
`EVALUATION_HOLD`. This closes false admission only. Durable authenticated
storage, tamper evidence, atomic request completeness, retention enforcement,
and independent verification remain open.

### FRONTIER-RELEASE-001 — exact candidate identity and generated truth remain HOLD

The 2026-10-07 hardening work is an uncommitted multi-lane working tree based on
`150b166171cbd339acb287f7f5d37809c21774ee`. It has no immutable release source
or tree identity yet. A prior local checkpoint passed focused governance,
security, runtime, and package tests, but later edits make those totals
historical rather than final-candidate evidence.

The source-of-truth validator failed three drift checks at
`2026-10-07T11:35:16.688Z`: the registry records 45 API route source files while
the working tree measures 44, it records 315 API handler declarations while the
tree measures 332, and it records 245 environment variables while the tree
measures 246. The local
vulnerability report was refreshed at `2026-10-07T11:26:02.054Z`; the license
report at `2026-10-07T11:26:18.409Z` covers 1,726 unique package/version pairs;
and the current `security/sbom-latest.json` contains 1,989 components with
SHA-256 `4ddcac69665a80ef9e7ebd53606ceb76c48fbc55b7d72bd09fd9a3b38736f198`.
These are frozen-manifest, pnpm-only local candidate checkpoints; they do not
cover Python dependencies, and none is bound to an immutable release commit or
hosted conclusion. The three deployable Python services still lack resolved,
hashed locks and Python SBOM, vulnerability, license, and reproducible-image
evidence. Do not hand-edit generated
counts or refresh timestamps. Freeze the remaining source candidate, revalidate
the lock-derived vulnerability report, license report, SBOM, API catalogue, and
truth registries, and regenerate any artifact whose inputs change. Then run the
complete typecheck/test/build/runtime suite and bind all receipts to the
resulting exact commit. Until then, release proof and public operational
promotion remain **HOLD**.

### PYWORKER-DELIVERY-001 — cross-worker delivery is not duplicate-safe

The Python claim boundary now has candidate bearer authentication, production
credential-to-tenant binding, header/body tenant consistency, stable HTTP error
semantics, and production rejection of the development embedding/reranking
heuristics. Those source improvements do not make the worker topology
production-ready.

`ClaimLoop` tracks active behavior only inside one process and has no durable,
shared `(tenantId, runId, stageId)` reservation or completed-result store. A
worker can accept and finish `POST /claim` while its response is lost; an engine
or proxy retry against another worker can execute the stage again. Candidate
source therefore sends the mutating request at most once and disables automatic
cross-upstream retry in the proxy sketches. Duplicate-safe retry and replay
remain **UNAVAILABLE / HOLD** until durable idempotency, payload-conflict rules,
result replay, crash/restart tests, and ambiguous-response tests exist.

`AutoscalingPolicy` currently produces recommendations only. No tracked
coordinator aggregates `/metrics`, invokes `evaluate()`, or changes replicas,
and the service exposes only its own worker view. Autoscaling and whole-fleet
status are **NOT IMPLEMENTED**, not deployment features. In addition, the
worker/inference/Lyte service dependency files use ranges without a committed
hashed lock or reproducible image receipt; dependency-backed pytest was not
available in the restricted onboarding environment. Packaging and deployment
remain **HOLD**.

### LOCAL-STACK-001 — source remediated; image/runtime proof remains HOLD

Candidate source now limits `ops/local/docker-compose.yml` to four present
Dockerfiles (`alloy-runtime-api`, `vessels`, `terra`, and `carlota-jo`), uses
repository-root build contexts, and requires an API key plus tenant identity
without defaults for the runtime API. `docker compose --env-file .env -f
ops/local/docker-compose.yml config --quiet` passes when those two required
values are supplied. This closes the missing-Dockerfile/retired-package source
defect.

No exact-image build, container startup, health/readiness, dependency, or
cross-service transaction receipt is bound to the candidate. The stack also
does not include PostgreSQL and is not a whole-platform topology. Container and
release evidence therefore remain **UNOBSERVED / HOLD** until the exact
candidate images build and the bounded runtime checks pass.

---

## Current Bounded Public Surface Registry — observed 2026-10-07

The generated public-surface manifest distinguishes source-tree product
inventory from route evidence. An initial bounded validator run on 2026-10-07
failed closed on seven differences from the expired 2026-08-11 registry. Review
of the exact external owners established intentional contracts for the two
A11oy.net trailing-slash documentation gateways, lowercase webmanifest identity,
same-origin Killinchu status and Command pages, and the changed Killinchu API
envelopes. The registry was updated from those reviewed sources rather than by
loosening response checks.

A subsequent full `surfaces:freshness` run passed all 29 approved targets and is
bound to `observed_at=2026-10-07T12:31:38.131Z`. Killinchu build identity is pinned
to full main revision `13477c429f5742cdc718a6294a80d00c7e8dc634` and the exact
GitHub OIDC attestation subject. Its readiness contract positively requires the
canonical ledger to be `EPHEMERAL`, `PROCESS_MEMORY`, and
`production_ready=false`; the separately labeled SQLite diagnostic store cannot
satisfy durability. Current whole-site DNS, TLS, headers, accessibility,
continuous availability, and functional behavior remain **UNKNOWN / HOLD**.
Public quantitative claims remain governed by the canonical metrics registry
and generated [`docs/platform-facts.md`](../platform-facts.md), not by historical
app directories, marketing copy, or route reachability alone.

This closes the seven known contract mismatches, not every web gap. `/lyte`,
`/aegis`, `/vessels`, `/terra`, `/counsel`, `/carlota-jo`, and `/pulse` remain
explicitly `UNAVAILABLE`; `/command/` is now a reachable, honestly `MIXED`,
modeled browser surface. The A11oy.net manifest, robots file, and sitemap remain
metadata rather than customer-facing product surfaces. A routed page is not an
uptime, customer, feature-completeness, or correctness claim; `LIVE`, `MIXED`,
and `DOCUMENTATION` are evidence modes, not production authority.

Repository source defines a `truth-drift` job that validates schema,
deterministic generated bytes, source ownership, expected status and redirect
behavior, bounded `robots.txt` and sitemap content, and HTTP observations when
the job can execute them. It accepts honest historical snapshot timestamps so
unrelated changes do not silently relabel them. The workflow source schedules
`pnpm surfaces:freshness` daily at `06:17 UTC` and exposes a manual
`require_surface_freshness` input. No current hosted surface-freshness run is
recorded by rev 34. An expired observation is remediated only by re-observing
every approved target, updating the registry evidence, regenerating the
deterministic artifacts, reviewing the diff, and rerunning the freshness gate.

The generated `artifacts/SOURCE_OF_TRUTH.json` timestamp follows the same
honest-snapshot rule. Pull requests and protected-main pushes still validate
its schema, labels, canonical metric set, future skew, deterministic local
metrics, allowlists, and claim drift, but they do not rewrite or expire an
otherwise honest historical snapshot merely because seven days elapsed. The
daily schedule and an explicit manual `require_truth_freshness` input run
`pnpm truth:freshness` as the separate age audit. Refreshing that timestamp
requires rerunning the canonical generator with its admitted local and remote
sources and reviewing the resulting evidence; changing only the timestamp is
not an accepted remediation.

### 2026-08-26 A11oy Series A route boundary

PR #668 merged the source-complete `/a11oy/start` journey normally on
2026-08-28. Its final branch head was
`6a79dcfd76c13cd2fb402015bcdbfa5223d602b5`, tree
`5dafa42faa20c11e13581d79c6de2c6f2fedde1e`. Protected squash commit
`6bde2b6f2e0a360f31a87c3e8228c141b062585e` is GitHub-verified and has the
same tree. The five branch commits had valid DCO trailers but were reported as
unsigned; the verified squash result does not retroactively relabel them.
Current protected main `bd1e62dea8b229f2e437b01488e76facb4c81b1c`
retains the merge as an ancestor as observed on 2026-09-04.

That protected head also contains the parsed High/Critical dependency-audit
repair from commit `d878d23fc3a6ec332f366bbbd7e9f5e00d9e8df5`
and the mirrored-asset lint repair from verified commit
`bd1e62dea8b229f2e437b01488e76facb4c81b1c`. The preceding full-suite run
failed Lint and Runtime Audit because each of the byte-identical Sentra and
Vessels hologram assets contained two block-local `var` declarations. The
protected repair makes those four existing hoists explicit and passes the
full local Oxlint, Biome, and environment-coverage contract. Fresh clean
hosted checks on an exact candidate head remain the promotion authority; a
local build from a partially linked dependency tree is not substituted for
that evidence.

The protected source keeps all six operational truth states visible, labels
the current scenarios DEMO or UNAVAILABLE, aliases `/a11oy/investor-demo` to
the same qualified surface, and places developer-verification and non-claim
boundaries on that surface. The local exact-source rail built and hashed 344
files, exercised all six tabs and keyboard behavior at five viewports, and
promoted digest-matched screenshots. The final PR rollup recorded 52 successful
checks and 3 expected skips, and all four review threads were resolved. These
facts establish protected source and local-build behavior only.

The separately dispatched exact-head screenshot run
<https://github.com/szl-holdings/platform/actions/runs/33013248530> failed before
capture because the isolated candidate identity could not execute pnpm through
the runner-private path. PR #690 later repaired the controller to expose and
invoke one candidate-readable pinned pnpm executable, and its controller checks
passed. That later controller proof does not retroactively create a hosted
capture receipt for PR #668. Hosted exact-head screenshot evidence therefore
remains UNAVAILABLE for that merged candidate.

Deployment, production health, customer use, and external-service parity remain
separate evidence states. No deployment or customer witness is attached to
this task, so those states remain UNAVAILABLE. The repository-wide strict
claims gate also continues to fail closed on the Vessels/AIS mock while
MARINETRAFFIC_API_KEY is absent; PR #668 does not relabel that
external-authority gap or introduce a credential to bypass it.

### 2026-08-30 A11oy Atelier Turn Capsule boundary

**2026-09-29 model migration:** The local source now defaults both Atelier
adapters to `grok-4.7`, preserves all four reasoning-effort levels, and accepts
only 4.7 or the explicit 4.6 rollback from environment and request overrides.
Grok 4.7 provider reasoning ciphertext is discarded; Turn Capsule v1 retains
bounded text history, not native encrypted-reasoning continuity. A successful
4.7 inference and committed capsule remain separate runtime gates. Grok Build
was updated to signed stable 1.0.44; its readback reports an authenticated account
and a saved 4.7 default. The 2026-09-29 bounded `grok-4.7` canary failed with
HTTP 402, usage balance exhausted. No direct xAI API key is configured. The
earlier HTTP 402 balance failure below remains historical evidence.

Turn Capsule v1 adds tenant/session-scoped idempotent replay, one active turn per
session, a hash-linked 24-hour capsule chain, an authenticated verification
route, and a staged-response/pending-recovery boundary. The default store remains
in-process and non-durable. When both continuity directory and key are configured,
the encrypted local adapter can preserve the capsule chain across a restart on
one host with one runtime process and the same key.

That local adapter is not a distributed database and has no distributed lock or
multi-host coordination. It does not establish production identity, deployment,
direct xAI Responses API operation, or an independent runtime witness. The
`EvidenceLedger` append remains process-local and non-durable; encrypted Turn
Capsules do not turn it into an external proof ledger. Shared-proxy listener,
A11oy, and API ports are now configurable for local collision avoidance, but a
configured route is not proof that either upstream is running.

On 2026-09-24, the local Grok Build CLI reported an authenticated account and
advertised `grok-4.6`, but a real browser turn and a direct CLI diagnostic both
failed with HTTP 402, “Grok Build usage balance exhausted.” The current machine
has no configured direct xAI API key. The local proxy/API health route is ready
and encrypted continuity is configured, but this run has no successful provider
response or committed Turn Capsule. Provider balance or another authorized
provider configuration is required for a new live inference witness. The API
now surfaces this known pre-response rejection without presenting it as success
or retaining a retry-blocking ambiguous reservation.

The browser now persists an unconfirmed turn's session ID and idempotency key
in tab-scoped storage before sending it, alongside a prompt-free request
fingerprint digest. A reload can reuse the same key only when the operator
re-enters the same prompt and settings within the 24-hour logical retention
window. Clearing or disabling tab storage loses that guarantee; the interface
warns when storage cannot be written. A new session is an explicit decision to
abandon the pending retry, not evidence that the provider did not bill it.
Direct xAI API HTTP 401/402/403/429 rejections are classified as known
pre-inference failures and release reservations; 5xx, transport failures,
redirects, and malformed responses retain ambiguous reservations. This is
tested with injected responses, not live direct-API proof.

The authenticated session-read route still inherits the runtime's global API
key and caller-supplied tenant header. The loopback solo-builder bridge is
within that boundary; production multi-tenant confidentiality requires an
identity-to-tenant binding before this route is publicly exposed. Protected
source merge also does not itself deploy Atelier: a separately witnessed
hosted build, identity configuration, and functional provider probe remain open.

### 2026-10-02 A11oy Workcell proof-coverage boundary

The deterministic Workcell replay now includes a conservative Proof Coverage
Inspector. It joins the Workcell to repository signal fixtures, its PCE
contract, and Proof Packet; compares action and trace identifiers; and checks
policy and approval references for resolution. Each obligation is reported as `SATISFIED`,
`MISMATCH`, or `UNAVAILABLE`; any unresolved obligation keeps the aggregate
`INCOMPLETE`. Local challenge controls demonstrate missing packet, changed
action, and missing approval-reference paths without changing repository data
or authorizing execution.

The inspector exposes current fixture gaps rather than closing them. For
`wc-001`, the referenced policy evaluation `pe-001` and approval record
`ar-001` have no corresponding registries, and `proof-001` covers signal
ingestion rather than the Workcell or ActionBrief and does not carry those
contract references. A stored hash-shaped string is not treated as a
signature-verification result. Durable persistence,
authenticated actor identity, external attestation, trust-policy verification,
and production execution remain outside the inspector's evidence boundary and
unverified. A11oy remains `Partial` in `docs/APP_STATUS.md`.

An adversarial successor review found that the first inspector revision could
select the first duplicate identifier and could report `COMPLETE` while only
comparing trace ID strings. The evaluator now requires unique signal, contract,
packet, trace, policy, and approval references; one coherent `ExecutionTrace`
record; consistent action and MirrorEval lineage; coherent PCE verification
fields; packet integrity fields; and a SHA-256-shaped terminal checksum. Empty,
duplicate, malformed, missing, or contradictory records fail closed as
`MISMATCH` or `UNAVAILABLE`. The browser contract checks every obligation and
challenge state rather than accepting an arbitrary count.

That hardening does not manufacture missing runtime evidence. The current
`wc-001` route intentionally supplies no trace, policy-evaluation, or approval
registry and remains `INCOMPLETE` at 8/17 obligations. Its malformed terminal
checksum remains `MISMATCH`. A future `COMPLETE` result would establish only
deterministic fixture-record coverage; it would not establish signature
verification, durable storage, authenticated authority, deployment, an external
side effect, or production execution.

### 2026-10-05 Kernel mutation authentication boundary

Local authentication commit `c65edd118dae25678b98307ee0f9f5bc85db7b7a`
closes the source-level unauthenticated mutation paths found in the vendorable
kernel module. Wake receipts require a dedicated Bearer secret, a strict 1 KiB
schema, ±300-second clock skew, and atomic SQLite idempotency. Forced `tick`,
`start`, and `stop` calls require a separate header-only admin Bearer secret;
missing server configuration fails closed.

Truth-state successor `4e633b08464afd00f4228b962821bc3f66c361e0`
closes a separate truth-state defect: the unconnected kernel scaffolds no
longer claim that they observed, signed, embedded, replayed, or acted on named
substrates. All non-chain kernels report `did_work=false` and explicit
`UNAVAILABLE` adapter state; `chain` performs only local Codex hash-chain
verification.

Credential-separation successor `b0c6c6070caafef7a0e2aa4712a151e5a5d54e0c`
also rejects a configuration in which the accepted admin and wake token values
are equal: both mutation gates return `503`. The source accepts only 32–512
ASCII bytes without whitespace for either token; this is a syntax/length
boundary, not an entropy measurement.

Current local read-boundary successor
`99305772172270109f1023da6987a6ca32445847` additionally constrains Codex
reads to a page size of 1–100 and an offset of 0–10,000, and corrects the route
registration contract: callers must reserve the organ prefix. At this
successor, 14 controller tests and 22 dependency-free kernel tests pass (20
boundary/security plus two five-organ truthfulness tests). The Codex GET route
is still unauthenticated. Its public authorization, tenant isolation, and
response data-minimization policy remain open.

This is not a hosted closure. Deployment of the exact successor module
(SHA-256 `0b045cd3f61d1060d9aafc7340ffe00d6328f9a560cce285867ba85ae62d1c73`), matching secret
configuration on GitHub and the A11oy Space, client migration, and an
authorized deny/accept/replay/readback receipt remain unobserved. The staged
static secret should be replaced by repository/workflow-bound OIDC. Durable
request rate limiting, a storage quota, and a retention/compaction design that
preserves the hash chain remain open. SQLite survives a rebuild only when
`SZL_CODEX_DIR` is backed by a persistent mount, and the fallback signer
remains explicitly a placeholder rather than cryptographic verification. The
source-level evidence and exact claim boundary are retained in
[`audit/A11OY_KERNEL_MUTATION_HARDENING_PROOF_2026-10-05.md`](../../audit/A11OY_KERNEL_MUTATION_HARDENING_PROOF_2026-10-05.md).

---

## 2026-08-26 Lighthouse Gate Integrity Correction

The Lighthouse matrix previously used job-level `continue-on-error`, which could neutralize a
failed per-app accessibility assertion before the aggregate gate evaluated the matrix result. Its
dependency install also admitted the optional `onnxruntime-node` CUDA binary download even though
none of the audited static web artifacts requires ONNX or CUDA.

The workflow now removes job-level failure masking, skips only the optional ONNX binary download,
and treats every matrix result other than `success` as a failed aggregate gate. The failure message
keeps assertion failures distinct from install, build, serve, browser, and collection failures.
A dependency-free source contract test protects these invariants in the root test suite.

This closes the workflow-execution defect in KG019. It does not claim that Lighthouse is a required
branch-protection context: the repository ruleset must be inspected and changed separately before
that stronger enforcement claim can be made.

---

## 2026-07-29 Live Frontier Preflight

The dependency-free `pnpm frontier:preflight` command now measures five
external frontiers without exposing credential values: exact npm versions,
the configured Zenodo record, the three vertical deployment targets, local
Windows TPM readiness, and hosted Datadog/Langfuse/Arize proof inputs. The
strict `pnpm frontier:gate` variant exits non-zero while any frontier remains
blocked.

The first live run remained truthfully blocked. Both npm packages returned
404; the configured DOI still resolved to Ouroboros Thesis v21; Sentra had no
canonical public target; David Leads lacked `/version` and `/evidence`;
Killinchu returned HTML fallbacks for those conformance paths; both live
build-info endpoints reported `receipt_minted=false`; local TPM 2.0 readiness
and PCR-log parity were measured without a signed quote or authorized verifier
result; and no hosted Datadog, Langfuse, or Arize production proof was
retrieved. The command operationalizes repeatable measurement but does not
close or relabel any external evidence gap. The command, test, and live result
are recorded in
[`audit/frontier/FRONTIER_PREFLIGHT_PROOF_2026-07-29.md`](../../audit/frontier/FRONTIER_PREFLIGHT_PROOF_2026-07-29.md).

### 2026-07-30 hosted readback upgrade

The preflight no longer stops at credential-presence detection for hosted
observability. Schema `szl.frontier-preflight.v2` performs bounded, read-only
retrieval from Datadog span search, Langfuse Observations v2, and Arize AX
span search. Every provider must return one record containing the exact
`gen_ai.attestation.receipt.id`, `vcs.ref.head.revision`, and
`deployment.environment.name`. Responses are bounded to 64 KiB; redirects,
timeouts, malformed JSON, oversized responses, missing fields, split records,
and partial provider success fail closed.

The default-branch-only `HOSTED-OBSERVABILITY-PROOF` manual workflow retains
the JSON result as a 30-day artifact and fails unless all three readbacks pass.
The executable verifier closes the prior tooling gap; it does not close the
external evidence gap. No hosted credential or successful production readback
was present while this change was implemented, so current hosted proof remains
`UNAVAILABLE`. The configuration and evidence runbook is
[`hosted-proof-readback.md`](../observability/hosted-proof-readback.md).

### 2026-07-30 cross-repository conformance correction

The vertical conformance evaluator previously required the A11oy root and
target receipts to claim one Git SHA and verify under one public key. That
could validate a local fixture, but it could not truthfully establish a
cross-repository boundary between independently deployed A11oy and vertical
commits.

Manifest schema `szl.vertical-conformance.manifest.v2` now requires an exact
A11oy root commit, exact target commit, separately pinned A11oy and target
public keys, and separate SHA-256 fingerprints. Root-SHA substitution,
target-signer substitution, wrong-key evidence, replay, stale evidence,
tampering, and broken parent links fail closed. Manifest v1 remains supported
for existing shared-commit fixtures.

This closed the verifier-model defect; it did not make a live surface
conformant. The retained 2026-07-31 observation recorded missing A11oy root
evidence and `0/3 VERIFIED`. Current conformance remains **UNKNOWN** until exact
deployments provide all seven gates in a fresh authorized run.

### 2026-07-31 vertical runtime-contract advance

**RETAINED 2026-07-31:** Killinchu PR #301 was recorded as merged at signed main commit
`3af652dbc326e653e4c02c0a879d25188e8bdf6a`. Its governed Hugging Face
deployment completed source binding, byte and smoke-route attestation, GitHub
OIDC release attestation `38075818`, receipt publication, and restarted-runtime
verification. At that deployment, `/healthz`, `/version`, and `/evidence`
returned JSON 200, `/version.gitSha` equaled the exact main commit, and
`/api/build-info.receipt_minted` was `true`. That conformance run with the
exact deployment URL and SHA passed `runtime-endpoints` and `readme-status`
only, advancing Vessels from `1/7` to `2/7`.

Signed dependency-hardening PR #302 subsequently advanced Killinchu main to
`305d6aaf67b3d6edd3c4c065a5c8ac90006a1dba`. All `17/17` exact-main
workflows succeeded, governed deployment run
<https://github.com/szl-holdings/killinchu/actions/runs/30595522086>
completed, and the observed build reported that SHA with GitHub OIDC attestation
`38078930`. An exact-SHA conformance rerun still passes the same two gates and
remains `2/7`; the successor changed dependency evidence, not the runtime
contract result.

The Killinchu evidence endpoint intentionally publishes `receipts: []` and
`evidenceState: PARTIAL`. No cross-repository A11oy-to-Killinchu DSSE pair,
conformance denial receipt, OTel GenAI span set, separately pinned offline
trust roots, or candidate product manifest was observed. Vessels is therefore
a runtime **CANDIDATE**, not a conformant surface.

**RETAINED 2026-07-31:** David Leads PR #74 was recorded as merged at signed main commit
`e34044cbb2b565ea77421c4ec6dbef19a5d133dc`, with its full 126-test
operational-safety gate green. The exact-main Neon migration is waiting on the
protected `david-space-credential-rotation` environment, so the downstream
deployment had not run and the observed `/version` and `/evidence` paths were
404. No approval was bypassed or self-issued. The same retained observation
recorded no standalone Sentra repository or configured canonical deployment
and `0/3 VERIFIED` overall. Current state is **UNKNOWN**.

The immutable runtime-contract evidence is recorded in
[`VERTICAL_RUNTIME_CONTRACT_PROOF_2026-07-31.md`](../../audit/frontier/VERTICAL_RUNTIME_CONTRACT_PROOF_2026-07-31.md).
The append-only live-SHA correction is recorded in
[`VERTICAL_RUNTIME_CONTRACT_DRIFT_CORRECTION_2026-07-31.md`](../../audit/frontier/VERTICAL_RUNTIME_CONTRACT_DRIFT_CORRECTION_2026-07-31.md).

---

## 2026-07-28 D-SLSA Standalone Publication

The Apache-2.0 Decision-SLSA v1.4 reference implementation is now public at
<https://github.com/szl-holdings/evidence-doctrine>. Repository PR #1 merged
exact head `3ea40357f878a7326bc5c1a732b20ba3dd32f1ca` as
`b2fcdb5078127c3ac0bd063ed629a80d26827dca`. An unauthenticated request returned
the public README, and a clean standalone checkout passed 13 TypeScript tests,
13 Python tests, and TypeScript typecheck. A claim-boundary correction then
merged through repository PR #2 as current main commit
`71ab3b8a4538a106fe0a24146785456fcc8bbe1f`.

This publication closes only the standalone-source gap. It does not establish a
D-SLSA DOI, adoption, independent validation, D3 evidence, or D4 evidence. The
previously proposed concept DOI `10.5281/zenodo.19944926` resolves to Ouroboros
Thesis v21 record `10.5281/zenodo.20490218`; it is not a D-SLSA deposit. A new
Zenodo deposition and newly minted concept DOI remain required.

The original standalone-publication proof packet omitted mandatory
reproducibility and attribution fields. The append-only
[`D-SLSA proof correction`](../../audit/frontier/DSLSA_STANDALONE_PUBLICATION_PROOF_CORRECTION_2026-07-29.md)
records the commands and numeric exit codes, original and corrective patch
summaries, task and actor attribution, screenshot `N/A` disposition,
public-claim and security checks, proof level, timestamp, and residual
boundaries. The original packet remains unchanged.

---

## 2026-07-28 Post-Merge CI Policy Receipt

Platform PR #524 merged exact reviewed head
`9d74488d40e44a6ff88dab94aa2146f7f7388216` as protected main commit
`3daa582026778294a90f07474294de72d2063012`. The source-level
`@szl/mcp-governor` verification passed 36/36 focused tests, lint, package
typecheck, and build. The hosted Commitlint job subsequently failed because one
commit-body line exceeded the 100-character policy.

The failure is recorded rather than rewritten: no commit was amended, no
force-push occurred, and the code result is not represented as an all-green PR.
This forward-only receipt does not retroactively turn the failed check green.
Future commits must wrap body lines to 100 characters or fewer.

---

## 2026-07-25 Series A Truth Lock

The generated truth artifact now fails closed when a metric cannot be established
from a local manifest, a machine-readable test aggregate, or an authorized live
receipt. The remaining gaps are:

- **Product surfaces (historical lock state):** the 2026-07-25 lock measured `0` because no
  qualifying manifest existed. The 2026-08-01 public-surface registry supersedes that tooling gap;
  unavailable historical routes remain explicit and excluded rather than upgraded to live.
- **Per-test counts:** the verified workspace graph completed `109/109` test
  tasks, but no machine-readable `artifacts/test-results.json` aggregate exists,
  so unit/integration/e2e counts remain `UNAVAILABLE`.
- **Database tables, Lean sorry count, Lambda count, Hugging Face collections,
  and receipt-chain depth:** `UNAVAILABLE` pending an authoritative local source
  or authorized live receipt.
- **Repository consolidation:** the retained 2026-07-25 public inventory of
  `53` repositories is historical and superseded. A cursor-complete,
  authenticated metadata receipt observed 140 repositories on 2026-10-06,
  and a cursor-exhaustive read-only aggregate recheck on 2026-10-07 matched:
  128 public and 12 private, with 111 active and 29 archived across both
  visibilities. The sanitized receipt does not expose the active-public versus
  archived-public cross-tab, so that narrower breakdown remains **UNKNOWN**.
  The target of `9` remains an unapplied disposition decision; visibility,
  archival, deletion, and history changes require explicit founder approval
  and a tested restoration plan.
- **Hugging Face public catalog:** the repository-controlled snapshot at
  `audit/evidence/huggingface-public-catalog.snapshot.json` records
  `observedAt=2026-10-07T11:48:26.618Z`, its RFC Link pagination/completeness
  rule, one page per asset type, and exact IDs for 47 models, 37 datasets, and
  35 Spaces. For public-catalog counts it supersedes the retained
  2026-07-25 and 2026-09-29 inventory counts. Collections, private-asset
  completeness, first-class Kernel inventory, runtime behavior, publication
  authority, training rights, and readiness remain **UNKNOWN** or
  `UNAVAILABLE`; the snapshot is not evidence that any asset was exported or
  deployed.
- **Independent review:** current collaborator eligibility and reviewer
  availability were not observed and remain **UNKNOWN**. The authenticated
  Platform ruleset receipt records zero required approving reviews plus extra
  approval for unattributed changes; it does not establish staffing. Do not
  manufacture or self-approve a review. Preserve the observed required checks,
  signatures, squash-only history, conversation resolution, and exact-head
  verification, and change review requirements only from current staffing and
  ruleset evidence.
- **Standalone KHIPU receipt semantics:** `@szl/verify` can establish the exact
  DSSE payload type, JSON decoding, Ed25519 or ECDSA P-256 signature validity,
  and an externally pinned signer identity. It does not yet validate portable
  artifact or policy digests because no canonical KHIPU schema in this
  repository defines those fields. The surface conformance runner has a
  separate implemented `szl.khipu.receipt.v1` freshness and parent-link
  contract; those semantics are not generalized by field-name inference.

---

## Viewer Guide by Persona

### For Enterprise Architects
Architecture concerns — tenant isolation, auth hardening, encryption, network security.

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| KG001 | Cross-tenant vector/RAG retrieval isolation (alloyRetrieval singleton) | P0 | ✅ Resolved Apr-2026 |
| KG002 | Timing-unsafe internal token comparison | P0 | ✅ Resolved Apr-2026 |
| KG015 | No `tenant_id` column in `rag_knowledge_chunks` DB table | P0 | ✅ Resolved Apr-2026 |
| KG014 | `graph-rag.ts` retrieval not propagating tenant ID | P0 | ✅ Resolved Apr-2026 |
| T7 | `totalIndexed` in retrieval responses leaked cross-tenant corpus size | P0 | ✅ Resolved Apr-2026 |
| KG020b | Webhook delivery URL has no SSRF host validation | P1 | ✅ Resolved Apr-2026 |
| KG020c | No virus/malware scanning on object storage uploads | P2 | ✅ Enhanced Apr-2026 (tier-1 signatures + ClamAV-REST/Cloudmersive feature flag) |
| KG020d | No field-level encryption for PII columns | P2 | ✅ Wired Apr-2026 — `lib/encryption.ts` AES-256-GCM helper wired to `holdings_inquiries.name` + `.email` (encrypt on INSERT, decrypt on GET/response). Remaining columns + backfill migration = follow-up task #3757 |

**Architecture verdict:** All critical tenant isolation and auth P0 gaps are closed. Residual gaps (SSRF, virus scanning, PII encryption) are tracked and scoped with remediation owners.

---

### For Series A Technical Advisors / Investor Diligence
Risk exposure, compliance posture, diligence readiness.

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| KG002 | Timing-unsafe internal token comparison | P0 | ✅ Resolved |
| KG001, KG015 | Multi-tenant data isolation in RAG/AI layer | P0 | ✅ Resolved |
| KG003–KG008, KG016, KG017 | Unvalidated write routes / missing structured logging | P0 | ✅ Resolved |
| GAP-001 | Firebase & Google credentials require manual rotation | High | 🟡 Runbook ready — rotation pending authorized operator. `docs/operations/GAP-001-credential-rotation.md` provides dry-run verification script + step-by-step rotation for all Firebase/Google credentials. |
| KG011 | No CodeQL SAST in CI pipeline | P1 | ✅ Resolved Apr-2026 |
| KG012 | No automated dependency vulnerability review in CI | P1 | ✅ Resolved Apr-2026 |
| KG010 | No automated E2E / integration test suite | P1 | ✅ Resolved Apr-2026 |
| GAP-002 | No CI/CD automated secret scanning | Med | ✅ Resolved Apr-2026 |
| GAP-003 | Android keystore not managed by EAS | Med | ✅ Resolved Apr-2026 |
| VD1 | No responsible disclosure policy / `security.txt` | P2 | ✅ Resolved Apr-2026 (`/.well-known/security.txt` published, RFC 9116 compliant) |
| KG025 | WCAG accessibility not systematically audited | P2 | ✅ Resolved Apr-2026 (`audit/A11OY_ACCESSIBILITY_AUDIT.md` — all 11 audited UI routes, F001–F007 findings). F007 skip nav implemented in `artifacts/szl-holdings/src/App.tsx` (WCAG 2.4.1 Level A). Lighthouse a11y gate enforced as CI hard-fail. Remaining F001–F006 remediations are sprint backlog items. |

**Diligence verdict:** All P0 security gaps identified in the pre-sprint audit are resolved. KG011 (CodeQL SAST), KG012 (dependency review), GAP-002 (secret scanning), and KG010 (E2E regression suite) are now resolved — CI security and quality gates are live. Remaining open items (P1–P2, High) are scoped, have remediation owners, and do not represent critical blockers for Series A close.

---

### For Incoming VP Engineering
Operational gaps, process health, test coverage, observability, team ownership.

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| KG009 | OpenTelemetry exporter not configured for production | P1 | ✅ Resolved Apr-2026 |
| KG010 | No automated E2E / integration test suite | P1 | ✅ Resolved Apr-2026 |
| KG011 | CodeQL SAST not configured in CI | P1 | ✅ Resolved Apr-2026 |
| KG012 | Dependency review not in CI | P1 | ✅ Resolved Apr-2026 |
| KG013 | No `CODEOWNERS` file | P1 | ✅ Resolved Apr-2026 |
| KG018 | 80+ env vars with no formal schema documentation | P2 | ⚠️ Open — Sprint 4 |
| GAP-004 | No `.env.example` files for all artifacts | Low | ✅ Resolved Apr-2026 |
| KG019 | No Lighthouse CI performance regression guard | P2 | ✅ Resolved Apr-2026 (`.lighthouserc.json` + `lighthouse.yml` CI — six web artifacts in the current matrix). Accessibility threshold (≥ 90) is a workflow hard error; performance/best-practices/SEO remain advisory warnings. The Lighthouse aggregate check is not currently a required branch-protection context. |
| KG023 | SLI/SLO definitions absent | P2 | ✅ Resolved Apr-2026 (`docs/operations/sli-slo.md` — all service tiers defined) |
| KG024 | Large vendor bundle sizes on all web apps (1–1.7 MB) | P2 | ✅ Resolved Apr-2026 (`artifacts/szl-holdings/vite.config.ts` — `manualChunks`: vendor-charts, vendor-motion, vendor-radix, vendor-tanstack, vendor-icons, vendor-react) |

**VP Engineering verdict:** Core security hardening is complete. CI security gates (KG011/KG012), code ownership (KG013), and E2E regression suite (KG010) are now resolved. Production observability is now wired: OTEL exporter (KG009), Sentry error tracking (KG028), and external uptime monitoring (KG027) are all resolved. SLI/SLO definitions (KG023), Lighthouse CI accessibility hard gate (KG019), WCAG accessibility baseline audit (KG025), bundle size code-splitting (KG024), and PostHog analytics instrumentation (KG030) are all resolved. Highest-priority operational work for the next sprint is: (1) deploy ClamAV REST container to activate tier-2 AV scanning (KG020c), (2) wire PII encryption to remaining DB columns / run backfill migration (KG020d follow-up task #3757), (3) execute Firebase/Google credential rotation per runbook (GAP-001).

---

## Full Gap Registry

### Decision-SLSA Draft Package (Open Evidence and Publication Boundaries)

| ID | Gap | Area | Resolution / Status |
|----|-----|------|---------------------|
| DSLSA-001 | The intended standalone public repository has not been created. | Publication | Resolved — `szl-holdings/evidence-doctrine` is public at exact main commit `71ab3b8a4538a106fe0a24146785456fcc8bbe1f`; unauthenticated README retrieval and clean-clone tests were verified. |
| DSLSA-002 | No D-SLSA Zenodo deposition or concept DOI exists. | Publication | Open — proposed concept DOI `10.5281/zenodo.19944926` resolves to unrelated Ouroboros Thesis v21 record `10.5281/zenodo.20490218`. D-SLSA requires a new authenticated deposition and newly minted concept DOI. |
| DSLSA-003 | No verified third-party transparency log, byte-identical replay, or offline-verification packet establishes D3 for an estate decision. | Decision evidence | Open — the evaluator records absent/unverified evidence and cannot infer D3. |
| DSLSA-004 | No verified hardware-attested execution establishes D4 for an estate decision. | Decision evidence | Partial — `@szl/mcp-governor` now implements a fail-closed, signed RATS Attestation Result admission boundary with action/capability nonce binding, freshness, replay defense, and pinned workload/measurement/policy reference values. Unit tests use synthetic keys and do not establish hardware evidence. D4 remains unavailable until an authorized run produces and preserves a real NRAS, SEV-SNP, TDX, or TPM-backed result. |
| DSLSA-005 | The merged standalone-publication proof packet omitted the required commands and exit codes, patch summary, task and actor attribution, screenshot disposition, claim and security checks, proof level, and timestamp. | Proof process | Resolved — the append-only 2026-07-29 correction records the missing fields and preserves the original immutable entry. |

### P0 — Critical / High (Resolved or Immediate Action)

| ID | Gap | Area | Resolution / Status |
|----|-----|------|---------------------|
| KG001 | `alloyRetrieval` singleton had no tenant partitioning | Security / Multi-tenancy | ✅ Resolved Apr-2026. `tenantId` field added to `RetrievalChunk`; all methods enforce tenant scope. |
| KG002 | Internal service tokens compared with `===` | Security / Auth | ✅ Resolved Apr-2026. Replaced with `crypto.timingSafeEqual`. |
| KG015 | `rag_knowledge_chunks` DB table had no `tenant_id` column | Security / Multi-tenancy | ✅ Resolved Apr-2026. Column + index added; strict SQL predicates enforced. |
| KG003–KG008 | Unvalidated write routes / leaked unstructured logs | Input / Observability | ✅ Resolved Apr-2026. Zod schemas + Pino logger applied across all routes. |
| KG014 | `graph-rag.ts` retrieval not propagating tenant ID | Security / Multi-tenancy | ✅ Resolved Apr-2026. `tenantId` threaded to all retrieval calls. |
| KG016–KG017 | Ad-hoc field checks and console logging in admin/lib | Input / Observability | ✅ Resolved Apr-2026. Zod and Pino applied. |
| REM-001 | Placeholder credential files in repo | Credentials | ✅ Resolved Apr-2026. Verified and template copies created. |
| REM-002 | `.gitignore` did not cover credential patterns | Credentials | ✅ Resolved Apr-2026. Hardened with comprehensive patterns. |
| REM-003 | No developer docs for secrets | Process | ✅ Resolved Apr-2026. `SECRETS_SETUP.md` created. |
| REM-004 | No security credential hygiene checklist | Process | ✅ Resolved Apr-2026. `SECURITY-CHECKLIST.md` created. |
| GAP-001 | Firebase & Google credentials require manual rotation | Credentials | 🟡 Runbook ready Apr-2026 — `docs/operations/GAP-001-credential-rotation.md`: dry-run verification script + full step-by-step rotation procedure for all Firebase/Google credentials. Actual rotation to be executed by authorized operator before public launch. |

---

### P1 — High (open — targeted for Sprint 3)

| ID | Gap | Area | Impact | Mitigation Plan | Owner |
|----|-----|------|--------|-----------------|-------|
| KG009 | OTEL exporter not configured for prod | Observability | No prod tracing | ✅ Resolved Apr-2026. `artifacts/api-server/src/lib/observability.ts` created as canonical OTEL configuration module. `initializeOpenTelemetry()` wired in `index.ts` with OTLP, Azure Monitor, and New Relic exporter support. Set `OTEL_EXPORTER_OTLP_ENDPOINT` (or `AZURE_APP_INSIGHTS_CONNECTION_STRING` for Azure) in production secrets. `validateProductionObservability()` warns at startup if not configured. | Platform |
| KG010 | No automated E2E test suite | Quality | Regression risk | ✅ Resolved Apr-2026. Playwright suite built for flagship governed decision loop — 14 test suites covering all nine steps (Signal → Outcome), navigation, and a full walk-through regression guard. CI matrix entry added for every PR. `tests/e2e/governed-decision-loop.spec.ts`. | Engineering |
| KG011 | CodeQL SAST not in CI | Security / CI | SAST coverage gap | ✅ Resolved Apr-2026. `.github/workflows/codeql.yml` scans JS/TS on every PR and weekly schedule. | DevOps |
| KG012 | Dependency review not in CI | Supply Chain | Vulnerable deps risk | ✅ Resolved Apr-2026. `.github/workflows/dependency-review.yml` blocks PRs introducing high/critical CVEs. | DevOps |
| KG013 | No `CODEOWNERS` file | Process | No review ownership | ✅ Resolved Apr-2026. `CODEOWNERS` created mapping all artifacts and route directories to owning teams. | Eng Lead |
| KG020b | Webhook URLs not SSRF validated | Security / SSRF | SSRF risk | ✅ Resolved Apr-2026. `lib/ssrf-guard.ts` enforces blocklist (RFC1918, loopback, link-local 169.254/16 incl. cloud metadata 169.254.169.254, IPv6 ULA/link-local), HTTPS-only scheme, and standard-port restriction. Wired into `webhookEndpointSchema` + `webhookEndpointUpdateSchema` (sync, registration time) and re-checked with DNS resolution in `attemptWebhookDelivery` (async, every delivery — defeats DNS rebinding). Optional explicit allowlist mode for enterprise tenants via `WEBHOOK_DELIVERY_ALLOWLIST` env var (comma-separated host suffixes). | Security Lead |
| KG026 | MFA not implemented | Security | Auth risk | **Formally Accepted — Apr-2026.** Native TOTP/WebAuthn MFA not implemented. Mitigation: Replit OIDC and Azure AD SSO enforce IdP-level MFA; customers requiring MFA must enforce it at their identity provider. Platform-native MFA (TOTP/WebAuthn) is scoped for enterprise tier launch and tracked on the roadmap. Risk accepted: all enterprise pilots to date require Azure AD SSO with MFA enforced at the tenant. | Security |
| KG027 | External uptime monitoring absent | Ops | Visibility gap | ✅ Resolved Apr-2026. Setup guide added to `OPERATIONS-RUNBOOK.md` § Observability Runbook. Health endpoint `GET /api/health` is live and tested. Runbook documents: Betterstack/UptimeRobot/Datadog Synthetics configuration, 60-second poll interval, 2-consecutive-failure SEV1 threshold, and alert routing to on-call + status page webhook. Set `UPTIME_MONITOR_ID` in production env once monitor is provisioned. | Platform |
| KG028 | Sentry / error tracking not in prod | Observability | Debugging delay | ✅ Resolved Apr-2026. `artifacts/api-server/src/lib/sentry.ts` fully implements Sentry Node.js SDK with Express integration, PostgreSQL tracing, uncaught exception handling, and PII header scrubbing. `initServerSentry()` called at server startup in `index.ts`. Set `SENTRY_DSN` in production secrets to activate. Source maps configured via `sentry.ts` release tagging using `npm_package_version`. See OPERATIONS-RUNBOOK.md § Observability Runbook for verification steps. | Platform |
| AF-001 | `adminGuard` uses `Buffer.equals()` not `crypto.timingSafeEqual` for internal token | Security / Auth | Theoretical timing attack on admin token | ✅ Resolved Apr-2026 (Task #2693). `middlewares/admin-guard.ts` now delegates to `verifyInternalHeader()` which calls `crypto.timingSafeEqual` on HMAC-SHA256 digests of both inputs (`lib/internal-tokens.ts:104-116`), eliminating both timing and length side-channels. Regression test: `__tests__/security-hardening.test.ts` §1. | Security Lead |
| AF-003 | `GET /vessels/fleets` routes return all tenants' fleet data without tenant scoping | Security / Multi-tenancy | Cross-tenant data visibility | ✅ Resolved Apr-2026 (Task #1048). All fleet/vessel/route/alert handlers in `routes/vessels.ts` now use `tenantScope()` + `fleetOrgWhere()`/`vesselOrgWhere()`/`getVesselInOrg()` to filter by `org_id`. | Engineering |
| AF-007 | `vessels.*` tables (`vessels_fleets`, `vessels`, positions, cargo, routes) missing `org_id` | Security / Multi-tenancy | DB-level cross-tenant vessel data access | ✅ Resolved Apr-2026 (Task #1048). Migration `lib/db/drizzle/0076_vessels_org_id.sql` adds `org_id` columns + indexes to `vessels_fleets`, `vessels`, and `vessels_alert_rules`; schema declarations in `lib/db/src/schema/vessels.ts`. | Engineering |
| KG030 | PostHog product analytics not yet wired | Analytics | No funnel or feature-adoption data | ✅ Resolved Apr-2026 — `artifacts/szl-holdings/src/lib/posthog-init.ts`: `posthog-js@^1.369.1` installed and initialized in `main.tsx`. PII scrubbing via `before_send` hook (removes email, phone, name, address, ip). Gated on `VITE_POSTHOG_KEY` env var — noop if key not set. Privacy-safe: `mask_all_text: true`, `mask_all_element_attributes: true`, `disable_session_recording: true`, `respect_dnt: true`. | Product |
| KG031 | Status page at `/status` not yet live | Support Ops | No customer self-service incident visibility | ✅ Resolved Apr-2026 — `public-status.ts` registered in API routes; `GET /api/status`, `/api/uptime-history`, incident endpoints live; 5-min health check scheduler + gap backfill active. | Platform |

---

### P2 — Medium / Low (open — Sprint 4 / roadmap)

| ID | Gap | Area | Impact | Notes |
|----|-----|------|--------|-------|
| GAP-002 | No CI/CD automated secret scanning | Security | Leaked keys risk | ✅ Resolved Apr-2026 — `gitleaks` v8.21 added as required CI gate; `.gitleaks.toml` config with allowlists; dual scan (gitleaks + custom pattern matcher) on every PR |
| GAP-003 | Android keystore not in EAS | Mobile Ops | SPOF risk | ✅ Resolved Apr-2026. `eas.json` sets `credentialsSource: "remote"` for production Android/iOS. Firebase credentials uploaded as EAS file secrets (`GOOGLE_SERVICES_JSON`, `GOOGLE_SERVICE_INFO_PLIST`) and read dynamically by `app.config.js`. Google Play service account key stored as EAS string secret (`GOOGLE_SERVICE_ACCOUNT_KEY_JSON`) — EAS Submit reads it automatically, no `serviceAccountKeyPath` in `eas.json`. `SECRETS_SETUP.md` rewritten to EAS-first workflow. No local credential files required for any build. |
| KG018 | 80+ env vars — no formal schema | Ops | Onboarding friction | ✅ Resolved Apr-2026 — ENVIRONMENT_VARIABLES.md created with full schema |
| KG020c | No virus scanning on uploads | Security | Malware risk | ✅ Enhanced Apr-2026 — Tier-1 YARA-style signature scanner (EICAR, PE/MZ, ELF, PowerShell, reverse shell) always active. Tier-2 feature flag: set `VIRUS_SCAN_PROVIDER=clamav-rest` (requires `CLAMAV_REST_URL`) or `cloudmersive` (requires `CLOUDMERSIVE_API_KEY`). Safety invariant: external AV failure falls back to signature result. Deploy ClamAV REST container to activate tier-2. |
| KG020d | No field-level encryption for PII | Privacy | Compliance risk | ✅ Wired Apr-2026 — `artifacts/api-server/src/lib/encryption.ts`: AES-256-GCM helper. Wired to `holdings_inquiries.name` and `holdings_inquiries.email` in `routes/holdings.ts`: encrypted on INSERT, decrypted on GET + POST response. Graceful degradation when `ENCRYPTION_KEY` is not set. Additional PII columns (carlota inquiries, pipeline contacts) are follow-up task #3757. |
| KG021 | No rate-limit on inquiries | DDoS | Abuse risk | ✅ Resolved Apr-2026 — `express-rate-limit` applied to `POST /holdings/inquiries` (10 req/hr per IP) |
| KG023 | SLI/SLO definitions absent | Reliability | No targets | ✅ Resolved Apr-2026 — `docs/operations/sli-slo.md` created with SLIs/SLOs for API, web, database, AI, auth, and integrations layers. Error budget methodology documented. |
| KG024 | Large vendor bundle sizes | Performance | Slow load | ✅ Resolved Apr-2026 — `artifacts/szl-holdings/vite.config.ts` has `build.rollupOptions.output.manualChunks` splitting: `vendor-charts` (recharts/d3), `vendor-motion` (framer-motion), `vendor-radix` (@radix-ui), `vendor-tanstack` (@tanstack), `vendor-icons` (lucide-react), `vendor-react` (react-dom/react) |
| VD1 | No `security.txt` | Compliance | No disclosure channel | ✅ Resolved Apr-2026 — Static file `artifacts/szl-holdings/public/.well-known/security.txt` published (RFC 9116 compliant). API server also serves it via `GET /.well-known/security.txt` in `routes/a2a.ts` (same pattern as `agent-card.json`). Contact: `security@szlholdings.com`. SECURITY.md updated with machine-readable link. |
| GAP-004 | No `.env.example` in all artifacts | Ops | Dev friction | ✅ Resolved Apr-2026 — `.env.example` expanded to 175 variables covering all documented env vars in `ENVIRONMENT_VARIABLES.md` |
| TD-001 | PRISM framework naming inconsistency | Tech Debt | Internal confusion | Pulse/Risk/Intel vs People/Revenue/Infra |
| TD-002 | Broken seed scripts (PRISM Counsel) | Tech Debt | Dev friction | Fix recovery table seed scripts |
| TD-003 | DEMO_GUIDE.md said "five primitives" throughout | Doc Accuracy | ✅ Resolved Apr-2026 | Corrected to six primitives (Event Fabric is the 6th) |
| TD-004 | TRUST_CENTER_INDEX.md cited HuggingFace/Qwen3-8B as AI model | Doc Accuracy | ✅ Resolved Apr-2026 (Phase 10–13) | TRUST_CENTER_INDEX.md § Model Transparency corrected: HuggingFace/Qwen3-8B reference removed; multi-provider stack (OpenAI, Anthropic, Gemini) documented. See Phase 10–13 audit note and incident log entry for evidence. |
| TD-005 | SECURITY.md role list showed 6 of 11 platform roles | Doc Accuracy | ✅ Resolved Apr-2026 | Corrected to full 11-role hierarchy with reference to ACCESS-CONTROL-MATRIX.md |
| TD-006 | PRODUCT-SURFACES.md lists domain-specific mobile apps (aegis-mobile, vessels-mobile, terra-mobile, lyte-mobile, carlota-jo-mobile) that are not registered artifacts | Doc Accuracy | ✅ Resolved Apr-2026 — PRODUCT-SURFACES.md § "Domain-Specific Mobile Apps" renamed to "Domain-Specific Mobile Apps — Roadmap (Not Yet Built)" with explicit status disclosure: each entry now annotated as "Roadmap — not yet built" with planned artifact path marked "(not registered)" and an earliest build window contingent on customer/design-partner demand. Live mobile coverage today is delivered through CORTEX (`artifacts/szl-holdings-mobile`). ARCHITECTURE.md system topology diagram updated to drop the unbuilt mobile clients. EXECUTIVE_LAUNCH_SUMMARY.md RT-010/TD-006 row marked complete. |
| TD-007 | Investor docs (investor-overview.md, platform-thesis.md, go-to-market.md, problem-opportunity.md, why-now.md, why-team.md) all said "five platform primitives" — Event Fabric was the 6th (added Apr-2026) | Doc Accuracy | ✅ Resolved Apr-2026 — All investor docs updated to "six primitives" with Event Fabric listed explicitly |
| TD-008 | Category naming inconsistent across docs — multiple variant terms used across investor-overview.md, platform-thesis.md, CATEGORY_POSITIONING.md, and positioning docs, creating confusion in investor conversations | Doc Accuracy | ✅ Resolved Apr-2026 — Canonical name is now "Governed Decision Infrastructure" across all docs: CATEGORY_POSITIONING.md v2.1, INVESTOR_NARRATIVE.md v3.0, MOAT_MAP.md v2.0, MARKET_POSITIONING.md, COMPANY_FACT_SHEET.md, and investor-overview.md. All variant terminology normalized. |
| TD-009 | investor-overview.md Evaluation Path referenced "five architectural abstractions" instead of six | Doc Accuracy | ✅ Resolved Apr-2026 — Updated |
| TD-010 | platform-thesis.md Defensibility section still said "Five platform primitives" and Event Fabric was absent from the primitives table | Doc Accuracy | ✅ Resolved Apr-2026 — Updated table and all count references |
| TD-011 | Human-readable and machine-readable source-of-truth registries had diverged; the validator measured a removed API layout and was POSIX-shell-dependent | Doc Accuracy / CI | ✅ Resolved Jul-2026 — registry v2.0.0 recomputes tracked-tree metrics cross-platform, cross-checks both Markdown tables, labels historical runtime values, defines Doctrine 749/14/163, and runs in `.github/workflows/source-of-truth.yml` |
| KG029 | Integration connector test stub in alloy-integrations | API / Quality | Minor UX gap | `routes/alloy-integrations.ts:345` returns hardcoded "Test not implemented for this integration type" for unsupported integrations — implement per-type test logic or document which types are testable |
| KG034 | IP addresses stored in raw form in audit logs and session records | Privacy / GDPR | ✅ Resolved Apr-2026 — SHA-256 hashing with configurable salt (`IP_HASH_SALT` env var) applied via `hashIp()` in `lib/audit/src/ip-hash.ts`. Hash is deterministic for correlation but not reversible. Applied to all audit log (`activityLogTable`, `alloyAuditLogTable`, `auditEventsTable`) and session storage paths. See `lib/audit/src/index.ts`, `lib/audit/src/enriched.ts`, `artifacts/api-server/src/lib/auth.ts`, `artifacts/api-server/src/middlewares/session-policy.ts`. |
| AF-010 | Sessions not invalidated on role change (up to 30-day exposure window) | Security / Auth | ✅ Resolved Apr-2026 — `revokeUserSessionsOnRoleChange()` exported from `artifacts/api-server/src/middlewares/session-policy.ts`. Automatically called on SCIM group member add/remove/replace operations. New `PUT /admin/users/:userId/roles` admin endpoint performs role replacement and revokes all active sessions with audit trail. |
| KG035 | `package.json` uses semver ranges (`^`) while `pnpm-lock.yaml` pins exact versions | Supply Chain | **Formally Accepted — Apr-2026.** `pnpm-lock.yaml` ensures all installs (CI, production) use exact pinned versions. The `^` ranges in `package.json` only affect fresh installs executed without the lockfile, which do not occur in CI or deployment (`pnpm install --frozen-lockfile` is enforced in all pipelines). Dependency vulnerability scanning is provided by the `dependency-review.yml` CI workflow (KG012, resolved). Risk accepted: no action required on `package.json` ranges. |
| KG032 | `lib/observability/src/collector.ts` seeds simulated data in constructor | Observability / Analytics | Domain app dashboards display synthetic data | Wire live API signals to replace `seedSimulatedData()` call (OBS-008) |
| KG033 | `OBSERVABILITY_ARCHITECTURE.md` covers decision-fabric surfaces only; no single doc covers production infra observability (OTEL config, logging pipeline, metrics, alerting) | Docs / Observability | Onboarding friction for new VP/Platform lead | Add §Production Infrastructure Observability section to OBSERVABILITY_ARCHITECTURE.md (OBS-006) |
| RD-001 | SOC 2 Type II / FedRAMP readiness | Compliance | Sales blocker | **SOC 2 Type II — In Progress (Apr-2026).** Engagement letter signed with A-LIGN Compliance and Security on 2026-04-19. Observation period runs 2026-05-01 → 2026-10-31. Type I bridge report targeted 2026-07-31; Type II report targeted 2027-01-31. Internal readiness assessment completed against `infra/docs/SOC2_CHECKLIST.md`. See `SOC2_AUDIT_ENGAGEMENT.md` for engagement scope, evidence sources, and remediation backlog. FedRAMP remains a post-revenue roadmap item. |
| RD-002 | Horizontal scaling / Load testing | Infra | Scale risk | Validate Azure autoscale under load |

---

### Phase 4–5: Flow & Testing Gaps (added Apr-2026)

#### Flow Audit Gaps

| ID | Gap | Area | Severity | Status |
|----|-----|------|----------|--------|
| FLOW-001 | No new-user guided onboarding wizard — FIRST_10_MINUTES.md describes ideal state; actual UI has sparse empty states | Onboarding | P1 | ✅ Resolved Apr-2026. Hosted four-step onboarding wizard shipped at `/lyte/onboarding` (`artifacts/lyte-command-center/src/pages/onboarding.tsx`). Steps: org setup, one-click demo seed, first-view orientation, governed decision loop walkthrough. Empty-state banner on Lyte Overview deep-links new users into the wizard until completion is recorded in browser storage. RT-005 also closed (GETTING_STARTED.md updated to reference hosted wizard, no longer requires `pnpm seed:demo`). |
| FLOW-002 | Live billing integration not fully wired for all billing flows | Billing | P1 | ⚠️ Open — Sprint 3 |
| FLOW-003 | No SLA enforcement automation in support intake flow | Support Ops | P2 | ⚠️ Open — Sprint 4 |
| FLOW-004 | No escalation path for timed-out approvals | Approvals | P2 | ⚠️ Open — Sprint 4 |

#### Test Quality Gaps

| ID | Gap | Area | Severity | Status |
|----|-----|------|----------|--------|
| TG-001 | No tests for billing event flows | Quality | P1 | ⚠️ Open — Sprint 3 |
| TG-002 | No tests for webhook delivery | Quality | P1 | ⚠️ Open — Sprint 3 |
| TG-003 | Admin-only route tests incomplete | Quality | P1 | ⚠️ Open — Sprint 3 |
| TG-004 | Approval escalation not tested | Quality | P1 | ⚠️ Open — Sprint 3 |
| TG-005 | Object storage tenant isolation not tested | Quality / Security | P2 | ⚠️ Open — Sprint 4 |
| TG-006 | GraphQL resolver tenant scoping partial | Quality / Security | P2 | ⚠️ Open — Sprint 4 |
| TG-007 | No automated E2E tests for mobile (Expo / CORTEX) | Quality | P2 | ⚠️ Open — Sprint 4 |
| TG-008 | Systematic WCAG accessibility testing absent (KG025) | Quality / Compliance | P2 | ✅ Resolved Apr-2026 — `audit/A11OY_ACCESSIBILITY_AUDIT.md` covers all 11 audited UI routes; F001–F007 findings documented with WCAG criteria and remediation plan |

#### Test Fixes (resolved in Phase 4–5 audit)

| ID | Fix | Status |
|----|-----|--------|
| AF-T001 | `cortex-inca-smoke.test.ts` excluded from unit test config (requires live DB — belongs in integration only) | ✅ Fixed Apr-2026 |
| AF-T002 | `api-version.ts` error messages updated to match test contract — 4 previously failing tests now pass | ✅ Fixed Apr-2026 |

---

## Disposition Summary

| Severity | Total | Resolved | Open |
|----------|-------|----------|------|
| P0 — Critical / High | 11 | 10 | 1 |
| P1 — High | 14 | 6 | 8 |
| P2 — Medium / Low | 30 | 9 | 21 |
| Flow Audit Gaps (Phase 4–5) | 4 | 0 | 4 |
| Test Quality Gaps (Phase 4–5) | 8 | 2 | 6 |
| **Total** | **72** | **28** | **44** |

> **April 2026 Phase 0–1 audit note:** Full operational audit (Phases 0–1) completed. Deliverables produced: FULL_SYSTEM_INVENTORY.md, AUDIT_FINDINGS_REGISTER.md, OUT_OF_SCOPE_REGISTER.md, ENVIRONMENT_VARIABLES.md, updated .env.example. KG018 (env var schema) resolved by ENVIRONMENT_VARIABLES.md. GAP-004 (.env.example) resolved by comprehensive update. KG029 (alloy-integrations test stub) newly cataloged. TD-004 remains re-opened. No new P0/P1 security findings discovered. No hardcoded credentials found in source. All GitHub Actions workflows remain SHA-pinned. Net P2 change: +2 gaps added, +2 resolved. See LAUNCH_BLOCKERS.md for the full pre-launch blocker register.
>
> **April 2026 Phase 2–3 audit note:** Architecture, Auth & Tenancy hardening audit completed. Three new P1 gaps discovered: AF-001 (adminGuard timing-unsafe token compare), AF-003 (vessels fleet routes cross-tenant), AF-007 (vessels DB schema missing org_id). Seven additional P2 findings documented in AUDIT_FINDINGS_REGISTER.md. Net change: +3 P1 open gaps. Full findings in AUDIT_FINDINGS_REGISTER.md and CONTROL_PLANE_ARCHITECTURE.md.
>
> **April 2026 Phase 4–5 audit note:** Flow audit and quality pass completed. 4 new flow gaps and 8 test quality gaps documented. 2 test gaps resolved in this sprint (cortex-inca-smoke config fix, api-version error message fix). All lint warnings documented as baseline (4,519 warnings, 0 errors). Full findings in AUDIT_FINDINGS_REGISTER.md.
>
> **April 2026 Phase 6–9 audit note:** Observability, billing, support operations, and release safety audit completed. All 25 deliverable documents verified present and substantive. 2 new P1 gaps added: KG030 (PostHog not wired) and KG031 (status page not live). 2 new P2 gaps added: KG032 (observability collector uses simulated data) and KG033 (no unified production infra observability doc). 1 existing gap clarified: BIL-001 notes Stripe is test-mode only (cross-reference DATA-009). Release safety documentation (RELEASE_CHECKLIST.md, DEPLOYMENT-GUIDE.md, ENVIRONMENT_VALIDATION.md, ROLLBACK_PLAYBOOK.md, LAUNCH_DAY_RUNBOOK.md, GO_NO_GO_CHECKLIST.md) is all production-quality. CI pipeline is comprehensive with 14 workflows all SHA-pinned. No new P0 findings. Full findings in AUDIT_FINDINGS_REGISTER.md §Phase 6–9.
>
> **April 2026 Phase 10–13 audit note (FINAL):** Trust Center, diligence, docs, commercial/demo coherence, and 9-perspective adversarial red-team review completed. TD-004 fixed: TRUST_CENTER_INDEX.md model transparency corrected (HuggingFace/Qwen3-8B reference removed; multi-provider stack documented). 9 new actionable gaps added (RT-003, RT-005–RT-011, RT-017). 4 additional observations confirmed existing P1 gaps (no new P0/P1 security findings discovered). All commercial docs (DEMO_STRATEGY.md, EXECUTIVE_DEMO.md, OPERATOR_DEMO.md, TECHNICAL_DEMO.md, SALES_NARRATIVE.md, OBJECTION_HANDLING.md, CUSTOMER_SUCCESS_PLAYBOOK.md, GO_TO_MARKET_MOTION.md, PROOF_OF_VALUE_PLAYBOOK.md, DESIGN_PARTNER_PROGRAM.md) passed commercial coherence audit — no fabricated readiness claims found. Full red-team findings in AUDIT_FINDINGS_REGISTER.md § Phase 10–13. Final executive summary with go/no-go recommendation in EXECUTIVE_LAUNCH_SUMMARY.md.
>
> **April 2026 Production Observability Sprint note:** Three P1 pre-deploy blockers resolved: KG009 (OTEL exporter), KG027 (external uptime monitoring), KG028 (Sentry error tracking). Deliverables: `artifacts/api-server/src/lib/observability.ts` (canonical OTEL configuration module with startup validation and status reporting), `OPERATIONS-RUNBOOK.md` § 5.3 Production Observability Runbook (Sentry, OTEL, and uptime monitor setup + verification steps), `DEPLOYMENT-GUIDE.md` observability environment variables. P1 open count reduced from 11 → 8. Net change: +3 P1 resolved.
>
> **April 2026 Phase 10–11 Category Leadership & Final Diligence audit note:** Seven stakeholder lens diligence review conducted (enterprise security architect, platform buyer, AI governance stakeholder, operator lead, Series A technical advisor, VP Engineering, category-savvy product strategist). Key findings and resolutions: (1) TD-007: "Five primitives" inconsistency in 6 investor docs — resolved, all updated to "six primitives" with Event Fabric listed. (2) TD-008: Category naming inconsistency — canonical name established as "Governed Decision Infrastructure" across CATEGORY_POSITIONING.md v2.1, INVESTOR_NARRATIVE.md v3.0, MOAT_MAP.md v2.0, and investor-overview.md. Historical references to "Infrastructure" and "Intelligence" remain in some docs as variant terminology. (3) TD-009, TD-010: Residual primitive count errors in platform-thesis.md and investor-overview.md evaluation path — resolved. (4) MOAT_MAP.md updated to v2.0. (5) INVESTOR_NARRATIVE.md updated to v3.0 with Forge, Decision Fabric, and OS category framing. (6) TECHNICAL_DILIGENCE_PACKET.md footer updated to reflect complete 13-phase audit. Net P2 change: +4 gaps added, all 4 resolved. No new P0/P1 findings.

---

## Related Documents

### Phase 0–1 Audit Deliverables (created Apr 2026)
- `FULL_SYSTEM_INVENTORY.md` — exhaustive catalog of all apps, packages, routes, schemas, integrations, scripts, CI, docs
- `AUDIT_FINDINGS_REGISTER.md` — all findings with ID, category, severity, location, impact, fix status, manual review needed, blocking status
- `OUT_OF_SCOPE_REGISTER.md` — all deferred/out-of-scope items with disposition guidance
- `ENVIRONMENT_VARIABLES.md` — complete env var reference (~150 documented vars) with required/optional status, defaults verified against source
- `.env.example` — updated developer template with 175 variables, one-to-one with ENVIRONMENT_VARIABLES.md

### Launch Readiness Documents (created Apr 2026)
- `LAUNCH_BLOCKERS.md` — authoritative list of items that block public launch
- `PUBLIC_LAUNCH_READINESS.md` — launch bar definitions across 10 dimensions
- `GO_NO_GO_CHECKLIST.md` — final launch decision checklist
- `OPERATIONAL_READINESS_SCORECARD.md` — red/yellow/green readiness scorecard
- `EXECUTIVE_LAUNCH_SUMMARY.md` — launch readiness summary for leadership and investors

### Security and Credential Documents
- `SECURITY-CHECKLIST.md` — full control inventory and credential hygiene
- `SECRETS_SETUP.md` — instructions for handling secrets and credentials

### Phase 4–5 QA Documents (created Apr 2026)
- `FLOW_AUDIT_MATRIX.md` — per-flow audit state across all user and admin flows
- `TEST_STRATEGY.md` — testing philosophy, coverage targets, and gap plan
- `SMOKE_TEST_PLAN.md` — minimum smoke suite for every deployment
- `REGRESSION_RISK_REGISTER.md` — high-risk logic requiring regression coverage
- `QA_SIGNOFF_CHECKLIST.md` — release gate checklist

### Phase 6–9 Ops, Billing & Release Documents (verified Apr 2026)

**Observability & Analytics:**
- `OBSERVABILITY_ARCHITECTURE.md` — decision-fabric observability surfaces
- `AI_RUNTIME_OBSERVABILITY.md` — AI telemetry and GenAI trace conventions
- `ANALYTICS-EVENTS.md` — canonical event taxonomy with funnel definitions
- `NORTH_STAR_METRICS.md` — governed decisions as the north star metric
- `EXECUTIVE_SCORECARD.md` — board-quality weekly/monthly scorecard framework
- `CUSTOMER_HEALTH_MODEL.md` — 5-signal composite health score (0–100) per tenant
- `LAUNCH_ANALYTICS_PLAN.md` — Day 0/1/7/30 measurement plan with benchmarks

**Billing & Commercial:**
- `BILLING_ARCHITECTURE.md` — Stripe integration, entitlement middleware, billing state
- `ENTITLEMENTS_MODEL.md` — plan tiers, feature gating, domain pack access model
- `PLAN_MATRIX.md` — quick-reference feature comparison across all tiers
- `PRICING_PACKAGING.md` — commercial pricing, packaging, and discount structure
- `REVENUE_MODEL.md` — ARR model, expansion vectors, and revenue forecasting
- `LAND_AND_EXPAND.md` — land/expand motion, expansion triggers, and playbook

**Support & Incident Operations:**
- `SUPPORT_OPERATIONS.md` — channels, tiers, SLAs, and staffing model
- `INCIDENT_COMMAND_PLAYBOOK.md` — IC role, phases, communications, review process
- `SEVERITY_MODEL.md` — P0–P3 classification with qualifying criteria and response targets
- `STATUSPAGE_PLAN.md` — status page architecture (planned) with Betterstack/Instatus guidance
- `CUSTOMER_ESCALATION_MATRIX.md` — who to contact, when, and how for each scenario
- `RUNBOOK_COMMON_FAILURES.md` — step-by-step recovery for known failure modes
- `SUPPORT_HANDOFF_GUIDE.md` — IC transfer and shift-handover procedures

**Release Safety:**
- `RELEASE_CHECKLIST.md` — comprehensive pre-release gate with staged rollout plan
- `DEPLOYMENT-GUIDE.md` — Replit + Azure deployment procedures with hard blockers
- `ENVIRONMENT_VALIDATION.md` — Stage 1 (dev→staging) and Stage 2 (staging→prod) gates
- `ROLLBACK_PLAYBOOK.md` — rollback criteria, procedures for Replit + Azure, DB rollback
- `LAUNCH_DAY_RUNBOOK.md` — T-48h, T-0, T+24h/72h launch operations
- `GO_NO_GO_CHECKLIST.md` — 7-section launch decision tool with binary pass/fail criteria

### Phase 10–13 Trust, Docs & Commercial Documents (verified/updated Apr 2026)
- `TRUST_CENTER_INDEX.md` — buyer-facing security, AI governance, and compliance hub (TD-004 corrected this sprint)
- `TECHNICAL_DILIGENCE_PACKET.md` — complete investor/advisor technical diligence packet
- `SHARED_RESPONSIBILITY_MODEL.md` — operational posture and shared responsibility model
- `PRIVACY_OVERVIEW.md` — GDPR/CCPA privacy framework overview
- `AI_GOVERNANCE.md` — buyer-facing AI governance posture
- `COMPANY_FACT_SHEET.md` — concise company overview for press/investors
- `SERIES_A_READINESS.md` — honest Series A readiness assessment
- `DOCS_HOME.md` — documentation home page
- `GETTING_STARTED.md` — developer and operator quick start
- `END_USER_GUIDE.md` — end-user operational guide
- `FAQ.md` — frequently asked questions
- `FEATURE_OVERVIEW.md` — complete feature surface overview
- `CONTRIBUTING.md` — developer contribution guide
- `DEMO_STRATEGY.md` — demo strategy for all three audiences
- `EXECUTIVE_DEMO.md` — investor/executive demo script
- `OPERATOR_DEMO.md` — operator audience demo script
- `TECHNICAL_DEMO.md` — technical partner demo script
- `DESIGN_PARTNER_PROGRAM.md` — design partner program terms and engagement model
- `PROOF_OF_VALUE_PLAYBOOK.md` — POV engagement methodology
- `GO_TO_MARKET_MOTION.md` — GTM motion documentation
- `SALES_NARRATIVE.md` — sales narrative and positioning
- `OBJECTION_HANDLING.md` — objection handling guide
- `CUSTOMER_SUCCESS_PLAYBOOK.md` — customer success methodology
- `EXECUTIVE_LAUNCH_SUMMARY.md` — **final go/no-go decision package** (all 13 executive outputs)

### Implementation References
- `lib/db/migrations/0001_add_tenant_id_to_rag_knowledge_chunks.sql` — DB migration for tenant isolation
- `artifacts/api-server/src/lib/validation.ts` — `validateBody` / `validateQuery` / `validateParams` helpers
- `lib/ai-engine/src/retrieval/alloy-retrieval.ts` — tenant-scoped retrieval implementation

### Audit Archive
- `docs/audit/series-a-full-audit.md` — authoritative series A full audit
- `docs/audit/series-a-gap-register.md` — detailed gap register with GAP-001 through GAP-015
- `docs/audit/series-a-out-of-scope-register.md` — series A out-of-scope register
- `docs/audit/mock-stub-placeholder-register.md` — complete mock/stub/placeholder inventory
- `docs/audit/omega-audit-findings.md` — Omega Phase 0 baseline findings

---

## Incident Log

- **2026-09-30 (P0 exact-source browser gap closed locally):** Source
  `683c13a1ec3ddfc0a347c103a242ae0c8a17ea46`, including protected base
  `402c9876c032a9bb532f0a3d1f997aa3254c7653`, passed the owned build, 155 browser
  states and 75 screenshots with zero failures. All source/image/receipt/manifest
  bindings were independently checked and retained. Earlier missing-browser,
  ENOSPC and timeout attempts remain failed historical observations. Protected
  admission/hosted CI and full operational readiness are not inferred. The latest
  independently deployed A11oy Python status still reports
  `BLOCKED/github_inventory_unavailable` despite signed persistent receipts.
  Lambda #57/#58 merged normally and its separate v0.2.0 model-mirror receipt
  was recovered; that is not first-class kernel or model-quality qualification.
  Complete proof: `audit/P0_SERIES_A_SOURCE_ALIGNMENT_20260929.md`.

- **2026-09-29 (P0 publication and operational boundary):** The complete signed
  implementation and September 25 proof were normally pushed to the existing
  task branch at `4d44542e967eb341b05418f8a0bc550b882bf1dc`; remote identity and
  GitHub signature verified. Fresh production build and scoped JS/TS/Python
  checks passed. Current browser qualification is blocked by missing Chromium
  and disk exhaustion; earlier screenshots are not relabeled. PR #601 remains
  closed, and the published head has no Actions runs in the branch/commit query.
  The documented lib/a11oy-fabric-py path is absent; actual Python checks cover
  readiness, substrate workers, Live-Wires and Wire-D. The independently served
  A11oy product still reports absent signer/unminted receipt; a11oy.net remains
  static. No provider or production gap is closed by branch publication.
  Exact commands, source mappings and limits:
  `audit/P0_SERIES_A_SOURCE_ALIGNMENT_20260929.md`.

- **2026-09-25 (P0 current-source completion):** The protected-base successor
  `c62cac56e4ea84ccff641e0cc119bfe67278e577` passed 75 source-bound captures and
  155 browser states after correcting capture's lazy-route readiness race.
  Fresh runtime 37/37, shared contracts 190/190, source/helper 23/23, browser
  layout 9/9 and four scoped typechecks passed. Evidence is local/non-authoritative;
  strict claims still lacks Vessels/AIS authority, and aggregate/hosted/provider/
  deployment gates remain open. See `audit/P0_SERIES_A_PRODUCT_UPGRADE_20260925.md`.

- **2026-09-24 (P0 product upgrade):** Source `6ca620d578c39a9b97a47259445782bf6b58f159`
  closes the scoped responsive clipping, mobile navigation and replay pause/resume
  gaps with 155 local interaction states and 75 source-bound screenshots. This is
  local fixture/product evidence, not production readiness. Vessels/AIS strict
  claims remains blocked without provider authority; aggregate typecheck is not
  qualified; exact-head hosted CI, protected promotion, provider publication and
  deployment remain separate. See `audit/P0_SERIES_A_PRODUCT_UPGRADE_20260924.md`.

- **2026-08-30 (A11oy Atelier Turn Capsule v1):** Source now defines idempotent reservation/replay, a tenant-scoped hash-linked capsule chain, verification, staged commit, pending recovery, an optional encrypted local adapter, explicit browser Resume/New session controls, and fail-closed production continuity. Restart continuity applies only when the absolute directory and 32-byte key are configured, the same key is retained, and one runtime process uses one host. Twenty-four hours is a logical maximum retrieval window; physical purge runs on startup, continuity operations, and a 15-minute service sweep, not while the host is off. The default store and `EvidenceLedger` remain non-durable. Distributed coordination, production identity, deployment, direct xAI API witness, and independent runtime witness remain open evidence states. Configurable shared-proxy ports avoid local listener conflicts but do not establish upstream availability.

- **2026-08-26 (A11oy Atelier local integration):** A11oy Atelier is locally wired through the governed runtime route, deterministic capability policy, xAI API/local Grok Build adapters, EvidenceLedger receipt append, tenant-scoped working memory, CLI, health surface, and A11oy UI. A live local Grok 4.6 witness and browser witness passed. Remaining gaps are production deployment witness, production identity binding, durable external ledger/session persistence, direct xAI API witness, and CI at the eventual remote exact head. Local health or inference evidence must not be reported as deployment.


- **2026-07-28 (PR #524 post-merge Commitlint policy failure):** Protected main
  contains the exact reviewed attestation hardening tree at
  `3daa582026778294a90f07474294de72d2063012`. Commitlint failed after merge on
  source commit `9d74488d40e44a6ff88dab94aa2146f7f7388216` because a body line exceeded
  100 characters. The code checks named in the receipt above passed, but #524
  is not an all-green PR. History was preserved; the policy failure is
  remediated forward through this signed audit record and compliant future
  commits.

- **2026-07-25 (FRONTIER V2 Wave 1 Truth Lock):** TD-011 resolved. Live
  tracked-tree inspection found material drift between `SOURCE_OF_TRUTH.md`,
  `audit/source-of-truth.json`, and the current runtime layout. The canonical
  registry was rebuilt at v2.0.0, Doctrine `749/14/163` was split into labelled
  metrics, ambiguous governance vocabulary was defined in `docs/GLOSSARY.md`,
  and dependency-free drift validation was added to CI. Runtime/database values
  not refreshed in this pass are retained only as historical snapshots.

- **2026-04-16 (Phase 4–5 Flow & Quality Audit):** Flow audit and quality pass completed. All major user/admin flows documented in FLOW_AUDIT_MATRIX.md. 4 new flow gaps (FLOW-001–004) and 8 test quality gaps (TG-001–008) added to register. 2 test defects fixed: cortex-inca-smoke excluded from unit config; api-version error messages corrected (4 failing tests now pass). Lint baseline documented: 4,519 warnings, 0 errors. Full findings in AUDIT_FINDINGS_REGISTER.md. New QA docs created: TEST_STRATEGY.md, SMOKE_TEST_PLAN.md, REGRESSION_RISK_REGISTER.md, QA_SIGNOFF_CHECKLIST.md.

- **2026-04-16 (Phase 6–9 Ops, Billing & Release Audit):** Observability, analytics, billing, support operations, incident response, and release safety audit completed. All 25 deliverable documents verified present and substantive. New gaps cataloged: KG030 (PostHog not wired), KG031 (status page not live), KG032 (observability collector seeds simulated data), KG033 (no unified prod infra observability doc). Billing documentation (BILLING_ARCHITECTURE.md, ENTITLEMENTS_MODEL.md, PLAN_MATRIX.md, PRICING_PACKAGING.md, REVENUE_MODEL.md, LAND_AND_EXPAND.md) verified complete and accurate. Support operations documentation (SUPPORT_OPERATIONS.md, INCIDENT_COMMAND_PLAYBOOK.md, SEVERITY_MODEL.md, STATUSPAGE_PLAN.md, CUSTOMER_ESCALATION_MATRIX.md, RUNBOOK_COMMON_FAILURES.md, SUPPORT_HANDOFF_GUIDE.md) verified production-quality. Release safety documentation (RELEASE_CHECKLIST.md, DEPLOYMENT-GUIDE.md, ENVIRONMENT_VALIDATION.md, ROLLBACK_PLAYBOOK.md, LAUNCH_DAY_RUNBOOK.md, GO_NO_GO_CHECKLIST.md) verified production-quality with real pass/fail criteria. CI pipeline verified: 14 workflows all SHA-pinned. No new P0 security findings. KNOWN-GAPS.md updated to rev 7.

- **2026-04-16 (Phase 0–1 Operational Audit):** Full exhaustive inventory and repo/secret hygiene audit completed. No hardcoded credentials found in source — all secrets use `process.env.*`. All 13 GitHub Actions workflows confirmed SHA-pinned. New deliverables created: FULL_SYSTEM_INVENTORY.md (complete platform catalog — 15 artifacts, 40 lib dirs, 18 packages, 225 route files, 13 CI workflows, scripted verification appendix), AUDIT_FINDINGS_REGISTER.md (51 findings with Impact and Manual Review Needed columns), OUT_OF_SCOPE_REGISTER.md (20 deferred items), ENVIRONMENT_VARIABLES.md (~150 vars documented with source-verified defaults), .env.example expanded to 175 vars. KG018 and GAP-004 resolved by new docs. KG029 (alloy-integrations test stub) newly cataloged. virusScan.ts confirmed as explicit stub (KG020c). SESSION_TTL_MS default corrected to 604800000 (7 days) per env-config.ts. KNOWN-GAPS.md updated (rev 6).

- **2026-04-16 (Phase 0 Launch Readiness):** Phase 0 launch readiness audit completed. All committed mobile credential files confirmed as placeholders — no active key material detected. Manual rotation of Firebase/Google credentials required as precautionary measure (GAP-001 / LB-001). TD-004 re-opened: TRUST_CENTER_INDEX.md model reference not corrected despite being marked resolved. Full audit findings documented in LAUNCH_BLOCKERS.md, PUBLIC_LAUNCH_READINESS.md, GO_NO_GO_CHECKLIST.md, OPERATIONAL_READINESS_SCORECARD.md, and EXECUTIVE_LAUNCH_SUMMARY.md.

- **2026-04-16 (Phase 2–3 Architecture/Auth/Tenancy):** Architecture, Auth & Tenancy hardening audit completed. Three new P1 gaps discovered: AF-001 (adminGuard timing-unsafe token compare), AF-003 (vessels fleet routes cross-tenant), AF-007 (vessels DB schema missing org_id). Seven additional P2 findings logged in AUDIT_FINDINGS_REGISTER.md. New documents created: DEPENDENCY_MAP.md, AUDIT_FINDINGS_REGISTER.md, CONTROL_PLANE_ARCHITECTURE.md.

- **2026-04-16 (Phase 10–13 Trust, Docs, Commercial, Red-Team — FINAL):** Final audit phases completed. Trust Center content reviewed and corrected: TD-004 resolved — TRUST_CENTER_INDEX.md model transparency updated from incorrect HuggingFace/Qwen3-8B reference to accurate multi-provider stack (OpenAI, Anthropic, Gemini). Self-serve documentation audit completed: 4 new doc gaps cataloged (RT-005 through RT-008). Commercial/demo coherence audit passed: all 10 commercial docs verified against live product capabilities — no fabricated readiness claims found. 9-perspective adversarial red-team review completed: no new P0 or P1 security findings discovered; 5 new P2 actionable gaps surfaced (RT-003, RT-009–RT-011, RT-017). Final cumulative audit totals: 106 total findings across all phases, 13 resolved, 93 open (includes INFO/PASS observations). EXECUTIVE_LAUNCH_SUMMARY.md updated with all 13 required executive outputs. KNOWN-GAPS.md rev 7 (final).

- **2026-04-17 (Phase 10–11 Category Leadership & Final Diligence):** Seven stakeholder lens diligence review completed. Category named canonically as "Governed Decision Infrastructure" — CATEGORY_POSITIONING.md updated to v2.1 with three new sections (why legacy observability is insufficient, why generic AI copilots are insufficient, why automation without proof/policy is insufficient). INVESTOR_NARRATIVE.md updated to v3.0 (Forge governed agent lifecycle, Decision Fabric, category OS framing). MOAT_MAP.md updated to v2.0. MARKET_POSITIONING.md updated to v2.0. COMPANY_FACT_SHEET.md updated. TECHNICAL_DILIGENCE_PACKET.md footer updated to reflect full 13-phase audit completion. 4 new P2 doc accuracy gaps catalogued (TD-007 through TD-010), all 4 resolved. Six investor docs corrected from "five primitives" to "six primitives" with Event Fabric explicitly listed. KNOWN-GAPS.md rev 8 (final category elevation pass).

- **2026-04-25 (A11OY Operationalization Sweep — Task #3489):** Full operationalization sweep completed. Gaps fully closed: VD1 (security.txt published RFC 9116 compliant at web + API origins, SECURITY.md updated), KG019 (Lighthouse CI confirmed; accessibility upgraded from warn to hard error gate), KG020c (virusScan.ts enhanced: tier-1 YARA-style signatures + tier-2 ClamAV-REST/Cloudmersive feature flag), KG023 (sli-slo.md confirmed), KG024 (manualChunks bundle splitting confirmed in szl-holdings vite.config), KG025 (A11OY_ACCESSIBILITY_AUDIT.md — all 11 audited UI routes), KG030 (posthog-init.ts confirmed: posthog-js installed with PII scrubbing), KG031 (public-status.ts registered). Gaps partially closed: KG020d (lib/encryption.ts helper — DB columns not yet wired; deferred to #3757). GAP-001 runbook ready (docs/operations/GAP-001-credential-rotation.md — actual rotation requires authorized operator). Four Pathfinder audit reports: Context Pack, Release Readiness Score (77.2/100), Screenshot Freshness (65/100), Public Claim Safety (82/100). Proof Packet: audit/A11OY_OPERATIONALIZATION_PROOF.md. Workflow status: 12/15 running; 3 platform-level port conflicts. KNOWN-GAPS.md updated to rev 12.

- **2026-04-17 (Diligence Security Gap Remediation Sprint):** Five pre-commercial security gaps from the diligence review resolved or formally accepted. (1) **MFA (KG026)** — Formally accepted. IdP-level MFA via Azure AD SSO is the enforced control; platform-native MFA scoped for enterprise tier. (2) **IP address storage (KG034)** — Resolved. `hashIp()` in `lib/audit/src/ip-hash.ts` applies SHA-256 with configurable salt before all audit and session IP storage. Raw IPs never reach the DB. (3) **Input validation (KG003–KG008)** — Confirmed resolved. All high-traffic write routes verified to have Zod `validateBody()` applied (already resolved in Apr-2026 hardening sprint). (4) **Session revocation on role change (AF-010)** — Resolved. `revokeUserSessionsOnRoleChange()` added to `session-policy.ts`; wired into SCIM group member operations and new `PUT /admin/users/:userId/roles` endpoint. (5) **Dependency pinning (KG035)** — Formally accepted. `pnpm-lock.yaml` provides exact pinning; `pnpm install --frozen-lockfile` used in all CI/deploy pipelines; dependency vulnerability scanning via KG012. KNOWN-GAPS.md rev 9.

---
