import { z } from "zod";
import type { ToolManifest } from "../manifest.js";
import type { ToolHandler } from "../gateway.js";

export const GraphQueryInputSchema = z.object({
  query: z.string(),
  domain: z.string().optional(),
  maxResults: z.number().int().positive().default(10),
});

export type GraphQueryInput = z.infer<typeof GraphQueryInputSchema>;

export const GRAPH_QUERY_TOOL_MANIFEST: ToolManifest = {
  id: "graph-query",
  name: "Graph Query",
  version: "1.0.0",
  description: "Query the Constellation operational graph. Returns matching nodes and edges based on a search query.",
  domainTags: ["graph"],
  policyTier: "internal-workflow",
  allowedEnvironments: ["development", "staging", "production"],
  rateLimits: { requestsPerMinute: 60 },
  timeoutMs: 5000,
  failureModes: [{ type: "timeout", retryable: true, maxRetries: 2 }],
  approvalRequired: false,
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
  enabled: true,
};

export const graphQueryHandler: ToolHandler = async (input) => {
  const parsed = GraphQueryInputSchema.parse(input);
  return {
    query: parsed.query,
    domain: parsed.domain,
    results: [],
    totalCount: 0,
    message: `Graph query executed for: "${parsed.query}" (no store connected; wire Constellation to populate results)`,
  };
};
