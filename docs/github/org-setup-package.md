# SZL Holdings — GitHub Organization Setup Package

**Date:** April 2026  
**Status:** Canonical  
**Authority:** Stephen Lutar, Founder

---

## 1. Canonical Org Name Recommendation

### Decision

**GitHub Organization Name:** `szl-holdings`  
**Display Name:** `SZL Holdings`

### Rationale

- Matches the public brand (`szlholdings.com`)
- Clean slug — no hyphens forced by GitHub's org name system, matches domain pattern
- Consistent with how all artifacts, packages, and documentation reference the company
- Enterprise evaluators searching "SZL Holdings" on GitHub will land here directly

### Alternative Considered

`szlholdings` (no hyphen) — rejected because `szl-holdings` is more readable in URLs and matches the domain word structure better. Both are acceptable; `szl-holdings` is preferred.

---

## 2. Organization Profile Configuration

Apply these values at: `github.com/organizations/szl-holdings/settings/profile`

| Field | Value |
|-------|-------|
| **Organization display name** | `SZL Holdings` |
| **Bio / Description** | `Enterprise platforms for business observability, AI orchestration, and secure operational intelligence. Built by Stephen Lutar.` |
| **URL / Website** | `https://szlholdings.com` |
| **Location** | `New York, NY` |
| **Email** | `inquiries@szlholdings.com` |
| **Twitter/X** | (if applicable — leave blank if not active) |
| **Profile picture** | Upload SZL Holdings logo — must be square, min 256×256px, transparent or brand-color background |

### Org README

Deploy `.github/profile/README.md` (from the platform repo) to the special `.github` repository inside the org:

1. Create repo: `szl-holdings/.github`
2. Create directory: `profile/`
3. Upload file as: `profile/README.md`

The content is at `.github/profile/README.md` in the platform repo.

---

## 3. Membership, Roles, and Governance Model

### Role Structure (Phase 1 — Founder-Only)

| Role | GitHub Role | Members | Scope |
|------|------------|---------|-------|
| Org Owner | `owner` | Stephen Lutar (`stephenlutar2-hash`) | Full org administration |
| Platform Admin | `owner` | Stephen Lutar | All repos, Actions, secrets |
| (future) Technical Lead | `member` + team admin | — | Flaghsip + shared libraries |
| (future) Contributor | `member` | — | Assigned repos only |

### Phase 1 Teams (Create via org Settings → Teams)

| Team | Handle | Repos | Permission |
|------|--------|-------|------------|
| `@szl-holdings/platform` | `@szl-holdings/platform` | szl-holdings-platform | Maintain |
| `@szl-holdings/security` | `@szl-holdings/security` | All repos | Triage (security issues) |
| `@szl-holdings/docs` | `@szl-holdings/docs` | Docs-only repos | Write |

Even with a single owner, creating teams now establishes the governance structure for future contributors without requiring re-architecture.

### GitHub Org Settings — Recommended Values

| Setting | Value | Rationale |
|---------|-------|-----------|
| Member privileges → Base permissions | `Read` | Principle of least privilege |
| Member privileges → Allow forking | `Off` (private repos) | Protect private IP |
| Repository creation | `Private only` (members) | Owner creates public repos |
| Outside collaborators | `Restricted` | Owner approval required |
| Two-factor authentication | `Required` | Enterprise baseline |
| SSH certificate authorities | Configure if using org-managed SSH | Phase 2 |
| Dependency graph | `Enabled` | Visibility into supply chain |
| Dependabot alerts | `Enabled` | Automated vulnerability tracking |
| Dependabot security updates | `Enabled` | Automated patch PRs |
| Secret scanning | `Enabled` | Detect leaked credentials |
| Code scanning | `Enabled` (via CodeQL) | SAST coverage |

---

## 4. Org Creation Checklist

### Step 1: Create Organization

1. Go to: `github.com/settings/organizations`
2. Click **New organization**
3. Select plan: **Free** (sufficient for Phase 1; see maturity path for upgrade timing)
4. Organization name: `szl-holdings`
5. Contact email: `inquiries@szlholdings.com`
6. Select: **My personal account** or **A business or institution**

### Step 2: Apply Profile Values

1. Navigate to: `github.com/organizations/szl-holdings/settings/profile`
2. Apply all values from Section 2 above
3. Upload profile picture

### Step 3: Create Org README Repository

1. Create new repo inside org: `szl-holdings/.github`
2. Visibility: **Public**
3. Create file: `profile/README.md`
4. Paste content from `.github/profile/README.md`
5. Commit to `main`

### Step 4: Transfer Flagship Repo

1. Navigate to: `github.com/stephenlutar2-hash/szl-holdings-platform/settings`
2. Scroll to **Danger Zone** → **Transfer**
3. Transfer to: `szl-holdings`
4. New canonical URL: `github.com/szl-holdings/szl-holdings-platform`
5. Update all README links and docs to use new org URL

### Step 5: Configure Security Defaults

1. Navigate to: `github.com/organizations/szl-holdings/settings/security_analysis`
2. Enable: Dependency graph, Dependabot alerts, Dependabot security updates
3. Enable: Secret scanning (all repos)
4. Enable: Code scanning (push protection)

### Step 6: Create Teams

1. Navigate to: `github.com/orgs/szl-holdings/teams`
2. Create teams per governance model above
3. Assign repos and permissions

---

## 5. Branding Standards Alignment

GitHub presence must be consistent with all other brand surfaces:

| Asset | Standard |
|-------|----------|
| Org name | `SZL Holdings` (not "SZL" or "Stephen Lutar Holdings") |
| Product names | Lyte, Alloy, Aegis, Vessels, Terra, Carlota Jo (capitalize exactly) |
| Repo slugs | Lowercase, hyphenated, no underscores: `szl-holdings-platform`, `lyte`, `vessels` |
| Description language | "enterprise platforms", "business observability", "AI orchestration", "secure operations" |
| Links | Always `https://szlholdings.com` — never bare domain |
| Contact | `inquiries@szlholdings.com` (not personal email) |

---

## 6. Transition From Personal Account

**Current state:** Repos live under `stephenlutar2-hash` (personal account)  
**Target state:** Repos live under `szl-holdings` (org)

### Transition Steps

1. Create org (steps above)
2. Transfer `szl-holdings-platform` repo to org
3. GitHub automatically creates redirect from old URL to new URL
4. Update `profile-readme/README.md` links
5. Update `docs/audit/repo-canonicalization-plan.md` with new org URL
6. Personal profile (`stephenlutar2-hash`) pins the flagship repo from the org

Personal profile remains active — it's the founder identity. The org is the company identity. Both are distinct surfaces with distinct roles.
