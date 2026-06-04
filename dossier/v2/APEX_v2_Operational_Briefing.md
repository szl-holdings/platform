# SZL Holdings — Operational Briefing (v2)
## Prepared for Empire APEX Accelerator
## Refresh: May 5, 2026 — supersedes v1 (May 3, 2026)

**Recipient:** Mercy McInnis, Procurement Counselor — Empire APEX Accelerator
**Author:** Stephen Lutar, Founder, SZL Holdings (`stephenlutar2@gmail.com`)
**Document version:** 2.0 (refresh)
**Prior version:** `dossier/SZL_Holdings_Empire_APEX_Briefing.md` (May 3, 2026)
**Delta document:** `APEX_v2_Audit_Delta_May5.md`

---

## 1. What changed since the May 3 briefing

The May 3 briefing introduced SZL Holdings as a unified governed-intelligence platform with seven product surfaces, an open-source runtime, and a DOI-pinned thesis. In the 48 hours since that briefing was assembled, the following material updates landed and are reflected in this document:

1. **A second, peer-style paper was published** — the Ouroboros Thesis v9 (*The Lutar Invariant Family v1 → v7 → Ω: From Three-Term Foundation to Bianchi-Closed Fiber Bundle*) and a companion v10 audit paper (*The Audit Closure Operator Λ₁₀*) were deposited to GitHub on May 5 with PDF artifacts attached to the GitHub release source archives so the Zenodo webhook re-fires with each tag. v9 is 17 pages, v10 is 11 pages plus an Appendix A essay and a Lutar-family one-pager.
2. **A11oy gained four new operator surfaces** — Argo (experience-era decision engine with champion policies, mirror eval, counterfactuals, and reward-hacking guardrails), PSYCHE (emergent-sentience observatory), the Trust Center / Trust Exchange / Public Trust Portal triad, and Agent Zero Trust.
3. **The Decision Fabric cross-primitive query layer hardened.** `lib/db/src/schema/decision_fabric.ts` and the `/api/decision-fabric` namespace expose Workflow 360, Entity Investigation, and Recommendation Trace as governed read paths across the existing seven verticals. This is a substrate capability, not a new customer-facing surface — the surface count remains seven, consolidated under A11oy.
4. **The Covenant Proof Standard (CPS) shipped as a first-class API** — `/api/cps/payloads`, `/api/cps/runs`, with three flagship payloads, tiered approval, rollback, and a maturity-mode gate.
5. **A live agent gateway service** (`artifacts/api-server: agent-gateway`) now sits in front of every agent action and enforces OPA bundle policy at the runtime boundary.
6. **A documented investor demo path** (`docs/audits/INVESTOR_DEMO_PATH.md`) and per-artifact audit reports for all seven surfaces were committed, so the platform can be walked end-to-end on a known-good route.
7. **Surgical Series-A polish** was applied across all seven prior verticals — placeholder URLs purged, demo-mode copy scrubbed, broken links removed, date-rotted fields rewired to live timestamps, fabricated example data deleted.

The platform's core thesis has not changed: governed AI cognition, proof-chain by construction, math written down. What changed is the operational evidence backing that thesis.

---

## 2. The Governed Command Layer (unchanged)

The architectural model remains: five stages, run as one continuous loop.

1. **Ingest** — Signals normalized across operational, security, financial, document, sensor, and third-party systems.
2. **Score** — Risks and opportunities scored in real time against policy.
3. **Decide** — Decisions generated with AI support, gated by policy where the policy says they must be gated.
4. **Act** — Actions executed with full traceability — every call recorded, every input hashed, every approver named.
5. **Verify** — Outcomes verified against intent and recorded into auditable history that can be replayed.

The convergence properties of this loop (when it terminates, what its proof-chain has to look like, and the closed-form Λ bound that makes the bound auditable) are now formalized in the Ouroboros Thesis paper family v1 → v10 (Section 7).

---

## 3. Platform Surface — Live Today (refreshed)

The platform runs as **seven customer-facing product surfaces** orchestrated by a single decision-intelligence layer (A11oy), with a hardened Decision Fabric query substrate exposing cross-primitive views inside each surface.

### A11oy — Orchestration + Decision Intelligence + Trust Plane

Slug: `/a11oy/`

A11oy is the orchestration control plane and the decision-intelligence surface. It registers agents, applies validator policy, gates approvals, and is where operators monitor and govern bounded-loop runs across every vertical. Since the May 3 briefing, A11oy has gained:

- **Argo** (`/a11oy/argo`, `/argo-bridge`) — an experience-era decision engine. Champion policies (6 live), self-play arena with replay playback, mirror evaluation, counterfactual rollouts, reward-hacking guardrails, world-model accuracy at 89.1%, throughput 31.4 ev/s.
- **PSYCHE** — emergent-sentience observatory; tracks behavioral signals and self-modeling metrics across the agent fleet.
- **Trust Center** (`/trust-center`) — the constitutional surface; proof, covenants, and attestation in one place.
- **Trust Exchange** + **Public Trust Portal** (`/trust-exchange`, `/public-trust-portal`) — the externally-facing proof-distribution surface.
- **Agent Zero Trust** (`/agent-zero-trust`) — runtime policy gate for every agent action; backed by the live agent-gateway service.
- A live Claude Sonnet 4.6 advisor at `/a11oy/chat` (introduced in v1 of this dossier; still operational).

### Sentra — Cyber Resilience Command (codename TENAX)

Slug: `/sentra/`

Continuous threat-posture monitoring, evidence packs, risk-tier escalation gates wired into the runtime contract. Since May 3, Sentra has shipped a **governed adversary loop** (`/sentra/governed-adversary-loop`) that emits a six-step proof chain through A11oy, plus a KORA cyber-resilience trust feed that publishes threat posture into the Trust Plane.

### Amaru — Convergent Reverse-ETL (codename Conduit)

Slug: `/conduit/`

Append-only delta log, hash-verified ingest, three-witness reconciliation primitive (Frustum) from the Ouroboros Thesis. Since May 3, Amaru shipped **ten original innovations beyond the GitHub field of competing reverse-ETL tools** (catalogued under the "Conduit one-of-one" engineering pass). The dashboard throughput chart was rewired from a hard-coded clock to `Date.now()` so the rolling window never freezes.

### Terra — Real Estate Intelligence (codename DOMAINE)

Slug: `/terra/`

Distressed-property discovery, ownership analysis, pipeline management, deal execution. NYC and NYS data live. Since May 3: synthetic confidence/escalation columns were removed from the property-detail tenant table; banner stacking on narrow viewports fixed.

### Vessels — Maritime Intelligence (codename SEXTANT)

Slug: `/vessels/`

Positions, voyage economics, compliance, exception management. Sanctions screening and dark-vessel detection. Since May 3: footer cleaned of personal links; "Updated 12s ago" date-rot replaced with a live AIS-feed indicator.

### Counsel — Legal Matter Command

Slug: `/counsel/`

Matters, obligations, and legal exposure surfaced as a command surface. Policy-gated human review, evidence-bound recommendation, citation-verified output. Since May 3: a synthetic "SEC Filing Deadline" injection was removed; the empty-state now renders honestly when there is no real data.

### Carlota Jo — Concierge Advisory Operations

Slug: `/carlota-jo/`

Premium service brand for individuals who require precision and discretion. Proof-Chain decision-receipts bound to the runtime. Since May 3: full **competitive-intel and ML-forecast module**, deeper A11oy mesh integration, command-palette navigation rewritten to be `BASE_URL`-aware across all 23 commands; invented "847 enterprise contracts" sample exchange removed; intake `timeline: TBD` default replaced with honest copy.

### Decision Fabric — Cross-Primitive Query Layer (substrate, not a separate surface)

The Decision Fabric is a governed read layer that joins signal, recommendation, policy, simulation, execution, proof, and outcome under a single correlation ID. Schema: `lib/db/src/schema/decision_fabric.ts`. API namespace: `/api/decision-fabric`. It is consumed by every customer-facing surface (KORA → Carlota Jo) and is the integration point for the CPS standard (Section 5). It is not itself a customer-facing product surface.

---

## 4. The Six Platform Primitives (unchanged)

| Primitive | What it does |
|---|---|
| **Outcome Graph** | Every action is a node; every cause is an edge. The graph is the system of record for "what did we actually decide and why." |
| **Proof Chain** | Every output carries a hash chain back to the inputs and the human who approved each gated step. |
| **Covenant Policy** | Declarative policy that decides which actions are auto-allowed, which require human approval, and which are forbidden. |
| **Decision Simulation** | Decisions can be replayed against historical state to test policy changes before they ship. |
| **Workflow Engine** | The bounded-loop scheduler that runs the five stages of the governed command layer. |
| **Event Fabric (PRISM Bus)** | The append-only event spine. Everything that happens publishes here. |

---

## 5. Covenant Proof Standard (CPS) — new in v2

