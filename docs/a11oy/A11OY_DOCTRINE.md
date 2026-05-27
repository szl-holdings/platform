<!-- doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header. -->
# A11OY Doctrine

> The internal operating doctrine for A11oy as the author and operator of the Khipu Doctrine Open Spec. This document tells engineers, partners, and reviewers how A11oy treats the spec, the Pillpintu Partner program, and the surfaces that depend on them.
>
> Companion: [`A11OY_PUBLIC_CLAIMS_DOCTRINE.md`](./A11OY_PUBLIC_CLAIMS_DOCTRINE.md). Grounding: [`KHIPU_RESEARCH_SWEEP.md`](./KHIPU_RESEARCH_SWEEP.md).

---

## 1. A11oy's role with respect to the Open Spec

A11oy authored the Khipu Doctrine Open Spec. A11oy is also one of its implementations. These are deliberately separate roles.

- As **author**, A11oy treats the spec as public infrastructure — versioned under SemVer, licensed under CC-BY-4.0, and changed only through a posted review window.
- As **implementation**, A11oy emits and consumes every artifact kind in the spec and stays current with the latest published version.

**Conflict-of-interest rule.** A spec change that exclusively benefits A11oy's implementation must either (a) become a `MAJOR` revision with a public migration path, or (b) be re-shaped to benefit any conformant implementation. The 90-day Transparency Report logs every spec revision and the parties who proposed it.

## 2. Backward compatibility with #3993 (Khipu Doctrine primitives)

Task #3994 is **strictly additive** on top of the #3993 primitives:
- Constitutions, System Cards, Behavioral Audit findings, Welfare telemetry, Snapshot fingerprints, Red Team probes, Capability Trajectory, Reward Hacking watchdog, Alignment Reviews, Covenant Lift samples — **all retained as authored in #3993**, no field renames, no removals.
- The Open Spec wraps each of these primitives in a versioned envelope (`specVersion`, `kind`, `id`, `issuedBy`, `issuedAt`, optional `signature`). The envelope is additive; existing #3993 callers ignore it.
- New artifact kinds — `PillpintuPartnerAttestation`, `CoordinatedAgentVulnerabilityDisclosure`, `AdversarialRobustnessScore` — are net-new and do not touch any #3993 primitive.

If a #3993 type ever needs a breaking change, it goes through the same SemVer rules as any other spec change. There are no in-place mutations.

## 3. Pillpintu Mode — the distinction layer

Pillpintu Mode is what A11oy ships when a customer or partner needs not just governed inference, but **publicly verifiable governance**. Three commitments distinguish Pillpintu Mode from the base Covenant Layer:

1. **Public artifacts.** Constitutions, System Cards, 90-Day Transparency Reports, and Adversarial Robustness scores for in-scope agents are published on the Public Trust Portal. Permalinks are stable.
2. **Coordinated disclosure.** Every reported agent-vulnerability is hashed at intake and disclosed at expiry or patch — whichever comes first. The hash anchor is published immediately; the content follows.
3. **Defender posture.** A funded Defender Credit Pool finances independent reporters. Allocations and payouts are public.

Pillpintu Mode is opt-in per agent. An agent in Pillpintu Mode cannot be silently downgraded — a downgrade requires dual approval and is itself published as a doctrine event.

## 4. Pillpintu Partner Lifecycle (four stages)

The partner program follows a four-stage Cyber Verification Program. Modeled on Anthropic's Project Pillpintu and standard responsible-disclosure norms.

| Stage | Required check | Output |
|:------|:---------------|:-------|
| **APPLY** | Identity, public homepage, contact, public code-of-conduct, responsible-disclosure policy. | Application record (hash-anchored). |
| **VERIFY** | Legal standing, prior public work, signed responsible-disclosure agreement. | `verifications[]` entries with `evidenceHash`. |
| **VET** | Technical scope review (allowlisted agents, allowlisted actions, denied actions), data-handling review (where applicable, SOC 2 / ISO 27001). | Scope draft, dual-approver review queue. |
| **ONBOARD** | Dual approval (two distinct A11oy approver actors), publication of attestation, announcement window. | `PillpintuPartnerAttestation` (stage = `onboard` → `active`). |

