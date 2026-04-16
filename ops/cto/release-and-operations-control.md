# Release & Operations Control

**Owner:** CTO / Founder
**Last updated:** April 2026
**Version:** 1.0

---

## Purpose

This document locks the environment story, defines deployment expectations for every workload, and establishes the release promotion flow for SZL Holdings. It is the single source of truth for: where things run, how they move from dev to production, and what gates must pass at each stage.

---

## 1. Environment Story

Four environments exist. Each has a clear boundary and a defined promotion path.

```
Local Dev  →  Replit Workspace (Preview)  →  Staging Deployment  →  Production Deployment
```

### Local Dev

| Attribute | Detail |
|-----------|--------|
| Purpose | Individual feature work, debugging, rapid iteration |
| Database | Local PostgreSQL or Replit DB (shared with workspace) |
| Secrets | `.env` file or Replit Secrets panel (shared workspace secrets) |
| URL | `localhost:PORT` or `$REPLIT_DEV_DOMAIN/PATH` |
| Stability target | None — ephemeral, can break |
| Who uses it | Engineer / founder only |

**Rules:**
- Never push secrets to source control.
- Run `pnpm --filter @szl-holdings/db run push` to sync schema changes before testing.
- All code changes require a passing local build (`pnpm build`) before promotion.

---

### Replit Workspace (Preview)

| Attribute | Detail |
|-----------|--------|
| Purpose | Integration testing, stakeholder demos, pre-staging verification |
| Database | Replit-provisioned PostgreSQL (shared dev database) |
| Secrets | Replit Secrets panel |
| URL | `https://$REPLIT_DEV_DOMAIN/PATH` |
| Stability target | Best-effort — may have in-progress features |
| Who uses it | Founder, invited stakeholders for demos |

**Rules:**
- The workspace is the integration environment. Features land here before staging.
- Demo seed data must be loaded before any stakeholder walkthrough (`pnpm seed:demo`).
- No production secrets are ever set in workspace secrets.

---

### Staging Deployment

| Attribute | Detail |
|-----------|--------|
| Purpose | Pre-production validation, final smoke tests before prod promote |
| Database | Dedicated staging PostgreSQL instance (separate from dev and prod) |
| Secrets | Replit deployment environment variables (staging values) |
| URL | `https://staging.szlholdings.com` (or equivalent staging domain) |
| Stability target | High — mirrors production config, no in-progress work |
| Who uses it | Founder for release sign-off |

**Key environment variables for staging:**
```
NODE_ENV=staging
DATABASE_URL=<staging-db-url>
SESSION_SECRET=<staging-specific-value>
ALLOY_INTERNAL_TOKEN=<staging-specific-value>
FIELD_ENCRYPTION_KEY=<staging-specific-value>
CORS_ORIGINS=https://staging.szlholdings.com
```

**Rules:**
- Staging must match production configuration exactly except for data.
- All smoke tests in `ops/cto/post-deploy-verification.md` must pass before production promotion.
- No hot-fixes go directly to production without first passing staging verification.

---

### Production Deployment

| Attribute | Detail |
|-----------|--------|
| Purpose | Live customer-facing system |
| Database | Dedicated production PostgreSQL instance |
| Secrets | Replit deployment environment variables (production values) |
| URL | `https://szlholdings.com`, `https://app.szlholdings.com` |
| Stability target | Maximum — zero-tolerance for avoidable breakage |
| Who uses it | All users, customers, investors |

**Key environment variables for production:**
```
NODE_ENV=production
DATABASE_URL=<production-db-url>
SESSION_SECRET=<production-value-rotated-quarterly>
ALLOY_INTERNAL_TOKEN=<production-value>
FIELD_ENCRYPTION_KEY=<production-value-rotated-quarterly>
CONNECTOR_ENCRYPTION_KEY=<production-value>
CORS_ORIGINS=https://szlholdings.com,https://app.szlholdings.com
OPENAI_API_KEY=<production-key>
ANTHROPIC_API_KEY=<production-key>
STRIPE_SECRET_KEY=sk_live_*
```

