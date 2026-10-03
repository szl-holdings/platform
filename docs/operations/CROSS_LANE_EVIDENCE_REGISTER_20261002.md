# A11oy cross-lane execution register — 2026-10-02

This register turns the linked request to operationalize cybersecurity and
then every lane into a sequence of measurable gates. The six buyer-lane
scenario labels below are a **source review** of `szl-holdings/platform` at
`f2f8df6f89056e9104587674ccec0855dd5b177a`. The later description of
disabled security tool manifests refers to the PR #882 successor at
`17196755642185597941719afe6a3e6974f3001f`. Neither source snapshot is a
deployment, customer, or external-security assessment.

## Evidence vocabulary

Use the states in `artifacts/a11oy/src/data/seriesASolutions.ts`: `REAL`,
`DEMO`, `UNAVAILABLE`, `DEGRADED`, `BLOCKED`, and `ROADMAP`. A row becomes
`REAL` only with a current authenticated or independent observation tied to
the exact source, target, environment, run, and time. Keep these separate:
source code → local test → hosted exact-head CI → protected merge → provider
publication → deployed route → functional outside witness. A successful
earlier stage cannot supply a missing later stage.

| Buyer lane | Current source contract | Required first operational witness | Current later-stage evidence |
|---|---|---|---|
| Cyber security | `cyber-security` scenario is `DEMO`; action `BLOCKED`. The readiness agent and cyber pages are in this workcell because they could label missing or seeded evidence as live. | Source/target-bound security observation, policy and named human approval, read-back of the actual effect, and a verifiable receipt. | `UNAVAILABLE` for an approved containment effect and current production witness. |
| Finance | `finance` scenario is `DEMO`; action `BLOCKED`. | Versioned assumptions and exposure source, materiality policy, authorized treasury or risk review, transaction-system read-back if an action is ever enabled. | `UNAVAILABLE` for live transaction and outside witness. |
| Data governance | `data-governance` scenario is `DEMO`; action `BLOCKED`. | Classified data request with purpose, scope, retention, identity, policy version, and observed access disposition. | `UNAVAILABLE` for a live access decision and outside witness. |
| Enterprise operations | `enterprise` scenario is `DEMO`; action `BLOCKED`. | Correlated source events, accountable workflow owner, approval result, downstream system read-back, and traceable receipt. | `UNAVAILABLE` for live execution and outside witness. |
| Real estate | `real-estate` scenario is `DEMO`; action `BLOCKED`. | Dated property and market source with rights to use it, risk assumptions, investment authority, and recorded committee disposition. | `UNAVAILABLE` for a live portfolio or transaction witness. |
| Legal | `legal` scenario is `DEMO`; action `BLOCKED`. | Matter and obligation source, privilege boundary, qualified human review, and docket or contract-system read-back when authorized. | `UNAVAILABLE` for live legal action and outside witness. |

All six source and scenario states above come from
`artifacts/a11oy/src/data/seriesASolutions.ts` at the declared commit. The
`artifacts/a11oy/README.md` independently says its 20 Workcells are deterministic
fixtures and authenticated Workcell, GraphQL, deployment, and customer-runtime
evidence is unavailable. This register has **not** measured current hosted CI,
provider revisions, domains, customer environments, or signers for these lanes;
those columns remain `UNKNOWN` until a receipt is attached. The September 29
source alignment report in `audit/P0_SERIES_A_SOURCE_ALIGNMENT_20260929.md`
documents earlier Platform source checks and separate A11oy Python, Hugging Face,
and domain boundaries; it does not upgrade this October source review.

Run `node scripts/qa/verify-cross-lane-source.mjs` for a read-only JSON
verification of the six declared source states at the local Git HEAD. It
compares the working file to the committed blob and the reviewed SHA-256 digest.
`VERIFIED_LOCAL_SOURCE` does not measure hosted CI, merge, publication,
deployment, or an outside witness; those fields remain `UNKNOWN` in this
source-only report.

## Product and repository boundaries

- Build new cyber and legal product behavior in the canonical A11oy path, not
  in retired standalone `artifacts/sentra` or `artifacts/counsel` pages. Their
  `DEPRECATED.md` files supersede older product maps.
- `docs/APP_STATUS.md` (September 24) lists several artifact paths that are not
  in this commit's seven-directory `artifacts/` tree. Its labels require
  reconciliation before being used as a current deploy inventory.
- `artifacts/PUBLIC_SURFACES.json` was observed August 11. The route records are
  historical; `docs/product/public-surface-truth.md` requires a freshness
  check before calling a route currently reachable.
- `docs/conformance/VERTICAL_CONFORMANCE.md` records **0 of 3** target surfaces
  verified. Its seven gates, exact commits, trust anchors, and runtime readback
  remain the promotion path for Sentra, Vessels, and insurance. Registration is
  discoverability, not conformance or deployment.

## Cyber payload: threat to governed action

The differentiator to test is one source-bound decision thread from a security
observation to a reversible recommendation and verified effect, using the same
Observe → Gate → Act → Prove contract as the other lanes. It is a product
hypothesis, not a claim of market uniqueness. The minimum record is:
`tenant/target`, observation source and run ID, observation time, exact source
revision, normalized finding, asset/identity scope, policy version, proposed
action, named approval, execution attempt, post-effect read-back, and receipt
digest. Never substitute a seed, global advisory count, queued job, or HTTP
acceptance for a target-specific effect.

