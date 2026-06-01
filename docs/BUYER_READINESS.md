# SZL Holdings — Buyer Readiness

**Date:** April 28, 2026
**Audience:** Enterprise procurement teams, technical evaluators, InfoSec, and deal champions

---

## What SZL Holdings Builds

**Governed operational intelligence for regulated enterprises.**

SZL Holdings builds a unified platform that connects what an organisation can observe to what it can act on — with full attribution, human-in-the-loop controls, and an immutable audit trail at every step.

**Not a dashboard.** Not a copilot. Not a workflow tool.

It is a decision operating system where every AI recommendation carries a proof chain, every action requires policy-gated approval, and every outcome is tracked and fed back to calibrate future decisions.

---

## The Problem We Solve

Organisations operating at scale face four compounding problems:

1. **Decision cycles are too slow.** Signal collection, context-building, and recommendation are manual processes. Executives assemble information before they can act.
2. **Triage is expensive.** Security, logistics, legal, and real estate teams spend most of their operational time investigating alerts rather than acting on them.
3. **Audit evidence is assembled retroactively.** Compliance reviews require weeks of evidence collection that should be created automatically during normal operations.
4. **Follow-ups fall through the gaps.** Fragmented tool stacks have no systemic accountability. Things get missed.

---

## The Platform

### Six Core Primitives

These differentiate the SZL platform from dashboards, copilots, and workflow tools. All are implemented code packages — not slide deck concepts.

| Primitive | What It Does | Status |
|-----------|-------------|--------|
| **Outcome Graph** | Tracks full decision lifecycle: recommendation → action → outcome. Closed-loop learning. | **Operational** |
| **Proof Chain** | Immutable hash-linked audit trail for every significant action. AI outputs carry provenance. | **Operational** |
| **Covenant Policy Engine** | Defines what agents and users can do. Human-in-the-loop enforced at the policy layer. | **Operational** |
| **Decision Replay** | Full reconstruction of any decision from trace — auditors can walk through exactly what happened. | **Operational** |
| **Signal Mesh (Event Fabric)** | Cross-domain event backbone — normalises, routes, and correlates events across the ecosystem. | **Operational** |
| **Simulation Engine** | Probabilistic (Monte Carlo) simulation before consequential actions — confidence intervals and sensitivity analysis. | **Operational** |

### Domain Packs

Each domain pack extends the shared governance primitives into industry-specific intelligence:

| Domain | Product | Status | Live Data |
|--------|---------|--------|-----------|
| Security | Sentra | **Beta** | CISA KEV, NVD CVE, MITRE ATT&CK, AbuseIPDB |
| Maritime | Vessels | **Partial** | NOAA, Open-Meteo; AIS telemetry is simulated (note below) |
| Real Estate | Terra | **Beta** | NYC Open Data, Census, BLS, FEMA, SEC EDGAR |
| Legal | Counsel | **Beta** | Matter management, filings, obligation tracking |
| Advisory | Carlota Jo | **Beta** | Client/engagement management, UHNW operations |
| Executive Briefing | Pulse | **Beta** | Cross-domain signal synthesis |
| Mobile Command | CORTEX | **Beta** | Expo React Native (iOS + Android) |

**AIS note:** Vessels maritime intelligence currently uses simulated AIS telemetry. Live AIS requires a paid subscription ($15–40K/year). All other Vessels data feeds (NOAA weather, Open-Meteo) are live.

---

## What Is Operational Today (Verified)

| Claim | Status | Evidence Source |
|-------|--------|----------------|
| 347 API route files, 12 top-level route groups | **Verified** | `audit/source-of-truth.json` |
| 1,047 database tables | **Verified** | Live PostgreSQL count |
| 123 shared packages (82 domain + 41 lib) | **Verified** | `audit/source-of-truth.json` |
| Deny-by-default auth on all routes | **Verified** | Global auth enforcer with documented public allowlist |
| Human-in-the-loop enforcement | **Verified** | Covenant Policy enforced at workflow layer, not UI-only |
| Immutable audit trail | **Verified** | Proof Chain architecture in `lib/proof-chain` |
| CSRF protection | **Verified** | Double-submit cookie pattern on all state-mutating routes |
| Rate limiting | **Verified** | Global + per-endpoint sliding window on auth routes |
| Zod schema validation | **Verified** | Schema-first validation via `@szl-holdings/contracts` on all routes |
| 12-role RBAC, org-scoped isolation | **Verified** | Auth middleware, tenant isolation in all DB queries |

