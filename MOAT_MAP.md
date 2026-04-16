# Moat Map — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026  
**Audience:** Series A investors, strategic advisors, enterprise evaluators  
**Classification:** Confidential — NDA required

> This document defines the eight structural moats of the SZL Holdings platform — the architectural and network properties that compound in value over time and are difficult to replicate without years of accumulated context.

---

## Overview

SZL Holdings is not defensible because of a feature advantage. It is defensible because of the structural properties that compound with use. Each moat described below:

1. Is grounded in a specific technical or architectural capability
2. Grows stronger with time, usage, and data accumulation
3. Is difficult to replicate because it requires accumulated context that cannot be shortcut by building faster

The eight moats operate independently and reinforce each other. A new entrant would need to replicate all eight simultaneously to match the platform's structural position.

---

## Moat 1: Decision Memory

**The accumulation of every governed decision ever made in the platform.**

### What It Is

The Outcome Graph (`@szl-holdings/outcome-graph`) tracks the full lifecycle of every recommendation: the signal that triggered it, the agent that proposed it, the human who decided on it, and the outcome that resulted. Every domain pack writes to the same graph.

As the platform accumulates decisions — across domains, across organizations, across time — it builds a structured memory of what kinds of recommendations get accepted, what actions produce good outcomes, and where confidence scores are systematically over or under-calibrated.

### Why It Compounds

- **Month 1:** An agent makes recommendations based on static priors.
- **Month 6:** The agent is calibrated against hundreds of real decision outcomes. Its confidence scores reflect actual organizational behavior.
- **Year 2:** The platform has decision memory across multiple domains and thousands of operators. No new entrant can replicate this data — it requires real decisions with real outcomes.

### Evidence in Codebase

- `lib/outcome-graph/` — core library
- `recordRecommendation()`, `recordDecision()`, `recordOutcome()`, `triggerLearningJob()` — full decision lifecycle operations
- `getOutcomeStats()` — acceptance rate, achievement rate, override frequency per agent/domain/role
- Outcome data feeds directly into `@szl-holdings/monte-carlo` for simulation calibration

### Replication Cost

A competitor would need years of real governed decisions with outcome tracking to achieve equivalent calibration. You cannot synthetic-generate this data — it requires real operators making real decisions with real consequences.

---

## Moat 2: Proof and Provenance

**An immutable, cryptographically verifiable audit trail for every consequential action.**

### What It Is

The Proof Chain (`@szl-holdings/proof-chain`) generates a complete, verifiable record of every significant platform action. AI recommendations carry model identity, source citations, retrieval provenance, confidence scores, and export safety status. The chain is immutable — entries cannot be modified or deleted after creation.

### Why It Compounds

Proof Chain is an **enterprise switching cost**. Once an organization's decision history lives in the SZL proof chain, migrating that history to another platform is technically complex and legally fraught. Regulators, auditors, and compliance officers rely on the continuity of the chain.

In regulated industries (finance, maritime, legal, defense), an unbroken audit chain has direct regulatory value. Each month of operations adds to an evidence library that the enterprise cannot simply abandon.

### Evidence in Codebase

- `lib/proof-chain/` — core library
- `tagAIContent()`, `reviewProof()`, `assertExportSafe()`, `getProofChain()` — key operations
- `isExportSafe()` — guard used before all client-facing document generation
- Source classification: `llm_generated`, `human_authored`, `system_computed`, `external_ingested`, `hybrid`
- Export safety states: `safe`, `restricted`, `pending_review`, `blocked`
- Surfaced in PRISM Counsel proof chain viewer, Alloy governance audit, all domain pack trust pages

### Replication Cost

A competitor can build a logging system quickly. They cannot replicate the accumulated proof history of an organization that has been running on the platform for 18 months. The chain's value is in its continuity — a gap in the chain is a compliance problem.

---

## Moat 3: Covenant Policy and Governance Infrastructure

**An enterprise-grade policy engine that enforces human-in-the-loop governance at the platform layer.**

### What It Is

The Covenant Policy engine (`@szl-holdings/covenant-policy`) defines and enforces what agents and users can do, under what conditions, with what approval requirements. Human-in-the-loop is not a UI pattern — it is a policy constraint enforced before any consequential action executes.

