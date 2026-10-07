# A11oy frontier release hardening — candidate proof packet

**workcell_id:** `A11OY-FRONTIER-RELEASE-20261006`
**status:** **CANDIDATE / HOLD — not release or deployment authority**
**agent:** Codex multi-agent workcell
**recorded_at:** 2026-10-07
**recorded_by:** audit-and-truth lane; final release evidence must be rebound by
the release owner after the candidate is committed
**proof_level:** 2 (candidate evidence); Level 5 release proof **not achieved**

## Objective

Harden the Platform candidate across authentication, tenant isolation, runtime
packaging, model provenance/readiness, dependency evidence, CI governance, and
cloud onboarding; then test, publish the branch through normal protected
GitHub flow, and preserve an evidence-bounded account of what remains.

This packet does not authorize or claim a live product deployment. Repository
promotion, cloud-environment publication, model/Space publication, domain
changes, and public operational readiness are separate transactions.

## Plan summary

1. Close fail-open runtime, authentication, tenant, readiness, and packaging
   paths in the source candidate.
2. Make release/security workflows fail closed and bind them to exact candidate
   evidence.
3. Stabilize manifests and the lockfile; regenerate the vulnerability report,
   SBOM, API catalogue, and truth registries without hand-editing generated
   metrics.
4. Run full TypeScript/Python/package/runtime/build/documentation validation.
5. Freeze one exact commit, push without rewriting history, observe every
   required check, and preserve the ruleset readback.
6. Update the managed cloud draft to the exact admitted revision and submit it
   for user review; do not represent a draft as published runtime state.

## Candidate identity

| Field | Value |
| --- | --- |
| Working-tree base | `150b166171cbd339acb287f7f5d37809c21774ee` |
| Exact release commit | **UNAVAILABLE — working tree not yet committed** |
| Exact release tree | **UNAVAILABLE** |
| Target remote branch | `codex/a11oy-frontier-20261006` |
| Pull request | `szl-holdings/platform#899` |
| Live deployment identity | **UNOBSERVED / HOLD** |

Any test run before the exact release commit exists is a candidate checkpoint,
not final exact-head evidence. This packet must be amended with the immutable
commit/tree and hosted check URLs before its proof level can increase.

## Candidate patch summary

The working tree contains candidate changes across these bounded areas:

- exact pnpm/bootstrap/clean-clone and compiled/deployable package contracts;
- fail-closed API/gateway/worker authentication and credential-to-tenant
  binding, including negative cross-tenant paths;
- AEF ingest/search/eval integration, with durable retry/idempotency still held;
- embedding and reranking model identity, immutable revision/artifact evidence,
  promotion-state admission, and inference-backed readiness;
- Python worker/inference/metrics boundaries, while Python dependency locking
  and reproducible packaging remain held;
- required CI/E2E/security/license/SBOM/Grype/reproducibility source gates;
- artifact build/serve/accessibility assertions; and
- public-estate inventories and documentation claim boundaries;
- an A11oy route-wide candidate/demo notice, an exact 24-name connector
  catalogue boundary, and a focused deep-link E2E contract; and
- competitor-informed methodology recorded as original synthesis with all UI
  comparisons, scores, traces, and scenarios treated as hypothetical fixtures.

The browser surfaces remain React/TypeScript. The candidate does **not** claim
an all-Python frontend or completed migration of backend authority to Python.

## Test results recorded so far