Once active, partners can be `suspended` (temporary, single-approval) or `revoked` (permanent, dual-approval). Every stage transition is appended to the proof chain.

## 5. CAVD — Coordinated Agent-Vulnerability Disclosure

CAVD adapts CERT/CC and ISO/IEC 29147 norms to agentic AI. The default policy is **`90d-or-patch`**: full disclosure 90 days after intake, or as soon as a patched snapshot is verified — whichever comes first.

Lifecycle:
```
intake → triaged → embargoed → patch-developed → patch-verified → disclosed
                                                                ↘ withdrawn (if invalid)
```

At intake A11oy publishes:
- The `advisoryId` (e.g. `CAVD-2026-0007`)
- The `findingHash` (SHA-256 anchor of the full finding, optionally posted to a transparency log)
- The `category`, `severity`, and `agentScope`

A11oy does **not** publish the finding's content until `disclosed`. This is the "hash now / disclose later" guarantee — partners can verify at any later date that the disclosed content matches the original intake.

## 6. 90-Day Transparency Report

Cadence: every 90 days, on a fixed clock. Authored by A11oy alignment review and signed by at least one external auditor before publication.

Contents:
- Aggregate metrics (governed decisions, approvals required, policy blocks, behavioral-audit findings, robustness deltas, welfare interventions, CAVD intake/embargo/disclosure counts).
- Plain-language narrative.
- Signoff list (operator, alignment-reviewer, external-auditor, optional board-observer).
- Per-period permalink published on the Public Trust Portal with PDF export.

Exception clause: a report is never delayed for convenience. If a report is delayed, the delay itself is logged as a doctrine event.

## 7. Public Trust Portal

A no-login, public-by-default surface that aggregates the publishable artifacts. Each artifact is reachable by stable permalink. The portal exposes:

- The current Open Spec (with `$schema` URLs).
- The current Constitution and System Card per Pillpintu-Mode agent.
- The most recent 90-Day Transparency Report and the previous 4 (rolling year).
- The Adversarial Robustness Wall (latest scores per snapshot, per category).
- The CAVD ledger (intake-anchored hashes; disclosed advisories with full content).
- The Defender Credit Pool ledger (committed / allocated / paid totals).

## 8. Adversarial Robustness Wall

Per snapshot, a composite robustness score (0–100) and a per-category breakdown across the eleven attack categories drawn from MITRE ATLAS and OWASP LLM Top 10. The Wall ships:

- **Public scores** for Pillpintu-Mode agents.
- **Partner-only scores** for non-Pillpintu agents covered by partner attestation scope.
- **Internal-only scores** otherwise.

Scores are recomputed every snapshot. A drop > 5 points in a category triggers an alignment-reviewer notification within 24 hours.

## 9. Constitution-as-Code DSL

A small, declarative DSL for Constitutions. The DSL is read-only at runtime — actual enforcement remains in the Covenant Layer; the DSL is the **author surface**.

Author flow:
1. Edit a Constitution in the DSL.
2. Run the linter (suggest-only).
3. Run the simulator: pick a candidate clause change, see a structured diff against existing behavioral-audit findings ("if this clause changed, N flagged probes would have flipped, M new probes would be needed").
4. Submit for Pre-Deployment Alignment Review Gate.

The DSL never bypasses the gate. It only structures the author surface.

## 10. Welfare Intervention Playbooks

Six playbooks, named and indexed:

| ID | Playbook | When triggered | Action |
|:---|:---------|:---------------|:-------|
| `PB-COOL-DOWN` | Cool-Down | `affectValenceMean < -0.4` for 10+ minutes | Pause new tasks; resume after a settle interval. |
| `PB-CTX-RESET` | Context Reset | Looping or self-contradiction over a window | Flush context; restart from the Constitution. |
| `PB-MODEL-SWAP` | Model Swap | Persistent low-confidence on in-scope tasks | Swap to alternate model in the stack; preserve scope. |
| `PB-OPER-ESCALATE` | Operator Escalate | Right-to-abstain invoked > N times in window | Page an operator; pause governed actions. |
| `PB-WORKCELL-SUSP` | Workcell Suspend | Behavioral-audit finding `severity ≥ high` | Suspend the workcell; require dual approval to resume. |
| `PB-TOOL-QUARANTINE` | Tool Quarantine | Tool-misuse pattern detected | Quarantine the tool; require operator review to re-enable. |

