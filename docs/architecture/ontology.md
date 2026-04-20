# Ontology — SZL Holdings Platform (Canonical)

**Version:** 1.0 | **Date:** April 2026 | **Status:** Canonical

> **Navigation:** [architecture.md](architecture.md) · [policy-model.md](policy-model.md) · [telemetry-model.md](telemetry-model.md) · [app-moats.md](app-moats.md)
>
> **Code:** `packages/ontology` — typed entity, entity-link, entity-snapshot, and signal definitions.

---

## Purpose

This document is the single source of truth for what entities, signals, links, and snapshots mean across the SZL platform. Every package that emits, stores, or reasons about these concepts must use the types exported from `packages/ontology` or derive from them. Divergence from this vocabulary is a bug.

---

## Core Entity Types

Entities are the named objects the platform tracks, governs, and reasons about. All entities share a base shape:

```ts
interface BaseEntity {
  id: string;
  entityType: EntityType;
  orgId: string;
  domain: Domain;
  label: string;
  confidence: number;         // 0..1 — how certain we are about this entity's state
  freshness: FreshnessLevel;  // live | recent | stale | expired
  policyState: PolicyState;   // cleared | conditional | blocked | flagged | pending
  createdAt: Date;
  updatedAt: Date;
  sourceRef?: string;         // originating signal or connector reference
  evidence?: EvidenceRef[];   // supporting evidence records
}
```

### Platform-wide Entity Types

| EntityType | Description | Primary Domain |
|-----------|-------------|---------------|
| `signal` | Raw or normalized data point indicating a state change | All |
| `recommendation` | AI-generated advisory with reasoning chain, evidence, confidence | All |
| `action` | Human-confirmed response to a finding or recommendation | All |
| `approval` | Human-in-the-loop gate required before consequential action | All |
| `workflow` | Structured sequence of steps with approval gates and SLA tracking | All |
| `evidence` | Verifiable artifact supporting a control claim or approval decision | All |
| `outcome` | Recorded result of a workflow, action, or business process | All |
| `policy` | Governance rule defining required behavior or approval requirements | All |
| `audit_event` | Immutable record of any actor action or system state change | All |
| `agent_run` | A bounded execution of an AI agent with full trace capture | All |

### Domain-specific Entity Types

| EntityType | Description | Domain |
|-----------|-------------|--------|
| `vessel` | Maritime vessel with IMO, flag, AIS position, and sanctions status | `vessels` |
| `voyage` | Maritime journey with ports, cargo, financial model, risk profile | `vessels` |
| `property` | Real estate asset with ownership graph and distress signals | `terra` |
| `deal` | Commercial opportunity with stages, value, counterparty | `terra` |
| `incident` | Active security or operational event requiring triage | `security` |
| `threat` | Identified adversarial signal with indicators and attribution | `security` |
| `matter` | Legal or advisory engagement with client, counsel, and deadlines | `counsel` |
| `engagement` | Advisory client engagement with deliverables and billing | `carlota` |
| `brief` | AI executive briefing document with evidence and freshness stamp | `pulse` |
| `org` | Organization (tenant) with configuration and entitlement | `platform` |
| `agent` | Registered AI agent with capabilities, policy constraints, trust score | `platform` |
| `model` | AI model version with performance profile and eval history | `platform` |

---

## Domains

```ts
type Domain =
  | "platform"    // cross-cutting governance, identity, billing
  | "vessels"     // maritime intelligence
  | "terra"       // real estate intelligence
  | "security"    // defense, threat, incident response (Aegis)
  | "counsel"     // legal matter management (Counsel / prism-counsel)
  | "carlota"     // advisory and client portal (Carlota Jo)
  | "pulse"       // AI executive briefing
  | "command"     // unified command operations
  | "lyte"        // business observability (planned flagship)
  | "sentra";     // (planned) new domain pack — TBD operational vertical
```

### Domain → Artifact / Status Map

| Domain | Status | Artifact | Product Name |
|--------|--------|----------|-------------|
| `platform` | Active | `artifacts/api-server` (shared) | SZL Holdings Platform |
| `vessels` | Active | `artifacts/vessels` | Vessels |
| `terra` | Active | `artifacts/terra` | Terra |
| `security` | Active | surfaces in `artifacts/szl-holdings`, `artifacts/command` | Aegis (security domain) |
| `counsel` | Planned | (planned artifact — may absorb `prism-counsel`) | Counsel |
| `carlota` | Active | `artifacts/carlota-jo` | Carlota Jo |
| `pulse` | Active | `artifacts/pulse` | Pulse |
| `command` | Active | `artifacts/command` | Command |
| `lyte` | Planned | (planned — currently in `artifacts/szl-holdings`) | Lyte |
| `sentra` | Planned | (no artifact yet) | Sentra |

---

## Freshness Levels

Freshness describes how current the data backing an entity or recommendation is. Every entity and every signal carries a `FreshnessLevel`. UI surfaces must never display stale or expired data without a visible indicator.

