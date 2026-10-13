# SZL estate prepublish audit — 2026-10-05

**Audited repository:** `szl-holdings/platform`
**Audited pre-patch source:** `b758bcfbc177236876c524e27cb2e765c87e00d7`
**Audited pre-patch tree:** `ec9eb4859a3d4d97eb11f062a8cc3b52c42b0461`
**Authentication remediation source/tree:** `c65edd118dae25678b98307ee0f9f5bc85db7b7a` / `24b619d654f2dffed9d084d7cebdc7c54a5335d2`
**Truth-state milestone source/tree:** `4e633b08464afd00f4228b962821bc3f66c361e0` / `08090886ffe105f67a920b1c52e424a9cdffd65e`
**Current local kernel successor source/tree:** `99305772172270109f1023da6987a6ca32445847` / `d9fb20160c0fe8b18d4d21ab667060646771653d`
**Governance-gate successor source/tree:** `30adc98bd8dc8203a89951ebbfe8830b17a3b39f` / `1cabf1f15dff89f725fc0dda2f52877137bff832`
**Release-security successor source/tree:** `f2700966bfac32dc0adb18c50c5a87577df7866b` / `3d7802402d832817eb54814f1d0d1de7eeb0c87e`
**2026-10-07 frontier candidate boundary:** uncommitted multi-lane working tree
based on `150b166171cbd339acb287f7f5d37809c21774ee`; no exact release source/tree
identity exists until the candidate is frozen and committed
**Scope:** GitHub organization, Hugging Face organization, `a-11-oy.com`,
`a11oy.net`, and the Python/frontend/backend boundary
**Decision:** **HOLD public operational-readiness claims; conditionally proceed
with development-environment publication after review.**

This is a prepublication control report, not a deployment receipt. The managed
environment status reported a disabled/unknown network policy with no
configured outbound identity, but approved read-only calls produced narrow
current observations: native Git returned origin `HEAD`
`f2f8df6f89056e9104587674ccec0855dd5b177a`, and an authenticated GitHub
metadata read exhausted the organization-repository cursor. A separate
authenticated read observed the active Platform repository ruleset described
below. Those observations do not establish branch contents, hosted check
conclusions, organization-wide rule details, alerts, packages, or deployment.
A repository-controlled Hugging Face public-catalog snapshot at
`audit/evidence/huggingface-public-catalog.snapshot.json` records
`observedAt=2026-10-07T11:48:26.618Z`, its RFC Link pagination/completeness
rule, exact IDs, and counts of 47 models, 37 datasets, and 35 Spaces. That
snapshot does not establish collections, private assets, Kernels, runtime
behavior, publication authority, training rights, or readiness. Bounded
retained homepage probes observed `a-11-oy.com` returning an error response and
`a11oy.net` returning its proof registry. A read-only route/metadata sweep on
2026-10-07 completed but found seven live-contract drifts described below, so
both domains remain unqualified. All external calls cited by this report were read-only,
and no external mutation is used as audit evidence. The separate local-checkout
remediation is source-bound to the commits above and does not imply deployment.

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
| GitHub `szl-holdings` | **CURRENT METADATA + PLATFORM RULESET / HOLD** | The cursor-complete 2026-10-06 metadata receipt observed 140 unique repositories (128 public, 12 private); a read-only authenticated recount on 2026-10-07 matched those totals and the 111 active/29 archived split. An authenticated read also observed active Platform ruleset `22286649` and its five current required contexts. Hosted conclusions, organization-wide rule details, alerts, packages, and exact-head qualification remain unobserved; local workflow review found material release-integrity gaps. |
| Hugging Face `SZLHOLDINGS` | **DATED PUBLIC CATALOG SNAPSHOT / HOLD** | The repository-controlled `audit/evidence/huggingface-public-catalog.snapshot.json` records 47 models, 37 datasets, and 35 Spaces at the observation timestamp below, with exact IDs and its pagination/completeness rule. Collections, private completeness, Kernels, runtime behavior, publication authority, execution, quality, training rights, and readiness remain unobserved or unavailable. |
| `a-11-oy.com` | **CURRENT BOUNDED ROUTE CONTRACTS / HOLD** | A 2026-10-07 full bounded freshness sweep passed after reviewed contracts were aligned to the intentional same-origin `/killinchu` status page and `/command/` modeled page. Killinchu's separate build identity is source-bound, while readiness explicitly reports an EPHEMERAL process-memory canonical ledger with `production_ready=false`; route success is not aggregate production readiness. |
| `a11oy.net` | **CURRENT BOUNDED ROUTE CONTRACTS / HOLD** | The same full sweep validated the intentional HTTP 301 `/chat` and `/code` trailing-slash documentation gateways and the exact lowercase webmanifest identity. Passing these bounded transactions is not whole-site, application-runtime, or backend health. |
| Python and web architecture | **PARTIAL / MIGRATE BY CONTRACT** | A dated tracked-Python syntax sweep passed on the kernel successor, but the release candidate has since changed and the Python dependency/test/package boundary is still fragmented. The browser product is React/TypeScript and should not be cosmetically rewritten in Python. |

