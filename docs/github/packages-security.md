# SZL Holdings — GitHub Packages Security Guide

> Covers: token management, GITHUB_TOKEN scopes, PAT guidance, and secret hygiene for all five package registries.

---

## Token Types

### 1. GITHUB_TOKEN (Automatic — preferred for CI)

GitHub Actions automatically provides `GITHUB_TOKEN` in every workflow run. It is scoped to the repository and expires when the job ends.

**Use for:**
- Publishing packages in CI/CD (`npm publish`, `docker push`, `mvn deploy`, etc.)
- Reading packages from the same organization's repos

**Limitations:**
- Cannot be used outside GitHub Actions
- Cannot access packages in other organizations
- Cannot push to repos outside the workflow's repo without explicit permissions

**Required permissions in workflow:**

```yaml
permissions:
  contents: read
  packages: write   # Required for publishing
```

For read-only workflows:
```yaml
permissions:
  contents: read
  packages: read
```

**Never do this:**
```yaml
# BAD — grants more than needed
permissions:
  contents: write
  packages: write
  actions: write
  # ... everything
```

---

### 2. Personal Access Token (PAT) — for local development

A PAT is required for local development workflows (publishing, pulling private packages).

#### Creating a PAT for local package work

1. Go to: `https://github.com/settings/tokens`
2. Click **Generate new token (classic)**
3. Name: `szl-holdings-packages-local` (or similar)
4. Expiration: **90 days** (never use "No expiration")
5. Scopes:
   - `read:packages` — pull packages from GitHub Packages
   - `write:packages` — publish packages (only if you publish locally)
   - `delete:packages` — only if you need to delete versions

**Do NOT grant:**
- `repo` (full control) — not needed for packages
- `admin:org` — not needed for packages
- `workflow` — not needed unless you trigger Actions

#### Storing the PAT locally

**Option 1: Environment variable (recommended)**
```bash
# In ~/.zshrc or ~/.bashrc
export GITHUB_TOKEN=ghp_your_token_here

# Reload
source ~/.zshrc
```

**Option 2: .env file (for project-specific work)**
```bash
# .env (MUST be in .gitignore)
GITHUB_TOKEN=ghp_your_token_here
```

Verify `.gitignore` contains:
```
.env
.env.local
.env*.local
```

**Option 3: OS keychain (most secure)**
Use `gh auth login` with GitHub CLI — it stores credentials in the system keychain.

---

## Secret Hygiene Rules

### Never commit tokens

```bash
# Check for accidental token commits before pushing
git log --all --full-history -p | grep "ghp_\|ghcr_\|github_pat_"
```

### Never hardcode tokens in code

```typescript
// BAD
const token = "ghp_abc123...";

// GOOD
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required");
```

### Never log tokens

```bash
# BAD — this logs the token to CI output
echo "Using token: $GITHUB_TOKEN"

# GOOD
echo "GITHUB_TOKEN is set: $([ -n "$GITHUB_TOKEN" ] && echo yes || echo NO)"
```

### Rotate tokens on suspicion of exposure

If a token is accidentally committed:
1. **Immediately revoke** it at `https://github.com/settings/tokens`
2. Generate a new token
3. Update secrets in GitHub Actions: Settings → Secrets and variables → Actions
4. Update local `.env` or shell profile
5. Force-push to remove from git history (only if repo is private):
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" HEAD
   git push origin --force --all
   ```

---

## GitHub Actions Secret Management

### Adding org-level secrets (preferred for shared tokens)

1. Go to: `https://github.com/organizations/szl-holdings/settings/secrets/actions`
2. Click **New organization secret**
3. Set **Repository access** to `szl-holdings-platform` (not "All repositories")

### Adding repo-level secrets

1. Go to: `https://github.com/szl-holdings/platform/settings/secrets/actions`
2. Click **New repository secret**

### Required secrets by registry

| Secret Name | Used By | Notes |
|-------------|---------|-------|
| `GITHUB_TOKEN` | All registries | Auto-provided, never set manually |
| `NPM_PUBLISH_TOKEN` | npm (optional) | Only if using npmjs.com in addition to GitHub Packages |
| `DOCKER_PASSWORD` | Containers | Only if using Docker Hub in addition to ghcr.io |

No additional secrets are needed for GitHub Packages — `GITHUB_TOKEN` covers everything.

---

## Scoped Permissions Reference

### npm (`@szl-holdings` scope)

| Action | Token Scope |
|--------|------------|
| Install public packages | `read:packages` |
| Install private packages | `read:packages` |
| Publish | `write:packages` |
| Delete version | `delete:packages` |

### Containers (ghcr.io)

| Action | Token Scope |
|--------|------------|
| Pull public image | None (anonymous) |
| Pull private image | `read:packages` |
| Push | `write:packages` |
| Delete | `delete:packages` |

### Maven, NuGet, RubyGems

Same as npm above.

---

## Dependency Security

### Audit npm dependencies

```bash
# Check for known vulnerabilities
pnpm audit

# Check for unauthorized package sources
cat .npmrc
# Ensure @szl-holdings scope points only to npm.pkg.github.com
```

### Dependabot for GitHub Packages

Enable Dependabot for automatic security updates:

1. Go to: Settings → Security → Dependabot
2. Enable **Dependabot alerts**
3. Enable **Dependabot security updates**

Dependabot is configured in `.github/dependabot.yml` (create if needed).

---

## Container Image Security

### Scan images before pushing

Add to CI workflow after build:
```yaml
- name: Scan image for vulnerabilities
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'ghcr.io/szl-holdings/api-server:${{ github.sha }}'
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'
```

### Non-root user in all Dockerfiles

All SZL Holdings Dockerfiles use a non-root user:
```dockerfile
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
USER appuser
```

### Image signing (future)

Consider Sigstore/cosign for image signing when moving to production deployments.

---

## Audit Trail

All package publish events are logged in GitHub's audit log:
- Org level: `https://github.com/organizations/szl-holdings/settings/audit-log`
- Filter by: `action:packages.*`

Run the package audit script for a programmatic view:
```bash
pnpm tsx scripts/github/audit-packages.ts
```

---

## Related Files

- `docs/github/packages-strategy.md` — registry overview and naming
- `ops/github/packages-manual-checklist.md` — GitHub UI steps
- `scripts/github/audit-packages.ts` — automated audit