### Why It Compounds

**Policy accumulation:** Every enterprise customer configures their policy layer over time — approval thresholds, role-specific constraints, domain-specific regulatory requirements. This configuration represents organizational intelligence that is costly to rebuild on a new platform.

**Compliance moat:** As regulatory environments tighten (EU AI Act, SEC AI governance, financial services AI rules), having a provably compliant, human-gated AI system becomes a strategic differentiator. The SZL policy engine is architecturally compliant by design — not retrofitted.

**Trust with regulators:** Organizations that can demonstrate to a regulator that their AI cannot execute consequential actions without human approval — at the policy layer, not just the UI — have a structural compliance advantage.

### Evidence in Codebase

- `lib/covenant-policy/` — core library
- `checkPermission()`, `assertPermission()`, `createApprovalRequest()`, `reviewApproval()` — key operations
- `COVENANT_POLICY_TEMPLATES` — pre-defined policy sets for common governance scenarios
- Decision outcomes: `permit`, `deny`, `escalate`
- Enforced by workflow-engine at every approval gate
- Cannot be bypassed by UI or direct API call — enforced in the middleware chain

### Replication Cost

A competitor can add an "approval button" to their UI. They cannot replicate the structural policy engine that governs agents at the library layer and is wired into every domain pack. Building this from scratch takes 12–18 months of engineering.

---

## Moat 4: Decision Simulation

**Monte Carlo probabilistic simulation before action — baked into every consequential decision.**

### What It Is

The Monte Carlo engine (`@szl-holdings/monte-carlo`) runs thousands of probabilistic trials before a recommendation is presented to the operator. The operator sees not just "what to do" but "what could happen if we do it" — with confidence intervals, sensitivity analysis, and scenario comparison.

### Why It Compounds

**Domain scenario library:** The platform ships with pre-built simulation scenarios for each domain (`AEGIS_CYBER_RISK`, `VESSELS_VOYAGE_COST`, `TERRA_DEAL_RETURN`, `PRISM_SETTLEMENT_RANGE`). These are calibrated over time using real outcome data from the Outcome Graph.

**Calibration depth:** A simulation engine calibrated against thousands of real decisions in a specific domain (e.g., maritime voyage P&L) is significantly more accurate than one running on generic priors. Calibration depth is a direct function of decision volume.

**Operator dependency:** Once operators make decisions informed by simulation results, they become dependent on that intelligence. Switching to a platform without simulation requires accepting worse decision quality.

### Evidence in Codebase

- `lib/monte-carlo/` — core library
- `runSimulation()`, `computeSensitivity()`, `calibrate()`, `DOMAIN_SCENARIO_LIBRARY` — key operations
- Distribution support: Normal, LogNormal, Uniform, Triangular, PERT, Discrete, Custom empirical
- Results feed `outcome-graph` entries as evidence for recommendations
- Historical outcomes calibrate future simulations (closed-loop calibration)

### Replication Cost

A competitor can implement a Monte Carlo engine. They cannot replicate the domain-specific calibration that comes from thousands of real governed decisions. The simulation is only as good as its calibration data.

---

## Moat 5: Observability Correlation

**Cross-domain signal correlation that surfaces intelligence no single-domain tool can produce.**

### What It Is

The Event Fabric (PRISM Bus, `@szl-holdings/prism-bus`) is the cross-domain signal backbone. It normalizes events from all domain sources into a common format and enables cross-domain correlation — a sanctions hit in Vessels can surface a legal risk flag in PRISM Counsel, which can trigger a policy escalation in Lyte, which appears as an approval request in CORTEX.

### Why It Compounds

**Network of signals:** Each domain pack added to the platform adds a new signal source to the event fabric. The correlation value grows nonlinearly with the number of domains. With six domain packs, the platform can surface intelligence that no single-domain tool can produce.

**Cross-domain context:** A maritime operator who uses both Vessels and PRISM Counsel gets intelligence (sanctions hit → legal risk) that a maritime-only tool cannot provide. This cross-domain value is only available to customers who are invested in multiple domain packs.