The catalog observation timestamp is `2026-10-07T11:48:26.618Z`; this retained
receipt is not a new live probe.

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
the source path `.github/workflows/warm-flagships.yml`
(lines 8–23).
Its `wake-receipt` job is excluded
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
  `packages/szl-kernels/deploy/szl_kernels_organ.py`
  (lines 126–144),
  identifies that
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

- **CURRENT AUTHENTICATED AGGREGATE RECHECK (2026-10-07):** A read-only,
  cursor-exhaustive GitHub API request again observed 140 repositories: 128
  public, 12 private, 111 active, and 29 archived. The newest repository
  `pushed_at` value in that response was `2026-10-07T11:49:58Z`. This aggregate
  recheck did not persist private names or replace the more detailed sanitized
  receipt below.
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
- **CURRENT AUTHENTICATED PLATFORM RULESET READ (2026-10-06):** Active ruleset
  `22286649`, `Protect main - solo-builder exact-head`, targets the default
  branch with no bypass actors. It requires pull requests and resolved review
  threads, sets `required_approving_review_count=0`, does not require approval
  of the last reviewable push, requires extra approval for unattributed
  changes, and permits squash merge only. It also requires signed commits and
  blocks branch deletion and non-fast-forward updates. Its five current status
  contexts are `Runtime Audit (audit:full)`, `Security Gate (blocking)`, `E2E
  Gate`, `severity-gate`, and `lockfiles / No lockfile references a
  Replit-internal registry host`. This is a settings observation, not evidence
  that any context passed for the current candidate. The candidate Grype and
  reproducibility contexts are not yet required.
- **CURRENT BLOCKED ORGANIZATION-RULE READ (2026-10-06):** The organization-wide
  rules detail request returned HTTP `403`; organization-level rules therefore
  remain **UNKNOWN**, not absent.
- **UNOBSERVED:** Current pull requests, Actions conclusions, packages,
  memberships, organization-wide rule details, and security-alert state were
  not cursor-completely read with the needed authority. Their current values
  remain **UNKNOWN**.

### Local governance findings

These are source/configuration findings in the Platform checkout. They do not
assert that the same bytes or settings are active across every organization
repository. Local successor `30adc98bd8dc8203a89951ebbfe8830b17a3b39f`
hardens reproducibility, accessibility aggregation, and the main build;
`f2700966bfac32dc0adb18c50c5a87577df7866b` hardens the Platform CodeQL
gate and gives the Trivy/Grype workflow an accurate filesystem/SCA identity.
The later candidate working tree additionally targets path-independent
Storybook output and fail-closed package-manager, license, SBOM, and Grype
admission. A prior local checkpoint passed 101/101 root pre-Turbo dependency,
governance, and security tests, including its then-current governance and
release-security suites. The working tree changed after that checkpoint, so
those totals are **RETAINED CANDIDATE HISTORY**, not final-candidate results.
Fresh exact-tree validation and hosted conclusions remain required.

