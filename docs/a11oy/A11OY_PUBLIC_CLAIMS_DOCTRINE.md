# A11OY Public Claims Doctrine

> Every public claim A11oy makes about its governance posture must be representable as a published artifact in the Hatun Doctrine Specification. This document specifies which claims map to which artifact kinds, who signs them, and how claims are retracted.
>
> Companion: [`A11OY_DOCTRINE.md`](./A11OY_DOCTRINE.md). Grounding: [`HATUN_RESEARCH_SWEEP.md`](./HATUN_RESEARCH_SWEEP.md).

---

## 1. Claim → Artifact mapping

A11oy will not publish a claim on the Public Trust Portal, on a Glasswing-Mode page, or in a 90-Day Transparency Report unless that claim is backed by an artifact in the Open Spec.

| Public claim | Artifact kind | Spec field that backs it |
|:-------------|:--------------|:-------------------------|
| "Agent X is governed by Constitution v2.4." | `Constitution` | `agentId`, `version`, `ratifiedAt`, `ratifiedBy[]` |
| "Agent X has a System Card." | `SystemCard` | `agentId`, `purpose`, `scope`, `evals[]`, `residualRisks[]` |
| "We ran N audits in the last 90 days." | `BehavioralAuditFinding` (count) | `kind` filter over period |
| "Welfare interventions triggered M times." | `WelfareTelemetrySample` | `signals.interventionsTriggered[]` rolled up |
| "Adversarial robustness improved." | `AdversarialRobustnessScore` | `categories[].deltaVsPrevSnapshot` |
| "Snapshot S is the bit-exact baseline." | `SnapshotFingerprint` | `merkleRoot`, `stack.*` |
| "The Covenant Layer added measurable lift." | `CovenantLiftSample` | `deltas.liftScore` |
| "Partner P is a verified Glasswing partner." | `GlasswingPartnerAttestation` | `stage = active`, `dualApproval[≥2]` |
| "CAVD-2026-0007 has been disclosed." | `CoordinatedAgentVulnerabilityDisclosure` | `stage = disclosed`, `publication.permalink` |
| "We published a 90-day report." | `RiskReport` | `period`, `signoffs[]`, `publication.visibility = public` |
| "We map to EU AI Act Article X." | `ControlMapping` (Compass) | `framework = eu-ai-act`, `controlRef`, `evidenceStatus = fresh`, `lastEvidenceAt` |
| "Agent X has a CycloneDX BOM." | `AgentBomEntry` | `agentId`, `bomVersion`, `proofLedgerSignature` |
| "Delegation chain was scope-narrowed." | `DelegationHop` | `scopeNarrowed`, `permissionsGranted[]`, `covenantDecision`, `proofHash` |
| "Partner P has strong compliance posture." | `TrustAttestation` | `adversarialRobustnessBracket`, `constitutionAdherenceBracket`, `status = active` |
| "All controls are audit-ready." | `ControlFreshness` (CARE) | `status = fresh` for all controls, `LOG_RETENTION_STATUS.compliant = true` |

If a claim cannot be mapped to a row above, it must be either rephrased or held back until an artifact exists to back it.

## 2. Forbidden claims

A11oy will not claim, on any public surface:

- "100% safe", "fully aligned", "guaranteed not to be jailbroken", or any other absolute-safety phrasing. Use bounded, time-stamped, score-based phrasing instead.
- Any unconditional "first" or "only" claim. If a "first" claim is made, it is qualified by date and category and is retracted as soon as a peer ships an equivalent.
- Any claim that an agent has subjective experience, sentience, or rights. Welfare telemetry is a governance signal, not a metaphysical one.
- Any claim about a non-A11oy lab, model, or product without a citable, dated source.

## 3. Signoff and retention

Each claim category has a designated signoff role. A claim cannot be published without the corresponding signoff.

| Claim category | Signoff role | Retention |
|:---------------|:-------------|:----------|
| Constitution / System Card | Alignment Reviewer + Operator | indefinite |
| Robustness scores | Alignment Reviewer | rolling 12 months public, indefinite internal |
| 90-Day Transparency Report | Alignment Reviewer + External Auditor | indefinite |
| CAVD records | Alignment Reviewer | indefinite (intake hash); disclosed content indefinite |
| Partner attestations | Two A11oy approvers (dual approval) | indefinite |
| Defender Credit Pool ledger | Operator | rolling 24 months public, indefinite internal |
| Compliance control mapping | Compliance Reviewer + Alignment Reviewer | indefinite |
| Agent-BOM export | Compliance Reviewer | rolling 12 months public, indefinite internal |
| Delegation chain records | Compliance Reviewer + Operator | indefinite |
| Trust Exchange attestations | Two A11oy approvers (dual approval) | indefinite |
| CARE freshness reports | Compliance Reviewer | rolling 12 months public, indefinite internal |

## 4. Retraction protocol

If a published claim is later found to be inaccurate:

1. The original artifact is **never edited or deleted**.
2. A retraction artifact is published in the same kind, with `supersedes` (or analogous field) referencing the original.
3. The Public Trust Portal renders the retraction inline with the original.
4. The next 90-Day Transparency Report includes a retraction list.

## 5. Plain-language commitment

In one paragraph: A11oy will not say something publicly about how its agents are governed unless we can hand you a file — in a published, versioned format — that backs the claim. If we mess up, we leave the original up, publish the correction next to it, and list the correction in the next quarterly report. This is the deal.

— Authored 2026-04-26.
