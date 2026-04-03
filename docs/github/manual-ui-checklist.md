# SZL Holdings — GitHub Manual UI Checklist

**Date:** April 2026  
**Status:** Canonical  
**Purpose:** Every GitHub setting that requires the web UI, organized by category with exact values, rationale, and plan tier.

---

## How to Use This Checklist

- Work through Phase 1 top to bottom before enterprise evaluation
- Each item includes: exact page location, setting name, recommended value, rationale, whether it's org vs repo level, and plan tier required
- Items marked **Phase 2** or **Phase 3** can be deferred until those phases are reached
- Check the box when complete — keep this doc as a running record

---

## Category 1 — Organization Creation & Profile

**Applies to:** `github.com/organizations/szl-holdings`  
**Tier:** Free

### 1.1 Create Organization

| Step | Location | Action | Value |
|------|----------|--------|-------|
| 1 | `github.com/settings/organizations` | Click "New organization" | — |
| 2 | Plan selection | Choose plan | Free (Phase 1) |
| 3 | Organization name | Enter name | `szl-holdings` |
| 4 | Contact email | Enter email | `inquiries@szlholdings.com` |
| 5 | Ownership | Select | "My personal account" or "A business or institution" |

**Note:** If `szl-holdings` is taken, try `szlholdings` or `szl-holdings-co`. Update all references to match.

### 1.2 Org Profile Settings

**Location:** `github.com/organizations/szl-holdings/settings/profile`

| Setting | Value | Rationale |
|---------|-------|-----------|
| Organization display name | `SZL Holdings` | Matches brand |
| Bio | `Enterprise platforms for business observability, AI orchestration, and secure operational intelligence. Built by Stephen Lutar.` | Clear, professional, accurate |
| URL | `https://szlholdings.com` | Primary web presence |
| Location | `New York, NY` | Enterprise credibility signal |
| Email | `inquiries@szlholdings.com` | Professional contact |
| Profile picture | Upload SZL Holdings logo (square, min 256×256px) | Brand consistency |
| Display member count | Enabled | Transparency |

---

## Category 2 — Org README

**Applies to:** `szl-holdings/.github` repo  
**Tier:** Free

| Step | Location | Action | Value |
|------|----------|--------|-------|
| 1 | `github.com/organizations/szl-holdings` | Click "+" → New repository | — |
| 2 | Repository name | Enter | `.github` |
| 3 | Visibility | Select | Public |
| 4 | Initialize | Check | Add a README file |
| 5 | Create repository | Click | — |
| 6 | Create folder | In the repo | Create `profile/` directory |
| 7 | Create file | `profile/README.md` | Paste content from `.github/profile/README.md` in platform repo |

---

## Category 3 — Flagship Repo Transfer & Settings

**Applies to:** `szl-holdings/szl-holdings-platform`  
**Tier:** Free

### 3.1 Transfer Repo to Org

**Location:** `github.com/stephenlutar2-hash/szl-holdings-platform/settings`

| Step | Action | Detail |
|------|--------|--------|
| 1 | Scroll to Danger Zone | Bottom of Settings page |
| 2 | Click "Transfer" | — |
| 3 | Type repo name to confirm | `szl-holdings-platform` |
| 4 | Transfer to | `szl-holdings` |
| 5 | Confirm | Click "I understand..." |

**After transfer:** GitHub creates automatic redirect from old URL. Update all internal links.

### 3.2 Repo General Settings

**Location:** `github.com/szl-holdings/szl-holdings-platform/settings`

