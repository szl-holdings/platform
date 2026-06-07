# SZL Holdings — API Truth Matrix

**Date:** April 22, 2026
**Source:** Code introspection of `artifacts/api-server/src/routes/`

---

## Summary

| Metric | Count |
|--------|-------|
| Route files (top-level) | 257 |
| Route files (total, including subdirs) | 388 |
| Route handlers (GET/POST/PUT/PATCH/DELETE) | 2,781 |
| Auth-required routes | ~2,770 (deny-by-default) |
| Public routes | ~11 (health, auth flow, public feeds) |
| Unique environment variables referenced | 261 |

---

## Route Groups

| Group | File Prefix | Handlers (est.) | Domain | Auth | Notes |
|-------|-------------|-----------------|--------|------|-------|
| Health | `health.ts` | 3 | Platform | No | Dedicated healthPool |
| Auth | `auth*.ts` | ~15 | Platform | Mixed | OIDC flow |
| Admin | `admin*.ts` | ~40 | Platform | Admin | Tenant, user, governance |
| Aegis/Security | `aegis-*.ts`, `sentra-*.ts` | ~200 | Security | Yes | SOC, alerts, intel, PCAP, digital twin |
| Terra/RE | `terra-*.ts` | ~150 | Real Estate | Yes | Distress, deals, portfolio, diligence |
| Vessels/Maritime | `vessels-*.ts`, `maritime-*.ts` | ~120 | Maritime | Yes | Fleet, voyages, freight, S&P |
| Counsel/Legal | `counsel-*.ts`, `prism-*.ts` | ~80 | Legal | Yes | Matters, filings, evidence, recovery |
| Carlota/Advisory | `carlota-*.ts` | ~50 | Advisory | Yes | Clients, services, billing |
| Pulse/Briefing | `pulse-*.ts` | ~40 | Briefing | Yes | Signals, synthesis, saved briefings |
| Lyte/Decision | `lyte-*.ts` | ~60 | Decision Intel | Yes | Actions, signals, fusion, surfaces |
| Alloy/Agent | `alloy-*.ts` | ~200 | Agent Runtime | Yes | Chat, skills, governance, policy, runtime |
| Agent OS | `agent-*.ts` | ~100 | Agent Mgmt | Yes | Mesh, federation, training, autonomy |
| Signal Mesh | `signal-*.ts` | ~50 | Cross-domain | Yes | Chains, mesh, fabric |
| AI Engine | `ai-*.ts` | ~40 | AI | Yes | Safety, ops dashboard, engine |
| GraphQL | `graphql.ts` | 1 | Platform | Yes | Unified query endpoint |
| Atlas | `atlas-*.ts` | ~30 | Spatial | Yes | Digital twins, spatial runtime |
| Forge | `forge*.ts` | ~20 | Command Portal | Yes | Cross-domain aggregation |
| Constellation | `constellation*.ts` | ~30 | Network Graph | Yes | Entity relationships |
| Distribution | `distribution-*.ts` | ~25 | Fund Ops | Yes | LP portal, fund operations |
| Governance | `governance-*.ts` | ~20 | Governance | Yes | Restart, compliance |
| Debug | `debug.ts` | ~5 | Internal | Admin | Sentry, diagnostics |
| Notifications | `notifications*.ts`, `push-*.ts` | ~15 | Platform | Yes | Push, scheduled |
| Backup | `backup*.ts` | ~5 | Ops | Admin | DB backup/restore |

---

## Auth Model

| Layer | Implementation |
|-------|---------------|
| Global enforcer | `globalAuthEnforcer` in `app.ts` — deny-by-default |
| Session auth | Replit OIDC (OpenID Connect with PKCE) |
| Service auth | `x-internal-token` header with path allowlist |
| RBAC | 11 roles: `super_admin`, `ops`, `exec`, `analyst`, `compliance`, `viewer`, etc. |
| Tenant isolation | `org_id` scoping on all data queries |
| Admin guard | Role-based middleware for admin endpoints |
| Rate limiting | Express rate limiter on write endpoints |
| CSRF | Token-based CSRF protection |

---

## Known API Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Legacy PRISM routes retained alongside Counsel routes | Low | Backward compatibility; scheduled cleanup |
| Internal token path allowlist excludes `/api/terra/` | Low | Smoke tests degrade to SKIP on 401 |
| Some route files exceed 3,000 lines | Medium | `terra-cognitive.ts` is ~3,000 lines — split candidate |
| 257 route files in single directory | Medium | Consider subdirectory organization |
