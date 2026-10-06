# SZL estate prepublish audit — 2026-10-05

**Audited repository:** `szl-holdings/platform`
**Audited pre-patch source:** `b758bcfbc177236876c524e27cb2e765c87e00d7`
**Audited pre-patch tree:** `ec9eb4859a3d4d97eb11f062a8cc3b52c42b0461`
**Authentication remediation source/tree:** `c65edd118dae25678b98307ee0f9f5bc85db7b7a` / `24b619d654f2dffed9d084d7cebdc7c54a5335d2`
**Truth-state milestone source/tree:** `4e633b08464afd00f4228b962821bc3f66c361e0` / `08090886ffe105f67a920b1c52e424a9cdffd65e`
**Current local kernel successor source/tree:** `99305772172270109f1023da6987a6ca32445847` / `d9fb20160c0fe8b18d4d21ab667060646771653d`
**Governance-gate successor source/tree:** `30adc98bd8dc8203a89951ebbfe8830b17a3b39f` / `1cabf1f15dff89f725fc0dda2f52877137bff832`
**Release-security successor source/tree:** `f2700966bfac32dc0adb18c50c5a87577df7866b` / `3d7802402d832817eb54814f1d0d1de7eeb0c87e`
**Scope:** GitHub organization, Hugging Face organization, `a-11-oy.com`,
`a11oy.net`, and the Python/frontend/backend boundary
**Decision:** **HOLD public operational-readiness claims; conditionally proceed
with development-environment publication after review.**

This is a prepublication control report, not a deployment receipt. The managed
environment status reported a disabled/unknown network policy with no
configured outbound identity, but approved read-only calls produced two narrow
current observations: native Git returned origin `HEAD`
`f2f8df6f89056e9104587674ccec0855dd5b177a`, and an authenticated GitHub
metadata read exhausted the organization-repository cursor. Those observations
do not establish branch contents, settings, checks, rulesets, alerts, packages,
or deployment. The approved Hugging Face retry still returned
`UNAVAILABLE/fetch_failed`. Bounded homepage probes observed `a-11-oy.com`
returning an error response and `a11oy.net` returning its proof registry; the
rest of each domain remains unqualified. All external calls cited by this
report were read-only, and no external mutation is used as audit evidence. The
separate local-checkout remediation is source-bound to the commits above and
does not imply deployment.

## Evidence discipline

| Label | Meaning in this report |
| --- | --- |
| **LOCAL** | Read or measured from the exact local checkout identified above. |
| **RETAINED** | A dated repository-controlled snapshot or earlier receipt. It is historical evidence, not current remote truth. |
| **BLOCKED** | A current observation was attempted or required but could not complete because network access or authorized identity was unavailable. The result is not zero, absent, down, or healthy. |
| **RECOMMENDATION** | A proposed control or architecture decision. It is not implemented merely because it appears here. |

HTTP `401`, `403`, and scope-dependent `404` responses do not establish that a
private resource is absent. They establish only that the caller could not
observe it. Likewise, a repository file describing a deployment is not a live
deployment witness, and a responding route is not a correctness, durability,
security, or customer-use claim.

## Executive result

| Estate | Current disposition | Basis |
| --- | --- | --- |
| GitHub `szl-holdings` | **CURRENT METADATA / HOLD** | A cursor-complete metadata read observed 140 unique repositories (128 public, 12 private) on 2026-10-06. Settings, rulesets, checks, alerts, packages, and exact-head qualification remain unobserved; local workflow review found material release-integrity gaps. |
| Hugging Face `SZLHOLDINGS` | **UNKNOWN / HOLD** | The live catalog probe returned `UNAVAILABLE/fetch_failed`. Retained inventory sources conflict, collections are unavailable, and asset presence does not prove publication authority, execution, quality, or training rights. |
| `a-11-oy.com` | **CURRENT HOMEPAGE DEGRADED / HOLD** | A TLS-validated read returned HTTP 503 and the 49-byte HF error marker. The wider route/DNS/certificate/application state remains unqualified. |
| `a11oy.net` | **CURRENT HOMEPAGE OBSERVED / HOLD** | A TLS-validated read returned HTTP 200 and the titled proof-registry HTML. A homepage response is not whole-site or backend health. |
| Python and web architecture | **PARTIAL / MIGRATE BY CONTRACT** | All tracked Python files passed a syntax compile sweep, but dependency and CI governance are fragmented. The browser product is React/TypeScript and should not be cosmetically rewritten in Python. |

The local checks and pinned tooling support a repeatable development-environment
candidate. They do not yet support the statement that the whole estate is
fully operational. A cloud
environment publication would snapshot setup and restricted-egress policy; it
would not deploy the product, publish assets, make a domain healthy, push a
branch, or close the evidence gaps in this report.

## P1 — unauthenticated wake-receipt write path