| Priority | Finding | Required closure |
| --- | --- | --- |
| CURRENT PLATFORM RULE / HOSTED UNKNOWN | Active repository ruleset `22286649` currently requires five named contexts, pull requests, resolved review threads, squash-only merging, signed commits, and deletion/non-fast-forward protection with no bypass. It does not yet require the candidate Grype or reproducibility contexts, and no current-candidate hosted conclusion is claimed. Organization-wide rule details remain unavailable under HTTP `403`. | Observe green exact-head hosted Grype and reproducibility runs before adding their exact context names to the live ruleset; re-read and preserve the complete rule after mutation. Keep organization-wide settings `UNKNOWN` until an authorized read succeeds. |
| P1 | Release paths do not consistently require build, test, and vulnerability results before publication. Some release/deploy assertions are documentation rather than enforced code. | Introduce one fail-closed release admission workflow bound to the exact candidate SHA and artifact digest. |
| FROZEN LOCAL REPORT / HOSTED RUN PENDING | The dependency gate pins released fixes for prior findings and adds fail-closed correlation for local `node-forge` and `braces` patches. The frozen-manifest report generated at `2026-10-07T11:26:02.054Z` records 0 Critical, 2 High, 2 Moderate, and 0 Low findings across 2,006 dependencies; both High advisories are admitted only through digest- and behavior-bound, expiring patches. The detailed Moderate is `sprintf-js` GHSA-hp3w-g68c-fv3c, whose advisory has no patched version and whose npm latest remains vulnerable; pnpm reported the other Moderate only in aggregate. All findings with released compatible fixes were updated. This local artifact is not exact-commit or hosted evidence. | Replace each local patch with a released upstream fix as soon as one exists. Track a compatible upstream `sprintf-js` fix and retain the unsuppressed aggregate finding; do not force an unsafe override. The mitigation records expire 2026-11-05. Observe exact-head hosted pnpm and Grype gates before promotion. |
| FROZEN LOCAL SBOM / HOSTED BINDING PENDING | Candidate generator source fails closed on workspace/lock/snapshot/patch correlation and validates against vendored CycloneDX 1.4 schemas. The frozen-manifest `security/sbom-latest.json` contains 1,989 components and has SHA-256 `4ddcac69665a80ef9e7ebd53606ceb76c48fbc55b7d72bd09fd9a3b38736f198`; the identical content-addressed history file is retained. This is a mutable local pnpm artifact, not exact-commit evidence, and it does not cover Python dependencies. | Bind the exact SBOM bytes to the eventual immutable candidate commit and hosted release evidence. Generate resolved Python dependency inventories before promoting any Python service. Do not hand-edit or timestamp-refresh generated files. |
| SOURCE REMEDIATED / IMAGE BUILDS UNOBSERVED | The root `packageManager`, `engines`, and preinstall guard now require exact pnpm 10.26.1. Clean-clone policy rejects conflicting nested package-manager pins and dependency-mutating build/test/typecheck/codegen tasks. The devcontainer, CircleCI, post-merge bootstrap, and browser test servers use the pinned toolchain without mutable or swallowed install fallbacks. All 11 tracked Node 26 Dockerfiles that use pnpm now inherit a digest-pinned package-manager base that installs and verifies pnpm 10.26.1; the source contract discovers the complete set dynamically. | Preserve the single root package-manager authority. Build and scan each container on a Docker-capable runner before promotion; the local daemon socket was unavailable, so source validation is not an image-build receipt. |
| RETAINED LOCAL CHECKPOINT / HOSTED UNKNOWN | A predecessor candidate extended the `30adc98b` same-SHA, two-clean-checkout comparison: Storybook omitted its optional timestamp-bearing `project.json`, and an exact `@storybook/core@8.6.18` patch disabled checkout-path-sensitive identifier minification while retaining syntax and whitespace minification. That local two-clean-tree replay produced 2,807 output entries in each tree and byte-identical manifest files with SHA-256 `e9d528f016813679549116fa7a55ac6462c280a8884407914f4dc21728c4392d`. Later tree changes require a new replay. | Rerun on the frozen candidate, observe a green exact-head hosted run, and make its check required in the live ruleset only after that success; the retained local replay is not a hosted receipt. |
| PARTIAL | At `f2700966`, the Platform PR CodeQL gate waits for processing, queries the exact synthetic merge ref, exhausts REST pagination, validates page/alert/ref/tool shape, rejects duplicate or malformed evidence, and blocks high/critical alerts. The authenticated ruleset receipt already lists `severity-gate` as required. Organization-wide alert completeness and inaccessible repositories remain unobserved. | Observe the already-required `severity-gate` on the exact candidate head, and add cursor-complete per-repository collection that preserves inaccessible state as `UNKNOWN`; do not describe this existing context as awaiting addition to the ruleset. |
| P1 | GitHub package publication is non-atomic and its private-package boundary is not handled as a recoverable transaction. | Stage, attest, verify readback, then promote; retain rollback and package-visibility receipts. |
| P1 | The accurately renamed Trivy/Grype workflow scans repository files and dependencies, not any of the 15 container build definitions or a promoted image digest. | Build each promoted image, scan the immutable digest before push/promotion, and bind vulnerability evidence and attestation to that digest. |
| SOURCE REMEDIATED / HOSTED UNKNOWN | At `30adc98b`, the aggregate accessibility gate accepts only exact `success`; failed, cancelled, skipped, and unknown matrix results fail. | Observe a green exact-head hosted run and require the aggregate context in the live ruleset. |
| PARTIAL | At `30adc98b`, the main build covers pull requests, performs a frozen install, and invokes the canonical full workspace build instead of six filtered frontends. Generated-file and promoted-artifact admission remain separate. | Observe a green exact-head hosted run, bind generated-file checks and every promoted artifact to release admission, and require the context in the live ruleset. |
| CANDIDATE SOURCE REMEDIATED / HOSTED UNKNOWN | The required `Security Gate (blocking)` now depends on a license-report job that writes a run-scoped failure preflight, runs negative contracts, and blocks on parse errors or any REVIEW/CHECK package whose exact package, version, license string, classification, allow decision, and unexpired review are absent from `security/license-policy.json`. The frozen-manifest local report generated at `2026-10-07T11:26:18.409Z` passed for 1,726 unique package/version pairs: 11 REVIEW and 6 CHECK findings matched 17 exact reviewed admissions from an 18-entry registry, with 0 parse errors and 0 blocking violations. One registry entry is currently unused; it grants no wildcard admission. | Review every time-bounded admission before expiry, preserve required notices/source-offer or account conditions, and observe the exact-head hosted `Security Gate (blocking)` conclusion. This pnpm-only report does not cover Python dependencies and is engineering policy evidence, not legal advice or a blanket license-family approval. |
| P2 | An API-specific security job is absent. | Add API schema, authn/authz, input-boundary, and dependency tests tied to the promoted API artifact. |
| P2 | CODEOWNERS contains overlapping general and specific patterns whose effective precedence needs review; current independent-approver capacity was not observed. | Verify effective ownership against live rulesets and document an exception lane only if current staffing evidence requires one, while preserving checks, signatures, linear history, and conversation resolution. |
| P2 | GitHub-facing documentation contains stale inventory and workflow descriptions. | Regenerate it only from a successful, current, paginated read and date the receipt. |

