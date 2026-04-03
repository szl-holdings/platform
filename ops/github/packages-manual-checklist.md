# SZL Holdings — GitHub Packages Manual Checklist

> This checklist covers GitHub UI steps required to fully operationalize GitHub Packages
> for the SZL Holdings platform. Most publishing is automated via CI workflows.
>
> See also: `docs/github/packages-strategy.md` for registry overview and naming conventions.

---

## Phase 1: Enable GitHub Packages on the Repository

### 1.1 Enable Packages feature

1. Navigate to: `https://github.com/szl-holdings/szl-holdings-platform/settings`
2. Scroll to **Features** section
3. Check: **Packages** ✅ Enabled
4. Save changes

> Note: This is required before any packages can be published to this repository.

---

## Phase 2: Connect Published Packages to the Repository

After packages are published via CI, they must be connected to the repository.

### 2.1 Connect npm packages

For each `@szl-holdings/*` package that appears at `https://github.com/orgs/szl-holdings/packages`:

1. Navigate to the package page (e.g., `https://github.com/orgs/szl-holdings/packages/npm/shared-ui`)
2. Click **Connect repository** (right sidebar)
3. Search for and select `szl-holdings/szl-holdings-platform`
4. Click **Connect**

Packages to connect (after first publish):
- [ ] `@szl-holdings/shared-ui`
- [ ] `@szl-holdings/observability`
- [ ] `@szl-holdings/config`
- [ ] `@szl-holdings/services`
- [ ] `@szl-holdings/api-spec`
- [ ] `@szl-holdings/analytics`
- [ ] `@szl-holdings/api-client-react`
- [ ] `@szl-holdings/api-zod`
- [ ] `@szl-holdings/approvals`
- [ ] `@szl-holdings/audit`
- [ ] `@szl-holdings/auth`
- [ ] `@szl-holdings/data-connectors`
- [ ] `@szl-holdings/graphql-client`
- [ ] `@szl-holdings/i18n`
- [ ] `@szl-holdings/mcp-client`
- [ ] `@szl-holdings/proof-chain`
- [ ] `@szl-holdings/replit-auth-web`
- [ ] `@szl-holdings/workflow-engine`
- [ ] `@szl-holdings/worldline`
- [ ] `@szl-holdings/db`
- [ ] `@szl-holdings/ai-engine`

### 2.2 Connect container images

For each container image at `https://github.com/orgs/szl-holdings/packages?ecosystem=container`:

1. Navigate to the package page
2. Click **Connect repository** → select `szl-holdings/szl-holdings-platform`

Images to connect (after first push):
- [ ] `ghcr.io/szl-holdings/api-server`
- [ ] `ghcr.io/szl-holdings/szl-holdings-web`
- [ ] `ghcr.io/szl-holdings/lyte-command-center`
- [ ] `ghcr.io/szl-holdings/vessels`
- [ ] `ghcr.io/szl-holdings/terra`
- [ ] `ghcr.io/szl-holdings/aegis`
- [ ] `ghcr.io/szl-holdings/carlota-jo`
- [ ] `ghcr.io/szl-holdings/stephen-site`

---

## Phase 3: Package Visibility Settings

### 3.1 Set package visibility (public)

GitHub Packages inherits visibility from the repo by default, but explicit verification is recommended:

1. Navigate to each package page
2. Click **Package settings** (gear icon, right sidebar)
3. Under **Danger Zone → Change package visibility**:
   - Set to **Public** (consistent with the public repo)

### 3.2 Manage package access

1. On each package page → **Package settings** → **Manage access**
2. Add the following with appropriate roles:

| Team/User | Role | Purpose |
|-----------|------|---------|
| `szl-holdings/engineering` | Write | CI publish via team token |
| `github-actions[bot]` | Write | Auto-granted via GITHUB_TOKEN |

---

## Phase 4: Organization-Level Settings

### 4.1 Configure default package permissions

1. Navigate to: `https://github.com/organizations/szl-holdings/settings/packages`
2. Review **Default package access for new packages**:
   - Set: `Admin access: Public` (for public repos)
3. Review **Package creation permissions**:
   - Recommend: Members only (not public)

### 4.2 Enable GitHub Actions write permissions

1. Navigate to: `https://github.com/szl-holdings/szl-holdings-platform/settings/actions`
2. Under **Workflow permissions**:
   - Select: **Read and write permissions** ✅
   - Check: **Allow GitHub Actions to create and approve pull requests** ✅
3. Save

> This is required for `GITHUB_TOKEN` to be able to push to GitHub Packages.

---

## Phase 5: Secrets Configuration

### 5.1 Verify GITHUB_TOKEN permissions

No action needed — `GITHUB_TOKEN` is automatically provided. Confirm workflow permissions
are set to **Read and write** (done in Phase 4.2 above).

### 5.2 Add repo-level secrets (if needed)

Navigate to: `https://github.com/szl-holdings/szl-holdings-platform/settings/secrets/actions`

| Secret | Value | When Needed |
|--------|-------|------------|
| `GITHUB_TOKEN` | Auto-provided | Never set manually |
| `NPM_TOKEN` | npmjs.com token | Only if also publishing to npmjs.com |

---

## Phase 6: Dependabot Configuration (recommended)

### 6.1 Enable Dependabot for GitHub Packages

Create `.github/dependabot.yml` if not present:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    registries:
      - github-npm
    groups:
      szl-holdings:
        patterns: ["@szl-holdings/*"]

registries:
  github-npm:
    type: npm-registry
    url: https://npm.pkg.github.com
    token: ${{secrets.GITHUB_TOKEN}}
```

---

## Phase 7: First Publish Verification

After running the first CI publish:

- [ ] Visit `https://github.com/orgs/szl-holdings/packages` — packages listed
- [ ] Run `pnpm tsx scripts/github/audit-packages.ts` — audit shows packages
- [ ] Pull a container: `docker pull ghcr.io/szl-holdings/api-server:latest`
- [ ] Install an npm package: `npm install @szl-holdings/shared-ui` (from a test project)
- [ ] Check package storage usage at `https://github.com/organizations/szl-holdings/settings/billing`

---

## Maven / NuGet / RubyGems (Activate When Ready)

These registries are template-ready but not yet active. When activating:

- [ ] Maven: Follow `docs/github/packages/maven/SETUP.md`
- [ ] NuGet: Follow `docs/github/packages/nuget/SETUP.md`
- [ ] RubyGems: Follow `docs/github/packages/rubygems/SETUP.md`
- [ ] Run the corresponding CI workflow once manually via **Actions → workflow → Run workflow**
- [ ] Connect the new package to the repository (Phase 2 above)

---

## See Also

- `docs/github/packages-strategy.md` — full registry strategy
- `docs/github/packages-security.md` — token and secret hygiene
- `scripts/github/audit-packages.ts` — automated audit
- `ops/github/manual-checklist.md` — general GitHub setup checklist