**Status:** **PRE-PATCH LOCAL SOURCE CONFIRMED; AUTHENTICATION REMEDIATED AT
`c65edd118` AND CURRENT LOCAL SUCCESSOR TESTED AT `993057721`; HOSTED/LIVE
EXPOSURE, SECRET CONFIGURATION, AND DEPLOYMENT UNOBSERVED.**

The line references and vulnerable behavior below describe the audited
pre-patch source identified at the top of this report. Local commit
`c65edd118dae25678b98307ee0f9f5bc85db7b7a` replaces that behavior and passed
independent review. Truth-state milestone
`4e633b08464afd00f4228b962821bc3f66c361e0` prevents unconnected kernel
scaffolds from claiming work. Credential-separation successor
`b0c6c6070caafef7a0e2aa4712a151e5a5d54e0c` rejects equal accepted admin
and wake credential values. Current successor
`99305772172270109f1023da6987a6ca32445847` bounds Codex pagination and
corrects the route-collision contract. The current local vendored module has
SHA-256
`0b045cd3f61d1060d9aafc7340ffe00d6328f9a560cce285867ba85ae62d1c73`;
the authentication commit's retained module hash is
`6353b2902378f3c3ec2b7749ac254ac3d4fe84610ecc0f16671e08d4d562a445`.
The detailed local evidence is recorded in
[`A11OY_KERNEL_MUTATION_HARDENING_PROOF_2026-10-05.md`](./A11OY_KERNEL_MUTATION_HARDENING_PROOF_2026-10-05.md).
This is source remediation, not a hosted-deployment receipt.

At pre-patch source `b758bcfbc177236876c524e27cb2e765c87e00d7`, the
warm-controller workflow runs on a ten-minute schedule, manual dispatch,
selected pushes, and pull requests at
`.github/workflows/warm-flagships.yml:8-23`. Its `wake-receipt` job is excluded
only for pull requests and sends an unauthenticated JSON `POST` to a public-form
Hugging Face Space URL:

- At `b758bcfbc177236876c524e27cb2e765c87e00d7`,
  `.github/workflows/warm-flagships.yml:181-198` defines the non-PR job and
  posts to
  `https://szlholdings-a11oy.hf.space/api/a11oy/v3/kernels/wake-receipt`.
- At that same source,
  `packages/szl-kernels/deploy/szl_kernels_organ.py:488-499` registers the
  handler, parses arbitrary JSON, and appends it to `k.codex`.
- At that same source,
  `packages/szl-kernels/deploy/szl_kernels_organ.py:126-144` identifies that
  Codex as a hash-linked SQLite store.
- At that same source, the module has an admin-token helper at
  `packages/szl-kernels/deploy/szl_kernels_organ.py:469-473`, but the
  wake-receipt handler does not invoke it.

The handler has no route-level authentication, strict request schema, explicit
body-size limit, replay/idempotency guard, or rate limit. Caller-controlled
fields are expanded into the appended event. If the source is deployed as
written and publicly reachable, an unauthenticated caller could attempt to grow
or contaminate the receipt chain or drive write/resource pressure. The audit did
not call the route, wake a Space, or test exploitability, so present live
exposure is not claimed.

### Local remediation result

Commit `c65edd118` adds the following fail-closed controls:

- A dedicated `SZL_WAKE_RECEIPT_TOKEN` Bearer gate uses fixed-length digest
  comparison. Missing server configuration returns `503`; missing or wrong
  credentials return `401`. The scheduled workflow exits nonzero before
  `curl` when its matching GitHub Actions secret is absent.
- The handler streams at most 1 KiB, accepts only the exact seven-field JSON
  schema, rejects duplicate or unknown keys, pins caller source and repository,
  validates run/attempt/SHA/event, and allows only ±300 seconds of timestamp
  skew. Server-controlled event and receive-time fields replace caller field
  expansion.
- SQLite `BEGIN IMMEDIATE` transactions make
  `(repository, run, run_attempt)` durable and atomic across connections.
  Equivalent retries return the original entry ID/hash with `replay=true` and
  no second append; substantive reuse returns `409`.
- The adjacent forced `tick`, `start`, and `stop` mutations now share a
  separate, fail-closed `SZL_ADMIN_TOKEN` Bearer gate. Legacy query-string and
  custom-header credentials are rejected. Credential-separation successor `b0c6c6070`
  disables both gates if the two accepted configured values are equal; each
  value must be 32–512 ASCII bytes without whitespace. This enforces syntax
  and separation, not entropy.
- The workflow bounds and validates its response. Fourteen controller tests
  and 22 dependency-free kernel tests pass at the current successor: 20
  boundary/security tests plus two truthfulness tests spanning all
  five organs. They cover concurrent retries, replay drift, stale/future
  timestamps, legacy credentials, missing configuration, malformed JSON,
  duplicate keys, body-limit bypass attempts, bounded Codex pagination, honest
  unavailable adapters, and valid/tampered local chain verification. Python
  compilation, workflow YAML parsing, and `git diff --check` also pass.