### Controls worth preserving

**LOCAL:** all 47 current workflow YAML files parsed; every workflow `uses:`
reference was pinned to a full commit SHA; workflows
define top-level permissions; and Dependabot covers GitHub Actions, npm, pip,
and Docker. The gitleaks download archive is SHA-checked while
`.gitleaks.toml` is selected but not separately checksummed. These are useful
source controls. They do not substitute for green exact-head runs, the missing
Grype/reproducibility requirements, organization-wide rule visibility, or
complete security-alert visibility.

## Hugging Face organization audit

### Dated public-catalog snapshot evidence

- **DATED SNAPSHOT EVIDENCE (2026-10-07T11:48:26.618Z):** The tracked
  `audit/evidence/huggingface-public-catalog.snapshot.json` records the public
  API base, RFC Link cursor strategy and completeness rule, one completed page
  per asset type, and exact IDs for 47 models, 37 datasets, and 35 Spaces. This
  report relies on that repository-controlled receipt; it does not upgrade an
  uncommitted terminal probe transcript into evidence.
- **HISTORICAL / SUPERSEDED:** The prior committed 2026-08-20 snapshot and the
  generated 2026-09-29 `artifacts/SOURCE_OF_TRUTH.json` recorded conflicting
  model, dataset, and Space counts. Those values remain historical rather than
  current; the artifact's canonical metric objects now align to the current
  snapshot.
- **STILL UNAVAILABLE:** The committed snapshot contains no collections or
  private-asset inventory. Collections, private-asset completeness, first-class
  Kernel inventory, runtime behavior, publication authority, training rights,
  and readiness are therefore **UNKNOWN / UNAVAILABLE** from this receipt.

The snapshot resolves the repository's public model, dataset, and Space count
conflict only at its recorded observation time. Future inventories must
continue to preserve exact IDs, cursor completion, observation time, and the
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

The current public catalog proves enumerated public metadata presence at the
recorded observation time only. It does not prove that a model has weights, a
dataset has usable training rights, a Space responds correctly, a Kernel
exists or executes, a signature verifies, or a publisher is trusted.

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

### Current bounded registry sweep

**CURRENT PUBLIC READ (2026-10-07):** the first bounded sweep failed closed on
seven differences from the expired registry. Source review established that all
seven were intentional external changes rather than transient successes: two
static trailing-slash gateways, the lowercase webmanifest identity, two
same-origin A11oy pages, the new Killinchu source-binding receipt, and the new
ephemeral-ledger readiness envelope. The expected contracts were updated only
after that source/attestation review.

