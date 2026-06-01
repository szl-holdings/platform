# SZL Holdings — April 2026 Operational Audit
**Date:** April 18, 2026  
**Scope:** All 11 registered artifacts, all packages, all public claims, all open tasks  
**Executor:** Automated code audit (task-1786)

---

## One-Screen Summary

SZL has real infrastructure, real live data feeds, and a genuine architectural differentiator (the governed decision loop). The problem is that this truth is buried under a layer of hardcoded claims, unverified metrics, and inconsistent demo labeling that creates material credibility risk in investor and enterprise demos.

**The three things that must change before the next major demo:**

1. **Mapbox token** → Terra maps are blank. Set the token. This takes 10 minutes and removes the most visible failure in any Terra demo.

2. **Hardcoded KPIs** → "52,000+ vessels monitored," "2.4M+ signals/day," "31,200+ simulations," and "99.98% uptime" are all fabricated. Either source them from live instrumentation or label them `[Demo]`. The platform's entire trust story collapses if investors find these first.

3. **Seed endpoint guard** → The `/api/admin/seed` endpoint must refuse to execute in production. A misconfigured deployment could corrupt live data. This takes 5 lines of code.

**Everything else is prioritized in the gap report.**

---

## What's Real (and Worth Talking About)

- The governed decision loop (Signal → Proof → Outcome) is real code, not a wireframe.
- CISA KEV, NVD CVE, MITRE ATT&CK, NYC Open Data, NOAA, BLS, and GDELT feeds are live.
- PostgreSQL with real tenant isolation and Drizzle ORM — no in-memory session store.
- Covenant Policy enforcement (AI cannot execute without human approval) is architectural, not a checkbox.
- Pulse AI briefings use a real LLM when API keys are configured.
- Carlota Jo is GA — the most complete and demo-ready artifact.

---

## Files in This Folder

| File | What it contains |
|---|---|
| `system-inventory.md` | Every artifact, package, API route, job, table, env var, and integration tagged real / demo-fixture / stub / dead |
| `mock-and-gap-report.md` | Every mock, placeholder, dead button, and fake metric across all surfaces, prioritized P0–P3 |
| `public-claims-registry.md` | Every number, product name, and capability claim on any public surface with truth value |
| `demo-readiness-scorecard.md` | A–F grades for each artifact across seven gates: Truthfulness, Reliability, Data Integrity, Security, Observability, Demo Readiness, Release Discipline |
| `task-reconciliation.md` | Cross-reference of open tasks against the gap report — which are still-needed, duplicate, obsolete, or missing |
| `README.md` | This file — executive summary |

## Related Files

| File | What it contains |
|---|---|
| `docs/doctrine/szl-doctrine.md` | The SZL point of view: four pillars, voice rules, anti-patterns, visual signatures |
| `docs/doctrine/inspiration-research.md` | Research sources: LangSmith, OpenFeature, OTel GenAI, Palantir, Datadog, demo discipline |
| `packages/config/` | Single source of truth module: platform registry, public claims, feature flags, env contract |
| `artifacts/szl-holdings/src/lib/claims.ts` | Proof-point migration: szl-holdings reads public claims from the registry |
| `scripts/smoke-claims-registry.ts` | Smoke test: fails CI if registry structure breaks or unverified claims lose their labels |

---

## Recommended Next Actions (ordered)

1. Set `MAPBOX_TOKEN` in environment secrets.
2. Add production guard to admin seed endpoint (P0-001).
3. Apply `[Demo]` labels to all unverified KPIs on szl-holdings dashboard.
4. Feature-flag the 8 unwired Aegis modules and 3 unwired Vessels modules.
5. Fix the Command status page "99.98% uptime" hardcoded value.
6. Run `pnpm tsx scripts/smoke-claims-registry.ts` — add to CI.
7. File the 16 new tasks identified in task-reconciliation.md Part 3.
8. Migrate remaining artifacts to read from `packages/config`.
