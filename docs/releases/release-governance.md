# Release Governance

**Owner:** Engineering (Founder)  
**Last updated:** April 2026  
**Version:** 1.0

---

## Purpose

This document defines the release discipline for all SZL Holdings platform artifacts. It covers CI gate requirements, branch strategy, preview environments, deployment matrix, and rollback procedures.

---

## CI Gates

Every commit to the main branch and every pull request must pass the following automated checks before merge and before deployment.

### Required Gates

| Gate | Command | Failure Policy |
|------|---------|---------------|
| TypeScript typecheck | `pnpm -r typecheck` | Block — no merge without passing |
| Lint | `pnpm -r lint` | Block — no merge without passing |
| Dependency audit | `pnpm audit --audit-level high` | Block on high/critical — medium tracked |
| Secret scan | `grep -rE "(api_key|secret|password|token)\s*=\s*['\"][^'\"]{8,}" --include="*.ts" --include="*.tsx" --include="*.js"` | Block — no secrets in source |
| Build validation | `pnpm -r build` | Block — all artifacts must build cleanly |
| Schema validation | `pnpm --filter db generate` (dry run) | Block on schema conflicts |

### Recommended Additional Gates (not yet automated)

| Gate | Tool | Status |
|------|------|--------|
| Unit tests | Vitest | Pending — test suite expansion planned |
| Integration tests | Playwright / Supertest | Pending — pre-commercial milestone |
| SAST scan | CodeQL or Semgrep | Recommended before SOC 2 |

---

## Branch Strategy

### Branching Model

```
main
 ├── feature/<short-description>    # Feature development
 ├── fix/<short-description>         # Bug fixes
 ├── chore/<short-description>       # Non-functional changes
 └── release/<version>               # Release preparation (optional)
```

### Rules

- `main` is the single source of truth and is always deployable
- Feature branches are short-lived: opened, reviewed, and merged within days, not weeks
- Direct pushes to `main` are permitted for solo/founder development at current stage
- When the team scales beyond 2 engineers: all changes via pull request with at least 1 review required
- Branch protection on `main`: enforce required status checks before merge (configure in GitHub settings)

### Commit Conventions

Use conventional commit format for automated changelog generation:

```
feat(lyte): add anomaly detection widget
fix(api): resolve WebSocket reconnect race condition
chore(deps): bump pnpm to 9.x
docs(ops): add incident response runbook
```

---

## Preview Environments

| Environment | URL Pattern | Purpose | Deploy Trigger |
|-------------|-------------|---------|----------------|
| Development | `*.replit.dev` (Replit workspace) | Active development | Automatic on workflow start |
| Preview | Replit deployment (non-prod) | Stakeholder review, QA | Manual deployment |
| Production | Replit deployment (production) | Live product | Manual — tagged release only |

**Preview environment policy:**
- Stakeholder demos should use the preview environment, not the development workspace
- Preview environments share no data with production
- Preview deployments are appropriate for investor and client demos

---

## Deployment Matrix

| Artifact | Kind | Tech Stack | Deploy Command | Notes |
|----------|------|-----------|----------------|-------|
| API Server | API | Node.js / Express / TypeScript | `pnpm --filter api-server build` | Requires DATABASE_URL and all env secrets |
| SZL Holdings (homepage) | Web | React / Vite | `pnpm --filter szl-holdings build` | Static, no backend dependency |
| Aegis | Web | React / Vite | `pnpm --filter aegis build` | Requires API_URL env |
| Terra | Web | React / Vite | `pnpm --filter terra build` | Requires API_URL env |
| Vessels | Web | React / Vite | `pnpm --filter vessels build` | Requires API_URL env |
| Carlota Jo | Web | React / Vite | `pnpm --filter carlota-jo build` | Requires API_URL env |
| Command | Web | React / Vite | `pnpm --filter command build` | Requires API_URL env |
| Lyte Mobile | Expo | React Native | `pnpm --filter lyte-mobile build` | EAS build for store submission |
| Aegis Mobile | Expo | React Native | `pnpm --filter aegis-mobile build` | EAS build |
| Vessels Mobile | Expo | React Native | `pnpm --filter vessels-mobile build` | EAS build |
| Terra Mobile | Expo | React Native | `pnpm --filter terra-mobile build` | EAS build |
| SZL Holdings Mobile | Expo | React Native | `pnpm --filter szl-holdings-mobile build` | EAS build |
| Stephen Mobile | Expo | React Native | `pnpm --filter stephen-mobile build` | EAS build |
| Carlota Jo Mobile | Expo | React Native | `pnpm --filter carlota-jo-mobile build` | EAS build |

