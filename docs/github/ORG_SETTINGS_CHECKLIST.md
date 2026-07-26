# Organization Settings Checklist

> SZL Holdings GitHub Organization Settings · April 2026

All items in this checklist require manual action in the GitHub UI at `https://github.com/organizations/szl-holdings/settings`. They cannot be applied via the repository — they require organization admin access.

---

## Organization Profile

Navigate to **Settings → Profile**:

- [ ] Organization display name: `SZL Holdings`
- [x] Organization email: `inquiries@szlholdings.com` *(updated April 25, 2026 — was `stephenlutar2@gmail.com`)*
- [x] Description: `Governed Business Observability — connecting what is observable to what is executable, with full attribution.` *(updated April 25, 2026)*
- [ ] URL: `https://szlholdings.com`
- [ ] Twitter/X handle: (set if applicable)
- [ ] Location: (set if applicable)
- [ ] Avatar: SZL Holdings logo (premium, not generic)

---

## Member Privileges

Navigate to **Settings → Member privileges**:

| Setting | Recommended Value |
|---------|------------------|
| Base permissions | Read — members can read all repos |
| Repository creation (members) | Disabled — only admin creates repos |
| Repository forking | Disabled — forks require approval |
| Repository deletion | Admin only |
| Pages creation | Admin only |

---

## Code Security and Analysis (Org-Level)

Navigate to **Settings → Code security and analysis**:

- [ ] Enable Dependabot alerts for all repositories
- [ ] Enable Dependabot security updates for all repositories
- [ ] Enable secret scanning for all repositories
- [ ] Enable push protection for all repositories
- [ ] Enable CodeQL for all supported repositories

---

## Actions Settings

Navigate to **Settings → Actions → General**:

| Setting | Recommended Value |
|---------|------------------|
| Actions permissions | Allow enterprise actions and locally created actions |
| Fork pull request workflows | Require approval for all outside collaborators |
| Workflow permissions | Read repository contents (default) |

---

## Pinned Repositories

Navigate to **Org profile → Customize your organization** (from the org landing page):

Recommended pinned repositories (maximum 6):
1. `szl-holdings-platform` — main platform repository
2. Any public documentation or showcase repos (if created)

See `docs/CONSOLIDATION.md` for the current founder-gated portfolio proposal.
`docs/github/PUBLIC_REPO_PORTFOLIO_STRATEGY.md` is retained only as a
superseded April 2026 historical strategy.

---

## People and Teams

Navigate to **Settings → People** and **Settings → Teams**:

- [ ] Verify only authorized members have access
- [ ] Create a `platform-core` team with maintain access to `szl-holdings-platform`
- [ ] Create an `investor-review` team with read access for due diligence reviewers
- [ ] Remove any test or stale member accounts

---

## Billing and Plan

Navigate to **Settings → Billing**:

- [ ] Verify GitHub plan is appropriate for team size
- [ ] Confirm Actions minutes and storage are sufficient
- [ ] Set up billing alerts to avoid unexpected charges

---

## Audit Log

Navigate to **Settings → Audit log**:

- [ ] Review audit log periodically for unexpected access or changes
- [ ] Set up audit log streaming if available on your plan (recommended for security compliance)

---

*Apply these settings manually in the GitHub UI. Last reviewed: April 2026*
