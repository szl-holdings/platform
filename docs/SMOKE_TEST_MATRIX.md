# Smoke Test Matrix — SZL Holdings Platform

**Version:** 1.0  
**Date:** April 16, 2026  
**Script:** `scripts/qa/smoke-routes.js`  
**Usage:** `BASE_URL=https://szlholdings.com node scripts/qa/smoke-routes.js`

This matrix documents every public-facing route across all platform apps and the expected smoke test response. "Smoke test" means: the route responds without a 5xx error. 401/403 (auth-gated) and 404 on unrecognized params are acceptable. Only 5xx and connection failures are regressions.

---

## 1. API Routes (`/api/*`)

All API routes discovered from `artifacts/api-server/src/routes/index.ts` via `router.use()` scanning.

| Route Prefix | Auth Required | Expected Smoke Result | Notes |
|-------------|--------------|----------------------|-------|
| `/api/health` | ❌ Public | `200` | Primary health check |
| `/api/healthz` | ❌ Public | `200` | Alias for health |
| `/api/health/live` | ❌ Public | `200` | Liveness probe |
| `/api/health/ready` | ❌ Public | `200` | Readiness probe (DB check) |
| `/api/health/detailed` | ❌ Public | `200` | Detailed system status |
| `/api/health/ai` | ❌ Public | `200` | AI provider connectivity |
| `/api/health/integrations` | ❌ Public | `200` | Third-party integration status |
| `/api/health/external-feeds` | ❌ Public | `200` | External data feed status |
| `/api/auth/*` | ❌ Public (auth flow) | `200` or `302` | OIDC flow endpoints |
| `/api/contact` | ❌ Public | `200` or `405` | Contact form |
| `/api/demo` | ❌ Public | `200` or `405` | Demo request |
| `/api/status` | ❌ Public | `200` | Public platform status |
| `/api/webhooks/*` | ❌ Public (signed) | `200` | Webhook receivers (Stripe, etc.) |
| `/api/users` | ✅ Auth required | `401` acceptable | User management |
| `/api/orgs` | ✅ Auth required | `401` acceptable | Organization management |
| `/api/aegis/*` | ✅ Auth required | `401` acceptable | Aegis security APIs |
| `/api/terra/*` | ✅ Auth required | `401` acceptable | Terra real estate APIs |
| `/api/vessels/*` | ✅ Auth required | `401` acceptable | Vessels maritime APIs |
| `/api/lyte/*` | ✅ Auth required | `401` acceptable | Lyte business APIs |
| `/api/forge/*` | ✅ Auth required | `401` acceptable | Forge deal management APIs |
| `/api/prism/*` | ✅ Auth required | `401` acceptable | PRISM legal APIs |
| `/api/command/*` | ✅ Auth required | `401` acceptable | Command portal APIs |
| `/api/cortex/*` | ✅ Auth required | `401` acceptable | CORTEX AI APIs |
| `/api/admin/*` | ✅ Admin role | `401`/`403` acceptable | Admin-only endpoints |
| `/api/graphql` | ✅ Auth required | `401` acceptable | GraphQL API |

---

## 2. Web App Routes

### 2.1 SZL Holdings Dashboard (`/`)

| Route | Expected | Notes |
|-------|---------|-------|
| `/` | `200` | Dashboard home / login redirect |
| `/platform` | `200` | Platform overview |
| `/lyte` | `200` | Lyte module |
| `/solutions` | `200` | Solutions page |
| `/contact` | `200` | Contact page |
| `/trust-center` | `200` | Trust and security page |
| `/legal/privacy` | `200` | Privacy policy |
| `/legal/terms` | `200` | Terms of service |

### 2.2 Aegis / Firestorm (`/aegis/` or `/firestorm/`)

| Route | Expected | Notes |
|-------|---------|-------|
| `/` | `200` | Aegis home |
| `/threats` | `200` | Threat intelligence |
| `/vulnerabilities` | `200` | Vulnerability management |
| `/network` | `200` | Network security |
| `/compliance` | `200` | Compliance modules |
| `/incidents` | `200` | Incident response |

### 2.3 Terra (`/terra/`)

| Route | Expected | Notes |
|-------|---------|-------|
| `/` | `200` | Terra home |
| `/properties` | `200` | Property intelligence |
| `/portfolio` | `200` | Portfolio view |
| `/market` | `200` | Market analysis |
| `/valuation` | `200` | Valuation tools |

### 2.4 Vessels (`/vessels/`)

| Route | Expected | Notes |
|-------|---------|-------|
| `/` | `200` | Vessels home |
| `/fleet` | `200` | Fleet management |
| `/tracking` | `200` | Vessel tracking |
| `/intelligence` | `200` | Maritime intelligence |
| `/ports` | `200` | Port analysis |

### 2.5 Command Portal (`/command/`)

| Route | Expected | Notes |
|-------|---------|-------|
| `/` | `200` | Command overview |
| `/operations` | `200` | Operations center |
| `/analytics` | `200` | Analytics dashboard |

### 2.6 Carlota Jo (`/carlota-jo/`)

