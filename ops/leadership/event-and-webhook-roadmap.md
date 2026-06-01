# Event & Webhook Roadmap

**Owner:** Stephen Lutar · **Audience:** Founder, technical leads, technical buyers evaluating Tier 3 integration

This document defines what should become event-driven, in what order, and against what governance contract. It is a **roadmap**, not an implementation — see `integration-expansion-model.md` for where Tier 3 sits commercially.

## Design principles

1. **Receipts cross event boundaries without loss.** Every event we emit carries the originating signal ID, decision ID (if applicable), and policy attestation. Consumers must be able to reconstruct provenance from the event payload alone.
2. **Events are governed artifacts.** Every event class corresponds to a step in the 9-step loop. We do not emit "interesting things happened" events — we emit `signal.ingested`, `recommendation.issued`, `approval.granted`, `action.executed`, `audit.recorded`. The loop is the schema.
3. **Bidirectional means symmetric provenance.** Inbound webhooks (buyer → us) must carry the same provenance fields we emit. We will not accept "anonymous" events into the loop.
4. **At-least-once delivery, idempotent receipts.** Every event carries a unique `eventId`; receipt creation is idempotent on `(decisionId, policyId, eventId)`. Duplicate events do not produce duplicate receipts.
5. **Schema versioning is explicit.** Every event carries a `schemaVersion`. Breaking changes require a new event class, never a silent payload mutation.

## Phase 1 — Outbound events (we emit, buyers consume)

**Target:** Outbound webhook surface available within 6 months of GA so design partners can begin consuming events; the first **strategic Tier 3 contract** that depends on the full bidirectional roadmap is expected at the 12-month horizon (see `integration-expansion-model.md`).

### Event classes (P1)

| Event | Loop step | Trigger | Payload essentials |
|-------|-----------|---------|-------------------|
| `signal.ingested.v1` | Signal | New signal lands in queue | signalId, source, sourceType, severity, valueAtRisk, ingestedAt |
| `recommendation.issued.v1` | Recommendation | Decision receipt created | decisionId, signalId, scoringFactors[], confidence, alternatives[], issuedAt |
| `approval.requested.v1` | Policy | Recommendation hits a policy gate | approvalId, decisionId, policyId, tier, approvers[], slaHours, requestedAt |
| `approval.granted.v1` | Policy | Final approver acts | approvalId, decisionId, approver, grantedAt, overrideApplied (bool) |
| `action.executed.v1` | Execution | Action transitions to resolved | actionId, decisionId, owner, outcome, executedAt |
| `audit.recorded.v1` | Proof | Audit row written | auditId, actor, actorType, action, resourceType, resourceId, outcome, recordedAt |

### Delivery contract

- HTTP POST to a buyer-registered webhook URL.
- HMAC-SHA256 signature over the canonical payload using a per-tenant secret.
- Retry policy: exponential backoff, 7 attempts over 24 hours, dead-letter queue with audit row.
- Replay endpoint: buyers can re-fetch any event in the last 30 days by `eventId`.

## Phase 2 — Inbound events (buyers emit, we consume)

**Target:** Second Tier 3 integration within 12 months of GA.

### Event classes (P2)

| Event | Loop step | Buyer-side trigger | Why we accept it |
|-------|-----------|-------------------|------------------|
| `external.signal.v1` | Signal | Buyer system raises a business event | Lets buyer systems initiate the loop directly without polling |
| `external.outcome.v1` | Outcome | Buyer system reports the resolution of an action we drove | Closes the loop when execution lives outside our system |
| `external.policy.attestation.v1` | Policy | Buyer system records an off-platform approval | Lets us govern decisions where the gate lives in their tooling |

Inbound events must carry a buyer-issued event ID, a signature, and an attribution payload (who in the buyer system caused the event). Anonymous events are rejected at the gateway with an audit row.

## Phase 3 — Streaming + replay

**Target:** Strategic accounts only — multi-year contracts.

- Streaming subscription endpoint (server-sent events or gRPC stream) for buyers who want low-latency consumption.
- Time-travel replay: buyers can re-stream any window of events for backfill or audit.
- Cross-tenant federation: explicitly *out of scope* for the foreseeable future. Each tenant's events stay in their tenant.

## What we will not build

- **A general-purpose event bus.** We are not a Kafka. We emit governed events tied to the loop; we do not become customer infrastructure.
- **Webhook UI for end users.** Webhook configuration is a technical-buyer surface (see the integration brief). End users never see this.
- **Event marketplace / pub-sub for third parties.** The loop emits, the buyer consumes. We do not introduce intermediaries.

## Governance contract for events

Every emitted event must satisfy the truth-pass rule: **enforced at the API gateway through HMAC signing and tenant-scoped issuance; bypass requires explicit, attributed override record.** A buyer who suspects an event is forged can verify the signature; a forged event cannot enter their loop, and an attempted forge produces an audit row on our side.

## Open questions (deferred)

- Should `recommendation.issued` events be emitted in draft state (before the gate) or only when the recommendation is committed? Default: **only when committed**.
- Should we expose `learning.outcome` events in P1? Default: **defer to Phase 2 alongside outcome ingest**.
- Per-event filtering at the subscription level vs client-side filtering? Default: **per-event filtering at subscription, by `eventClass` and `severity`**.

## Companion docs

- `integration-expansion-model.md` — where this fits commercially.
- `technical-buyer-integration-brief.md` — what we hand to the buyer's engineering lead.
- `productized-governance.md` — why events themselves must be governed artifacts.
