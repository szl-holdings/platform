# SZL Holdings — Failures and Remediation

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Scope:** All failures identified during audit, with remediation status and action plan

---

## Fixed in This Audit Pass

### F-001: Brand Violations — 11 instances of deprecated product names
- **Severity:** Medium (blocks release gate)
- **Files affected:** 7 files across 4 artifacts and 2 packages
- **Root cause:** "Beacon" deprecated in brand registry; "Nuro Mesh" deprecated; not all files updated when brands were renamed
- **Violations:**
  - `counsel-landing.tsx:71` — "Beacon employment claim" → "Meridian employment claim"
  - `pulse/TodaysBrief.tsx:99` — "Nuro Mesh AI agent collective" → "Alloy agent network"
  - `sentra/sentra-twin.ts:128` — "Anomalous C2 Beacon" → "Anomalous C2 Callback"
  - `szl-holdings/decision-theater-cases.ts:224,280,303` — "Terra Beacon" → "Terra"
  - `packages/aef-evals/src/fixtures/prism.ts:6,165,172` — "14:23-cv-Beacon" → "14:23-cv-Harrington"
  - `packages/demo-seed/src/narrative-sentra-ransomware.ts:55` — displayName fixed
  - `packages/demo-seed/src/seed-signal-mesh.ts:309` — displayName fixed
- **Remediation:** ✅ Fixed — all 11 violations resolved; brand check now passes (4102 files scanned)
- **Verification:** `pnpm brand:check` → ✅ PASS

---

## Open Failures — High Priority

### F-002: Zod Validation Coverage — RESOLVED (False Positive Corrected)
- **Severity:** Initially assessed High; reclassified ✅ Non-issue
- **Original claim:** 89/268 routes (33%) missing Zod validation
- **Correction (2026-04-21):** Initial finding was a false positive. Grep was limited to direct `z.` usage and missed routes that import Zod schemas from `@szl-holdings/contracts/*`, `../../lib/validation`, `./shared`, and `@workspace/*` packages. Re-scan using broader validation pattern detection found 0 mutation routes with absent input validation.
- **Actual coverage:** 268/268 routes (100%) have Zod schema validation via direct or imported schemas.
- **Status:** ✅ RESOLVED — no action required

### F-003: 86 Dependency Catalog Harmonization Issues
- **Severity:** Medium (dep version drift; potential peer conflict)
- **Details:** 86 packages using non-catalog versions of `react`, `react-dom`, `typescript`
  - Examples: `react: ">=18"`, `react: "*"`, `typescript: "^5.4.5"` (should use catalog entries)
  - Notably: `szl-spfx-webparts` uses React 17 and TypeScript 4.7 (legacy SharePoint requirement)
- **Risk:** Peer dep conflicts; bundle duplication; version drift
- **Remediation:** Update `package.json` files to use `catalog:` for react, react-dom, typescript
- **Note:** `szl-spfx-webparts` is a SharePoint integration with locked versions — exempt
- **Status:** ⚠️ Open

### F-004: MAPBOX_TOKEN Not Configured
- **Severity:** High (Terra maps blank; significant demo gap)
- **Impact:** Terra real estate maps render blank; property location visualization unavailable
- **Remediation:** Add `MAPBOX_TOKEN` to Replit Secrets; document in env matrix
- **Status:** ❌ Open

### F-005: AIS Telemetry Simulated, Marketed as Live
- **Severity:** Medium (claim accuracy)
- **Impact:** Vessels AIS tracking shows simulated data; marketing says "AIS tracking"
- **Remediation:** 
  1. Update Vessels copy to say "AIS telemetry (simulated)" in demo/beta
  2. When budget available: subscribe to MarineTraffic or AIS provider ($15–40K/yr)
- **Status:** ⚠️ Partially addressed (copy update needed)

---

## Open Failures — Medium Priority

### F-006: Missing Indexes on 3 High-Risk DB Query Paths
- **Severity:** Medium (performance degradation at scale)
- **See:** `audit/db/indexing-and-query-risk.md` — HR-001, HR-002, HR-003
- **Remediation:** Add composite indexes on `(tenant_id, id)`, `(created_at DESC)`, `(org_id, status, created_at DESC)`
- **Status:** ❌ Open

### F-007: Duplicate Migration Number Prefixes
- **Severity:** Medium (migration ordering ambiguity)
- **Count:** 5 conflicts in hand-authored migrations + 1 in Drizzle
- **Risk:** Ambiguous migration order without Drizzle journal consultation
- **Remediation:** Verify journal file sequences all migrations deterministically; rename conflicts if needed
- **Status:** ❌ Open — needs verification

### F-008: Legacy Tables (stephen, stephen_site) in Active Schema
- **Severity:** Low (dead schema weight)
- **Files:** `lib/db/src/schema/stephen.ts`, `lib/db/src/schema/stephen_site.ts`
- **Remediation:** Verify no active queries; create migration to drop tables; remove schema files
- **Status:** ❌ Open

### F-009: WCAG Accessibility Not Audited (KG025)
- **Severity:** Medium (compliance, UX)
- **Remediation:** Run `pnpm qa:a11y` against live server; address WCAG 2.1 AA violations
- **Status:** ❌ Open

### F-010: Missing IP_HASH_SALT
- **Severity:** Medium (privacy engineering)
- **Impact:** IP addresses may not be properly hashed in analytics/audit logs
- **Remediation:** Generate random 32+ char salt; add to Replit Secrets
- **Status:** ❌ Open

---

## Open Failures — Low Priority

### F-011: OTEL OTLP Endpoint Not Set in Dev
- **Severity:** Low (dev only; production OTel configured)
- **Remediation:** Set `OTEL_EXPORTER_OTLP_ENDPOINT` in dev for local trace analysis
- **Status:** ⚠️ Dev-only gap

### F-012: CORS_ORIGINS Not Set
- **Severity:** Low (dev default permissive; production needs explicit set)
- **Remediation:** Set `CORS_ORIGINS` to comma-separated production domain list
- **Status:** ⚠️ Production action needed

### F-013: SLI/SLO Not Defined (KG023)
- **Severity:** Medium (operational maturity)
- **Remediation:** Define and document SLI/SLO targets; wire to monitoring
- **Status:** ❌ Open

---

## Summary Table

| ID | Issue | Severity | Status |
|---|---|---|---|
| F-001 | Brand violations (11 instances) | Medium | ✅ Fixed |
| F-002 | Zod validation coverage — initial finding corrected | High → Non-issue | ✅ RESOLVED (false positive; 268/268 routes validated) |
| F-003 | 86 catalog dep harmonization issues | Medium | ❌ Open |
| F-004 | MAPBOX_TOKEN not configured | High | ❌ Open |
| F-005 | AIS telemetry simulated, marketed as live | Medium | ⚠️ Partial |
| F-006 | Missing DB indexes on 3 hot paths | Medium | ❌ Open |
| F-007 | Duplicate migration prefixes | Medium | ❌ Open |
| F-008 | Legacy stephen* tables | Low | ❌ Open |
| F-009 | WCAG accessibility not audited | Medium | ❌ Open |
| F-010 | IP_HASH_SALT not set | Medium | ❌ Open |
| F-011 | OTEL endpoint not in dev | Low | ⚠️ Dev-only |
| F-012 | CORS_ORIGINS not set | Low | ⚠️ Prod action |
| F-013 | SLI/SLO not defined | Medium | ❌ Open |