`NODE_USE_ENV_PROXY=1 pnpm surfaces:freshness` then completed a full sweep of all
29 compile-time-approved targets and passed. The Node proxy flag is an execution-
environment requirement, not a relaxed check. The gate still enforces exact
destinations, the two HTTP 301 hops, metadata bodies, Killinchu source identity,
and the explicit non-production ledger state.

### Registry state

**CURRENT PUBLIC READ:** `config/public-surfaces.json` records
`observed_at=2026-10-07T12:31:38.131Z`; the complete freshness gate passed after
that observation and the deterministic artifact was regenerated.

The retained registry contains:

| Host | Records | Current bounded outcome |
| --- | ---: | --- |
| `a-11-oy.com` | 19 | 12 `REACHABLE`, 7 intentionally `UNAVAILABLE` |
| `a11oy.net` | 6 | 4 direct documentation/metadata records `REACHABLE`, 2 approved HTTP 301 gateways `REDIRECTED` |
| `szlholdings-a11oy.hf.space` | 2 | 2 exact approved API routes `REACHABLE` |
| `szlholdings-killinchu.hf.space` | 2 | 2 exact approved API routes `REACHABLE`; readiness explicitly remains non-production |

These are bounded response observations, not continuous uptime, customer use,
feature completeness, or whole-host health.

### Coverage gaps and contradictions

- **PARTIALLY OBSERVED:** the bounded registry route/body/redirect sweep above
  passed its reviewed contracts. No current authoritative DNS/CAA,
  certificate chain/expiry inventory, TLS-version policy sweep,
  CSP/security-header matrix, social metadata, accessibility, or page-level
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
5. Update the public-route registry only from the completed observation and
   rerun both structural and freshness gates.

The registry path for that final step is `config/public-surfaces.json`.

## Python, frontend, and backend audit

### Local measurements

- **RETAINED LOCAL CHECKPOINT:** a no-bytecode syntax compile passed for 442/442 tracked Python
  files at the audited pre-patch source and 443/443 after adding the kernel
  contract at `c65edd118`, including kernel successor `993057721`. This proves
  syntax compatibility with the audit interpreter only; it does not prove
  imports, dependency resolution, tests, runtime behavior, or support on every
  declared Python version. Later Python edits require a fresh final-candidate
  syntax and dependency-backed test run.
- **RETAINED INVENTORY:** the audited pre-patch inventory contains 3,231 `.ts`, 1,169
  `.tsx`, and 442 `.py` files; the local successors contain 443 `.py` files
  because they add one focused security/truth test module. The A11oy browser
  artifact is React/Vite. This is a polyglot platform, not an all-Python
  product.
- **RETAINED INVENTORY:** 28 `pyproject.toml` files, eight `requirements*.txt` files, one
  `uv.lock` under `scripts/media/`, and 82 Python test-associated files were
  identified. Later edits may change those counts; there is still no unified
  root Python lock/lint/type/test/security gate.
- **RETAINED INVENTORY:** 14 test-bearing Python packages do not declare a test/dev extra.
  None of the eight requirements files uses exact `==` pins. One lockfile for a
  media script does not make the estate reproducible. The current substrate
  worker, inference, and Lyte metrics services remain a release-packaging
  **HOLD** until exact dependency graphs and reproducible builds are proved.
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

The highest-priority source findings were addressed in the uncommitted
2026-10-07 candidate working tree based on `150b16617`; those edits are not an
immutable release receipt and hosted behavior remains unknown:

- **CANDIDATE SOURCE REMEDIATED / DURABILITY HOLD — ingestion orchestration:**
  production now requires a bearer credential bound to one configured tenant
  and a configured actor/role principal; mutation routes enforce that tenant,
  approval actions require operator/admin authority, CORS is allowlisted, and
  the duplicated `/v1/runs/runs` mount is corrected. Run/checkpoint/data stores
  remain process-local, and approval-inbox resolution plus engine resume is not
  one durable cross-store transaction. Restart recovery, idempotency, and
  deployed negative-authorization evidence remain open.
- **CANDIDATE SOURCE REMEDIATED / DURABILITY HOLD — runtime decisions:**
  production now requires `ALLOY_API_KEY` and `ALLOY_API_TENANT_ID`, compares
  the credential in constant time, and rejects a caller-selected tenant that
  differs from the credential binding. Workflow and memory defaults remain
  process-local. This is still Node authority and not deployment evidence.
- **CANDIDATE SOURCE REMEDIATED / DURABILITY HOLD — fabric policy and
  evidence:** `services/alloy-fabric-api` now requires a nonblank bearer key,
  requires a credential tenant in production, uses constant-time token
  comparison, and rejects header/body/credential tenant mismatches before the
  routed operation. Its stores and the adjacent ingest-control authority still
  require durable transactional and restart evidence.
