# Final Action Checklist — Series A Hardening
## Mandatory Manual Steps Outside the Repository

**Date:** 2026-04-21  
**Owner:** Stephen Lutar  
**Audience:** Operator / founder — items requiring external platform access  
**Reference:** `audit/investor/manual-next-steps.md` (detailed companion with exact commands)

This is the consolidated master checklist of every action that cannot be enforced from inside the repository. Work through this list top to bottom before investor outreach. Every item has a specific location and a verification step.

---

## CRITICAL — Complete Before Any Investor GitHub Access

### [ ] M-01 — Branch Protection: Verify and Enforce

**Location:** `github.com/szl-holdings/szl-holdings-platform` → Settings → Branches

**Required settings for `master` (and `main` if it exists):**
- [ ] Require pull request reviews before merging — minimum **1 approving review**
- [ ] Require review from Code Owners (CODEOWNERS file present — verified)
- [ ] Require status checks to pass before merging — add: `ci-gate`, `security-gate`, `CodeQL`
- [ ] Require branches to be up to date before merging
- [ ] Do not allow bypassing the above settings (applies to admins)
- [ ] Allow force pushes — **DISABLED**
- [ ] Allow deletions — **DISABLED**

**Verification:** Attempt a direct push to `master` from the CLI. It must be rejected with a branch protection error.

**Why this matters:** A technical investor checking GitHub settings will look at branch protection first. Missing or misconfigured protection signals immature engineering process.

---

### [ ] M-02 — Secret Scanning with Push Protection: Verify Enabled

**Location:** `github.com/szl-holdings/szl-holdings-platform` → Settings → Code security and analysis

**Required:**
- [ ] Secret scanning: **Enabled**
- [ ] Push protection: **Enabled** (prevents commits containing known secret patterns)

**Verification:** Navigate to Security tab → Secret scanning alerts. Confirm push protection is listed as active. Confirm 0 open secret alerts (or review and dismiss false positives with rationale).

---

### [ ] M-03 — Dependabot: Verify Alerts and Security Updates

**Location:** `github.com/szl-holdings/szl-holdings-platform` → Security → Dependabot alerts

**Required:**
- [ ] Dependabot alerts: **Enabled**
- [ ] Dependabot security updates: **Enabled** (auto-creates PRs for security patches)
- `.github/dependabot.yml` present and current (verified — weekly, grouped, npm + GitHub Actions)

**Verification:** Security → Dependabot alerts shows current vulnerability count. Any Critical or High alerts must be addressed or have a documented rationale for deferral before investor outreach.

**Context:** `pnpm audit` across 2,372 dependencies currently returns 0 Critical/High/Moderate vulnerabilities. Dependabot alerts may show additional findings based on GitHub's advisory database.

---

### [ ] M-04 — Pin Repos on Org Profile

**Location:** `github.com/szl-holdings` → Customize your organization (org admin required)

**Action:**
1. Click "Customize your organization"
2. Under "Pinned repositories," select:
   - Priority 1: `szl-holdings/szl-holdings-platform`
   - Priority 2: `szl-holdings/.github`
3. Save

**Verification:** Navigate to `github.com/szl-holdings` in an incognito window. Confirm the platform repo appears as the first pinned card.

**Why this matters:** Without pinned repos, the org profile shows recently-pushed repos in arbitrary order. Pinning controls the first impression.

---

### [ ] M-05 — Org Profile README: Verify Display

**Location:** `github.com/szl-holdings` (incognito browser window)

**Verify:**
- [ ] Org profile README renders correctly without broken image links
- [ ] CI, CodeQL, and Security badges show current status (green)
- [ ] No stale numeric claims (removed in Phase D)
- [ ] PRISM Counsel and IMPERIUM are clearly marked as archived
- [ ] Contact information is accurate (`stephen@szlholdings.com`, `inquiries@szlholdings.com`)

**Note:** Phase D pushed the updated org profile README (commit `5ea21216`). Verify it renders as intended.

---

## HIGH PRIORITY — Complete Within Two Weeks

### [ ] M-06 — Update Repo Description

**Location:** `github.com/szl-holdings/szl-holdings-platform` → About (gear icon, top right)

