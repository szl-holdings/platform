import { pool } from "@szl-holdings/db";
import { logger } from "../logger";

export interface EpisodicMemory {
  memoryId: string;
  userId: string;
  agentId: string;
  topic: string;
  summary: string;
  outcome: string;
  keyEntities: string[];
  sentiment: "positive" | "neutral" | "negative";
  importanceScore: number;
  accessCount: number;
  createdAt: string;
  lastAccessedAt: string;
}

export interface UserPreference {
  userId: string;
  preferenceKey: string;
  preferenceValue: string;
  confidence: number;
  observationCount: number;
  updatedAt: string;
}

export interface MemoryConsolidationResult {
  consolidatedCount: number;
  summaryCreated: boolean;
  memoryIds: string[];
}

export async function ensureMemoryPersistenceTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_episodic_memories (
        memory_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        topic TEXT NOT NULL,
        summary TEXT NOT NULL,
        outcome TEXT NOT NULL,
        key_entities TEXT[] NOT NULL DEFAULT '{}',
        sentiment TEXT NOT NULL DEFAULT 'neutral',
        importance_score FLOAT NOT NULL DEFAULT 0.5,
        access_count INT NOT NULL DEFAULT 0,
        is_consolidated BOOLEAN NOT NULL DEFAULT FALSE,
        consolidated_into TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_user_preferences (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        preference_key TEXT NOT NULL,
        preference_value TEXT NOT NULL,
        confidence FLOAT NOT NULL DEFAULT 0.5,
        observation_count INT NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, preference_key)
      );

      CREATE TABLE IF NOT EXISTS ai_memory_consolidations (
        id BIGSERIAL PRIMARY KEY,
        consolidation_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        source_memory_ids TEXT[] NOT NULL,
        consolidated_summary TEXT NOT NULL,
        topic_cluster TEXT NOT NULL,
        memory_count INT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_entity_confidence_evolution (
        id BIGSERIAL PRIMARY KEY,
        entity_id TEXT NOT NULL,
        confidence_before FLOAT NOT NULL,
        confidence_after FLOAT NOT NULL,
        evidence TEXT,
        agent_id TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_episodic_user_agent ON ai_episodic_memories(user_id, agent_id);
      CREATE INDEX IF NOT EXISTS idx_episodic_importance ON ai_episodic_memories(importance_score DESC);
      CREATE INDEX IF NOT EXISTS idx_episodic_created ON ai_episodic_memories(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON ai_user_preferences(user_id);
    `);
    logger.info("Memory persistence tables ensured");
  } catch (err) {
    logger.warn({ err }, "Failed to ensure memory persistence tables (non-fatal)");
  }
}

export async function storeEpisodicMemory(params: {
  userId: string;
  agentId: string;
  topic: string;
  summary: string;
  outcome: string;
  keyEntities?: string[];
  sentiment?: EpisodicMemory["sentiment"];
  importanceScore?: number;
}): Promise<string> {
  const memoryId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    await pool.query(
      `INSERT INTO ai_episodic_memories
       (memory_id, user_id, agent_id, topic, summary, outcome, key_entities, sentiment, importance_score, created_at, last_accessed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [
        memoryId,
        params.userId,
        params.agentId,
        params.topic,
        params.summary,
        params.outcome,
        params.keyEntities ?? [],
        params.sentiment ?? "neutral",
        params.importanceScore ?? 0.5,
      ]
    );
    return memoryId;
  } catch (err) {
    logger.warn({ err }, "Failed to store episodic memory");
    return memoryId;
  }
}

export async function recallEpisodicMemories(
  userId: string,
  topic: string,
  agentId?: string,
  limit = 5
): Promise<EpisodicMemory[]> {
  try {
    const conditions = ["user_id = $1", "is_consolidated = FALSE"];
    const params: any[] = [userId, `%${topic.toLowerCase()}%`, limit];
    let paramIdx = 4;

    if (agentId) {
      conditions.push(`agent_id = $${paramIdx}`);
      params.splice(2, 0, agentId);
      paramIdx++;
    }

    const result = await pool.query(
      `SELECT * FROM ai_episodic_memories
       WHERE user_id = $1
         AND is_consolidated = FALSE
         AND (LOWER(topic) LIKE $2 OR LOWER(summary) LIKE $2 OR LOWER(outcome) LIKE $2)
         ${agentId ? "AND agent_id = $3" : ""}
       ORDER BY importance_score DESC, created_at DESC
       LIMIT ${agentId ? "$4" : "$3"}`,
      agentId ? [userId, `%${topic.toLowerCase()}%`, agentId, limit] : [userId, `%${topic.toLowerCase()}%`, limit]
    );

    const memories = result.rows.map(rowToEpisodicMemory);

    if (memories.length > 0) {
      await pool.query(
        `UPDATE ai_episodic_memories SET access_count = access_count + 1, last_accessed_at = NOW()
         WHERE memory_id = ANY($1)`,
        [memories.map(m => m.memoryId)]
      ).catch(() => {});
    }

    return memories;
  } catch {
    return [];
  }
}

export async function getRecentEpisodicMemories(
  userId: string,
  agentId?: string,
  limit = 10
): Promise<EpisodicMemory[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM ai_episodic_memories
       WHERE user_id = $1
         ${agentId ? "AND agent_id = $2" : ""}
         AND is_consolidated = FALSE
       ORDER BY importance_score DESC, last_accessed_at DESC
       LIMIT $${agentId ? 3 : 2}`,
      agentId ? [userId, agentId, limit] : [userId, limit]
    );
    return result.rows.map(rowToEpisodicMemory);
  } catch {
    return [];
  }
}

export async function learnUserPreference(
  userId: string,
  preferenceKey: string,
  preferenceValue: string,
  confidence = 0.7
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO ai_user_preferences (user_id, preference_key, preference_value, confidence, observation_count, updated_at)
       VALUES ($1, $2, $3, $4, 1, NOW())
       ON CONFLICT (user_id, preference_key) DO UPDATE SET
         preference_value = CASE
           WHEN EXCLUDED.confidence > ai_user_preferences.confidence THEN EXCLUDED.preference_value
           ELSE ai_user_preferences.preference_value
         END,
         confidence = LEAST(0.99, (ai_user_preferences.confidence * ai_user_preferences.observation_count + EXCLUDED.confidence) / (ai_user_preferences.observation_count + 1)),
         observation_count = ai_user_preferences.observation_count + 1,
         updated_at = NOW()`,
      [userId, preferenceKey, preferenceValue, confidence]
    );
  } catch (err) {
    logger.warn({ err }, "Failed to learn user preference");
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreference[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM ai_user_preferences WHERE user_id = $1 AND confidence > 0.4 ORDER BY confidence DESC, observation_count DESC`,
      [userId]
    );
    return result.rows.map(r => ({
      userId: r.user_id,
      preferenceKey: r.preference_key,
      preferenceValue: r.preference_value,
      confidence: parseFloat(r.confidence),
      observationCount: parseInt(r.observation_count),
      updatedAt: r.updated_at,
    }));
  } catch {
    return [];
  }
}

export async function getPreference(userId: string, key: string): Promise<string | null> {
  try {
    const result = await pool.query(
      "SELECT preference_value FROM ai_user_preferences WHERE user_id = $1 AND preference_key = $2 AND confidence > 0.5",
      [userId, key]
    );
    return result.rows[0]?.preference_value ?? null;
  } catch {
    return null;
  }
}

export async function consolidateOldMemories(
  userId: string,
  agentId: string,
  thresholdDays = 30
): Promise<MemoryConsolidationResult> {
  try {
    const oldMemories = await pool.query(
      `SELECT * FROM ai_episodic_memories
       WHERE user_id = $1
         AND agent_id = $2
         AND is_consolidated = FALSE
         AND created_at < NOW() - INTERVAL '1 day' * $3
         AND importance_score < 0.7
       ORDER BY created_at ASC
       LIMIT 20`,
      [userId, agentId, thresholdDays]
    );

    if (oldMemories.rows.length < 3) {
      return { consolidatedCount: 0, summaryCreated: false, memoryIds: [] };
    }

    const memoryIds = oldMemories.rows.map((r: any) => r.memory_id);
    const topicClusters = groupByTopic(oldMemories.rows);

    for (const [topic, memories] of Object.entries(topicClusters)) {
      if (memories.length < 2) continue;

      const summaryParts = memories.map((m: any) =>
        `[${new Date(m.created_at).toLocaleDateString()}] ${m.topic}: ${m.summary} → ${m.outcome}`
      ).join("\n");

      const consolidationId = `cons_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const consolidatedSummary = `Consolidated ${memories.length} memories about "${topic}": ${summaryParts.slice(0, 500)}`;

      await pool.query(
        `INSERT INTO ai_memory_consolidations
         (consolidation_id, user_id, agent_id, source_memory_ids, consolidated_summary, topic_cluster, memory_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [consolidationId, userId, agentId, memories.map((m: any) => m.memory_id), consolidatedSummary, topic, memories.length]
      );

      await pool.query(
        `UPDATE ai_episodic_memories SET is_consolidated = TRUE, consolidated_into = $1 WHERE memory_id = ANY($2)`,
        [consolidationId, memories.map((m: any) => m.memory_id)]
      );
    }

    return {
      consolidatedCount: oldMemories.rows.length,
      summaryCreated: true,
      memoryIds,
    };
  } catch (err) {
    logger.warn({ err }, "Memory consolidation failed");
    return { consolidatedCount: 0, summaryCreated: false, memoryIds: [] };
  }
}

function groupByTopic(memories: any[]): Record<string, any[]> {
  const clusters: Record<string, any[]> = {};
  for (const m of memories) {
    const topic = m.topic?.toLowerCase().split(" ")[0] ?? "general";
    if (!clusters[topic]) clusters[topic] = [];
    clusters[topic].push(m);
  }
  return clusters;
}

export async function evolveEntityConfidence(
  entityId: string,
  newEvidence: string,
  confidenceDelta: number,
  agentId: string
): Promise<void> {
  try {
    const current = await pool.query(
      "SELECT confidence FROM agent_knowledge_entities WHERE entity_id = $1",
      [entityId]
    );

    if (current.rows.length === 0) return;

    const oldConfidence = parseFloat(current.rows[0].confidence ?? "0.5");
    const newConfidence = Math.max(0.1, Math.min(1.0, oldConfidence + confidenceDelta));

    await pool.query(
      "UPDATE agent_knowledge_entities SET confidence = $2, updated_at = NOW() WHERE entity_id = $1",
      [entityId, newConfidence]
    );

    await pool.query(
      `INSERT INTO ai_entity_confidence_evolution (entity_id, confidence_before, confidence_after, evidence, agent_id, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [entityId, oldConfidence, newConfidence, newEvidence.slice(0, 500), agentId]
    );
  } catch (err) {
    logger.warn({ err, entityId }, "Failed to evolve entity confidence");
  }
}

export async function buildPersonalizedContext(userId: string, agentId: string, topic: string): Promise<string> {
  const [preferences, episodicMemories] = await Promise.all([
    getUserPreferences(userId),
    recallEpisodicMemories(userId, topic, agentId, 3),
  ]);

  const parts: string[] = [];

  if (preferences.length > 0) {
    const highConfidencePrefs = preferences.filter(p => p.confidence > 0.6).slice(0, 5);
    if (highConfidencePrefs.length > 0) {
      parts.push("User preferences:");
      highConfidencePrefs.forEach(p => parts.push(`  — ${p.preferenceKey}: ${p.preferenceValue} (confidence: ${(p.confidence * 100).toFixed(0)}%)`));
    }
  }

  if (episodicMemories.length > 0) {
    parts.push("\nRelevant past interactions:");
    episodicMemories.forEach(m => {
      parts.push(`  — [${new Date(m.createdAt).toLocaleDateString()}] ${m.topic}: ${m.summary} → ${m.outcome}`);
    });
  }

  return parts.length > 0 ? `\n\n[Personalized Context]\n${parts.join("\n")}` : "";
}

function rowToEpisodicMemory(r: any): EpisodicMemory {
  return {
    memoryId: r.memory_id,
    userId: r.user_id,
    agentId: r.agent_id,
    topic: r.topic,
    summary: r.summary,
    outcome: r.outcome,
    keyEntities: r.key_entities ?? [],
    sentiment: r.sentiment ?? "neutral",
    importanceScore: parseFloat(r.importance_score),
    accessCount: parseInt(r.access_count),
    createdAt: r.created_at,
    lastAccessedAt: r.last_accessed_at,
  };
}
