import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";

export interface IntentNode {
  intentId: string;
  level: "primary" | "secondary" | "sub";
  intent: string;
  domain: string;
  keywords: string[];
  confidence: number;
  turnNumber: number;
  resolved: boolean;
}

export interface IntentStack {
  sessionId: string;
  threadId: string;
  userId?: string;
  primaryIntent?: IntentNode;
  activeIntents: IntentNode[];
  resolvedIntents: IntentNode[];
  pivotCount: number;
  startedAt: string;
  lastUpdatedAt: string;
}

export interface IntentExtraction {
  primaryGoal: string;
  subGoals: string[];
  domain: string;
  keywords: string[];
  confidence: number;
  isPivot: boolean;
}

export async function ensureIntentTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_intent_stacks (
        id BIGSERIAL PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        thread_id TEXT NOT NULL,
        user_id TEXT,
        primary_intent JSONB,
        active_intents JSONB DEFAULT '[]',
        resolved_intents JSONB DEFAULT '[]',
        pivot_count INTEGER NOT NULL DEFAULT 0,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_intent_stacks_thread ON agent_intent_stacks(thread_id);
      CREATE INDEX IF NOT EXISTS idx_intent_stacks_user ON agent_intent_stacks(user_id);
    `);

    logger.info("Intent tables ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure intent tables");
  }
}

export async function extractIntent(
  message: string,
  existingPrimaryGoal?: string,
  conversationHistory?: string[]
): Promise<IntentExtraction> {
  try {
    const historyContext = conversationHistory?.slice(-4).join("\n") || "";

    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are an intent extraction system. Analyze the user's message in context of conversation history.
Extract the user's goals and determine if this is a pivot from existing intent.
Respond with JSON:
{
  "primaryGoal": "the main objective behind this message",
  "subGoals": ["specific sub-objectives"],
  "domain": "legal|maritime|cyber|real_estate|finance|ai|general",
  "keywords": ["key terms"],
  "confidence": 0.0-1.0,
  "isPivot": true|false
}`,
        },
        {
          role: "user",
          content: `${historyContext ? `Conversation history:\n${historyContext}\n\n` : ""}${existingPrimaryGoal ? `Current primary goal: ${existingPrimaryGoal}\n\n` : ""}New message: ${message}`,
        },
      ],
      maxTokens: 300,
      strategy: "cheapest",
    });

    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        primaryGoal: parsed.primaryGoal || message.slice(0, 100),
        subGoals: parsed.subGoals || [],
        domain: parsed.domain || "general",
        keywords: parsed.keywords || [],
        confidence: parsed.confidence ?? 0.7,
        isPivot: parsed.isPivot ?? false,
      };
    }
  } catch {}

  return {
    primaryGoal: message.slice(0, 100),
    subGoals: [],
    domain: "general",
    keywords: [],
    confidence: 0.5,
    isPivot: false,
  };
}

