# SZL Holdings — Buyer Readiness Assessment

**Date:** April 22, 2026
**Audience:** Enterprise evaluation teams, procurement, InfoSec

---

## Platform Summary

SZL Holdings is a governed decision infrastructure platform. It connects what is observable to what is executable, with full attribution at every step.

**Not a dashboard.** Not a copilot. Not a workflow tool.

It is a decision operating system where every recommendation carries a proof chain, every action requires policy-gated approval, and every outcome is tracked and fed back to calibrate future decisions.

---

## What Is Operational

| Surface | Status | Data Source | Notes |
|---------|--------|-------------|-------|
| API Server | **Live** | PostgreSQL, 2,781 route handlers | Healthy, <20ms DB latency |
| SZL Holdings Dashboard | **Beta** | Seeded + live feeds | Investor-facing command surface |
| Terra (Real Estate) | **Beta** | NYC Open Data (live), Census, BLS, FEMA, SEC | NYC distress pipeline operational |
| Aegis (Security) | **Beta** | CISA KEV, NVD CVE, MITRE ATT&CK, AbuseIPDB (live) | SOC command surface |
| Vessels (Maritime) | **Partial** | NOAA, Open-Meteo (live); AIS simulated | AIS requires paid subscription |
| Counsel (Legal) | **Beta** | DB-backed matters and filings | Core matter management operational |
| Pulse (Briefing) | **Beta** | Cross-domain signal synthesis | AI narrative generation |
| Carlota Jo (Advisory) | **Beta** | DB-backed client/service management | UHNW advisory operations |
| CORTEX (Mobile) | **Beta** | Expo React Native | Core mobile command screens |

## Where Demo/Seed Data Exists

- Dashboard KPIs: seeded values (not live aggregation)
- Maritime AIS telemetry: simulated (no live AIS subscription)
- Some Aegis scenarios: seeded for demonstration
- Fund operations metrics: seeded demo data

**Policy:** Seed data is gated behind `DEMO_MODE=true` and never runs in production mode. See `docs/DEMO_DATA_POLICY.md`.

---

## Security Posture

| Control | Status |
|---------|--------|
| Authentication | OpenID Connect (PKCE) via Replit Auth |
| Authorization | 11-role RBAC, deny-by-default global enforcer |
| Tenant isolation | All queries scoped by org_id; cross-org returns 404 |
| CSRF protection | Token-based |
| Rate limiting | Express rate limiter on write endpoints |
| Audit trail | Immutable audit events on all writes |
| AI governance | Covenant Policy + Guardian engine; human approval gates |
| Secret scanning | GitHub push + scheduled scans |
| Dependency review | PR-level dependency review |
| Code analysis | CodeQL semantic analysis |

**Full assessment:** [Security Posture](security-posture.md)

---

## Human-in-the-Loop Policy

AI cannot execute consequential actions without human confirmation. The Covenant Policy engine enforces mandatory approval gates based on risk tier:

| Risk Tier | Gate |
|-----------|------|
| Low | Auto-approved by policy engine |
| Medium | Team lead approval required |
| High | Department head approval required |
| Critical | Executive + policy engine approval |

Every approval decision is recorded in the Proof Chain with actor, timestamp, rationale, and policy reference.

---

## Observability

| Layer | Implementation |
|-------|---------------|
| Application | OpenTelemetry instrumentation (`packages/otel`) |
| AI/Agent | Cognitive observability — model calls, tool calls, latency, token costs |
| Database | Query latency tracking, pool saturation monitoring |
| Health | Dedicated health pool, self-monitoring, degradation watcher |
| Audit | Every write generates an immutable audit event |

---

## What Makes This Different

1. **Proof Chain** — every decision has an immutable evidence trail from signal to outcome
2. **Governed Execution** — AI recommends, policy evaluates, human approves, system executes
3. **Decision Replay** — any decision can be replayed end-to-end with full attribution
4. **Outcome Graph** — closed-loop tracking from recommendation to real-world result
5. **Cross-Domain Intelligence** — signal chains connect security incidents to legal exposure to financial impact
6. **Six Domain Packs** — one platform fabric, six vertical applications, shared governance

---

## Deployment Model

| Environment | Infrastructure | Notes |
|-------------|---------------|-------|
| Development | Replit workspace | Full stack, instant iteration |
| Production | Replit Deployments | Auto-scaling, TLS, health checks |
| Database | Replit PostgreSQL | Managed, backed up |
| CI/CD | GitHub Actions | 22 workflows, pinned action SHAs |