```ts
type FreshnessLevel =
  | "live"      // data is streaming or < 5 minutes old
  | "recent"    // data is < 1 hour old
  | "stale"     // data is 1–24 hours old; show degradation indicator
  | "expired";  // data is > 24 hours old; treat as unreliable
```

**Rule:** Evidence, freshness, and confidence metadata must never be stripped when passing entities between packages or serializing to the API. If a consumer does not need these fields, it must still preserve them for downstream consumers.

---

## Confidence

Confidence is a `number` in `[0, 1]` representing how certain the system is about an entity's state, a recommendation's validity, or a signal's accuracy. Confidence is always explicitly stated — never assumed to be high.

| Range | Interpretation | UI treatment |
|-------|---------------|--------------|
| `0.90–1.00` | High — system is highly confident | Green indicator |
| `0.70–0.89` | Medium — reasonable confidence, some uncertainty | Amber indicator |
| `0.50–0.69` | Low — significant uncertainty, human review recommended | Orange indicator |
| `< 0.50` | Very low — treat as hypothesis, not fact | Red indicator |

---

## Policy State

Every entity and recommendation carries a `PolicyState` indicating whether it has passed policy evaluation.

```ts
type PolicyState =
  | "cleared"     // evaluated and permitted
  | "conditional" // permitted with conditions (e.g. escalation logged)
  | "blocked"     // denied by policy
  | "flagged"     // requires human review before proceeding
  | "pending";    // policy evaluation not yet complete
```

---

## Entity Links

Entity links describe typed relationships between entities. Every link carries directionality, confidence, and a freshness stamp.

```ts
interface EntityLink {
  id: string;
  fromEntityType: EntityType;
  fromEntityId: string;
  toEntityType: EntityType;
  toEntityId: string;
  linkType: EntityLinkType;
  confidence: number;
  freshness: FreshnessLevel;
  orgId: string;
  domain: Domain;
  createdAt: Date;
  evidence?: EvidenceRef[];
}

type EntityLinkType =
  | "triggers"        // signal → recommendation
  | "supports"        // evidence → recommendation
  | "approved_by"     // action → approval
  | "part_of"         // voyage → vessel
  | "related_to"      // generic association
  | "caused_by"       // outcome ← action
  | "escalated_to"    // approval → higher approver
  | "supersedes"      // new recommendation → old recommendation
  | "correlated_with" // cross-domain signal correlation
  | "owned_by"        // deal → org
  | "assigned_to";    // action → agent / user
```

---

## Entity Snapshots

An entity snapshot captures the full state of an entity at a specific point in time. Snapshots are used by the Proof Chain, Replay Core, and the Learning loop to reconstruct context.

```ts
interface EntitySnapshot<T extends BaseEntity = BaseEntity> {
  snapshotId: string;
  entityType: EntityType;
  entityId: string;
  orgId: string;
  domain: Domain;
  capturedAt: Date;
  capturedBy: "system" | "agent" | "human";
  reason: SnapshotReason;
  entity: T;
  policyVersion: string;    // frozen policy version at capture time
  simulationRef?: string;   // linked Monte Carlo simulation run (if any)
}

type SnapshotReason =
  | "pre_action"    // captured before a consequential action
  | "post_action"   // captured after a consequential action
  | "scheduled"     // periodic freshness check
  | "triggered"     // triggered by an event or signal
  | "replay";       // captured for incident replay
```

---

## Signals

Signals are the raw inputs that flow into the canonical nine-step loop. Every signal is typed, domain-scoped, and carries a freshness timestamp and confidence estimate.

```ts
interface Signal {
  id: string;
  signalType: SignalType;
  domain: Domain;
  orgId: string;
  severity: SignalSeverity;
  confidence: number;
  freshness: FreshnessLevel;
  source: SignalSource;
  payload: Record<string, unknown>;
  correlationId: string;   // propagated through all downstream artifacts
  emittedAt: Date;
  expiresAt?: Date;
  entityRef?: { entityType: EntityType; entityId: string };
}

type SignalSeverity = "critical" | "high" | "medium" | "low" | "info";

type SignalSource =
  | "ais_feed"          // AIS maritime telemetry
  | "stix_taxii"        // Threat intelligence feeds
  | "sanctions_list"    // OFAC / UN / EU / UK sanctions
  | "court_record"      // Legal database (CourtListener)
  | "property_registry" // Property and lien records
  | "market_feed"       // Financial / market data
  | "internal_event"    // Platform-generated event
  | "agent_output"      // AI agent-generated signal
  | "human_input"       // Operator-submitted signal
  | "webhook";          // External webhook integration

type SignalType =
  // Vessels
  | "ais_dark"              // vessel went dark (AIS off)
  | "ais_position"          // vessel position update
  | "sanctions_hit"         // entity matched sanctions list (vessels, security, counsel)
  | "voyage_anomaly"        // route or voyage deviation
  | "port_arrival"          // vessel arrived at port
  | "cargo_discrepancy"     // cargo manifest anomaly
  // Terra
  | "distress_filing"       // property distress signal
  | "ownership_change"      // property ownership graph change
  | "lien_filed"            // lien recorded against property
  | "tax_delinquency"       // tax delinquency indicator
  | "foreclosure_filing"    // foreclosure action filed
  // Security
  | "threat_indicator"      // IOC from threat feed
  | "cve_published"         // new CVE relevant to org
  | "incident_detected"     // security incident signal
  | "ttp_observed"          // MITRE ATT&CK TTP observed
  // Counsel
  | "court_filing"          // new court document
  | "matter_deadline"       // upcoming legal deadline
  | "settlement_offer"      // settlement offer received
  // Platform
  | "policy_violation"      // agent or action violated policy
  | "freshness_degraded"    // entity freshness dropped below threshold
  | "agent_drift"           // agent output quality degraded
  | "cross_domain_alert"    // correlation across domains
  | "approval_overdue"      // approval request past SLA
  | "workflow_stalled";     // workflow step not progressing
```