| Route | Expected | Notes |
|-------|---------|-------|
| `/` | `200` | Consulting home |
| `/services` | `200` | Services page |
| `/about` | `200` | About page |
| `/contact` | `200` | Contact page |

### 2.7 Stephen Site (`/stephen-site/`)

| Route | Expected | Notes |
|-------|---------|-------|
| `/` | `200` | Portfolio home |
| `/projects` | `200` | Projects |
| `/about` | `200` | About |
| `/contact` | `200` | Contact |

---

## 3. Health Check Endpoints (All Apps)

Every deployable artifact must have a health check endpoint. This matrix documents the current state.

| Artifact | Health Endpoint | Method | Expected | Status |
|----------|----------------|--------|---------|--------|
| `artifacts/api-server` | `/api/health` | GET | `200` + JSON | ✅ Implemented |
| `artifacts/api-server` | `/api/healthz` | GET | `200` | ✅ Implemented |
| `artifacts/api-server` | `/api/health/live` | GET | `200` | ✅ Implemented |
| `artifacts/api-server` | `/api/health/ready` | GET | `200` | ✅ Implemented |
| `artifacts/szl-holdings` | `/` loads without error | Page | `200` HTML | ✅ Via E2E |
| `artifacts/aegis` | `/` loads without error | Page | `200` HTML | ✅ Via E2E |
| `artifacts/terra` | `/` loads without error | Page | `200` HTML | ✅ Via E2E |
| `artifacts/vessels` | `/` loads without error | Page | `200` HTML | ✅ Via E2E |
| `artifacts/command` | `/` loads without error | Page | `200` HTML | ✅ Via E2E |
| `artifacts/carlota-jo` | `/` loads without error | Page | `200` HTML | ✅ Via E2E |
| `artifacts/stephen-site` | `/` loads without error | Page | `200` HTML | ✅ Via E2E |
| `artifacts/firestorm` | `/` loads without error | Page | `200` HTML | ✅ Via E2E |
| `artifacts/prism-counsel` | `/` loads without error | Page | `200` HTML | ✅ Via E2E |

**Note:** Frontend SPA artifacts do not have dedicated `/health` API endpoints — their health is validated via the E2E suite's first navigation step. Consider adding a simple `/health.json` static file to each frontend artifact as a future improvement.

---

## 4. Smoke Test Execution

### Running Smoke Tests

```bash
# Full smoke test (API + web routes)
BASE_URL=http://localhost:3000 node scripts/qa/smoke-routes.js

# API routes only
BASE_URL=http://localhost:3000 node scripts/qa/smoke-routes.js --api-only

# Web routes only
BASE_URL=http://localhost:3000 node scripts/qa/smoke-routes.js --web-only

# JSON output for CI parsing
BASE_URL=http://localhost:3000 node scripts/qa/smoke-routes.js --json
```

### Pass/Fail Criteria

| Response | Assessment |
|----------|-----------|
| `2xx` | ✅ Pass |
| `3xx` | ✅ Pass (redirect is expected behavior) |
| `401` / `403` | ✅ Pass (auth-gated endpoint working) |
| `404` on known static routes | ⚠️ Investigate — route may have moved |
| `405` on GET to POST-only endpoints | ✅ Pass |
| `5xx` | ❌ Fail — regression |
| Connection refused / timeout | ❌ Fail — service down |

---

## 5. a11y Checks on Critical Public Routes

The following routes have automated accessibility checks running on every CI push/PR:

| App | Route | Priority | Tool | CI Status |
|-----|-------|---------|------|-----------|
| SZL Holdings | `/` | HIGH | axe-core + Playwright | ✅ Running — `tests/e2e/a11y.spec.ts` |
| SZL Holdings | `/about` | HIGH | axe-core + Playwright | ✅ Running |
| SZL Holdings | `/contact` | HIGH | axe-core + Playwright | ✅ Running |
| SZL Holdings | `/trust-center` | MEDIUM | axe-core + Playwright | ✅ Running |
| SZL Holdings | `/ecosystem` | MEDIUM | axe-core + Playwright | ✅ Running |
| Carlota Jo | `/` | HIGH | axe-core + Playwright | ⚠️ Backlog (Task #912) |
| Carlota Jo | `/contact` | HIGH | axe-core + Playwright | ⚠️ Backlog (Task #912) |
| Stephen Site | `/` | HIGH | axe-core + Playwright | ⚠️ Backlog (Task #912) |
| All apps | `/legal/privacy` | MEDIUM | axe-core + Playwright | ⚠️ Backlog (Task #912) |
| All apps | `/legal/terms` | MEDIUM | axe-core + Playwright | ⚠️ Backlog (Task #912) |

**Current state:** `@axe-core/playwright` integrated into CI. `tests/e2e/a11y.spec.ts` covers all 5 SZL Holdings critical public routes with WCAG 2.0/2.1 A/AA checks. The `a11y` job in `e2e.yml` blocks the E2E gate on any critical violation. Other apps are tracked in Task #912. HTML-level checks also remain active in `scripts/qa/check-a11y.js`.

---

*Last updated: April 16, 2026. Update this matrix whenever new apps or routes are added to the platform.*
