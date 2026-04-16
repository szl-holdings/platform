# Backup & Restore — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Engineering, DevOps, security reviewers, enterprise evaluators
**Companion docs:** [DATA-RETENTION.md](DATA-RETENTION.md) · [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) · [TENANCY-MODEL.md](TENANCY-MODEL.md)

---

## Purpose

Document the SZL Holdings platform's backup, restore, and disaster recovery posture across all editions and tiers, with explicit RPO/RTO targets and tested runbooks.

---

## Backup Inventory

| Asset class | What it includes | Backup mechanism | Retention |
|-------------|------------------|------------------|-----------|
| Application database | All tenant-scoped data, audit trail, config | Managed PostgreSQL automated snapshots | 30 days (Starter), 90 days (Pro), 365 days (Enterprise) |
| Object storage | Customer-uploaded files, generated docs | Azure Blob soft-delete + cross-region replica (Pro/Enterprise) | 30 days soft-delete |
| Secrets and config | Environment-injected secrets | Replit secrets store + Azure Key Vault (Enterprise) | Versioned indefinitely |
| Source code | Repository | GitHub | Indefinite |
| Container artifacts | Build images | Container registry | Indefinite |
| Audit logs (Proof Chain) | Append-only audit entries | Live in PostgreSQL + nightly export to immutable storage | Per [DATA-RETENTION.md](DATA-RETENTION.md) |
| AI traces | Eval traces, evaluator stats | PostgreSQL + nightly snapshot | 90 days operational; older archived |

---

## Recovery Objectives by Tier

| Tier | RPO (data loss tolerance) | RTO (downtime tolerance) | Backup cadence |
|------|--------------------------:|-------------------------:|----------------|
| Demo | best effort | best effort | Nightly |
| Pilot | 24 hours | 8 hours | Nightly |
| Standard (Pro) | 4 hours | 4 hours | Hourly WAL + nightly snapshot |
| Enterprise | 1 hour | 2 hours | Continuous WAL + hourly snapshot + cross-region |
| Sovereign (FY27) | Customer-defined | Customer-defined | Customer-managed |

**RPO** = Recovery Point Objective: maximum data loss in a disaster scenario.
**RTO** = Recovery Time Objective: maximum downtime to restore service.

---

## Backup Mechanisms

### Database snapshots (PostgreSQL)

- **Cadence:** Hourly (Pro), Nightly (Starter), Continuous WAL (Enterprise)
- **Storage:** Managed PostgreSQL provider (Replit / Azure)
- **Retention:** Per edition table above
- **Verification:** Weekly automated restore test to a staging environment; manual quarterly verification of point-in-time recovery on Pro and Enterprise

### Cross-region replication (Pro and Enterprise)

- **Mechanism:** Read replica in a secondary region (Azure paired region)
- **Lag:** Typically < 5 seconds; alerts fire at > 60 seconds
- **Failover:** Manual promotion via documented runbook (target: 30 minutes)

### Object storage replication

- **Mechanism:** Azure Blob geo-redundant storage
- **Replication SLA:** Provider's GZRS terms
- **Soft-delete:** 30 days

### Audit trail export

- **Mechanism:** Nightly job exports the day's Proof Chain entries to write-once immutable storage
- **Format:** JSON Lines, signed with HMAC of `BACKUP_SIGNING_KEY`
- **Storage:** Separate cloud account (Enterprise) to prevent same-blast-radius compromise

---

## Restore Procedures

### Scenario A: Single-tenant data corruption

| Step | Action | Owner | Target time |
|------|--------|-------|------------|
| 1 | Detect via support or monitoring | On-call | < 30 min |
| 2 | Confirm scope (which `org_id`, which tables) | DBA + on-call | < 30 min |
| 3 | Identify last known-good snapshot | DBA | < 15 min |
| 4 | Restore affected rows to a side schema | DBA | < 1 hr |
| 5 | Diff against current state; reconcile | DBA + customer CSM | < 2 hr |
| 6 | Apply reconciliation transaction | DBA | < 30 min |
| 7 | Verify with customer | CSM | < 2 hr |
| 8 | Document and add to incident record | On-call | < 1 hr |

### Scenario B: Full database loss

| Step | Action | Owner | Target time |
|------|--------|-------|------------|
| 1 | Detect (provider alert or monitoring) | On-call | < 5 min |
| 2 | Declare SEV1; notify per [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) | On-call | < 15 min |
| 3 | Promote standby (Pro/Enterprise) or restore from snapshot (Starter) | DBA | < 30 min (Pro) / < 4 hr (Starter) |
| 4 | Verify schema and audit trail integrity | DBA | < 30 min |
| 5 | Bring application servers online against restored DB | DevOps | < 30 min |
| 6 | Customer-facing status update | Founder | continuous |
| 7 | Post-mortem | Founder + DBA | < 7 days |

