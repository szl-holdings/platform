# Environment and Release — Final

**Last updated:** April 2026  
**Purpose:** Canonical environment story for internal ops and external evaluators. Covers local → Replit dev → staging → production path, deployment expectations, and release verification.

---

## Environment Overview

SZL Holdings runs on four environments:

| Environment | Purpose | Infrastructure |
|---|---|---|
| Local | Individual developer workstation | Node.js, local PostgreSQL |
| Replit Dev | Primary development environment | Replit workspace, shared PostgreSQL |
| Staging | Pre-production validation (future) | Replit deployment or separate workspace |
| Production | Live customer-facing platform | Replit Autoscale + Reserved VM |

Currently (as of April 2026), Replit Dev functions as both the development and pre-production environment. A dedicated staging environment is planned but not yet configured.

---

## Replit Dev Environment

The development environment runs in a Replit workspace with path-based routing through the Replit proxy:

| Artifact | Preview Path | Deployment Type |
|---|---|---|
| szl-holdings (public site) | / | Autoscale |
| firestorm / Aegis | /firestorm/ | Autoscale |
| terra / Terra | /terra/ | Autoscale |
| vessels / Vessels | /vessels/ | Autoscale |
| carlota-jo / Carlota Jo | /carlota-jo/ | Autoscale |
| command / Command Portal | /command/ | Autoscale |
| api-server | /api/ | Reserved VM |
| szl-holdings-mobile | N/A | Expo / EAS |

All apps share the Replit proxy for development access. The proxy handles mTLS for preview connections.

**Environment variables in dev:**
- All secrets in Replit Secrets panel (encrypted, not in source code)
- Public configuration in `.replit [userenv.shared]` (VAPID public key, NODE_ENV, etc.)
- No secrets in source code — this is a hard requirement

---

## Production Deployment Architecture

### Web Applications (Autoscale)

- Build: `pnpm --filter @workspace/[app-name] run build`
- Output: `dist/` directory served as static files
- Health check: HTTP 200 on `/`
- Custom domain configured in Replit deployment settings
- Environment variables set in Replit deployment settings (not workspace secrets)

### API Server (Reserved VM)

- Always-on: Required for WebSocket connections and background job processing
- Build: `pnpm --filter @workspace/api-server run build`
- Run: `NODE_ENV=production PORT=8080 node dist/index.mjs`
- Health check: HTTP 200 on `/api/health/live`
- Requires: DATABASE_URL, SESSION_SECRET, all integration keys

**Reserved VM is required for the API server.** Autoscale instances cold-start, which breaks WebSocket connections and background jobs. Do not deploy the API server as Autoscale.

### Mobile (EAS — Not Replit)

- CORTEX and szl-holdings-mobile are built via Expo Application Services (EAS)
- Distributed through Apple App Store (TestFlight → production) and Google Play Store (internal → production)
- No Replit deployment for mobile — EAS handles build and submission

---

## Multi-App Deployment Options

**Option A (Current):** Single workspace, path-based routing. All apps share Replit compute.
- Simpler to operate; appropriate for pre-revenue and early commercial phase
- Shared resources mean one badly behaved app can affect others

**Option B (Recommended for Scale):** Separate deployments for flagship public site and API.
- szl-holdings: Autoscale (static site, scales independently)
- api-server: Reserved VM (always-on, isolated from web apps)
- Domain apps: Embed in szl-holdings or deploy separately as needed

Transition to Option B is a manual configuration task, not a code change. Required when production load makes resource sharing a concern.

---

## Release Process

### Pre-Release Checklist

Before every release to production:

**Code:**
- [ ] All PRs merged to main via reviewed pull request
- [ ] No console.error or debug logging in production code
- [ ] No secrets hardcoded or in client bundles
- [ ] Smoke tests passing on the current workspace state

**Documentation:**
- [ ] CHANGELOG.md updated with release notes
- [ ] Release notes draft created in `docs/releases/v{X}.{Y}.{Z}.md`
- [ ] Version bumped in relevant package.json files

**Communication:**
- [ ] Any active design partners notified of upcoming release
- [ ] Any breaking API changes communicated with migration guidance

### Release Execution

```bash
# 1. Tag the release
git tag v0.2.0
git push origin v0.2.0

# 2. Create GitHub release
gh release create v0.2.0 \
  --repo stephenlutar2-hash/szl-holdings-platform \
  --title "v0.2.0 — [Release Title]" \
  --notes-file docs/releases/v0.2.0.md \
  --latest

# 3. Deploy via Replit
# Navigate to Replit deployment settings and deploy the latest build

# 4. Run post-deploy verification (see post-deploy-verification-final.md)
```

### Versioning Convention

SemVer: `MAJOR.MINOR.PATCH`

| Increment | When |
|---|---|
| MAJOR | Breaking architecture change; platform-wide structural shift |
| MINOR | New feature, new domain pack, new product capability |
| PATCH | Bug fix, documentation update, performance improvement |

Current version: `v0.1.0`

---

## Staging Environment (Planned)

A dedicated staging environment will be configured when:
1. First production customer is onboarded (staging is required before code reaches them)
2. CI/CD pipeline is active (staging becomes the validation gate)

Staging configuration:
- Separate Replit deployment with staging-specific secrets
- `NODE_ENV=staging`
- All production secrets with staging values
- `CORS_ORIGINS` pointing to staging domain
- GitHub Actions deploys to staging on merge to main; production deploy is manual

---

## Rollback Procedure

1. Identify the issue (P0 criteria: API health returns non-200, error rate >5%, critical feature broken)
2. Revert to previous Replit deployment version in Replit deployment settings
3. Verify health endpoints return 200
4. Run smoke test suite (see `post-deploy-verification-final.md`)
5. Create incident report and notify any affected partners

Rollback decision authority: Founder. Rollback should happen within 15 minutes of P0 identification — do not wait to diagnose before rolling back.

---

*See also: `post-deploy-verification-final.md` (smoke tests and verification), `founder-support-control-room.md` (operational visibility)*
