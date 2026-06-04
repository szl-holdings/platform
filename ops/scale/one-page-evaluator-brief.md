# One-Page Evaluator Brief

Phase E · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

The single page handed to a technical evaluator at an enterprise buyer.
Designed to fit on one printed page; this markdown is the source.

---

# SZL Holdings — Evaluator Brief

**Governed decision infrastructure for multi-domain operators.**

## What it is

Seven canonical domain surfaces (defense, maritime, real estate,
advisory, unified operations, portfolio, mobile command) running on a
shared platform that puts every automated decision through a 9-step
loop and records an auditable proof chain.

## The 9-step loop

`Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning`

Every decision the platform makes traverses this loop. Every step is
inspectable. Every decision is replayable from the proof entry alone.

## Architecture

| Layer | Today |
|-------|-------|
| Frontend | React + Vite per artifact (7 web + 1 mobile via Expo) |
| API | Express + Zod validation + RBAC middleware (~395 source files) |
| Data | PostgreSQL via Drizzle ORM (569 tables, 116 schema files) |
| Events | ATLAS event taxonomy with strict envelope validation (157 named events across 10 domains) |
| AI | OpenAI / Anthropic / Gemini via Replit proxy |
| Auth | Clerk + RBAC (11-role hierarchy) |
| Hosting | Replit Autoscale |
| Mobile | Expo + EAS, biometric auth, secure storage, offline sync |

## Security posture

- All secrets in managed Secrets panel (none in source, none in shared env)
- Field-level encryption (AES-256-GCM) on Restricted-class data
- HSTS, CSP, X-Frame-Options enforced
- Audit log on every sensitive action
- Cross-tenant leakage detection at Tier 1 telemetry
- SOC 2 / ISO 27001: not certified; aligned controls in place;
  certification on demand-driven roadmap
- Documented secret rotation schedule and incident response model

## What it does NOT pretend to be

- Not a database — sits on PostgreSQL
- Not a hyperscaler — sits on Replit
- Not a one-product platform — seven domain surfaces share the substrate
- Not a black box — proof chain is the deliverable, not a side effect
- Not certified yet — controls are real; paperwork is in flight

## Honest status per surface

| Surface | UI | Backend | Live data | Production-ready |
|---------|----|---------|-----------|------------------|
| szl-holdings (flagship) | High | High | Partial | Yes — alpha |
| Carlota Jo | High | High | Yes | Yes — operational |
| Command (unified ops) | High | High | Partial | Yes — alpha |
| Aegis (defense) | High | Partial | Stubbed | No |
| Terra (real estate) | High | Partial | Stubbed | No |
| Vessels (maritime) | High | Partial | Stubbed | No |
| CORTEX mobile | High | Partial | Partial | Pre-store-release |

## What you get in a pilot

- A workspace with your data shape pre-loaded
- A real workflow run end-to-end through the 9-step loop
- A proof chain entry you can audit
- Founder-owned 90-day engagement with weekly working sessions
- A reference to call: another design partner under prior approval

## Linked depth

- Buyer FAQ: `ops/scale/buyer-faq.md`
- Diligence playbook: `ops/scale/diligence-fast-path.md`
- Truth audit (numbers above): `ops/frontier/repo-truth-audit.md`
- Market benchmark: `ops/frontier/market-benchmark-gap-analysis.md`
- Threat model: `ops/security/threat-model-summary.md`

## Contact

Stephen Lutar — Founder & CEO — SZL Holdings
[email] · [calendar link]
