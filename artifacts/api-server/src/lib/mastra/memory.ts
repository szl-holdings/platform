import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import type { MemoryRecallResult, KnowledgeEntity } from "./types";

export async function createThread(
  threadId: string,
  agentId: string,
  userId?: string,
  title?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await pool.query(
    `INSERT INTO agent_memory_threads (thread_id, agent_id, user_id, title, metadata, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (thread_id) DO UPDATE SET updated_at = NOW()`,
    [threadId, agentId, userId, title, metadata ? JSON.stringify(metadata) : "{}"]
  );
}

export async function storeMessage(
  threadId: string,
  role: string,
  content: string,
  options?: {
    toolCalls?: any;
    toolResults?: any;
    tokensUsed?: number;
    latencyMs?: number;
    model?: string;
    provider?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await pool.query(
    `INSERT INTO agent_memory_messages
     (thread_id, role, content, tool_calls, tool_results, tokens_used, latency_ms, model, provider, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
    [
      threadId, role, content,
      options?.toolCalls ? JSON.stringify(options.toolCalls) : null,
      options?.toolResults ? JSON.stringify(options.toolResults) : null,
      options?.tokensUsed ?? 0,
      options?.latencyMs ?? 0,
      options?.model,
      options?.provider,
      options?.metadata ? JSON.stringify(options.metadata) : "{}",
    ]
  );
}

export async function getShortTermMemory(
  threadId: string,
  maxMessages = 20
): Promise<{ role: string; content: string; createdAt: Date }[]> {
  const result = await pool.query(
    `SELECT role, content, created_at FROM agent_memory_messages
     WHERE thread_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [threadId, maxMessages]
  );
  return result.rows.reverse().map((r: any) => ({
    role: r.role,
    content: r.content,
    createdAt: r.created_at,
  }));
}

export async function semanticRecall(
  query: string,
  options?: {
    agentId?: string;
    threadId?: string;
    topK?: number;
    minSimilarity?: number;
  }
): Promise<MemoryRecallResult[]> {
  const topK = options?.topK ?? 5;
  const minSimilarity = options?.minSimilarity ?? 0.3;

  try {
    const conditions = ["m.embedding IS NOT NULL"];
    const params: any[] = [query, topK];
    let paramIdx = 3;

    if (options?.agentId) {
      conditions.push(`t.agent_id = $${paramIdx}`);
      params.push(options.agentId);
      paramIdx++;
    }
    if (options?.threadId) {
      conditions.push(`m.thread_id = $${paramIdx}`);
      params.push(options.threadId);
      paramIdx++;
    }

    const result = await pool.query(
      `SELECT m.content, m.role, m.thread_id,
              1 - (m.embedding <=> (
                SELECT embedding FROM ai_embeddings WHERE content = $1 LIMIT 1
              )) as similarity,
              m.created_at
       FROM agent_memory_messages m
       JOIN agent_memory_threads t ON m.thread_id = t.thread_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY similarity DESC
       LIMIT $2`,
      params
    );

    return result.rows
      .filter((r: any) => r.similarity >= minSimilarity)
      .map((r: any) => ({
        content: r.content,
        role: r.role,
        similarity: r.similarity,
        threadId: r.thread_id,
        createdAt: r.created_at,
      }));
  } catch {
    const result = await pool.query(
      `SELECT m.content, m.role, m.thread_id, m.created_at
       FROM agent_memory_messages m
       JOIN agent_memory_threads t ON m.thread_id = t.thread_id
       WHERE m.content ILIKE '%' || $1 || '%'
       ORDER BY m.created_at DESC LIMIT $2`,
      [query, topK]
    );
    return result.rows.map((r: any) => ({
      content: r.content,
      role: r.role,
      similarity: 0.5,
      threadId: r.thread_id,
      createdAt: r.created_at,
    }));
  }
}

export async function storeKnowledgeEntity(
  entity: KnowledgeEntity,
  sourceAgent: string
): Promise<string> {
  const entityId = `ent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  await pool.query(
    `INSERT INTO agent_knowledge_entities
     (entity_id, entity_type, name, description, properties, source_agent, confidence, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     ON CONFLICT (entity_id) DO UPDATE SET
       description = COALESCE(EXCLUDED.description, agent_knowledge_entities.description),
       properties = agent_knowledge_entities.properties || EXCLUDED.properties,
       updated_at = NOW()`,
    [entityId, entity.entityType, entity.name, entity.description, JSON.stringify(entity.properties || {}), sourceAgent, 1.0]
  );

  if (entity.relations?.length) {
    for (const rel of entity.relations) {
      let targetId: string;
      const existing = await pool.query(
        "SELECT entity_id FROM agent_knowledge_entities WHERE name = $1 AND entity_type = $2 LIMIT 1",
        [rel.targetName, rel.targetType]
      );
      if (existing.rows.length > 0) {
        targetId = existing.rows[0].entity_id;
      } else {
        targetId = `ent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await pool.query(
          `INSERT INTO agent_knowledge_entities (entity_id, entity_type, name, source_agent, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT DO NOTHING`,
          [targetId, rel.targetType, rel.targetName, sourceAgent]
        );
      }

      await pool.query(
        `INSERT INTO agent_knowledge_relations
         (source_entity_id, target_entity_id, relation_type, weight, source_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (source_entity_id, target_entity_id, relation_type) DO UPDATE SET weight = EXCLUDED.weight`,
        [entityId, targetId, rel.relationType, rel.weight ?? 1.0, sourceAgent]
      );
    }
  }

  return entityId;
}