export async function getOrCreateIntentStack(
  threadId: string,
  userId?: string
): Promise<IntentStack> {
  try {
    const sessionId = `sess_${threadId}`;
    const existing = await pool.query(
      "SELECT * FROM agent_intent_stacks WHERE session_id = $1",
      [sessionId]
    );

    if (existing.rows.length > 0) {
      const r = existing.rows[0];
      return {
        sessionId: r.session_id, threadId: r.thread_id, userId: r.user_id,
        primaryIntent: r.primary_intent, activeIntents: r.active_intents || [],
        resolvedIntents: r.resolved_intents || [], pivotCount: r.pivot_count,
        startedAt: r.started_at, lastUpdatedAt: r.last_updated_at,
      };
    }

    const stack: IntentStack = {
      sessionId, threadId, userId,
      activeIntents: [], resolvedIntents: [],
      pivotCount: 0,
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };

    await pool.query(
      `INSERT INTO agent_intent_stacks (session_id, thread_id, user_id, active_intents, resolved_intents, pivot_count, started_at, last_updated_at)
       VALUES ($1, $2, $3, '[]', '[]', 0, NOW(), NOW())`,
      [sessionId, threadId, userId]
    );

    return stack;
  } catch {
    return {
      sessionId: `sess_${threadId}`, threadId, userId,
      activeIntents: [], resolvedIntents: [],
      pivotCount: 0,
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}

export async function updateIntentStack(
  stack: IntentStack,
  extraction: IntentExtraction,
  turnNumber: number
): Promise<IntentStack> {
  const intentId = `int_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const newIntent: IntentNode = {
    intentId,
    level: !stack.primaryIntent ? "primary" : extraction.isPivot ? "primary" : "secondary",
    intent: extraction.primaryGoal,
    domain: extraction.domain,
    keywords: extraction.keywords,
    confidence: extraction.confidence,
    turnNumber,
    resolved: false,
  };

  const updatedStack = { ...stack };

  if (!stack.primaryIntent || (extraction.isPivot && extraction.confidence > 0.7)) {
    if (stack.primaryIntent) updatedStack.pivotCount++;
    updatedStack.primaryIntent = newIntent;
  }

  updatedStack.activeIntents = [
    ...stack.activeIntents.filter(i => !i.resolved),
    newIntent,
  ].slice(-10);

  updatedStack.lastUpdatedAt = new Date().toISOString();

  try {
    await pool.query(
      `UPDATE agent_intent_stacks
       SET primary_intent = $2, active_intents = $3, pivot_count = $4, last_updated_at = NOW()
       WHERE session_id = $1`,
      [
        stack.sessionId,
        updatedStack.primaryIntent ? JSON.stringify(updatedStack.primaryIntent) : null,
        JSON.stringify(updatedStack.activeIntents),
        updatedStack.pivotCount,
      ]
    );
  } catch {}

  return updatedStack;
}

export async function markIntentResolved(
  stack: IntentStack,
  intentId: string
): Promise<IntentStack> {
  const intent = stack.activeIntents.find(i => i.intentId === intentId);
  if (!intent) return stack;

  const resolvedIntent = { ...intent, resolved: true };
  const updatedStack = {
    ...stack,
    activeIntents: stack.activeIntents.filter(i => i.intentId !== intentId),
    resolvedIntents: [...stack.resolvedIntents, resolvedIntent].slice(-20),
  };

  try {
    await pool.query(
      `UPDATE agent_intent_stacks SET active_intents = $2, resolved_intents = $3, last_updated_at = NOW() WHERE session_id = $1`,
      [stack.sessionId, JSON.stringify(updatedStack.activeIntents), JSON.stringify(updatedStack.resolvedIntents)]
    );
  } catch {}

  return updatedStack;
}

export function buildIntentContext(stack: IntentStack): string {
  if (!stack.primaryIntent && stack.activeIntents.length === 0) return "";

  const parts: string[] = [];

  if (stack.primaryIntent) {
    parts.push(`Primary user goal: ${stack.primaryIntent.intent}`);
  }

  const secondary = stack.activeIntents.filter(i => i.level === "secondary").slice(-3);
  if (secondary.length > 0) {
    parts.push(`Current sub-goals: ${secondary.map(i => i.intent).join("; ")}`);
  }

  if (stack.pivotCount > 0) {
    parts.push(`Note: User has pivoted ${stack.pivotCount} time(s) during this session.`);
  }

  return parts.join("\n");
}

export async function getIntentStack(threadId: string): Promise<IntentStack | null> {
  try {
    const sessionId = `sess_${threadId}`;
    const result = await pool.query(
      "SELECT * FROM agent_intent_stacks WHERE session_id = $1",
      [sessionId]
    );
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return {
      sessionId: r.session_id, threadId: r.thread_id, userId: r.user_id,
      primaryIntent: r.primary_intent, activeIntents: r.active_intents || [],
      resolvedIntents: r.resolved_intents || [], pivotCount: r.pivot_count,
      startedAt: r.started_at, lastUpdatedAt: r.last_updated_at,
    };
  } catch {
    return null;
  }
}
