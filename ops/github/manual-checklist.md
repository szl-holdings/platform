# SZL Holdings — GitHub Manual Operations Checklist

> **See also:** The comprehensive enterprise UI checklist is at `docs/github/manual-ui-checklist.md`. It covers org creation, org README, pinned repos, branch protection, Actions settings, secrets, security analysis, domain verification, and the full Phase 1–3 maturity path with exact values and plan tier requirements.

Use this checklist when performing GitHub operations manually through the web interface.

---

## 1. Repository Settings — szl-holdings-platform

> **Note:** After org creation (see `docs/github/org-setup-package.md`), this URL changes to `github.com/szl-holdings/szl-holdings-platform`. Update accordingly.

### Via GitHub Web Interface

1. Navigate to: `https://github.com/szl-holdings/szl-holdings-platform`
2. Click **Settings** tab

**General Settings:**

- [ ] **Description:** Set to:
  ```
  Governed decision infrastructure software — Lyte · Alloy · Aegis · Vessels · Terra
  ```
- [ ] **Website:** Set to: `https://szlholdings.com`
- [ ] **Topics:** Add all of the following (see `ops/github/recommended-topics.md` for rationale):
  - `szl-holdings`
  - `lyte`
  - `alloy`
  - `business-observability`
  - `ai-orchestration`
  - `secure-operations`
  - `enterprise-platform`
  - `typescript`
  - `react`
  - `azure`
  - `vessels`

**Feature Settings (under General):**
- [ ] Issues: ✅ Enabled
- [ ] Projects: ❌ Disabled
- [ ] Wiki: ✅ Enabled (required for wiki documentation layer — see `ops/github/wiki-manual-steps.md`)
- [ ] Discussions: ❌ Disabled
- [ ] Packages: ❌ Disabled

---

## 2. Branch Protection Rules

1. Navigate to: Settings → Branches
2. Click **Add branch protection rule**
3. Branch name pattern: `master`

- [ ] **Require a pull request before merging:** ✅ (recommended for public mirror discipline)
- [ ] **Require status checks to pass before merging:** ✅ (if CI workflows are active)
  - Required: `ci`, `build`
- [ ] **Include administrators:** ✅ (the branch protection should apply to everyone)
- [ ] **Allow force pushes:** ❌ Disabled
- [ ] **Allow deletions:** ❌ Disabled

---

## 3. Create Profile README Repository

1. Navigate to: `https://github.com/new`
2. Repository name: `stephenlutar2-hash` *(must match your GitHub username exactly)*
3. Visibility: **Public**
4. Initialize with a README: ✅ Yes
5. Click **Create repository**
6. Edit the `README.md` with the contents from `profile-readme/README.md`
7. Commit the changes

---

## 4. Update GitHub Profile Settings

1. Navigate to: `https://github.com/settings/profile`

- [ ] **Name:** `Stephen Lutar`
- [ ] **Bio:** `Building premium command-grade platforms — SZL Holdings`
- [ ] **Company:** `SZL Holdings`
- [ ] **Location:** (your location)
- [ ] **Website:** `https://szlholdings.com`
- [ ] **LinkedIn:** `linkedin.com/in/stephen-l-279315240`

---

## 5. Create Release v0.1.0

1. Navigate to: `https://github.com/szl-holdings/szl-holdings-platform/releases/new`
2. Click **Choose a tag** → Type `v0.1.0` → Click **Create new tag: v0.1.0 on publish**
3. Target: `master`
4. **Release title:** `v0.1.0 — Initial Public Platform Release`
5. **Description:** Copy from `docs/releases/v0.1.0.md`
6. **Mark as latest release:** ✅ Yes (for pre-commercial, can also mark as pre-release)
7. Click **Publish release**

---

## 6. Bootstrap Issue Labels

Navigate to: `https://github.com/szl-holdings/szl-holdings-platform/labels`

Delete any default labels that don't fit. Create the following:

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

## 7. Wiki Setup

See `ops/github/wiki-manual-steps.md` for the complete wiki setup workflow.

Summary:
1. Enable wiki in repository Settings → Features → Wikis
2. Create first page through GitHub UI to initialize wiki repo
3. Clone wiki repo: `git clone https://github.com/szl-holdings/szl-holdings-platform.wiki.git ../szl-holdings-platform.wiki`
4. Run wiki sync pipeline: validate → export → commit
5. Verify sidebar, footer, and image rendering

---

## 8. Social Preview Upload

See `scripts/github/update-social-preview-guide.md`.

1. Go to: Settings → Social preview → Edit
2. Upload `docs/media/social-preview/repo-social-preview.png`
3. Verify with a test share

---

## 9. GitHub Packages Setup

GitHub Packages is configured for all five registries (npm, containers, Maven, NuGet, RubyGems).

See the complete packages setup and manual UI steps at:
**`ops/github/packages-manual-checklist.md`**

Quick reference:
- Enable Packages feature in repo Settings → Features
- Connect published packages to the repository after first CI publish
- Set workflow permissions to Read and write (Settings → Actions → Workflow permissions)

Related docs:
- `docs/github/packages-strategy.md` — all registries, naming, versioning, access control
- `docs/github/packages-security.md` — token management, secret hygiene
- `scripts/github/audit-packages.ts` — audit published packages across all registries

---

## 10. Verify Completed State

After all steps above:

- [ ] Repository description is set (new canonical description)
- [ ] Topics are added (11 recommended topics from `recommended-topics.md`)
- [ ] Homepage URL is set
- [ ] Branch protection is applied to `master`
- [ ] Profile README repository exists and is populated
- [ ] GitHub profile settings are updated
- [ ] v0.1.0 release is published
- [ ] Issue labels are bootstrapped
- [ ] Wiki is enabled and published (12 pages + sidebar + footer)
- [ ] Social preview image is uploaded
- [ ] README links to wiki pages are valid
- [ ] GitHub Packages enabled (see `ops/github/packages-manual-checklist.md`)
- [ ] Workflow permissions set to Read and write
