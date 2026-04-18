# SZL Holdings — Domain Pack Standard

**Purpose:** Define how vertical domain packs inherit the signal/policy/action/governance architecture — ensuring every pack is consistent, composable, and compounding.

**Status:** Specification — for implementation reference
**As of:** April 2026

---

## What Is a Domain Pack?

A **Domain Pack** is a vertical intelligence extension built on the SZL platform architecture. It provides domain-specific observation, reasoning, and action routing — while inheriting the shared execution fabric (Alloy), design system, authentication model, and state model.

Current domain packs:
- **Aegis** — Defense & Intelligence (cybersecurity, SOC, MSP operations)
- **Vessels** — Maritime Intelligence (fleet operations, voyage economics, compliance)
- **Terra** — Real Estate Intelligence (distressed properties, deal pipeline)

The domain pack standard defines what every pack must implement, what it may customize, and what it must not override.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN PACK LAYER                       │
│  Domain Observation → Domain Inference → Domain Actions     │
├─────────────────────────────────────────────────────────────┤
│                   ALLOY EXECUTION LAYER                     │
│  Signal Routing → Policy Gate → Execution → Proof → Learning  │
├─────────────────────────────────────────────────────────────┤
│                  SZL PLATFORM LAYER                         │
│  Entity Model · Event Schema · Auth · Design System · DB    │
└─────────────────────────────────────────────────────────────┘
```

A domain pack lives entirely in the top layer. The Alloy execution layer and SZL platform layer are shared infrastructure — domain packs may not modify or bypass them.

---

## Required Pack Components

Every domain pack must implement the following:

### 1. Signal Ingestion Layer

**What it does:** Acquires domain-specific data and translates it into the canonical Signal schema.

**Requirements:**
- Each ingestion source has a registered `source_type` (e.g., `ais_feed`, `cisa_kev`, `nyc_open_data`)
- All signals conform to the canonical Signal schema (see `docs/STATE_MODEL.md`)
- Signal ingestion is idempotent — duplicate signals from the same source are deduplicated by `source_id + timestamp`
- Ingestion errors are logged and surfaced as `signal_type: system_error` signals
- Signal enrichment (adding context from entity graph) happens before routing to inference

**Implementation path:** `lib/observability/` + domain-specific ingestion adapters

---

### 2. Domain Entity Registry

**What it does:** Maintains the domain's entity model — the specific things the domain observes (vessels, assets, properties, incidents).

**Requirements:**
- Domain entities extend the base Entity type from `docs/STATE_MODEL.md`
- Every entity has a `domain_type` field (e.g., `vessel`, `security_asset`, `property`)
- Entities are registered in the shared entity graph at creation
- Cross-domain entity links are supported (e.g., a vessel that is also a sanctioned entity)

**Implementation path:** `lib/db/src/schema/` — domain-specific schema files extending shared base

---

### 3. Policy Registry

**What it does:** Defines the domain-specific policies that govern what actions are permitted in response to domain signals.

**Requirements:**
- Every domain pack must ship with a default policy set for its primary signal types
- Policies are registered in the shared Policy Registry (Alloy's policy engine)
- Policies must specify: trigger conditions, permitted actions, required approvals, prohibited actions, and escalation path
- Enterprise tenants may customize policies within their workspace scope
- Policy changes are versioned and logged to the Decision Ledger

**Policy file format:** JSON or TypeScript policy definitions in `packages/policies/src/<domain>/`

---

### 4. AI Agent Module

**What it does:** Provides domain-specific reasoning on top of the shared AI infrastructure.

**Requirements:**
- Domain agents are registered in the Agent Registry (`lib/ai-engine/`)
- Each agent has: `agent_id`, `domain`, `model_id`, `policy_scope`, `action_scope`, and `eval_dataset_id`
- Agents must produce outputs conforming to the Inference schema (see `docs/STATE_MODEL.md`)
- Every inference includes: confidence score, reasoning chain, evidence references, and policy references
- Agents are evaluated against their eval dataset before production promotion (see `docs/AGENT_EVAL_AND_REPLAY.md`)
- Agents may not propose actions outside their registered `action_scope`

**Implementation path:** `lib/ai-engine/agents/<domain>/`

---

### 5. Action Playbook Library

**What it does:** Defines the domain-specific actions that can be proposed and executed.

**Requirements:**
- Every action type has a registered playbook in Alloy's action registry
- Playbooks define: action name, required parameters, execution handler, expected outcomes, and rollback procedure
- Actions must be idempotent where possible
- Every action execution is logged to the Decision Ledger
- "Consequential" actions (those with irreversible effects) must require explicit human approval

**Action classification:**

| Classification | Approval Required? | Examples |
|---|---|---|
| `informational` | No | Send alert, update dashboard, generate report |
| `advisory` | No | Post recommendation to Command Inbox |
| `operational` | Yes (operator) | Hold voyage approval, escalate incident, pause workflow |
| `consequential` | Yes (senior) | Sanctions flag submission, regulatory notification, vessel hold |
| `irreversible` | Yes (executive) | Permanent record submission, blacklist entry |

---

### 6. Business Journey Mapping

**What it does:** Maps domain entity events to business journey stages.

**Requirements:**
- Every domain pack must define at least one Journey Template (see `docs/BUSINESS_JOURNEY_MODEL.md`)
- Journey stages must be mapped to domain-specific technical events
- Revenue at risk and friction scores must be calculable from domain signal data
- Cross-domain journey links must be supported for signals that affect journeys in other domains

---

### 7. Domain UI Module

**What it does:** Provides the domain-specific user interface built on the shared design system.

**Requirements:**
- All UI components use `@workspace/shared-ui` as the base
- Navigation follows the platform hierarchy (domain pack nav items extend Lyte's command surface nav)
- Status badges follow the GA/Beta/Internal standard (see `docs/GA_BETA_INTERNAL_STATUS.md`)
- AI-generated content must carry visible "AI-assisted" labels per platform messaging rules
- Demo/seed data must carry visible "Demo Data" banners
- Mobile-responsive layout required for all primary views
- All text and labels must conform to the Platform Message Architecture (see `docs/PLATFORM_MESSAGE_ARCHITECTURE.md`)

---

### 8. API Contract

**What it does:** Exposes domain data and actions through the shared API server.

**Requirements:**
- All domain routes are registered under `/api/<domain>/` prefix
- OpenAPI documentation is required for all public routes
- Authentication is handled by the shared auth middleware — domain packs do not implement their own auth
- RBAC is enforced per domain action type using the shared role middleware
- Zod validation is required on all POST/PUT/PATCH routes
- Rate limiting is applied at the API server level — domain packs do not re-implement it

---

## What Domain Packs May Customize

| Component | Customizable? | Constraints |
|---|---|---|
| Signal schema extensions | Yes | Must extend, not replace, the canonical Signal schema |
| Policy rules | Yes | Must register in shared Policy Registry |
| AI model parameters | Yes | Must pass eval gate before production |
| UI layout and domain views | Yes | Must use shared-ui components |
| Journey templates | Yes | Must conform to Journey schema |
| Action playbooks | Yes | Must register in Alloy action registry |

## What Domain Packs May NOT Override

| Component | Why |
|---|---|
| Authentication and session model | Shared security posture |
| Decision Ledger write path | Immutability and audit integrity |
| Approval gate enforcement | Human-in-the-loop is architectural |
| Proof chain structure | Cross-domain provenance requires consistent format |
| Database schema base types | Shared entity model is the cross-domain intelligence layer |
| Design system base tokens | Brand and UX consistency |

---

## New Domain Pack Checklist

Before a new domain pack is considered ready for Beta status, it must have:

- [ ] Signal ingestion layer implemented and tested
- [ ] Domain entity schema registered in shared DB
- [ ] Minimum one policy set registered in Alloy
- [ ] AI agent registered with eval dataset and eval run passing ≥ 0.85
- [ ] Minimum one action playbook with approval classification
- [ ] Business journey template defined for primary entity type
- [ ] UI built on shared-ui with status labeling
- [ ] API routes documented in OpenAPI
- [ ] Zod validation on all mutation routes
- [ ] Seed data available for demo mode
- [ ] Entry in `docs/GA_BETA_INTERNAL_STATUS.md`
- [ ] Entry in `docs/PRODUCT_MATRIX.md`

---

*Adherence to this standard is what makes the SZL platform compound — every new domain pack strengthens the shared entity graph, enriches the cross-domain intelligence layer, and adds to the defensibility of the platform.*
