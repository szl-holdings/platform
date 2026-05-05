# SZL Holdings — Business Proposal (v2)
## Governed Operational Intelligence for Federal and State Agencies
## Prepared for Empire APEX Accelerator
## Refresh: May 5, 2026 — supersedes v1 (May 4, 2026)

**Prepared by:** Stephen Lutar, Founder
**Contact:** stephenlutar2@gmail.com
**Organization:** github.com/szl-holdings
**Version:** 2.0

---

## 1. Company Overview

SZL Holdings builds governed operational intelligence platforms for regulated enterprises and government agencies. The platform bridges data ingestion, risk analysis, AI-supported decision-making, execution, and auditability into a single continuous workflow.

Every AI-assisted decision the platform makes carries a cryptographic receipt back to the inputs that produced it, the policy that authorized it, and the human who approved it where required. This is not a feature — it is a property of the runtime.

| Field | Value |
|---|---|
| **Legal entity** | SZL Holdings, single-member, New York State |
| **Founder** | Stephen Lutar |
| **Business size** | Small business, single-founder |
| **Primary NAICS** | 541512 — Computer Systems Design Services |
| **Secondary NAICS** | 541511, 541519, 541611, 541690 |
| **ORCID** | 0009-0001-0110-4173 |

---

## 2. The Problem (unchanged)

Federal and state agencies are adopting AI systems at accelerating pace. Current procurement frameworks — NIST AI RMF, DoD Responsible AI Strategy, OMB M-24-10, New York S.B. 7599 — all require something most AI vendors cannot deliver: **runtime auditability at the point of decision.**

Existing vendors provide AI capabilities (inference, summarization, classification) but ship no mechanism to prove the AI was trustworthy at the moment it made a decision. The audit trail, when it exists, is reconstructed after the fact. The human oversight, when it is claimed, is a checkbox, not a runtime gate.

---

## 3. The Solution: A Governed Command Layer

Five continuous stages — Ingest, Score, Decide, Act, Verify — formalized as a bounded loop with a published convergence theorem (Section 6) and shipped as an open-source runtime.

The convergence properties of this loop are formalized in three peer-style papers published on Zenodo:

| Paper | Title | DOI / Release |
|---|---|---|
| v3 | The Loop Is the Product: Measuring Bounded Recursion as a System Primitive for Auditable AI | DOI `10.5281/zenodo.19944926` |
| **v9 (NEW)** | The Lutar Invariant Family v1 → v7 → Ω: From Three-Term Foundation to Bianchi-Closed Fiber Bundle | GitHub Release `paper-v9-1.0.0` |
| **v10 (NEW)** | The Audit Closure Operator Λ₁₀: Formalising the Implementation Contract of the Lutar Family | GitHub Release `paper-v10-1.0.0` |

---

## 4. Platform Primitives (unchanged)

Six primitives, identical across every vertical:

- **Outcome Graph** · **Proof Chain** · **Covenant Policy** · **Decision Simulation** · **Workflow Engine** · **Event Fabric (PRISM Bus)**

---

## 5. Live Product Surfaces — refreshed

The platform now runs as **eight customer-facing product surfaces** orchestrated by A11oy.

| Product | Domain | Government Relevance |
|---|---|---|
| **A11oy** | Orchestration + Decision Intelligence + Trust Plane | AI governance, audit infrastructure, proof distribution |
| **Sentra** | Cyber Resilience Command + governed adversary loop | SOC ops, CISA / Zero Trust alignment |
| **Terra** | Real Estate Intelligence | State property portfolio management |
| **Vessels** | Maritime Intelligence (live AIS feed) | DHS / Coast Guard MDA |
| **Counsel** | Legal Matter Command | Agency legal ops, traceable matter management |
| **Amaru** | Convergent Reverse-ETL + 10 original innovations | Cross-system data lineage |
| **Carlota Jo** | Concierge Advisory | Premium service brand |
| **ROSIE** (NEW) | Unified Decision Fabric | Operator surface for CPS payloads |

---

## 6. Public Proof Artifacts — refreshed

| Artifact | Status |
|---|---|
| Ouroboros Runtime | `github.com/szl-holdings/ouroboros` v6.2.0, full test suite, dependabot, CodeQL, SECURITY.md |
| Ouroboros Thesis v3 | `paper-v3-2.0.0`, DOI `10.5281/zenodo.19944926`, CC-BY-4.0 |
| Ouroboros Thesis v9 (NEW) | `paper-v9-1.0.0`, 17 pp, May 5 2026 — Zenodo deposit re-fired |
| Ouroboros Thesis v10 (NEW) | `paper-v10-1.0.0`, 11 pp + Appendix A essay + Lutar-family one-pager, May 5 2026 |
| Live LaaS API | `POST /api/ouroboros/lutar/v10` — runs the v10 audit closure operator against the live shipping repo on every test run |

The v9 → v10 sequence is a meta-invariant on the implementation chain: v10 introduces no new physical L-term. Its only purpose is to certify, layer by layer, that every formula in v9 executes against the live repo. The platform audits its own thesis.

---

## 7. Covenant Proof Standard (CPS) — new in v2

CPS is a payload-and-receipt protocol for governed cross-vertical workflows, exposed as a first-class API. Three flagship payloads ship with the standard; per-lane payloads are rolling out across Vessels, Terra, Counsel, and Carlota Jo.

