# Test Infrastructure Report

Generated: 2026-04-02

## Summary

| Layer | Framework | Test Files | Test Count | Status |
|-------|-----------|------------|------------|--------|
| API / Integration | Vitest + Supertest | 3 | 37 | PASS |
| Component | Vitest + Testing Library | 5 | 33 | PASS |
| E2E Smoke | Playwright | 7 | 35 | Configured |

Total: **105 tests** across 15 test files (37 API + 33 component + 35 E2E)

## API Tests (`tests/api/`)

### `health.test.ts`
Tests the `/healthz` health check endpoint.
- Returns 200 with `{ status: "ok" }` 
- Returns `application/json` content type

### `auth.test.ts`
Tests the authentication and session management routes with mocked auth middleware.
- Auth middleware mock (unauthenticated → 401, authenticated with roles → passes)
- requireRole enforcement
- Session endpoints

### `integrations.test.ts`
Tests the integrations router with mocked dependencies.
- Salesforce SOQL query endpoint
- Jira issue push endpoint
- Jira webhook endpoint
- Integration health aggregation endpoint

## Component Tests (`tests/components/`)

### `command-palette.test.tsx`
Tests the shared CommandPalette component.
- Does not render when closed
- Renders when open
- Filters commands by query
- Calls action on selection
- Closes on Escape key

### `ecosystem-nav.test.tsx`
Tests the EcosystemNav navigation component.

### `user-button.test.tsx`
Tests the UserButton authentication UI component.

### `powerbi-embed.test.tsx`
Tests the PowerBI embed wrapper (graceful degradation in test env).

### `utils.test.ts`
Tests shared utility functions: `cn`, `formatDate`, `formatCurrency`, `formatNumber`.

## E2E Smoke Tests (`tests/e2e/`)

All tests use Playwright with Chromium. Smoke tests verify:
1. App loads without fatal errors (no "Something went wrong" error boundary)
2. Page title is set
3. Main content renders (root, main element visible)
4. Navigation is present
5. Page has substantive content (>500 chars)

| App | Spec File | Tests | Path |
|-----|-----------|-------|------|
| SZL Holdings | `szl-holdings.spec.ts` | 5 | `/` |
| Aegis (Firestorm) | `aegis.spec.ts` | 5 | `/firestorm` |
| Terra | `terra.spec.ts` | 5 | `/terra` |
| Lyte Command Center | `lyte.spec.ts` | 5 | `/lyte-command-center` |
| Vessels | `vessels.spec.ts` | 5 | `/vessels` |
| Carlota Jo | `carlota-jo.spec.ts` | 5 | `/carlota-jo` |
| Stephen Site | `stephen-site.spec.ts` | 5 | `/stephen` |

## Test Configuration

### Vitest (API)
- Config: `vitest.config.ts`
- Environment: `node`
- Include: `tests/**/*.test.ts`
- Exclude: `tests/e2e/**`, `tests/components/**`

### Vitest (Components)
- Config: `vitest.components.config.ts`
- Environment: `happy-dom`
- Include: `tests/components/**/*.test.tsx`
- Setup: `tests/utils/setup-dom.ts`

### Playwright (E2E)
- Config: `playwright.config.ts`
- Browser: Chromium only (CI speed)
- Workers: 1 (sequential in CI)
- Retries: 2 in CI
- Base URL: `http://localhost:80`

## Running Tests Locally

```bash
# All tests
pnpm test

# API / integration tests only
pnpm test:api

# Component tests only
pnpm test:components

# E2E tests (requires running server)
pnpm test:e2e

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Notes

- The PowerBI embed test logs a `DOMException` about external script loading in happy-dom. This is expected behavior — the test still passes because the component handles the error gracefully.
- E2E tests require a running server. In CI they are run against the built apps served locally.
