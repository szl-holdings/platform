# SZL Holdings — Risks & Gaps Assessment

Generated: 2026-04-15

## P0 — Critical (must fix before any deployment)

### 1. Insecure Dev Fallbacks in Production Code
- `artifacts/api-server/src/middlewares/field-encryption.ts` uses a hardcoded dev fallback key when `FIELD_ENCRYPTION_KEY` is missing — data encrypted with this key is trivially decryptable
- `artifacts/api-server/src/routes/rmm.ts` falls back to `"rmm-dev-only-key"` if `DATABASE_URL` missing
- `docker-compose.yml` uses `SESSION_SECRET:-local_dev_secret_change_in_prod` — fine for docker-compose but pattern should not propagate
- **Fix**: Replace dev fallbacks with hard errors in production (`NODE_ENV === 'production'` guard)

### 2. Test Token in Source
- `tests/api/server-live.test.ts` hardcodes `szl-test-integration-live-2026` as an internal token
- **Fix**: Move to env var or generate at test time

### 3. Zombie Directories Create Confusion
- 11 empty artifact dirs (aegis-mobile, alloy-mobile, etc.) with no code
- 3 zombie lib dirs (integrations-*) already consolidated into ai-engine
- **Fix**: Delete all 14 directories

## P1 — High Priority

### 4. Duplicate/Overlapping Apps
- `firestorm` and `aegis` serve the same app from different paths
- `lyte-command-center` was merged into `command` but still runs separately
- `prism-counsel` and `stephen-site` were deprecated (task #579) but re-registered (task #670)
- **Fix**: Establish canonical topology and deregister duplicates

### 5. No Production Secret Rotation Documentation
- No inventory of which secrets exist, which are rotatable, expiration dates
- ALLOY_INTERNAL_TOKEN appears to be a static string
- **Fix**: Create secret inventory and rotation schedule

### 6. Missing Environment Separation
- No clear staging vs production secret partitioning
- deploy-staging.yml and deploy-production.yml reference secrets that may not exist
- **Fix**: Create environment matrix with exact secret names per env

### 7. VITE_ Prefix Audit Needed
- Need to verify no secrets leak via `VITE_*` env vars to client bundles
- Some apps may expose API endpoints or keys through Vite public env

## P2 — Medium Priority

### 8. Documentation Sprawl
- 28 root-level .md files create navigation confusion
- Multiple overlapping docs (INCIDENT_RESPONSE.md at root AND infra/runbooks/)
- ENV_MATRIX.md, DEPLOYMENT_READINESS.md, RELEASE_CHECKLIST.md may conflict
- **Fix**: Consolidate into /ops/ with canonical doc map

### 9. No OpenTelemetry in Production
- observability lib exists but no OTEL exporter configured for production
- No APM/tracing sink documented
- **Fix**: Document OTEL plan and production telemetry target

### 10. Mobile Store Readiness Unknown
- EAS configuration may not be complete
- No TestFlight/Play Console submission runbook
- Privacy manifest status unknown for iOS
- **Fix**: Full mobile release readiness audit

### 11. SEO/Analytics Partial
- ANALYTICS_PLAN.md exists but unclear if implemented
- SEO_MAP.md exists but sitemap.xml generation unclear
- Social cards may be incomplete
- **Fix**: Verify implementation matches docs

## P3 — Low Priority / Polish

### 12. Design System Inconsistency
- Multiple nav components per app (SiteNav vs Navbar, SiteFooter vs Footer)
- Inline styles mixed with Tailwind classes
- **Fix**: Gradual consolidation (tracked separately)

### 13. Docker/Azure Artifacts May Be Stale
- docker-compose.yml, main.bicep, container-publish.yml reference an Azure/Docker path that may not reflect current Replit deployment
- **Fix**: Archive or update

### 14. Incomplete Test Coverage
- 161 integration tests, 69 API tests, but no E2E tests confirmed passing
- Coverage for mobile apps unknown
- **Fix**: Expand test suite incrementally