| Evidence | Result | Boundary |
| --- | --- | --- |
| `pnpm install --offline --frozen-lockfile` | PASS (delegated toolchain lane) | Candidate checkpoint; tree continued changing |
| `pnpm run verify:clean-clone` | PASS, 51/51 (delegated toolchain lane) | Candidate checkpoint; not final exact-head proof |
| JavaScript syntax and `git diff --check` | PASS (delegated toolchain lane) | Candidate checkpoint |
| `docker compose --env-file .env -f ops/local/docker-compose.yml config --quiet` | PASS (delegated release lane, required values supplied) | Source/configuration closure only; images and containers were not exercised |
| `node --experimental-vm-modules scripts/docs/generate-api-catalogue.js --check` | PASS | No generated catalogue drift at this checkpoint |
| `node --experimental-vm-modules scripts/docs/check-docs-sync.js` | PASS with a diagnostic about absent legacy GraphQL path | Exit 0; not a runtime check |
| `corepack pnpm run docs:claims-check` | PASS, 26 claims | Rerun after the truth edits; only the validator's enumerated claims |
| `node scripts/audit/validate-overclaim-ledger.js` | PASS | Ledger binding only |
| `node tools/hf-catalog/catalog.mjs --check` | PASS: 47 models, 37 datasets, 35 Spaces | Structural validation of the `2026-10-07T11:48:26.618Z` public snapshot; no live/private/runtime claim |
| `security/vuln-report.md` generated checkpoint | PASS at `2026-10-07T11:26:02.054Z`: 0 Critical, 2 High (both exact local-patch mitigated), 2 Moderate, 0 Low | Frozen-manifest local artifact; detailed `sprintf-js` Moderate has no patched upstream version, one Moderate is aggregate-only, exact-head hosted runs remain unobserved |
| `security/license-report.md` generated checkpoint | PASS at `2026-10-07T11:26:18.409Z`: 1,726 unique package/version pairs, 11 REVIEW, 6 CHECK, 17 exact admissions, 0 parse errors, 0 violations | Engineering-policy evidence only; exact-head hosted gate remains unobserved |
| `security/sbom-latest.json` generated checkpoint | OBSERVED: 1,989 components; SHA-256 `4ddcac69665a80ef9e7ebd53606ceb76c48fbc55b7d72bd09fd9a3b38736f198` | Inventory-only frozen-manifest local artifact; exact-head schema/provenance rerun and hosted binding remain pending |
| `node scripts/audit/validate-source-of-truth.js` | **FAIL, 3 drift checks** | `2026-10-07T11:35:16.688Z`: registry 45 API route files vs tree 44; registry 315 handlers vs tree 332; registry 245 env vars vs tree 246 |
| A11oy connector-catalogue source audit | OBSERVED: 24 entries and 24 unique names | Static source shape only; no connector was configured, authorized, called, or admitted |
| A11oy route source audit | OBSERVED: six reviewed route concepts plus a publication-HOLD catch-all under the global candidate banner | Static React-tree inspection only; host rewrites and browser rendering remain unproved |
| `corepack pnpm --filter @workspace/a11oy build` | PASS: Vite 8.0.16, 1,159 modules transformed, nine JavaScript assets, zero source maps | Mutable 2026-10-07 checkpoint; exact candidate commit/tree do not yet exist |
| `corepack pnpm --filter @workspace/a11oy typecheck` | PASS | A11oy package scope on the mutable candidate; exact-head rerun pending |
| Rebuilt A11oy asset inventory | OBSERVED: six reviewed page chunks plus entry, proxy, and UI chunks; named excluded page chunks and `complianceFabric` absent | Local output inspection only; no hosted asset or exact-head digest is claimed |
| `tests/e2e/a11oy.spec.ts` | PASS, 16/16 in 13.118s (root release lane, 2026-10-07 11:29:19 UTC, `localhost:4111`) | Final six-route local build; mutable candidate checkpoint, not exact-head or hosted evidence |
| Follow-up root-mount A11oy E2E | PASS, 16/16 in 12.2s (audit lane, 2026-10-07 11:42 UTC, `localhost:4112`) | Current mutable rebuild with `/` base and system Chromium; still not exact-head or hosted evidence |
| Non-root `/a11oy` base-path E2E | PASS, 16/16 in 11.0s (`localhost:4113`, 2026-10-07 11:45 UTC) | Assertion now binds the full mounted request path; mutable local receipt only, so exact-head hosted coverage remains required |
| Local homepage screenshot | OBSERVED: `audit/evidence/a11oy-home-wcag-2026-10-07.png`, SHA-256 `cc38fbd129c93dc9f401173dcaf4d18beb1caa62a66b14e158b3fbce66f2279d`, 1,637,749 bytes | `LOCAL_NON_AUTHORITATIVE`; captured from dirty source HEAD, not exact-head or hosted evidence |
| Overlapping audit-lane Playwright attempt | **EXCLUDED** | Began against `localhost:4110` while shared `dist` was being replaced and was intentionally interrupted; it is not evidence for or against the final build |
| Full `pnpm typecheck`, `pnpm test`, forced build, compiled/service runtime, and Python dependency-backed tests | **NOT YET BOUND TO FINAL TREE** | Required before commit/promotion |
| Exact-head hosted required checks | **UNOBSERVED** | Required before merge |