| Endpoint | Behavior |
|---|---|
| `GET /api/cps/payloads` | List registered payloads |
| `POST /api/cps/runs` | Execute a payload run against a tenant |
| `POST /api/cps/runs/:id/approve` | Tier-checked human approval gate |
| `POST /api/cps/runs/:id/rollback` | Verified rollback to prior state |
| `POST /api/cps/payloads/:id/maturity` | Promote/demote payload maturity mode |

A live agent gateway (`artifacts/api-server: agent-gateway`) sits in front of every agent action and enforces OPA bundle policy at the runtime boundary. Agent Zero Trust (`/agent-zero-trust`) is the operator-facing surface for that gate.

---

## 8. Government Standards Alignment

### NIST AI RMF

| Function | SZL Coverage |
|---|---|
| GOVERN | Validator registry, loop policy, operator modes, **CPS approval tiers** |
| MAP | Domain pack router, task-type routing, **payload registry** |
| MEASURE | Delta and consistency scores per step, uncertainty quantification, **mirror-eval, reward-hacking guardrails (Argo)** |
| MANAGE | Human approval gate, halt conditions, replay verification, **CPS rollback** |

### DoD Responsible AI Tenets

| Tenet | Coverage | Status |
|---|---|---|
| Responsible | Human approval at risk tier 3/4, CPS tier check, validator hard stops | Covered |
| Equitable | Bias-testing plan in development | In Progress |
| Traceable | Full trace runtime, append-only logs, CPS receipts | Covered |
| Reliable | Golden runs, replay verification, **Lutar v10 audit closure** | Covered |
| Governable | Approval gate, halt conditions, **agent-gateway OPA enforcement** | Covered |

### NY State AI Procurement Climate

- NY DIGIT vendor standards for AI adoption across 50+ state agencies
- S.B. 7599 AI Transparency Law — public disclosure of AI tools and bias mitigation
- OGS centralized contract vehicles for AI governance

---

## 9. Target Sectors

| Sector | Use Case | Vehicle |
|---|---|---|
| DoD Responsible AI | Runtime auditability for AI-in-the-loop decisions | SBIR Phase I, subcontract |
| DHS / CISA | AI governance under M-24-10 inventory requirements | Sources-sought response |
| NIST | Reference implementation for runtime trust scoring | Direct engagement |
| GSA Schedule 70 / MAS IT | Base vehicle for civilian agency deployments | GSA MAS application |
| NY State OGS | State-level AI governance | Centralized contract |
| **State maritime / port authorities** | Vessels — fleet visibility + sanctions screening | OGS / direct |
| **State real-estate divisions** | Terra — distressed-property and portfolio intel | OGS / direct |

---

## 10. Verified Platform Metrics (re-verified 2026-05-05)

| Metric | Value |
|---|---|
| Customer-facing product surfaces | 8 + A11oy orchestration layer |
| Platform primitives | 6 |
| Database tables (provisioned) | 848 |
| API endpoint declarations | 5,524 |
| Industry verticals | 7 |
| Monorepo packages | 126 |
| Ouroboros packages | 28 |
| Original innovations (sovereign engine) | 44 |
| Ouroboros runtime test calls | 133 |
| Ouroboros guardrails tests | 62 |
| Codex v11 nodes / typed edges | 76 / 95 across 11 domains |
| Security tests passing | 126 |
| CI workflows | 23 |
| Peer-style papers published | 3 (v3, v9, v10) |

---

## 11. What SZL Holdings Is Not Claiming

- Not currently performing on any federal contract
- No federal cloud authorization, no ATO, no DoD impact-level designation
- Not externally audited
- No signed customer contracts for the platform
- Single-founder operation
- Numbers above are internal platform metrics — not revenue, not users

The strength of the position is the public proof, not pretended traction.

---

## 12. 90-Day Roadmap

| Timeline | Milestone |
|---|---|
| Days 1–14 | SAM.gov UEI activated, primary NAICS confirmed |
| Days 15–30 | CAGE issued, CMMC Level 1 self-assessment posted, first sources-sought scan pass |
| Days 31–60 | First SBIR opportunity identified with APEX guidance, **per-lane CPS payloads complete for Vessels + Terra** |
| Days 61–90 | First sources-sought response submitted, **CPS rollout complete across remaining lanes**, v11 thesis (planned) on CPS as a procurement protocol |

---

## 13. Contact

**Stephen Lutar**, Founder
SZL Holdings
Email: stephenlutar2@gmail.com
GitHub: github.com/szl-holdings
ORCID: 0009-0001-0110-4173

---

## Attachments

- Operational Briefing v2 (`APEX_v2_Operational_Briefing.md`)
- Investor Pitch Deck v2 (`APEX_v2_Investor_Pitch_Deck.md`)
- Capability Statement v2 (`APEX_v2_Capability_Statement.md`)
- Live Demo Guide v2 (`APEX_v2_Live_Demo_Guide.md`)
- Meeting Script v2 (`APEX_v2_Meeting_Script.md`)
- Audit Delta May 4 → May 5 (`APEX_v2_Audit_Delta_May5.md`)
- Product screenshots
- Ouroboros Thesis v3, v9, v10 PDFs (Zenodo + GitHub Releases)
