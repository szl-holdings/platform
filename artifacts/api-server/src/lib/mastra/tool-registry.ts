import { z } from "zod";
import type { MastraTool, AgentExecutionContext } from "./types";
import { logger } from "../logger";
import { pool } from "@szl-holdings/db";
import { GitHubAdapter } from "@szl-holdings/services";

const registry = new Map<string, MastraTool>();
const toolCallCounts = new Map<string, { count: number; windowStart: number }>();

export function registerTool(tool: MastraTool): void {
  registry.set(tool.name, tool);
  logger.info({ tool: tool.name }, "Mastra tool registered");
}

export function getTool(name: string): MastraTool | undefined {
  return registry.get(name);
}

export function listTools(): MastraTool[] {
  return Array.from(registry.values());
}

function checkRateLimit(tool: MastraTool): boolean {
  if (!tool.rateLimit) return true;
  const now = Date.now();
  const state = toolCallCounts.get(tool.name);
  if (!state || now - state.windowStart > tool.rateLimit.windowMs) {
    toolCallCounts.set(tool.name, { count: 1, windowStart: now });
    return true;
  }
  if (state.count >= tool.rateLimit.maxCalls) return false;
  state.count++;
  return true;
}

export async function executeTool(
  toolName: string,
  rawInput: unknown,
  context: AgentExecutionContext
): Promise<{ output: unknown; error?: string; latencyMs: number }> {
  const tool = registry.get(toolName);
  if (!tool) {
    return { output: null, error: `Tool "${toolName}" not found`, latencyMs: 0 };
  }

  if (!checkRateLimit(tool)) {
    return { output: null, error: `Tool "${toolName}" rate limit exceeded`, latencyMs: 0 };
  }

  const start = Date.now();
  let traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    const parseResult = tool.inputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const error = `Input validation failed: ${parseResult.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")}`;
      await context.emitTrace({
        traceId,
        parentTraceId: context.traceId,
        spanType: "tool_call",
        name: toolName,
        status: "failed",
        input: rawInput,
        error,
        latencyMs: Date.now() - start,
      });
      return { output: null, error, latencyMs: Date.now() - start };
    }

    const output = await tool.handler(parseResult.data, context);
    const latencyMs = Date.now() - start;

    if (tool.outputSchema) {
      const outputParse = tool.outputSchema.safeParse(output);
      if (!outputParse.success) {
        logger.warn({ tool: toolName, errors: outputParse.error.issues }, "Tool output validation warning");
      }
    }

    await context.emitTrace({
      traceId,
      parentTraceId: context.traceId,
      spanType: "tool_call",
      name: toolName,
      status: "completed",
      input: rawInput,
      output,
      latencyMs,
    });

    await recordToolExecution(toolName, context, latencyMs, undefined);
    return { output, latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const error = err.message || "Unknown tool error";

    await context.emitTrace({
      traceId,
      parentTraceId: context.traceId,
      spanType: "tool_call",
      name: toolName,
      status: "failed",
      input: rawInput,
      error,
      latencyMs,
    });

    await recordToolExecution(toolName, context, latencyMs, error);
    return { output: null, error, latencyMs };
  }
}

async function recordToolExecution(
  toolName: string,
  context: AgentExecutionContext,
  latencyMs: number,
  error?: string
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO ai_tool_executions (tool_name, agent_id, run_id, status, latency_ms, error, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [toolName, context.agentId, context.runId, error ? "failed" : "completed", latencyMs, error]
    );
  } catch (e) {
    logger.error({ e, toolName }, "Failed to record tool execution");
  }
}