---

## Evidence References

Evidence references link recommendations and actions to the source material that supports them. This is the key to traceable autonomy — every claim has a receipt.

```ts
interface EvidenceRef {
  evidenceId: string;
  label: string;
  sourceType: EvidenceSourceType;
  url?: string;
  extractedAt: Date;
  confidence: number;
  freshness: FreshnessLevel;
}

type EvidenceSourceType =
  | "ais_record"
  | "sanctions_entry"
  | "court_document"
  | "property_record"
  | "threat_feed_entry"
  | "audit_log_entry"
  | "simulation_result"
  | "agent_output"
  | "human_annotation"
  | "external_api_response";
```

---

## Entity Type Coverage Matrix

This table shows which products have dedicated entity types in `packages/ontology` now vs. relying on shared/platform types.

| Product / Domain | Status | Dedicated Entity Types | Relies on Platform Types |
|------------------|--------|----------------------|--------------------------|
| **Platform** | Active | `signal`, `recommendation`, `action`, `approval`, `workflow`, `evidence`, `outcome`, `policy`, `audit_event`, `agent_run`, `org`, `agent`, `model` | — |
| **Vessels** | Active | `vessel`, `voyage` | `signal`, `recommendation`, `action`, `approval`, `evidence`, `audit_event` |
| **Terra** | Active | `property`, `deal` | `signal`, `recommendation`, `action`, `approval`, `evidence`, `audit_event` |
| **Security (Aegis)** | Active | `incident`, `threat` | `signal`, `recommendation`, `action`, `approval`, `evidence`, `audit_event` |
| **Counsel** | Planned | `matter` | `signal`, `recommendation`, `action`, `approval`, `evidence`, `audit_event` |
| **Carlota Jo** | Active | `engagement` | `signal`, `recommendation`, `action`, `evidence`, `audit_event` |
| **Pulse** | Active | `brief` | `signal`, `recommendation`, `evidence`, `audit_event` |
| **Command** | Active | _(none yet — maps to platform types)_ | all platform types |
| **Lyte** | Planned | _(none yet — maps to platform types)_ | all platform types |
| **Sentra** | Planned | _(none yet — maps to platform types)_ | all platform types |

> **Intention:** Command, Lyte, and Sentra deliberately have no dedicated entity types in the foundation phase. They will gain domain-specific entity types when their product scope is defined. This is intentional and not a gap.

---

## Code–Doc Alignment

`packages/ontology` is the **code-authoritative** source. This document is the **human-readable spec**. The code may define additional enum values beyond what this document describes — this is the **sanctioned "code superset" behavior**:

- **Extra link types** (e.g. `resolved_by`, `blocked_by`, `monitors`) — these are implementation-level link variants not requiring their own doc section unless they become semantically significant.
- **Extra snapshot reasons** (e.g. `calibration`) — operator-triggered snapshot reasons for internal use.
- **Extra signal sources** (e.g. specific integration classes) — the doc covers the source _categories_; code may enumerate specific providers.

**When alignment is required:** If a change in code _removes_ a value claimed in this doc, or _adds_ a value that carries policy, compliance, or inter-team integration implications, the doc must be updated. The contract tests in `packages/ontology/src/test/contract.test.ts` enforce upward coverage (all doc-claimed values exist in code). Run them with `pnpm --filter @workspace/ontology test`.

---

## Source of Truth

All TypeScript types described in this document are authoritatively defined in `packages/ontology/src/`. Consumers import from `@workspace/ontology`. The `packages/atlas-core` package defines the ATLAS Enterprise State Model, which maps to a subset of these types and is considered compatible.

When in doubt: `packages/ontology` > `packages/atlas-core` > anything else.

---

*See also: [packages/ontology/](packages/ontology/) · [packages/atlas-core/src/](packages/atlas-core/src/) · [telemetry-model.md](telemetry-model.md)*
