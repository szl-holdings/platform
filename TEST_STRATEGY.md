# Test Strategy — SZL Holdings Platform

**Last updated:** 2026-04-18  
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
| Policy evaluation enforcement (all 5 modes) | Domain Unit | ✅ (2026-04-18) |
| Action-engine policyEvaluation contract | Domain Unit | ✅ (2026-04-18) |
| Run trace E2E waterfall + replay | Domain Unit | ✅ (2026-04-18) |
| Connector normalization (all 9 adapters) | Domain Unit | ✅ (2026-04-18) |
| Telemetry event coverage (8 event categories) | Domain Unit | ✅ (2026-04-18) |
| Proof-chain static check (executeWorkflow gate) | Static / CI | ✅ (2026-04-18) |

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

## 9. CI Hardening — Domain Logic & Proof-Chain Checks (Added 2026-04-18)

This section documents the domain-logic test suites and static analysis gate added as part of CI hardening task #1810.

### 9.1 Domain-Logic Test Suites

| Suite | File | Tests | What It Covers |
|-------|------|-------|----------------|
| Policy Engine | `packages/policy-engine/src/policy-engine.test.ts` | 37 | All 5 governance modes (observe, recommend, draft, approval-required, auto-within-guardrails), scope matching, confidence thresholds, effects, and blockedReason |
| Action Engine | `packages/action-engine/src/action-engine.test.ts` | 24 | policyEvaluation enforcement contract (including Zod schema validation — empty {} and partial objects rejected), happy-path lifecycle, approval gate, rollback handling, dry-run/simulation bypass |
| Run Trace E2E | `packages/trace-graph/src/run-trace-e2e.test.ts` | 28 | Full waterfall session (start → spans → tool calls → complete), TraceReplayer visitor pattern, span parentage tree, regression detection via compareTraces |
| Connector Normalization | `packages/connectors/src/connector-normalization.test.ts` | 65 | All 9 demo adapters (AIS, Reuters, Alpaca, CourtListener, PropertyRadar, LinkedIn, HubSpot, Salesforce, Stripe) — schema validation and field normalization |
| Telemetry Coverage | `packages/telemetry-standards/src/telemetry-coverage.test.ts` | 65 | 8 telemetry surface sections + Section 14: contract-shape validation (GenAIModelCallContract, AgentRunContract, GenAIToolCallContract, GenAIAgentStepContract, GenAIRetrievalContract, AgentPolicyGateContract, AgentHandoffContract) + dot-notation naming enforcement + 10 runtime atlasEventBus span validation tests |
| Telemetry E2E | `packages/telemetry-standards/src/telemetry-e2e.test.ts` | 7 | Full governed-autonomy workflow (transactionStarted → KPI ingestion → riskDetected → recommendationGenerated → policyViolation → actionApproved → actionExecuted → outcomeRealized → transactionCompleted); verifies connector_syncs, worker_jobs, agent_runs, approvals, model/tool call, feedback, and policy gate surfaces each emit expected span class |
| Recommendation Rendering | `packages/ontology/src/recommendation-rendering.test.ts` | 16 | `createRecommendation()` for all 5 product domains (maritime/Vessels, legal/Counsel, security/Sentra, finance/Treasury, real-estate/Terra); asserts all 8 Gate-3 proof-chain fields are present, policyEvaluation has correct shape, numeric fields are in valid ranges, evidenceIds is non-empty, and cross-domain schema invariants hold; + 4 schema boundary negative tests (empty `{}`, partial, missing confidence) proving non-factory literals are rejected by RecommendationSchema |
| Proof-Chain Checker | `scripts/check-proof-chain.test.js` | 44 | Positive and negative fixtures for Gates 1–4: executeWorkflow() gate (literal-true bypass enforcement), buildPolicyEvaluation() 5-field enforcement, createRecommendation() 8-field Gate 3, Gate 4 `as Recommendation` type assertion ban (covers JSON.parse casts, DB row mappers, transport adapters); + extractArgBlock() and removeNestedBraces() helper unit tests |

**Run all domain tests + checker tests:**
```bash
pnpm vitest run packages/policy-engine/src/policy-engine.test.ts \
  packages/action-engine/src/action-engine.test.ts \
  packages/trace-graph/src/run-trace-e2e.test.ts \
  packages/connectors/src/connector-normalization.test.ts \
  packages/telemetry-standards/src/telemetry-coverage.test.ts \
  packages/telemetry-standards/src/telemetry-e2e.test.ts \
  packages/ontology/src/recommendation-rendering.test.ts \
  scripts/check-proof-chain.test.js
```