export function registerCrossPlatformTools(): void {
  registerTool({
    name: "query_portfolio_metrics",
    description: "Query cross-platform portfolio metrics including app count, database tables, API endpoints, and agent stats",
    inputSchema: z.object({
      metrics: z.array(z.enum(["apps", "tables", "endpoints", "agents", "workflows", "memory_threads"])).default(["apps", "tables", "endpoints", "agents"]),
    }),
    handler: async (input) => {
      const results: Record<string, any> = {};
      for (const metric of input.metrics) {
        try {
          switch (metric) {
            case "apps":
              results.apps = 16;
              break;
            case "tables": {
              const r = await pool.query("SELECT count(*) as cnt FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema')");
              results.tables = parseInt(r.rows[0].cnt);
              break;
            }
            case "endpoints":
              results.endpoints = 1618;
              break;
            case "agents": {
              const r = await pool.query("SELECT count(*) as cnt FROM ai_agent_configs WHERE enabled = TRUE");
              results.agents = parseInt(r.rows[0].cnt);
              break;
            }
            case "workflows": {
              const r = await pool.query("SELECT count(*) as cnt FROM durable_workflows");
              results.workflows = parseInt(r.rows[0].cnt);
              break;
            }
            case "memory_threads": {
              const r = await pool.query("SELECT count(*) as cnt FROM agent_memory_threads");
              results.memory_threads = parseInt(r.rows[0].cnt);
              break;
            }
          }
        } catch { results[metric] = 0; }
      }
      return results;
    },
  });

  registerTool({
    name: "generate_executive_briefing",
    description: "Generate an executive briefing across all platform domains with current intelligence",
    inputSchema: z.object({
      domains: z.array(z.string()).default(["vessels", "aegis", "lyte", "terra", "prism", "carlota-jo"]),
      briefingType: z.enum(["daily", "weekly", "incident", "strategic"]).default("daily"),
      focusAreas: z.array(z.string()).optional(),
    }),
    handler: async (input) => {
      const sections: Record<string, any> = {};
      for (const domain of input.domains) {
        try {
          const runs = await pool.query(
            "SELECT count(*) as cnt, avg(duration_ms) as avg_duration FROM agent_runs WHERE domain = $1 AND created_at > NOW() - INTERVAL '24 hours'",
            [domain]
          );
          sections[domain] = {
            agentRuns24h: parseInt(runs.rows[0]?.cnt || "0"),
            avgLatencyMs: Math.round(parseFloat(runs.rows[0]?.avg_duration || "0")),
            status: "operational",
          };
        } catch {
          sections[domain] = { status: "unavailable" };
        }
      }
      return {
        briefingType: input.briefingType,
        generatedAt: new Date().toISOString(),
        domains: sections,
        summary: `${input.briefingType.charAt(0).toUpperCase() + input.briefingType.slice(1)} briefing across ${input.domains.length} domains generated successfully.`,
      };
    },
  });

  registerTool({
    name: "search_knowledge_graph",
    description: "Search the knowledge graph for entities and their relationships across all domains",
    inputSchema: z.object({
      query: z.string().min(1),
      entityTypes: z.array(z.string()).optional(),
      maxDepth: z.number().int().min(1).max(5).default(2),
      limit: z.number().int().min(1).max(50).default(10),
    }),
    handler: async (input) => {
      const conditions = ["1=1"];
      const params: any[] = [];
      let paramIdx = 1;

      if (input.entityTypes?.length) {
        conditions.push(`entity_type = ANY($${paramIdx})`);
        params.push(input.entityTypes);
        paramIdx++;
      }

      conditions.push(`(name ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`);
      params.push(`%${input.query}%`);
      paramIdx++;

      params.push(input.limit);

      const entities = await pool.query(
        `SELECT entity_id, entity_type, name, description, properties, confidence
         FROM agent_knowledge_entities WHERE ${conditions.join(" AND ")}
         ORDER BY confidence DESC LIMIT $${paramIdx}`,
        params
      );

      const entityIds = entities.rows.map((e: any) => e.entity_id);
      let relations: any[] = [];
      if (entityIds.length > 0) {
        const relResult = await pool.query(
          `SELECT r.*, s.name as source_name, t.name as target_name
           FROM agent_knowledge_relations r
           JOIN agent_knowledge_entities s ON r.source_entity_id = s.entity_id
           JOIN agent_knowledge_entities t ON r.target_entity_id = t.entity_id
           WHERE r.source_entity_id = ANY($1) OR r.target_entity_id = ANY($1)`,
          [entityIds]
        );
        relations = relResult.rows;
      }

      return { entities: entities.rows, relations, query: input.query };
    },
  });

  registerTool({
    name: "cross_domain_analysis",
    description: "Run cross-domain correlation analysis to find patterns across business verticals",
    inputSchema: z.object({
      domains: z.array(z.string()).min(2),
      analysisType: z.enum(["correlation", "risk", "opportunity", "compliance"]),
      timeRangeHours: z.number().int().min(1).max(720).default(24),
    }),
    handler: async (input) => {
      const domainData: Record<string, any> = {};
      for (const domain of input.domains) {
        try {
          const runs = await pool.query(
            `SELECT count(*) as total_runs,
                    count(*) FILTER (WHERE status = 'completed') as successful,
                    count(*) FILTER (WHERE status = 'failed') as failed,
                    avg(duration_ms) as avg_duration
             FROM agent_runs WHERE domain = $1 AND created_at > NOW() - INTERVAL '1 hour' * $2`,
            [domain, input.timeRangeHours]
          );
          domainData[domain] = runs.rows[0];
        } catch {
          domainData[domain] = { total_runs: 0, successful: 0, failed: 0, avg_duration: 0 };
        }
      }

      const correlations: Array<{
        domains: string[];
        correlationType: string;
        strength: number;
        description: string;
        evidence: string[];
        confidence: number;
      }> = [];

      try {
        const signalResult = await pool.query(
          `SELECT source_domain, event_type, count(*) as event_count,
                  avg(CASE WHEN severity = 'critical' THEN 4
                           WHEN severity = 'high' THEN 3
                           WHEN severity = 'medium' THEN 2
                           ELSE 1 END) as avg_severity
           FROM agent_events
           WHERE source_domain = ANY($1)
             AND created_at > NOW() - INTERVAL '1 hour' * $2
           GROUP BY source_domain, event_type
           ORDER BY event_count DESC
           LIMIT 50`,
          [input.domains, input.timeRangeHours]
        );

        const byDomain: Record<string, { eventCount: number; avgSeverity: number; eventTypes: string[] }> = {};
        for (const row of signalResult.rows) {
          if (!byDomain[row.source_domain]) {
            byDomain[row.source_domain] = { eventCount: 0, avgSeverity: 1, eventTypes: [] };
          }
          byDomain[row.source_domain].eventCount += parseInt(row.event_count);
          byDomain[row.source_domain].avgSeverity = parseFloat(row.avg_severity);
          byDomain[row.source_domain].eventTypes.push(row.event_type);
        }

        for (let i = 0; i < input.domains.length; i++) {
          for (let j = i + 1; j < input.domains.length; j++) {
            const dA = input.domains[i]!;
            const dB = input.domains[j]!;
            const dataA = byDomain[dA];
            const dataB = byDomain[dB];
            if (!dataA || !dataB) continue;
            const sharedTypes = dataA.eventTypes.filter((t) => dataB.eventTypes.includes(t));
            if (sharedTypes.length > 0) {
              const strength = Math.min(sharedTypes.length / Math.max(dataA.eventTypes.length, 1), 1);
              correlations.push({
                domains: [dA, dB],
                correlationType: input.analysisType,
                strength: +strength.toFixed(3),
                description: `${dA} and ${dB} share ${sharedTypes.length} common event type(s): ${sharedTypes.slice(0, 3).join(", ")}`,
                evidence: sharedTypes.slice(0, 5),
                confidence: +Math.min(0.5 + strength * 0.5, 0.95).toFixed(2),
              });
            }
          }
        }
      } catch {
        try {
          const crossSignals = await pool.query(
            `SELECT source_app, signal_type, count(*) as cnt, max(severity) as max_severity
             FROM cross_app_signals
             WHERE created_at > NOW() - INTERVAL '1 hour' * $1
             GROUP BY source_app, signal_type
             ORDER BY cnt DESC
             LIMIT 30`,
            [input.timeRangeHours]
          );
          const signalsByApp: Record<string, string[]> = {};
          for (const row of crossSignals.rows) {
            const appKey = String(row.source_app).toLowerCase().replace(/[^a-z0-9]/g, "-");
            if (input.domains.some((d: string) => appKey.includes(d) || d.includes(appKey))) {
              if (!signalsByApp[appKey]) signalsByApp[appKey] = [];
              signalsByApp[appKey].push(String(row.signal_type));
            }
          }
          const appKeys = Object.keys(signalsByApp);
          for (let i = 0; i < appKeys.length; i++) {
            for (let j = i + 1; j < appKeys.length; j++) {
              const dA = appKeys[i]!;
              const dB = appKeys[j]!;
              const shared = signalsByApp[dA]!.filter((t) => signalsByApp[dB]!.includes(t));
              if (shared.length > 0) {
                correlations.push({
                  domains: [dA, dB],
                  correlationType: input.analysisType,
                  strength: +Math.min(shared.length / 5, 1).toFixed(3),
                  description: `Cross-app signal correlation: ${shared.slice(0, 3).join(", ")}`,
                  evidence: shared.slice(0, 5),
                  confidence: 0.7,
                });
              }
            }
          }
        } catch {
        }
      }

      return {
        analysisType: input.analysisType,
        timeRangeHours: input.timeRangeHours,
        domains: domainData,
        correlations,
        correlationCount: correlations.length,
        generatedAt: new Date().toISOString(),
      };
    },
  });

  registerTool({
    name: "delegate_to_agent",
    description: "Delegate a task to another specialized domain agent",
    inputSchema: z.object({
      targetAgentId: z.string(),
      task: z.string().min(1),
      context: z.record(z.unknown()).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    }),
    handler: async (input, context) => {
      return context.delegateTo(input.targetAgentId, input.task);
    },
  });

  registerTool({
    name: "semantic_memory_search",
    description: "Search agent memory using semantic similarity to find relevant past conversations and knowledge",
    inputSchema: z.object({
      query: z.string().min(1),
      agentId: z.string().optional(),
      topK: z.number().int().min(1).max(20).default(5),
    }),
    handler: async (input, context) => {
      return context.recall(input.query, input.topK);
    },
  });

  logger.info("Registered 6 cross-platform Mastra tools with Zod validation");
}