- Truth-state milestone `4e633b084` makes every unconnected non-chain kernel report
  `did_work=false` and `UNAVAILABLE: substrate adapter not connected` while
  using `alive=true` only to say the individual tick path completed. Scheduler
  health also requires a fresh tick and observed `running` status. `chain`
  claims only local Codex hash-link verification. No named substrate
  integration is represented as implemented.

### Remaining requirements before external promotion

1. Deploy the exact reviewed vendored module and verify its source identity;
   the local commit does not establish that any Space received these bytes.
2. Generate high-entropy, unequal `SZL_WAKE_RECEIPT_TOKEN` and
   `SZL_ADMIN_TOKEN` values, configure the wake value consistently in GitHub
   Actions and the A11oy Space, and configure the admin value only where needed
   in the Space. Rotate legacy clients in a coordinated cutover. No secret
   value belongs in source.
3. Prefer a short-lived GitHub OIDC assertion bound to repository, workflow,
   ref, run ID, audience, and issuer over the staged long-lived wake secret.
4. Add a durable request-rate policy, storage quota, and retention/compaction
   design that preserves chain semantics. No in-memory limiter was added or
   represented as closure; `429` and quota tests remain open.
5. Mount `SZL_CODEX_DIR` on explicitly persistent storage if rebuild durability
   is required. The default `/tmp` database is container-local.
6. Perform an authorized remote deny/accept/replay/readback test against the
   exact deployed revision. Record the response and chain identity without
   interpreting the explicitly permitted placeholder signer as cryptographic
   verification.
7. Decide and enforce the Codex read policy. Although pagination is bounded to
   100 entries and an offset of 10,000, the staged GET route is
   unauthenticated. Bind reads to authenticated tenant/role policy, minimize
   response fields, and add deny/allow tests before public exposure.

## GitHub organization audit

### Inventory boundary

- **CURRENT AUTHENTICATED METADATA READ (2026-10-06T04:33:40Z):** Two
  successful API pages exhausted the repository cursor and observed 140/140
  unique repositories: 128 public, 12 private, 111 active, 29 archived, zero
  forks, and `main` as the default branch for all 140. Primary-language
  metadata reported Python 105, TypeScript 12, JavaScript 8, HTML 6, CSS 2,
  Shell 2, TeX 2, Lean 1, and two null values. The response authority was
  `metadata=read`; it establishes neither settings nor code qualification. The
  privacy-preserving aggregate receipt is
  [`evidence/github-org-metadata-summary-2026-10-06.json`](./evidence/github-org-metadata-summary-2026-10-06.json).
- **RETAINED (2026-09-29):** The last complete authenticated receipt reports
  130/130 unique repositories, including 95 with Python as the primary
  language. It reports 34 open pull requests in 11 repositories, of which 24
  were drafts, with rollups of 16 successful, 15 failing, and 3 pending. These
  counts are timestamped observations, not current status or whole-estate
  qualification. Source: `audit/P0_SERIES_A_SOURCE_ALIGNMENT_20260929.md`.
- **RETAINED (2026-07):** A public-only ledger reports 54 public repositories,
  42 active and 12 archived, all using `main`. It is older and excludes private
  visibility; it must not be reconciled with either authenticated inventory by
  subtraction.
- **CURRENT LIMITED NATIVE-GIT READ (2026-10-06):** `git ls-remote origin HEAD`
  observed `f2f8df6f89056e9104587674ccec0855dd5b177a`. This proves only that the
  configured remote exposed that ref; it does not prove its branch name,
  contents, or inclusion of any local successor.
- **UNOBSERVED:** Current pull requests, rulesets/branch protection, required
  checks, Actions conclusions, packages, memberships, and security-alert state
  were not cursor-completely read with the needed authority. Their current
  values remain **UNKNOWN**.

### Local governance findings

These are source/configuration findings in the Platform checkout. They do not
assert that the same bytes or settings are active across every organization
repository. Local successor `30adc98bd8dc8203a89951ebbfe8830b17a3b39f`
hardens reproducibility, accessibility aggregation, and the main build;
`f2700966bfac32dc0adb18c50c5a87577df7866b` hardens the Platform CodeQL
gate and gives the Trivy/Grype workflow an accurate filesystem/SCA identity.
The dependency-free contracts passed 5/5 governance and 10/10 release-security
tests, and the touched YAML parsed. These are source results, not hosted-run or
ruleset receipts.

