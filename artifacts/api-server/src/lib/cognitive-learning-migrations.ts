/**
 * Ensure cognitive learning tables exist.
 *
 * These tables were designed alongside the Alloy cognitive learning layer
 * (Task #456). The ensure function is idempotent and safe to run on every
 * startup — it uses CREATE TABLE IF NOT EXISTS so existing data is preserved.
 */
import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

const IDEMPOTENT_ERROR_FRAGMENTS = [
  "already exists",
  "duplicate column",
  "duplicate key value",
];

function isIdempotentError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return IDEMPOTENT_ERROR_FRAGMENTS.some(f => msg.includes(f));
}

const DDL_STATEMENTS = [
  `
  CREATE TABLE IF NOT EXISTS alloy_evidence_index (
    id TEXT PRIMARY KEY,
    case_id TEXT,
    incident_id TEXT,
    source TEXT NOT NULL,
    source_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    freshness TEXT NOT NULL DEFAULT 'current',
    entry_timestamp TEXT,
    object_id TEXT,
    relevance_boost REAL NOT NULL DEFAULT 1.0,
    embedding JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
  `,
  `CREATE INDEX IF NOT EXISTS idx_alloy_evidence_case ON alloy_evidence_index (case_id)`,
  `CREATE INDEX IF NOT EXISTS idx_alloy_evidence_incident ON alloy_evidence_index (incident_id)`,
  `CREATE INDEX IF NOT EXISTS idx_alloy_evidence_updated ON alloy_evidence_index (updated_at DESC)`,

  `
  CREATE TABLE IF NOT EXISTS alloy_case_memory (
    id SERIAL PRIMARY KEY,
    case_id TEXT NOT NULL UNIQUE,
    snapshot JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
  `,
  `CREATE INDEX IF NOT EXISTS idx_alloy_case_memory_case ON alloy_case_memory (case_id)`,

  `
  CREATE TABLE IF NOT EXISTS alloy_conversation_summaries (
    id SERIAL PRIMARY KEY,
    conversation_id TEXT NOT NULL UNIQUE,
    agent_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    topics TEXT[] NOT NULL DEFAULT '{}',
    message_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
  `,
  `CREATE INDEX IF NOT EXISTS idx_alloy_conv_agent ON alloy_conversation_summaries (agent_id, created_at DESC)`,

  `
  CREATE TABLE IF NOT EXISTS alloy_outcome_learning (
    id SERIAL PRIMARY KEY,
    decision_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    outcome TEXT NOT NULL,
    original_action TEXT NOT NULL,
    final_action TEXT,
    original_confidence REAL NOT NULL,
    topic TEXT NOT NULL,
    topic_keywords TEXT[] NOT NULL DEFAULT '{}',
    override_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
  `,
  `CREATE INDEX IF NOT EXISTS idx_alloy_outcome_agent ON alloy_outcome_learning (agent_id, created_at DESC)`,

  `
  CREATE TABLE IF NOT EXISTS alloy_agent_corrections (
    id SERIAL PRIMARY KEY,
    source_agent_id TEXT NOT NULL,
    validator_agent_id TEXT NOT NULL,
    original_output TEXT NOT NULL,
    corrected_output TEXT NOT NULL,
    validation_notes TEXT,
    validation_status TEXT NOT NULL,
    topic_keywords TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
  `,
  `CREATE INDEX IF NOT EXISTS idx_alloy_corrections_source ON alloy_agent_corrections (source_agent_id, created_at DESC)`,

  `
  CREATE TABLE IF NOT EXISTS eval_runs (
    id SERIAL PRIMARY KEY,
    run_id TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    total_tests INTEGER NOT NULL,
    passed INTEGER NOT NULL,
    failed INTEGER NOT NULL,
    pass_rate TEXT NOT NULL,
    avg_latency_ms INTEGER NOT NULL,
    by_category JSONB NOT NULL DEFAULT '{}',
    results JSONB NOT NULL DEFAULT '[]',
    triggered_by TEXT NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
  `,
  `CREATE INDEX IF NOT EXISTS idx_eval_runs_created ON eval_runs (created_at DESC)`,

  `ALTER TABLE agent_memory_facts ADD COLUMN IF NOT EXISTS retrieval_count INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE alloy_outcome_learning ADD COLUMN IF NOT EXISTS org_id INTEGER`,
  `ALTER TABLE alloy_agent_corrections ADD COLUMN IF NOT EXISTS org_id INTEGER`,
  `CREATE INDEX IF NOT EXISTS idx_alloy_outcome_org ON alloy_outcome_learning (org_id, agent_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_alloy_corrections_org ON alloy_agent_corrections (org_id, source_agent_id, created_at DESC)`,
];

export async function ensureCognitiveLearningTables(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const ddl of DDL_STATEMENTS) {
      const stmt = ddl.trim();
      if (!stmt) continue;
      try {
        await client.query(stmt);
      } catch (err) {
        if (isIdempotentError(err)) continue;
        logger.warn({ err, stmt: stmt.slice(0, 80) }, "[cognitive-migrations] Non-fatal DDL error");
      }
    }
    logger.info("[cognitive-migrations] Cognitive learning tables ensured");
  } finally {
    client.release();
  }
}