Focused service/package tests reported by implementation lanes before this
packet are useful debugging evidence, but the tree changed after several runs.
They must be rerun and summarized against the exact candidate rather than
copied here as final totals.

## Screenshot references

The current mutable local homepage capture is
`audit/evidence/a11oy-home-wcag-2026-10-07.png`, recorded at
`2026-10-07T11:37:18.923Z` from `http://127.0.0.1:4111/` with a 1440 × 900
full-page viewport. It is 1,637,749 bytes with SHA-256
`cc38fbd129c93dc9f401173dcaf4d18beb1caa62a66b14e158b3fbce66f2279d`.
Its companion metadata labels it `LOCAL_NON_AUTHORITATIVE`, binds it only to
source HEAD `150b166171cbd339acb287f7f5d37809c21774ee`, and records
`working_tree_clean=false`. It is useful candidate UI evidence but cannot
support an exact-source or hosted proof claim.

The previous `proof-b758bcfbc` captures and other historical images or digests
remain unbound. An exact-source capture must still be generated after the tree
is frozen and recorded against that exact commit before it can support Level
3–5 proof.

## A11oy frontend truth boundary

### Exact 24-name connector catalogue

The current home-page source contains 24 unique named examples:

`Salesforce`, `HubSpot`, `Slack`, `Microsoft Teams`, `Jira`, `Linear`,
`GitHub`, `GitLab`, `Snowflake`, `BigQuery`, `PostgreSQL`, `MongoDB`, `AWS S3`,
`Azure Blob`, `Google Sheets`, `Notion`, `Stripe`, `Bloomberg`, `Datadog`,
`PagerDuty`, `ServiceNow`, `Workday`, `SAP`, and `NetSuite`.

This count proves only the candidate array's source shape. Every entry is a
hypothetical catalogue fixture. It is not evidence of shipped connector code,
vendor affiliation, credentials, authorization, tenant isolation, successful
reads or writes, runtime health, or production availability. All 24 entries are
on production **HOLD** pending connector-specific authenticated runtime proof.

### Candidate/demo boundary on routes

`CandidateBoundaryBanner` is mounted outside the A11oy `Switch` and `Suspense`
boundary. The reviewed public allowlist contains exactly six route concepts:
`/`, `/agent-viz`, `/adversarial`, `/frontier`, `/verifier`, and
`/security-agents`. The base-path root also has a no-trailing-slash alias. Every
other path resolves to `PublicationHoldPage`, which says the legacy route is
excluded pending dated sources, exact-head tests, and an approved evidence
receipt. Both reviewed pages and the catch-all HOLD page remain beneath the
candidate/demo notice.

This source placement does not prove host-level SPA fallback, a successful
dynamic import, visual visibility, or behavior at a public URL. Those remain
**HOLD** until exact-head browser evidence exists.

### Deep-link E2E contract

The candidate Playwright file requires direct navigation to `/` and the five
non-root allowlist routes; HTTP status below 400; a non-empty React mount;
expected fixture headings; removal of the lazy-route loader; visibility of the
candidate notice; absence of the application error fallback; and absence of
`PublicationHoldPage` on reviewed routes. It requires `/sdk`, `/compass`,
`/care`, `/boardroom`, `/terminal`, `/agent-identity`, `/agent-bom`, and
`/applications` to render the HOLD page and echo the requested path. It also
requires home navigation to `/agent-viz` to preserve mounted content, remove
the loading fallback, and avoid the HOLD page, and runs a root Axe scan for
critical or serious findings under the selected WCAG 2.1 A/AA tags.