**Rules:**
- Only promoted, staged builds go to production.
- All secrets are unique production values — never shared with staging or dev.
- `FIELD_ENCRYPTION_KEY` and `SESSION_SECRET` rotate quarterly (calendar reminders required).
- Zero secrets in code or client bundles. Run `grep -r "sk-\|sk_live" dist/` before every deploy.

---

## 2. Workload Deployment Expectations

Every workload has a designated deployment type. Choosing the wrong type wastes money or causes reliability issues.

| Workload | Artifact | Deployment Type | Rationale |
|----------|----------|----------------|-----------|
| `api-server` | `artifacts/api-server` | **Reserved VM** | Always-on, WebSocket connections, background job processing, scheduled jobs, GraphQL subscriptions — cannot tolerate cold starts |
| `szl-holdings` (web) | `artifacts/szl-holdings` | **Autoscale** | Stateless React SPA, scales to zero when idle, handles traffic bursts |
| `firestorm` / Aegis | `artifacts/firestorm` | **Autoscale** | Stateless web app |
| `terra` | `artifacts/terra` | **Autoscale** | Stateless web app |
| `vessels` | `artifacts/vessels` | **Autoscale** | Stateless web app |
| `carlota-jo` | `artifacts/carlota-jo` | **Autoscale** | Stateless web app |
| `command` | `artifacts/command` | **Autoscale** | Stateless web app |
| `prism-counsel` | `artifacts/prism-counsel` | **Autoscale** | Stateless web app |
| `stephen-site` | `artifacts/stephen-site` | **Static** | Marketing/personal site — no server needed, served from CDN |
| `szl-holdings-mobile` (Expo) | `artifacts/szl-holdings-mobile` | **EAS Build** | Mobile app — built via Expo Application Services, distributed via app stores; no Replit deployment |
| CORTEX mobile | (future artifact) | **EAS Build** | Same as above |

### Reserved VM Build & Run (api-server)

```bash
# Build
pnpm --filter @workspace/api-server run build

# Run
NODE_ENV=production PORT=8080 node dist/index.mjs

# Health check endpoint
GET /api/health/live   → 200 {"status":"ok"}
GET /api/health/ready  → 200 {"status":"ready"} (requires DB)
```

### Autoscale Build & Serve (web apps)

```bash
# Build (example: szl-holdings)
pnpm --filter @workspace/szl-holdings run build

# Output: dist/ directory served as static files
# Health check: HTTP 200 on /
```

### Static Site (stephen-site)

```bash
# Build
pnpm --filter @workspace/stephen-site run build

# Output: dist/ — deploy as static hosting, no server process
```

---

## 3. Release Promotion Flow

Releases move left to right through the environment chain. Each transition requires a gate.

```
Feature Branch  →  Merge to main  →  Workspace auto-deploys  →  Staging gate  →  Prod promote
```

### Stage 1 — Feature Branch (Dev)

**Entry:** New work begins here.

**Gate to merge:**
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds for all affected artifacts
- [ ] `pnpm test` passes (unit + API tests)
- [ ] `pnpm audit --audit-level high` — zero high/critical vulnerabilities
- [ ] No secrets in committed code (`pnpm run secret-scan` or manual grep)
- [ ] Self-code review: no TODO/FIXME left in touched files

**Action:** Merge pull request to `main` (or direct push for solo operation).

---

### Stage 2 — Replit Workspace (Integration)

**Entry:** Code merged to `main`. Workspace reflects latest state.

**Gate to promote to staging:**
- [ ] All workflows start without errors
- [ ] API health: `GET /api/health/live` → 200
- [ ] Homepage loads without console errors
- [ ] Auth flow: login → dashboard → logout works end-to-end
- [ ] Feature under development manually verified by founder
- [ ] Demo seed data verified if a stakeholder demo is planned