- **CANDIDATE SOURCE REMEDIATED / MODEL + HOSTED HOLD — embedding and
  reranking:** the embedding API now fails closed without its production key
  and tenant binding, applies constant-time bearer comparison, and rejects
  header/query/body tenant mismatches. Production embedding and reranking
  configuration also requires qualified immutable model/artifact evidence and
  readiness performs inference-contract probes. These controls do not prove a
  real model deployment, model quality, latency, capacity, or current hosted
  readiness.
- **CANDIDATE SOURCE REMEDIATED / FINAL NEGATIVE TESTS PENDING — worker
  credentials:** vector and rank workers no longer contain the literal
  `dev-s2s-secret` fallback and refuse to start without `AEF_S2S_SECRET`.
  Exact-candidate negative tests and hosted secret bindings remain required.

The Python worker is also improved but is not a safe production authority yet.
Candidate source authenticates `POST /claim`, binds its credential to one
production tenant, rejects header/body tenant mismatches before acquiring a
slot, and returns HTTP `500` for stage-execution exceptions. Its development
hash/lexical model routes return `503` in production and expose only
server-owned development identities. However, dependency ranges remain
unlocked, dependency-backed pytest was unavailable in this environment, state
and completed-claim deduplication are process-local. Candidate caller and proxy
source now send `POST /claim` at most once and disable automatic cross-upstream
retry because a lost response is ambiguous. That fail-closed boundary avoids
one known duplicate-execution path, but it provides neither result recovery nor
duplicate-safe manual replay. The autoscaling policy emits recommendations in
source but no coordinator invokes it to change replica count. Reproducible
packaging, durable idempotency, safe replay semantics, and observed deployment
remain **HOLD**.

The legacy API documentation is also contradictory. Current package metadata
is definitive for execution: `artifacts/api-server` is a historical
compatibility stub with only two tracked TypeScript source files, one narrow
route export, and no start, build, or test script. Its README's claim that it is
the single canonical Express backend is stale. The current startable Express
implementations in `apps/*` are `alloy-runtime-api`, `alloy-embedding-api`, and
`alloy-ingestion-orchestrator`; their source presence does not prove deployment
or make any one of them whole-platform authority. `docs/architecture/api-spec.md` nevertheless attributes 140+
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

1. Freeze the complete release candidate at one exact commit, regenerate the
   lock-derived vulnerability report, CycloneDX SBOM, API catalogue, and both
   source-of-truth registries from that tree, and require every validator plus
   the full typecheck/test/build/runtime suite to pass without ignored errors.
2. Deploy kernel successor `99305772172270109f1023da6987a6ca32445847`
   (which contains authentication hardening `c65edd118`, truth-state milestone
   `4e633b084`, equality rejection `b0c6c6070`, and bounded Codex reads),
   configure high-entropy unequal admin
   and wake credentials, enforce authenticated tenant/role policy and data
   minimization for Codex reads, and close the durable
   rate/quota/retention requirements before any authenticated remote exercise
   or external promotion.
3. Publish the reviewed restricted-egress environment, then verify that its
   runtime network state is `enforced`, not merely present in a draft.
4. Bind authorized read-only GitHub and Hugging Face identities where private
   completeness is required. Do not turn unavailable secret values into ordinary
   variables.
5. Re-read Platform ruleset `22286649` at promotion time, record the current
   candidate's exact-head Actions conclusions, and complete the open-pull-
   request, package, security-alert, and organization-wide rule/settings reads
   that remain unavailable or incomplete.
6. Refresh the cursor-complete public Hugging Face catalog at promotion time;
   with appropriate read authority, extend it to private assets, collections,
   and first-class Kernels. Reconcile IDs and rights, and validate exact
   publisher and deployment revisions without mutating assets.
7. Execute the DNS/TLS/HTTP/body/header/domain sweep above and reconcile every
   health/source/signing contradiction.
8. Re-run frozen dependency setup, Python and TypeScript gates, builds, browser
   proof, and source-bound artifact verification in the published environment.
9. Refresh the canonical registries and publish only the claims that the new
   receipts establish. Deployment, customer use, compliance, model quality, and
   production execution remain separate gates.

## Evidence locators

