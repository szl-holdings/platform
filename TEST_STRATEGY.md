# Test Strategy — SZL Holdings Platform

**Last updated:** 2026-04-16  
**Owner:** Engineering / QA Lead  
**Audience:** VP Engineering, Engineering Leads, QA

---

## 1. Philosophy

Testing at SZL Holdings follows three principles:

1. **Confidence over coverage** — We target critical paths exhaustively and accept lower coverage on utility code. 100% coverage is not the goal; zero regressions on critical paths is.
2. **Fast feedback loops** — Unit tests run in under 30 seconds. Integration tests in under 5 minutes. E2E in under 15 minutes.
3. **Tenant safety is non-negotiable** — Every feature that touches cross-tenant data must have an explicit isolation test.

---

## 2. Test Layers

### Layer 1: Unit Tests (`vitest.config.ts`)

**Scope:** Pure business logic, middleware, utility functions, Zod schema validation, observability helpers.

**Current files:**
- `tests/unit/api-version/` — API versioning middleware
- `tests/unit/config/` — Configuration validation
- `tests/unit/observability/` — Logger and OTEL utilities
- `tests/api/health.test.ts` — Health check endpoint
- `tests/api/auth.test.ts` — Auth middleware (mocked DB)
- `tests/api/integrations.test.ts` — Integration route contracts
- `tests/components/` — React component unit tests (command palette, nav, embeds)

**Targets:**
- API route handlers: **≥ 70% branch coverage**
- Middleware: **≥ 90% branch coverage**
- Zod schemas / validators: **≥ 95% branch coverage**
- Utility libraries: **≥ 60% coverage**

**Run command:** `pnpm test:api`  
**Duration target:** < 45 seconds

---

### Layer 2: Integration Tests (`vitest.integration.config.ts`)

**Scope:** Multi-component flows involving real DB, real GraphQL schema, real HTTP transport. External APIs mocked.

**Current files:**
- `tests/api/cortex-inca-smoke.test.ts` — CORTEX and INCA domain API flows (requires DB)
- `tests/api/cross-app-smoke.test.ts` — Cross-domain API smoke tests
- `tests/api/db-integration.test.ts` — DB schema and migration validation
- `tests/api/graphql-schema.test.ts` — GraphQL schema contract tests
- `tests/api/openapi-contract.test.ts` — OpenAPI spec contract tests
- `tests/api/server-live.test.ts` — Live server health and routing
- `tests/api/stress.test.ts` — Basic load/stress tests
- `tests/api/websocket-stress.test.ts` — WebSocket connection tests

**Targets:**
- All registered API routes return expected status codes: **100%**
- All GraphQL types resolve without errors: **100%**
- DB migration idempotency: **100%**
- Cross-domain auth isolation: **100%**

**Run command:** `pnpm test:integration`  
**Duration target:** < 5 minutes  
**Prerequisite:** Postgres and Redis running (see `docker-compose.yml`)

---

### Layer 3: E2E Browser Tests (`playwright.config.ts`)

**Scope:** Critical user journeys rendered in a real browser against the running application stack.

**Current spec files:**
- `tests/e2e/szl-holdings.spec.ts` — SZL Holdings main app
- `tests/e2e/aegis.spec.ts` — Aegis security dashboard
- `tests/e2e/carlota-jo.spec.ts` — Carlota Jo app
- `tests/e2e/command.spec.ts` — Command portal
- `tests/e2e/forge.spec.ts` — Forge runtime / Nuro Forge
- `tests/e2e/imperium.spec.ts` — Imperium
- `tests/e2e/lyte.spec.ts` — Lyte
- `tests/e2e/prism-counsel.spec.ts` — PRISM Counsel
- `tests/e2e/stephen-site.spec.ts` — Stephen site
- `tests/e2e/terra.spec.ts` — Terra
- `tests/e2e/vessels.spec.ts` — Vessels
- `tests/e2e/a11y.spec.ts` — Accessibility baseline

**Targets:**
- All artifact homepages load without errors: **100%**
- Primary navigation renders: **100%**
- No `Something went wrong` error boundaries: **100%**
- WCAG 2.1 Level AA audit passes: target **< 10 violations** (current baseline, systematic audit pending KG025)

**Run command:** `pnpm playwright test`  
**Duration target:** < 15 minutes  
**Prerequisite:** All artifact servers running, `PLAYWRIGHT_BASE_URL` set

---

### Layer 4: Component Tests (`vitest.components.config.ts`)

