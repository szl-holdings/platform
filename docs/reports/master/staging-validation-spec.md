# Staging Validation Specification + Backup/Restore Assumptions
**Generated:** 2026-04-03
**Phase:** Post-Payload Phase 6-7 — Readiness Gates + Automation Coverage

---

## Purpose

This document defines the minimum staging validation checklist required before any app can be promoted to Beta Candidate or Production-Ready, and documents the backup/restore assumptions that underpin the reliability gate.

---

## Minimum Staging Validation Checklist

The following checks must pass in a staging environment before any production release is approved. This is the canonical validation gate — it supplements CI and cannot be bypassed.

### 1. Environment Health
- [ ] All services start cleanly from a cold boot (`pnpm start` in each artifact)
- [ ] `/health` endpoint responds HTTP 200 within 2 seconds
- [ ] No error-level logs appear in the first 60 seconds after boot
- [ ] Environment variables are complete (validated against the published env-inventory)

### 2. Authentication Gate
- [ ] Login flow works end-to-end for at least one test user account
- [ ] Protected routes redirect unauthenticated users to login
- [ ] Session expiry is enforced (re-authentication required after TTL)
- [ ] Role-based access control: at least one admin-only route is inaccessible to a non-admin test user

### 3. Core User Journey Validation (per app)
Each app must pass its designated journey on staging before the release proceeds:

| App | Required Journey | Pass Criteria |
|-----|-----------------|--------------|
| Lyte Command Center | Load dashboard → view alerts → open action center | All 3 pages load; URL changes confirm navigation |
| Aegis | Load home → open incidents → view finding detail | Incident Response heading visible; findings page loads |
| Terra | Load dashboard → view deals → view analytics | Deal Pipeline heading visible; analytics page loads |
| Vessels | Load home → fleet dashboard KPIs visible → exceptions center opens | Fleet Command KPI visible; exceptions URL confirmed |
| SZL Holdings | Load home → navigate to ecosystem → navigate to contact | URL changes confirmed at each step |
| Carlota Jo | Load home → reach booking → Practice Area step visible | Step 1 heading visible; step indicator shows multi-step flow |
| Stephen Lutar | Load home → navigate to about → navigate to contact | URL changes confirmed at each step |
| Platform API | Call `/health`, `/api/auth/session`, and one data endpoint | All return 200 within SLO latency |

### 4. Mobile Rendering Validation
- [ ] Each public-facing app renders without crash at 390×844 viewport (Chrome DevTools mobile simulation)
- [ ] No horizontal scroll overflow on mobile for homepage and primary journeys
- [ ] Mobile navigation (hamburger or collapsible nav) is accessible and functional

### 5. Integration Smoke Tests
- [ ] Database connectivity: at least one read query succeeds (e.g., `GET /api/health` returns DB status)
- [ ] Any external API integration (Mapbox, payment provider, email) tested in staging with staging keys
- [ ] Webhook endpoints (if any) respond correctly to a test payload

### 6. Security Gate
- [ ] HTTPS is enforced in staging (HTTP redirects to HTTPS)
- [ ] CORS headers are set correctly (no wildcard `*` origins)
- [ ] No secrets, tokens, or API keys visible in page source or network requests
- [ ] Dependency audit: `pnpm audit --audit-level=high` reports zero high/critical CVEs

### 7. Performance Spot-Check
- [ ] Homepage LCP < 3s on a 3G throttled connection (Chrome Lighthouse or DevTools throttle)
- [ ] No request to `/api/**` takes > 2s in normal load (checked via Network tab)

### 8. Final Sign-Off
- [ ] At least one human reviewer has manually walked through the primary journey on staging
- [ ] Release notes or changelog entry has been prepared
- [ ] Rollback plan is documented (see Rollback Procedure below)

---

## Backup / Restore Assumptions

### Database Backup Policy (Assumed — Not Yet Implemented)

| Item | Assumption | Status |
|------|-----------|--------|
| Backup frequency | Daily automated snapshots | Not implemented |
| Backup retention | 30 days minimum | Not implemented |
| Backup storage | Separate availability zone or region | Not implemented |
| Backup encryption | AES-256 at rest | Not implemented |
| Offsite backup | At least one backup in geographically separate storage | Not implemented |

**Action Required:** All database backup policies must be configured before any app reaches Production-Ready status.

### Restore Procedure (Assumed)

1. **Identify the target restore point**: Determine the last known-good backup timestamp
2. **Notify stakeholders**: Inform affected users of expected downtime before restore begins
3. **Take a pre-restore snapshot**: Capture current DB state before overwriting (safety net)
4. **Execute restore**: Apply the backup snapshot to the target environment
5. **Verify restore integrity**: Run a set of read queries to confirm data consistency
6. **Run health checks**: Confirm `/health` and core API endpoints return 200
7. **Re-enable traffic**: Route traffic back to the restored environment
8. **Post-restore audit**: Log the incident, restore timestamp, and data loss window

### Recovery Time Objective (RTO) and Recovery Point Objective (RPO)

| Tier | RTO Target | RPO Target | Notes |
|------|-----------|-----------|-------|
| Platform API (production) | < 4 hours | < 24 hours | Targets before Production-Ready gate |
| SZL Holdings (investor-facing) | < 2 hours | < 24 hours | Priority due to investor visibility |
| Lyte / Aegis / Terra / Vessels | < 8 hours | < 24 hours | Functional Alpha targets |
| Carlota Jo | < 8 hours | < 24 hours | Client-facing booking data |

**Note:** RTO/RPO targets are aspirational until backup infrastructure is implemented. No restore drill has been conducted. This must be resolved before Production-Ready promotion.

### Restore Drill Requirement

Before any app can reach Production-Ready:
1. A full backup-restore drill must be conducted in a non-production environment
2. The drill must be documented (who ran it, what was restored, duration, data loss window)
3. The drill must pass: restored application must pass the minimum staging validation checklist above

---

## Staging Environment Assumptions

The following are assumed requirements for a staging environment. No staging environment is currently provisioned; this documents what would be required.

| Requirement | Description |
|-------------|-------------|
| Environment parity | Staging uses the same runtime versions, package versions, and infra configuration as production |
| Isolated data | Staging uses a separate database seeded with synthetic/anonymized data — never production data |
| Access control | Staging access is restricted to internal team; no public URL without auth |
| Secrets separation | Staging uses distinct API keys and secrets from production |
| Deployment pipeline | Staging deployments are triggered by CI on merge to `main`, before production promotion |
| Monitoring | Same observability stack as production (logging, tracing, alerting) is active in staging |