| Claim group | Dated source and locator | Reproduction / boundary |
| --- | --- | --- |
| Current GitHub repository metadata | 2026-10-06 aggregate receipt: `audit/evidence/github-org-metadata-summary-2026-10-06.json` | The receipt records both GET URLs, status, ETags, page hashes, cursor exhaustion, authority, and privacy boundary. `jq empty` validates it; raw private names are intentionally not committed. |
| Retained GitHub/PR inventory | 2026-09-29: `audit/P0_SERIES_A_SOURCE_ALIGNMENT_20260929.md:225-229` | Historical 130-repository/34-PR result only; do not substitute it for the current metadata receipt or current PR state. |
| Kernel vulnerability and remediation | Pre-patch `b758bcfbc177236876c524e27cb2e765c87e00d7`; current successor `99305772172270109f1023da6987a6ca32445847`; `audit/A11OY_KERNEL_MUTATION_HARDENING_PROOF_2026-10-05.md`; `.github/workflows/warm-flagships.yml`; `packages/szl-kernels/deploy/szl_kernels_organ.py` | Run the two Python test commands in the proof, the focused compile, YAML parse, and `git diff --check`. Hosted deployment remains unobserved. |
| Platform repository rules | `audit/evidence/github-platform-ruleset-summary-2026-10-06.json`; authenticated GitHub API read on 2026-10-06 of ruleset `22286649`, `Protect main - solo-builder exact-head` | The active default-branch rule has no bypass; requires pull requests, resolved review threads, extra approval for unattributed changes, signed commits, and deletion/non-fast-forward protection; permits squash only; requires zero approving reviews and not last-push approval; and names five required contexts. The organization-wide detail read returned `403`. No hosted conclusion is inferred from settings. |
| Workflow/release governance | Local successors `30adc98bd8dc8203a89951ebbfe8830b17a3b39f` and `f2700966bfac32dc0adb18c50c5a87577df7866b`; `.github/workflows/repro-check.yml`, `trivy.yml`, `a11y.yml`, `build.yml`, `security.yml`, `dependency-review.yml`, `codeql.yml`, `npm-publish.yml`, `npm-public-publish.yml`, plus `.github/CODEOWNERS` | A prior candidate checkpoint passed its root pre-Turbo dependency, governance, and security phase. Later working-tree changes require a fresh exact-candidate run. YAML/source inspection establishes repository controls only; current-candidate hosted conclusions remain unobserved. |
| Reproducible Storybook output | `.github/workflows/repro-check.yml`; `packages/storybook/.storybook/main.ts`; `patches/@storybook__core@8.6.18.patch`; `pnpm-workspace.yaml`; `pnpm-lock.yaml`; `scripts/ci/governance-workflows.test.mjs` | The local two-clean-tree replay produced 2,807 entries in each identical manifest; each manifest's SHA-256 was `e9d528f016813679549116fa7a55ac6462c280a8884407914f4dc21728c4392d`. The 9/9 governance contract validates the exact patch and configuration. Hosted reproducibility remains unobserved and its context is not currently required. |
| Dependency vulnerability gate | `.github/workflows/security.yml`; `.github/workflows/trivy.yml`; `.grype.yaml`; `security/vulnerability-mitigations.json`; `patches/node-forge@1.4.0.patch`; `patches/braces@3.0.3.patch`; `scripts/qa/dependency-patches.test.mjs`; `scripts/qa/generate-vuln-report.js`; `scripts/qa/generate-vuln-report.test.js`; `scripts/qa/gate-grype-report.mjs`; `scripts/qa/gate-grype-report.test.mjs`; `scripts/qa/write-vuln-preflight-report.mjs`; `security/vuln-report.md` | The frozen-manifest `2026-10-07T11:26:02.054Z` report records 0 Critical, 2 High (both exact local-patch mitigated), 2 Moderate, and 0 Low across 2,006 dependencies. The detailed Moderate is an unpatched-upstream `sprintf-js` advisory and one Moderate is aggregate-only. Patch SHA-256 values are `de8829eac6e09806b4b749a7221e7a2a62e6d88c796d38880d0f61bb2eb035ec` for `node-forge` and `c056b5c1123a999cfcaa5ad56c70e69a1120e186c410ee091a1f86e941411cf9` for `braces`. Candidate source defines a derived fail-closed Grype gate, but no current local raw Grype report or database provenance exists. Exact-commit and hosted execution remain required; regenerate if the dependency graph changes. |
| SBOM patch provenance | `scripts/qa/generate-sbom.js`; `scripts/qa/generate-sbom.test.mjs`; `pnpm-workspace.yaml`; `pnpm-lock.yaml`; `security/schemas/cyclonedx/`; `security/sbom-latest.json`; `security/sbom-history/sbom-4ddcac69665a80ef9e7ebd53606ceb76c48fbc55b7d72bd09fd9a3b38736f198.json` | The generator/tests cover fail-closed workspace/lock/snapshot/on-disk patch correlation, official schema conformance, ordering, scoped npm PURLs, stable content identity, and idempotent history. The frozen-manifest local artifact contains 1,989 components and has SHA-256 `4ddcac69665a80ef9e7ebd53606ceb76c48fbc55b7d72bd09fd9a3b38736f198`; latest and history are byte-identical. It remains an uncommitted pnpm inventory, does not cover Python dependencies, and requires exact-head hosted binding before promotion. Regenerate if the dependency graph changes. |
| Hugging Face public catalog | 2026-10-07: `audit/evidence/huggingface-public-catalog.snapshot.json`; reconciled metrics: `artifacts/SOURCE_OF_TRUTH.json` | The tracked snapshot records exact IDs and counts of 47 models, 37 datasets, and 35 Spaces plus its RFC Link pagination/completeness rule. Collections are not included; private completeness, Kernels, runtime behavior, rights, and readiness remain unestablished. |
| Space readiness gate | Hard-coded 2026-08-30 registry in `payload_v11/tools/spaces_gate.py` | `PYTHONDONTWRITEBYTECODE=1 python payload_v11/tools/spaces_gate.py` exits 1 with 17 findings across seven surfaces/three flagships; this is not a live Space probe. |
| Dataset-rights claims | `payload_v11/CLAIMS_LEDGER.yaml:108-113,156-161` | The cited `payload_v11/agent_reports/be2_models_kernels.md` is absent, so the upstream evidence chain is broken; restrictions remain fail-closed. |
| Current bounded domain responses | 2026-10-06: `audit/evidence/domain-homepage-summary-2026-10-06.json` | `jq empty` validates the receipt. It records exact statuses, redirects, sizes, hashes, and semantic markers for four homepage transactions only. |
| Current bounded domain registry | `config/public-surfaces.json`, observed `2026-10-07T12:31:38.131Z`; deterministic `artifacts/PUBLIC_SURFACES.json` | The full 29-target freshness gate passed. This establishes only the encoded status/redirect/body contracts and preserves Killinchu's explicit non-production ledger state. |
| Python/web boundary | Audited source snapshots plus the 2026-10-07 candidate working tree and `AGENTS.md` | Retained syntax compilation proves parseability only. React/TypeScript remains browser presentation; Python is the recommended authority-service boundary. Current Python dependency-backed tests, reproducible packaging, and deployment remain incomplete. |
| Workcell browser proof | `audit/A11OY_WORKCELL_PROOF_COVERAGE_HARDENING_PROOF_2026-10-05.md` and its source-bound JSON/PNG artifacts | Local Playwright evidence is `LOCAL_NON_AUTHORITATIVE`; it does not qualify hosted production. |

