# Alloy Agentic RAG — Architecture

> **Package:** `@szl/alloy-agentic-rag`  
> **API routes:** `/alloy/agentic-rag/*`  
> **Version:** 1.0.0

---

## Canonical Flow

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                     Aggregator Agent                        │
│                  (packages/alloy-agentic-rag)               │
│                                                             │
│  1. PERCEIVE / ORIENT                                       │
│     ├─ Short-term working memory  (in-process + Redis)      │
│     └─ Long-term memory           (episodic + semantic vec) │
│                                                             │
│  2. PLAN                                                    │
│     ├─ ReAct mode: Thought → Tool → Observe loop           │
│     └─ CoT-Decompose: plan-then-execute (parallel fan-out)  │
│         Both produce: AgenticPlanGraph                      │
│                                                             │
│  3. FETCH (parallel fan-out to Specialist Agents)           │
│     ├─ Knowledge Agent     ──► LocalDataMCP                 │
│     │                           Postgres/Drizzle, vec store │
│     ├─ Web Research Agent  ──► SearchEngineMCP              │
│     │                           Web search, doc indexes     │
│     └─ Cloud Ops Agent     ──► CloudEngineMCP               │
│                                 S3, cloud status, metrics   │
│                                                             │
│  4. MERGE (evidence aggregation)                            │
│     ├─ Reciprocal Rank Fusion (RRF, k=60)                  │
│     └─ Cross-encoder reranking → EvidenceBundle             │
│                                                             │
│  5. GENERATE                                                │
│     └─ AI Control Plane → GPT-4o / Claude / Gemini         │
│           (with automatic fallback + cost tracking)          │
│           → GenerationRecord + answer text                  │
│                                                             │
│  6. REFLECT                                                 │
│     ├─ Write to short-term memory  (working entry)          │
│     └─ Write to long-term memory   (episodic entry)         │
│                                                             │
│  Every step emits: AggregatorTrace spans                    │
│  Result lands in:  EvidenceBundle + AggregatorTrace         │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
AgenticRagResponse
  ├─ answer (string)
  ├─ plan (AgenticPlanGraph)
  ├─ evidence (EvidenceBundle)
  ├─ generation (GenerationRecord)
  ├─ confidence (0–1)
  └─ trace (AggregatorTrace)
```

---

## Package Structure

```
packages/alloy-agentic-rag/
├─ src/
│   ├─ index.ts                    # Public API — runAgenticRag()
│   ├─ aggregator.ts               # Aggregator Agent (main orchestrator)
│   ├─ planner-modes.ts            # ReAct + CoT-Decompose planner builders
│   ├─ memory-tiers.ts             # Short-term + long-term memory wiring
│   ├─ evidence-merger.ts          # RRF + cross-encoder reranking
│   ├─ specialists/
│   │   ├─ registry.ts             # SpecialistRegistry (single entry = new specialist)
│   │   ├─ knowledge-agent.ts      # Knowledge Agent → LocalDataMCP
│   │   ├─ web-research-agent.ts   # Web Research Agent → SearchEngineMCP
│   │   └─ cloud-ops-agent.ts      # Cloud Ops Agent → CloudEngineMCP
│   ├─ mcp-classes/
│   │   ├─ types.ts                # MCPServer interface + typed descriptors
│   │   ├─ local-data-mcp.ts       # LocalDataMCP concrete adapter
│   │   ├─ search-engine-mcp.ts    # SearchEngineMCP concrete adapter
│   │   └─ cloud-engine-mcp.ts     # CloudEngineMCP concrete adapter
│   └─ __tests__/
│       ├─ aggregator.test.ts
│       ├─ planner-modes.test.ts
│       ├─ rrf.test.ts
│       ├─ mcp-classes.test.ts
│       └─ integration.test.ts

packages/contracts/src/
└─ agentic-rag.ts                  # All Zod schemas + TypeScript types
```

---

## Public SDK

### Primary entry point

```typescript
import { runAgenticRag } from '@szl/alloy-agentic-rag';

const { response, trace } = await runAgenticRag({
  query: 'What is the threat posture for our maritime operations?',
  context: { domain: 'vessels', sessionId: 'abc-123', orgId: 42 },
  policy: {
    plannerMode: 'react',        // 'react' | 'cot-decompose'
    maxSpecialists: 3,
    topK: 10,
    maxBudgetUsd: 0.5,
    enabledMcpClasses: ['local-data', 'search-engine', 'cloud-engine'],
    requireApprovalForHighRisk: true,
  },
});

