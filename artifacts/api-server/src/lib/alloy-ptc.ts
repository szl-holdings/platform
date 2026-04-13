import { pool } from "@szl-holdings/db";
import { gatewayInfer } from "./ai-gateway";
import { logger } from "./logger";
import { executeTool, listTools } from "./mastra/tool-registry";
import { makeProgrammaticContext } from "./alloy-execution-context";

export interface PtcScript {
  scriptId: string;
  agentId: string;
  taskDescription: string;
  generatedCode: string;
  toolsUsed: string[];
  status: "pending" | "executing" | "completed" | "failed";
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
  roundTripsEliminated: number;
  tokensUsed: number;
  latencyMs: number;
  invokerType: "direct" | "programmatic";
  createdAt: string;
  completedAt?: string;
}

export interface PtcStep {
  stepId: string;
  tool: string;
  inputs: Record<string, unknown>;
  dependsOn: string[];
  description: string;
}

export interface PtcExecutionPlan {
  steps: PtcStep[];
  parallelizable: string[][];
  estimatedRoundTrips: number;
  optimizedRoundTrips: number;
}

async function ensurePtcTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alloy_ptc_scripts (
      script_id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      task_description TEXT NOT NULL,
      generated_code TEXT NOT NULL,
      tools_used TEXT[] NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      inputs JSONB NOT NULL DEFAULT '{}',
      outputs JSONB,
      error TEXT,
      round_trips_eliminated INT NOT NULL DEFAULT 0,
      tokens_used INT NOT NULL DEFAULT 0,
      latency_ms INT NOT NULL DEFAULT 0,
      invoker_type TEXT NOT NULL DEFAULT 'programmatic',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_ptc_agent ON alloy_ptc_scripts(agent_id);
    CREATE INDEX IF NOT EXISTS idx_ptc_status ON alloy_ptc_scripts(status);
    ALTER TABLE alloy_ptc_scripts ADD COLUMN IF NOT EXISTS caller_id TEXT;
    ALTER TABLE alloy_ptc_scripts ADD COLUMN IF NOT EXISTS caller_type TEXT;
  `);
}

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  try { await ensurePtcTables(); tablesEnsured = true; } catch (err) {
    logger.warn({ err }, "PTC table ensure failed");
  }
}

export async function generatePtcScript(params: {
  agentId: string;
  taskDescription: string;
  availableTools: string[];
  inputs: Record<string, unknown>;
  callerId?: string;
  callerType?: string;
}): Promise<{ scriptId: string; plan: PtcExecutionPlan; generatedCode: string }> {
  await ensureTables();
  const startTime = Date.now();
  const scriptId = `ptc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const toolListStr = params.availableTools.slice(0, 20).join(", ");

  let response: { content: string; usage?: { totalTokens?: number } } | undefined;
  try {
    response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are a programmatic tool calling (PTC) code generator. Given a task and available tools, generate an execution plan that minimizes round-trips by batching independent tool calls.

Return ONLY valid JSON:
{
  "plan": {
    "steps": [
      {"stepId":"s1","tool":"tool_name","inputs":{},"dependsOn":[],"description":"what this does"}
    ],
    "parallelizable": [["s1","s2"],["s3"]],
    "estimatedRoundTrips": 5,
    "optimizedRoundTrips": 2
  },
  "code": "// TypeScript pseudocode showing the execution sequence\n// Step 1: Run in parallel...\n"
}

IMPORTANT: Every step in "steps" must appear in exactly one group in "parallelizable". Steps with no dependencies go in the first group; steps that depend on earlier groups go in later groups.
Available tools: ${toolListStr}
Prioritize parallel execution of independent steps. Eliminate redundant API calls.`,
        },
        {
          role: "user",
          content: `Task: ${params.taskDescription}\nInputs: ${JSON.stringify(params.inputs)}`,
        },
      ],
      maxTokens: 1500,
      strategy: "preferred",
    });
  } catch (err) {
    logger.warn({ err }, "PTC script generation failed");
    const fallbackPlan: PtcExecutionPlan = {
      steps: [],
      parallelizable: [],
      estimatedRoundTrips: params.availableTools.length,
      optimizedRoundTrips: Math.ceil(params.availableTools.length / 3),
    };
    return { scriptId, plan: fallbackPlan, generatedCode: `// PTC generation unavailable` };
  }

  let plan: PtcExecutionPlan = { steps: [], parallelizable: [], estimatedRoundTrips: 5, optimizedRoundTrips: 2 };
  let generatedCode = "";

  try {
    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      plan = parsed.plan || plan;
      generatedCode = parsed.code || "";
    }
  } catch (err) {
    logger.warn({ err }, "Failed to parse PTC plan JSON");
    generatedCode = response.content;
  }

  // Guarantee every step is scheduled: add any missing steps as a sequential tail group
  const scheduledStepIds = new Set(plan.parallelizable.flat());
  const unscheduledSteps = plan.steps.filter(s => !scheduledStepIds.has(s.stepId));
  for (const step of unscheduledSteps) {
    logger.info({ stepId: step.stepId }, "PTC: added unscheduled step to sequential tail");
    plan.parallelizable.push([step.stepId]);
  }

  const latencyMs = Date.now() - startTime;

  try {
    await pool.query(
      `INSERT INTO alloy_ptc_scripts (script_id, agent_id, task_description, generated_code, tools_used, status, inputs, tokens_used, latency_ms, invoker_type, caller_id, caller_type)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, 'programmatic', $9, $10)`,
      [scriptId, params.agentId, params.taskDescription, generatedCode,
       plan.steps.map(s => s.tool), JSON.stringify(params.inputs),
       response?.usage?.totalTokens ?? 0, latencyMs, params.callerId ?? null, params.callerType ?? null]
    );
  } catch (err) {
    logger.warn({ err }, "Failed to persist PTC script");
  }

  return { scriptId, plan, generatedCode };
}

