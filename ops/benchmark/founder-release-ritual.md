# Founder Release Ritual

Generated: 2026-04-16
Phase: H+J — Release Control Tower

---

## Overview

This is the complete, founder-friendly release checklist. It is designed to be run end-to-end before publishing a new version, by one person in under 30 minutes. No jargon, no ambiguity.

Use this alongside the technical `release-verification-pack.md` for full coverage.

---

## Before You Start

You need:
- Access to the Replit workspace
- Access to the GitHub repository
- 20–30 minutes of focused time
- The version number you're releasing (e.g., `v0.2.0`)

---

## Step 1: Confirm the Build Is Clean (5 min)

In your terminal or Replit shell:

```bash
pnpm run lint        # No errors
pnpm run typecheck   # No errors
pnpm run test        # All pass
pnpm run build       # All artifacts build
```

Also check: the CI badge in the GitHub repo header is green. If it is not — stop. Do not release until CI is green.

---

## Step 2: Write the Release Notes (5–10 min)

Create a file at `docs/releases/v0.2.0.md` (replace with your version).

Use the template in `ops/github/release-plan.md`. Write honestly:
- What was added
- What was changed
- What was fixed

Do not:
- Reference features that aren't actually live
- Use vague language ("various improvements")
- Mention internal tooling paths or test credentials

---

## Step 3: Update the Changelog (2 min)

Open `CHANGELOG.md` at the root of the repo. Add an entry at the top:

```markdown
## [v0.2.0] — 2026-04-16

### Added
- [Feature 1]

### Changed
- [Change 1]

### Fixed
- [Fix 1]
```

Commit this change: `git commit -m "chore: update changelog for v0.2.0"`

---

## Step 4: Verify Secrets Are Set (2 min)

Open the Replit Secrets panel. Confirm these are present (not empty):
- `SESSION_SECRET`
- `FIELD_ENCRYPTION_KEY`
- `DATABASE_URL`
- `ALLOY_INTERNAL_TOKEN`
- `CLERK_SECRET_KEY`
- `OAUTH_STATE_SECRET`
- `VAPID_PRIVATE_KEY`

If any are missing, set them now. See `ops/security/secret-inventory.md`.

---

## Step 5: Deploy (2–5 min)

Via Replit Deploy button, or via GitHub release:

```bash
gh release create v0.2.0 \
  --repo <your-repo> \
  --title "v0.2.0 — [Short Title]" \
  --notes-file docs/releases/v0.2.0.md \
  --latest
```

Wait for the deployment workflow to complete (watch GitHub Actions).

---

## Step 6: Run Smoke Tests (5 min)

After deployment completes, verify:

```bash
DOMAIN=<your-production-domain>
curl -sf https://$DOMAIN/api/health/live && echo "API: LIVE"
curl -sf https://$DOMAIN/api/health/ready && echo "DB: READY"
```

Then manually:
- Load the SZL Holdings homepage — verify it looks correct
- Open Command Portal (`/command/`) — verify health score is visible
- Log in and log out — verify auth cycle works
- Open Aegis (`/aegis/`) — verify sidebar loads
- Open browser DevTools — verify zero console errors

---

## Step 7: Confirm No Rollback Triggers (2 min)

Check: in the 10 minutes since deploy, has any of this happened?
- API health endpoint returned non-200? → Rollback
- 5xx error rate spiked above 5%? → Rollback
- Login is broken? → Rollback
- Any flagship app fails to load? → Rollback (if not fixed in 15 min)

If none of the above — you're done. The release is live and stable.

---

## Step 8: Publish the GitHub Release (2 min)

If you haven't already:
1. Go to `https://github.com/<org>/szl-holdings-platform/releases`
2. Confirm the release tag is visible with the correct title
3. Verify release notes look correct to an external reader

---

## Done

Ship it. The platform is live.

---

## If Something Goes Wrong

**Rollback:**
1. Go to Replit > Deployments > Rollback to previous version
2. Confirm `/api/health/live` returns 200
3. Run smoke tests again
4. Write a short incident note in `ops/incidents/` with what happened and when

**Getting Help:**
- Technical recovery: `ops/observability/post-deploy-smoke-tests.md` (rollback procedure)
- Alert context: `ops/observability/alert-matrix.md`
- Secret issues: `ops/security/secret-inventory.md`

---

## Quick Reference Card

| Step | Time | Action |
|------|------|--------|
| 1 | 5 min | `pnpm lint + typecheck + test + build` all pass; CI green |
| 2 | 5–10 min | Write release notes in `docs/releases/vX.Y.Z.md` |
| 3 | 2 min | Update `CHANGELOG.md` |
| 4 | 2 min | Verify secrets in Replit panel |
| 5 | 2–5 min | Deploy via Replit or GitHub release |
| 6 | 5 min | Smoke tests + manual spot checks |
| 7 | 2 min | Confirm no rollback triggers |
| 8 | 2 min | Confirm GitHub release is published |
| **Total** | **~25 min** | |
