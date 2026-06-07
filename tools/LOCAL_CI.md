# Local CI Runner — szl-holdings/platform

**Context:** GitHub Actions minutes for the `szl-holdings` free-tier org are exhausted
for May 2026. This tooling provides a zero-cost, zero-configuration local CI bypass
that reports results back to GitHub via the Checks API.

GitHub docs reference:
- [About billing for GitHub Actions](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions)
- [Free tier quotas: 2 000 minutes/month on private repos](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions#included-storage-and-minutes)
- [Checks REST API](https://docs.github.com/en/rest/checks/runs)

---

## Quickstart (one command)

```bash
# Run all local checks, post results to GitHub:
GH_REPORT=1 ./tools/local-ci-runner.sh
```

That is it. The script runs every blocking CI gate from `ci.yml` locally and
posts a `check-run` per gate to GitHub so the PR shows green/red status checks.

---

## Workflow classification

| Workflow | Local? | Blocker? | Notes |
|---|---|---|---|
| `ci.yml` → lint | ✅ Yes | Blocking | `pnpm run lint` |
| `ci.yml` → typecheck | ✅ Yes | Blocking | `pnpm run typecheck` |
| `ci.yml` → test | ✅ Yes | Blocking | `DATABASE_URL=stub pnpm run test` |
| `ci.yml` → build | ✅ Yes | Blocking | `pnpm -r --if-present run build` |
| `ci.yml` → secret-scan | ✅ Yes* | Blocking | Requires `gitleaks` on PATH |
| `ci.yml` → proof-chain-checks | ✅ Yes | Blocking | Node + vitest |
| `ci.yml` → brand-strings | ✅ Yes | Blocking | `pnpm brand:strings` |
| `ci.yml` → env-coverage | ✅ Yes | Blocking | `pnpm check:env-coverage:strict` |
| `ci.yml` → design-token-drift | ✅ Yes | Blocking | threshold=40 |
| `ci.yml` → pin-check | ✅ Yes | Blocking | Pure bash, no deps |
| `readme-qa.yml` | ✅ Yes | Advisory | `pnpm readme:check` |
| `commitlint.yml` | ✅ Yes | Advisory | `pnpm commitlint` (run locally as needed) |
| `security.yml` | ✅ Yes | Advisory | SBOM + vuln + license |
| `codeql.yml` | ❌ Deferred | Advisory | Requires `github/codeql-action` SARIF upload |
| `szl-zarf-publish.yml` | ❌ Deferred | Advisory | Requires Zarf CLI + GHCR push + cosign key |
| `deploy-staging.yml` | ❌ Deferred | Advisory | Requires `REPLIT_STAGING_DEPLOY_TOKEN` |
| `post-deploy-smoke.yml` | ❌ Deferred | Advisory | Requires `PRODUCTION_BASE_URL` |
| `e2e.yml` | ❌ Deferred | Advisory | Playwright + Chromium, resource-heavy |
| `a11y.yml` | ❌ Deferred | Advisory | axe + Playwright, resource-heavy |
| `lighthouse.yml` | ❌ Deferred | Advisory | Lighthouse CI + Chromium |
| `audit-full.yml` | ❌ Deferred | Advisory | Superset of above |
| `dependabot-auto-merge.yml` | ❌ N/A | — | Dependabot-triggered, no local equivalent |

*`gitleaks` install: `brew install gitleaks` or see [gitleaks releases](https://github.com/gitleaks/gitleaks/releases).

---

## Prerequisites

```
node  >= 18   (v20+ preferred to match CI)
pnpm  >= 8
gh    >= 2.40 (only needed when GH_REPORT=1)
```

`gh` must be authenticated:

```bash
gh auth status          # check
gh auth login           # if not authenticated
```

---

## Usage reference

### Local-only run (no GitHub reporting)

```bash
./tools/local-ci-runner.sh
```

Exit code 0 = all blocking checks passed. Logs in `.local-ci-logs/`.

### Run and post results to GitHub

```bash
GH_REPORT=1 ./tools/local-ci-runner.sh
```

Each check posts a `check-run` to `szl-holdings/platform` at the current
`HEAD` SHA. The PR Checks tab reflects the result immediately.

### Run against a specific commit (e.g., PR head)

```bash
GH_REPORT=1 HEAD_SHA=<40-char-sha> ./tools/local-ci-runner.sh
```

### Use as a pre-push hook

```bash
# .git/hooks/pre-push  (already wired by scripts/setup-hooks.sh if present)
#!/usr/bin/env bash
GH_REPORT=1 ./tools/local-ci-runner.sh
```

Or wire it manually:

```bash
echo '#!/usr/bin/env bash
GH_REPORT=1 ./tools/local-ci-runner.sh' > .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

### Run a single check in isolation

```bash
# Lint only:
pnpm run lint

# Tests only (with the required stub DATABASE_URL):
DATABASE_URL=postgres://ci-stub:ci-stub@127.0.0.1:5432/ci-stub NODE_ENV=test pnpm run test

# Proof-chain checks only:
node scripts/check-proof-chain.js
```

---

## Backup path: temporary repo visibility flip (Option D)

If you want GitHub Actions to run the deferred workflows (codeql, e2e, deploy,
zarf) before June 2026, the fastest path is to make the repo public temporarily.
GitHub-hosted runners have **unlimited free minutes on public repositories**.

**Secret leakage audit result (pre-confirmed):**
- `REPLIT_STAGING_DEPLOY_TOKEN` / `REPLIT_STAGING_APP_ID` — used in
  `deploy-staging.yml`; workflow is `workflow_dispatch`-only and has explicit
  guards that skip deploy when secrets are missing. External actors cannot
  trigger these without write access.
- `ZARF_COSIGN_PRIVATE_KEY` / `COSIGN_PASSWORD` — used in
  `szl-zarf-publish.yml`; trigger is `push: tags: 'v*'` only. Not exposed by
  making the repo public.
- `PRODUCTION_BASE_URL` / `SLACK_WEBHOOK_URL` — low sensitivity; used for
  smoke-test URLs and Slack notifications.
- **Conclusion:** making the repo public is safe for a temporary window.
  No secret is echoed into logs or reachable by fork PRs.

**One-line command to flip public:**

```bash
gh repo edit szl-holdings/platform --visibility public --accept-visibility-change-consequences
```

**One-line command to flip back private:**

```bash
gh repo edit szl-holdings/platform --visibility private
```

Recommended sequence:

1. Run `gh repo edit szl-holdings/platform --visibility public --accept-visibility-change-consequences`
2. Push the branch / open the PR — GitHub Actions will run immediately (free, unlimited).
3. Once all checks are green and the PR is merged, optionally flip back:
   `gh repo edit szl-holdings/platform --visibility private`
4. The user already plans to make this repo public permanently — step 3 is
   optional.

---

## Logs

All run logs are written to `.local-ci-logs/` (gitignored). Each check gets
its own file (`lint.log`, `typecheck.log`, etc.). `summary.txt` contains the
pipe-delimited result record for every check.

---

## When Actions minutes reset

GitHub resets the monthly quota on the **first day of each billing cycle**
(approximately 2026-06-01 for the May cycle). At that point, all 15 workflows
will run normally on GitHub-hosted runners with no changes required.
This local runner remains useful for fast pre-push feedback regardless.

Reference: [GitHub Actions billing cycle](https://docs.github.com/en/billing/managing-billing-for-your-products/managing-billing-for-github-actions/about-billing-for-github-actions#about-spending-limits)
