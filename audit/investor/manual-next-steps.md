# Manual Next Steps — growth capital Readiness
## Items Requiring Action Outside the Repository

**Produced:** Phase D, April 2026
**Owner:** Stephen Lutar
**Scope:** Everything that cannot be enforced or completed from inside the repo. These are human-action items requiring GitHub org admin access, Replit deployment settings, third-party configurations, or external account management.

---

## How to Use This Document

Each item below is a specific action with an owner, a location (where to go), and a verification step. Work through this list before initiating investor outreach. Items are ordered by priority.

---

## CRITICAL — Must Complete Before Investor Outreach

### M-01: Branch Protection — Verify and Enforce

**Location:** `github.com/szl-holdings/szl-holdings-platform` → Settings → Branches

**Required settings for `master` (and `main` if it exists):**
- [x] Require pull request reviews before merging — minimum 1 approving review
- [x] Require review from Code Owners
- [x] Require status checks to pass before merging — add: `ci`, `CodeQL`, `Lint`
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings (applies to admins)
- [x] Allow force pushes — DISABLED
- [x] Allow deletions — DISABLED

**Verification:** Attempt to push directly to `master` from the command line. It should be rejected.

---

### M-02: Secret Scanning with Push Protection — Verify Enabled

**Location:** `github.com/szl-holdings/szl-holdings-platform` → Settings → Code security and analysis

**Required settings:**
- [x] Secret scanning: **Enabled**
- [x] Push protection: **Enabled**

**Note:** Push protection prevents commits containing known secret patterns (API keys, tokens) from being pushed to the repo. This is the most effective automated secret leak prevention available without additional tooling.

**Verification:** Check the Security tab → Secret scanning alerts. Confirm push protection is listed as active.

---

### M-03: Dependabot — Verify Alerts and Auto-Dismiss

**Location:** `github.com/szl-holdings/szl-holdings-platform` → Security → Dependabot alerts

**Required:**
- [x] Dependabot alerts: **Enabled**
- [x] Dependabot security updates: **Enabled** (auto-creates PRs for security patches)
- [x] `.github/dependabot.yml` is present and current (verified — weekly, grouped, npm + GitHub Actions)

**Verification:** Security → Dependabot alerts should show the current vulnerability count. Any critical or high severity alerts should be addressed or have a documented rationale for deferral.

---

### M-04: Pin Repos on Org Profile

**Location:** `github.com/szl-holdings` → Customize your organization

**Action:**
1. Click "Customize your organization" (top-right, requires org admin)
2. Under "Pinned repositories," select:
   - Priority 1: `szl-holdings/szl-holdings-platform`
   - Priority 2: `szl-holdings/.github`
3. Save

**Why:** Without pinned repos, the org profile shows recently-pushed repos in arbitrary order. Pinning ensures the platform repo is the first thing an investor sees when they navigate to the org.

**Verification:** Navigate to `github.com/szl-holdings` in an incognito window. Confirm the platform repo appears as a pinned card.

---

### M-05: Org Profile README — Verify Display

**Location:** `github.com/szl-holdings`

**Action:** Navigate to the org profile in an incognito browser window. Verify:
- [x] The org profile README renders correctly (`.github/profile/README.md`)
- [x] CI, CodeQL, and Security badges show current status (green)
- [x] No broken image links
- [x] No numeric claims that have drifted from current state
- [x] Contact information is accurate

**Note:** The Phase D reset has removed all numeric badges and the product gallery with broken relative paths. The profile should now render cleanly.

---

## HIGH PRIORITY — Complete Within Two Weeks

### M-06: Update Repo Description (Remove Stale Numeric Claims)

**Location:** `github.com/szl-holdings/szl-holdings-platform` → About (gear icon, top right)

**Current description (from GITHUB_SETTINGS_APPLIED.json):**
> Governed decision infrastructure — connecting what is observable to what is executable, with full attribution. 11 artifacts, 2,816 API endpoints, 798 tables. TypeScript throughout.

**Recommended description (removes counts that will drift):**
> Governed decision infrastructure — connecting what is observable to what is executable, with full attribution. TypeScript throughout.