### Environment Variable Requirements

All production deployments require these secrets to be configured:

| Variable | Required By | Source |
|----------|-------------|--------|
| `DATABASE_URL` | API Server | Replit PostgreSQL |
| `PORT` | API Server | Replit (auto-injected) |
| `SESSION_SECRET` | API Server | Generated secret |
| `CORS_ORIGINS` | API Server | Deployment domain list |
| `ALLOY_INTERNAL_TOKEN` | API Server | Generated secret |
| `OPENAI_API_KEY` | API Server | OpenAI |
| `ANTHROPIC_API_KEY` | API Server | Anthropic |
| `STRIPE_SECRET_KEY` | API Server | Stripe |
| `STRIPE_WEBHOOK_SECRET` | API Server | Stripe dashboard |
| `SLACK_WEBHOOK_URL` | API Server (optional) | Slack app config |
| `EXPO_PUBLIC_API_URL` | All Expo apps | API deployment URL |

---

## Smoke Tests

Before marking any production deployment successful, verify:

- [ ] `GET /api/health/live` → `{"status":"ok"}` (200)
- [ ] `GET /api/health/ready` → `{"status":"ready"}` (200)
- [ ] `GET /api/health/detailed` (with internal token) → all checks passing
- [ ] `/api/docs` loads Swagger UI without error
- [ ] Authentication flow completes: login, session cookie set, `/api/auth/me` returns user
- [ ] At least one domain endpoint responds: e.g., `GET /api/lyte/signals`
- [ ] WebSocket connection establishes and heartbeat ping/pong completes

---

## Migration Gates

Database migrations must be applied before application deployment in any environment:

1. Run `pnpm --filter db generate` to produce migration files
2. Review generated SQL — confirm no destructive changes without explicit approval
3. Back up database before applying to production: `pg_dump $DATABASE_URL > pre-migration-backup.sql`
4. Apply: `pnpm --filter db push` (or `pnpm --filter db migrate` for managed migrations)
5. Verify schema: spot-check critical tables
6. Only then deploy new application version

**Destructive migration policy:** Migrations that drop columns, drop tables, or alter column types require:
- Explicit written approval from founder
- A tested rollback script
- A maintenance window notification if any users are active

---

## Rollback Procedures

### API Server Rollback

1. Go to Replit deployment dashboard
2. Select previous successful deployment
3. Click "Roll back to this version"
4. Verify smoke tests pass

If database migrations were applied:
1. Stop the new deployment
2. Run the rollback SQL: `psql $DATABASE_URL < pre-migration-backup.sql` (if needed)
3. Redeploy previous version

### Web App Rollback

Same procedure via Replit deployment dashboard. Web apps are stateless — rollback is instantaneous.

### Mobile App Rollback

- iOS: Submit a previous build via App Store Connect → "Add version" with previous binary
- Android: Roll back via Google Play Console → Production → Releases → Rollback
- Expo OTA updates: Use `eas update:rollback` to revert an OTA update channel
- Emergency: Use `expo-updates` channel management to pin users to a known-good release

### Emergency Procedures

If rollback via dashboard is unavailable:
1. Force-restart workflow with previous code via git: `git revert HEAD --no-edit && git push`
2. Redeploy from reverted state
3. Document the emergency rollback in the incident log

---

*See also: [Release Checklist](release-checklist.md) · [Incident Response Runbook](../internal/ops/incident-response-runbook.md) · [Deployment](../deployment.md)*
