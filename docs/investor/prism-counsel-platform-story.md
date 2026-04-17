# Prism Counsel — Platform Story

> **DEPRECATED:** PRISM Counsel has been retired and its capabilities consolidated into the Aegis legal workspace. This document is preserved for historical reference only.

**Audience:** Investors, Strategic Partners  
**Date:** April 2026

---

## The Platform Thesis

Prism Counsel is not a legal AI assistant. It is an intelligence and execution infrastructure layer for legal practices.

The distinction matters for the investment thesis. A legal AI assistant is a feature — it makes attorneys faster at specific tasks. Intelligence and execution infrastructure is a platform — it changes how a practice is run, creates structural stickiness, and builds a data advantage that compounds over time.

The platform story has three components: the infrastructure that makes it possible, the domain depth that makes it valuable, and the distribution path that makes it scalable.

---

## Component 1: The Infrastructure (Why This Is a Platform, Not a Feature)

Prism Counsel is built on Alloy — SZL Holdings' orchestration and control plane. Alloy provides:

- **Model mesh** — 7-lane AI routing with circuit breakers, fallback chains, and per-tenant configuration. Not a single model call. A governed AI execution fabric.
- **Proof Chain** — Every AI output is anchored to an immutable, SHA-256-hashed audit record with source references, model version, confidence score, and review state. This is not a feature — it is the architecture.
- **Permission-aware retrieval** — Retrieval is scoped by org, matter, role, and privilege state. Not a shared search index. A controlled information access system.
- **Review and approval workflow** — AI outputs cannot be exported until an attorney has reviewed and approved them. This gate is enforced at the data layer, not the UI layer.
- **Audit trail** — Every action — AI call, human review, approval, export, connector sync — is logged as an immutable event. The audit trail is operational infrastructure, not a compliance artifact.

This infrastructure took significant time to build correctly. It is not replicated by stitching together OpenAI + Pinecone + a review form. The circuit breaker logic, the ACL retrieval, the proof chain integrity verification, the multi-lane routing with fallback — these are the hard parts.

Any new entrant to the legal AI space has to build this infrastructure or operate without it. Operating without it means not serving enterprise law firms, which require exactly this governance posture.

Prism Counsel has it. The cost to replicate is 12-18 months of engineering time and significant architectural discipline.

---

## Component 2: The Domain Depth (Why This Is Valuable)

The platform infrastructure is necessary but not sufficient. The domain layer is what makes Prism Counsel valuable to NY plaintiff-side litigation practices specifically.

**The Pressure Graph** is a 12-dimension scoring engine built on years of understanding of how plaintiff-side insurance matters move. The dimensions — deadline pressure, insurer response behavior, adjuster changes, coverage disputes, venue dynamics, evidence completeness, communication cadence, settlement friction — are not generic "legal intelligence." They are specific to the NY insurance litigation practice pattern.

**The Forecast Engine** produces 7 matter-level forecasts that are directly actionable: insurer response latency, offer movement likelihood, settlement friction, review bottleneck, approval lag, lien drag, quiet risk. These are not vanity metrics — they are the specific signals a plaintiff attorney needs to manage a portfolio of 50-200 active matters.

**The Worldline Engine** enriches internal matter data with external signals: NYC crash data, NWS weather, NY DFS insurance complaints, NY court records, CMS lien context. This is the kind of contextual enrichment that was previously only available to large firms with dedicated legal intelligence teams.

**The Copilot modes** are not generic AI chat. They are purpose-built for the specific questions attorneys ask: pre-mediation readiness, carrier communication analysis, coverage dispute analysis, settlement strategy, deadline monitoring. The system prompts, the context assembly, and the source grounding requirements are all domain-specific.

This domain depth is the moat. It takes years of subject matter work to build the right dimensions, the right signal classes, the right worldline sources. A new entrant with the same infrastructure but without the domain model would produce generic AI outputs that don't answer the questions NY plaintiff attorneys actually have.

---

## Component 3: The Distribution (Why This Is Scalable)

**M365 distribution** — 80%+ of U.S. law firms with 100+ attorneys run on Microsoft 365. Prism Counsel deploys a native connector for SharePoint, Outlook, and Teams. The M365 connector means documents flow automatically — no manual upload discipline required. The Teams agent means attorneys can query Prism Counsel from where they already work.

This is not a feature. It is a distribution wedge. The onboarding friction for an M365 law firm is close to zero — they are already running the infrastructure Prism Counsel plugs into.

**The data flywheel** — As Prism Counsel processes more matters, the baseline models for carrier behavior, venue velocity, and outcome correlation improve. This advantage grows with usage and is not replicable by a new entrant without the matter volume.

**The review workflow as habit formation** — Once attorneys are reviewing and approving AI outputs through the Prism Counsel workflow, the platform is embedded in their daily practice. The review habit creates a high switching cost that compounds over time.

**The platform expansion path** — NY no-fault and auto injury is the wedge. The expansion plays — other NY matter types, other states, defense side, enterprise legal ops — all run on the same infrastructure with domain configuration additions. Expansion is not a rebuild. It is a configuration and data problem on a proven platform.

---

## The Positioning

Prism Counsel is positioned as the **AI governance and intelligence infrastructure** for plaintiff-side insurance litigation.

This positioning is deliberate. It is not "AI assistant for lawyers" — that category is crowded and undifferentiated. It is not "case management software" — that category is established and legacy. It is "the platform that makes your AI usage of matter intelligence accountable, auditable, and strategically valuable."

This is where the market is heading and where Prism Counsel is already positioned.

---

## Summary: Why Prism Counsel Is a Platform, Not a Product

| Dimension | Feature product | Platform |
|-----------|---------------|---------|
| Core value | Makes tasks faster | Changes how the practice operates |
| Data advantage | None | Compounds with usage |
| Switching cost | Low | High (embedded in workflows) |
| Expansion path | Difficult | Configuration + domain layer |
| Governance posture | Ad hoc | Architectural |
| M365 integration | Bolt-on | Native |
| AI accountability | Optional | Enforced |
| Revenue model | Per-seat | Per-matter (tied to business value) |

Prism Counsel is a platform. That is the investment thesis.

---

*See also:*
- *[Why Now](prism-counsel-why-now.md)*
- *[Wedge and Expansion](prism-counsel-wedge-expansion.md)*
- *[Solution Brief](../buyer/prism-counsel-solution-brief.md)*