The root release lane ran this 16-test file against the final six-route local
build on `localhost:4111` at `2026-10-07 11:29:19 UTC`; all 16 browser scenarios passed in
13.118 seconds. An overlapping audit-lane attempt on port 4110 began while the
shared build directory was being replaced and was interrupted; it is excluded
from evidence. The passing run remains a mutable candidate checkpoint. It does
not enumerate every possible catch-all path, prove a public host's SPA rewrite,
or replace the exact-head command, browser, served-build, and report receipt.

A later audit-lane rebuild mounted at `/` and passed the same 16 browser scenarios with
system Chromium in 12.2 seconds at `2026-10-07 11:42 UTC`. The path-echo
assertion was then corrected to bind the full mounted request path. A build at
the deployment-shaped `/a11oy/` base passed all 16 browser scenarios in 11.0 seconds on
`localhost:4113` at `2026-10-07 11:45 UTC`, including the eight excluded HOLD
routes. Both are mutable local receipts; the exact deployed base path must
still be included in the post-freeze hosted browser receipt.

### Competitor-methodology boundary

The dated leader-pattern study cites exact public source revisions and records
original design synthesis. Any competitor-referencing comparison row, score,
challenge, trace, policy result, approval, or proof record rendered by A11oy is
a hypothetical fixture unless a separate exact-head execution receipt is
linked. No installed competitor product, benchmark run, compatibility result,
feature parity, endorsement, or production observation is claimed. No vendor
source, copy, layout, icon, screenshot, diagram, or asset was imported.

### Built-asset boundary and remaining false claims

The local rebuild produced the six reviewed page chunks plus entry, proxy, and
UI chunks. It produced no `DevPlatform`, `Compass`, `CareEngine`,
`complianceFabric`, `SecurityCompliance`, `AgentIdentityRegistry`,
`ApprovalQueue`, `CommandSurface`, `TrustExchange`, `CiAction`, or
`DarpaResilienceHub` chunk and no source maps. A focused built-string scan found
none of the previously identified seeded compliance, identity, signing, or
telemetry statements. This is a mutable local asset observation; it is not a
hosted or exact-head receipt.

The six reviewed route sources have no literal `status="LIVE"` PageHeader. The
repository still retains 87 dormant legacy page files with that literal label;
they must not be re-imported or re-routed without claim-by-claim review. The
home-page competitor and primitive cards remain the known public-copy risk:
their section boundary says product hypothesis, while individual rows retain
affirmative and negative wording. Treat every row as a hypothetical fixture,
not a verified benchmark, parity result, vendor assessment, or production
operation claim.

All dormant legacy statements and those home-page rows remain false or
unverified as production claims. Production operation, certification, customer
use, external attestation, live connector behavior, cryptographic authenticity,
and durable signed proof remain explicit **HOLDs**.

## Verification notes and open holds

### Repository release admission

**HOLD** until all of the following are true:

- one exact commit/tree contains the complete candidate;
- frozen install, full typecheck, tests, forced build, compiled/service runtime
  closure, docs/claims, secret scan, generated-artifact, and diff checks pass;
- vulnerability report and CycloneDX SBOM are regenerated from the stable
  manifest/lock graph and pass their deterministic/schema/provenance tests;
- both source-of-truth registries and API catalogue validate without drift;
- the protected pull request reports every required context green for the exact
  head; and
- any new live-required context is added only after its exact candidate run is
  green and the complete ruleset is read back unchanged apart from the intended
  addition.

### Runtime and Python authority

**HOLD** for production claims. Process-local workflow/approval/evidence state,
AEF ingest idempotency, and Python completed-claim deduplication are not durable.
Candidate caller and proxy source disable automatic retry of an ambiguously
completed `POST /claim`; duplicate-safe recovery and manual replay still need a
shared durable result-replay contract. The autoscaling policy is not connected
to a coordinator. Python service dependency ranges are not an exact
reproducible release graph, and dependency-backed tests were unavailable in the
restricted runtime at this checkpoint.