**Signal history:** Cross-domain correlation is more powerful when the platform has a history of correlated signals. A new event is understood in the context of past events — patterns that took months to accumulate cannot be bootstrapped.

### Evidence in Codebase

- `lib/prism-bus/` — core library
- `publish()`, `subscribe()`, `publishAndWait()` — event operations
- Event types: `domain_signal`, `cross_domain_correlation`, `workflow_triggered`, `approval_requested`, `policy_decision`, `execution_started`, `execution_completed`
- Command Portal 8-domain SSE dashboard surfaces cross-domain signals in real-time
- PRISM Bus enables: Vessels sanctions → PRISM Counsel case check → Lyte risk flag

### Replication Cost

A competitor building a single-domain tool cannot offer cross-domain correlation — by definition. A platform competitor would need to build equivalent domain packs and accumulate equivalent signal history simultaneously.

---

## Moat 6: Agent Gateway

**A governed, role-enforced, audit-logged gateway for AI agents operating across all domains.**

### What It Is

The MCP gateway (`/api/mcp`) provides a structured, standards-based interface for AI agents to access platform capabilities. 23 tools, 4 resources, and 5 prompt templates. Every agent call is role-enforced, tenant-scoped, and audit-logged. No agent has a bypass.

### Why It Compounds

**Standard interface for AI agents:** As AI agent usage grows in enterprise (via LangChain, AutoGPT, Claude, GPT-4 Agents), the platform becomes the governed execution environment for those agents. The gateway becomes an integration point that customers wire into their existing AI workflows.

**Tool library depth:** Each domain pack adds domain-specific tools to the MCP gateway. The value of the gateway grows with the depth of the tool library — more domain packs means more agent capabilities, all governed by the same policy engine.

**Agent trust:** Enterprise IT departments face increasing pressure to govern AI agent activity. The SZL MCP gateway is the only one in its category with full role enforcement, tenant isolation, and immutable audit logging. This is a compliance requirement, not a feature preference.

### Evidence in Codebase

- `lib/mcp-client/` — MCP client library
- `artifacts/api-server/src/routes/` — MCP gateway route handlers
- 23 tools, 4 resources, 5 prompt templates via `/api/mcp`
- Tool classes: public read, tenant read, analysis, workflow trigger, approval action, admin-only
- Agent identity: agents present session tokens, subject to same RBAC as human users
- All MCP invocations recorded in immutable audit trail

### Replication Cost

Building an MCP server is possible in weeks. Building a governed, role-enforced, multi-domain MCP gateway with 23 tools across 6 domain packs — with audit logging, tenant isolation, and approval gate integration — requires the full platform stack underneath it.

---

## Moat 7: Domain-Pack Extensibility

**An architectural model that adds governance to new domains without rebuilding the governance infrastructure.**

### What It Is

A domain pack is not a separate product — it is a governed extension of the shared platform. A domain pack contributes signal sources, analysis models, action vocabulary, and UI surfaces. It inherits the full governance infrastructure: Proof Chain, Covenant Policy, Outcome Graph, Monte Carlo, Workflow Engine, Event Fabric, RBAC, CORTEX mobile command, and the API server.

### Why It Compounds

**Marginal cost of new domains decreases over time:** Each domain pack added to the platform requires less governance engineering because the infrastructure is already built and proven. The marginal cost of Domain Pack 7 is significantly lower than Domain Pack 1.

**Cross-domain compounding:** Each new domain pack adds signal sources and correlation opportunities for all existing domain packs. Adding IMPERIUM (cloud) creates new signals that Aegis (security) and Lyte (operations) can consume.

**Customer land-and-expand:** A customer who enters through Vessels (maritime) and discovers that PRISM Counsel adds legal intelligence to their sanctions workflow is a natural expansion target. The governance infrastructure is already in place — the conversation is about adding signal sources, not rebuilding systems.

### Evidence in Codebase