CPS is a payload-and-receipt standard the platform now exposes as a first-class API. Every cross-vertical workflow can be packaged as a CPS payload, executed against a tenant, and resolved through a tiered approval ladder with auditable rollback.

| Endpoint | Behavior |
|---|---|
| `GET /api/cps/payloads` | List registered payloads |
| `GET /api/cps/payloads/:id` | Resolve a payload definition |
| `POST /api/cps/runs` | Execute a payload run |
| `GET /api/cps/runs/:id` | Inspect a run, its proof receipts, and approval state |
| `POST /api/cps/runs/:id/approve` | Approve a gated step at the caller's tier |
| `POST /api/cps/runs/:id/rollback` | Roll a completed run back to a prior verified state |
| `POST /api/cps/payloads/:id/maturity` | Promote/demote a payload's maturity mode |

Three flagship payloads ship with the standard. They cover the cross-domain shape investors and procurement officers care about most: incident → governed action → audit close.

The CPS layer is exposed per-vertical through the Decision Fabric query namespace; each lane (Vessels, Terra, Counsel, Carlota Jo) renders its CPS payloads inside its existing surface as those payloads come online.

---

## 6. Verified Platform Numbers (re-verified May 5, 2026)

Every number below was produced by re-running the documented verification command in `SOURCE_OF_TRUTH.md`. No estimation.

| Metric | Verified value | Δ vs May 3 |
|---|---|---|
| Registered artifacts (artifact.toml files) | 9 | unchanged |
| Customer-facing product surfaces (live) | **7** orchestrated by the A11oy layer | unchanged |
| Database tables (live, provisioned) | 848 | unchanged |
| API endpoint declarations | 5,524 | unchanged |
| Industry verticals | 7 | unchanged |
| Monorepo packages (`packages/` + `lib/`) | 126 | unchanged |
| DB schema files | 170 | unchanged |
| CI workflows | 23 | unchanged |
| Declared environment variables | 213 | unchanged |
| Platform primitives | 6 | unchanged |
| RBAC roles | 11 | unchanged |
| Ouroboros runtime test calls | 133 | unchanged |
| Codex-kernel test calls | 29 | unchanged |
| Ouroboros packages (`@workspace/ouroboros-*`) | **28** | new disclosure |
| Ouroboros guardrails tests passing | **62** | new disclosure |
| Formal axes in the Lutar invariant family | **9** | new disclosure |
| Codex v11 nodes / typed edges | **76 / 95** across 11 domains | new disclosure |

Numbers will continue to drift as the platform grows. The discipline is that they are re-verified by command, not estimated. This is a contracting hygiene point, not a marketing one.

---

## 7. Public Proof — refreshed

Three artifacts are public on GitHub today, all under `szl-holdings`, all with verifiable history:

### Ouroboros Runtime (open source)

- Repository: `https://github.com/szl-holdings/ouroboros`
- Latest release: **v6.2.0** — "v4 validator FUNCTIONS (runnable)"
- Tests, dependabot, CodeQL, SECURITY.md.

### Ouroboros Thesis (DOI-pinned, multi-paper)

Repository: `https://github.com/szl-holdings/ouroboros-thesis`

| Paper | Title | Pages | Released | DOI |
|---|---|---|---|---|
| **v3-2.0.0** | The Lutar Invariant (axiomatic trust aggregator, audit-supported rewrite) | — | 2026-05-02 | `10.5281/zenodo.19983066` |
| **v9-1.0.0** | The Lutar Invariant Family v1 → v7 → Ω: From Three-Term Foundation to Bianchi-Closed Fiber Bundle | 17 | 2026-05-05 | minted via Zenodo webhook on tag re-fire |
| **v10-1.0.0** | The Audit Closure Operator Λ₁₀: Formalising the Implementation Contract of the Lutar Family | 11 + Appendix A essay + Lutar-family one-pager | 2026-05-05 | minted via Zenodo webhook on tag re-fire |

License: CC-BY-4.0 (academic distribution). ORCID: `0009-0001-0110-4173`.

The May 2 release was an audit-supported rewrite that explicitly retracted a prior version after a self-audit identified residual fabrications in announcement materials. The v9 → v10 sequence is the next step in that discipline: v10's only purpose is to audit v9's implementation chain and certify, layer by layer, that every formula in v9 actually executes against the live shipping repo. **No new physical L-term is introduced in v10.** It is a meta-invariant on v9.

### Live LaaS API (Lutar-as-a-Service)

`POST /api/ouroboros/lutar/v10` runs the v10 audit closure operator against the live shipping repo on every test run; result is a typed object backing the `lutar_v10` codex node. This is the operational binding from paper to production.