### Models, Hugging Face, GitHub organization, and domains

The dated public Hugging Face snapshot proves only enumerated public metadata
at its observation time. Private assets, collections, first-class Kernels,
runtime behavior, rights, and model quality remain unproved. The GitHub receipt
proves repository metadata aggregates and one Platform ruleset read, not
organization-wide code/settings/security/deployment completeness. Domain
receipts cover bounded homepage transactions only. No vendor source, copy,
trade dress, or asset was imported by this workcell.

### Cloud environment

The current runtime reports connected execution but a disabled network policy,
no runtime variables, no secrets, and no outbound identities. The onboarding
draft must preserve saved IDs/bindings, pin the exact admitted repository SHA
and pnpm setup, and declare only required egress domains. Saving a draft does
not publish it; user **Review & Publish** and an enforced runtime-policy readback
remain required.

## Public claim check

**HOLD for public promotion.** The audit-and-truth records label evidence as
source, retained, candidate, unknown, or hold, and the public router excludes
the known legacy claim pages. The remaining home-page comparison and primitive
rows still need source-by-source review or fixture-only rewriting. This packet
does not claim live deployments, customer use, compliance certification,
Python backend cryptographic verification, full frontend Python conversion,
private GitHub/Hugging Face coverage, model quality, or copied competitor work.

## Security check

No credential values were added by this audit-and-truth patch. Final staged
secret scanning is still required because the complete multi-lane candidate is
not frozen.

## Known-gaps update

`docs/operations/known-gaps.md` rev 36 records:

- final source identity/generated-truth drift (`FRONTIER-RELEASE-001`);
- durable AEF ingest retry/idempotency (`AEF-INGEST-001`); and
- Python cross-worker delivery, autoscaling, dependency, and deployment holds
  (`PYWORKER-DELIVERY-001`); and
- local Compose image-build/runtime evidence after source remediation
  (`LOCAL-STACK-001`).

## Level 5 fields

| Field | State |
| --- | --- |
| Exact-source screenshot catalogue | **PENDING** — current UI changed; historical images and digests are not rebound |
| MirrorEval assessment | **NOT RUN / HOLD** |
| Release Readiness Score | **NOT SCORED** — a score before final exact-head evidence would be fabricated precision |
| Release decision | **HOLD** |
| Public operational-readiness decision | **HOLD** |

## Completion rule

Amend this packet after the candidate is frozen. Record the exact commit/tree,
commands, exit codes, generated artifact digests/counts, staged secret scan,
hosted check URLs/conclusions, merge identity, and cloud draft revision/readback.
Only then assign the achieved proof level. Never convert an unobserved field to
PASS merely because its source configuration exists.

### Release-owner finalization placeholders

| Required receipt | Final value |
| --- | --- |
| Exact candidate commit / tree | **PENDING** |
| Final validation cutoff and clean working-tree boundary | **PENDING** |
| Exact-head A11oy build and reviewed/excluded chunk inventory | **PENDING** |
| Exact-head A11oy deep-link E2E command, browser, exit code, and report | **PENDING** |
| Exact-head screenshot routes, viewport, files, and digests | **PENDING** |
| Frozen install, full typecheck/test/build, compiled/service runtime commands and exit codes | **PENDING** |
| Python dependency-backed tests and exact dependency/image identities | **PENDING / HOLD unless produced** |
| Source-of-truth/API catalogue regenerated values and validator receipts | **PENDING** |
| Vulnerability report and SBOM timestamp/count/digest bound to exact commit | **PENDING** |
| Staged secret scan and public-claim review | **PENDING** |
| Required hosted check URLs and conclusions for exact head | **PENDING** |
| Protected merge commit/tree and ruleset readback | **PENDING** |
| Cloud draft revision, user publication action, and enforced runtime-policy readback | **PENDING / separate transaction** |
