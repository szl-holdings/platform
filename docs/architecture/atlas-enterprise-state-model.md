# ATLAS Enterprise State Model

**Version:** 1.0  
**Date:** April 2026  
**Status:** Canonical — active implementation reference

---

## Purpose

ATLAS is the shared vocabulary of operational reality across the SZL Holdings platform. It defines the canonical entity types, relationships, event taxonomy, and metadata contracts that every domain pack (Lyte, Aegis, Terra, Vessels, Carlota Jo) maps onto. Without ATLAS, cross-domain intelligence is impossible — a maritime anomaly and a security incident cannot be connected to the same business outcome unless they share a common entity graph and event schema.

---

## Design Principles

**Explicit over implicit.** Every entity carries its source, confidence, and attribution. Nothing in ATLAS is assumed.

**Temporal by default.** Every entity has a history. State changes are tracked, not overwritten.

**Human gate for consequential actions.** Approval is an ATLAS primitive, not an optional feature. The `approval` entity cannot be skipped at the schema level.

**Cross-domain by design.** Entity IDs are globally unique (UUID v4). Cross-domain relationships are first-class, not foreign key hacks.

**Policy binding on everything.** Any entity can be bound to one or more policies. Governance is structural, not middleware.

---

## Package Structure

```
packages/
├── atlas-core/          @szl-holdings/atlas-core
│   ├── src/primitives.ts     — Base entity, all 14 primitive types with Zod schemas
│   ├── src/domain.ts         — 6 domain-specific case types
│   ├── src/validation.ts     — Discriminated union validators, cross-domain relationships
│   └── src/index.ts          — All exports + entity descriptions
│
├── atlas-types/         @szl-holdings/atlas-types
│   └── src/index.ts          — Convenience re-export of all types from atlas-core
│
└── atlas-events/        @szl-holdings/atlas-events
    ├── src/taxonomy.ts       — Full event name constants by domain
    ├── src/contracts.ts      — Envelope schema, routing rules, retention policy
    └── src/index.ts          — All exports
```

---

## Core Primitives

ATLAS defines 14 primitive entity types used across all platforms:

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| **Signal** | A raw or normalized observation requiring attention | severity, status, confidence, source, PRISM dimension |
| **Event** | An immutable record of something that happened | eventType, actor, target, correlationId, immutable flag |
| **Risk** | An identified threat with likelihood and impact | riskLevel, riskScore, mitigationPlan, residualRisk |
| **Opportunity** | A positive business prospect worth capturing | status, estimatedValue, probability, closeDate |
| **Control** | A preventive or detective measure that mitigates risk | controlType, effectiveness, automationLevel, evidence |
| **Workflow** | A structured execution sequence with approval gates | status, priority, approvalRequired, SLA tracking |
| **Recommendation** | An AI advisory with reasoning and evidence chain | confidence, evidenceChain, generatedBy, modelId |
| **Action** | A human-confirmed response to a finding | executor, approvedBy, rollbackAvailable |
| **Approval** | A human-in-the-loop gate — cannot be bypassed | requiredApprovers, quorumRequired, humanGateRequired |
| **Evidence** | A verifiable artifact supporting a claim | evidenceType, hash, hashAlgorithm, verifiedBy |
| **Outcome** | The recorded result of a workflow or action | outcomeType, measuredValues, targetValues, sloMet |
| **Policy** | A governance rule with enforcement mode | policyType, enforcementMode, scope, rules |
| **KPI** | A performance indicator tracking progress | currentValue, targetValue, thresholds, trend |
| **SLO** | A service level objective with error budget | target, errorBudgetRemaining, burnRateHourly |

---

## Domain-Specific Entity Types

Each domain pack introduces one or more entity types that extend the base entity schema:

| Entity | Domain | Description |
|--------|--------|-------------|
| **Case** | All (generic) | A bounded event requiring triage and resolution |
| **Matter** | Carlota Jo / Legal | A legal or advisory engagement with billing scope |
| **Mission** | Aegis | A defense or intelligence operation with command structure |
| **Deal** | Terra / Vessels / Carlota Jo | A commercial transaction with stages and counterparty |
| **Voyage** | Vessels | A maritime journey with cargo, financials, and sanctions |
| **Incident** | Aegis / Lyte | An active security or operational event requiring response |

---

## Shared Entity Metadata

Every ATLAS entity — primitive or domain-specific — carries:

```typescript
{
  id: string;               // UUID v4 — globally unique, canonical
  atlasVersion: string;     // Schema version for migration tracking
  createdAt: DateTime;
  updatedAt: DateTime;
  tenantId: string;         // Multi-tenant isolation
  domain: AtlasDomain;      // Which domain pack owns this entity
  ownership?: {             // Who is responsible
    ownerId, ownerType, organizationId, delegateTo, assignedAt
  };
  history?: {               // Full temporal change log
    timestamp, field, previousValue, newValue, changedBy, reason
  }[];
  sources?: {               // Source attribution with confidence
    sourceId, sourceType, confidence, collectedAt, verifiedBy
  }[];
  businessImpact?: {        // Business consequence quantification
    financialImpactUsd, operationalImpact, reputationalRisk,
    complianceRisk, affectedEntities, sloImpact
  };
  policies?: {              // Policy bindings
    policyId, policyName, appliedAt, enforcedBy, overridable
  }[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}
```

---

## Cross-Domain Relationships

Entity relationships are explicit, typed, and tracked:

```typescript
type AtlasCrossDomainRelationship = {
  id: string;               // UUID
  fromEntityType: string;
  fromEntityId: string;
  toEntityType: string;
  toEntityId: string;
  relationshipType:
    | "triggers"            // Signal triggers Workflow
    | "caused_by"           // Incident caused_by Vulnerability
    | "mitigates"           // Control mitigates Risk
    | "relates_to"          // Any loose association
    | "escalates_to"        // Case escalates_to Mission
    | "parent_of"           // Workflow parent_of SubWorkflow
    | "child_of"
    | "precedes"            // Action precedes Outcome
    | "follows"
    | "supersedes"          // Policy supersedes OldPolicy
    | "evidences"           // Evidence evidences Control
    | "references";
  tenantId: string;
  createdAt: DateTime;
  metadata?: Record<string, unknown>;
};
```

---

## Event Taxonomy

ATLAS events follow a hierarchical naming pattern: `domain.subject.verb`

### Event Domains

| Domain Prefix | Covers |
|--------------|--------|
| `business.*` | Transactions, risks, opportunities, KPIs, SLOs, anomalies, signals |
| `security.*` | Threats, incidents, vulnerabilities, IOCs, controls, playbooks |
| `maritime.*` | Vessel positions, voyages, ports, sanctions, fleet health |
| `real_estate.*` | Properties, distress signals, deals, market signals |
| `legal.*` | Matters, documents, billing, deadlines |
| `ai.*` | Recommendations, inference, model evaluation, agent tasks, governance |
| `workflow.*` | Lifecycle events, approvals, SLA tracking |
| `platform.*` | Tenancy, feature flags, health, deployments |
| `auth.*` | Login, session, MFA, access control, role changes |
| `billing.*` | Subscriptions, payments, invoices, trials |

### Key Business Events

```
business.transaction.started / completed / failed / reversed
business.risk.detected / escalated / mitigated / accepted
business.opportunity.identified / qualified / won / lost
business.kpi.threshold_breached / target_met
business.slo.burn_rate_high / breached / recovered
business.anomaly.detected / confirmed / dismissed
business.signal.ingested / processed / expired
```

### Key Security Events

```
security.threat.detected / confirmed / neutralized / escalated
security.incident.created / triaged / contained / recovered / closed
security.vulnerability.discovered / patched
security.ioc.detected / blocked
security.control.tested / failed / remediated
security.playbook.triggered / completed / failed
```

---

## Event Envelope Contract

Every event published on the platform must conform to this envelope:

```typescript
type AtlasEventEnvelope<T> = {
  metadata: {
    eventId: string;          // UUID
    eventName: string;        // e.g. "business.risk.detected"
    eventVersion: string;     // "1.0"
    occurredAt: DateTime;
    publishedAt: DateTime;
    domain: AtlasDomain;
    tenantId: string;

    actor: {
      actorId, actorType, displayName, role
    };

    workflowId?: string;
    correlationId?: string;
    causationId?: string;

    entityIds?: {
      primaryId, primaryType, relatedIds
    };

    businessValue?: {
      financialImpactUsd, operationalSeverity, affectedUsers
    };

    slaImpact?: {
      sloId, slaDeadline, slaAtRisk, slaBreached
    };

    environment: "development" | "staging" | "production";
    sourceService?: string;
    schemaVersion: "atlas-events/1.0";
  };
  payload: T;
};
```

---

## Event Retention Policy

| Event Pattern | Retention |
|--------------|-----------|
| `auth.*` | 365 days |
| `security.incident.*` | 7 years (2555 days) |
| `security.*` | 1 year |
| `business.*` | 2 years |
| `maritime.*` | 2 years |
| `real_estate.*` | 3 years |
| `legal.*` | 7 years |
| `ai.*` | 1 year |
| `workflow.*` | 2 years |
| `billing.*` | 7 years |
| `platform.*` | 180 days |

---

## Migration Guide

### Mapping Existing Domain Entities to ATLAS

Each domain pack currently has its own internal data model. When integrating with ATLAS, the following mapping pattern applies:

#### Step 1 — Identify the ATLAS entity type

| If your domain entity is... | Map to ATLAS type |
|----------------------------|-------------------|
| A data observation, metric alert, or feed item | `signal` |
| A timestamped audit record | `event` |
| A threat, compliance gap, or exposure | `risk` |
| A potential deal, revenue event, or positive lead | `opportunity` |
| A policy enforcement mechanism | `control` |
| A multi-step operational task | `workflow` |
| An AI model output | `recommendation` |
| A human-executed response | `action` |
| A human decision gate | `approval` |
| A compliance artifact or proof | `evidence` |
| A result recorded after completion | `outcome` |
| A rule that governs behavior | `policy` |
| A business metric | `kpi` |
| A reliability target | `slo` |
| A domain-bounded investigation | `case` / `incident` |
| A legal engagement | `matter` |
| A maritime journey | `voyage` |
| A commercial transaction | `deal` |
| A defense operation | `mission` |

#### Step 2 — Add ATLAS base fields

```typescript
import { BaseEntitySchema } from "@szl-holdings/atlas-core";

const yourEntity = {
  ...existingFields,
  id: uuid(),                          // replace internal ID
  atlasVersion: "1.0.0",
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
  tenantId: org.id,
  domain: "aegis",                     // which domain pack
  ownership: {
    ownerId: currentUser.id,
    ownerType: "human",
    assignedAt: isoTimestamp,
  },
  sources: [{
    sourceId: "internal",
    sourceType: "system",
    confidence: 0.95,
    collectedAt: isoTimestamp,
  }],
};
```

#### Step 3 — Replace domain event names with ATLAS event names

```typescript
// Before:
emit("aegis:threat_found", { threatId });

// After:
import { SECURITY_EVENTS, createEventEnvelope } from "@szl-holdings/atlas-events";

publish(createEventEnvelope(SECURITY_EVENTS.THREAT_DETECTED, payload, {
  domain: "aegis",
  tenantId: org.id,
  actor: { actorId: "sentinel-agent", actorType: "agent" },
  occurredAt: new Date().toISOString(),
  entityIds: { primaryId: threatId, primaryType: "risk" },
}));
```

#### Step 4 — Register cross-domain relationships

```typescript
import type { AtlasCrossDomainRelationship } from "@szl-holdings/atlas-core";

const relationship: AtlasCrossDomainRelationship = {
  id: uuid(),
  fromEntityType: "signal",
  fromEntityId: signal.id,
  toEntityType: "incident",
  toEntityId: incident.id,
  relationshipType: "triggers",
  tenantId: org.id,
  createdAt: new Date().toISOString(),
};
```

#### Step 5 — Validate your entity

```typescript
import { validateAtlasEntity } from "@szl-holdings/atlas-core";

const result = validateAtlasEntity(yourEntity);
if (!result.success) {
  logger.error({ errors: result.errors }, "Entity does not conform to ATLAS schema");
}
```

---

## Domain Pack Conformance Checklist

For a domain pack to be considered ATLAS-conformant:

- [ ] All domain entities extend `BaseEntitySchema` with the required base fields
- [ ] All events are published using the ATLAS event envelope (`AtlasEventEnvelopeSchema`)
- [ ] Event names use the canonical ATLAS taxonomy (e.g., `security.incident.created`)
- [ ] Cross-domain relationships are registered in the relationship store
- [ ] Entity IDs are UUID v4 and globally unique
- [ ] Confidence scores are in the range [0, 1]
- [ ] Temporal history is populated for all mutations
- [ ] Source attribution is populated for all signals and AI outputs
- [ ] Business impact is populated for high/critical severity entities
- [ ] Policy bindings are populated where governance applies
- [ ] Human approval is required (not optional) for consequential workflow actions

---

## Usage

```bash
# Install packages
pnpm add @szl-holdings/atlas-core
pnpm add @szl-holdings/atlas-types    # convenience re-exports
pnpm add @szl-holdings/atlas-events   # event taxonomy + envelope
```

```typescript
import type { AtlasSignal, AtlasWorkflow, AtlasApproval } from "@szl-holdings/atlas-types";
import { validateAtlasEntity, ATLAS_ENTITY_TYPES } from "@szl-holdings/atlas-core";
import { SECURITY_EVENTS, createEventEnvelope, ATLAS_ALL_EVENTS } from "@szl-holdings/atlas-events";
```

---

*See also:*
- *[System Overview](system-overview.md) — Platform architecture*
- *[Platform Map](platform-map.md) — Domain topology*
- *[Data Flow](data-flow.md) — Signal-to-action flow*
- *`packages/atlas-core/src/` — TypeScript source*
- *`packages/atlas-events/src/taxonomy.ts` — Full event list*