---

## 8. Government Contracting Alignment (refreshed)

The work appears to align with five areas of increasing federal and state demand. These are alignment statements, not claims of past performance.

### Operational transparency and auditability

The Outcome Graph and Proof Chain primitives answer the question every IG, every audit committee, and every Congressional oversight letter eventually asks: "show your work." CPS makes the answer interoperable across systems.

### Cybersecurity and risk management

Sentra is the customer-facing surface. The deeper architectural fit is that the runtime treats every action as a security event by default — logged, signed, replayable. The new governed adversary loop demonstrates this end-to-end across Sentra ↔ A11oy in a six-step proof chain.

### AI governance and responsible automation

Covenant Policy gates AI outputs. The new live agent gateway enforces OPA policy at the runtime boundary; Argo's reward-hacking guardrails and mirror eval close the loop on "is the policy actually working." Relevant to OMB M-24-10 and the NIST AI RMF.

### Cross-system interoperability and data lineage

Amaru (convergent reverse-ETL) plus the three-witness reconciliation primitive (Frustum) gives a defensible answer to "single trusted view of state across N systems." The ten new innovations from the Conduit one-of-one pass extend this beyond what the open-source field offers today.

### Auditable AI proof distribution

The Trust Plane (Trust Center, Trust Exchange, Public Trust Portal) is the externally-facing surface for distributing proof packets to regulators, auditors, and partner systems. CPS payloads + Trust Plane = a procurement-grade distribution contract for proof-of-decision evidence.

---

## 9. What SZL Holdings Is Not Claiming (unchanged)

- SZL Holdings is **not currently performing on any federal contract**.
- SZL Holdings has **not received a federal cloud authorization**, an ATO, or any DoD impact-level designation.
- SZL Holdings has **not been audited by an outside firm**.
- SZL Holdings has **no signed customer contracts** for the platform itself at this writing.
- SZL Holdings is **a single-founder operation** (Stephen Lutar). There is no team to misrepresent.
- The numbers in section 6 are **internal platform metrics** — they describe what has been built, not revenue or users.

The strength of the position is the public proof and the verifiable runtime, not pretended traction.

---

## 10. Suggested Discussion for May 6 (unchanged priorities)

In priority order:

1. **NYS pathway.** OGS centralized contract? On-call advisory pool? Subcontract / mentor-protégé under a NYS prime?
2. **Federal pathway.** SBIR Phase I as the fastest credible entry point? GSA MAS via a sponsoring contract holder? Sources-sought response in AI governance / continuous-monitoring?
3. **Registration sequence.** SAM.gov UEI, CAGE, NAICS selection, small-business size standard, set-aside eligibility review, NYS Vendor Responsibility Questionnaire — order and realistic timelines.
4. **Capability statement format.** What NYS and federal procurement officers actually want on the page.
5. **Realistic targeting.** Which agencies actually buy this kind of work, and which buy it from sole-founder firms.

---

## 11. Documents Attached

- This briefing (`dossier/v2/APEX_v2_Operational_Briefing.md`).
- Investor pitch deck (`dossier/v2/APEX_v2_Investor_Pitch_Deck.md`).
- Business proposal (`dossier/v2/APEX_v2_Business_Proposal.md`).
- Meeting script (`dossier/v2/APEX_v2_Meeting_Script.md`).
- Live demo guide (`dossier/v2/APEX_v2_Live_Demo_Guide.md`).
- Capability statement (`dossier/v2/APEX_v2_Capability_Statement.md`).
- Audit delta May 4 → May 5 (`dossier/v2/APEX_v2_Audit_Delta_May5.md`).
- Dossier index (`dossier/v2/APEX_v2_DOSSIER_INDEX.md`).
- Live screenshots of each product surface (`dossier/screenshots/`).
- Ouroboros Thesis v3 / v9 / v10 PDFs (Zenodo + GitHub Releases).
- `SOURCE_OF_TRUTH.md` and `audit/source-of-truth.json` audit trail in the platform repository.

---

## 12. Closing

The premise has not changed. Governed AI cognition will be a procurement requirement before long, not a procurement preference. Two days of additional shipping made the proof denser: a second peer-style paper, a third (the audit closure paper), a CPS standard, a live agent gateway, four new Trust-Plane surfaces, a hardened Decision Fabric query layer across the seven verticals, and a documented investor demo path that runs the proof spine end-to-end.

The May 6 conversation remains about how to get this in front of buyers responsibly.

Thank you for the time.

— Stephen Lutar
   Founder, SZL Holdings
   stephenlutar2@gmail.com