| Cyber workstream | Current repo option | Admission test |
|---|---|---|
| Asset and identity context | A11oy cyber vertical and `packages/tool-mesh` security tools | Target and tenant binding; unknown asset is `UNAVAILABLE`, not clean. |
| Detection and investigation | `readiness-security` reports and an explicitly permitted feed adapter | Current source/run identity, bounded age, target-scoped findings, and outage state. |
| Response | Existing gateway policy and human approval queue | No silent containment; named approval, effect attempt, and independent post-effect read-back. |
| Security engineering | Protected GitHub checks, SBOM/secret workflows, and exact-head receipts | A present workflow and current-head success; signature presence is not signature verification. |
| Resilience | Existing incident and restore runbooks | Dated tabletop and measured restore/integrity exercise before recovery claims. |

The current `packages/tool-mesh/src/tools/security-tools.ts` needs target-bound
queries and effect receipts before its scan, escalation, compliance, or
vulnerability outputs can be called operational. Their manifests are disabled
until a real adapter can supply those outputs. Its gateway blocks
approval-required execution; a pending containment proposal is a valid state.
`services/verticals/sentra_cyber/signals.py` is a deterministic stub, so its
example CVE, SIEM, and attack-surface signals are demo data. Do not connect an
external SIEM, scan customer assets, or run an action until the owner identifies
the permitted source, tenant, operator, and authority. The first connector
acceptance test should inject a known finding, a source outage, a wrong-target
finding, and a stale observation and verify all four dispositions.

## Operating lanes and responsibility

The original cloud plan also named product, engineering, data/AI, operations,
people, and governance. These are work functions shared across the six buyer
lanes, not six additional deployed products.

| Work function | Responsible work and existing tool option | Accountable decision | Proof before completion |
|---|---|---|---|
| Product | Maintain a per-buyer decision contract and truth-qualified copy in `artifacts/a11oy`. | Stephen, as product owner. | Scenario acceptance and source-bound user-flow review. |
| Engineering | Implement bounded connectors and regression gates; use repository CI and exact-head checks. | Stephen, as repository owner. | Tests, security review, protected merge read-back. |
| Data and AI | Register source provenance, allowed use, model/eval revision, and failure behavior. | Stephen, or a named delegate only when actually assigned. | Source rights, evaluation receipt, drift and missing-data behavior. |
| Security and operations | Run read-only readiness checks, incident intake, approval gate, and post-effect read-back. | Stephen for external effects; incident commander only if actually appointed. | Signed/source-bound findings, dispatch receipt, recovery exercise. |
| People | Assign and train an operator for each approval and incident role. | Stephen until a role is delegated. | Named assignment, exercise record, access review. `UNASSIGNED` is a blocker. |
| Governance | Check claims, data handling, release authority, and the evidence chain. | Stephen. | Reviewed Proof Packet and exact provider/source reconciliation. |

No independent approval or staffed 24/7 SOC is inferred from these functions.
Where a second operator or professional judgment is required, the task remains
`BLOCKED` until one is actually assigned and recorded. Do not turn an agent's
simulation or a seeded dashboard into approval, notification, or containment.

## Measured gates and order of work

| Window from kickoff | Deliverable and exit gate |
|---|---|
| First 30 days | Inventory each lane's owner, exact source revision, connector, data license, known failure, and decision authority. Repair false GREEN and LIVE cyber claims. Demonstrate a read-only cyber observation with target/source/run identity and fail-closed missing-data tests. Publish a reviewed Proof Packet. |
| Days 31–60 | For one narrow cyber use case, integrate a permitted feed and run it in a test environment. Exercise alert → investigation → human approval → effect simulation → receipt, then a separately authorized real action with post-effect read-back. Gate expansion on security review, hosted CI, and an assigned operator. Apply the same contract to one next buyer lane selected by measured value and data availability. |
| Days 61–90 | Repeat the exact-source and outside-witness gates for other lanes only where connectors, rights, identities, and operators exist. Run an incident/tabletop and recovery test, refresh public-surface observations, and reconcile provider publication/deployment. Leave unqualified lanes as `DEMO`, `UNAVAILABLE`, or `BLOCKED`. |

These are sequencing targets, not commitments that external systems will be
available or that all lanes will be production-ready on a calendar date.

## KPI definitions (no values inferred)

| Metric | Numerator / denominator and source | Missing-data rule |
|---|---|---|
| Evidence coverage | Current source/target/run-bound records passing verification ÷ records required for the named gate. | `UNAVAILABLE` if the denominator or source is unknown; never default to 100%. |
| Detection-to-review time | Median elapsed time from observed alert receipt to named human disposition, from paired timestamps. | Exclude no unresolved alert silently; report pending count alongside the median. |
| Approval integrity | Authorized actions with a matching approval and policy receipt ÷ all observed external actions. | `UNAVAILABLE` if action inventory or approval log is absent. Any unapproved action is a gate failure. |
| Effect verification | Authorized actions with exact-target post-effect read-back ÷ authorized actions attempted. | A queued job, database insert, or HTTP acceptance is pending, not a verified effect. |
| Recovery exercise | Exercises with measured restore and data-integrity proof ÷ scheduled exercises. | No exercise means `NOT_MEASURED`, never pass. |
| Lane operational coverage | Buyer lanes satisfying source, CI, merge, provider, deployment, and outside-witness gates ÷ six. | Each missing stage blocks that lane; a demo or historical screenshot does not count. |

At kickoff, record each metric with `UNKNOWN` value, owner, observation window,
query, and source identity. Promote a number only after a reproducible query and
sample receipt are attached. The next decision is to qualify the cyber
readiness evidence path, then choose the first permitted live connector and
operator; the same gate contract makes the other lanes comparable.