**Current description (stale — contains counts that will drift):**
> Governed decision infrastructure — connecting what is observable to what is executable, with full attribution. 11 artifacts, 2,816 API endpoints, 798 tables. TypeScript throughout.

**Recommended description (remove drifting counts):**
> Governed decision infrastructure — connecting what is observable to what is executable, with full attribution. TypeScript throughout.

**CLI command (from `audit/github/gh-commands.sh`):**
```bash
gh api --method PATCH "repos/szl-holdings/szl-holdings-platform" \
  -f description="Governed decision infrastructure — connecting what is observable to what is executable, with full attribution. TypeScript throughout."
```

**Verification:** Navigate to the repo in an incognito window. Confirm the description shows the updated text.

---

### [ ] M-07 — Confirm Repo Topics Are Current

**Location:** `github.com/szl-holdings/szl-holdings-platform` → About (gear icon) → Topics

**Required topics** (applied in Phase D via API — verify they persisted):
`ai-governance`, `decision-intelligence`, `enterprise`, `monorepo`, `postgresql`, `react`, `typescript`, `vite`, `pnpm`, `drizzle-orm`, `expo`, `react-native`, `maritime`, `real-estate`, `cybersecurity`

**Verification:** Navigate to the repo. Confirm all 15 topics are visible.

---

### [ ] M-08 — Replit Deployment: Verify Production Environment Variables

**Location:** Replit workspace → Secrets (padlock icon)

**Verify all required secrets are present:**

| Secret Key | Required For | Status |
|------------|-------------|--------|
| `DATABASE_URL` | All API routes and domain packs | ☐ |
| `SESSION_SECRET` | Session management | ☐ |
| `REPLIT_CLIENT_ID` / `REPLIT_CLIENT_SECRET` | OIDC authentication | ☐ |
| `MFA_SECRET_ENCRYPTION_KEY` | MFA TOTP secret encryption (fatal in production if missing) | ☐ |
| `JWT_SECRET` | JWT token signing | ☐ |
| `ENCRYPTION_KEY` | AES-256 encryption for stored credentials | ☐ |
| `STRIPE_SECRET_KEY` | Billing (Vessels, Terra, Lyte, Carlota Jo) | ☐ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | ☐ |
| `OPENAI_API_KEY` | AI features | ☐ |
| `ANTHROPIC_API_KEY` | AI features | ☐ |
| `BOOTSTRAP_ADMIN_USERNAME` | Bootstrap admin creation | ☐ |
| `BOOTSTRAP_ADMIN_EMAIL` | Bootstrap admin creation | ☐ |
| `BOOTSTRAP_ADMIN_PASSWORD` | Bootstrap admin creation | ☐ |

**Verification:** No secret should appear in any committed file. Run `pnpm audit:env` if available, or manually confirm each key resolves in the deployed environment.

---

### [ ] M-09 — Verify Deployed App Functionality (Investor Demo Flow)

**Location:** Deployed production URL

**Walk through the investor demo flow:**
1. [ ] SZL Holdings Dashboard — loads, auth works, no blank screens
2. [ ] Command Portal — real-time SSE feeds active
3. [ ] Vessels — fleet data visible, signal feed working
4. [ ] Terra — property pipeline loads
5. [ ] Aegis — security command view loads
6. [ ] Carlota Jo — client portal loads
7. [ ] CORTEX mobile — opens on iOS or Android (TestFlight)

**Verification:** No 500 errors, no blank screens, no auth loops. Document any failures for the risk register.

---

### [ ] M-10 — Apply Database Migration 0021

**Location:** Local dev environment or CI with production database access

**Migration:** `packages/db/migrations/0021_phase_b_missing_indexes.sql`

**What it does:** Adds 9 missing FK/filter indexes. All `CREATE INDEX IF NOT EXISTS`. Non-destructive. Safe for zero-downtime application.

**Command:**
```bash
pnpm --filter=@workspace/db run migrate
```

**Verification:** Run `pnpm --filter=@workspace/db run migrate:status` and confirm migration `0021` is in the "applied" list. Verify no query plan regressions on high-traffic endpoints.

**Note:** This migration was written in Phase B and has been reviewed as safe. It has not yet been applied to any database. Apply with caution in production — confirm a recent backup exists before running.

---

## MEDIUM PRIORITY — Complete Before First Investor Meeting

### [ ] M-11 — Custom Domain Verification

