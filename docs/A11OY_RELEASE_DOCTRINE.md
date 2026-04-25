# A11OY_RELEASE_DOCTRINE.md — Release Readiness and Governance

A release is a governed event. It is not a push. Every release candidate must pass the Release Readiness Checklist and achieve a minimum Release Readiness Score before it may be published to investors, design partners, or the public.

---

## Release Readiness Checklist

### 1. Code Quality

- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm test` passes with zero failures
- [ ] `pnpm qa:routes` passes — all registered routes respond correctly
- [ ] `pnpm audit:all` passes — no critical mocks, copy violations, or design regressions
- [ ] No unresolved TypeScript `any` casts in changed files
- [ ] No `console.log` statements in server code (use structured logger)
- [ ] Lock file is committed and in sync (`pnpm-lock.yaml`)

### 2. Security

- [ ] `pnpm audit` — zero high or critical dependency vulnerabilities
- [ ] Gitleaks scan — clean (zero secret pattern matches)
- [ ] All `.env` patterns present in `.gitignore`
- [ ] No hardcoded credentials in any file
- [ ] Auth enforcer in place — deny-by-default on all routes
- [ ] All queries org-scoped

### 3. Public Claims

- [ ] ClaimGuard has reviewed all public-facing copy in this release
- [ ] No unqualified production, compliance, or integration claims
- [ ] All capability claims use the approved qualifiers from `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`
- [ ] Platform facts referenced in copy are consistent with `docs/platform-facts.md`

### 4. Screenshots

- [ ] All UI surfaces modified in this release have live screenshots in `docs/assets/screenshots/current/`
- [ ] All screenshots are within the 30-day freshness window
- [ ] All screenshot catalog entries in `audit/screenshot-catalog.md` are current
- [ ] No placeholder data visible in any proof screenshot

### 5. Documentation

- [ ] `AGENTS.md` is current and reflects the release state
- [ ] `docs/APP_STATUS.md` reflects current artifact readiness
- [ ] `docs/operations/known-gaps.md` is current
- [ ] `README.md` is accurate and up to date
- [ ] Release notes drafted (if applicable)

### 6. Proof Packets

- [ ] Every Workcell in this release has a completed Proof Packet at the required proof level
- [ ] Proof Packets are recorded in `audit/`
- [ ] No Workcell is marked `complete` without a Proof Packet

### 7. Naming and Language

- [ ] No Bo11y, Bolly, or Boss naming in any file in this release
- [ ] All agent names match the canonical roster in `docs/A11OY_AGENT_DOCTRINE.md`
- [ ] All product terminology matches the approved terms in `docs/A11OY_PRODUCT_LANGUAGE.md`
- [ ] No copied vendor copy in any public-facing file

### 8. Architecture

- [ ] No orphaned routes (routes not registered in the API spec)
- [ ] No duplicate route registrations
- [ ] No missing artifact READMEs
- [ ] `docs/APP_STATUS.md` artifact readiness is accurate

### 9. Governance

- [ ] Release Workcell approved at the appropriate tier (Executive for investor demos, Board for public releases)
- [ ] MirrorEval assessment completed for any AI-generated content in this release
- [ ] All Covenant Policy evaluations passed for any automated actions in this release
- [ ] ReleaseCaptain has assembled the Release Proof Packet (Proof Level 5)

---

## Release Readiness Score Categories

The Release Readiness Score is a 0–100 composite across nine categories. Minimum score to release: 80. Minimum score per category: 70 (no category may be a single-point failure below threshold).

| # | Category | Weight | Max Score |
|---|----------|--------|-----------|
| 1 | Code Quality | 15% | 15 |
| 2 | Security | 20% | 20 |
| 3 | Public Claims Safety | 15% | 15 |
| 4 | Screenshot Freshness | 10% | 10 |
| 5 | Documentation Currency | 10% | 10 |
| 6 | Proof Completeness | 10% | 10 |
| 7 | Naming and Language | 5% | 5 |
| 8 | Architecture Integrity | 10% | 10 |
| 9 | Governance | 5% | 5 |

**Scoring:** Each category is scored 0–100 within its weight. A category score below 70 is a release blocker regardless of the total score.

**Release gates:**
- Score ≥ 80 and all categories ≥ 70: **Release approved**
- Score 60–79 or any category 50–69: **Conditional release** — Executive must authorize with documented risk acceptance
- Score < 60 or any category < 50: **Release blocked** — remediate before re-scoring

The Pathfinder Scan produces an initial Release Readiness Score. The ReleaseCaptain agent prepares the final scored package and Release Proof Packet.