| Priority | Finding | Required closure |
| --- | --- | --- |
| P1 | Branch-protection documentation and expected check names are stale or target the wrong branch in places; repository settings were not live-read. | Generate required-check names from workflow job IDs, compare them with each live ruleset, and block promotion on any mismatch. |
| P1 | Release paths do not consistently require build, test, and vulnerability results before publication. Some release/deploy assertions are documentation rather than enforced code. | Introduce one fail-closed release admission workflow bound to the exact candidate SHA and artifact digest. |
| SOURCE REMEDIATED / HOSTED UNKNOWN | At `30adc98b`, reproducibility now performs two successful forced builds from separate clean checkouts of the same candidate SHA, requires nonempty complete Turbo-output manifests, and compares every output path and byte digest without failure masks. | Observe a green exact-head hosted run and make its check required in the live ruleset. |
| PARTIAL | At `f2700966`, the Platform PR CodeQL gate waits for processing, queries the exact synthetic merge ref, exhausts REST pagination, validates page/alert/ref/tool shape, rejects duplicate or malformed evidence, and blocks high/critical alerts. Organization-wide alert completeness and inaccessible repositories remain unobserved. | Observe the exact-head hosted gate, require it in the live ruleset, and add cursor-complete per-repository collection that preserves inaccessible state as `UNKNOWN`. |
| P1 | GitHub package publication is non-atomic and its private-package boundary is not handled as a recoverable transaction. | Stage, attest, verify readback, then promote; retain rollback and package-visibility receipts. |
| P1 | The accurately renamed Trivy/Grype workflow scans repository files and dependencies, not any of the 15 container build definitions or a promoted image digest. | Build each promoted image, scan the immutable digest before push/promotion, and bind vulnerability evidence and attestation to that digest. |
| SOURCE REMEDIATED / HOSTED UNKNOWN | At `30adc98b`, the aggregate accessibility gate accepts only exact `success`; failed, cancelled, skipped, and unknown matrix results fail. | Observe a green exact-head hosted run and require the aggregate context in the live ruleset. |
| PARTIAL | At `30adc98b`, the main build covers pull requests, performs a frozen install, and invokes the canonical full workspace build instead of six filtered frontends. Generated-file and promoted-artifact admission remain separate. | Observe a green exact-head hosted run, bind generated-file checks and every promoted artifact to release admission, and require the context in the live ruleset. |
| P2 | PR dependency review blocks a finite license denylist, while the generated full-estate license report remains informational; identifiers and version sources are ambiguous in parts of the estate. | Define the complete approved-license policy as a blocking gate and derive package/release versions from one signed source. |
| P2 | An API-specific security job is absent. | Add API schema, authn/authz, input-boundary, and dependency tests tied to the promoted API artifact. |
| P2 | CODEOWNERS contains overlapping general and specific patterns whose effective precedence needs review; current independent-approver capacity was not observed. | Verify effective ownership against live rulesets and document an exception lane only if current staffing evidence requires one, while preserving checks, signatures, linear history, and conversation resolution. |
| P2 | GitHub-facing documentation contains stale inventory and workflow descriptions. | Regenerate it only from a successful, current, paginated read and date the receipt. |

### Controls worth preserving

**LOCAL:** all 47 workflow YAML files parsed in the delegated audit; all 186
workflow `uses:` references were pinned to full commit SHAs (129 GitHub-owned,
four `szl-holdings` internal, and 53 other external references); workflows
define top-level permissions; and Dependabot covers GitHub Actions, npm, pip,
and Docker. The gitleaks download archive is SHA-checked while
`.gitleaks.toml` is selected but not separately checksummed. These are useful
source controls. They do not substitute for current ruleset enforcement, green
exact-head runs, or complete security-alert visibility.

## Hugging Face organization audit

### Current catalog state is unknown

- **CURRENT FAILED OBSERVATION (2026-10-06T04:32:47Z):** An approved read-only
  `node tools/hf-catalog/catalog.mjs --probe-live --format json` retry exited
  `2` with `UNAVAILABLE` / `fetch_failed`. The result is not an empty catalog
  and establishes no current count.
- **RETAINED (2026-08-20):**
  `audit/evidence/huggingface-public-catalog.snapshot.json` records 17 models,
  27 datasets, and 26 Spaces.
- **RETAINED (generated 2026-09-29):** `artifacts/SOURCE_OF_TRUTH.json` records
  49 models, 34 datasets, and 23 Spaces; collections are `UNAVAILABLE`.

The two retained counts materially differ. They may represent real churn,
different query semantics, or incomplete observation; without a new cursor-
complete probe, none may be advertised as the current estate count. Every new
inventory must preserve exact IDs, cursor exhaustion, observation time, and the
caller/authentication boundary.

### Asset and publication findings