**Scope:** React components rendered in isolation using Vitest + jsdom.

**Current files:**
- `tests/components/command-palette.test.tsx`
- `tests/components/ecosystem-nav.test.tsx`
- `tests/components/powerbi-embed.test.tsx`
- `tests/components/user-button.test.tsx`
- `tests/components/utils.test.ts`

**Targets:**
- Shared UI components: **≥ 70% branch coverage**
- Interactive components (command palette, nav): **≥ 80% coverage**

**Run command:** `pnpm test:components`

---

## 3. Critical-Path Regression Expectations

The following paths must never regress and must be covered by automated tests before any release:

| Critical Path | Test Layer | Current Status |
|---------------|------------|----------------|
| Authentication (login / session validation) | Unit + Integration | ✅ |
| API version negotiation | Unit | ✅ (fixed 2026-04-16) |
| Health endpoint | Unit | ✅ |
| Tenant data isolation (RAG/AI) | Unit | ✅ |
| GraphQL schema validity | Integration | ✅ |
| DB migration idempotency | Integration | ✅ |
| Cross-domain auth boundary | Integration | ✅ |
| All artifact homepages load | E2E | ✅ |
| Approval routing | Integration | ⚠️ Gap — no dedicated test |
| Billing events | Integration | ❌ Gap — no tests |
| Webhook delivery | Integration | ❌ Gap — no tests |
| Role-based access enforcement | Unit | ✅ |

---

## 4. Auth / Role Coverage Targets

| Test Category | Target | Current Status |
|---------------|--------|----------------|
| Unauthenticated requests → 401 | All protected routes | ✅ Auth mock in all API tests |
| Insufficient role → 403 | All role-gated routes | ✅ |
| Cross-tenant data access → 403 | RAG, AI, DB queries | ✅ Isolation verified by unit tests |
| Admin-only endpoints | All admin routes | ⚠️ Partial — admin route tests planned |
| Service token validation (timing-safe) | Internal service routes | ✅ Resolved Apr-2026 |

---

## 5. Tenant Isolation Tests

Tenant isolation must be validated at every layer where data is retrieved or mutated:

| Layer | Isolation Mechanism | Test Coverage |
|-------|---------------------|---------------|
| RAG / AI retrieval (`alloy-retrieval.ts`) | `tenantId` parameter enforced | ✅ Unit test verifies scoping |
| Database queries (Drizzle ORM) | `tenant_id` column + WHERE clauses | ✅ DB integration tests |
| GraphQL resolvers | Tenant context from session | ⚠️ Partial |
| REST API routes | Auth middleware extracts tenant | ✅ |
| Object storage | Tenant-prefixed paths | ⚠️ Needs dedicated test |

---

## 6. Release-Blocking Test Suite

The following tests **must pass** before any release is tagged:

1. `pnpm test` (all unit + component tests) — **0 failures**
2. `pnpm test:integration` (all integration tests) — **0 failures**
3. `pnpm playwright test` (all E2E specs) — **0 failures** (or known flaky tests tagged `@skip`)
4. `pnpm run lint` — **0 errors** (warnings tolerated, documented)
5. `pnpm run readiness:gate` — passes all gates

---

## 7. Flaky Test Policy

- Flaky tests must be tagged with `// @flaky: <reason>` and tracked in REGRESSION_RISK_REGISTER.md
- A test that fails more than 2 times consecutively in CI without a code change is considered broken, not flaky, and must be fixed before merge
- Flaky tests do not block release if they are tagged and tracked

---

## 8. Testing Gaps (as of April 2026)

| Gap ID | Description | Priority | Plan |
|--------|-------------|----------|------|
| TG-001 | No tests for billing event flows | P1 | Sprint 3 |
| TG-002 | No tests for webhook delivery | P1 | Sprint 3 |
| TG-003 | Admin-only route tests incomplete | P1 | Sprint 3 |
| TG-004 | Approval escalation not tested | P1 | Sprint 3 |
| TG-005 | Object storage tenant isolation not tested | P2 | Sprint 4 |
| TG-006 | GraphQL resolver tenant scoping partial | P2 | Sprint 4 |
| TG-007 | Mobile E2E tests absent (Expo) | P2 | Sprint 4 |
| TG-008 | Systematic WCAG accessibility testing absent (KG025) | P2 | Sprint 4 |

---

*See also: SMOKE_TEST_PLAN.md, REGRESSION_RISK_REGISTER.md, QA_SIGNOFF_CHECKLIST.md*