- Domain pack structure: signal source integration → domain agent → domain UI surface → shared primitive inheritance
- Current domain packs: Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM (in dev)
- Shared from platform: `@szl-holdings/shared-ui`, `@szl-holdings/db`, `@szl-holdings/auth`, `@szl-holdings/workflow-engine`, `@szl-holdings/audit`, `@szl-holdings/ai-engine`
- Domain packs in `artifacts/`: `aegis/`, `vessels/`, `terra/`, `carlota-jo/`
- 37 shared packages that every domain pack inherits

### Replication Cost

A single-domain tool cannot offer this. A multi-domain platform competitor would need to build the same governance infrastructure and accumulate the same domain-specific signal depth. The architecture takes years to design and validate across six domains.

---

## Moat 8: Enterprise Trust Infrastructure

**A buyer-facing trust layer that reduces procurement friction in regulated industries.**

### What It Is

Enterprise buyers in regulated industries (finance, maritime, legal, defense) require answers to specific questions before procurement: Who approved this AI output? Can we audit every decision? Is our data isolated from other tenants? Does your AI have human approval gates?

SZL Holdings has built these answers into the architecture — not into marketing materials. The Trust Center, Proof Chain, Covenant Policy, RBAC model, and multi-tenant isolation are all inspectable, implementable, and verifiable by enterprise security teams.

### Why It Compounds

**Procurement history:** Each enterprise customer that completes diligence and deploys the platform creates a reference architecture that accelerates the next customer's procurement. The trust infrastructure gets more credible with each customer that has validated it.

**Regulatory positioning:** As AI governance regulations tighten (EU AI Act, executive orders, sector-specific rules), the SZL platform's structural compliance becomes a strategic differentiator. Competitors that retrofit governance after deployment cannot match the structural confidence of an architecture built around it from day one.

**Trust center as a sales tool:** The buyer-facing trust center at `/trust-center` surfaces security posture, AI governance, access control model, and compliance roadmap. This reduces security review cycles from months to weeks.

### Evidence in Codebase

- `TRUST_CENTER_INDEX.md` — trust documentation index
- `docs/trust/` — trust center, security posture, deployment model, privacy boundaries
- `ACCESS-CONTROL-MATRIX.md` — full RBAC documentation
- `SECURITY-CHECKLIST.md` — security controls mapped to implementation
- `KNOWN-GAPS.md` — transparent gap registry (itself a trust signal)
- Trust center pages: `/trust-center`, `/trust/security`, `/trust/governance`, `/trust/ai`
- Product trust pages: `/solutions/aegis/trust`, `/solutions/vessels/trust`, etc.

### Replication Cost

Publishing a security page is easy. Building a trust infrastructure that enterprise security teams can actually inspect — with real RBAC documentation, real gap registries, real audit trail implementation, and real compliance control mapping — requires the full platform stack and a track record of honesty about gaps.

---

## Moat Interaction Map

The eight moats compound each other:

```
Decision Memory ──────────────► Calibrates Monte Carlo (Moat 4)
                 ◄────────────── More decisions = better calibration

Proof Chain ──────────────────► Enables Enterprise Trust (Moat 8)
                                 Switching cost: audit history

Covenant Policy ─────────────► Powers Agent Gateway (Moat 6)
                                 Agents governed by same policy layer

Event Fabric ────────────────► Powers Observability Correlation (Moat 5)
                                 More domain packs = more correlation

Domain Extensibility ────────► Enables all other moats to compound
                                 Each new domain adds decision data,
                                 proof history, signal correlation,
                                 and agent tools simultaneously
```

A platform that compounds on five dimensions simultaneously across eight structural advantages is not a feature roadmap — it is an architectural position.

---

## Related Documents

| Document | Path |
|----------|------|
| Platform primitives | [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) |
| Category positioning | [CATEGORY_POSITIONING.md](CATEGORY_POSITIONING.md) |
| Proof and policy model | [PROOF_AND_POLICY_MODEL.md](PROOF_AND_POLICY_MODEL.md) |
| Investor narrative | [INVESTOR_NARRATIVE.md](INVESTOR_NARRATIVE.md) |
| Technical diligence | [TECHNICAL_DILIGENCE_PACKET.md](TECHNICAL_DILIGENCE_PACKET.md) |

---

*Last verified against source code: 2026-04-16.*