| Area | Evidence and boundary | Disposition |
| --- | --- | --- |
| First-class `szl-kernels` Kernel | **RETAINED:** metadata reported `trustedPublisher=false`. Current-main/v1 parity, executable bytes, execution, and performance were not established. | HOLD kernel trust/execution claims. |
| `SZL-Khipu-1.5B` | **RETAINED:** source binding says `publication_eligible=false` with abstention 2/6 and no weights/runtime/evaluation authority. The exact ReceiptAgent README returned `401`. | Keep publication and qualification blocked; `401` means unobserved, not absent. |
| Lambda model mirror | **RETAINED:** a publication receipt reported 54/54 mirrored files and preserved Hub-only files. | This supports that model-mirror transaction only; it does not establish first-class Kernel execution, model quality, or inference readiness. |
| Dataset rights | **LOCAL/RETAINED metadata:** `payload_v11/CLAIMS_LEDGER.yaml` marks `killinchu-osint-corpus` `training_eligible=false` and the quant-SFT asset for counsel review, but its cited upstream `payload_v11/agent_reports/be2_models_kernels.md` is absent. The evidence chain is therefore broken as well as incomplete. | Do not train on, merge, or republish restricted/uncleared material. Restore primary evidence and build a file-level rights ledger first. |
| Space readiness | **LOCAL DATED GATE:** `PYTHONDONTWRITEBYTECODE=1 python payload_v11/tools/spaces_gate.py` reproducibly exited `1` with 17 findings across seven registry surfaces, three marked flagship. The script evaluates a hard-coded 2026-08-30 registry, not current live Spaces. | Treat live readiness as UNKNOWN. Refresh the registry from exact live revisions, rerun the gate, and do not infer readiness from `RUNNING` metadata alone. |
| Public bundles | **LOCAL inspection:** retained Space bundles contain topology references, including public and Tailscale addresses, that may be stale. | Inventory and minimize published topology. Treat current exposure as UNKNOWN until the exact live revisions are read. |

The catalog proves names and historical presence only. It does not prove that a
model has weights, a dataset has usable training rights, a Space responds
correctly, a Kernel executes, a signature verifies, or a publisher is trusted.

## Domain audit

### Current bounded homepage observations

**CURRENT PUBLIC READ (series completed 2026-10-06T04:37:35Z):** Without following redirects,
`https://a-11-oy.com/` completed default client TLS validation but returned HTTP
503, 49 bytes, SHA-256
`d967395a643b7f7acfaebbc6f70620868ea62bf2ea3a23562a2ed4a52e48ff5d`, and
the exact semantic marker `Your space is in error, check its status on hf.co`.
The response linked canonically to the `SZLHOLDINGS/a11oy` Space.
`https://a11oy.net/` completed the same TLS validation and returned HTTP 200,
120,651 bytes, SHA-256
`86048e6b4f57742f1ca0bc64e2e5518227534808e320472fc49bdd62ac70b2ac`, and
title `a11oy Proof Registry | SZL Holdings`. Both responses included HSTS and
`X-Content-Type-Options: nosniff`. Separate reads of both `www` hosts returned
HTTP 301 to their respective apex URLs. The bounded receipt is
[`evidence/domain-homepage-summary-2026-10-06.json`](./evidence/domain-homepage-summary-2026-10-06.json).

These reads establish only those response transactions. They do not establish
continuous availability, every route, backend/API correctness, accessibility,
complete security-header policy, DNS/CAA, certificate policy/expiry, or source
revision.

### Registry state

**LOCAL:** `config/public-surfaces.json` is structurally consumable and records
`observed_at=2026-08-11T08:36:44.786Z`. It exceeds the seven-day freshness
maximum and is expired; the precise age continues to increase.

The retained registry contains:

| Host | Retained records | Historical outcome |
| --- | ---: | --- |
| `a-11-oy.com` | 19 | 10 `REACHABLE`, 1 `REDIRECTED`, 8 `UNAVAILABLE` |
| `a11oy.net` | 6 | 4 documentation/metadata records `REACHABLE`; `/chat` and `/code` `UNAVAILABLE` with retained HTTP 404 observations |

These are historical route observations. They do not establish that either host
is currently up or down.

### Coverage gaps and contradictions

- **UNOBSERVED BEYOND THE BOUNDED HOMEPAGES:** no current authoritative
  DNS/CAA, certificate chain/expiry inventory, TLS-version policy sweep,
  route-wide status/body/redirect pass, CSP/security-header matrix,
  robots/sitemap agreement, social metadata, accessibility, or page-level
  functional sweep completed.
- **LOCAL:** A11oy build-info/readiness checks emphasize status and identity but
  do not comprehensively validate response-body semantics. A `200` alone can
  therefore preserve a false-green result.
- **RETAINED:** generic `/healthz` reported signer `ABSENT` while
  `/api/a11oy/healthz` reported `DSSE-LIVE`. The Series A control plane also
  reported `BLOCKED/github_inventory_unavailable`, and a GDW transition remained
  unsigned with an outbox pending. These contradictions are unresolved; the
  favorable endpoint must not be selected as the whole truth.
- **RETAINED:** deployment documents refer variously to Replit, Hetzner/nginx,
  and Hugging Face, while the current static/runtime split is not established.
  Actual routing, origin ownership, and failover topology are **UNKNOWN** until
  DNS, certificates, proxy configuration, and exact deployed revisions are read
  together.
- `a11oy.net` is represented as a static evidence/documentation host in retained
  evidence. A static health document must not be promoted as Python runtime
  health or execution authority.

### Required domain observation after network enforcement

1. Record authoritative DNS and CAA, resolved addresses, certificate chain,
   SANs, issuer, expiry, and TLS versions for apex and `www` hosts.
2. Probe every registry route without following redirects first; then record the
   bounded final redirect chain, status, content type, body digest, title, and
   expected semantic markers.
