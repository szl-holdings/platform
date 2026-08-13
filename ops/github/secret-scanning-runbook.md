# Runbook — Secret Scan Hit Triage

Last updated: 2026-08-13
Owner: SZL Holdings (repo owner)

This runbook covers what to do when **any** of the following fires on the
public `szl-holdings/platform` repo:

- The PR-time Gitleaks gate (`Security Audit & SBOM / Secret Scan (Gitleaks)` in `.github/workflows/security.yml`)
- The scheduled or manual Gitleaks sweep (`Security Audit & SBOM` in `.github/workflows/security.yml`)
- GitHub-native secret scanning alert (Security → Secret scanning)
- Push protection bounced a `git push` with a "Secret detected" message

## Layered defenses (what is in place)

| Layer | Where | What it catches | When it runs |
|---|---|---|---|
| GitHub native secret scanning | Repo Settings → Code security → "Secret scanning" | Partner-known token patterns (AWS, GCP, GitHub, Stripe, Slack, …) | On every push to any branch, continuously over history |
| GitHub push protection | Repo Settings → Code security → "Push protection" | Same partner-known patterns, **before** the push lands | At `git push` time (blocking) |
| Gitleaks PR gate | `.github/workflows/security.yml` → `secret-scan` job | Full Gitleaks ruleset + repo overrides in `.gitleaks.toml` over the PR base-to-head range | Every PR; a finding fails the fan-in `Security Gate (blocking)` job |
| Gitleaks history sweep | `.github/workflows/security.yml` → `secret-scan` job | Full Gitleaks ruleset over history reachable from the checked-out `main` ref | Pushes to `main`, Mondays 03:00 UTC, and manual dispatch |
| Project-specific scanner | `scripts/qa/scan-secrets.js` | Internal naming patterns (belt-and-suspenders) in the current tree | Every `security.yml` PR, push, scheduled, and manual run |

## One-time GitHub setup (owner-only, click-path)

Both of the following must be **enabled** on
`szl-holdings/platform`. They are free on public repos.

1. **Settings → Code security**
2. Under **Secret scanning** click **Enable**.
3. Under **Push protection** click **Enable**.
4. Under **Push protection → Bypass list** leave empty (no bypass).
5. Under **Secret scanning alerts → Notifications** confirm that
   repository admins receive emails (this is the existing notification
   channel — no extra wiring needed).

Verification: Settings → Code security should show both **Secret
scanning: Enabled** and **Push protection: Enabled** with a green check.

> If either toggle is missing, the repo is private (push protection on
> private repos requires GitHub Advanced Security). The visibility
> decision is recorded in [`repo-visibility-decision.md`](./repo-visibility-decision.md);
> the repo is intentionally public so both toggles must be available.

## Triage flow when a hit fires

### Step 1 — Confirm it's a real secret (not a fixture)

1. Open the native alert or failed workflow run and read the matched line **only in the redacted form GitHub shows you**.
2. Check the file path against the known-safe list:
   - `tests/**`, `**/__fixtures__/**`, `**/*.test.*`, `**/*.spec.*`
   - `packages/demo-seed/**`, `packages/simulation/**`, `packages/replay-core/**`
   - `lib/services/src/adapters/**`, `lib/services/src/providers/msp-seed.ts`
   - `infra/runbooks/**`, `ops/**` documentation
   - `*.example`, `*.template`
3. If it is in one of those paths and is clearly a placeholder / illustrative value, it is a **false positive**. Add an allow-list entry to `.gitleaks.toml` (`[allowlist]` section, prefer the most specific `path` or `regex` you can write) in a new PR. Do **not** open the redacted match into chat or commit messages.

### Step 2 — If it might be real, treat as a confirmed leak

Do not close the alert, do not delete the commit, do not force-push.
The credential is already public — rotation is the only mitigation.

1. **Rotate immediately** at the issuing provider (AWS console, GitHub PAT page, Stripe dashboard, etc.). Use the "revoke + reissue" flow, not "edit".
2. **Update the secret** in the consumer:
   - GitHub Actions: Repo Settings → Secrets and variables → Actions → update the matching name (see `ops/github/actions-secrets-matrix.md`).
   - Replit: Tools → Secrets → update the matching key.
   - Production runtime: follow `infra/runbooks/RUNBOOK_SECRETS.md`.
3. **Verify rotation** by triggering a workflow run (or `workflow_dispatch` of `Security Audit & SBOM`) that uses the secret and confirming it succeeds.
4. **Record the rotation** as a row in the table at the bottom of this file.
5. **Close the GitHub alert** with the resolution **"Revoked"** (Security → Secret scanning → click the alert → "Close as → Revoked").
6. **Sweep history** with `gitleaks detect --log-opts="--all"` locally to confirm no other instance of the same value exists elsewhere in history; if it does, rotate any other affected credential too.

### Step 3 — Prevent the recurrence

For every confirmed leak, add a follow-up in the same PR / issue:

- If a developer workflow allowed the leak (e.g., copy-pasting an env value into source), document the safer pattern in `infra/runbooks/RUNBOOK_SECRETS.md`.
- If Gitleaks did not catch the pattern but should have, add a `[[rules]]` entry to `.gitleaks.toml` and re-run **Actions → Security Audit & SBOM → Run workflow**.

## Manual on-demand scan

An authorized maintainer can trigger the scan ad-hoc:

```text
Actions → Security Audit & SBOM → Run workflow → main → Run workflow
```

Locally:

```bash
gitleaks detect --source . --config .gitleaks.toml --redact --verbose
```

## Rotation log

| Date (UTC) | Alert source | Credential type | Rotated by | Workflow run / PR |
|---|---|---|---|---|
| _none yet_ | | | | |