### Scenario C: Region-wide outage (Enterprise)

| Step | Action | Owner | Target time |
|------|--------|-------|------------|
| 1 | Detect provider outage | On-call | < 5 min |
| 2 | Declare SEV1 | Founder | < 15 min |
| 3 | Initiate cross-region failover runbook | DevOps lead | < 30 min |
| 4 | Promote secondary region database | DBA | < 30 min |
| 5 | Update DNS / load balancer | DevOps | < 15 min |
| 6 | Validate end-to-end | QA + on-call | < 30 min |
| 7 | Communicate to customers | Founder + CSM | continuous |

Total Enterprise RTO target: 2 hours.

### Scenario D: Object storage loss

| Step | Action | Owner |
|------|--------|-------|
| 1 | Detect (provider alert or customer report) | On-call |
| 2 | Identify affected objects | DevOps |
| 3 | Restore from soft-delete (within 30 days) | DevOps |
| 4 | Restore from geo-replicated copy if soft-delete expired | DevOps |
| 5 | Verify with customer | CSM |

### Scenario E: Audit trail corruption

The Proof Chain is append-only. Corruption — by definition — implies tampering or platform fault.

| Step | Action | Owner |
|------|--------|-------|
| 1 | Detect via integrity check (weekly automated) or manual | Security lead |
| 2 | Declare security incident per [SECURITY.md](SECURITY.md) | Security lead |
| 3 | Cross-reference live audit trail against nightly export | DBA + Security |
| 4 | Identify divergence range | Security |
| 5 | Restore from nightly export if necessary | DBA |
| 6 | Forensic investigation (separate workstream) | Security |
| 7 | Customer notification per [DATA-RETENTION.md](DATA-RETENTION.md) | Founder |

---

## Testing Cadence

| Test | Frequency | Owner | Last verified |
|------|-----------|-------|---------------|
| Database snapshot restore to staging | Weekly automated | DevOps | Continuous |
| Point-in-time recovery (Pro) | Quarterly | DBA | TBD per cohort |
| Cross-region failover (Enterprise) | Annually with each Enterprise customer; tabletop quarterly | DevOps + Customer | Per customer onboarding |
| Object storage soft-delete restore | Quarterly | DevOps | TBD |
| Audit trail integrity verification | Weekly automated | Security | Continuous |
| Full DR tabletop | Annually | Founder + DevOps + Security | TBD |

Untested backups are not real backups. The cadence above is enforced via reminders and reviewed in quarterly DR review.

---

## Customer-Facing Backup Posture

Customers can request:

| Action | Available at |
|--------|--------------|
| Audit trail export (org-scoped) | All tiers, on-demand |
| Tenant data export | All tiers, on-demand or per [DATA-RETENTION.md](DATA-RETENTION.md) |
| Snapshot restore for their tenant | Enterprise (negotiated) |
| Point-in-time restore for their tenant | Enterprise (negotiated) |
| Confirmation of last successful backup | All tiers, in support response |

---

## What We Do Not Do (And Why)

| We do not | Why |
|-----------|-----|
| Allow customers to delete their own audit trail | Defeats the purpose of an immutable trail |
| Offer < 1-hour RPO at Starter or Pro | Cost-to-value ratio does not justify; Enterprise offers it |
| Promise air-gapped backup at Enterprise yet | FY27 roadmap |
| Encrypt backups with customer-supplied keys (BYOK) | Roadmap; not GA |
| Backup development databases | Development is ephemeral by design |

---

## Known Gaps

From [KNOWN-GAPS.md](KNOWN-GAPS.md):

- **DR tabletop not yet executed in 2026 production environment** — scheduled for Q2 once first Enterprise customer is provisioned
- **Cross-region failover runbook not yet executed against live load** — planned tabletop scheduled
- **Customer BYOK for backup encryption** — not yet implemented; FY27 roadmap

These gaps are documented honestly. They do not represent silent risk.

---

## Related Documents

| Document | Path |
|----------|------|
| Data retention | [DATA-RETENTION.md](DATA-RETENTION.md) |
| Incident response | [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) |
| Tenancy model | [TENANCY-MODEL.md](TENANCY-MODEL.md) |
| Security | [SECURITY.md](SECURITY.md) |
| Known gaps | [KNOWN-GAPS.md](KNOWN-GAPS.md) |
| Trust Center | [TRUST_CENTER_INDEX.md](TRUST_CENTER_INDEX.md) |
| Tenant tiers | [TENANT_TIERS.md](TENANT_TIERS.md) |
| Backup runbook | `infra/runbooks/RUNBOOK_BACKUP.md` |
| Restore runbook | `infra/runbooks/RUNBOOK_RESTORE.md` |
