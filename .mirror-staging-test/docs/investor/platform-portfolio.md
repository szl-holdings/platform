# SZL Holdings — Platform Portfolio

**Date:** Q1 2026

---

## Portfolio Overview

SZL Holdings operates a unified ecosystem of five domain platforms sharing one intelligence backbone, one execution fabric, one design system, and one data layer. This is not a portfolio of unrelated products — it is a compounding system where each platform strengthens the architectural investment shared by all.

---

## Lyte — Business Observability

**Category:** Business Observability  
**Layer:** Observe / Decide / Act  
**Readiness:** Functional Alpha  

The flagship platform and operating wedge. Lyte makes every operational surface visible, contextual, and actionable through the PRISM framework.

**PRISM Dimensions:**
- **Pulse** — Business health, operating heartbeat, trend status
- **Risk** — Approvals, churn, delays, ownership gaps, regulatory exposure
- **Intelligence** — Modeled reasoning, evidence, confidence, likely outcomes
- **Signals** — Anomalies, changes, event spikes, workflow drift
- **Motion** — Escalations, routing, approvals, interventions, execution

**Capability highlights:**
- Command Inbox with signal lifecycle management
- Action Queue with priority routing and SLA tracking
- Approvals Center with latency detection
- Ownership Map and escalation routing
- Readiness Module with organizational health scoring
- 40+ connector integrations
- Role-aware dashboards (exec, ops, compliance, maintenance)
- Alloy integration: every Lyte signal can become an Alloy workflow

**Strategic position:** Operating wedge. The primary commercial entry point. Establishes the Business Observability category.

---

## Alloy — Execution Fabric

**Category:** Execution Orchestration  
**Layer:** Execute  
**Readiness:** Functional Alpha  

Alloy is the shared connective tissue of the entire ecosystem. When any platform surfaces a signal worth acting on, Alloy routes the action.

**Capability highlights:**
- Workflow engine: structured action creation, routing, completion tracking
- Human-in-the-loop gates: required approval for consequential operations (cannot be bypassed in code)
- Immutable audit trail: full attribution chain from signal to outcome
- Agent coordination: governs the advisory agent network across the ecosystem
- Cross-platform: single Alloy instance serves all platforms

**Strategic position:** Not sold standalone. Embedded in Lyte. Becomes visible to buyers as the governance and accountability layer.

---

## Aegis — Unified Defense & Intelligence

**Category:** Cybersecurity & Defense Intelligence  
**Layer:** Observe / Respond  
**Readiness:** Functional Alpha  

Enterprise cybersecurity and managed services command. Three unified workspaces sharing one intelligence context.

**Three workspaces:**
1. **Defense** — SOC operations, MITRE ATT&CK v14 coverage, SOAR playbook engine, STIX/TAXII protocol layer
2. **Command** — MSP operations, client SLA management, multi-tenant client oversight
3. **Intelligence** — AI research (INCA), model registry, experiment tracking, LLM governance

**Capability highlights:**
- Sentinel AI agent for threat analysis and triage
- FedRAMP readiness track (Phase 4 roadmap)
- INCA model governance — experiment tracking, ensemble evaluation
- MSP Command: managed services operations for security providers

**Strategic position:** Defense vertical with a distinct MSP revenue path through the Command module.

---

## Terra — Real Estate Intelligence

**Category:** Real Estate Intelligence  
**Layer:** Observe / Underwrite  
**Readiness:** Functional Alpha  

Property intelligence for NYC brokers, investors, and portfolio teams.

**Live data pipeline:**
- NYC HPD records (housing violations, complaints)
- NYC DOF records (tax liens, assessment data)
- NYC DOB records (building permits, violations)
- ACRIS records (deed transfers, mortgage filings)
- NYC ECB records (environmental control board violations)

**Capability highlights:**
- Distress signal scoring with contributing factor breakdown
- Ownership structure tracking (beneficial ownership through LLC chains)
- Interactive property map (Mapbox GL JS)
- Deal pipeline management via Alloy
- Market signal intelligence

**Strategic position:** Real estate vertical with a live data pipeline. Demonstrates the platform's ability to aggregate public data into actionable commercial intelligence.

---

## Vessels — Maritime Intelligence

**Category:** Maritime Intelligence  
**Layer:** Track / Analyze  
**Readiness:** Functional Alpha  

Fleet command for maritime operators.

**Capability highlights:**
- AIS telemetry integration (vessel position, speed, heading, port calls)
- Voyage economics modeling (cost per nautical mile, ETA accuracy)
- Dark vessel detection (AIS signal gap analysis)
- Sanctions screening (OFAC, UN, EU, UK)
- Route intelligence and weather analysis
- Exception Center with consequence modeling
- Helmsman AI agent for maritime intelligence

**Strategic position:** High-stakes buyer profile (enterprise shipping, insurance, government, commodity trading). Highest potential contract value per customer.

---

## Carlota Jo — Private Advisory

**Category:** Private Advisory  
**Layer:** Advise  
**Readiness:** Public Beta Candidate  

Principal-led advisory on brand strategy, operations, and executive engagement.

**Capability highlights:**
- Web platform: service catalog, luxury brand positioning, inquiry workflow
- Native mobile client (Expo/React Native): client engagement, discreet communication
- Advisory grounded in platform intelligence — not intuition-only
- Demonstrates the advisory model that every platform vertical can eventually support

**Strategic position:** Demonstrates the Advise layer of the ecosystem. Revenue model is advisory retainer — different from the SaaS platforms, but validates the full stack.

---

## Portfolio Leverage

The compounding value of this portfolio:

| Investment | Benefits | Platforms |
|-----------|----------|----------|
| `@workspace/shared-ui` | One component library, consistent premium aesthetic | All 7 web, all 7 mobile |
| `@workspace/db` + Drizzle | One schema, one migration system, one query layer | All platforms |
| `@workspace/auth` | OIDC PKCE + RBAC built once | All platforms |
| `@workspace/workflow-engine` | Alloy execution fabric built once | All platforms |
| `@workspace/audit` | Immutable event log built once | All platforms |
| `@workspace/ai-engine` | Multi-LLM inference layer built once | All platforms |
| Azure Bicep IaC | One infrastructure template family | All enterprise deployments |

The marginal cost of adding a new platform vertical to this ecosystem is dramatically lower than building a standalone product — because the infrastructure investment has already been made.