## Final claim boundary

The strongest defensible statement at this checkpoint is:

> The Platform candidate has substantial source controls, and a retained exact
> predecessor has a passing tracked-Python syntax sweep. The later working tree
> is not yet an immutable or fully validated release candidate. Historical receipts describe broad
> GitHub and Hugging Face estates, while the current bounded domain registry
> passed its 29 approved response contracts; separately,
> a current cursor-complete GitHub repository-metadata inventory observed 140
> repositories, and an authenticated read observed the active Platform
> repository ruleset and its five current required contexts. The dated,
> repository-controlled public Hugging Face snapshot records 47
> models, 37 datasets, and 35 Spaces at its observation time.
> Current-candidate hosted conclusions, organization-wide rule details, broader
> GitHub settings, Hugging Face collections/private completeness/Kernels/runtime
> readiness, domain behavior beyond the bounded registry reads, and operational
> readiness remain unobserved.
> The unauthenticated local mutation paths were hardened at `c65edd118`,
> `4e633b084` makes unconnected kernels report work as unavailable,
> `b0c6c6070` fails closed when admin and wake token values are equal, and
> current successor `993057721` bounds Codex reads;
> local successors `30adc98b` and `f2700966` fail closed on several CI
> governance and CodeQL evidence gaps. Current ruleset configuration is
> observed, but hosted check success is unobserved, and material governance,
> substrate-integration, publication, domain, dependency/reproducible Python
> packaging, durable idempotency, safe retry, rate, quota, and retention gaps
> remain open.

Anything stronger requires the postpublication observations and exact-source
receipts listed above.
