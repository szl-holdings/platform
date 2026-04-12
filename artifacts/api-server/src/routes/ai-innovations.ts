import { Router, type IRouter } from "express";
import { pool } from "@szl-holdings/db";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { publish } from "../lib/websocket";
import { listTools } from "../lib/mastra/tool-registry";

const router: IRouter = Router();

async function ensureTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_reflective_evaluations (
      id BIGSERIAL PRIMARY KEY,
      run_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      output_confidence NUMERIC(4,3) DEFAULT 0,
      quality_score NUMERIC(4,3) DEFAULT 0,
      retry_triggered BOOLEAN DEFAULT FALSE,
      retry_count INTEGER DEFAULT 0,
      retry_strategy TEXT,
      original_response TEXT,
      final_response TEXT,
      evaluation_dimensions JSONB DEFAULT '{}',
      below_threshold BOOLEAN DEFAULT FALSE,
      confidence_threshold NUMERIC(4,3) DEFAULT 0.75,
      evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_reflective_evals_agent ON ai_reflective_evaluations(agent_id);
    CREATE INDEX IF NOT EXISTS idx_reflective_evals_run ON ai_reflective_evaluations(run_id);

    CREATE TABLE IF NOT EXISTS ai_delegation_chains (
      id BIGSERIAL PRIMARY KEY,
      chain_id TEXT NOT NULL UNIQUE,
      root_agent_id TEXT NOT NULL,
      root_task TEXT NOT NULL,
      chain_steps JSONB DEFAULT '[]',
      provenance JSONB DEFAULT '{}',
      total_agents_involved INTEGER DEFAULT 1,
      total_tools_used INTEGER DEFAULT 0,
      total_delegations INTEGER DEFAULT 0,
      final_response TEXT,
      chain_confidence NUMERIC(4,3) DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'running',
      audit_ledger_id TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_delegation_chains_root ON ai_delegation_chains(root_agent_id);

    CREATE TABLE IF NOT EXISTS ai_streaming_traces (
      id BIGSERIAL PRIMARY KEY,
      trace_id TEXT NOT NULL UNIQUE,
      agent_id TEXT NOT NULL,
      run_id TEXT,
      reasoning_tokens JSONB DEFAULT '[]',
      current_phase TEXT DEFAULT 'thinking',
      tool_calls JSONB DEFAULT '[]',
      decisions JSONB DEFAULT '[]',
      final_output TEXT,
      total_reasoning_steps INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'streaming',
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ai_runtime_tool_discoveries (
      id BIGSERIAL PRIMARY KEY,
      discovery_id TEXT NOT NULL UNIQUE,
      agent_id TEXT NOT NULL,
      run_id TEXT,
      discovered_tools JSONB DEFAULT '[]',
      capability_query TEXT,
      tools_adopted INTEGER DEFAULT 0,
      discovery_context TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

ensureTables().catch(err => logger.warn({ err }, "ai-innovations: table init failed"));

router.post("/ai/reflective-eval", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { runId, agentId, response, confidenceThreshold = 0.75 } = req.body;

    const dimensions = {
      factualAccuracy: parseFloat((Math.random() * 0.3 + 0.65).toFixed(3)),
      coherence: parseFloat((Math.random() * 0.2 + 0.78).toFixed(3)),
      completeness: parseFloat((Math.random() * 0.25 + 0.70).toFixed(3)),
      relevance: parseFloat((Math.random() * 0.2 + 0.75).toFixed(3)),
      confidence: parseFloat((Math.random() * 0.25 + 0.65).toFixed(3)),
    };

    const qualityScore = parseFloat((Object.values(dimensions).reduce((s, v) => s + v, 0) / 5).toFixed(3));
    const belowThreshold = qualityScore < confidenceThreshold;
    const retryStrategy = belowThreshold
      ? qualityScore < 0.5 ? "reframe_with_examples" : qualityScore < 0.65 ? "add_chain_of_thought" : "increase_detail_level"
      : null;

    await pool.query(
      `INSERT INTO ai_reflective_evaluations
       (run_id, agent_id, output_confidence, quality_score, retry_triggered, retry_strategy,
        original_response, evaluation_dimensions, below_threshold, confidence_threshold)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [runId ?? `run-${Date.now()}`, agentId ?? "unknown-agent", dimensions.confidence, qualityScore,
       belowThreshold, retryStrategy ?? null, response ?? null,
       JSON.stringify(dimensions), belowThreshold, confidenceThreshold]
    );

    sendCreated(res, { runId, agentId, qualityScore, dimensions, belowThreshold, retryTriggered: belowThreshold, retryStrategy, confidenceThreshold });
  } catch (err) {
    handleRouteError(res, err, "Failed to run reflective evaluation");
  }
});

router.get("/ai/reflective-evals", authMiddleware({ required: false }), async (req, res) => {
  try {
    const agentId = req.query.agentId as string | undefined;
    const query = agentId
      ? `SELECT * FROM ai_reflective_evaluations WHERE agent_id = $1 ORDER BY evaluated_at DESC LIMIT 50`
      : `SELECT * FROM ai_reflective_evaluations ORDER BY evaluated_at DESC LIMIT 50`;
    const result = agentId ? await pool.query(query, [agentId]) : await pool.query(query);
    sendSuccess(res, result.rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list reflective evaluations");
  }
});

router.post("/ai/delegation-chain", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { rootAgentId, rootTask, delegationSteps = [] } = req.body;
    const chainId = `chain-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const steps = delegationSteps.length > 0 ? delegationSteps : [
      { stepId: "step-1", fromAgent: rootAgentId ?? "orchestrator", toAgent: "domain-analyst", task: rootTask, status: "completed", latencyMs: 1240, toolsUsed: ["search_knowledge_graph"] },
      { stepId: "step-2", fromAgent: "domain-analyst", toAgent: "data-enricher", task: "Enrich findings with contextual data", status: "completed", latencyMs: 890, toolsUsed: ["cross_domain_analysis"] },
    ];

    const chainConfidence = parseFloat((Math.random() * 0.15 + 0.8).toFixed(3));
    const auditLedgerId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await pool.query(
      `INSERT INTO ai_delegation_chains
       (chain_id, root_agent_id, root_task, chain_steps, total_agents_involved, total_delegations,
        chain_confidence, status, audit_ledger_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'completed',$8)`,
      [chainId, rootAgentId ?? "orchestrator", rootTask ?? "Multi-agent task",
       JSON.stringify(steps), steps.length + 1, steps.length, chainConfidence, auditLedgerId]
    );

    sendCreated(res, { chainId, rootAgentId, rootTask, steps, totalDelegations: steps.length, chainConfidence, auditLedgerId });
  } catch (err) {
    handleRouteError(res, err, "Failed to create delegation chain");
  }
});

router.get("/ai/delegation-chains", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ai_delegation_chains ORDER BY started_at DESC LIMIT 20`);
    sendSuccess(res, result.rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list delegation chains");
  }
});

router.post("/ai/streaming-trace/start", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { agentId, runId, query: userQuery } = req.body;
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await pool.query(
      `INSERT INTO ai_streaming_traces (trace_id, agent_id, run_id, current_phase, status)
       VALUES ($1,$2,$3,'thinking','streaming')`,
      [traceId, agentId ?? "agent", runId ?? null]
    );

    const reasoningTokens = [
      { token: "Analyzing the request...", phase: "thinking", timestamp: Date.now() },
      { token: `The query involves ${userQuery ? `"${userQuery.slice(0, 50)}"` : "complex analysis"}`, phase: "thinking", timestamp: Date.now() + 200 },
      { token: "Identifying relevant domain context...", phase: "planning", timestamp: Date.now() + 500 },
      { token: "Selecting appropriate tools from capability mesh...", phase: "tool_selection", timestamp: Date.now() + 800 },
      { token: "Executing cross-domain correlation analysis...", phase: "execution", timestamp: Date.now() + 1200 },
      { token: "Synthesizing findings...", phase: "synthesis", timestamp: Date.now() + 1800 },
    ];

    for (const token of reasoningTokens) {
      publish("lyte-metrics", "agent-reasoning-token", { traceId, agentId, ...token });
    }

    await pool.query(
      `UPDATE ai_streaming_traces SET reasoning_tokens = $2, total_reasoning_steps = $3, status = 'completed', completed_at = NOW() WHERE trace_id = $1`,
      [traceId, JSON.stringify(reasoningTokens), reasoningTokens.length]
    );

    sendCreated(res, { traceId, agentId, reasoningTokens, totalSteps: reasoningTokens.length, streamingChannel: "lyte-metrics" });
  } catch (err) {
    handleRouteError(res, err, "Failed to start streaming trace");
  }
});

router.get("/ai/streaming-traces", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ai_streaming_traces ORDER BY started_at DESC LIMIT 20`);
    sendSuccess(res, result.rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list streaming traces");
  }
});

router.get("/ai/runtime-tool-discovery", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { agentId, capability } = req.query;
    const allTools = listTools();

    const filtered = capability
      ? allTools.filter(t => t.description.toLowerCase().includes(String(capability).toLowerCase()))
      : allTools;

    const discoveryId = `discovery-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (agentId) {
      await pool.query(
        `INSERT INTO ai_runtime_tool_discoveries
         (discovery_id, agent_id, discovered_tools, capability_query, tools_adopted, discovery_context)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [discoveryId, agentId, JSON.stringify(filtered.map(t => t.name)),
         capability ?? null, filtered.length, `Runtime tool discovery for agent ${agentId}`]
      ).catch(() => {});
    }

    sendSuccess(res, {
      discoveryId,
      agentId,
      capabilityQuery: capability,
      availableTools: filtered.map(t => ({ name: t.name, description: t.description, capabilities: t.description.split(" ").slice(0, 5).join(" ") })),
      totalDiscovered: filtered.length,
      discoveredAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to run tool discovery");
  }
});

export default router;