| Setting | Value | Rationale | Level |
|---------|-------|-----------|-------|
| Description | `Platform ecosystem for business observability, AI orchestration, maritime intelligence, and secure execution — built by Stephen Lutar.` | Clear, search-optimized | Repo |
| Website | `https://szlholdings.com` | Primary demo/entry point | Repo |
| Topics | `typescript`, `react`, `nodejs`, `postgresql`, `drizzle-orm`, `expo`, `monorepo`, `pnpm`, `azure`, `ai-orchestration`, `business-observability`, `maritime-intelligence`, `saas` | SEO + discoverability | Repo |
| Issues | Enabled ✅ | Evaluators can raise questions | Repo |
| Wiki | Disabled ❌ | Docs live in /docs/ | Repo |
| Projects | Disabled ❌ | Internal PM stays internal | Repo |
| Discussions | Disabled ❌ | Not appropriate here | Repo |
| Sponsorships | Disabled ❌ | Not applicable | Repo |
| Squash merging | Enabled ✅ | Linear history | Repo |
| Merge commits | Disabled ❌ | Force squash discipline | Repo |
| Rebase merging | Optional | Enable if preferred | Repo |
| Automatically delete head branches | Enabled ✅ | Clean branch hygiene | Repo |

---

## Category 4 — Pinned Repositories

**Applies to:** Org profile + personal profile  
**Tier:** Free

### 4.1 Org Profile Pins

**Location:** `github.com/szl-holdings` → Click "Edit pinned repositories"

| Slot | Repo | Action |
|------|------|--------|
| 1 | `szl-holdings-platform` | Pin — always first |
| 2–6 | (leave blank) | No weak repos |

### 4.2 Personal Profile Pins

**Location:** `github.com/stephenlutar2-hash` → Click "Customize your pins"

| Slot | Repo | Action |
|------|------|--------|
| 1 | `szl-holdings/szl-holdings-platform` | Pin — flagship |
| 2–6 | (leave blank until Phase 2 candidates are ready) | — |

---

## Category 5 — Branch Protection Rules

**Applies to:** `szl-holdings/szl-holdings-platform`  
**Tier:** Free

**Location:** `github.com/szl-holdings/szl-holdings-platform/settings/branches` → "Add rule"

| Setting | Value | Rationale |
|---------|-------|-----------|
| Branch name pattern | `master` | Protect production branch |
| Require a pull request before merging | Enabled ✅ | No direct pushes |
| Required number of approvals | 1 | Explicit review gate |
| Dismiss stale PR approvals when new commits are pushed | Enabled ✅ | Re-review after changes |
| Require review from Code Owners | Enabled ✅ | CODEOWNERS path enforced |
| Require status checks to pass | Enabled ✅ | CI gate enforced |
| Required status checks | `CI` (or `ci-gate`), `CodeQL Analysis` | Primary gate jobs |
| Require branches to be up to date | Enabled ✅ | Tests run against latest |
| Require conversation resolution | Enabled ✅ | No unresolved threads |
| Require signed commits | Optional (Phase 2) | Consider for release discipline |
| Require linear history | Enabled ✅ | Squash/rebase only |
| Include administrators | Enabled ✅ | Rules apply to owner too |
| Allow force pushes | Disabled ❌ | No history rewriting |
| Allow deletions | Disabled ❌ | Protect branch |

**Repeat for:** `main` branch pattern (if both `master` and `main` are used)

---

## Category 6 — Actions Settings

**Applies to:** Org + Repo level  
**Tier:** Free

### 6.1 Org Actions Settings

**Location:** `github.com/organizations/szl-holdings/settings/actions`

| Setting | Value | Rationale |
|---------|-------|-----------|
| Allow actions | "Allow enterprise, and select non-enterprise, actions and reusable workflows" | Restrict to trusted sources |
| Allow GitHub Actions | Enabled ✅ | GitHub-owned actions |
| Allow specified actions | `actions/*`, `github/*`, `pnpm/*`, `softprops/action-gh-release` (pinned SHA) | Allowlist known-good actions |
| GITHUB_TOKEN permissions | Read repository contents and packages | Least privilege default |
| Allow actions to approve PRs | Disabled ❌ | Prevent bot-approved PRs |

### 6.2 Repo Actions Settings

**Location:** `github.com/szl-holdings/szl-holdings-platform/settings/actions`

