import { pool } from "@szl-holdings/db";
import { gatewayInfer } from "./ai-gateway";
import { logger } from "./logger";

export interface ContextCompactionConfig {
  tokenThreshold: number;
  preserveQuantitativeData: boolean;
  preserveEntityRefs: boolean;
  domainFocus?: string;
}

export interface CompactionResult {
  originalMessageCount: number;
  compactedSummary: string;
  preservedMessages: Array<{ role: string; content: string }>;
  tokensEstimatedBefore: number;
  tokensEstimatedAfter: number;
  entitiesPreserved: string[];
  compactedAt: string;
}

export interface ContextNote {
  noteId: string;
  agentId: string;
  threadId?: string;
  category: "observation" | "decision" | "entity" | "task" | "insight";
  content: string;
  entities: string[];
  domain?: string;
  importance: number;
  createdAt: string;
  expiresAt?: string;
}

export interface ToolResultClearingResult {
  messageCount: number;
  clearedToolResults: number;
  keptToolCalls: number;
  tokensSaved: number;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function ensureContextTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alloy_context_notes (
      note_id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      thread_id TEXT,
      category TEXT NOT NULL DEFAULT 'observation',
      content TEXT NOT NULL,
      entities TEXT[] NOT NULL DEFAULT '{}',
      domain TEXT,
      importance REAL NOT NULL DEFAULT 0.5,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      is_active BOOLEAN NOT NULL DEFAULT TRUE
    );
    CREATE INDEX IF NOT EXISTS idx_context_notes_agent ON alloy_context_notes(agent_id);
    CREATE INDEX IF NOT EXISTS idx_context_notes_thread ON alloy_context_notes(thread_id);

    CREATE TABLE IF NOT EXISTS alloy_context_compaction_log (
      id SERIAL PRIMARY KEY,
      thread_id TEXT NOT NULL,
      agent_id TEXT,
      original_message_count INT NOT NULL,
      tokens_before INT NOT NULL DEFAULT 0,
      tokens_after INT NOT NULL DEFAULT 0,
      compacted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  try { await ensureContextTables(); tablesEnsured = true; } catch {}
}

export async function compactContextWindow(params: {
  threadId: string;
  agentId?: string;
  messages: Array<{ role: string; content: string }>;
  config?: ContextCompactionConfig;
}): Promise<CompactionResult> {
  await ensureTables();
  const config: ContextCompactionConfig = {
    tokenThreshold: params.config?.tokenThreshold ?? 6000,
    preserveQuantitativeData: params.config?.preserveQuantitativeData ?? true,
    preserveEntityRefs: params.config?.preserveEntityRefs ?? true,
    domainFocus: params.config?.domainFocus,
  };

  const messages = params.messages;
  const totalTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);

  if (totalTokens < config.tokenThreshold) {
    return {
      originalMessageCount: messages.length,
      compactedSummary: "",
      preservedMessages: messages,
      tokensEstimatedBefore: totalTokens,
      tokensEstimatedAfter: totalTokens,
      entitiesPreserved: [],
      compactedAt: new Date().toISOString(),
    };
  }

  const keepLast = 4;
  const toCompact = messages.slice(0, Math.max(0, messages.length - keepLast));
  const preserved = messages.slice(Math.max(0, messages.length - keepLast));

  const compactionTarget = toCompact.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n\n");

  const systemInstructions = [
    "Summarize the following conversation segment into a concise, information-dense summary.",
    config.preserveQuantitativeData ? "PRESERVE all numerical values, percentages, dates, amounts, and metrics exactly as stated." : "",
    config.preserveEntityRefs ? "PRESERVE all entity names (people, organizations, vessels, properties, cases) as canonical identifiers." : "",
    config.domainFocus ? `Focus on information relevant to the ${config.domainFocus} domain.` : "",
    "The summary will serve as compressed memory for an AI agent. Be precise and complete.",
  ].filter(Boolean).join(" ");

  let summary = "Context from earlier in this session has been summarized.";
  const entitiesPreserved: string[] = [];

  try {
    const response = await gatewayInfer({
      messages: [
        { role: "system", content: systemInstructions },
        { role: "user", content: `Summarize this conversation segment:\n\n${compactionTarget.slice(0, 10000)}` },
      ],
      maxTokens: 1000,
      strategy: "cheapest",
    });
    summary = response.content;

    const entityMatches = summary.match(/\b[A-Z][a-zA-Z\s]{2,30}(?:\s[A-Z][a-zA-Z]{2,20})*\b/g) || [];
    entitiesPreserved.push(...entityMatches.slice(0, 20));
  } catch (err: any) {
    logger.warn({ err }, "Context compaction inference failed");
  }

  const compactedSummaryMessage = {
    role: "assistant",
    content: `[CONTEXT_SUMMARY]: ${summary}`,
  };

  const finalMessages = [compactedSummaryMessage, ...preserved];
  const afterTokens = finalMessages.reduce((sum, m) => sum + estimateTokens(m.content), 0);

  try {
    await pool.query(
      `INSERT INTO alloy_context_compaction_log (thread_id, agent_id, original_message_count, tokens_before, tokens_after)
       VALUES ($1, $2, $3, $4, $5)`,
      [params.threadId, params.agentId ?? null, messages.length, totalTokens, afterTokens]
    );
  } catch {}

