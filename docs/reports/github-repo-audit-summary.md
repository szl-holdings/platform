<!-- doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header. -->
# GitHub Repository Audit & Code Merge Summary

**Date:** 2026-03-30  
**Task:** Full GitHub repo audit & best code merge (Task #50)

## Repositories Discovered

| Repository | Language | Size | Status |
|---|---|---|---|
| stephenlutar2-hash/stephenlutar2-hash | TypeScript | 60,468 KB | Archived |
| stephenlutar2-hash/szl-holdings-platform | TypeScript | 7,909 KB | Archived |
| stephenlutar2-hash/szl-holdings | TypeScript | 67,473 KB | Archived |
| stephenlutar2-hash/inca-intelligence-platform | TypeScript | 19,840 KB | Archived |

**Organizations:** None  
**Total repos:** 4 public, 0 private  
All repos are archived and marked as previously consolidated.

## Code Merged

### 1. Domain Agent System
**Source:** `szl-holdings` repo `artifacts/api-server/src/routes/domain-agents/`  
**Files created:**
- `artifacts/api-server/src/routes/domain-agents/configs.ts` - 12 agent configs with system prompts and tools
- `artifacts/api-server/src/routes/domain-agents/runner.ts` - Chat engine with tool-calling loop
- `artifacts/api-server/src/routes/domain-agents/index.ts` - API routes

**Agents:** inca, vessels, szl-holdings, carlota-jo, firestorm, lyte, dreamscape, readiness-report, msp, terra, admin, stephen

**Endpoints:**
- `GET /api/domain-agents/health`
- `GET /api/domain-agents/agents`
- `GET /api/domain-agents/agents/:agentType`
- `POST /api/domain-agents/:agentType/chat`

### 2. Model Registry
**Source:** `szl-holdings` repo `artifacts/api-server/src/lib/model-registry.ts`  
**File:** `artifacts/api-server/src/lib/model-registry.ts`  
Per-agent model configs, env-var overrides, freshness tracking.

### 3. AI Model Observability
**Source:** `szl-holdings` repo `artifacts/api-server/src/lib/aiModelObservability.ts`  
**File:** `artifacts/api-server/src/lib/ai-model-observability.ts`  
Inference metrics, accuracy drift detection, model health summary.

**Intelligence endpoints added:**
- `GET /api/intelligence/ai-models`
- `GET /api/intelligence/ai-models/summary`
- `GET /api/intelligence/ai-models/:modelId`
- `GET /api/intelligence/model-registry`

## What Was Skipped (and Why)

| Item | Reason |
|---|---|
| NuroMesh agent-to-agent delegation | Requires Redis, complex state management, and DB tables not present |
| MCP (Model Context Protocol) client | Requires separate MCP server infrastructure not in workspace |
| Aegis, Beacon, Nimbus, Zeus, DreamEra apps | Functionality already covered by Firestorm, Lyte, INCA, Dreamscape |
| Alloy/AlloyScape agent system | Separate agent framework, redundant with domain agents |
| OpenAI SDK direct integration | Workspace uses existing AI adapter with Replit proxy/OpenAI/Anthropic fallback |
| Redis session/caching layer | Workspace uses in-memory caching; Redis not configured |
| Entra ID / Azure AD auth | Enterprise SSO not configured in workspace |
| Social media routes (86KB) | Large route file for social media management not in scope |
| Career/Apps-Showcase artifacts | Apps not present in current workspace |
| Plaid financial integration | Payment integration not needed in current architecture |
| Email/Newsletter routes | Communication features not in current scope |
| Organization/multi-tenant middleware | Workspace is single-tenant |

## Adaptations Made

- Package imports changed from `@szl-holdings/*` to `@workspace/*`
- Agent runner uses existing `@workspace/services` AI adapter (supports Replit proxy, OpenAI, Anthropic with auto-fallback) instead of direct OpenAI SDK
- Tool execution calls existing API routes internally rather than database queries directly
- Conversation storage uses in-memory Map with TTL eviction instead of PostgreSQL
- Simplified from 18 agents to 12 agents matching current workspace apps

## Build Verification

All new files compile cleanly with zero TypeScript errors. Pre-existing DB schema import errors in other files are unrelated to this merge.