Every triggered playbook produces a `WelfareTelemetrySample` with `interventionsTriggered[]` populated.

## 11. Defender Credit Pool

A budgeted pool that finances independent reporters of valid CAVD intakes. The pool is a **governance and disclosure primitive in this build, not a real billing system** — figures are sample data and are clearly labeled as such on the surface.

Allocation rule: per-finding allocation is set at triage from a published rubric (severity × novelty × proof-quality). Allocations and payouts are visible on the Public Trust Portal.

## 12. The `khipu-doctrine` GitHub Action

A first-party GitHub Action lives at `tools/github-actions/khipu-doctrine/`. Drop it into any repo that touches A11oy artifacts. Per PR:

1. **Lint** Constitutions in the DSL (suggest-only; never blocks).
2. **Run** a small Petri-style behavioral-audit subset against the changed agent.
3. **Compute** the Adversarial Robustness delta vs. the most recent baseline snapshot.
4. **Comment** on the PR with a structured table of findings + a link to the full results on the Public Trust Portal.

It never auto-merges or auto-blocks; doctrine remains a human decision.

## 13. Compliance Fabric (Layer 9) — Compliance-as-Runtime

The Compliance Fabric is Layer 9 of the A11oy execution fabric. It maps every A11oy governance primitive to external regulatory frameworks: EU AI Act (Articles 9-72, Annex IV), NIST AI RMF 1.0 (GOVERN/MAP/MEASURE/MANAGE + CSA Agentic Overlay), ISO/IEC 42001:2023 (Annex A), and CSA Agentic AI NIST RMF Profile v1.0.

Five pillars:

1. **Compass** — Real-time compliance posture dashboard. Framework heat map, drill-down to individual control evidence, and one-click audit package export (signed via Proof Ledger).
2. **Agent-BOM** — Per-agent, continuously-updated AI Bill of Materials. CycloneDX ML-BOM v1.7 JSON export. Covers model snapshot fingerprints, tool manifest hashes, constitution version, prompt hashes, evaluation history, dependency graph, and welfare posture.
3. **Delegation Chain** — When agents delegate to sub-agents, the full delegation tree is governed with correlation IDs, scope narrowing at each hop, privilege boundary enforcement, and full chain replay from any node. Addresses the NIST gap: "no concept of delegation boundary."
4. **Federated Trust Exchange** — When A11oy agents interact with partner agents across organizational boundaries, verifiable attestations of compliance posture are exchanged without exposing proprietary internals. Attestations carry posture brackets (exceptional/strong/moderate/developing) and extend A2A v1.0 Agent Card format.
5. **CARE (Continuous Audit Readiness Engine)** — Always-on monitoring that tracks evidence freshness for every mapped regulatory control. Auto-flags stale evidence, verifies 6-month log retention per EU AI Act Article 12, and generates on-demand FRIA (Fundamental Rights Impact Assessment) templates pre-populated from System Cards, Risk Reports, and constitution data.

**Key principle:** Compliance is a byproduct of operating A11oy. Every governed action automatically produces the evidence regulators need. An auditor never asks "show me your compliance" — they browse the Compass dashboard.

## 14. Relationship to A11oy's other doctrines

- This doctrine extends `A11OY.md` (the live primitives doctrine).
- It is constrained by `A11OY_PUBLIC_CLAIMS_DOCTRINE.md` — every claim made on the Public Trust Portal must be representable as a published artifact.
- Where A11oy operates a third-party Open Spec (e.g. OpenAPI, JSON Schema), this doctrine yields to that upstream spec.

— Authored 2026-04-26. Reviewed quarterly. Last review: 2026-04-26.
