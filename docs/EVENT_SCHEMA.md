# SZL Holdings — Canonical Event Schema

**Purpose:** Define the canonical business and technical event schema — the shared event vocabulary across all SZL platform domains.

**Status:** Specification — for implementation reference
**As of:** April 2026

---

## Overview

Every significant occurrence on the SZL platform is an **event**. Events are the foundation of the platform's observability model — they power signal generation, audit trails, proof chains, and cross-domain intelligence.

The canonical event schema ensures that events from any domain pack (Vessels, Aegis, Terra, Lyte) can be understood, correlated, and stored in a shared event store. Domain packs extend the base schema with domain-specific fields but never replace the canonical fields.

---

## Base Event Schema

Every event, regardless of domain, must conform to this base schema:

```json
{
  "$schema": "https://szlholdings.com/schemas/events/v1/base",
  "event_id": "evt_f4a2c9...",
  "event_type": "string",
  "event_category": "string",
  "domain": "string",
  "occurred_at": "2026-04-16T14:23:11.000Z",
  "recorded_at": "2026-04-16T14:23:11.147Z",
  "schema_version": "1.0",
  "source": {
    "service": "string",
    "version": "string",
    "environment": "string"
  },
  "actor": {
    "actor_id": "string",
    "actor_type": "string"
  },
  "workspace": {
    "workspace_id": "string",
    "organization_id": "string"
  },
  "correlation": {
    "correlation_id": "string",
    "causation_id": "string | null"
  },
  "payload": { }
}
```

### Base Field Definitions

| Field | Required | Description |
|---|---|---|
| `event_id` | Yes | UUID v4 — globally unique event identifier |
| `event_type` | Yes | Dot-notation event type (see Event Type Registry below) |
| `event_category` | Yes | `business` \| `technical` \| `governance` \| `security` \| `system` |
| `domain` | Yes | `business` \| `maritime` \| `security` \| `real_estate` \| `cross_domain` \| `system` |
| `occurred_at` | Yes | ISO 8601 — when the event actually happened |
| `recorded_at` | Yes | ISO 8601 — when the event was recorded by the platform |
| `schema_version` | Yes | Schema version for forward compatibility |
| `source.service` | Yes | Originating service name (OTel `service.name`) |
| `actor.actor_id` | Yes | Who or what caused the event |
| `actor.actor_type` | Yes | `human` \| `agent` \| `system` \| `external` |
| `workspace.workspace_id` | Yes | Tenant workspace scope |
| `correlation.correlation_id` | Yes | End-to-end correlation ID |
| `correlation.causation_id` | No | ID of the event that caused this one (for event chains) |
| `payload` | Yes | Event-specific data (domain-defined) |

---

## Event Type Registry

Event types use dot-notation: `<domain>.<entity>.<action>`

### Business Domain Events (`business.*`)

| Event Type | Description |
|---|---|
| `business.signal.observed` | A business signal was detected |
| `business.signal.assessed` | An inference was generated for a signal |
| `business.signal.escalated` | A signal was escalated to a higher-priority actor |
| `business.signal.resolved` | A signal was marked resolved |
| `business.action.proposed` | An action was proposed in response to a signal |
| `business.action.approved` | A proposed action was approved |
| `business.action.rejected` | A proposed action was rejected |
| `business.action.executed` | An approved action was executed |
| `business.action.completed` | An action execution completed |
| `business.action.failed` | An action execution failed |
| `business.approval.requested` | An approval was requested |
| `business.approval.granted` | An approval was granted |
| `business.approval.denied` | An approval was denied |
| `business.approval.expired` | An approval request expired without decision |
| `business.journey.stage.advanced` | A business journey advanced to the next stage |
| `business.journey.friction.detected` | Friction score exceeded threshold |

---

### Maritime Domain Events (`maritime.*`)

| Event Type | Description |
|---|---|
| `maritime.vessel.ais.received` | AIS position update received |
| `maritime.vessel.ais.gap.detected` | AIS gap exceeded threshold |
| `maritime.vessel.dark.suspected` | Vessel suspected of AIS manipulation |
| `maritime.vessel.route.deviated` | Vessel deviated from declared route |
| `maritime.vessel.sanctions.flagged` | Vessel flagged for sanctions screening |
| `maritime.vessel.sanctions.cleared` | Vessel cleared by sanctions screening |
| `maritime.voyage.created` | New voyage record created |
| `maritime.voyage.departed` | Vessel departed port |
| `maritime.voyage.arrived` | Vessel arrived at destination |
| `maritime.voyage.pnl.updated` | Voyage P&L calculation updated |
| `maritime.voyage.hold.placed` | Voyage approval hold placed |
| `maritime.voyage.hold.released` | Voyage approval hold released |
| `maritime.compliance.alert.generated` | Compliance alert generated |

---

### Security Domain Events (`security.*`)