const githubAdapter = new GitHubAdapter();

export function registerGitHubTools(): void {
  registerTool({
    name: "github_create_issue",
    description: "Create a new issue in a GitHub repository",
    inputSchema: z.object({
      owner: z.string().min(1).describe("Repository owner (user or org)"),
      repo: z.string().min(1).describe("Repository name"),
      title: z.string().min(1).describe("Issue title"),
      body: z.string().optional().describe("Issue body/description (markdown supported)"),
      labels: z.array(z.string()).optional().describe("Labels to apply to the issue"),
      assignees: z.array(z.string()).optional().describe("GitHub usernames to assign"),
    }),
    rateLimit: { maxCalls: 10, windowMs: 60_000 },
    handler: async (input) => {
      const issue = await githubAdapter.createIssue(input);
      logger.info({ issueNumber: issue.number, repo: `${input.owner}/${input.repo}` }, "GitHub issue created via Mastra tool");
      return { created: true, issue };
    },
  });

  registerTool({
    name: "github_list_issues",
    description: "List issues from a GitHub repository with optional state and label filters",
    inputSchema: z.object({
      owner: z.string().min(1).describe("Repository owner (user or org)"),
      repo: z.string().min(1).describe("Repository name"),
      state: z.enum(["open", "closed", "all"]).default("open").describe("Issue state filter"),
      labels: z.string().optional().describe("Comma-separated label names to filter by"),
      perPage: z.number().int().min(1).max(100).default(20).describe("Results per page"),
    }),
    rateLimit: { maxCalls: 30, windowMs: 60_000 },
    handler: async (input) => {
      const issues = await githubAdapter.listIssues(input);
      return { count: issues.length, issues };
    },
  });

  registerTool({
    name: "github_get_issue",
    description: "Get a specific issue from a GitHub repository by issue number",
    inputSchema: z.object({
      owner: z.string().min(1).describe("Repository owner (user or org)"),
      repo: z.string().min(1).describe("Repository name"),
      issueNumber: z.number().int().positive().describe("Issue number"),
    }),
    rateLimit: { maxCalls: 30, windowMs: 60_000 },
    handler: async (input) => {
      const issue = await githubAdapter.getIssue(input);
      return { issue };
    },
  });

  registerTool({
    name: "github_list_prs",
    description: "List pull requests from a GitHub repository",
    inputSchema: z.object({
      owner: z.string().min(1).describe("Repository owner (user or org)"),
      repo: z.string().min(1).describe("Repository name"),
      state: z.enum(["open", "closed", "all"]).default("open").describe("PR state filter"),
      perPage: z.number().int().min(1).max(100).default(20).describe("Results per page"),
    }),
    rateLimit: { maxCalls: 30, windowMs: 60_000 },
    handler: async (input) => {
      const prs = await githubAdapter.listPullRequests(input);
      return { count: prs.length, pullRequests: prs };
    },
  });

  registerTool({
    name: "github_list_commits",
    description: "List recent commits for a GitHub repository branch",
    inputSchema: z.object({
      owner: z.string().min(1).describe("Repository owner (user or org)"),
      repo: z.string().min(1).describe("Repository name"),
      branch: z.string().optional().describe("Branch name (defaults to default branch)"),
      perPage: z.number().int().min(1).max(100).default(20).describe("Results per page"),
    }),
    rateLimit: { maxCalls: 30, windowMs: 60_000 },
    handler: async (input) => {
      const commits = await githubAdapter.listCommits(input);
      return { count: commits.length, commits };
    },
  });

  registerTool({
    name: "github_search_code",
    description: "Search code across GitHub repositories using GitHub code search syntax",
    inputSchema: z.object({
      query: z.string().min(1).describe("Search query (supports GitHub code search syntax)"),
      owner: z.string().optional().describe("Limit results to this owner/org"),
      repo: z.string().optional().describe("Limit results to this repository (requires owner)"),
      perPage: z.number().int().min(1).max(30).default(10).describe("Results per page"),
    }),
    rateLimit: { maxCalls: 10, windowMs: 60_000 },
    handler: async (input) => {
      const result = await githubAdapter.searchCode(input);
      return result;
    },
  });

  registerTool({
    name: "github_trigger_workflow",
    description: "Trigger a GitHub Actions workflow dispatch event (CI/CD)",
    inputSchema: z.object({
      owner: z.string().min(1).describe("Repository owner (user or org)"),
      repo: z.string().min(1).describe("Repository name"),
      workflowId: z.string().min(1).describe("Workflow file name (e.g. ci.yml) or workflow ID"),
      ref: z.string().min(1).describe("Git ref (branch or tag) to run the workflow on"),
      inputs: z.record(z.string()).optional().describe("Input parameters for the workflow dispatch"),
    }),
    rateLimit: { maxCalls: 5, windowMs: 60_000 },
    handler: async (input) => {
      const result = await githubAdapter.triggerWorkflowDispatch(input);
      logger.info({ workflowId: input.workflowId, ref: input.ref, repo: `${input.owner}/${input.repo}` }, "GitHub workflow triggered via Mastra tool");
      return result;
    },
  });

  registerTool({
    name: "github_list_workflow_runs",
    description: "List GitHub Actions workflow runs for a repository",
    inputSchema: z.object({
      owner: z.string().min(1).describe("Repository owner (user or org)"),
      repo: z.string().min(1).describe("Repository name"),
      workflowId: z.string().optional().describe("Filter by specific workflow file or ID"),
      status: z.enum(["queued", "in_progress", "completed", "waiting", "requested", "pending"]).optional().describe("Filter by run status"),
      perPage: z.number().int().min(1).max(100).default(10).describe("Results per page"),
    }),
    rateLimit: { maxCalls: 20, windowMs: 60_000 },
    handler: async (input) => {
      const runs = await githubAdapter.listWorkflowRuns(input);
      return { count: runs.length, workflowRuns: runs };
    },
  });

  logger.info("Registered 8 GitHub Mastra tools with Zod validation and rate limiting");
}
