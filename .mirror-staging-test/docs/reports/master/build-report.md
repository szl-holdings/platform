# SZL Holdings — Build Report

Generated: 2026-04-02

## Build Results

| App | Status | Duration | Issues |
|-----|--------|----------|--------|
| api-server | PASS | ~3s | None |
| szl-holdings | PASS | ~20s | Chunk size warning (>500KB) |
| lyte-command-center | PASS | ~20s | vendor-react: 1,268KB, vendor-charts: 348KB |
| firestorm | PASS | ~21s | vendor-react: 1,275KB, vendor-charts: 376KB |
| terra | PASS | ~25s | vendor-react: 1,212KB, mapbox-gl: 1,703KB |
| vessels | PASS | ~26s | vendor-react: 1,235KB, mapbox-gl: 1,703KB |
| carlota-jo | PASS | ~19s | vendor-react: 1,284KB, vendor-charts: 358KB |
| stephen-site | PASS | ~17s | vendor-react: 1,275KB |

## Test Results

| Layer | Files | Tests | Status |
|-------|-------|-------|--------|
| API / Integration (Vitest) | 3 | 37 | PASS |
| Component (Vitest + Testing Library) | 4 | 33 | PASS |
| E2E Smoke (Playwright) | 7 | 35 | Configured |

## Bundle Size Issues (P1)

All web apps have vendor-react chunks exceeding 1,200KB (gzipped ~380-395KB). Apps using maps (Terra, Vessels) additionally bundle mapbox-gl at 1,703KB.

### Recommended Actions
1. Implement manual chunks in Vite config for better code splitting
2. Lazy-load heavy routes (map views, chart dashboards)
3. Consider dynamic imports for chart libraries
4. Tree-shake unused Recharts components

## Mobile Apps

Mobile apps are Expo-based and do not produce traditional builds in this environment. They run via Expo dev server. All 7 mobile dev servers configured successfully.

## Build Validation Command

```bash
pnpm build          # typecheck + build all apps
pnpm run test       # API + component tests
pnpm run test:e2e   # E2E smoke tests (requires running server)
```

## No Build Failures

Zero build failures across the entire estate. All 8 web apps and 1 API server compile cleanly.
