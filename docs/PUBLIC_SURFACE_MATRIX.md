# SZL Holdings — Public Surface Matrix

**Date:** April 22, 2026
**Scope:** Every public-facing claim, endpoint, asset, and document — verified against code reality

---

## Public-Facing Claims Audit

### README.md Claims

| Claim | Source | Verified? | Notes |
|-------|--------|-----------|-------|
| "Governed decision infrastructure" | README L5 | **Yes** | Proof Chain, Outcome Graph, Covenant Policy all implemented in `lib/` |
| "15 active registered artifacts" | README via platform-facts | **Partially** | 14 registered in artifact system; 3 dead dirs exist unregistered |
| "6 domain packs" | README portfolio table | **Yes** | Lyte, Vessels, Terra, Aegis, PRISM/Counsel, Carlota |
| "2,781 route handlers" | This audit | **Yes** | Counted from grep across 257 route files |
| "732 database tables" | This audit | **Yes** | Live `pg_tables` count |
| "11-role RBAC" | Trust Center | **Yes** | Verified in `lib/auth` + middleware |
| "Deny-by-default global auth" | Trust Center | **Yes** | `globalAuthEnforcer` in `app.ts` |
| "IMPERIUM — Archived" | README portfolio table | **Yes** | Task #920; artifact dir exists but unregistered |
| "Platform facts auto-generated" | README | **Yes** | `scripts/generate-platform-metrics.ts` + `packages/platform-metrics-registry` |
| "Covenant Policy enforces approval gates" | Trust Center | **Yes** | `lib/covenant-policy` + Guardian engine |
| Screenshot: SZL Holdings Dashboard | README | **Check** | `docs/assets/screenshots/current/szl-holdings-dashboard.jpg` |
| Screenshot: KORA PRAXIS Command | README | **Check** | `docs/assets/screenshots/current/kora-praxis-command.jpg` |

### Contradictions Found

| Contradiction | Location | Resolution |
|---------------|----------|------------|
| README says "15 registered artifacts" but 14 are registered + 3 dead dirs | README + artifact system | Update to 14 active; note 3 archived |
| `prism-counsel-ci.yml` references archived PRISM Counsel | `.github/workflows/` | Remove workflow |
| Platform table says "PARAGON" but artifact is "Aegis" | README portfolio table | Verify brand mapping is intentional (PARAGON = public brand, Aegis = artifact slug) |
| Schema definitions (1,084) exceed live tables (732) | `lib/db/schema` vs `pg_tables` | 352 definitions not materialized — includes relations, views, and orphans |

### Broken Links / Dead References

| Item | Location | Status |
|------|----------|--------|
| `artifacts/firestorm/` | README portfolio table | **Dead** — no such directory exists |
| Mapbox maps | Terra artifact | Blank — `MAPBOX_TOKEN` not configured |

---

## API Public Surface

| Base Path | Domain | Handler Count | Auth Required | Notes |
|-----------|--------|---------------|---------------|-------|
| `/api/health` | Platform | 3 | No | Public health probe |
| `/api/auth/` | Auth | ~15 | Mixed | OIDC flow endpoints |
| `/api/admin/` | Admin | ~40 | Yes (admin) | Governance, tenant management |
| `/api/aegis/` | Security | ~200 | Yes | SOC, alerts, incidents, intel |
| `/api/terra/` | Real Estate | ~150 | Yes | Distress, deals, portfolio, diligence |
| `/api/vessels/` | Maritime | ~120 | Yes | Fleet, voyages, freight, S&P |
| `/api/counsel/` | Legal | ~80 | Yes | Matters, filings, evidence |
| `/api/carlota/` | Advisory | ~50 | Yes | Clients, services, billing |
| `/api/pulse/` | Briefing | ~40 | Yes | Signal synthesis, briefings |
| `/api/lyte/` | Decision Intel | ~60 | Yes | Actions, signals, fusion |
| `/api/alloy/` | Agent Runtime | ~200 | Yes | Chat, skills, governance, runtime |
| `/api/agents/` | Agent OS | ~100 | Yes | Agent management, execution |
| `/api/signal-*` | Signal Mesh | ~50 | Yes | Chains, mesh, fabric |
| `/api/graphql` | GraphQL | 1 | Yes | Unified query endpoint |

---

## Document Surface (Public-Ready)

| Document | Path | Status | Audience |
|----------|------|--------|----------|
| README.md | Root | Current | Public/GitHub |
| SECURITY.md | Root | Current | Security researchers |
| CONTRIBUTING.md | Root | Current | Contributors |
| CODE_OF_CONDUCT.md | Root | Current | Community |
| LICENSE.md | Root | UNLICENSED | Internal |
| Trust Center | `docs/trust/trust-center.md` | Current | Enterprise buyers |
| Architecture | `docs/architecture/architecture.md` | Current | Technical evaluators |
| Security Posture | `docs/security-posture.md` | Current | Security teams |
| Platform Facts | `docs/platform-facts.md` | Auto-generated | Investors |
| App Status | `docs/APP_STATUS.md` | Current | Internal/investors |
| Investor Thesis | `docs/investor/platform-thesis.md` | Current | Investors |

---

## Screenshot/Asset Audit

| Asset | Path | Exists? | Current? |
|-------|------|---------|----------|
| SZL Holdings Dashboard | `docs/assets/screenshots/current/szl-holdings-dashboard.jpg` | Check | Unknown |
| KORA PRAXIS Command | `docs/assets/screenshots/current/kora-praxis-command.jpg` | Check | Unknown |
| Total screenshots in `docs/screenshots/` | — | 20 files | Age unknown |

---

## Disposition Recommendations

| Item | Action | Priority |
|------|--------|----------|
| `artifacts/cortex-mobile/` | Archive (rm or .gitignore) | Low |
| `artifacts/imperium/` | Archive (rm or .gitignore) | Low |
| `artifacts/prism-counsel/` | Archive (rm or .gitignore) | Low |
| `prism-counsel-ci.yml` | Remove | Low |
| README `firestorm/` reference | Remove | Medium |
| Schema orphan audit (352 gap) | Investigate | Low |
| Mapbox token | Configure or document as known gap | Medium |
