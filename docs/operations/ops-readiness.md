# Operations Readiness — SZL Holdings Platform

**Version:** 1.0 · **Date:** 2026-04-20  
**Audience:** Series A diligence, investors, enterprise evaluators, engineering  
**Prepared by:** Stephen Lutar, Founder & CEO  

---

## Overview

This document is a one-page operational readiness summary for the SZL Holdings platform as of April 2026. It covers backup and disaster recovery posture, production observability, and known gaps with their remediation plans.

---

## Disaster Recovery

| Question | Answer |
|----------|--------|
| Can you restore from backup? | **Yes.** Drill executed 2026-04-20. Restore completed cleanly in ~25 seconds. |
| What is your RPO? | Demo/Pilot: 24 hours (nightly backup). Pro: 4 hours (hourly WAL — requires Azure PostgreSQL). Enterprise: 1 hour (continuous WAL + cross-region). |
| What is your RTO? | Restore path: < 5 minutes. End-to-end (including app reconnect): < 2 hours. Consistent with documented targets. |
| Is the backup process automated? | **Yes.** `scripts/backup-db.sh` runs via `.github/workflows/backup.yml` nightly (02:00 UTC). Rotation: 7 daily + 4 weekly. |
| Is there a backup manifest / health check? | **Yes.** `backup_manifest.json` is written on every run and read by `/api/health/detailed`. An alert fires if the backup age exceeds 24 hours. |
| Has the restore procedure been tested? | **Yes.** DR drill executed 2026-04-20. See `docs/operations/dr-drill-2026-04-20.md`. |
| When is the next drill scheduled? | Quarterly tabletop — 2026-07-01. |

**DR posture: GREEN for Demo/Pilot tier. Azure PostgreSQL required for Pro/Enterprise WAL-based RPO targets.**

---

## Production Observability

| Signal | Status | Notes |
|--------|--------|-------|
| Structured JSON logs | LIVE | All API routes log structured JSON via Pino |
| Log shipping to aggregator | PRE-LAUNCH | Set `AZURE_APP_INSIGHTS_CONNECTION_STRING` before GA |
| HTTP metrics (rate, latency, error rate) | LIVE | Self-monitor polls every 5 min; alerts at P95 > 2s, error rate > 5% |
| DB health | LIVE | `/api/health` — 503 if DB unreachable; pool metrics on `/api/health/detailed` |
| Queue depth monitoring | LIVE | Alerts at > 50 pending jobs |
| AI provider health probes | LIVE | OpenAI, Anthropic, Gemini — every 2 minutes |
| Distributed tracing (OTel) | INSTRUMENTED | Wired and ready; exporter env var required for production backend |
| Error tracking (Sentry) | INSTRUMENTED | Code complete; `SENTRY_DSN` required for production activation |
| External uptime monitor | PRE-LAUNCH | Endpoint ready; Betterstack setup documented in OPERATIONS-RUNBOOK.md §5.3 |
| Alert routing (Slack) | PRE-LAUNCH | `SLACK_WEBHOOK_URL` must be set in production secrets |
| Audit trail integrity | LIVE | Proof Chain is append-only; weekly automated integrity check |

**Observability posture: AMBER — instrumentation is complete; 5 environment variables must be set before production launch.**

---

## Pre-Launch Checklist (Operations)

The following must be completed before serving production traffic:

- [ ] **OBS-001:** Set `AZURE_APP_INSIGHTS_CONNECTION_STRING` (or `OTEL_EXPORTER_OTLP_ENDPOINT`) — activates distributed tracing
- [ ] **OBS-002:** Set `SENTRY_DSN` — activates error tracking
- [ ] **OBS-003:** Provision Betterstack uptime monitor — external liveness alerting
- [ ] **OBS-004:** Set `SLACK_WEBHOOK_URL` — enables self-monitor alert routing
- [ ] **OBS-010:** Wire Azure Monitor log shipping for stdout log aggregation
- [ ] **DR-001:** Confirm `DATABASE_URL` CI secret set for backup workflow
- [ ] **DR-002:** Configure object storage target for backup artifact archival (Pro tier)

---

## Known Gaps (Documented, Not Silent)

| Gap | Priority | Target |
|-----|----------|--------|
| OTLP exporter not configured | P1 | Pre-GA |
| Sentry DSN not set | P1 | Pre-GA |
| External uptime monitor not provisioned | P1 | Pre-GA |
| Log shipping not wired | P1 | Pre-GA |
| Tenant isolation violation auto-alert | P1 | Q2 2026 |
| Auth failure rate auto-alert | P2 | Q2 2026 |
| DB pool saturation alert | P2 | Q2 2026 |
| Hourly WAL / Enterprise RPO (requires Azure PostgreSQL) | Architecture | Production deploy |
| Cross-region failover drill | Enterprise tier | Per first Enterprise customer |
| Customer BYOK backup encryption | Roadmap | FY27 |

These gaps are disclosed proactively. None represent silent risk or unknown unknowns.

---

## Related Documents

| Document | Path |
|----------|------|
| DR drill record | `docs/operations/dr-drill-2026-04-20.md` |
| Observability audit | `audit/operations/observability-audit.md` |
| Backup & Restore | `BACKUP-RESTORE.md` |
| Telemetry model | `telemetry-model.md` |
| Operations runbook | `OPERATIONS-RUNBOOK.md` |
| Incident command | `INCIDENT_COMMAND_PLAYBOOK.md` |
| Incident response | `INCIDENT_RESPONSE.md` |
| Known gaps | `KNOWN-GAPS.md` |
| Trust Center | `TRUST_CENTER_INDEX.md` |

---

*Prepared: 2026-04-20 · Next review: 2026-07-01*