**Action:** Trigger staging deployment from Replit deployment dashboard or CI.

---

### Stage 3 — Staging Deployment

**Entry:** Workspace integration verified. Staging deployment triggered.

**Gate to promote to production:**
- [ ] All automated smoke tests pass (see `ops/cto/post-deploy-verification.md`)
- [ ] API health + readiness endpoints return 200
- [ ] Database migrations applied without errors
- [ ] Auth flow verified with staging test accounts
- [ ] At least one operator flow verified end-to-end
- [ ] No regressions on critical paths vs. previous release
- [ ] Deployment build is pinned (commit SHA recorded)
- [ ] Founder sign-off: explicit go/no-go decision

**Action:** Promote to production via Replit deployment dashboard ("Promote to Production" or equivalent). Record the commit SHA and promotion timestamp.

---

### Stage 4 — Production Deployment

**Entry:** Staging gate passed. Founder signed off.

**Post-deploy verification (first 30 minutes):**
- [ ] Run full post-deploy smoke test suite (see `ops/cto/post-deploy-verification.md`)
- [ ] Monitor error rate for 10 minutes — must stay below 2%
- [ ] Check API health every 2 minutes for the first 10 minutes
- [ ] Verify at least one real user action succeeds (if users present)
- [ ] Check Slack alerts channel — no unexpected alerts firing

**Rollback criteria:**
- API health returns non-200 for more than 2 minutes
- Error rate exceeds 5% within 10 minutes of deploy
- Any P0 alert fires within 30 minutes
- Any critical user-facing feature is visibly broken

**Rollback action:** Revert to previous deployment via Replit deployment dashboard. Takes approximately 2–5 minutes.

---

## 4. Release Cadence

| Type | Frequency | Staging Required | Notes |
|------|-----------|-----------------|-------|
| Hotfix (SEV-1) | As needed | **Emergency bypass permitted** | See SEV-1 hotfix path below |
| Patch release | As needed | Yes | Standard promotion flow required |
| Minor release | Weekly or bi-weekly | Yes | Full promotion flow + stakeholder notification |
| Major release | Quarterly | Yes | Full go-live sequence from `docs/internal/ops/go-live-sequence.md` |

### SEV-1 Hotfix Emergency Path

Staging is mandatory for all releases **except** declared SEV-1 incidents where customer impact is active and continuous staging promotion would extend downtime. The conditions for bypassing staging are:

**All of the following must be true:**
1. A SEV-1 incident is declared and active (customer impact confirmed).
2. The fix addresses a known, root-cause-confirmed failure (not exploratory).
3. The fix is minimal in scope — a targeted change, not a broad refactor.
4. The founder explicitly declares the bypass in the incident log.

**Controls that replace staging verification when bypassing:**
- Deploy to a canary (single instance if autoscale) first, wait 5 minutes, watch error rate.
- Run API health and auth smoke tests manually from `ops/cto/post-deploy-verification.md` within 5 minutes of production deploy.
- If smoke tests fail: rollback immediately without delay.
- File a post-incident review within 5 business days.

**Default rule:** When in doubt, staging is required. Bypassing staging for non-SEV-1 reasons is not permitted.

---

## 5. Version Tracking

Each production release must record:

```
Release: v{MAJOR}.{MINOR}.{PATCH}
Date: YYYY-MM-DD HH:MM UTC
Commit SHA: <full SHA>
Deployed by: <founder or engineer>
Staging verified: yes/no
Known issues: <none or description>
Rollback SHA: <previous release SHA>
```

Maintain a running `ops/cto/release-log.md` once release cadence is established.

---

*See also: [Post-Deploy Verification](./post-deploy-verification.md) · [Incident & Support Playbook](./incident-and-support-playbook.md) · [Founder Control Room](./founder-control-room.md) · [Deployment Decision Matrix](../replit/deployment-decision.md)*