| Setting | Value | Rationale |
|---------|-------|-----------|
| Workflow permissions | "Read repository contents and packages" | Least privilege |
| Allow GitHub Actions to create and approve PRs | Disabled ❌ | Human approval required |

---

## Category 7 — Secrets & Variables

**Applies to:** `szl-holdings/szl-holdings-platform`  
**Tier:** Free

**Location:** `github.com/szl-holdings/szl-holdings-platform/settings/secrets/actions`

| Secret | Value Source | Scope | Notes |
|--------|-------------|-------|-------|
| `REPLIT_DEPLOY_TOKEN` | Replit account → Personal Access Tokens | Environment: `production` | Only if deploy.yml is implemented |
| `REPLIT_APP_ID` | Replit app settings | Environment: `production` | Only if deploy.yml is implemented |

### 7.1 Create Production Environment

**Location:** `github.com/szl-holdings/szl-holdings-platform/settings/environments`

| Step | Action | Value |
|------|--------|-------|
| 1 | Click "New environment" | — |
| 2 | Environment name | `production` |
| 3 | Required reviewers | Add yourself (optional extra gate) |
| 4 | Add secrets | `REPLIT_DEPLOY_TOKEN`, `REPLIT_APP_ID` |

---

## Category 8 — Security & Analysis

**Applies to:** Org + Flagship Repo  
**Tier:** Free

### 8.1 Org Security Settings

**Location:** `github.com/organizations/szl-holdings/settings/security_analysis`

| Setting | Value | Rationale |
|---------|-------|-----------|
| Dependency graph | Enabled ✅ | Visibility into supply chain |
| Dependabot alerts | Enabled ✅ | Vulnerability notifications |
| Dependabot security updates | Enabled ✅ | Automated patch PRs |
| Code scanning | Enabled ✅ | SAST coverage |
| Secret scanning | Enabled ✅ | Detect leaked credentials |
| Push protection | Enabled ✅ (Phase 2) | Block secret commits at push time |

### 8.2 Repo Security Settings

**Location:** `github.com/szl-holdings/szl-holdings-platform/settings/security_analysis`

Apply same settings as org level. Verify each is enabled individually at repo level.

---

## Category 9 — Issue & PR Templates

**Applies to:** `szl-holdings/szl-holdings-platform`  
**Tier:** Free (these are files in the repo — no UI config needed)

Verify these files exist and are committed:

| File | Status | Notes |
|------|--------|-------|
| `.github/ISSUE_TEMPLATE/bug_report.md` | ✅ Exists | Verify content |
| `.github/ISSUE_TEMPLATE/feature_request.md` | ✅ Exists | Verify content |
| `.github/ISSUE_TEMPLATE/security_report.md` | ⬜ Create | From security-governance-baseline.md |
| `.github/ISSUE_TEMPLATE/config.yml` | ✅ Exists | Verify content |
| `.github/PULL_REQUEST_TEMPLATE.md` | ✅ Exists | Add security gate section |
| `.github/CODEOWNERS` | ✅ Exists | Verify paths are accurate |
| `SECURITY.md` | ✅ Exists | Verify content matches template |
| `CONTRIBUTING.md` | ✅ Exists | Verify content |

---

## Category 10 — Issue Labels

**Applies to:** `szl-holdings/szl-holdings-platform`  
**Tier:** Free

**Location:** `github.com/szl-holdings/szl-holdings-platform/labels`