console.log(response.answer);
console.log(response.evidence.chunks.length, 'chunks retrieved');
console.log(trace.mcpCalls);
```

### Key types

```typescript
// All types exported from @szl-holdings/contracts/agentic-rag
import type {
  AgenticRagRequest,
  AgenticRagResponse,
  AgenticPlanGraph,
  EvidenceBundle,
  AggregatorTrace,
  PlannerMode,      // 'react' | 'cot-decompose'
  MCPClass,         // 'local-data' | 'search-engine' | 'cloud-engine'
  MemoryTier,       // 'short-term' | 'long-term'
  GenerationRecord,
} from '@szl-holdings/contracts/agentic-rag';
```

---

## API Routes

All routes are registered under `/alloy/agentic-rag/*` in the API server.

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| `POST` | `/alloy/agentic-rag/run` | ✅ | AI inference limiter | Full agentic RAG loop |
| `GET` | `/alloy/agentic-rag/runs/:id` | ✅ | Standard | Retrieve run result |
| `GET` | `/alloy/agentic-rag/runs/:id/trace` | ✅ | Standard | Retrieve full trace |
| `POST` | `/alloy/agentic-rag/run/stream` | ✅ | AI inference limiter | SSE streaming run |
| `GET` | `/alloy/agentic-rag/specialists` | ✅ | Standard | List available specialists |
| `GET` | `/alloy/agentic-rag/mcp-classes` | ✅ | Standard | List MCP capability descriptors |

All `POST` routes also pass through the Guardian Policy Check middleware.

---

## Extension Recipes

### Recipe 1 — Add a Specialist Agent

1. Create `packages/alloy-agentic-rag/src/specialists/my-agent.ts`:

```typescript
import { localDataMCP } from '../mcp-classes/local-data-mcp.js'; // or another class
import type { SpecialistOutput } from '../evidence-merger.js';
import type { SpecialistAgent, SpecialistQuery } from './registry.js';

export class MySpecialistAgent implements SpecialistAgent {
  readonly name = 'my-specialist';
  readonly description = 'Retrieves evidence from MyDataSource via LocalDataMCP';

  async run(query: SpecialistQuery): Promise<SpecialistOutput> {
    const result = await localDataMCP.query({ query: query.query, topK: query.topK });
    return {
      specialistAgent: this.name,
      mcpClass: 'local-data',
      chunks: result.chunks.map((c) => ({ ...c })),
    };
  }
}
```

2. Add one entry to `SPECIALIST_REGISTRY` in `registry.ts`:

```typescript
import { MySpecialistAgent } from './my-agent.js';

export const SPECIALIST_REGISTRY: Record<string, () => SpecialistAgent> = {
  // ... existing entries
  'my-specialist': () => new MySpecialistAgent(),
};
```

That's it. No other code change needed.

---

### Recipe 2 — Add an MCP Server

1. Create `packages/alloy-agentic-rag/src/mcp-classes/my-mcp.ts`:

```typescript
import type { MCPCapabilityDescriptor, MCPQueryInput, MCPQueryResult, MCPServer } from './types.js';

export class MyMCP implements MCPServer {
  readonly descriptor: MCPCapabilityDescriptor = {
    serverName: 'my-mcp',
    mcpClass: 'local-data',   // or 'search-engine' | 'cloud-engine'
    version: '1.0.0',
    tools: [{ name: 'my_tool', description: '...', inputSchema: { type: 'object', properties: {} } }],
  };

  async query(input: MCPQueryInput): Promise<MCPQueryResult> {
    // Call your data source here
    return { chunks: [], serverName: this.descriptor.serverName, mcpClass: this.descriptor.mcpClass, latencyMs: 0 };
  }
}
```

2. Export from `mcp-classes/index.ts`.  
3. Reference in your specialist agent.

---

### Recipe 3 — Add a Planner Mode

1. Add the new mode to the `plannerModeSchema` in `packages/contracts/src/agentic-rag.ts`:

```typescript
export const plannerModeSchema = z.enum(['react', 'cot-decompose', 'my-new-mode']);
```

2. Implement the build function in `planner-modes.ts`:

```typescript
function buildMyNewModePlan(input: PlannerInput): PlannerOutput {
  // ... return { plan, thoughts }
}
```

3. Add a case to the `buildPlan` dispatcher:

```typescript
case 'my-new-mode':
  return buildMyNewModePlan(input);
```

The output must be an `AgenticPlanGraph` — the rest of the pipeline is unchanged.

---

## Memory Retention Policy

| Tier | Type | Default Retention | Policy Override |
|------|------|------------------|-----------------|
| Short-term | `working` | Session lifetime (60 min) | `policy.shortTermRetentionMs` |
| Long-term | `episodic` | 90 days | `policy.longTermRetentionDays` |
| Long-term | `semantic` | 90 days | `policy.longTermRetentionDays` |

---

## Observability

Every run emits the following data queryable through the existing observability stack:

- **`AggregatorTrace.steps`** — phase-by-phase duration and status
- **`AggregatorTrace.mcpCalls`** — per-specialist latency, chunk count, success/failure
- **`AggregatorTrace.generation`** — provider, model, tokens, cost, fallback
- **`EvidenceBundle.chunks`** — ranked evidence with source, score, and specialist attribution
- **Memory reads/writes** — counts per tier on every trace

No new UI surfaces are required. Data is queryable through the existing trace-graph and evidence-ledger APIs.
