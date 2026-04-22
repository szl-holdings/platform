# SZL Holdings — Executive Audit Summary

> Generated April 22, 2026

## Platform Status

SZL Holdings operates a governed decision operating system implemented as a TypeScript pnpm monorepo with 17 artifacts, 123 packages, 4,900+ source files, and 920 database table definitions. All numbers are code-derived via `scripts/audit/generate-platform-metrics.ts`.

## What Was Fixed

### Critical: API Server Bootstrap Deadlock
The API server was permanently stuck in a 503 "starting" state because `bootstrapChainState()` blocked the HTTP handler flip. The query against a missing table hung forever. Fix: deferred hydration to fire-and-forget with 10s timeout, merge-only semantics to prevent counter race conditions.

### Signal Chain Default Counters
Default chains initialized with non-zero execution counts, making DB truth unreachable via merge-only hydration. Reset all defaults to zero.

### Route Count Accuracy
Audit docs corrected from 257 to 388 total route files (257 top-level + 131 in subdirectories).

## What Was Built

### Code
- `scripts/audit/generate-platform-metrics.ts` — auto-generates platform metrics from the git index
- `scripts/evals/run-arena.ts` — Command Arena evaluation harness with 5 default smoke scenarios
- `generated/platform-metrics.json` + `.md` — code-derived metrics output
- `generated/arena-results/` — evaluation run results
- `evals/scenarios/smoke/` — 5 scenario packs (health check, maritime cascade, security response, property risk, decision replay)

### Documentation (30+ deliverables)
**Governance & Trust:** TRUST_CENTER, SECURITY_POSTURE, RELEASE_GOVERNANCE, PLATFORM_CONTRACTS
**Platform Specs:** PROOF_CHAIN_SPEC, OUTCOME_GRAPH_SPEC, DATA_COMMAND_PLANE, ANALYST_LAYER, DOCUMENT_FABRIC, MODEL_POLICY_REGISTRY
**Observability:** AGENT_OBSERVABILITY, COMMAND_ARENA, SKILL_FORGE, SECURE_MEMORY
**Strategy:** CATEGORY_THESIS, WHY_NOW, COMPETITIVE_POSITIONING, DOMAIN_COMPOUNDING_STRATEGY, DEMO_PATHS
**Operations:** REPLIT_RUNBOOK, REPLIT_BOOT_MATRIX, REDUNDANCY_CLEANUP, FIX_LOG
**Executive:** BUYER_READINESS, INVESTOR_PLATFORM_BRIEF, COMPANY_ASCENSION_PLAN, NEXT_90_DAYS, RELEASE_READINESS_SCORECARD

## What Is Operational

| System | Status |
|--------|--------|
| API Server | Healthy — HTTP 200, 11ms DB latency |
| 12/12 Platform Primitives | Implemented in code |
| 17 Artifacts | Registered and buildable |
| 22 CI Workflows | Active in GitHub |
| 920 DB Table Definitions | Schema present |
| 256 Test Files | Present in codebase |

## What Is Still Blocked

| Item | Blocker | Impact |
|------|---------|--------|
| Migration ordering (Task #2886) | 12 statements reference missing tables | Non-fatal; server continues |
| Mapbox token | Paid subscription required | Terra map visualization unavailable |
| AIS data feed | Paid subscription required | Vessels real-time tracking unavailable |
| Redis sessions | Configuration pending | Using in-memory sessions |
| Sentry monitoring | Configuration pending | No production error tracking |
| SOC 2 Type II | Audit not yet initiated | Enterprise procurement requirement |

## Platform Differentiation

SZL is the only platform with all six of these properties implemented in code:
1. Decision lifecycle as the primitive (9-step loop)
2. Cross-domain signal cascading (6 domains connected)
3. Immutable hash-linked proof chain
4. Full decision replay from trace
5. Policy-governed AI with human approval gates
6. Probabilistic simulation via Monte Carlo engine

No competing platform (Palantir, Dataiku, IBM watsonx, Anduril, Scale AI) has this combination.
