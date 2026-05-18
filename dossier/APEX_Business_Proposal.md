<!-- doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header. -->
# SZL Holdings -- Business Proposal
## Governed Operational Intelligence for Federal and State Agencies
## Prepared for Empire APEX Accelerator

**Prepared by:** Stephen Lutar, Founder
**Date:** May 4, 2026
**Contact:** stephenlutar2@gmail.com
**Organization:** github.com/szl-holdings

---

## 1. Company Overview

SZL Holdings builds governed operational intelligence platforms for regulated enterprises and government agencies. The platform bridges data ingestion, risk analysis, AI-supported decision-making, execution, and auditability into a single continuous workflow.

Every AI-assisted decision the platform makes carries a cryptographic receipt back to the inputs that produced it, the policy that authorized it, and the human who approved it where required. This is not a feature -- it is a property of the runtime.

**Legal entity:** SZL Holdings, single-member, New York State, in good standing
**Founder:** Stephen Lutar
**Business size:** Small business, single-founder
**Primary NAICS:** 541512 -- Computer Systems Design Services
**Secondary NAICS:** 541511, 541519, 541611, 541690

---

## 2. The Problem

Federal and state agencies are adopting AI systems at accelerating pace. Current procurement frameworks -- NIST AI RMF, DoD Responsible AI Strategy, OMB M-24-10, New York S.B. 7599 -- all require one thing that most AI vendors cannot deliver:

Runtime auditability at the point of decision.

Existing vendors provide AI capabilities (inference, summarization, classification) but ship no mechanism to prove the AI was trustworthy at the moment it made a decision. The audit trail, when it exists, is reconstructed after the fact. The human oversight, when it is claimed, is a checkbox, not a runtime gate.

---

## 3. The Solution: A Governed Command Layer

SZL Holdings has built a governed command layer that runs as five continuous stages:

**Ingest** -- Signals are continuously ingested and normalized across systems (operational, security, financial, document, sensor, third-party).

**Score** -- Risks and opportunities are identified and scored in real time against policy.

**Decide** -- Decisions are generated with AI support but require human approval where the policy says they must. This is enforced at the runtime level.

**Act** -- Actions are executed with full traceability. Every call recorded, every input hashed, every approver named.

**Verify** -- Outcomes are verified against the original intent and recorded into an auditable history that can be replayed.

The convergence properties of this loop are formalized in the Ouroboros Thesis, a peer-style paper published on Zenodo with DOI 10.5281/zenodo.19944926.

---

## 4. Platform Primitives

The platform is built on six primitives that are the same across every vertical:

**Outcome Graph** -- Every action is a node; every cause is an edge. The graph is the system of record for what was decided and why.

**Proof Chain** -- Every output carries a hash chain back to the inputs and the human who approved each gated step.

**Covenant Policy** -- Declarative policy that decides which actions are auto-allowed, which require human approval, and which are forbidden.

**Decision Simulation** -- Decisions can be replayed against historical state to test policy changes before they ship.

**Workflow Engine** -- The bounded-loop scheduler that runs the five stages of the governed command layer.

**Event Fabric (PRISM Bus)** -- The append-only event spine. Everything that happens publishes here.

---

## 5. Live Product Surfaces

The platform runs as seven customer-facing product surfaces orchestrated by A11oy:

| Product | Domain | Government Relevance |
|---|---|---|
| **A11oy** | Orchestration + Decision Intelligence | AI governance, operational transparency, audit infrastructure |
| **Sentra** | Cyber Resilience Command | SOC operations, threat intel, CISA/Zero Trust alignment |
| **Terra** | Real Estate Intelligence | State property portfolio management, distress discovery |
| **Vessels** | Maritime Intelligence | DHS/Coast Guard maritime domain awareness |
| **Counsel** | Legal Matter Command | Agency legal ops, traceable legal operations |
| **Amaru** | Convergent Reverse-ETL | Cross-system data reconciliation with auditable lineage |
| **Carlota Jo** | Concierge Advisory | Premium service brand |

All seven surfaces are live and operational. Screenshots available in the dossier package.

---

## 6. Public Proof Artifacts

Two artifacts are public on GitHub today. This is significant for government procurement because it means the claims are independently verifiable:

**Ouroboros Runtime (open source)**
- Repository: github.com/szl-holdings/ouroboros
- Current release: v6.2.0
- Tests, dependabot, CodeQL, SECURITY.md
- This is the actual code, not a marketing repository

**Ouroboros Thesis (DOI-pinned)**
- Repository: github.com/szl-holdings/ouroboros-thesis
- Current release: paper-v3-2.0.0
- DOI: 10.5281/zenodo.19944926
- License: CC-BY-4.0
- ORCID: 0009-0001-0110-4173

The May 2, 2026 release publicly retracted and replaced an earlier version after a self-audit identified residual fabrications. This self-correction is in the public record and demonstrates the governance discipline the platform is built to enforce.

---

## 7. Government Standards Alignment

### NIST AI Risk Management Framework

| Function | SZL Coverage |
|---|---|
| **GOVERN** | Validator registry, loop policy, operator modes, budget governance |
| **MAP** | Domain pack router, task-type routing, risk-tier classification |
| **MEASURE** | Delta and consistency scores per step, uncertainty quantification |
| **MANAGE** | Human approval gate, halt conditions, replay verification |

### DoD Responsible AI Tenets

| Tenet | SZL Coverage | Status |
|---|---|---|
| Responsible | Human approval at risk tier 3/4, validator hard stops | Covered |
| Equitable | Bias testing plan in development | In Progress |
| Traceable | Full trace runtime, append-only logs, cryptographic receipts | Covered |
| Reliable | Golden runs, replay verification, consistency gates | Covered |
| Governable | Approval gate, halt conditions, operational modes | Covered |

### New York State AI Procurement Climate

SZL Holdings is positioned for New York State opportunities under:
- NY DIGIT Agency vendor standards for AI adoption across 50+ state agencies
- S.B. 7599 AI Transparency Law -- requiring public disclosure of AI tools and bias mitigation
- OGS centralized contract vehicles for AI governance

---

## 8. Target Sectors

| Sector | Use Case | Vehicle |
|---|---|---|
| DoD Responsible AI | Runtime auditability for AI-in-the-loop decisions | SBIR Phase I, subcontract |
| DHS / CISA | AI governance under M-24-10 inventory requirements | Sources-sought response |
| NIST | Reference implementation for runtime trust scoring | Direct engagement |
| GSA Schedule 70 / MAS IT | Base vehicle for civilian agency deployments | GSA MAS application |
| NY State OGS | State-level AI governance | Centralized contract |

---

## 9. Verified Platform Metrics

Every number below is produced by a documented verification command. Re-runnable.

| Metric | Value |
|---|---|
| Customer-facing product surfaces | 7 + A11oy orchestration layer |
| Platform primitives | 6 |
| Database tables (provisioned) | 848 |
| API endpoint declarations | 5,524 |
| Industry verticals | 7 |
| Monorepo packages | 126 |
| Original innovations | 44 |
| Runtime tests passing | 133 |
| Security tests passing | 126 |
| CI workflows | 23 |

---

## 10. What SZL Holdings Is Not Claiming

This section is included deliberately. Honesty builds trust with procurement professionals:

- SZL Holdings is not currently performing on any federal contract
- SZL Holdings has not received a federal cloud authorization, ATO, or DoD impact-level designation
- SZL Holdings has not been audited by an outside firm
- SZL Holdings has no signed customer contracts for the platform at this writing
- SZL Holdings is a single-founder operation
- The numbers above are internal platform metrics -- they describe what has been built, not revenue or users

The strength of the position is the public proof, not pretended traction.

---

## 11. 90-Day Roadmap

| Timeline | Milestone |
|---|---|
| Days 1-14 | SAM.gov UEI activated, NAICS confirmed |
| Days 15-30 | CAGE code issued, CMMC Level 1 self-assessment posted |
| Days 31-60 | First SBIR opportunity identified with APEX guidance |
| Days 61-90 | First sources-sought response submitted |

---

## 12. Contact

**Stephen Lutar**, Founder
SZL Holdings
Email: stephenlutar2@gmail.com
GitHub: github.com/szl-holdings
ORCID: 0009-0001-0110-4173

---

## Attachments

- Capability Statement (one-pager)
- Operational Briefing (detailed)
- Government Readiness Audit
- Product screenshots (9 images)
- Ouroboros Thesis PDF (available at Zenodo DOI)
