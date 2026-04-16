import { describe, it, expect, beforeEach } from "vitest";
import { ToolManifestSchema } from "./manifest.js";
import { InMemoryToolRegistry } from "./registry.js";
import { ToolMeshGateway } from "./gateway.js";
import { GRAPH_QUERY_TOOL_MANIFEST, graphQueryHandler } from "./tools/graph-query.js";
import { DOCUMENT_RETRIEVAL_TOOL_MANIFEST, documentRetrievalHandler } from "./tools/document-retrieval.js";
import { GuardianDecisionEngine } from "@workspace/guardian/decision-engine";
import { InMemoryTraceStore } from "@workspace/trace-graph/store";
import { TraceWriter } from "@workspace/trace-graph/writer";

function makeRegistry() {
  const registry = new InMemoryToolRegistry();
  registry.register(GRAPH_QUERY_TOOL_MANIFEST);
  registry.register(DOCUMENT_RETRIEVAL_TOOL_MANIFEST);
  return registry;
}

function makeGateway(registry: InMemoryToolRegistry) {
  const guardian = new GuardianDecisionEngine();
  guardian.addRule({
    id: "allow-internal",
    name: "Allow internal-workflow",
    tier: "internal-workflow",
    conditions: [],
    action: "allow",
    priority: 10,
    enabled: true,
    tags: [],
  });
  const store = new InMemoryTraceStore();
  const writer = new TraceWriter(store);
  return new ToolMeshGateway(registry, guardian, writer);
}

describe("ToolManifestSchema", () => {
  it("parses GRAPH_QUERY_TOOL_MANIFEST", () => {
    expect(() => ToolManifestSchema.parse(GRAPH_QUERY_TOOL_MANIFEST)).not.toThrow();
  });

  it("parses DOCUMENT_RETRIEVAL_TOOL_MANIFEST", () => {
    expect(() => ToolManifestSchema.parse(DOCUMENT_RETRIEVAL_TOOL_MANIFEST)).not.toThrow();
  });
});

describe("InMemoryToolRegistry", () => {
  it("registers and retrieves tools", () => {
    const registry = makeRegistry();
    expect(registry.count()).toBe(2);
    expect(registry.get("graph-query")).toBeDefined();
    expect(registry.get("document-retrieval")).toBeDefined();
  });

  it("filters by domain tag", () => {
    const registry = makeRegistry();
    expect(registry.list({ domainTag: "graph" })).toHaveLength(1);
    expect(registry.list({ domainTag: "documents" })).toHaveLength(1);
  });

  it("unregisters tools", () => {
    const registry = makeRegistry();
    expect(registry.unregister("graph-query")).toBe(true);
    expect(registry.count()).toBe(1);
  });
});

describe("ToolMeshGateway", () => {
  let registry: InMemoryToolRegistry;
  let gateway: ToolMeshGateway;

  beforeEach(() => {
    registry = makeRegistry();
    gateway = makeGateway(registry);
    gateway.registerHandler("graph-query", graphQueryHandler);
    gateway.registerHandler("document-retrieval", documentRetrievalHandler);
  });

  it("successfully invokes graph-query tool", async () => {
    const result = await gateway.invoke(
      "graph-query",
      { query: "find all vessels", maxResults: 5 },
      { requestId: "req-001", agentId: "agent-1" }
    );
    expect(result.success).toBe(true);
    expect(result.decisionOutcome).toBe("allow");
    expect(result.traceId).toBeDefined();
  });

  it("successfully invokes document-retrieval tool", async () => {
    const result = await gateway.invoke(
      "document-retrieval",
      { query: "lease agreements", topK: 3 },
      { requestId: "req-002" }
    );
    expect(result.success).toBe(true);
  });

  it("returns error for unknown tool", async () => {
    const result = await gateway.invoke(
      "nonexistent-tool",
      {},
      { requestId: "req-003" }
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  it("denies when guardian has no matching rule", async () => {
    const denying = new GuardianDecisionEngine();
    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const denyGateway = new ToolMeshGateway(registry, denying, writer);
    denyGateway.registerHandler("graph-query", graphQueryHandler);

    const result = await denyGateway.invoke(
      "graph-query",
      { query: "test" },
      { requestId: "req-004" }
    );
    expect(result.success).toBe(false);
    expect(result.decisionOutcome).toBe("deny");
  });

  it("records trace on tool invocation", async () => {
    const store = new InMemoryTraceStore();
    const guardian = new GuardianDecisionEngine();
    guardian.addRule({ id: "allow", name: "Allow all", tier: "internal-workflow", conditions: [], action: "allow", priority: 1, enabled: true, tags: [] });
    const writer = new TraceWriter(store);
    const tracingGateway = new ToolMeshGateway(registry, guardian, writer);
    tracingGateway.registerHandler("graph-query", graphQueryHandler);

    const result = await tracingGateway.invoke(
      "graph-query",
      { query: "test" },
      { requestId: "req-005" }
    );
    expect(result.traceId).toBeDefined();
    const trace = store.get(result.traceId!);
    expect(trace).toBeDefined();
    expect(trace?.toolCalls).toHaveLength(1);
    expect(trace?.toolCalls[0]?.toolName).toBe("Graph Query");
  });
});