**Why:** Specific counts in the repo description will drift as the platform evolves. A stale count in the repo description is the first thing a technical investor sees; it undermines credibility if it cannot be verified.

**Alternative:** Keep counts only if `pnpm metrics:validate` is added as a PR check that enforces freshness. Without that gate, remove the counts.

**Command (via GitHub CLI, see `audit/github/gh-commands.sh`):**
```bash
gh api --method PATCH "repos/szl-holdings/szl-holdings-platform" \
  -f description="Governed decision infrastructure — connecting what is observable to what is executable, with full attribution. TypeScript throughout."
```

---

### M-07: Add Recommended Repo Topics

**Location:** `github.com/szl-holdings/szl-holdings-platform` → About (gear icon) → Topics

**Add these topics** (in addition to existing ones):
- `pnpm`
- `drizzle-orm`
- `expo`
- `react-native`
- `maritime`
- `real-estate`
- `cybersecurity`

**Why:** Current topics are generic. Domain-vertical topics improve discoverability by technical investors and enterprise evaluators scanning GitHub by category.

**Command (via GitHub CLI, see `audit/github/gh-commands.sh`):**
Refer to the commented command in `audit/github/gh-commands.sh` Section 2.

---

### M-08: Replit Deployment — Verify Production Environment Variables

**Location:** Replit workspace → Secrets / Environment Variables

**Action:** Verify that all production secrets are set in the Replit secrets panel (not hardcoded or in `.env` files that could be committed):

| Secret Key | Required For |
|------------|-------------|
| `DATABASE_URL` | All API routes, all domain packs |
| `SESSION_SECRET` | Session management |
| `REPLIT_CLIENT_ID` / `REPLIT_CLIENT_SECRET` | OIDC authentication |
| `STRIPE_SECRET_KEY` | Billing (Vessels, Terra, Lyte, Carlota Jo) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `OPENAI_API_KEY` | AI features |
| `ANTHROPIC_API_KEY` | AI features |
| `GEMINI_API_KEY` | AI features |

**Verification:** Run `pnpm audit:env` (if available) or manually check that each secret resolves in the deployed environment. No secret should appear in any committed file.

---

### M-09: Verify Deployed App Functionality

**Location:** Deployed URL (Replit production deployment)

**Action:** Walk through the investor demo flow on the production deployment:
1. SZL Holdings Dashboard — loads, auth works
2. Command Portal — real-time SSE feeds active
3. Vessels — fleet data visible, signal feed working
4. Terra — property pipeline loads
5. Aegis — security command view loads
6. Carlota Jo — client portal loads
7. CORTEX mobile — opens on iOS or Android (TestFlight)

**Verification:** No 500 errors, no blank screens, no auth loops. Document any failures for the risk register.

---

## MEDIUM PRIORITY — Complete Before First Investor Meeting

### M-10: Custom Domain Verification

**Location:** Domain registrar + GitHub org settings

**Action:** If `szlholdings.com` is linked to the platform deployment, verify that:
- [x] Domain ownership is verified in GitHub org settings (Settings → Pages → Custom domain)
- [x] SSL certificate is valid and not expiring within 30 days
- [x] HTTPS is enforced (HTTP redirects to HTTPS)

**Verification:** Navigate to `https://szlholdings.com` in an incognito window. Confirm no certificate warnings and no HTTP → HTTPS redirect visible.

---

### M-11: Investor Dashboard — Verify Live Access

**Location:** `https://szlholdings.com/stephen/investor`

**Action:** Navigate to the investor dashboard linked from the org profile README. Verify:
- [x] Page loads without auth error (or has a clear auth flow for investors)
- [x] Content is current and not stale
- [x] No broken links or missing assets

**Why:** The org profile README links to this URL as the primary investor resource. A broken or stale investor dashboard is a credibility issue.

---

### M-12: Regenerate Platform Facts

**Location:** Local dev environment or CI

**Action:**
```bash
pnpm metrics:generate
pnpm metrics:validate
```

**Why:** `docs/platform-facts.md` is the authoritative machine-generated record of platform statistics (artifact count, route count, table count, package count). It should be regenerated from the current codebase before investor outreach to ensure it is not stale.