  return {
    originalMessageCount: messages.length,
    compactedSummary: summary,
    preservedMessages: finalMessages,
    tokensEstimatedBefore: totalTokens,
    tokensEstimatedAfter: afterTokens,
    entitiesPreserved,
    compactedAt: new Date().toISOString(),
  };
}

export function clearStaleToolResults(
  messages: Array<{ role: string; content: string; metadata?: Record<string, unknown> }>,
  options: { keepLastN?: number; refetchableTools?: string[] } = {}
): ToolResultClearingResult {
  const keepLastN = options.keepLastN ?? 2;
  const refetchableTools = new Set(options.refetchableTools ?? [
    "query_portfolio_metrics", "alloy_query_ecosystem", "search_knowledge_graph",
    "vessels_list_tracked", "terra_search_properties",
  ]);

  let clearedToolResults = 0;
  let keptToolCalls = 0;
  let tokensSaved = 0;

  const toolResultIndices: number[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "tool") {
      toolResultIndices.push(i);
    }
  }

  const recentIndices = new Set(toolResultIndices.slice(-keepLastN));

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === "tool" && !recentIndices.has(i)) {
      try {
        const parsed = JSON.parse(msg.content);
        const toolName = parsed.tool || "";
        if (refetchableTools.has(toolName)) {
          tokensSaved += estimateTokens(msg.content);
          messages[i] = {
            role: "tool",
            content: JSON.stringify({ tool: toolName, result: "[CLEARED — re-fetch if needed]", cleared: true }),
          };
          clearedToolResults++;
        } else {
          keptToolCalls++;
        }
      } catch {
        keptToolCalls++;
      }
    }
  }

  return { messageCount: messages.length, clearedToolResults, keptToolCalls, tokensSaved };
}

export async function writeContextNote(params: {
  agentId: string;
  threadId?: string;
  category: ContextNote["category"];
  content: string;
  entities?: string[];
  domain?: string;
  importance?: number;
  expiresInHours?: number;
}): Promise<ContextNote> {
  await ensureTables();
  const noteId = `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const expiresAt = params.expiresInHours
    ? new Date(Date.now() + params.expiresInHours * 3600000).toISOString()
    : null;

  const note: ContextNote = {
    noteId,
    agentId: params.agentId,
    threadId: params.threadId,
    category: params.category,
    content: params.content,
    entities: params.entities ?? [],
    domain: params.domain,
    importance: params.importance ?? 0.5,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt ?? undefined,
  };

  try {
    await pool.query(
      `INSERT INTO alloy_context_notes (note_id, agent_id, thread_id, category, content, entities, domain, importance, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)`,
      [noteId, params.agentId, params.threadId ?? null, params.category, params.content,
       params.entities ?? [], params.domain ?? null, params.importance ?? 0.5, expiresAt]
    );
  } catch (err) {
    logger.warn({ err }, "Failed to write context note");
  }

  return note;
}

export async function recallContextNotes(params: {
  agentId: string;
  threadId?: string;
  category?: ContextNote["category"];
  domain?: string;
  limit?: number;
}): Promise<ContextNote[]> {
  await ensureTables();
  const conditions = ["agent_id = $1", "is_active = TRUE", "(expires_at IS NULL OR expires_at > NOW())"];
  const values: unknown[] = [params.agentId];
  let idx = 2;

  if (params.threadId) { conditions.push(`thread_id = $${idx++}`); values.push(params.threadId); }
  if (params.category) { conditions.push(`category = $${idx++}`); values.push(params.category); }
  if (params.domain) { conditions.push(`domain = $${idx++}`); values.push(params.domain); }
  values.push(params.limit ?? 20);

  try {
    const { rows } = await pool.query(
      `SELECT * FROM alloy_context_notes WHERE ${conditions.join(" AND ")}
       ORDER BY importance DESC, created_at DESC LIMIT $${idx}`,
      values
    );
    return rows.map(r => ({
      noteId: r.note_id,
      agentId: r.agent_id,
      threadId: r.thread_id,
      category: r.category,
      content: r.content,
      entities: r.entities || [],
      domain: r.domain,
      importance: r.importance,
      createdAt: r.created_at?.toISOString() ?? "",
      expiresAt: r.expires_at?.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function getContextStats(agentId: string): Promise<{
  totalNotes: number;
  notesByCategory: Record<string, number>;
  compactionEvents: number;
  avgTokenSavingsPerCompaction: number;
}> {
  try {
    const [notes, compactions] = await Promise.all([
      pool.query(`SELECT category, COUNT(*) as cnt FROM alloy_context_notes WHERE agent_id = $1 AND is_active = TRUE GROUP BY category`, [agentId]),
      pool.query(`SELECT COUNT(*) as cnt, AVG(tokens_before - tokens_after) as avg_savings FROM alloy_context_compaction_log WHERE agent_id = $1`, [agentId]),
    ]);

    const notesByCategory: Record<string, number> = {};
    let totalNotes = 0;
    for (const row of notes.rows) {
      notesByCategory[row.category] = parseInt(row.cnt);
      totalNotes += parseInt(row.cnt);
    }

    return {
      totalNotes,
      notesByCategory,
      compactionEvents: parseInt(compactions.rows[0]?.cnt ?? "0"),
      avgTokenSavingsPerCompaction: Math.round(parseFloat(compactions.rows[0]?.avg_savings ?? "0")),
    };
  } catch {
    return { totalNotes: 0, notesByCategory: {}, compactionEvents: 0, avgTokenSavingsPerCompaction: 0 };
  }
}
