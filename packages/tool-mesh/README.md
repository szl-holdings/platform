# @workspace/tool-mesh

MCP Tool Mesh is the **first-class tool registry and gateway** for the SZL Agentic Cognitive Operating Intelligence Platform.

## Contract

Every tool used by agents must be registered in the Tool Mesh with a typed manifest. The gateway consults Guardian before invocation and emits a Trace Graph span for every tool call.

### Tool Manifest Fields

- `id`, `name`, `version`, `description`
- `domainTags` — graph, documents, data, communication, finance, legal, security, etc.
- `policyTier` — Guardian policy tier that gates invocation
- `allowedEnvironments`
- `inputSchema`, `outputSchema`
- `rateLimits` (requestsPerMinute, requestsPerHour, concurrency)
- `timeoutMs`
- `failureModes` (type, fallback, retryable, maxRetries)
- `approvalRequired`
- `owner`
- `observabilityHooks` (emitTrace, emitMetrics, sensitiveFields)

### Registering a Tool

```typescript
import { InMemoryToolRegistry, ToolManifestSchema } from '@workspace/tool-mesh';
import { ToolMeshGateway } from '@workspace/tool-mesh/gateway';

const registry = new InMemoryToolRegistry();
registry.register(ToolManifestSchema.parse({
  id: 'my-tool',
  name: 'My Tool',
  description: 'Does something useful',
  policyTier: 'internal-workflow',
  domainTags: ['data'],
  timeoutMs: 5000,
}));

const gateway = new ToolMeshGateway(registry, guardianEngine, traceWriter);
gateway.registerHandler('my-tool', async (input, manifest) => {
  return { result: 'done' };
});

const result = await gateway.invoke('my-tool', { param: 'value' }, { requestId: 'req-001' });
```

### Reference Tools

Two reference tools are pre-built and ready to register:
- `graph-query` — Queries the Constellation operational graph
- `document-retrieval` — Retrieves documents using semantic similarity

## Non-goals

- Tool Mesh does not implement actual LLM tool-calling protocols (wire an MCP bridge per-app).
- No production retrieval backend is bundled — wire Constellation and a vector store per-app.

## Absorption

This package absorbs and re-exports `@szl-holdings/tool-registry` as a compatibility shim.
