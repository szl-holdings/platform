# Known-Gap Policy & Backup/Restore Procedures

**Owner:** Engineering (Founder)  
**Last updated:** April 2026  
**Audience:** Internal team, investor/lender diligence reviewers

---

## Purpose

This document serves two purposes:

1. Documents the current backup and restore procedures for SZL Holdings production systems
2. Establishes a known-gap policy for security and compliance items that are not yet implemented, to support honest and structured disclosure during investor, lender, or enterprise diligence

---

## Backup Procedures

### Database (PostgreSQL)

**Current state:** Managed by Replit's PostgreSQL service.  
**Backup type:** Point-in-time recovery (PITR) via managed hosting provider.  
**Frequency:** Continuous (managed — not manually configured by SZL).  
**Retention:** Per provider SLA.  
**Access:** Database credentials via environment secret store (never in source control).

**Manual export:**  
An admin can trigger a full database export via the admin panel or by running:
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

**Restore procedure:**
1. Provision new PostgreSQL instance (or use existing)
2. Set `DATABASE_URL` environment variable
3. Run: `psql $DATABASE_URL < backup-YYYYMMDD.sql`
4. Run schema migrations: `pnpm --filter db push`
5. Verify via `/api/health/ready`

### Application State

**Stateless by design.** The API server maintains no local state except in-memory caches (job queue, telemetry snapshots, intelligence cache). All persistent state is in the database.

**Recovery:** A full restore is achieved by restoring the database and redeploying the application.

### Secrets and Configuration

**Current state:** All secrets managed via Replit environment secrets (encrypted at rest).  
**Backup:** Secrets must be re-entered manually if the environment is re-provisioned. An offline record of all required environment variables is maintained by the founder in a secure password manager.

---

## Known-Gap Policy

SZL Holdings operates a policy of explicit, documented gap disclosure. Security and operational gaps that are known but not yet resolved are listed below with honest timelines. This list is maintained as a living document and updated as gaps are closed.

### Active Gaps

| Gap ID | Description | Risk Level | Planned Resolution | Target |
|--------|-------------|------------|-------------------|--------|
| GAP-001 | SOC 2 Type II certification not yet obtained | Medium | Initiate audit after first revenue | 12–18 months post-revenue |
| GAP-002 | Redis-backed session store not yet implemented (in-memory sessions) | Medium | Add Redis when scaling beyond single instance | Revenue activation phase |
| GAP-003 | FedRAMP readiness (Aegis) not yet initiated | Low (pre-gov contracts) | Begin after DoD/Fed contract engagement | 18–24 months |
| GAP-004 | Automated backup validation (restore testing) not yet scheduled | Low | Add quarterly restore drill | Next operational cycle |
| GAP-005 | External uptime monitoring (e.g., Better Uptime) not yet configured | Low | Configure before first enterprise pilot | Pre-commercial launch |
| GAP-006 | Sentry or equivalent error tracking not yet wired in production | Low | Add Sentry DSN to production environment | Next quarter |
| GAP-007 | Multi-region failover not implemented | Low (single-tenant demo) | Architect after first enterprise contract | Post-initial revenue |
| GAP-008 | Formal penetration test not yet conducted | Medium | Commission pen test pre-SOC2 | Pre-SOC2 audit |

### Closed Gaps

| Gap ID | Description | Closed Date | Resolution |
|--------|-------------|-------------|------------|
| — | Rate limiting on API endpoints | 2026-Q1 | Implemented via express-rate-limit |
| — | CSRF protection on state-changing routes | 2026-Q1 | Implemented via custom CSRF middleware |
| — | Helmet HTTP security headers | 2026-Q1 | Implemented across all environments |
| — | WebSocket ACL and HMAC ticket auth | 2026-Q1 | Implemented in lib/websocket.ts |
| — | OpenTelemetry instrumentation | 2026-Q1 | Integrated via @workspace/observability |
| — | Input validation with Zod | 2026-Q1 | Applied on all API routes |

---

## Diligence Disclosure Statement

When sharing this document during investor, lender, or enterprise diligence, the following statement should accompany it:

> SZL Holdings maintains a living known-gap register as part of its commitment to transparent operational governance. The gaps documented above are real, known, and tracked with planned resolution timelines. None of the open gaps represent active vulnerabilities in the current demonstration environment. The most significant gaps (SOC 2, FedRAMP) are appropriate to our current stage and are planned for resolution as the business scales to contracted revenue.

---

## Review Schedule

This document is reviewed quarterly or upon any material change to the security posture or gap status. The founder is the designated owner and is responsible for keeping this list current.

---

*See also: [Security Posture](../../trust/security-posture.md) · [Incident Response Runbook](../ops/incident-response-runbook.md)*
