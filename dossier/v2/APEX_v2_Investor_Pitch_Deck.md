<!-- doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header. -->
# SZL Holdings — Investor Pitch Deck (v2)
## Series-A Grade · Apex Accelerator Refresh
## May 5, 2026

> Each section below is one slide. Speaker notes follow each slide and are intended for the script, not the deck face.

---

## SLIDE 1 — Title

# SZL Holdings
## Governed Operational Intelligence
### The platform that proves what AI decided, why, and on whose authority.

Stephen Lutar — Founder
stephenlutar2@gmail.com
github.com/szl-holdings · ORCID 0009-0001-0110-4173
May 5, 2026

> **Speaker note:** Hold the slide for a beat. Single sentence: *"This is the platform that proves what AI decided, why, and on whose authority — by construction, not after the fact."*

---

## SLIDE 2 — The Procurement Problem

# Every regulator is converging on the same question.
## "Show your work."

- **NIST AI RMF**, **DoD RAI Strategy**, **OMB M-24-10**, **NY S.B. 7599** — all require *runtime auditability at the point of decision.*
- Existing AI vendors ship inference. They reconstruct audit trails after the fact.
- Human-in-the-loop is a checkbox in their docs. It is not a runtime gate.

> **Speaker note:** Land "after the fact" hard. That is the gap.

---

## SLIDE 3 — The Thesis

# The loop *is* the product.

## A bounded, governed, auditable decision loop, formalized as a mathematical invariant — and shipped as a runtime.

- The math is published. **Ouroboros Thesis v3, v9, v10** — DOI-pinned on Zenodo, CC-BY-4.0.
- The runtime is open source. **`@szl-holdings/ouroboros` v6.2.0**, full test suite, CodeQL.
- The audit is the system. **CPS standard** + Trust Plane + agent gateway, live today.

> **Speaker note:** This is the line that separates SZL from every other governed-AI pitch on the market. The math is *written down*.

---

## SLIDE 4 — The Five Stages

# One loop. Five stages. Run continuously.

| 1. Ingest | 2. Score | 3. Decide | 4. Act | 5. Verify |
|---|---|---|---|---|
| Normalize signals across systems | Risk-score against policy in real time | AI-supported decisions, policy-gated approvals | Execute with full traceability — every input hashed, every approver named | Verify outcomes against intent; replay-grade audit history |

> **Speaker note:** The convergence properties of this loop — when it terminates, what its proof chain looks like — are formalized in the Lutar Invariant family in the published thesis.

---

## SLIDE 5 — Six Primitives

# Six primitives. Every vertical. Same shape.

| Outcome Graph | Proof Chain | Covenant Policy |
|---|---|---|
| What was decided, by whom, with what evidence. | Hash chain from output → inputs → human approver. | Declarative gating of every AI action. |

| Decision Simulation | Workflow Engine | Event Fabric (PRISM Bus) |
|---|---|---|
| Replay decisions against history before policy ships. | The bounded-loop scheduler. | Append-only event spine. Everything publishes here. |

> **Speaker note:** This is what makes it a platform, not a portfolio of disconnected apps.

---

## SLIDE 6 — The Eight Surfaces

# Eight live product surfaces. One control plane.

| Surface | Domain |
|---|---|
| **A11oy** (`/a11oy/`) | Orchestration + Decision Intelligence + Trust Plane |
| **Sentra** (TENAX, `/sentra/`) | Cyber Resilience Command |
| **Amaru** (Conduit, `/conduit/`) | Convergent Reverse-ETL |
| **Terra** (DOMAINE, `/terra/`) | Real Estate Intelligence |
| **Vessels** (SEXTANT, `/vessels/`) | Maritime Intelligence |
| **Counsel** (`/counsel/`) | Legal Matter Command |
| **Carlota Jo** (`/carlota-jo/`) | Concierge Advisory Operations |
| **ROSIE** (`/rosie/`, **NEW**) | Unified Decision Fabric — the operator surface for CPS payloads |

> **Speaker note:** Eight surfaces, not seven. ROSIE was promoted to a customer-facing artifact in the last 48 hours; it is where CPS payloads are operated.

---

## SLIDE 7 — A11oy as Control Plane

# A11oy is the Mythos-class control plane.

- **Argo** — experience-era decision engine. Champion policies, self-play arena, mirror eval, counterfactuals, reward-hacking guardrails. World-model accuracy 89.1%, throughput 31.4 ev/s.
- **PSYCHE** — emergent-sentience observatory.
- **Trust Center · Trust Exchange · Public Trust Portal** — the externally-facing proof distribution surface.
- **Agent Zero Trust** — backed by the live agent-gateway service that enforces OPA policy at the runtime boundary.
- **Live Claude-class advisor** at `/a11oy/chat` — system prompt locked to the SOURCE_OF_TRUTH numbers; refuses fabricated metrics.

> **Speaker note:** This is the slide that shows we are not just running models — we are governing the act of running them.

---

## SLIDE 8 — CPS: The Standard

# Covenant Proof Standard (CPS)
## A payload-and-receipt protocol for cross-vertical governed actions.

- `POST /api/cps/runs` — execute a payload against a tenant
- `POST /api/cps/runs/:id/approve` — tier-checked human approval gate
- `POST /api/cps/runs/:id/rollback` — verified rollback to prior state
- `POST /api/cps/payloads/:id/maturity` — promote/demote payload maturity

**Three flagship payloads live today.** Per-lane payloads rolling out across Vessels, Terra, Counsel, Carlota Jo.

> **Speaker note:** CPS is what makes "governed AI" a thing you can buy with a P.O. — not a thing you have to take on faith.

---

## SLIDE 9 — The Math, Written Down

# Three peer-style papers. Public. DOI-pinned.

