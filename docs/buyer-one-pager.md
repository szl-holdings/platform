# SZL Holdings — Buyer One-Pager

**For:** Enterprise procurement, technical evaluation teams, and deal champions  
**As of:** April 2026

---

## What SZL Holdings Builds

**Governed operational intelligence for regulated enterprises.**

SZL Holdings builds and operates a unified platform that connects what an organization can observe to what it can act on — with full attribution, human-in-the-loop controls, and an immutable audit trail. Every AI recommendation routes through a required human approval gate before any consequential action is taken.

---

## The Problem We Solve

Organizations operating at scale face four compounding problems:

1. **Decision cycles are too slow.** Signal collection, context-building, and recommendation are manual processes. Executives assemble information before they can act.
2. **Triage is expensive.** Security, logistics, legal, and real estate teams spend most of their operational time investigating alerts rather than acting on them.
3. **Audit evidence is assembled retroactively.** Compliance reviews require weeks of evidence collection that should be created automatically during normal operations.
4. **Follow-ups fall through the gaps.** Fragmented tool stacks have no systemic accountability. Things get missed.

---

## The Platform

**Six platform primitives** differentiate the SZL platform from dashboards, copilots, and workflow tools:

| Primitive | What It Does |
|-----------|-------------|
| **Outcome Graph** | Tracks the full decision lifecycle: recommendation → action → outcome. Closed-loop learning. |
| **Proof Chain** | Immutable audit trail for every significant action. AI outputs carry provenance. |
| **Covenant Policy** | Defines what agents and users can do. Human-in-the-loop enforced at the policy layer. |
| **Decision Simulation** | Probabilistic simulation before action — confidence intervals and sensitivity analysis. |
| **Workflow Engine** | Durable multi-step orchestration with agent coordination and recovery. |
| **Event Fabric** | Cross-domain signal backbone — normalizes, routes, and correlates events across the ecosystem. |

**Four domain packs** extend these primitives into industry-specific intelligence:

- **Sentra** — Cyber resilience: exposure mapping, recovery readiness, incident command
- **Vessels** — Maritime fleet intelligence: voyage management, dark vessel detection, sanctions screening
- **Terra** — Real estate intelligence: distressed property pipeline, ownership graph, deal workflow
- **Counsel** — Legal matter command: obligation tracking, exposure quantification, matter management

---

## Modeled ROI

*(These are modeled ranges from industry benchmarks — not verified customer outcomes. SZL Holdings is in early commercial deployment.)*

| Category | Modeled Range | Basis |
|----------|--------------|-------|
| Decision cycle compression | 30–60% faster | Gartner / IDC operational intelligence benchmarks |
| Triage time reduction | 40–70% faster | Forrester Wave SOC + maritime/RE benchmarks |
| Audit overhead reduction | 50–80% less time | Deloitte / Protiviti compliance benchmarks |
| Follow-up miss elimination | 60–85% reduction | Salesforce / ServiceNow workflow ROI studies |

---

## What Is Real Today (Verified)

| Claim | Status | Evidence |
|-------|--------|----------|
| 915 database table definitions | VERIFIED | `grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" | wc -l` = 915 |
| 347 API route files (12 top-level route groups) | VERIFIED | `find artifacts/api-server/src/routes -name "*.ts" ! -name "*.test.ts" | wc -l` = 347; `api.route_files: 347`, `api.route_groups_top_level: 12` per audit/source-of-truth.json |
| 123 shared packages | VERIFIED | 82 domain packages (`packages/`) + 41 lib packages (`lib/`); `packages.total_packages.count: 123` per audit/source-of-truth.json |
| 165 schema files | VERIFIED | `find lib/db/src/schema -name "*.ts" | wc -l` = 165 |
| Deny-by-default auth on all routes | VERIFIED | Global auth enforcer with documented public allowlist |
| Human-in-the-loop enforcement | VERIFIED | Covenant Policy enforced at workflow layer; not UI-only |
| Immutable audit trail | VERIFIED | Proof Chain architecture in lib/proof-chain |
| CSRF protection | VERIFIED | Double-submit cookie pattern on all state-mutating routes |
| Rate limiting | VERIFIED | Global + per-endpoint sliding window applied to auth routes |
| Zod validation on all 347 route files (12 top-level route groups) | VERIFIED | Schema-first validation via @szl-holdings/contracts |

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

---

## Deployment Model

- **Hosting:** Replit cloud (current) / Azure (IaC available for enterprise deployment)
- **Database:** PostgreSQL 16 with Drizzle ORM; 139 tracked migrations
- **Auth:** OpenID Connect (PKCE), organization-scoped RBAC with 12 platform roles
- **Mobile:** Expo / React Native (iOS + Android) — CORTEX unified mobile command app
- **CI/CD:** GitHub Actions with CodeQL SAST, dependency review, and secret scanning active

---

## Architecture Snapshot

```
Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome
```

Every step is instrumented. Every decision is attributed. Every AI recommendation carries source citations and confidence scores. Every consequential action requires human confirmation.

---

## Who Builds This

**Stephen Lutar** — Founder and CEO, SZL Holdings  
**Contact:** inquiries@szlholdings.com  
**Website:** szlholdings.com  
**LinkedIn:** linkedin.com/in/stephen-l-279315240

Open to design partner conversations, enterprise evaluation, and investment introductions.

---

*This document reflects the verified platform state as of April 2026. Modeled ROI figures are sourced from industry benchmarks and labeled as such.*