3. Validate security headers, cookie scope, CORS, canonical URLs, sitemap/robots
   agreement, social metadata, and noindex policy.
4. Reconcile generic health, API health, readiness, build-info, source revision,
   signer state, database state, and receipt-chain state. Any contradiction
   keeps the aggregate blocked.
5. Update `config/public-surfaces.json` only from the completed observation and
   rerun both structural and freshness gates.

## Python, frontend, and backend audit

### Local measurements

- **LOCAL:** a no-bytecode syntax compile passed for 442/442 tracked Python
  files at the audited pre-patch source and 443/443 after adding the kernel
  contract at `c65edd118`, including current successor `993057721`. This proves
  syntax compatibility with the audit interpreter only; it does not prove
  imports, dependency resolution, tests, runtime behavior, or support on every
  declared Python version.
- **LOCAL:** the audited pre-patch inventory contains 3,231 `.ts`, 1,169
  `.tsx`, and 442 `.py` files; the local successors contain 443 `.py` files
  because they add one focused security/truth test module. The A11oy browser
  artifact is React/Vite. This is a polyglot platform, not an all-Python
  product.
- **LOCAL:** 28 `pyproject.toml` files, eight `requirements*.txt` files, one
  `uv.lock` under `scripts/media/`, and 82 Python test-associated files were
  identified. There is no unified root Python quality gate.
- **LOCAL:** 14 test-bearing Python packages do not declare a test/dev extra.
  None of the eight requirements files uses exact `==` pins. One lockfile for a
  media script does not make the estate reproducible.
- **LOCAL/RETAINED:** version targets drift: this cloud environment uses Python
  3.12, CI includes 3.11/3.12 paths, while a retained deployed-product receipt
  reported Python 3.14.7. Compatibility is not inferred across these runtimes.
- **LOCAL:** `AGENTS.md` references `lib/a11oy-fabric-py`, but that path is
  absent. This is documentation/architecture drift, not a runnable Python
  substrate.

### Architecture decision

The browser remains React and TypeScript. Browsers execute HTML, CSS, and
JavaScript (or WebAssembly); moving the existing interface behind Python,
Pyodide, or a server-rendered demonstration would not make browser execution
Python-authoritative. It would instead discard the source-bound browser proof
and create a large interaction, accessibility, performance, and parity
regression surface. Node also remains necessary for the Vite build and browser
test toolchain even after backend authority moves.

A big-bang backend rewrite is also rejected. The target is a staged migration
of backend **authority** to Python, not a cosmetic Python proxy in front of
unchanged Node decisions. The following matrix is a **target architecture, not
the current state**:

| Responsibility | Target authority |
| --- | --- |
| Browser presentation, accessibility, responsive interaction, and local view state | React + TypeScript |
| Authentication/authorization decisions, policy, durable state, persistence, receipts, integrations, jobs, model/kernel orchestration, and health semantics | Python services |
| Protocol edge where a mature TypeScript SDK is operationally useful | A thin TypeScript adapter may translate transport only; it must not own policy, action approval, or durable state |
| Cross-language contract | A reviewed, implementation-bound OpenAPI 3.1 and JSON Schema source; generated TypeScript browser clients; contract and negative tests in both languages |
| Migration safety | Endpoint-family slices with shadow traffic, response/digest parity, telemetry, single-writer cutover, exact artifact identity, and a tested rollback |

### Current Node authority and migration risks

This checkout is not at the target boundary. At least eight workspace packages
have startable Node backend service or worker entry points:
`alloy-runtime-api`, `alloy-embedding-api`,
`alloy-ingestion-orchestrator`, `alloy-fabric-api`,
`alloy-fabric-ingest-control`, `substrate-mcp-gateway`,
`alloy-vector-worker`, and `alloy-rank-worker`. Shared TypeScript packages also
own workflow, policy, evidence, storage, and substrate behavior. No local or
remote evidence shows that these authorities have already moved to Python.

The highest-priority findings are controls to contain immediately and
requirements for their eventual Python replacements:

- **P1 — ingestion orchestration:**
  `apps/alloy-ingestion-orchestrator/src/server.ts` enables unrestricted
  `cors()` and mounts submit, list, read, cancel, and approval routes without an
  authentication or identity-to-tenant middleware. The handlers accept tenant
  identity from request data, while the default run, checkpoint, and data
  stores are in process. The router mounts `createRunsRouter()` at `/v1/runs`,
  but the child routes begin with `/runs` again; their executable paths
  therefore contain `/v1/runs/runs` while comments and returned status URLs
  advertise `/v1/runs`. Existing server integration tests cover health and
  telemetry, not these mutation paths. Restrict ingress and add fail-closed,
  tenant-bound authorization now; do not wait for a language port.
- **P1 — runtime decisions:** `apps/alloy-runtime-api` starts, resumes,
  approves, rejects, and cancels workflows and writes tenant memory. Its shared
  API key authenticates a caller, but the caller supplies `X-Tenant-Id`; the
  credential is not bound to that tenant. Default workflow and memory state is
  in process. This is current Node authority, not a Python-backed transport.