### 9.2 Proof-Chain Static Check

**File:** `scripts/check-proof-chain.js`

**What it checks:**

Gate 1 — every `executeWorkflow()` call site must supply one of:
  - `policyEvaluation: <PolicyEvaluation>` — production calls
  - `policyEvaluationOverride: true` — explicit test/demo override
  - `isDryRun: true` — simulation mode
  - `isSimulation: true` — simulation mode

Gate 2 — every `buildPolicyEvaluation()` call site (the sole `PolicyEvaluation` factory) must supply all five proof-chain fields:
  - `evidenceChain` — array of evidence objects grounding the decision
  - `freshnessScore` — 0–1 freshness score for the evidence set
  - `confidence` — 0–1 confidence in the evaluation outcome
  - `projectedImpact` — human-readable statement of expected impact
  - `projectedRisk` — human-readable risk assessment

Note: `projectedImpact` and `projectedRisk` are required (non-optional) on the `PolicyEvaluation` type (`packages/policy-engine/src/types.ts`), providing dual enforcement — TypeScript at compile time, this script at CI time.

Gate 3 — every `createRecommendation()` call site must supply all eight recommendation proof-chain fields:
  - `evidenceIds` — array of evidence IDs grounding the recommendation
  - `confidence` — 0–1 confidence score
  - `freshness` — 0–1 freshness of the evidence set
  - `rationale` — human-readable justification (the “why” of the recommendation)
  - `domain` — operational domain tag (maritime, legal, finance, security, real-estate)
  - `projectedImpact` — human-readable statement of expected impact if action is taken
  - `projectedRisk` — human-readable risk statement if action is NOT taken
  - `policyEvaluation` — explicit policy status at construction time ({ outcome, policyIds })

**Scope note (Gates 3 + 4 together):** Gate 3 detects `createRecommendation(...)` factory call sites only. Non-factory Recommendation object construction (e.g. raw object literals, serialization adapters, `JSON.parse(...)` casts) is caught by Gate 4: `as Recommendation` type assertion ban. Together, Gates 3+4 are backed by three additional layers: (a) the `RecommendationInput` TypeScript type (compile-time enforcement — all 8 fields are typed and required), (b) the `RecommendationSchema` Zod schema validation at runtime, and (c) the `recommendation-rendering.test.ts` suite which validates complete proof-chain shape across all 5 product domains. On the action-engine boundary, `PolicyEvaluationSchema` (defined in `packages/policy-engine/src/types.ts`) enforces the full PolicyEvaluation shape at runtime — empty objects, partial payloads, and `as PolicyEvaluation` type casts are all rejected before workflow execution begins.

**Parser design:** The checker uses bracket-bounded extraction (`extractArgBlock` + `removeNestedBraces`) rather than fixed-window text scanning. `removeNestedBraces` strips content at brace depth ≥ 2, so a `confidence:` key appearing only inside a nested `evidenceChain` item does NOT satisfy the Gate 2 top-level `confidence` requirement. All gate checks are covered by positive and negative unit test fixtures in `scripts/check-proof-chain.test.js`.

**Known limitation:** The static checker is regex/bracket heuristic-based, not full-AST. It correctly handles current patterns, but unusual indirection or syntax variants may bypass detection. Mitigation path: Gate 1–4 are backstopped by (a) TypeScript compile-time enforcement, (b) Zod runtime validation at executor boundary (`PolicyEvaluationSchema`, `RecommendationSchema`), and (c) domain test suites that validate proof-chain shape end-to-end. A future ESLint custom rule or TS transformer can replace the regex layer once call-site patterns stabilize.

- Scans `packages/` and `artifacts/api-server/src/` (the only artifact that calls `executeWorkflow`)
- Skips `.test.ts`, `.spec.ts`, and `dist/` output
- Skips files larger than 500 KB

**Run:**
```bash
node scripts/check-proof-chain.js
```

**CI integration:** The `proof-chain-checks` job in `.github/workflows/ci.yml` runs this check and all 5 domain test suites. It is a required gate in `ci-gate`.

### 9.3 CI Gate Wiring

The `.github/workflows/ci.yml` `ci-gate` job requires:
- `proof-chain-checks` (new) — static proof-chain check + all 5 domain test suites
- `test` — existing unit/component test suite
- `typecheck` — TypeScript compilation

Any failure in `proof-chain-checks` blocks merge.

---

*See also: SMOKE_TEST_PLAN.md, REGRESSION_RISK_REGISTER.md, QA_SIGNOFF_CHECKLIST.md*
