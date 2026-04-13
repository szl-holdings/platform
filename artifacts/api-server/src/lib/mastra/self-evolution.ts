import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";

export interface StrategyProfile {
  profileId: string;
  agentId: string;
  version: number;
  systemPromptVariant: string;
  toolSelectionHints: string[];
  planningStrategy: string;
  avgSuccessRate: number;
  sampleCount: number;
  status: "active" | "testing" | "proposed" | "archived";
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvolutionOutcome {
  runId: string;
  agentId: string;
  profileId: string;
  successScore: number;
  latencyMs: number;
  toolsUsed: string[];
  feedbackSignals: Record<string, number>;
  recordedAt: string;
}

export interface PromptRefinement {
  originalPrompt: string;
  refinedPrompt: string;
  rationale: string;
  expectedImprovement: string;
  confidence: number;
}

export async function ensureSelfEvolutionTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_strategy_profiles (
        id BIGSERIAL PRIMARY KEY,
        profile_id TEXT NOT NULL UNIQUE,
        agent_id TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        system_prompt_variant TEXT NOT NULL,
        tool_selection_hints JSONB DEFAULT '[]',
        planning_strategy TEXT NOT NULL DEFAULT 'react',
        avg_success_rate FLOAT NOT NULL DEFAULT 0,
        sample_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'proposed',
        approved_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_evolution_outcomes (
        id BIGSERIAL PRIMARY KEY,
        run_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        profile_id TEXT,
        success_score FLOAT NOT NULL DEFAULT 0,
        latency_ms INTEGER NOT NULL DEFAULT 0,
        tools_used JSONB DEFAULT '[]',
        feedback_signals JSONB DEFAULT '{}',
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_strategy_profiles_agent ON agent_strategy_profiles(agent_id, status);
      CREATE INDEX IF NOT EXISTS idx_evolution_outcomes_agent ON agent_evolution_outcomes(agent_id, recorded_at);
    `);

    logger.info("Self-evolution tables ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure self-evolution tables");
  }
}

export async function recordOutcome(outcome: Omit<EvolutionOutcome, "recordedAt">): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO agent_evolution_outcomes (run_id, agent_id, profile_id, success_score, latency_ms, tools_used, feedback_signals, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        outcome.runId, outcome.agentId, outcome.profileId,
        outcome.successScore, outcome.latencyMs,
        JSON.stringify(outcome.toolsUsed),
        JSON.stringify(outcome.feedbackSignals),
      ]
    );
  } catch (err) {
    logger.error({ err }, "Failed to record evolution outcome");
  }
}

export async function getActiveStrategyProfile(agentId: string): Promise<StrategyProfile | null> {
  try {
    const result = await pool.query(
      `SELECT * FROM agent_strategy_profiles
       WHERE agent_id = $1 AND status = 'active'
       ORDER BY avg_success_rate DESC, version DESC LIMIT 1`,
      [agentId]
    );

    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return {
      profileId: r.profile_id, agentId: r.agent_id, version: r.version,
      systemPromptVariant: r.system_prompt_variant,
      toolSelectionHints: r.tool_selection_hints || [],
      planningStrategy: r.planning_strategy,
      avgSuccessRate: r.avg_success_rate,
      sampleCount: r.sample_count,
      status: r.status, approvedBy: r.approved_by,
      createdAt: r.created_at, updatedAt: r.updated_at,
    };
  } catch {
    return null;
  }
}

export async function listStrategyProfiles(agentId?: string): Promise<StrategyProfile[]> {
  try {
    const params: any[] = [];
    let query = `SELECT * FROM agent_strategy_profiles`;
    if (agentId) {
      query += ` WHERE agent_id = $1`;
      params.push(agentId);
    }
    query += ` ORDER BY updated_at DESC LIMIT 50`;

    const result = await pool.query(query, params);
    return result.rows.map((r: any) => ({
      profileId: r.profile_id, agentId: r.agent_id, version: r.version,
      systemPromptVariant: r.system_prompt_variant,
      toolSelectionHints: r.tool_selection_hints || [],
      planningStrategy: r.planning_strategy,
      avgSuccessRate: r.avg_success_rate,
      sampleCount: r.sample_count,
      status: r.status, approvedBy: r.approved_by,
      createdAt: r.created_at, updatedAt: r.updated_at,
    }));
  } catch {
    return [];
  }
}

export async function proposePromptRefinement(
  agentId: string,
  currentPrompt: string,
  recentOutcomes: EvolutionOutcome[]
): Promise<PromptRefinement | null> {
  if (recentOutcomes.length < 5) return null;

  const avgScore = recentOutcomes.reduce((s, o) => s + o.successScore, 0) / recentOutcomes.length;
  if (avgScore > 0.85) return null;

  const failingPatterns = recentOutcomes
    .filter(o => o.successScore < 0.6)
    .flatMap(o => Object.entries(o.feedbackSignals)
      .filter(([, v]) => v < 0.5)
      .map(([k]) => k)
    );

  try {
    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are an expert AI prompt engineer. Analyze the agent's performance data and propose a refined system prompt that addresses weak areas.
Return JSON:
{
  "refinedPrompt": "improved system prompt",
  "rationale": "what was changed and why",
  "expectedImprovement": "what metric should improve",
  "confidence": 0.0-1.0
}`,
        },
        {
          role: "user",
          content: `Agent: ${agentId}
Current prompt (first 500 chars): ${currentPrompt.slice(0, 500)}
Average success rate: ${avgScore.toFixed(2)}
Failing areas: ${[...new Set(failingPatterns)].slice(0, 5).join(", ")}
Recent run count: ${recentOutcomes.length}

Propose an improvement:`,
        },
      ],
      maxTokens: 1000,
      strategy: "preferred",
    });

    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        originalPrompt: currentPrompt,
        refinedPrompt: parsed.refinedPrompt || currentPrompt,
        rationale: parsed.rationale || "",
        expectedImprovement: parsed.expectedImprovement || "",
        confidence: parsed.confidence ?? 0.6,
      };
    }
  } catch (err) {
    logger.error({ err }, "Failed to generate prompt refinement");
  }

  return null;
}

