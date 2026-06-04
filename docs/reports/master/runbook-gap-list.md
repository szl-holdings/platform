# Runbook Gap List
**Generated:** 2026-04-03
**Phase:** Post-Payload Phase 6-7 — Readiness Gates + Automation Coverage

---

## Purpose

This document identifies all critical operational scenarios that lack a documented runbook. Each gap is prioritized by severity and assigned a target resolution phase.

---

## Gap Severity Definitions

| Severity | Definition |
|----------|-----------|
| **P0** | Service is down or data is at risk. No runbook = blind incident response |
| **P1** | Major feature broken. Runbook needed before beta |
| **P2** | Minor or edge-case failure. Runbook needed before GA |

---

## Gap Registry

### Platform / API Server

| Scenario | Severity | Status | Target Phase |
|----------|---------|--------|-------------|
| API server fails to start (boot crash) | P0 | No runbook | Beta Candidate |
| Database connection pool exhausted | P0 | No runbook | Beta Candidate |
| Auth service unavailable (session failure) | P0 | No runbook | Beta Candidate |
| Rate limiter blocks legitimate traffic | P1 | No runbook | Beta Candidate |
| Migration fails mid-deploy | P1 | No runbook | Beta Candidate |
| API response latency spikes (p95 > 2s) | P1 | No runbook | Beta Candidate |
| Secrets rotation procedure | P1 | No runbook | Beta Candidate |
| Full database restore from backup | P0 | No runbook | Beta Candidate |

---

### Lyte Command Center

| Scenario | Severity | Status | Target Phase |
|----------|---------|--------|-------------|
| Dashboard shows stale data (> 5 min) | P1 | No runbook | Beta Candidate |
| Alert ingestion pipeline stops | P0 | No runbook | Beta Candidate |
| Alloy (AI engine) returns errors | P1 | No runbook | Beta Candidate |
| Action queue not processing | P1 | No runbook | Beta Candidate |
| Build/deploy rollback procedure | P1 | No runbook | Beta Candidate |

---

### Aegis (Firestorm)

| Scenario | Severity | Status | Target Phase |
|----------|---------|--------|-------------|
| Incident queue not loading | P0 | No runbook | Beta Candidate |
| Alert deduplication failure (duplicate alerts) | P1 | No runbook | Beta Candidate |
| RBAC misconfiguration (user sees wrong data) | P0 | No runbook | Beta Candidate |
| Forensics timeline data unavailable | P1 | No runbook | Beta Candidate |
| Executive risk score not updating | P1 | No runbook | Beta Candidate |

---

### Terra

| Scenario | Severity | Status | Target Phase |
|----------|---------|--------|-------------|
| Map tiles fail to load (Mapbox outage) | P1 | No runbook | Beta Candidate |
| Property data sync fails | P1 | No runbook | Beta Candidate |
| Document engine unavailable | P1 | No runbook | Beta Candidate |
| Climate risk data stale | P2 | No runbook | GA |
| Deal pipeline not reflecting new entries | P1 | No runbook | Beta Candidate |

---

### Vessels

| Scenario | Severity | Status | Target Phase |
|----------|---------|--------|-------------|
| Fleet position data stale (> 15 min) | P0 | No runbook | Beta Candidate |
| Map tiles fail to load (Mapbox outage) | P1 | No runbook | Beta Candidate |
| Exception center not ingesting events | P0 | No runbook | Beta Candidate |
| Alert center silent (no new alerts) | P1 | No runbook | Beta Candidate |
| Voyage ETA calculation incorrect | P1 | No runbook | Beta Candidate |

---

### SZL Holdings

| Scenario | Severity | Status | Target Phase |
|----------|---------|--------|-------------|
| Investor portal unavailable | P1 | No runbook | Beta Candidate |
| Ecosystem page data not loading | P1 | No runbook | Beta Candidate |
| Capital readiness data stale | P1 | No runbook | Beta Candidate |
| Contact/inquiry form failing | P1 | No runbook | Beta Candidate |

---

### Carlota Jo

| Scenario | Severity | Status | Target Phase |
|----------|---------|--------|-------------|
| Booking form errors or unavailable | P0 | No runbook | Functional Alpha |
| Client portal login failure | P1 | No runbook | Functional Alpha |
| Document upload failing | P1 | No runbook | Beta Candidate |
| Inquiry notifications not delivered | P1 | No runbook | Beta Candidate |

---

## Runbook Template

All runbooks should follow this structure:

```
# Runbook: [Scenario Name]
## Severity: P0 / P1 / P2
## Symptoms
- What the user or on-call engineer sees
## Root Cause Hypotheses
- Most common cause
- Secondary causes
## Diagnosis Steps
1. Check X
2. Query Y
3. Review log Z
## Remediation Steps
1. Action A
2. Action B
## Rollback Procedure
1. ...
## Post-Incident
- Who to notify
- What to document
```

---

## Summary

| Priority | Total Gaps | Target: Beta Candidate | Target: GA |
|----------|-----------|----------------------|-----------|
| P0 | 9 | 9 | 0 |
| P1 | 22 | 20 | 2 |
| P2 | 1 | 0 | 1 |
| **Total** | **32** | **29** | **3** |

**Action Required:** At least all P0 runbooks must be authored before any app can reach Beta Candidate status.