export async function getKnowledgeGraph(
  entityId: string,
  maxDepth = 2,
  limit = 20
): Promise<{ entities: any[]; relations: any[] }> {
  const visited = new Set<string>();
  const allEntities: any[] = [];
  const allRelations: any[] = [];

  async function traverse(currentId: string, depth: number) {
    if (depth > maxDepth || visited.has(currentId) || allEntities.length >= limit) return;
    visited.add(currentId);

    const entityResult = await pool.query(
      "SELECT * FROM agent_knowledge_entities WHERE entity_id = $1",
      [currentId]
    );
    if (entityResult.rows.length === 0) return;
    allEntities.push(entityResult.rows[0]);

    const relResult = await pool.query(
      `SELECT r.*, s.name as source_name, s.entity_type as source_type,
              t.name as target_name, t.entity_type as target_type
       FROM agent_knowledge_relations r
       JOIN agent_knowledge_entities s ON r.source_entity_id = s.entity_id
       JOIN agent_knowledge_entities t ON r.target_entity_id = t.entity_id
       WHERE r.source_entity_id = $1 OR r.target_entity_id = $1`,
      [currentId]
    );

    for (const rel of relResult.rows) {
      allRelations.push(rel);
      const nextId = rel.source_entity_id === currentId ? rel.target_entity_id : rel.source_entity_id;
      await traverse(nextId, depth + 1);
    }
  }

  await traverse(entityId, 0);
  return { entities: allEntities, relations: allRelations };
}

export async function getThreads(
  agentId?: string,
  userId?: string,
  limit = 20
): Promise<any[]> {
  const conditions = ["1=1"];
  const params: any[] = [];
  let idx = 1;

  if (agentId) { conditions.push(`agent_id = $${idx}`); params.push(agentId); idx++; }
  if (userId) { conditions.push(`user_id = $${idx}`); params.push(userId); idx++; }
  params.push(limit);

  const result = await pool.query(
    `SELECT t.*, (SELECT count(*) FROM agent_memory_messages WHERE thread_id = t.thread_id) as message_count
     FROM agent_memory_threads t WHERE ${conditions.join(" AND ")}
     ORDER BY t.updated_at DESC LIMIT $${idx}`,
    params
  );
  return result.rows;
}
