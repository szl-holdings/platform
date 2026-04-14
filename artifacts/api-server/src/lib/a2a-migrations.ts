import { db } from "@szl-holdings/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

export async function ensureA2ATables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS a2a_agent_cards (
        id SERIAL PRIMARY KEY,
        agent_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        version TEXT NOT NULL DEFAULT '1.0.0',
        description TEXT NOT NULL DEFAULT '',
        capabilities TEXT[] NOT NULL DEFAULT '{}',
        input_schema JSONB,
        output_schema JSONB,
        preferred_model TEXT NOT NULL,
        preferred_provider TEXT NOT NULL,
        collaborates_with TEXT[] NOT NULL DEFAULT '{}',
        cost_per_call_usd REAL NOT NULL DEFAULT 0.001,
        avg_latency_ms INTEGER NOT NULL DEFAULT 2000,
        success_rate REAL NOT NULL DEFAULT 0.95,
        status TEXT NOT NULL DEFAULT 'online',
        last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS a2a_delegation_tasks (
        id SERIAL PRIMARY KEY,
        task_id TEXT NOT NULL UNIQUE,
        requesting_agent_id TEXT NOT NULL,
        target_agent_id TEXT NOT NULL,
        query TEXT NOT NULL,
        context TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT NOT NULL DEFAULT 'normal',
        result TEXT,
        result_confidence REAL,
        error_message TEXT,
        timeout_ms INTEGER NOT NULL DEFAULT 30000,
        requested_at BIGINT NOT NULL,
        accepted_at BIGINT,
        completed_at BIGINT,
        duration_ms INTEGER,
        retry_count INTEGER NOT NULL DEFAULT 0,
        orchestration_id TEXT,
        metadata JSONB
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS a2a_agent_heartbeats (
        id SERIAL PRIMARY KEY,
        agent_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'online',
        load REAL NOT NULL DEFAULT 0,
        active_tasks INTEGER NOT NULL DEFAULT 0,
        uptime_ms BIGINT,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS a2a_discovery_queries (
        id SERIAL PRIMARY KEY,
        query_id TEXT NOT NULL UNIQUE,
        requesting_agent_id TEXT NOT NULL,
        capability TEXT,
        domain TEXT,
        query_text TEXT,
        result_count INTEGER NOT NULL DEFAULT 0,
        top_match_agent_id TEXT,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_a2a_agent_cards_domain ON a2a_agent_cards (domain)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_a2a_agent_cards_status ON a2a_agent_cards (status)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_a2a_delegation_tasks_status ON a2a_delegation_tasks (status)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_a2a_delegation_tasks_agents ON a2a_delegation_tasks (requesting_agent_id, target_agent_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_a2a_heartbeats_agent_id ON a2a_agent_heartbeats (agent_id)
    `);

    logger.info("A2A protocol tables ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure A2A tables");
  }
}
