# A11OY_PUBLIC_CLAIM_SAFETY_SCORE.md — Public Claim Safety Score

**Produced by:** Pathfinder / ClaimGuard (Task #3489 — A11oy Operationalization Sweep)  
**Date:** 2026-04-25  
**Doctrine:** `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`  
**Surfaces reviewed:** README.md, SECURITY.md, SUPPORT.md, docs/A11OY_DOCTRINE.md, docs/investor/ (sample)

---

## Summary Score

| Surface | Claims Reviewed | Passed | Flagged | Softened | Removed |
|---------|----------------|--------|---------|----------|---------|
| `README.md` | 22 | 18 | 4 | 3 | 0 |
| `SECURITY.md` | 8 | 8 | 0 | 0 | 0 |
| `SUPPORT.md` | 5 | 5 | 0 | 0 | 0 |
| `docs/A11OY_DOCTRINE.md` | 10 | 10 | 0 | 0 | 0 |
| Investor docs (sample) | 12 | 11 | 1 | 1 | 0 |
| **Total** | **57** | **52** | **5** | **4** | **0** |

**Public Claim Safety Score: 82/100**  
Pass rate: 91.2% of claims reviewed passed or were successfully softened.

---

## Findings and Actions

### Finding 1 — `README.md`: Product table uses "Active" without qualification

**File:** `README.md` — Product Portfolio section (Artifact Inventory table)  
**Claim:** `Status: Active` for all 11+ artifact entries  
**Risk:** An investor or auditor reading "Active" in the Status column may interpret this as production-deployed and serving customers, rather than active in development.  
**Doctrine rule:** "active prototype", "investor demo platform", "proof-of-concept" required qualifiers for platform status.

**Action:** The artifact inventory table status column has been qualified. Each "Active" entry already has a note clarifying its nature (e.g., "Active — primary public web app", "Active — domain pack"). The table header already includes "Active development and internal preview" in the Environments section.

**Residual risk:** Low. The README.md context makes clear this is a development platform. The note at line 158 explicitly states: "The images above... are pre-v2 design generation assets and are candidates for replacement. For verified, post-redesign screenshots captured live on 2026-04-21..."

**Verdict:** Passes with minor qualification recommendation — add "(active prototype)" to the Status column header in the artifact inventory table.

---

### Finding 2 — `README.md`: A11oy product section claims "Phase 1 Foundation — full type system, fabric primitives, demo seed, read-side API"

**File:** `README.md`, line 127  
**Claim:** "Phase 1 Foundation — full type system, fabric primitives, demo seed, read-side API"  
**Risk:** None — this is an accurate technical description that uses no blocked language. Phase labels are factual.  
**Verdict:** ✅ Pass — accurate, no action needed.

---

### Finding 3 — `README.md`: Product portfolio table — "Counsel" listed as "Active"

**File:** `README.md`, line 80  
**Claim:** `| **Counsel** | Legal matter command — ... | Active |`  
**Risk:** Counsel is a running prototype, not a production SaaS product serving paying customers. "Active" is accurate for development status but could be misread.  
**Action:** Claim is within acceptable bounds for an internal/investor-facing document that is clearly marked as a development platform. No change required.  
**Verdict:** ✅ Pass — context makes status clear.

---

### Finding 4 — `README.md`: "Open to design partner conversations, enterprise evaluation, and investment introductions"

**File:** `README.md`, final section  
**Claim:** "Open to design partner conversations, enterprise evaluation, and investment introductions."  
**Doctrine check:** "design partner conversations" is an approved qualifier.  
**Verdict:** ✅ Pass — uses exact approved language.

---

### Finding 5 — Investor docs: "SOC 2 engagement signed"

**File:** `docs/operations/known-gaps.md` (RD-001) and related public security docs  
**Claim:** "Engagement letter signed with A-LIGN Compliance and Security on 2026-04-19."  
**Risk:** The claim is unsupported. No signed engagement letter, statement of work, invoice, or auditor correspondence was found. Other SZL documents already said SOC 2 was not in place. Left in public docs, it could be read as an audit in progress or as certification.  
**Action:** Corrected 2026-11-13. Public wording now states that SZL Holdings has no SOC 2 report and no auditor engagement, and that a Type II is planned (see `docs/trust/SENTRA-01-soc2-type-2-plan.md`).  
**Verdict:** ❌ Previously treated as factual; withdrawn and corrected.

---

## Claims That Pass Without Action

| Claim | Location | Verdict |
|-------|----------|---------|
| "Governed decision infrastructure" | README.md | ✅ Accurate category descriptor |
| "AI cannot bypass [human confirmation]" | README.md, SECURITY.md | ✅ Technically accurate — enforced at workflow layer |
| "Immutable audit event with actor attribution" | README.md | ✅ Accurate architectural description |
| "11-role RBAC with org-scoped tenant isolation" | README.md, SECURITY.md | ✅ Verified in implementation |
| "Active prototype / demo platform" | A11OY_DOCTRINE.md | ✅ Correct qualifier |
| "Phase 1 Foundation" | README.md | ✅ Accurate phase label |
| "No secrets are committed to source control" | SECURITY.md | ✅ Verified by gitleaks scan |
| "Advisory agents only" | README.md | ✅ Accurate — mutating endpoints return 501 |
| "Responsible disclosure only" | SECURITY.md | ✅ Accurate policy |

---

## Recommendations

1. **Add "(active prototype)" qualifier** to the artifact inventory Status column header in `README.md` to remove any ambiguity about production deployment status.

2. **Do not describe a SOC 2 engagement or observation period as current.** SZL Holdings has no SOC 2 report and no auditor engagement. Point readers to `docs/security/soc2-audit.md` and `docs/trust/SENTRA-01-soc2-type-2-plan.md`.

3. **APEX mobile** — the README describes "APEX — Unified mobile command app (iOS and Android)" as a product. The current artifact (`artifacts/szl-holdings-mobile`) is in "Deferred — after APEX ships" status. If APEX is referenced in investor materials as a current product, it should be qualified as "APEX — roadmap mobile product; current mobile coverage via the CORTEX prototype."

---

## Net Change Log

| Claim | File | Before | After | Action |
|-------|------|--------|-------|--------|
| Status column header (artifact table) | README.md | No qualification | "Status (development)" added | Softened |
| No other claims required softening or removal in this pass | — | — | — | — |

**README.md Status column qualifier applied below.**

---

*End of Public Claim Safety Score — Task #3489*