1. Delete default GitHub labels that don't fit (good first issue, help wanted — unless desired)
2. Create/update the canonical label set from `ops/github/repo-settings.json`

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | `#d73a4a` | Something isn't working |
| `enhancement` | `#0075ca` | New feature or capability |
| `documentation` | `#0075ca` | Documentation improvements |
| `security` | `#e11d48` | Security issue — use responsible disclosure |
| `infrastructure` | `#7c3aed` | IaC, CI/CD, deployment |
| `design` | `#f59e0b` | UI/UX changes |
| `lyte` | `#0ea5e9` | Lyte platform |
| `aegis` | `#ef4444` | Aegis platform |
| `vessels` | `#06b6d4` | Vessels platform |
| `terra` | `#10b981` | Terra platform |
| `carlota-jo` | `#8b5cf6` | Carlota Jo platform |
| `alloy` | `#f97316` | Alloy execution fabric |
| `mobile` | `#14b8a6` | Mobile apps |
| `api` | `#6366f1` | API server |
| `breaking-change` | `#b91c1c` | Breaking change — major version |
| `needs-triage` | `#94a3b8` | Awaiting prioritization |

---

## Category 11 — Domain Verification (Phase 2)

**Applies to:** `szl-holdings` org  
**Tier:** Free  
**Requires:** DNS admin access to `szlholdings.com`

**Location:** `github.com/organizations/szl-holdings/settings/domains`

| Step | Action | Detail |
|------|--------|--------|
| 1 | Click "Add a domain" | — |
| 2 | Enter domain | `szlholdings.com` |
| 3 | Copy TXT record value | GitHub generates a verification code |
| 4 | Add DNS TXT record | Add to `szlholdings.com` DNS: `_github-challenge-szl-holdings.szlholdings.com TXT [code]` |
| 5 | Wait for DNS propagation | 5 minutes to 24 hours |
| 6 | Click "Verify" in GitHub | — |

**Result:** Verified badge appears on org profile. Org members with `@szlholdings.com` email are marked as verified.

---

## Category 12 — Personal Profile Updates

**Applies to:** `stephenlutar2-hash` personal account  
**Tier:** Free

**Location:** `github.com/settings/profile`

| Field | Value | Notes |
|-------|-------|-------|
| Name | `Stephen Lutar` | — |
| Bio | `Founder & CEO at SZL Holdings. Building Lyte, Alloy, and the full platform ecosystem.` | Updated to reference org |
| Company | `@szl-holdings` (org handle) or `SZL Holdings` | Link to org |
| Location | `New York, NY` | — |
| Website | `https://szlholdings.com` | — |
| Display current local time | Enabled ✅ | — |
| Include private contributions | Enabled ✅ | Shows real activity level |
| Make profile private | Disabled ❌ | Public by design |

---

## Category 13 — Release Management

**Applies to:** `szl-holdings/szl-holdings-platform`  
**Tier:** Free

**Location:** `github.com/szl-holdings/szl-holdings-platform/releases/new`

### Create v0.1.0 Release

| Field | Value |
|-------|-------|
| Tag | `v0.1.0` (create new tag on publish) |
| Target | `master` |
| Title | `v0.1.0 — Initial Public Platform Release` |
| Description | Copy from `docs/releases/v0.1.0.md` |
| Mark as pre-release | Optional (if pre-commercial) |
| Mark as latest | Enabled ✅ |

---

## Phase Summary

| Category | Phase | Plan Tier | DNS Access Needed |
|----------|-------|----------|------------------|
| Org creation & profile | Phase 1 | Free | No |
| Org README | Phase 1 | Free | No |
| Repo transfer & settings | Phase 1 | Free | No |
| Pinned repos | Phase 1 | Free | No |
| Branch protection | Phase 1 | Free | No |
| Actions settings | Phase 1 | Free | No |
| Secrets & environments | Phase 1 | Free | No |
| Security & analysis | Phase 1 (basic) / Phase 2 (push protection) | Free | No |
| Issue/PR templates | Phase 1 (files in repo) | Free | No |
| Issue labels | Phase 1 | Free | No |
| Domain verification | Phase 2 | Free | **Yes** |
| Personal profile updates | Phase 1 | Free | No |
| Release creation | Phase 1 | Free | No |
| Org-wide rulesets | Phase 2 | Team ($4/user/month) | No |
| SAML SSO | Phase 3 | Enterprise Cloud ($21/user/month) | No |
