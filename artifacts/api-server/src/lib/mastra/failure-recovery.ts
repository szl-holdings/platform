import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";

export type FailureType = "transient" | "structural" | "data" | "permission" | "timeout" | "unknown";

export interface FailureDiagnosis {
  failureType: FailureType;
  rootCause: string;
  isRecoverable: boolean;
  recoveryStrategy: "retry" | "replan" | "delegate" | "abort" | "fallback";
  alternativePlan?: string;
  confidence: number;
}

export interface RecoveryAttempt {
  attemptId: string;
  runId: string;
  agentId: string;
  originalError: string;
  diagnosis: FailureDiagnosis;
  recoveryPlan: string;
  status: "pending" | "executing" | "succeeded" | "failed";
  result?: string;
  createdAt: string;
  completedAt?: string;
}

export interface RecoveryPattern {
  patternId: string;
  agentId: string;
  errorPattern: string;
  failureType: FailureType;
  successfulStrategy: string;
  occurrenceCount: number;
  successRate: number;
}

export async function ensureFailureRecoveryTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_recovery_attempts (
        id BIGSERIAL PRIMARY KEY,
        attempt_id TEXT NOT NULL UNIQUE,
        run_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        original_error TEXT NOT NULL,
        diagnosis JSONB NOT NULL DEFAULT '{}',
        recovery_plan TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        result TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_recovery_patterns (
        id BIGSERIAL PRIMARY KEY,
        pattern_id TEXT NOT NULL UNIQUE,
        agent_id TEXT NOT NULL,
        error_pattern TEXT NOT NULL,
        failure_type TEXT NOT NULL,
        successful_strategy TEXT NOT NULL,
        occurrence_count INTEGER NOT NULL DEFAULT 1,
        success_rate FLOAT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_recovery_attempts_run ON agent_recovery_attempts(run_id, status);
      CREATE INDEX IF NOT EXISTS idx_recovery_patterns_agent ON agent_recovery_patterns(agent_id);
    `);

    logger.info("Failure recovery tables ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure failure recovery tables");
  }
}

function classifyFailureHeuristic(error: string): FailureType {
  const errLower = error.toLowerCase();
  if (errLower.includes("timeout") || errLower.includes("timed out") || errLower.includes("deadline")) return "transient";
  if (errLower.includes("rate limit") || errLower.includes("429") || errLower.includes("quota")) return "transient";
  if (errLower.includes("permission") || errLower.includes("unauthorized") || errLower.includes("403") || errLower.includes("forbidden")) return "permission";
  if (errLower.includes("not found") || errLower.includes("does not exist") || errLower.includes("404")) return "data";
  if (errLower.includes("validation") || errLower.includes("invalid input") || errLower.includes("schema")) return "structural";
  if (errLower.includes("network") || errLower.includes("connection") || errLower.includes("econnrefused")) return "transient";
  return "unknown";
}

export async function diagnoseFailure(
  error: string,
  originalQuery: string,
  agentId: string,
  toolsAttempted: string[]
): Promise<FailureDiagnosis> {
  const heuristicType = classifyFailureHeuristic(error);

  const knownPattern = await findMatchingPattern(agentId, error);
  if (knownPattern) {
    logger.info({ agentId, patternId: knownPattern.patternId }, "Matched known recovery pattern");
    return {
      failureType: knownPattern.failureType,
      rootCause: `Known pattern: ${knownPattern.errorPattern}`,
      isRecoverable: knownPattern.successRate > 0.3,
      recoveryStrategy: knownPattern.successfulStrategy as any,
      confidence: 0.85,
    };
  }

  try {
    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are an AI failure diagnosis expert. Analyze this agent execution failure and provide recovery guidance.
Respond with JSON:
{
  "failureType": "transient"|"structural"|"data"|"permission"|"timeout"|"unknown",
  "rootCause": "specific cause of failure",
  "isRecoverable": true|false,
  "recoveryStrategy": "retry"|"replan"|"delegate"|"abort"|"fallback",
  "alternativePlan": "optional: different approach to try",
  "confidence": 0.0-1.0
}

Recovery strategies:
- retry: transient errors (rate limits, timeouts) → wait and retry
- replan: structural failure → reformulate the approach entirely
- delegate: out-of-scope → route to appropriate agent
- fallback: use simpler alternative tool/method
- abort: permission or fundamental constraint → inform user`,
        },
        {
          role: "user",
          content: `Agent: ${agentId}
Original query: ${originalQuery.slice(0, 300)}
Error: ${error}
Tools attempted: ${toolsAttempted.join(", ")}
Initial classification: ${heuristicType}`,
        },
      ],
      maxTokens: 400,
      strategy: "cheapest",
    });

    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        failureType: parsed.failureType || heuristicType,
        rootCause: parsed.rootCause || error.slice(0, 200),
        isRecoverable: parsed.isRecoverable ?? true,
        recoveryStrategy: parsed.recoveryStrategy || "replan",
        alternativePlan: parsed.alternativePlan,
        confidence: parsed.confidence ?? 0.6,
      };
    }
  } catch {}

  const isRecoverable = heuristicType !== "permission";
  return {
    failureType: heuristicType,
    rootCause: error.slice(0, 200),
    isRecoverable,
    recoveryStrategy: heuristicType === "transient" ? "retry" : heuristicType === "data" ? "fallback" : "replan",
    confidence: 0.5,
  };
}

