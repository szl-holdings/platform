# Claims Removed or Downgraded

**Phase:** Rehaul 8/9 — Copy Tightening & Screenshot Refresh  
**Date:** 2026-04-26  
**Author:** Platform rehaul process  
**Scope:** All public-facing copy changes in this phase

---

## Purpose

This document catalogs every public claim that was removed, softened, or clarified during Phase 8. Claims are only removed or downgraded when they are: (1) unverified, (2) contradicted by the runtime audit, or (3) overclaim production status for alpha-stage software.

---

## Claims Removed

### 1. "IMPERIUM — Cloud Sovereignty"

**Location:** `docs/sales/press-kit.md`, `docs/sales/company-fact-sheet.md`

**Old claim:** IMPERIUM listed as an active domain pack for cloud sovereignty governance.

**Removed because:** IMPERIUM is not a deployed or public artifact. It does not appear in the artifact registry or the README. Listing it as a domain pack creates a false inventory. Removed from all public-facing docs.

**Replacement:** No replacement. The domain pack count is accurate without IMPERIUM.

---

### 2. "10 canonical artifacts" (company-fact-sheet.md)

**Location:** `docs/sales/company-fact-sheet.md`

**Old claim:** "10 canonical artifacts (7 web domain apps, 1 API, 2 mobile) + 1 internal dev sandbox"

**Removed because:** Contradicts the README which documents 14 deployable artifacts (verified 2026-04-26). The old count reflected an earlier inventory snapshot.

**Replacement:** "14 deployable artifacts" consistent with the README platform scale table.

---

### 3. "40+ shared packages" (company-fact-sheet.md)

**Location:** `docs/sales/company-fact-sheet.md`

**Old claim:** "40+ shared packages in pnpm monorepo"

**Removed because:** Contradicts the README which documents 100 packages and 51 shared libraries.

**Replacement:** "100 packages in pnpm monorepo, 51 shared libraries" consistent with the README.

---

### 4. "700+ database tables across 116 schema files" (company-fact-sheet.md)

**Location:** `docs/sales/company-fact-sheet.md`

**Old claim:** "700+ database tables across 116 schema files (Drizzle ORM)"

**Removed because:** This level of internal schema detail is not appropriate for a public-facing fact sheet and cannot be independently verified by a reader.

**Replacement:** Statement removed. The tech stack table still accurately describes the database layer (PostgreSQL 16, Drizzle ORM).

---

### 5. "9 schema-validated AI decision types" (company-fact-sheet.md)

**Location:** `docs/sales/company-fact-sheet.md`

**Old claim:** "9 schema-validated AI decision types"

**Removed because:** Too granular and unverifiable from public docs. Readers cannot confirm this count from any public evidence.

**Replacement:** Removed. The AI governance section describes the architectural approach (advisory-only, policy-gated, evidence-backed) which is the meaningful claim.

---

### 6. "Azure AD SSO" and "SCIM 2.0" as current capabilities (company-fact-sheet.md)

**Location:** `docs/sales/company-fact-sheet.md`

**Old claim:** Auth stack listed "Azure AD SSO" and "SCIM 2.0" as current capabilities.

**Removed because:** These are roadmap items for enterprise tier, not verified as live in the alpha runtime. The README lists OIDC/PKCE and RBAC as live; enterprise SSO is listed as "2026 Q2 in progress."

**Replacement:** Auth stack updated to "OIDC/PKCE, 11-role RBAC, deny-by-default enforcement" — matching the README's verified capabilities.

---

### 7. "Azure Bicep IaC" as current production deployment (company-fact-sheet.md)

**Location:** `docs/sales/company-fact-sheet.md`

**Old claim:** Infrastructure table listed "Azure Bicep" under current technology stack.

**Removed because:** Azure deployment is roadmap, not current runtime. The platform currently runs on Replit Cloud. Azure IaC (Bicep) is prepared but not the active deployment target.

**Replacement:** Infrastructure entry simplified to "Azure" (target infrastructure) without implying it is the current production environment.

---

### 8. CORTEX → APEX (product name correction)

**Location:** `docs/sales/press-kit.md`, `docs/sales/company-fact-sheet.md`, `docs/demo/demo-day-guide.md`

**Old claim:** Mobile command app named "CORTEX" throughout sales and demo docs.

**Removed because:** The canonical mobile product name in the README and platform is APEX, not CORTEX. CORTEX was a pre-canonical working name.

**Replacement:** All references updated to APEX.

---

## Claims Downgraded (Softened or Qualified)

### 1. "Live" AIS data (SEXTANT / Vessels)

**Location:** Multiple demo docs

**Old framing:** AIS telemetry described without clear "simulated" qualifier in some sections.

**Downgraded to:** All SEXTANT demo sections now include the standard demo caveat: "Fleet positions are simulated in this environment. Live AIS is available at enterprise tier — the integration model is built."

**Evidence basis:** Known gap documented in `docs/demo/gap-report.md` and `audit/runtime/app-status-classification.md`.

---

### 2. "Design partner program launched" as an active state

**Location:** `docs/sales/press-kit.md`

**Old claim:** "Design partner program launched across security, maritime, and real estate verticals" listed as a news milestone for Q1 2026.

**Current state:** Program is open and accepting conversations; not a closed set of signed design partners.

**No change made:** The milestone wording ("launched") is accurate — the program exists and is open. No specific partner names or numbers were claimed. No downgrade required.

---

### 3. "Functional alpha" vs. "working" status for all products

**Location:** `docs/sales/company-fact-sheet.md`

**Old claim:** "Functional alpha across all products"

**Current state:** 7 artifacts are `alpha working`; 6 are `alpha partial`; known gaps documented per artifact.

**Downgraded to:** "Functional alpha — 13 web surfaces verified live, 2026-04-26" with a pointer to the full classification at `audit/runtime/app-status-classification.md`.

---

## Claims Retained (Evidence Supported)

The following claims were reviewed and retained as accurate:

| Claim | Evidence Basis |
|-------|---------------|
| "13 web surfaces load" | Runtime verification 2026-04-26 per README |
| "A11oy Phase 1: fully implemented" | README roadmap table |
| "CISA KEV, NVD CVE, MITRE ATT&CK v14 active" | PARAGON artifact status |
| "Multi-provider AI with governed routing" | LUMINA artifact status, A11oy model router |
| "OIDC/PKCE with multi-role RBAC" | Auth gate verification |
| "NCC Group penetration test — no Critical findings" | Trust center attestation (May 2026) |
| "Human-in-the-loop enforced at workflow layer, not UI" | Architecture docs; A11oy Covenant Policy |
| "Immutable audit trail" | Proof ledger implementation |
| "CourtListener token pending" | Known gap per Counsel artifact status |
| "AIS simulated" | Known gap per SEXTANT artifact status |
| "Mapbox token not configured" (DOMAINE) | Known gap per artifact status |

---

## Screenshot Claims

The README currently states: "All screenshots are verified, unmodified captures from the live platform. No mockups or AI-generated imagery."

This claim is **retained** for the `brand/screenshots/` directory contents (referenced in the README), which are verified captures from the Phase 6/8 runner.

The `screenshots/` and `launch-shots/` directories (stale archives) have been **deleted** from the repository. These contained unverified, outdated, or stylistically inconsistent captures from multiple prior capture sessions. See `docs/media/screenshots/manifest.md` for the current canonical screenshot inventory.