- **P1 — fabric policy and evidence:** `services/alloy-fabric-api` and
  `services/alloy-fabric-ingest-control` perform tenant enforcement, policy
  decisions, ingestion, evidence writes, checkpoints, and approval resolution.
  Their current default stores are in-memory or file-backed under `/tmp`, and
  control requests carry caller-provided tenant IDs. A Python replacement must
  add durable transactional state and identity-derived tenancy before cutover.
- **P1 — embedding admission:** when `AEF_API_KEY` is empty,
  `apps/alloy-embedding-api/src/middleware/auth.ts` accepts any non-empty Bearer
  token unless the separate bypass flag is set. Tenant and profile are then
  selected from headers or query parameters. Production must fail startup or
  fail closed on missing credentials and bind scope to authenticated identity.
- **P1 — worker credentials:** the Node vector and rank workers fall back to
  the literal `dev-s2s-secret`. Production must refuse to start without a
  separately provisioned service identity; copying this fallback into Python
  would reproduce the vulnerability rather than close it.

The existing Python worker is not yet a safe authority replacement.
`services/substrate-py-workers/src/worker/main.py` describes claims received
from the TypeScript engine, exposes `POST /claim` without an authentication
dependency, and returns HTTP `200` for stage-execution exceptions. The separate
reference worker explicitly says that the TypeScript journal, policy, and
evidence layers remain the source of truth. It can seed a migration only after
service authentication, tenant binding, idempotency, error semantics,
durability, rate/body limits, and negative tests are added.

The supposed canonical API boundary is also contradictory. The
`artifacts/api-server/README.md` calls that package the single canonical
Express backend, while its `package.json` calls it a historical stub; the
package has only two tracked TypeScript source files and no start, build, or
test script. `docs/architecture/api-spec.md` nevertheless attributes 140+
route files and 5,065 operations to it, while current CI boots
`apps/alloy-runtime-api`. Therefore the existing large OpenAPI document is a
declared catalogue, not proof of implemented routes, and must not be treated as
the migration contract until executable handlers and black-box route tests are
reconciled.

### Staged authority-first migration

1. Freeze new Node business authority. Inventory executable handlers and
   callers, establish one root Python lock/lint/type/test/security toolchain,
   and define a shared fail-closed identity and tenant-context dependency.
2. Port vector, rank, and embedding execution as a low-state proving slice,
   using the Python worker only after its admission controls are fixed. Require
   shadow response/digest, load, timeout, and backpressure parity. This proves
   the delivery pattern but does not by itself move governance authority.
3. Port ingestion runs and approvals to Python with durable PostgreSQL
   transactions, idempotency, actor/tenant binding, restart recovery, and
   negative authorization tests. Use one mutation writer during cutover so
   shadowing cannot duplicate actions.
4. Port runtime memory, workflows, Atelier continuity, fabric policy, and
   evidence endpoint families. Generate TypeScript browser clients only from
   the reconciled, implementation-bound contract.
5. Move substrate policy/state/action authority behind the Python boundary.
   The MCP TypeScript service may remain temporarily as a transport adapter,
   but it must call the authoritative Python service and own no independent
   approval, policy, or durable-state decision.
6. Remove each replaced Node listener only after exact-source and image-digest
   binding, old/new black-box parity, observed deployment/readback, zero Node
   authority traffic, and a tested rollback are recorded. Retain the Node
   frontend build and browser-test toolchain.

A Streamlit or Pyodide port, a Python pass-through proxy, successful syntax
compilation, or a static OpenAPI catalogue is not evidence that backend
authority migrated.

## Prepublication gates

Public operational promotion remains blocked until all of the following are
recorded against exact source identities:

1. Deploy current local kernel successor `99305772172270109f1023da6987a6ca32445847`
   (which contains authentication hardening `c65edd118`, truth-state milestone
   `4e633b084`, equality rejection `b0c6c6070`, and bounded Codex reads),
   configure high-entropy unequal admin
   and wake credentials, enforce authenticated tenant/role policy and data
   minimization for Codex reads, and close the durable
   rate/quota/retention requirements before any authenticated remote exercise
   or external promotion.
2. Publish the reviewed restricted-egress environment, then verify that its
   runtime network state is `enforced`, not merely present in a draft.
3. Bind authorized read-only GitHub and Hugging Face identities where private
   completeness is required. Do not turn unavailable secret values into ordinary
   variables.
4. Re-run complete paginated GitHub inventory, rulesets/branch protection,
   required checks, open pull requests, Actions, packages, and security alerts.
5. Re-run complete Hugging Face models/datasets/Spaces/Kernels/collections
   inventory; reconcile IDs and rights; validate exact publisher and deployment
   revisions without mutating assets.
6. Execute the DNS/TLS/HTTP/body/header/domain sweep above and reconcile every
   health/source/signing contradiction.
7. Re-run frozen dependency setup, Python and TypeScript gates, builds, browser
   proof, and source-bound artifact verification in the published environment.