## Where Demo/Seed Data Exists

- Dashboard KPIs: some seeded values (not live aggregation from all sources)
- Maritime AIS telemetry: simulated (no live AIS subscription yet)
- Some Sentra scenarios: seeded for demonstration
- Fund operations metrics: seeded demo data

**Policy:** Seed data is gated behind `DEMO_MODE=true` and never runs in production mode. See `docs/DEMO_DATA_POLICY.md`.

---

## Security Posture

| Control | Status |
|---------|--------|
| Authentication | OpenID Connect (PKCE) — org-scoped |
| Authorization | 12-role RBAC, deny-by-default global enforcer |
| Tenant isolation | All queries scoped by `org_id`; cross-org returns 404 |
| CSRF protection | Double-submit cookie pattern |
| Rate limiting | Express rate limiter — global + per-endpoint |
| Audit trail | Immutable audit events on all writes |
| AI governance | Covenant Policy + Guardian engine; mandatory human approval gates |
| Secret scanning | GitHub push + scheduled scans |
| Dependency review | PR-level dependency review enforced in CI |
| Code analysis | CodeQL semantic analysis on every PR |

Full assessment: `docs/security-posture.md` / `docs/TRUST_CENTER.md`

---

## Human-in-the-Loop Policy

AI cannot execute consequential actions without human confirmation. The Covenant Policy engine enforces mandatory approval gates based on risk tier:

| Risk Tier | Gate |
|-----------|------|
| Low | Auto-approved by policy engine |
| Medium | Team lead approval required |
| High | Department head approval required |
| Critical | Executive + policy engine approval required |

Every approval decision is recorded in the Proof Chain with actor, timestamp, rationale, and policy reference.

---

## Modeled ROI

*These are modelled ranges from industry benchmarks — not verified customer outcomes. SZL Holdings is in early commercial deployment.*

| Category | Modelled Range | Basis |
|----------|--------------|-------|
| Decision cycle compression | 30–60% faster | Gartner / IDC operational intelligence benchmarks |
| Triage time reduction | 40–70% faster | Forrester Wave SOC + maritime/RE benchmarks |
| Audit overhead reduction | 50–80% less time | Deloitte / Protiviti compliance benchmarks |
| Follow-up miss elimination | 60–85% reduction | Salesforce / ServiceNow workflow ROI studies |

---

## Deployment Model

| Environment | Infrastructure | Notes |
|-------------|---------------|-------|
| Development | Replit workspace | Full stack, instant iteration |
| Production | Replit Deployments | Auto-scaling, TLS, health checks |
| Database | PostgreSQL 16 (Replit managed) | 1,047 tables, 165 schema files, 139 tracked migrations |
| Mobile | Expo / React Native | iOS + Android |
| CI/CD | GitHub Actions | 22 workflows, pinned action SHAs |
| Enterprise option | Azure IaC available | For on-premises or cloud-isolated deployment |

---

## What Requires Operator Configuration Before Production

| Item | Action Required |
|------|----------------|
| Mapbox token | Add `MAPBOX_TOKEN` to secrets (Terra maps require this) |
| Sentry error monitoring | Add `SENTRY_DSN` to secrets |
| Redis session store | Activate Redis adapter in API server config |
| Stripe live mode | Configure live Stripe key for revenue collection |
| MFA encryption key | Set `MFA_SECRET_ENCRYPTION_KEY` (TOTP requires this) |
| Enterprise CORS domain | Add custom domain to `CORS_ORIGINS` allowlist |
| AIS subscription | Purchase AIS data feed for live Vessels telemetry |

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

## Contact

**Stephen Lutar** — Founder and CEO, SZL Holdings
**Contact:** inquiries@szlholdings.com
**Website:** szlholdings.com

Open to design partner conversations, enterprise evaluation, and investment introductions.

---

*This document reflects the verified platform state as of April 28, 2026. Modelled ROI figures are sourced from industry benchmarks and labelled as such. For full due diligence materials, see `docs/BUYER_DILIGENCE_READINESS.md`.*