export async function executePtcPlan(params: {
  scriptId: string;
  agentId: string;
  plan: PtcExecutionPlan;
  inputs: Record<string, unknown>;
  agentContext?: Record<string, unknown>;
  callerId?: string;
  callerType?: string;
}): Promise<{
  outputs: Record<string, unknown>;
  toolsExecuted: string[];
  roundTripsUsed: number;
  latencyMs: number;
  errors: Array<{ stepId: string; error: string }>;
}> {
  const startTime = Date.now();
  const stepResults: Record<string, unknown> = {};
  const toolsExecuted: string[] = [];
  const errors: Array<{ stepId: string; error: string }> = [];

  try {
    await pool.query(
      `UPDATE alloy_ptc_scripts SET status = 'executing', caller_id = COALESCE(caller_id, $2), caller_type = COALESCE(caller_type, $3)
       WHERE script_id = $1`,
      [params.scriptId, params.callerId ?? null, params.callerType ?? null]
    );
  } catch (err) {
    logger.warn({ err }, "Failed to mark PTC script as executing");
  }

  // Build allowlist from registered tools only — no arbitrary tool names from the request
  const registeredToolNames = new Set(listTools().map(t => t.name));

  // Build a proper AgentExecutionContext (not an empty object) so executeTool can
  // call emitTrace and other lifecycle methods without throwing
  const execContext = makeProgrammaticContext({
    agentId: params.agentId,
    runId: params.scriptId,
    domain: "alloy",
    threadId: params.scriptId,
    metadata: { scriptId: params.scriptId, ...(params.agentContext ?? {}) },
  });

  const stepMap = new Map(params.plan.steps.map(s => [s.stepId, s]));
  const completed = new Set<string>();
  let roundTripsUsed = 0;

  // Guarantee every step is scheduled: collect any step IDs not in parallelizable groups
  const scheduledIds = new Set(params.plan.parallelizable.flat());
  const allGroups = [...params.plan.parallelizable];
  // Add any steps not present in any group as sequential tail entries
  for (const step of params.plan.steps) {
    if (!scheduledIds.has(step.stepId)) {
      logger.warn({ stepId: step.stepId }, "PTC executor: found unscheduled step, appending as tail");
      allGroups.push([step.stepId]);
    }
  }

  for (const parallelGroup of allGroups) {
    // Only run steps whose dependencies are satisfied
    const readySteps = parallelGroup.filter(stepId => {
      const step = stepMap.get(stepId);
      if (!step) {
        logger.warn({ stepId }, "PTC executor: step in parallelizable group not found in steps list");
        return false;
      }
      return step.dependsOn.every(dep => completed.has(dep));
    });

    if (readySteps.length === 0) continue;

    roundTripsUsed++;

    const groupResults = await Promise.allSettled(
      readySteps.map(async (stepId) => {
        const step = stepMap.get(stepId)!;
        const resolvedInputs = resolveStepInputs(step.inputs, stepResults, params.inputs);

        if (!registeredToolNames.has(step.tool)) {
          throw new Error(`Tool "${step.tool}" is not in the registered tool allowlist`);
        }

        toolsExecuted.push(step.tool);
        logger.info({ stepId, tool: step.tool, scriptId: params.scriptId }, "PTC: executing step");

        const result = await executeTool(step.tool, resolvedInputs, execContext);
        return { stepId, result: (result as { output?: unknown }).output ?? result };
      })
    );

    for (let i = 0; i < groupResults.length; i++) {
      const stepId = readySteps[i];
      const result = groupResults[i];
      if (result.status === "fulfilled") {
        stepResults[stepId] = result.value.result;
        completed.add(stepId);
        logger.info({ stepId }, "PTC: step completed");
      } else {
        const errMsg = (result.reason as Error)?.message ?? "Unknown error";
        errors.push({ stepId, error: errMsg });
        logger.warn({ stepId, error: errMsg }, "PTC: step failed");
        completed.add(stepId); // Mark as done so dependents can still try
      }
    }
  }

  const latencyMs = Date.now() - startTime;
  const outputs = { stepResults, summary: `Executed ${toolsExecuted.length} tools in ${roundTripsUsed} round-trips, ${errors.length} error(s)` };

  try {
    await pool.query(
      `UPDATE alloy_ptc_scripts SET status = $1, outputs = $2, round_trips_eliminated = $3, latency_ms = $4, completed_at = NOW()
       WHERE script_id = $5`,
      [
        errors.length === 0 ? "completed" : "failed",
        JSON.stringify(outputs),
        Math.max(0, params.plan.estimatedRoundTrips - roundTripsUsed),
        latencyMs,
        params.scriptId,
      ]
    );
  } catch (err) {
    logger.warn({ err }, "Failed to update PTC script completion record");
  }

  return { outputs, toolsExecuted, roundTripsUsed, latencyMs, errors };
}

