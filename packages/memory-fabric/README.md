# @workspace/memory-fabric

Memory Fabric is the **tiered memory system** for the SZL Agentic Cognitive Operating Intelligence Platform.

## Contract

Memory Fabric distinguishes eight memory tiers, each with different retention semantics, sensitivity controls, and provenance tracking.

### Memory Tiers

| Tier | Default Retention | Use Case |
|------|------------------|----------|
| `session` | 1 day | Current interaction context |
| `workflow` | 7 days | State across multi-step workflows |
| `entity` | 90 days | Facts about entities (customers, assets) |
| `artifact` | 365 days | Generated documents, reports |
| `executive` | 180 days | Executive summaries and decisions |
| `domain` | Permanent | Domain ontology and reference data |
| `operator-feedback` | 730 days | Corrections and feedback from operators |
| `long-term` | Permanent | Strategic memory and learned patterns |

### MemoryEntry Fields

Every entry carries:
- `id`, `tier`, `key`, `value`
- `provenance` (source, author, method, createdAt)
- `freshness` (lastAccessedAt, lastUpdatedAt, isStale)
- `confidence` (0–1)
- `retention` (policy, expiresAt, maxAgeDays)
- `sensitivity` (public → restricted)
- `linkedEntities`, `linkedTraces`, `linkedActions`
- `scopeId`, `tags`, `metadata`

### Store Interface

```typescript
import { InMemoryStore, MemoryEntrySchema } from '@workspace/memory-fabric';

const store = new InMemoryStore();

const entry = MemoryEntrySchema.parse({
  id: 'mem-001',
  tier: 'session',
  key: 'user-intent',
  value: 'Find all vessels in the Gulf',
  provenance: { source: 'agent-planner', createdAt: new Date().toISOString() },
  freshness: { lastUpdatedAt: new Date().toISOString() },
});

store.put(entry);
const retrieved = store.getByKey('session', 'user-intent', 'session-id-abc');
```

## Non-goals

- Memory Fabric does not use LLM embeddings for semantic search (wire a vector store per-app).
- No app is required to adopt Memory Fabric yet — this is opt-in.
- Memory Fabric does not persist to the database by default.