export async function saveProposedProfile(
  agentId: string,
  currentPrompt: string,
  refinement: PromptRefinement,
  planningStrategy: string = "react"
): Promise<StrategyProfile> {
  const profileId = `prof_${agentId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const existingVersion = await pool.query(
    `SELECT MAX(version) as max_ver FROM agent_strategy_profiles WHERE agent_id = $1`,
    [agentId]
  ).then(r => r.rows[0]?.max_ver ?? 0).catch(() => 0);

  await pool.query(
    `INSERT INTO agent_strategy_profiles
     (profile_id, agent_id, version, system_prompt_variant, planning_strategy, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'proposed', NOW(), NOW())`,
    [profileId, agentId, parseInt(existingVersion) + 1, refinement.refinedPrompt, planningStrategy]
  );

  return {
    profileId, agentId, version: parseInt(existingVersion) + 1,
    systemPromptVariant: refinement.refinedPrompt,
    toolSelectionHints: [],
    planningStrategy,
    avgSuccessRate: 0, sampleCount: 0,
    status: "proposed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function approveStrategyProfile(profileId: string, approvedBy: string): Promise<void> {
  const profile = await pool.query(
    "SELECT agent_id FROM agent_strategy_profiles WHERE profile_id = $1",
    [profileId]
  );
  if (profile.rows.length === 0) throw new Error(`Profile ${profileId} not found`);

  const agentId = profile.rows[0].agent_id;

  await pool.query(
    "UPDATE agent_strategy_profiles SET status = 'archived', updated_at = NOW() WHERE agent_id = $1 AND status = 'active'",
    [agentId]
  );

  await pool.query(
    "UPDATE agent_strategy_profiles SET status = 'active', approved_by = $2, updated_at = NOW() WHERE profile_id = $1",
    [profileId, approvedBy]
  );

  logger.info({ profileId, approvedBy }, "Strategy profile approved and activated");
}

export async function updateProfileMetrics(
  agentId: string,
  successScore: number
): Promise<void> {
  try {
    await pool.query(
      `UPDATE agent_strategy_profiles
       SET avg_success_rate = (avg_success_rate * sample_count + $2) / (sample_count + 1),
           sample_count = sample_count + 1,
           updated_at = NOW()
       WHERE agent_id = $1 AND status = 'active'`,
      [agentId, successScore]
    );
  } catch {}
}

export async function getRecentOutcomes(agentId: string, limit = 20): Promise<EvolutionOutcome[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM agent_evolution_outcomes WHERE agent_id = $1 ORDER BY recorded_at DESC LIMIT $2`,
      [agentId, limit]
    );
    return result.rows.map((r: any) => ({
      runId: r.run_id, agentId: r.agent_id, profileId: r.profile_id,
      successScore: r.success_score, latencyMs: r.latency_ms,
      toolsUsed: r.tools_used || [], feedbackSignals: r.feedback_signals || {},
      recordedAt: r.recorded_at,
    }));
  } catch {
    return [];
  }
}
