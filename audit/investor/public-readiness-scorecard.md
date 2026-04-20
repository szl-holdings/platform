# Public Readiness Scorecard — Series A Investor Perspective

**Produced:** Phase D, April 2026  
**Evaluator lens:** Technical Series A investor doing a 30-minute GitHub due diligence walk.

---

## Scoring Key

| Score | Meaning |
|-------|---------|
| ✅ Pass | Strong signal; no action needed |
| ⚠️ Caution | Acceptable but could be tighter |
| ❌ Gap | Needs attention before investor outreach |

---

## 1. Thesis Clarity

**Score: ✅ Pass**

The README opens with a clear one-line thesis: *"Governed decision infrastructure — connecting what is observable to what is executable, with full attribution."* The problem statement (accountability gap between dashboards and action) is articulated crisply. The pipeline metaphor (`Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome`) communicates full-cycle governance without requiring domain knowledge. An investor can understand the category and differentiation in under 2 minutes.

**Notes:**
- The "What We Build" section is specific about the gap — AI tools adding recommendation volume without governance. This is a credible, technically grounded framing.
- The six platform primitives table is clean and differentiated.
- No inflated claims ("the only platform," "100x better") — appropriate restraint.

---

## 2. Architecture Summary

**Score: ✅ Pass**

The ASCII architecture diagram is readable, accurate, and communicates a multi-layer platform with genuine separation of concerns. Three tiers are clear: Platform Core (Lyte, Alloy, CORTEX), Domain Packs, and Governance Infrastructure. The data layer is honest (PostgreSQL 16 with Drizzle ORM, external feeds cited by protocol).

**Notes:**
- `architecture.md` and `PLATFORM_PRIMITIVES.md` are linked and exist on disk.
- The monorepo structure table in the README is accurate and maps correctly to the filesystem.
- The artifact inventory table is honest about archived vs. active status.
- Minor: `architecture.md` version is listed as v4.0 — investors who look at the history may see earlier iterations; this is fine but worth noting.

---

## 3. Trust and Security Posture

**Score: ✅ Pass**

The trust table in the README directly maps concerns to structural responses — not policy pledges. RBAC count (11 roles), org-scoped tenancy, deny-by-default, Covenant Policy, Proof Chain — all have corresponding implementation. The `SECURITY.md` exists. `KNOWN-GAPS.md` exists and is linked prominently, which signals maturity rather than defensiveness.

**Security infrastructure on the repo:**
- CodeQL: ✅ present, pinned SHA, weekly schedule
- Dependabot: ✅ present, weekly, grouped
- Secret scanning + push protection: ✅ enabled
- Branch protection: ✅ applied to `master` and `main`
- Gitleaks secret scan workflow: ✅ present

**Notes:**
- Trust Center (`docs/trust/`) exists.
- Proof and Policy Model doc exists.
- This is one of the strongest sections of the public surface.

---

## 4. Screenshot Polish

**Score: ⚠️ Caution**

The 6 curated screenshots in `assets/readme/products/` are professional-quality product shots with consistent visual identity. However:

- Prior to Phase D, 2 archived product screenshots (PRISM Counsel, IMPERIUM) remained in the README Screens section — these have now been removed.
- The curated 6 screenshots cover: dashboard hero (SZL Holdings), security command (Aegis), maritime (Vessels), real estate (Terra), command portal, and mobile (CORTEX). Good coverage across the required categories.
- Screenshots cannot be independently verified as running live app state vs. design mockups from this review. They are visually coherent and enterprise-quality.
- No low-resolution or broken image links remain after Phase D cleanup.

**Recommendation:** Regenerate screenshots using `scripts/capture-screenshots.sh` once all workflows are running to ensure they reflect the current UI.

---

## 5. Setup Documentation

**Score: ✅ Pass**

The getting-started section is minimal and accurate: `git clone`, `pnpm install`, `pnpm dev`. Requirements are stated (Node.js 22+, pnpm 10+). Common task commands are listed. `DEPLOYMENT-GUIDE.md`, `CONTRIBUTING.md`, and environment matrix are linked. An engineer can orient themselves in under 5 minutes.