| Paper | Title | Status |
|---|---|---|
| **v3** | *The Loop Is the Product: Measuring Bounded Recursion as a System Primitive for Auditable AI* | Zenodo DOI `10.5281/zenodo.19944926`, CC-BY-4.0 |
| **v9** (NEW) | *The Lutar Invariant Family v1 → v7 → Ω: From Three-Term Foundation to Bianchi-Closed Fiber Bundle* | 17 pp, May 5 2026, GitHub Release `paper-v9-1.0.0` + Zenodo |
| **v10** (NEW) | *The Audit Closure Operator Λ₁₀: Formalising the Implementation Contract of the Lutar Family* | 11 pp + Appendix A essay + Lutar-family one-pager, May 5 2026 |

> **Speaker note:** v10 is a *meta-invariant on v9*. It introduces no new physical term. Its only job is to certify, layer by layer, that every formula in v9 actually executes against the live shipping repo. The platform audits its own thesis.

---

## SLIDE 10 — Verified Platform Numbers

# Re-runnable, not estimated.

| Metric | Value |
|---|---|
| Customer-facing product surfaces | **8** + A11oy orchestration layer |
| Platform primitives | 6 |
| Database tables (provisioned) | 848 |
| API endpoint declarations | 5,524 |
| Monorepo packages | 126 |
| Ouroboros packages | 28 |
| Ouroboros runtime test calls | 133 |
| Ouroboros guardrails tests | 62 |
| Codex v11 nodes / typed edges | 76 / 95 across 11 domains |
| Security tests passing | 126 |
| CI workflows | 23 |

> **Speaker note:** Every one of these numbers ships with the verification command in `SOURCE_OF_TRUTH.md`. We do not estimate.

---

## SLIDE 11 — Government Alignment

# Five demand vectors, mapped to shipped capability.

| Demand | SZL surface |
|---|---|
| Operational transparency / IG audit | Outcome Graph + Proof Chain + CPS payloads |
| Cybersecurity / Zero Trust | Sentra + governed adversary loop + agent gateway |
| AI governance / OMB M-24-10 / NIST AI RMF | Covenant Policy + Argo guardrails + mirror eval |
| Cross-system data lineage | Amaru + Frustum three-witness reconciliation |
| **Proof distribution to regulators** | Trust Center + Trust Exchange + Public Trust Portal |

> **Speaker note:** The Trust Plane is what closes the loop with the procurement officer. It is the surface where they get the evidence packet, on demand, with chain-of-custody.

---

## SLIDE 12 — Honest Position

# What SZL Holdings is NOT claiming.

- No active federal contracts.
- No federal cloud authorization, no ATO, no DoD impact-level designation.
- No external third-party audit.
- No signed platform customers.
- Single-founder operation.
- All numbers in this deck are *internal platform metrics*. Not revenue. Not users.

**The strength of this position is the public proof. Not pretended traction.**

> **Speaker note:** This is the slide that earns trust with a procurement counselor in 30 seconds. Lead with what you don't have.

---

## SLIDE 13 — Demo Path (5 Minutes)

# One company. One design language. One proof spine.

| Min | Surface | Lands on |
|---:|---|---|
| 0:00 | A11oy Trust Center | Constitutional design — proof, covenants, attestation |
| 0:45 | A11oy Command Surface | One operator pane, every domain |
| 1:30 | Amaru Dashboard | Data fabric throughput (live `Date.now()` window) |
| 2:15 | Sentra Governed Adversary Loop | Six-step proof chain Sentra ↔ A11oy |
| 3:00 | Counsel Matter Overview | Vertical depth — legal command |
| 3:45 | Terra Distress Engine | Vertical depth — real estate |
| 4:30 | Vessels Maritime Intelligence | Vertical depth — maritime ops |

Documented at `docs/audits/INVESTOR_DEMO_PATH.md`. Per-artifact audit reports for all eight surfaces in `docs/audits/`.

> **Speaker note:** Investors should ask "show me." This path runs the proof spine through five verticals in five minutes.

---

## SLIDE 14 — 90-Day Roadmap

# What ships next, on what calendar.

| Days | Milestone |
|---|---|
| 1–14 | SAM.gov UEI activated. Primary NAICS confirmed. |
| 15–30 | CAGE issued. CMMC Level 1 self-assessment posted. First sources-sought scan pass. |
| 31–60 | First SBIR opportunity identified with APEX guidance. Per-lane CPS payloads complete for Vessels + Terra. |
| 61–90 | First sources-sought response submitted. CPS rollout complete across remaining lanes. v11 thesis (planned) covering CPS as a procurement protocol. |

> **Speaker note:** Calendar dates we will actually hit. If we do not hit a date, we say why and reset publicly.

---

## SLIDE 15 — Ask

# What we need from you.

- **Procurement counsel.** Most credible NYS pathway. Most credible federal pathway. Set-aside eligibility review.
- **Capability-statement format guidance.** What NYS and federal procurement officers actually want on the page.
- **Targeting.** Which agencies buy this kind of work, and which buy it from sole-founder firms.
- **Introductions** to the first procurement officer who will read the v9 thesis and the CPS API spec and ask the next question.

> **Speaker note:** This is not a fundraising ask. This is a sponsorship-of-readiness ask.

---

## SLIDE 16 — Close

# The math is written down.
# The runtime is open source.
# The proof is a hash chain.

## We are building the platform that makes governed AI procurable.

Stephen Lutar
stephenlutar2@gmail.com
github.com/szl-holdings
ORCID 0009-0001-0110-4173

Ouroboros Runtime: github.com/szl-holdings/ouroboros (v6.2.0)
Ouroboros Thesis: github.com/szl-holdings/ouroboros-thesis (v3, v9, v10)

> **Speaker note:** Stop. Wait for questions. Don't keep talking.