**Location:** Domain registrar + GitHub org settings (Settings → Pages → Custom domain)

**Verify:**
- [ ] Domain ownership verified in GitHub org settings
- [ ] SSL certificate is valid and not expiring within 30 days
- [ ] HTTPS enforced (HTTP redirects to HTTPS)

**Verification:** Navigate to `https://szlholdings.com` in an incognito window. Confirm no certificate warnings and immediate redirect from HTTP to HTTPS.

---

### [ ] M-12 — Investor Dashboard: Verify Live Access

**Location:** `https://szlholdings.com/stephen/investor` (or equivalent)

**Verify:**
- [ ] Page loads without auth error or 404
- [ ] Content is current
- [ ] No broken links or missing assets

**Why:** The org profile README links to this URL as the primary investor resource. A broken or stale investor dashboard is a credibility issue.

---

### [ ] M-13 — Regenerate Platform Facts

**Location:** Local dev environment or CI

**Command:**
```bash
pnpm metrics:generate
pnpm metrics:validate
```

**Verification:** `pnpm metrics:validate` exits 0. `docs/platform-facts.md` is updated with current artifact count, route count, table count, package count. Commit the updated file.

**Why:** `docs/platform-facts.md` is the authoritative machine-generated record of platform statistics. It should be current before investor outreach.

---

### [ ] M-14 — Gitleaks Full-History Scan: Verify Clean

**Location:** GitHub Actions → Workflows → `secret-scan-scheduled.yml` (runs daily at 06:17 UTC)

**Action:**
```bash
# Trigger manually via CLI:
gh workflow run secret-scan-scheduled.yml --repo szl-holdings/szl-holdings-platform

# Or run locally if gitleaks is installed:
gitleaks detect --source . --log-opts "--all" --verbose
```

**Verification:** Workflow exits 0. Any findings must be remediated (secret rotation + history cleanup) before investor access.

**Context:** Phase A and Phase 9 scans of the working tree returned 0 true positives. The scheduled CI scan covers full git history. Confirm the daily scan has run and produced a clean result.

---

### [ ] M-15 — CodeQL: Verify No Critical Findings

**Location:** `github.com/szl-holdings/szl-holdings-platform` → Security → Code scanning

**Required:**
- [ ] 0 Critical severity CodeQL findings
- [ ] Any High severity findings are either remediated or documented in `docs/operations/known-gaps.md` with rationale

**Verification:** Security → Code scanning alerts shows 0 critical. Open alerts are reviewed and triaged.

---

### [ ] M-16 — Screenshot Regeneration

**Location:** Local dev environment with all workflows running

**Command:**
```bash
scripts/capture-screenshots.sh
```

**What this does:** Regenerates the 6 curated product screenshots in `assets/readme/products/` to reflect the current UI after the design system reset.

**Pre-condition:** All artifact workflows must be running simultaneously. The Command workflow (F-005) must be resolved before this can complete.

**Verification:** Compare new screenshots against `audit/media/public-screenshot-manifest.json`. Update manifest after regeneration. Commit new screenshots.

---

## LOW PRIORITY — Nice to Have Before Series A Close

### [ ] M-17 — PGP Key for Security Contact

**Location:** `SECURITY.md` → Security Contact section

**Current state:** "PGP: Not yet configured — plain email is acceptable"

**Action:** Generate PGP key pair for `security@szlholdings.com`. Publish public key on `keys.openpgp.org`. Update `SECURITY.md` with key ID and fingerprint.

---

### [ ] M-18 — Move Investor Carousel PDF to Private Channel

**Location:** `demo-assets/szl-holdings-investor-carousel.pdf` (in public repo)

**Action:** Move to a private repository (`szl-holdings/investor-materials`, to be created) or a private Notion/Drive folder. Remove from the public repo or confirm it contains no non-public financial metrics.

**Why:** The file is in a public repository. If it contains investor metrics, it should not be publicly accessible.

---

### [ ] M-19 — Create `szl-holdings/investor-materials` Private Repo

**Location:** `github.com/szl-holdings` → New repository

**Action:** Create a private repository for:
- Cap table and financial models
- NDA-gated investor decks
- Term sheet drafts
- Customer reference cases

Link from the public org profile to an investor-facing summary (not the full materials).