function resolveStepInputs(
  stepInputs: Record<string, unknown>,
  stepResults: Record<string, unknown>,
  globalInputs: Record<string, unknown>
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(stepInputs)) {
    if (typeof value === "string" && value.startsWith("$step.")) {
      const [, stepId, ...path] = value.split(".");
      let v: unknown = stepResults[stepId];
      for (const p of path) {
        v = (v as Record<string, unknown>)?.[p];
      }
      resolved[key] = v;
    } else if (typeof value === "string" && value.startsWith("$input.")) {
      const [, ...path] = value.split(".");
      let v: unknown = globalInputs;
      for (const p of path) {
        v = (v as Record<string, unknown>)?.[p];
      }
      resolved[key] = v;
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

export async function listPtcScripts(params: {
  agentId?: string;
  status?: string;
  limit?: number;
}): Promise<PtcScript[]> {
  await ensureTables();
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.agentId) { conditions.push(`agent_id = $${idx++}`); values.push(params.agentId); }
  if (params.status) { conditions.push(`status = $${idx++}`); values.push(params.status); }
  values.push(params.limit ?? 20);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const { rows } = await pool.query(
      `SELECT * FROM alloy_ptc_scripts ${where} ORDER BY created_at DESC LIMIT $${idx}`,
      values
    );
    return rows.map(r => ({
      scriptId: r.script_id,
      agentId: r.agent_id,
      taskDescription: r.task_description,
      generatedCode: r.generated_code,
      toolsUsed: r.tools_used || [],
      status: r.status,
      inputs: r.inputs || {},
      outputs: r.outputs,
      error: r.error,
      roundTripsEliminated: r.round_trips_eliminated || 0,
      tokensUsed: r.tokens_used || 0,
      latencyMs: r.latency_ms || 0,
      invokerType: r.invoker_type,
      createdAt: r.created_at?.toISOString() ?? "",
      completedAt: r.completed_at?.toISOString(),
    }));
  } catch (err) {
    logger.warn({ err }, "Failed to list PTC scripts");
    return [];
  }
}

export async function getPtcStats(): Promise<{
  totalScripts: number;
  totalRoundTripsEliminated: number;
  avgOptimizationRatio: number;
  toolUsageRanking: Array<{ tool: string; count: number }>;
}> {
  try {
    const [scripts, tools] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total, COALESCE(SUM(round_trips_eliminated), 0) as saved FROM alloy_ptc_scripts WHERE status = 'completed'`),
      pool.query(`SELECT unnest(tools_used) as tool, COUNT(*) as cnt FROM alloy_ptc_scripts GROUP BY tool ORDER BY cnt DESC LIMIT 10`),
    ]);

    const total = parseInt(scripts.rows[0]?.total ?? "0");
    const saved = parseInt(scripts.rows[0]?.saved ?? "0");

    return {
      totalScripts: total,
      totalRoundTripsEliminated: saved,
      avgOptimizationRatio: total > 0 ? saved / total : 0,
      toolUsageRanking: tools.rows.map(r => ({ tool: r.tool, count: parseInt(r.cnt) })),
    };
  } catch (err) {
    logger.warn({ err }, "Failed to fetch PTC stats");
    return { totalScripts: 0, totalRoundTripsEliminated: 0, avgOptimizationRatio: 0, toolUsageRanking: [] };
  }
}