export async function generateRecoveryPlan(
  originalQuery: string,
  diagnosis: FailureDiagnosis,
  systemContext: string,
  failedTools: string[]
): Promise<string> {
  if (!diagnosis.isRecoverable) {
    return `Unable to recover: ${diagnosis.rootCause}. Please verify permissions or rephrase the request.`;
  }

  if (diagnosis.alternativePlan) {
    return diagnosis.alternativePlan;
  }

  try {
    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: systemContext + `\n\nYou are recovering from an execution failure. Generate an alternative approach that avoids the failed path.`,
        },
        {
          role: "user",
          content: `Original request: ${originalQuery}
Failure: ${diagnosis.rootCause}
Strategy: ${diagnosis.recoveryStrategy}
Failed tools to avoid: ${failedTools.join(", ")}

Generate an alternative plan to fulfill the request:`,
        },
      ],
      maxTokens: 600,
      strategy: "preferred",
    });
    return response.content;
  } catch {
    return `Alternative approach: ${diagnosis.recoveryStrategy === "replan" ? "Reformulating the request with different parameters" : "Using fallback method to address the query"}`;
  }
}

export async function recordRecoveryAttempt(
  runId: string,
  agentId: string,
  error: string,
  diagnosis: FailureDiagnosis,
  recoveryPlan: string
): Promise<RecoveryAttempt> {
  const attemptId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  await pool.query(
    `INSERT INTO agent_recovery_attempts
     (attempt_id, run_id, agent_id, original_error, diagnosis, recovery_plan, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
    [attemptId, runId, agentId, error, JSON.stringify(diagnosis), recoveryPlan]
  ).catch(err => logger.error({ err }, "Failed to record recovery attempt"));

  return {
    attemptId, runId, agentId, originalError: error,
    diagnosis, recoveryPlan, status: "pending",
    createdAt: new Date().toISOString(),
  };
}

export async function updateRecoveryOutcome(
  attemptId: string,
  status: "succeeded" | "failed",
  result?: string
): Promise<void> {
  try {
    await pool.query(
      `UPDATE agent_recovery_attempts SET status = $2, result = $3, completed_at = NOW() WHERE attempt_id = $1`,
      [attemptId, status, result]
    );

    const attempt = await pool.query(
      "SELECT * FROM agent_recovery_attempts WHERE attempt_id = $1",
      [attemptId]
    );

    if (attempt.rows.length > 0) {
      const row = attempt.rows[0];
      const diagnosis: FailureDiagnosis = row.diagnosis;
      await learnRecoveryPattern(
        row.agent_id, row.original_error, diagnosis.failureType,
        diagnosis.recoveryStrategy, status === "succeeded"
      );
    }
  } catch (err) {
    logger.error({ err }, "Failed to update recovery outcome");
  }
}

async function learnRecoveryPattern(
  agentId: string,
  error: string,
  failureType: FailureType,
  strategy: string,
  succeeded: boolean
): Promise<void> {
  const errorPattern = error.slice(0, 100).replace(/\d+/g, "N").replace(/['"]/g, "");
  const patternId = `pat_${agentId}_${Buffer.from(errorPattern).toString("base64").slice(0, 20)}`;

  try {
    await pool.query(
      `INSERT INTO agent_recovery_patterns
       (pattern_id, agent_id, error_pattern, failure_type, successful_strategy, occurrence_count, success_rate, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 1, $6, NOW(), NOW())
       ON CONFLICT (pattern_id) DO UPDATE SET
         occurrence_count = agent_recovery_patterns.occurrence_count + 1,
         success_rate = (agent_recovery_patterns.success_rate * agent_recovery_patterns.occurrence_count + $6) / (agent_recovery_patterns.occurrence_count + 1),
         updated_at = NOW()`,
      [patternId, agentId, errorPattern, failureType, strategy, succeeded ? 1.0 : 0.0]
    );
  } catch {}
}

async function findMatchingPattern(agentId: string, error: string): Promise<RecoveryPattern | null> {
  try {
    const errorPattern = error.slice(0, 100).replace(/\d+/g, "N").replace(/['"]/g, "");
    const result = await pool.query(
      `SELECT * FROM agent_recovery_patterns
       WHERE agent_id = $1 AND error_pattern ILIKE '%' || $2 || '%'
       ORDER BY success_rate DESC, occurrence_count DESC LIMIT 1`,
      [agentId, errorPattern.slice(0, 30)]
    );
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return {
      patternId: r.pattern_id, agentId: r.agent_id, errorPattern: r.error_pattern,
      failureType: r.failure_type, successfulStrategy: r.successful_strategy,
      occurrenceCount: r.occurrence_count, successRate: r.success_rate,
    };
  } catch {
    return null;
  }
}

export async function getRecoveryHistory(
  agentId: string,
  limit = 20
): Promise<RecoveryAttempt[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM agent_recovery_attempts WHERE agent_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [agentId, limit]
    );
    return result.rows.map((r: any) => ({
      attemptId: r.attempt_id, runId: r.run_id, agentId: r.agent_id,
      originalError: r.original_error, diagnosis: r.diagnosis,
      recoveryPlan: r.recovery_plan, status: r.status,
      result: r.result, createdAt: r.created_at, completedAt: r.completed_at,
    }));
  } catch {
    return [];
  }
}
