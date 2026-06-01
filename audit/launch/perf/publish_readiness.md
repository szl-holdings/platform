# Publish Readiness (Replit)
**Phase:** 8 + 11  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Replit Publish Requirements

| Requirement | Status | Notes |
|---|---|---|
| All workflows configured | ✅ | 15 active workflows (all confirmed RUNNING) |
| `PORT` env var used (not hardcoded) | ✅ | All artifacts use `process.env.PORT` |
| `DATABASE_URL` pointing to prod DB | ⚠️ | Must confirm separate prod DB (LB-004) |
| `NODE_ENV=production` | ⚠️ | Must set in production secrets |
| All required secrets set | ⚠️ | See secrets_register.md — 10+ must be set |
| Health endpoint live | ✅ | `GET /api/health` returns 200 |
| No hardcoded localhost in API calls | ✅ | All API calls use `BASE_URL` or relative paths |
| Proxy configuration | ✅ | Shared gateway proxy on port 9090; per-app Vite ports |
| `allowedHosts: true` in Vite configs | ✅ | Required for Replit proxy iframe |
| Build succeeds | ✅ | `pnpm build` passes |

---

## Replit Publish Steps

1. **Set production secrets** in Replit Secrets panel:
   - `DATABASE_URL` (production DB — separate from dev)
   - `SESSION_SECRET` (≥32 chars, environment-specific)
   - `SECRET_ENCRYPTION_KEY`
   - `ALLOY_INTERNAL_TOKEN`
   - `CONNECTOR_ENCRYPTION_KEY`
   - `ISSUER_URL` (will be the Replit published app URL)
   - `PUBLIC_APP_URL`
   - `CORS_ORIGINS`
   - `SENTRY_DSN`
   - `OTEL_EXPORTER_OTLP_ENDPOINT`
   - `IP_HASH_SALT`
   - `NODE_ENV=production`

2. **Run database migrations** on production DB:
   ```bash
   pnpm db:migrate
   ```

3. **Seed demo org** (first deploy only):
   ```bash
   pnpm seed:demo
   ```

4. **Click "Publish"** in Replit

5. **Run post-deploy smoke** (see `launch/release/post_deploy_smoke.md`)

6. **Verify health** in browser:
   ```
   https://your-app.replit.app/api/health
   ```

7. **Provision external monitoring** on health endpoint (LB-002)

8. **Confirm Sentry receiving errors** by triggering a test event

---

## Known Replit-Specific Considerations

| Item | Notes |
|---|---|
| Replit checkpoint | Includes code + DB snapshot — use for rollback |
| Shared PostgreSQL | Replit-managed; separate from dev only if explicitly configured |
| Replit AI proxy | AI integrations work automatically in published app |
| GitHub integration | Configured; use for PR-based deploys |
| Mobile app | Expo build requires EAS configuration; separate from Replit publish |

---

## Estimated Time to Publish

| Step | Time |
|---|---|
| Secrets configuration | 30 min |
| DB migration on prod | 10 min |
| Demo seed | 5 min |
| Click Publish | 2 min |
| Post-deploy smoke | 20 min |
| Monitoring setup | 30 min |
| **Total** | **~1.5 hours** |