8. Refresh the canonical registries and publish only the claims that the new
   receipts establish. Deployment, customer use, compliance, model quality, and
   production execution remain separate gates.

## Evidence locators

| Claim group | Dated source and locator | Reproduction / boundary |
| --- | --- | --- |
| Current GitHub repository metadata | 2026-10-06 aggregate receipt: `audit/evidence/github-org-metadata-summary-2026-10-06.json` | The receipt records both GET URLs, status, ETags, page hashes, cursor exhaustion, authority, and privacy boundary. `jq empty` validates it; raw private names are intentionally not committed. |
| Retained GitHub/PR inventory | 2026-09-29: `audit/P0_SERIES_A_SOURCE_ALIGNMENT_20260929.md:225-229` | Historical 130-repository/34-PR result only; do not substitute it for the current metadata receipt or current PR state. |
| Kernel vulnerability and remediation | Pre-patch `b758bcfbc177236876c524e27cb2e765c87e00d7`; current successor `99305772172270109f1023da6987a6ca32445847`; `audit/A11OY_KERNEL_MUTATION_HARDENING_PROOF_2026-10-05.md`; `.github/workflows/warm-flagships.yml`; `packages/szl-kernels/deploy/szl_kernels_organ.py` | Run the two Python test commands in the proof, the focused compile, YAML parse, and `git diff --check`. Hosted deployment remains unobserved. |
| Workflow/release governance | Local successors `30adc98bd8dc8203a89951ebbfe8830b17a3b39f` and `f2700966bfac32dc0adb18c50c5a87577df7866b`; `.github/workflows/repro-check.yml`, `trivy.yml`, `a11y.yml`, `build.yml`, `security.yml`, `dependency-review.yml`, `codeql.yml`, `npm-publish.yml`, `npm-public-publish.yml`, plus `.github/CODEOWNERS` | Focused contracts passed 5/5 and 10/10; YAML parse and source inspection establish repository controls only. Live required-check/ruleset and exact-head conclusions remain unobserved. |
| Hugging Face retained inventory | 2026-08-20: `audit/evidence/huggingface-public-catalog.snapshot.json`; 2026-09-29: `artifacts/SOURCE_OF_TRUTH.json` | `node tools/hf-catalog/catalog.mjs --probe-live --format json` exited 2 with `UNAVAILABLE/fetch_failed` on 2026-10-06; current inventory remains unknown. |
| Space readiness gate | Hard-coded 2026-08-30 registry in `payload_v11/tools/spaces_gate.py` | `PYTHONDONTWRITEBYTECODE=1 python payload_v11/tools/spaces_gate.py` exits 1 with 17 findings across seven surfaces/three flagships; this is not a live Space probe. |
| Dataset-rights claims | `payload_v11/CLAIMS_LEDGER.yaml:108-113,156-161` | The cited `payload_v11/agent_reports/be2_models_kernels.md` is absent, so the upstream evidence chain is broken; restrictions remain fail-closed. |
| Current bounded domain responses | 2026-10-06: `audit/evidence/domain-homepage-summary-2026-10-06.json` | `jq empty` validates the receipt. It records exact statuses, redirects, sizes, hashes, and semantic markers for four homepage transactions only. |
| Retained domain registry | `config/public-surfaces.json`, observed `2026-08-11T08:36:44.786Z` | Structural parse remains possible; the evidence exceeds its seven-day freshness limit. |
| Python/web boundary | Current local tree plus `AGENTS.md`; inventory commands recorded in this report | Syntax compile proves parseability only. React/TypeScript remains browser presentation; Python is the recommended authority-service boundary. |
| Workcell browser proof | `audit/A11OY_WORKCELL_PROOF_COVERAGE_HARDENING_PROOF_2026-10-05.md` and its source-bound JSON/PNG artifacts | Local Playwright evidence is `LOCAL_NON_AUTHORITATIVE`; it does not qualify hosted production. |

## Final claim boundary

The strongest defensible statement at this checkpoint is:

> The exact local Platform checkout has substantial source controls and a
> passing tracked-Python syntax sweep. Historical receipts describe broad
> GitHub and Hugging Face estates and previously observed domain routes, but
> a current cursor-complete GitHub repository-metadata inventory observed 140
> repositories, while deeper GitHub settings/checks, current Hugging Face
> completeness, domain behavior beyond the bounded homepage reads, and
> operational readiness remain unobserved.
> The unauthenticated local mutation paths were hardened at `c65edd118`,
> `4e633b084` makes unconnected kernels report work as unavailable,
> `b0c6c6070` fails closed when admin and wake token values are equal, and
> current successor `993057721` bounds Codex reads;
> local successors `30adc98b` and `f2700966` fail closed on several CI
> governance and CodeQL evidence gaps. Hosted enforcement is unobserved, and
> material governance,
> substrate-integration, publication, domain, dependency, durable rate, quota,
> and retention gaps remain open.

Anything stronger requires the postpublication observations and exact-source
receipts listed above.