**Notes:**
- `CONTRIBUTING.md` exists and references CI requirements.
- The environment table (Development / Staging / Production) is clear.
- No broken links in the README navigation.

---

## 6. Issue and PR Hygiene

**Score: ✅ Pass**

- Issue templates: present (bug, feature, security)
- PR template: present
- CODEOWNERS: present
- Branch protection: enforced with 1 required review + status checks

The repo has not accumulated visible open issues or PRs that would signal instability (based on the public surface). GitHub Actions workflows are configured for CI Gate, E2E Gate, and Lighthouse Gate as required checks.

---

## 7. Release Notes

**Score: ⚠️ Caution**

A `release.yml` GitHub Actions workflow exists, suggesting releases are generated automatically. However, no public release or changelog entry was confirmed as present on the public surface at time of this audit.

**Recommendation:** Create at least one public GitHub release (e.g., `v1.0.0-alpha`) with a changelog summary. Investors doing GitHub due diligence look for releases as a signal of shipping cadence and version discipline.

---

## 8. Leak and Clutter Check

**Score: ✅ Pass (with minor items flagged)**

- No credentials, tokens, or connection strings found in public files.
- No `nohup.out`, log files, or test artifacts in the public surface.
- `demo-assets/szl-holdings-investor-carousel.pdf` is present in the repo — this may contain non-public metrics. Recommend moving to a private channel. *(Flagged; not deleted by this phase.)*
- Non-image files in `screenshots/` directory (`generate-pdf.mjs`, `linkedin-post.md`, binary archives) removed in Phase D.
- Working/draft screenshot subdirectories quarantined to `archive/phase-d-media/`.

---

## 9. Org Profile Coherence

**Score: ⚠️ Caution**

The org profile (`szl-holdings/.github/profile/README.md`) is polished and enterprise-grade. However, it listed PRISM Counsel and IMPERIUM as active domain packs — inconsistent with the main repo. The org profile and user `profile-readme/README.md` should be updated to reflect archived status.

**Action required:** Update org and user profile READMEs to mark archived products. (Pushed in Phase D for the org profile; user profile requires a separate commit to the profile repo.)

---

## 10. Cross-Document Claim Consistency

**Score: ✅ Pass**

Metrics appear consistently across the README, org profile, and `docs/platform-facts.md`:
- **11 artifacts** — verified against registered artifact list
- **2,816 API endpoints** — machine-generated
- **798 database tables** — machine-generated
- **6 domain packs** — matches product portfolio table

The `docs/platform-facts.md` disclaimer that metrics are auto-generated by `pnpm metrics:generate` and should not be edited manually is present and respected.

---

## Overall Readiness Score

| Category | Score | Weight |
|----------|-------|--------|
| Thesis clarity | ✅ | High |
| Architecture summary | ✅ | High |
| Trust / security posture | ✅ | High |
| Screenshot polish | ⚠️ | Medium |
| Setup documentation | ✅ | Medium |
| Issue / PR hygiene | ✅ | Low |
| Release notes | ⚠️ | Medium |
| Leak / clutter | ✅ | High |
| Org profile coherence | ⚠️ | Medium |
| Cross-doc consistency | ✅ | High |

**Overall: 7/10 pass, 3 cautions, 0 critical gaps**

The public surface is credible and above average for a pre-Series-A technical investment review. The three cautions (screenshot verification, release notes, org profile coherence) are tactical and can be resolved in a single sprint. The trust and architecture posture are genuinely strong and will hold up to technical scrutiny.

---

## Priority Actions Before First Investor GitHub Review

1. *(Tactical, ~1 hr)* Create a `v1.0.0-alpha` GitHub release with a changelog summary.
2. *(Tactical, ~30 min)* Update org and user profile READMEs to mark PRISM Counsel and IMPERIUM as archived.
3. *(Optional)* Move `demo-assets/szl-holdings-investor-carousel.pdf` to a private channel to keep financial materials out of the public repo.
4. *(Optional)* Regenerate screenshots using `scripts/capture-screenshots.sh` once workflows are fully running.