**Verification:** `pnpm metrics:validate` should exit 0 (no drift detected).

---

### M-13: Gitleaks Scan — Verify Clean

**Location:** GitHub Actions → Workflows → `secret-scan-scheduled.yml` (or run locally)

**Action:**
```bash
# If gitleaks is installed locally:
gitleaks detect --source . --verbose

# Or trigger via CI:
gh workflow run secret-scan-scheduled.yml --repo szl-holdings/szl-holdings-platform
```

**Why:** Confirms no secrets are present in the committed history. A clean scan result is a trust signal.

**Verification:** Workflow exits 0. Any findings must be remediated (secret rotation + history cleanup) before investor access.

---

### M-14: CodeQL — Verify No Critical Findings

**Location:** `github.com/szl-holdings/szl-holdings-platform` → Security → Code scanning

**Action:** Review current CodeQL findings. Any critical or high severity findings should be:
- Remediated before investor outreach, OR
- Documented with a clear rationale for deferral in `docs/operations/known-gaps.md`

**Verification:** Code scanning alerts show 0 critical findings.

---

## LOW PRIORITY — Nice to Have Before growth capital Close

### M-15: Add PGP Key for Security Contact

**Location:** `SECURITY.md` → Security Contact section

**Current state:** "PGP: Not yet configured — plain email is acceptable"

**Action:** Generate a PGP key pair for `security@szlholdings.com`. Publish the public key on Keybase or keys.openpgp.org. Update `SECURITY.md` with the key ID and fingerprint.

**Why:** A PGP key demonstrates security maturity to researchers. It is not required for a growth capital but removes a minor credibility gap.

---

### M-16: Add Acknowledgements Policy

**Location:** `SECURITY.md` → Acknowledgements section

**Current state:** Generic statement about acknowledging researchers.

**Action:** When the first responsible disclosure is received (even a test report), document the acknowledgement process and add the researcher's name (with permission) to the Acknowledgements section.

**Why:** An empty acknowledgements section with no entries is expected for a pre-launch platform. Adding even one entry signals that the process has been exercised.

---

### M-17: CHANGELOG — Tag v1.0.0-alpha on GitHub Releases

**Location:** `github.com/szl-holdings/szl-holdings-platform` → Releases

**Action:** Verify that the `v1.0.0-alpha` tag referenced in CHANGELOG.md is published as a GitHub Release with a release description matching the CHANGELOG entry.

**Why:** Investors scanning the repo look at Releases as a shipping signal. A published release demonstrates that the team maintains release discipline.

---

## Completion Checklist

| Item | Priority | Owner | Status |
|------|----------|-------|--------|
| M-01: Branch protection | Critical | Stephen | ☐ |
| M-02: Secret scanning push protection | Critical | Stephen | ☐ |
| M-03: Dependabot alerts | Critical | Stephen | ☐ |
| M-04: Pin repos on org profile | Critical | Stephen | ☐ |
| M-05: Verify org profile renders | Critical | Stephen | ☐ |
| M-06: Update repo description | High | Stephen | ☐ |
| M-07: Add repo topics | High | Stephen | ☐ |
| M-08: Verify Replit env vars | High | Stephen | ☐ |
| M-09: Verify deployed app | High | Stephen | ☐ |
| M-10: Custom domain verification | Medium | Stephen | ☐ |
| M-11: Investor dashboard verify | Medium | Stephen | ☐ |
| M-12: Regenerate platform facts | Medium | Stephen | ☐ |
| M-13: Gitleaks scan | Medium | Stephen | ☐ |
| M-14: CodeQL findings review | Medium | Stephen | ☐ |
| M-15: PGP key for security contact | Low | Stephen | ☐ |
| M-16: Acknowledgements policy | Low | Stephen | ☐ |
| M-17: CHANGELOG release tag | Low | Stephen | ☐ |

---

*This checklist is intentionally human-executable — every item has a specific location and a verification step. Work through it top to bottom before investor outreach. Mark each item complete as you go.*

*For the risk register behind these items, see `audit/investor/risk-register.md`.*
*For the executive summary, see `audit/investor/executive-summary.md`.*