---

### [ ] M-20 — Establish Release Cadence

**Location:** GitHub Actions → `release.yml` workflow + CHANGELOG.md

**Action:** After `v1.0.0-alpha` (published), establish a regular release cadence (monthly or milestone-based). Each release should:
1. Merge CHANGELOG.md `## [Unreleased]` section into a versioned entry
2. Tag the commit and push (`git tag v1.x.x`)
3. `release.yml` workflow publishes the GitHub Release automatically

**Why:** Investors scanning the repo use Releases as a shipping signal. Continued release activity demonstrates engineering velocity.

---

### [ ] M-21 — Acknowledge First Security Disclosure

**Location:** `SECURITY.md` → Acknowledgements section

**Action:** When the first responsible disclosure is received, document the researcher's name (with permission) and acknowledgement date. This signals the process has been exercised — even a single entry is meaningful.

---

## Completion Summary

| Item | Priority | Owner | Status |
|------|----------|-------|--------|
| M-01: Branch protection | Critical | Stephen | ☐ |
| M-02: Secret scanning push protection | Critical | Stephen | ☐ |
| M-03: Dependabot alerts | Critical | Stephen | ☐ |
| M-04: Pin repos on org profile | Critical | Stephen | ☐ |
| M-05: Verify org profile renders | Critical | Stephen | ☐ |
| M-06: Update repo description | High | Stephen | ☐ |
| M-07: Confirm repo topics | High | Stephen | ☐ |
| M-08: Verify Replit env vars | High | Stephen | ☐ |
| M-09: Verify deployed app (demo flow) | High | Stephen | ☐ |
| M-10: Apply migration 0021 | High | Stephen | ☐ |
| M-11: Custom domain verification | Medium | Stephen | ☐ |
| M-12: Investor dashboard verify | Medium | Stephen | ☐ |
| M-13: Regenerate platform facts | Medium | Stephen | ☐ |
| M-14: Gitleaks full-history scan | Medium | Stephen | ☐ |
| M-15: CodeQL findings review | Medium | Stephen | ☐ |
| M-16: Screenshot regeneration | Medium | Stephen | ☐ |
| M-17: PGP key for security contact | Low | Stephen | ☐ |
| M-18: Move investor carousel PDF | Low | Stephen | ☐ |
| M-19: Create investor-materials private repo | Low | Stephen | ☐ |
| M-20: Establish release cadence | Low | Stephen | ☐ |
| M-21: Acknowledge first security disclosure | Low | Stephen | ☐ |

---

## Items Already Completed (Do Not Re-Do)

| Item | Completed By |
|------|-------------|
| `v1.0.0-alpha` GitHub Release published | Task #2701, 2026-04-20 |
| Repo topics updated to 15 | Phase D, 2026-04-20 |
| Org profile README pushed with archived products | Phase D, 2026-04-20 |
| `BOOTSTRAP_ADMIN_*`, `JWT_SECRET`, `ENCRYPTION_KEY` provisioned in Replit Secrets | Phase A, 2026-04-20 |
| All 7 Phase A auth findings resolved | Phase B / Phase 9, Task #2686 |
| `packages/auth-shared` created and adopted | Phase B, Task #2686 |
| Tenant scope audit (148 group-prefix surfaces) | Task #2635 |
| Design system unified across all 11 artifacts | Design System Reset |
| Migration `0021` written (not yet applied) | Phase B, 2026-04-20 |
| 4 audit documents written for DB | Phase B, 2026-04-20 |
| `security/vuln-report.md` — 0 vulnerabilities | Phase A + Phase 9 |
| Gitleaks PR-diff and daily scheduled scan configured | Phase A, confirmed Phase 9 |
| CodeQL pinned SHA, weekly schedule | Phase A, confirmed Phase D |
| Screenshots of archived products removed from README | Phase D, 2026-04-20 |
| Non-image files deleted from `screenshots/` | Phase D, 2026-04-20 |

---

*Full detailed companion with exact CLI commands: `audit/investor/manual-next-steps.md`.*  
*Concise executive summary: `audit/FINAL_EXEC_SUMMARY.md`.*  
*Detailed phase-by-phase report: `audit/FINAL_DETAILED_REPORT.md`.*  
*Risk register: `audit/investor/risk-register.md`.*