| Event Type | Description |
|---|---|
| `security.incident.detected` | Security incident detected |
| `security.incident.triaged` | Incident severity assigned |
| `security.incident.contained` | Threat contained |
| `security.incident.remediated` | Remediation completed |
| `security.incident.closed` | Incident record closed |
| `security.threat.indicator.matched` | IOC or threat indicator matched |
| `security.vulnerability.identified` | Vulnerability identified in environment |
| `security.vulnerability.patched` | Vulnerability patched |
| `security.cve.published` | New CVE published (from NVD feed) |
| `security.cisa.kev.added` | New entry in CISA KEV catalog |
| `security.mitre.technique.matched` | MITRE ATT&CK technique matched |
| `security.playbook.executed` | SOAR playbook executed |
| `security.compliance.check.passed` | Compliance check passed |
| `security.compliance.check.failed` | Compliance check failed |

---

### Real Estate Domain Events (`real_estate.*`)

| Event Type | Description |
|---|---|
| `real_estate.property.distress.detected` | Property entered distress threshold |
| `real_estate.property.ownership.changed` | Ownership structure change recorded |
| `real_estate.lien.filed` | Lien filed on property |
| `real_estate.deal.created` | Deal record created in pipeline |
| `real_estate.deal.offer.submitted` | Offer submitted on property |
| `real_estate.deal.under_contract` | Property moved to under-contract stage |
| `real_estate.deal.closed` | Transaction closed |
| `real_estate.deal.fell_through` | Deal fell through |

---

### Governance Domain Events (`governance.*`)

| Event Type | Description |
|---|---|
| `governance.policy.created` | New policy created |
| `governance.policy.updated` | Policy version updated |
| `governance.policy.applied` | Policy applied to an action |
| `governance.audit.entry.written` | Audit log entry written |
| `governance.proof_chain.entry.appended` | Proof chain entry appended |
| `governance.decision_ledger.entry.written` | Decision ledger entry written |
| `governance.agent.inference.generated` | AI agent generated inference |
| `governance.agent.eval.run.completed` | Agent eval run completed |
| `governance.agent.model.promoted` | Model version promoted to production |
| `governance.agent.model.demoted` | Model version rolled back |

---

### Onboarding Domain Events (`onboarding.*`)

These seven events define the canonical activation funnel. See `ANALYTICS-EVENTS.md` for full payload definitions and `docs/ONBOARDING_ARCHITECTURE.md` for stage context.

| Event Type | Description | `event_category` | `domain` |
|---|---|---|---|
| `onboarding.signup.completed` | User account confirmed; org profile setup complete | `business` | `system` |
| `onboarding.workspace.created` | Workspace record written; org slug confirmed active | `business` | `system` |
| `onboarding.data.first_connected` | First data source or seed dataset connected to the workspace | `business` | `system` |
| `onboarding.recommendation.first_seen` | First signal, alert, or recommendation viewed with ≥ 2s dwell | `business` | `system` |
| `onboarding.approval.first_submitted` | First approval, triage, or escalation action submitted | `business` | `system` |
| `onboarding.outcome.first_verified` | First proof chain entry written for the workspace | `business` | `system` |
| `onboarding.completed` | All guided setup checklist items marked complete | `business` | `system` |

---

### System Events (`system.*`)

| Event Type | Description |
|---|---|
| `system.service.started` | Service process started |
| `system.service.stopped` | Service process stopped |
| `system.job.started` | Background job started |
| `system.job.completed` | Background job completed |
| `system.job.failed` | Background job failed |
| `system.signal.ingestion.error` | Signal ingestion encountered an error |
| `system.health.check` | Health check executed |

---

## Domain Event Extension Pattern

Domain events extend the base schema by adding domain-specific fields in the `payload`:

```json
{
  "event_type": "maritime.vessel.dark.suspected",
  "event_category": "business",
  "domain": "maritime",
  "payload": {
    "vessel_id": "vsl_9c2b...",
    "vessel_name": "MV Ariadne",
    "vessel_imo": "9876543",
    "flag_state": "Panama",
    "ais_gap_minutes": 127,
    "last_position": {
      "lat": 24.8,
      "lon": 58.2,
      "timestamp": "2026-04-16T12:16:00Z"
    },
    "route": {
      "origin": "Fujairah",
      "destination": "Singapore"
    },
    "dark_vessel_confidence": 0.87,
    "triggered_signals": ["sig_8f3a..."],
    "correlation_cluster": "cluster_dark_vessel_2026_04_16"
  }
}
```

---

## Event Storage Requirements

| Requirement | Specification |
|---|---|
| Retention | Minimum 7 years for governance events; 90 days for system/health events |
| Immutability | Events must not be modified after write; amendments create new events |
| Ordering | Events within a correlation ID are ordered by `occurred_at` |
| Indexing | Index on: `workspace_id`, `event_type`, `domain`, `occurred_at`, `correlation_id`, `actor_id` |
| Export | Events must be exportable as signed JSON or JSONL for audit |
| Encryption | Event payloads containing PII must be encrypted at rest |

---

## Consumption Patterns

| Pattern | Implementation |
|---|---|
| Real-time reaction | WebSocket push from event bus to subscribed UI clients |
| Signal generation | Signal ingestion service subscribes to domain events and generates signals |
| Audit log | Governance event consumer writes to audit log table |
| Analytics | Batch export of events to analytics warehouse |
| Cross-domain correlation | Correlation service joins events by `correlation_id` and `entity_id` |

---

*This event schema is the shared vocabulary of the SZL platform. All domain packs, services, and integrations must produce events that conform to this schema.*
