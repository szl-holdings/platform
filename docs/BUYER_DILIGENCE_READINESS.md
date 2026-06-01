# SZL Holdings — Buyer Diligence Readiness

**Date:** 2026-04-27
**Scope:** Evidence-backed assessment for enterprise buyer (design partner / pilot) due diligence
**Evidence base:** Diligence audit task #3206; `generated/platform-metrics.json`; build/lint/typecheck outputs

---

## Executive Summary

SZL Holdings is appropriate for enterprise pilot conversations as a design partner / early adopter, not as a production procurement. The platform has real infrastructure and functional demo surfaces. It does not yet meet the bar for enterprise production deployment: no SOC 2, active pipeline failures, no external pentest, no production customers.

---

## Functional Readiness by Domain

### Ready for Pilot Conversation

| Domain | Surface | Live Data | Gaps |
|--------|---------|-----------|------|
| Cybersecurity (PARAGON/TENAX) | Aegis (`/aegis/`) | CISA KEV, NVD CVE, MITRE ATT&CK v14 live | 8 security modules not wired to case management; SOAR execution pending |
| Legal Command (Counsel) | Counsel (`/counsel/`) | Matter tracking, legal hold functional | CourtListener token pending; e-signature pending |
| Executive Briefing (LUMINA) | Pulse (`/pulse/`) | AI multi-provider briefing generation | Some signal inputs seeded |
| Advisory (Carlota Jo) | `/carlota-jo/` | Service catalog, live integrations | Most complete surface |

### Partial — Requires Disclosure

| Domain | Surface | Gaps |
|--------|---------|------|
| Maritime (SEXTANT) | Vessels (`/vessels/`) | AIS telemetry simulated; commercial modules not wired; paid AIS subscription required for live data |
| Real Estate (DOMAINE) | Terra (`/terra/`) | Maps completely blank (Mapbox token not configured); NYC distress data live but visualization non-functional |
| Decision Intelligence (KORA) | Lyte (`/lyte/`) | Routes functional; signal fusion on seeded data; legacy path alias issue |
| Unified Command (FORGE) | Command (`/command/`) | Cross-domain command surface; CORTEX badge counts not wired to live API |
| Agentic Fabric (A11oy) | `/a11oy/` | Artifact build fails; Phase 1 code present; Phase 2 in progress |

### Not Ready for Customer Presentation

| Surface | Reason |
|---------|--------|
| APEX Mobile (`/szl-holdings-mobile/`) | Build fails; Expo scaffold present but incomplete |
| SZL Demo Video | Build fails; animated promo only |
| Mockup Sandbox | Internal design tooling; not customer-facing |

---

## Security & Compliance Posture

| Requirement | Status |
|------------|--------|
| Authentication | OIDC/PKCE — configured and active |
| Multi-role RBAC | Implemented; deny-by-default |
| Tenant isolation | Schema-level; org-scoped queries |
| Audit trail | Append-only proof chain with cryptographic hash linkage |
| SOC 2 Type I | Not initiated — roadmap Q3 2026 |
| SOC 2 Type II | Not initiated |
| External pentest | Not conducted |
| SBOM | Not generated |
| SLSA provenance | Not implemented |
| Production error monitoring | Not configured (Sentry pending) |
| Redis session store | Not configured (in-memory only) |

**Buyer guidance:** Enterprise procurement that requires SOC 2 or penetration test reports cannot be completed at this time. Design partner and pilot engagements can proceed under NDA with appropriate risk acknowledgment.

---

## Data Handling

| Area | Current State |
|------|--------------|
| Data residency | Replit-hosted environment; no geo-selection |
| PII handling | Auth tokens org-scoped; no explicit GDPR Data Processing Agreement tooling |
| Data retention | DB-backed; no automated TTL policies |
| Export/deletion | No self-service data export or deletion UI |
| Encryption at rest | Platform default (Replit/PostgreSQL) |
| Encryption in transit | TLS via proxy |

---

## Integration Readiness

| Integration Type | Status |
|-----------------|--------|
| REST API | 6,063 route handlers; auth-gated; demo-mode data |
| WebSocket | HMAC-signed tickets; per-channel access control |
| Webhook ingestion | `packages/signal-mesh` — implemented |
| Enterprise SSO (SAML/SCIM) | Not implemented; OIDC/PKCE only |
| Data connectors (ERP, CRM, SIEM) | Schema exists; live sync requires per-tenant API keys; not wired in demo |
| SDK | `packages/szl-sdk` — TypeScript SDK; build fails currently |

---

## Deployment Model

| Aspect | Current State |
|--------|--------------|
| Deployment target | Replit hosted |
| Self-hosted / on-premise | Not available |
| Multi-region | Not configured |
| SLA | No formal SLA |
| Support tier | Founder-led |

---

## Known Production Blockers

Before SZL Holdings can be considered for production enterprise deployment, the following must be resolved:

1. **Pipeline failures** — typecheck, lint, and build all fail as of 2026-04-27
2. **SOC 2** — not initiated
3. **Redis session store** — in-memory sessions lost on restart
4. **Production error monitoring** — no alerting on production errors
5. **AIS live data** — paid subscription required for real maritime telemetry
6. **Mapbox token** — required for Terra geographic visualization
7. **Enterprise SSO** — SAML/SCIM not implemented
8. **SDK build** — `@szl-holdings/sdk` has TypeScript errors

---

*Generated by diligence audit task #3206 — 2026-04-27. Intended for qualified enterprise buyers under NDA.*
