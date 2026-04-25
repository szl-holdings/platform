# GitHub Presentation Checklist — A11oy Public-Readiness

**Date:** 2026-04-25  
**Repo:** `github.com/szl-holdings/szl-holdings-platform`  
**Org:** `github.com/szl-holdings`

This checklist covers everything needed to make the repo shine for investors, enterprise evaluators, and technical reviewers. Items marked **[UI]** require manual action in the GitHub web UI.

---

## 1. Repository Name

**Current:** `szl-holdings-platform`  
**Recommended:** Keep as-is. Clear, professional, matches org branding.  
**Status:** ✓ DONE

---

## 2. Repository Description (About Section)

**Recommended:**  
> Governed autonomy infrastructure for enterprise operators — AI agents with proof-carrying execution, covenant policy gates, and human-in-the-loop enforcement.

**Status:** [UI] Set in GitHub repo → Settings → General → About → Description  
**Character count:** 166 (under 350 limit)

---

## 3. Repository Topics

**Recommended topics** (add via GitHub repo → Settings → Topics):

```
enterprise-ai
agentic-ai
ai-governance
observability
business-operations
workflow-automation
human-in-the-loop
proof-ledger
typescript
react
```

**Status:** [UI] Apply in GitHub repo → Code → About gear icon → Topics  
**Note:** 10 topics is the practical limit for discoverability. These are chosen for enterprise-AI searchers and investor due-diligence audiences.

---

## 4. README Hero

**Status:** ✓ DONE  
The README was rewritten in Phase 2 with A11oy as the platform headline. It includes:
- Platform tagline and hero description
- Product surface table (all 9 domain applications)
- CI status badges
- Architecture overview
- Setup instructions

---

## 5. Screenshot Rendering

**Status:** ✓ DONE (Phase 2 screenshot refresh)  
- 95 A11oy screenshots captured in Phase 3 proof pass
- Stale screenshot directories removed (53 files)
- Screenshots referenced in README are in `docs/assets/screenshots/current/`
- All screenshots show demo/seed data — no live credentials or customer PII

**Verification:** Screenshots render correctly on GitHub (PNG format, relative paths from repo root).

---

## 6. Website Link

**Recommended:** `https://szlholdings.com`  
**Status:** [UI] Set in GitHub repo → Settings → General → About → Website

---

## 7. Social Preview Image

**Recommended:** Use the A11oy hero screenshot or a branded OG card.  
- The `scripts/generate_og_cards.py` script generates OG cards from brand assets
- The recommended image is the A11oy command surface screenshot (dark background, purple/blue accent)
- Dimensions: 1280×640px recommended for GitHub social preview

**Status:** [UI] Set in GitHub repo → Settings → General → Social Preview → Edit

---

## 8. Security Policy

**Status:** ✓ DONE  
`SECURITY.md` exists at repo root with:
- Responsible disclosure email: `security@szlholdings.com`
- Severity classification table
- Scope (in / out)
- Security architecture summary (TLS, RBAC, OIDC, AI governance)
- CI security gates

GitHub automatically surfaces `SECURITY.md` in the Security tab. The `.github/ISSUE_TEMPLATE/security_report.md` also exists.

---

## 9. License

**Status:** ✓ DONE — Proprietary  
`LICENSE.md` (proprietary, all rights reserved) is present at repo root. GitHub will detect and surface it. Investors will see "Proprietary" in the About section — this is correct for a pre-commercial platform.

---

## 10. Org Profile

**Status:** [MANUAL] — See `audit/ORG_PROFILE_MANUAL_STEPS.md`  
The `.github/profile/README.md` exists in this repo for reference, but the org profile lives in a separate `szl-holdings/.github` repository. Pushing the org profile is a documented manual step.

---

## 11. Pinned Repository Recommendation

**Status:** [UI] In the `szl-holdings` org → Customize profile → Pin repositories  
**Recommended:** Pin `szl-holdings-platform` as the primary repo.

---

## 12. CODEOWNERS

**Status:** ✓ DONE  
`.github/CODEOWNERS` exists and assigns ownership to `@stephenlutar2-hash` for all paths.

---

## 13. Branch Protection

**Status:** [UI] Documented in `.github/BRANCH_PROTECTION.md`  
Branch protection rules for `master` (or `main`) should be enabled with:
- Require pull request before merging
- Require CI status checks (`security`, `lint`, `typecheck`, `build`, `test`)
- Require at least 1 approving review
- Dismiss stale reviews on new pushes

---

## 14. Investor-Safe Language Check

**Status:** ✓ REVIEWED  
- No false "10,000 customers" or revenue claims in README
- Demo mode is clearly labeled throughout the platform
- `INVESTOR_PROOF_SUMMARY.md` (in `proof-pack/`) distinguishes "exists today" vs "demo-mode" vs "roadmap"
- `KNOWN-GAPS.md` is present for transparent disclosure

---

## 15. Public / Private Split Recommendation

**Current:** Repo is private (default for GitHub org repos without explicit public setting)  
**Recommendation:** Make `szl-holdings-platform` public after this PR is merged and reviewed  
**Action:** [UI] GitHub repo → Settings → General → Danger Zone → Change visibility → Make public

---

## 16. Checklist Summary

| Item | Status | Action Required |
|------|--------|----------------|
| Repo name | ✓ Good | None |
| Description / About | [UI] | Add recommended text in GitHub UI |
| Topics | [UI] | Add 10 recommended topics |
| README | ✓ Done | None |
| Screenshots | ✓ Done | None |
| Website link | [UI] | Add szlholdings.com in GitHub UI |
| Social preview | [UI] | Upload A11oy hero image |
| Security policy | ✓ Done | None |
| License | ✓ Done | None |
| Org profile | [MANUAL] | See ORG_PROFILE_MANUAL_STEPS.md |
| Pinned repo | [UI] | Pin in org profile |
| CODEOWNERS | ✓ Done | None |
| Branch protection | [UI] | Enable in repo settings |
| Investor language | ✓ Reviewed | None |
| Visibility | [UI] | Make public after PR merge |

---

*Generated by Task #3474 audit pass — 2026-04-25*
