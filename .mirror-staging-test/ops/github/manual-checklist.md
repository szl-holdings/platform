# SZL Holdings — GitHub Manual Operations Checklist

Use this checklist when performing GitHub operations manually through the web interface.

---

## 1. Repository Settings — szl-holdings-platform

### Via GitHub Web Interface

1. Navigate to: `https://github.com/stephenlutar2-hash/szl-holdings-platform`
2. Click **Settings** tab

**General Settings:**

- [ ] **Description:** Set to:
  ```
  Platform ecosystem for business observability, AI orchestration, maritime intelligence, and secure execution — built by Stephen Lutar.
  ```
- [ ] **Website:** Set to: `https://szlholdings.com`
- [ ] **Topics:** Add all of the following:
  - `typescript`
  - `react`
  - `nodejs`
  - `postgresql`
  - `drizzle-orm`
  - `expo`
  - `monorepo`
  - `pnpm`
  - `azure`
  - `ai-orchestration`
  - `business-observability`
  - `maritime-intelligence`
  - `saas`

**Feature Settings (under General):**
- [ ] Issues: ✅ Enabled
- [ ] Projects: ❌ Disabled
- [ ] Wiki: ❌ Disabled
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

1. Navigate to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/releases/new`
2. Click **Choose a tag** → Type `v0.1.0` → Click **Create new tag: v0.1.0 on publish**
3. Target: `master`
4. **Release title:** `v0.1.0 — Initial Public Platform Release`
5. **Description:** Copy from `docs/releases/v0.1.0.md`
6. **Mark as latest release:** ✅ Yes (for pre-commercial, can also mark as pre-release)
7. Click **Publish release**

---

## 6. Bootstrap Issue Labels

Navigate to: `https://github.com/stephenlutar2-hash/szl-holdings-platform/labels`

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

## 7. Verify Completed State

After all steps above:

- [ ] Repository description is set
- [ ] Topics are added
- [ ] Homepage URL is set
- [ ] Branch protection is applied to `master`
- [ ] Profile README repository exists and is populated
- [ ] GitHub profile settings are updated
- [ ] v0.1.0 release is published
- [ ] Issue labels are bootstrapped
