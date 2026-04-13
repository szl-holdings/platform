import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { runAgent } from "./agent-engine";
import { createThread, storeMessage, getShortTermMemory } from "./memory";
import { logAction, updateActionStatus, generateActionId } from "./action-audit";

export type VoiceAgentDomain = "vessels" | "aegis" | "terra" | "prism" | "lyte" | "carlota-jo" | "szl" | "general";
export type VoiceAgentState = "idle" | "listening" | "processing" | "speaking" | "interrupted";

export interface VoiceConversationSession {
  sessionId: string;
  agentId: string;
  domain: VoiceAgentDomain;
  threadId: string;
  userId?: string;
  state: VoiceAgentState;
  turnCount: number;
  createdAt: string;
  lastActivityAt: string;
}

export interface VoiceTurn {
  turnId: string;
  sessionId: string;
  transcript: string;
  agentResponse: string;
  toolsUsed: string[];
  ttsReady: boolean;
  ttsText: string;
  vadDetected: boolean;
  interruptionHandled: boolean;
  latencyMs: number;
  timestamp: string;
}

export interface VoiceAgentResponse {
  turnId: string;
  sessionId: string;
  threadId: string;
  transcript: string;
  agentResponse: string;
  ttsText: string;
  toolsUsed: string[];
  shouldContinue: boolean;
  suggestedFollowUps: string[];
  latencyMs: number;
}

const DOMAIN_AGENT_MAP: Record<VoiceAgentDomain, string> = {
  vessels: "vessels-agent",
  aegis: "aegis-agent",
  terra: "terra-agent",
  prism: "prism-agent",
  lyte: "lyte-agent",
  "carlota-jo": "carlota-jo-agent",
  szl: "szl-orchestrator",
  general: "szl-orchestrator",
};

const DOMAIN_VOICE_PERSONAS: Record<VoiceAgentDomain, string> = {
  vessels: "You are the Vessels maritime intelligence voice agent. Respond concisely and professionally. You have access to vessel tracking, AIS data, cargo manifests, and maritime risk assessment.",
  aegis: "You are the Aegis defense and security voice agent. Respond with precision and urgency when required. You have access to threat intelligence, incident management, and security operations.",
  terra: "You are the Terra real estate intelligence voice agent. Respond in a clear, advisory tone. You have access to property data, distress signals, market analysis, and valuation tools.",
  prism: "You are the PRISM legal intelligence voice agent. Respond with accuracy and appropriate legal caution. You have access to matter management, contract analysis, and compliance tools.",
  lyte: "You are the Lyte platform operations voice agent. Respond efficiently and helpfully. You have access to platform metrics, customer data, and operational intelligence.",
  "carlota-jo": "You are the Carlota Jo consulting voice agent. Respond warmly and professionally. You have access to client management, project tracking, and advisory tools.",
  szl: "You are the SZL Holdings executive intelligence voice agent. Respond at the executive level — concise, strategic, and actionable.",
  general: "You are a general-purpose intelligence voice agent for SZL Holdings. Respond helpfully and professionally.",
};

async function ensureVoiceAgentTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS voice_agent_sessions (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT NOT NULL UNIQUE,
      agent_id TEXT NOT NULL,
      domain TEXT NOT NULL DEFAULT 'general',
      thread_id TEXT NOT NULL,
      user_id TEXT,
      state TEXT NOT NULL DEFAULT 'idle',
      turn_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS voice_agent_turns (
      id BIGSERIAL PRIMARY KEY,
      turn_id TEXT NOT NULL UNIQUE,
      session_id TEXT NOT NULL,
      transcript TEXT NOT NULL,
      agent_response TEXT NOT NULL,
      tools_used TEXT[] DEFAULT '{}',
      tts_text TEXT,
      vad_detected BOOLEAN DEFAULT FALSE,
      interruption_handled BOOLEAN DEFAULT FALSE,
      latency_ms INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_agent_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_voice_turns_session ON voice_agent_turns(session_id);
  `).catch(() => {});
}

ensureVoiceAgentTables().catch(() => {});

export async function createVoiceSession(params: {
  domain?: VoiceAgentDomain;
  userId?: string;
  agentIdOverride?: string;
}): Promise<VoiceConversationSession> {
  const domain = params.domain ?? "general";
  const agentId = params.agentIdOverride ?? DOMAIN_AGENT_MAP[domain];
  const sessionId = `vsess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const threadId = `vthread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  await createThread(threadId, agentId, params.userId, `Voice Session - ${domain}`, {
    sessionId,
    domain,
    voiceMode: true,
  });

  await pool.query(
    `INSERT INTO voice_agent_sessions (session_id, agent_id, domain, thread_id, user_id, state, turn_count, created_at, last_activity_at)
     VALUES ($1,$2,$3,$4,$5,'idle',0,NOW(),NOW())`,
    [sessionId, agentId, domain, threadId, params.userId ?? null]
  );

  const session: VoiceConversationSession = {
    sessionId,
    agentId,
    domain,
    threadId,
    userId: params.userId,
    state: "idle",
    turnCount: 0,
    createdAt: now,
    lastActivityAt: now,
  };

  logger.info({ sessionId, agentId, domain }, "Voice agent session created");
  return session;
}

export async function processVoiceTurn(params: {
  sessionId: string;
  transcript: string;
  vadInterrupted?: boolean;
  userId?: string;
}): Promise<VoiceAgentResponse> {
  const turnId = `vturn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();

  const sessionResult = await pool.query(
    "SELECT * FROM voice_agent_sessions WHERE session_id = $1",
    [params.sessionId]
  );

  if (!sessionResult.rows[0]) {
    throw new Error(`Voice session ${params.sessionId} not found`);
  }

  const session = sessionResult.rows[0];
  const agentId = session.agent_id as string;
  const domain = session.domain as VoiceAgentDomain;
  const threadId = session.thread_id as string;

  await pool.query(
    "UPDATE voice_agent_sessions SET state = 'processing', last_activity_at = NOW() WHERE session_id = $1",
    [params.sessionId]
  );

  let agentResponse = "";
  let toolsUsed: string[] = [];

  try {
    const agentResult = await runAgent(agentId, params.transcript, {
      threadId,
      userId: params.userId ?? session.user_id,
      context: { voiceMode: true, domain, sessionId: params.sessionId },
      maxToolRounds: 3,
    });

    agentResponse = agentResult.response;
    toolsUsed = agentResult.toolsUsed ?? [];
  } catch (agentErr: any) {
    logger.warn({ agentErr, agentId, sessionId: params.sessionId }, "Voice agent run failed — falling back to direct inference");

    const shortMemory = await getShortTermMemory(threadId, 8);
    const domainPersona = DOMAIN_VOICE_PERSONAS[domain];

    const response = await gatewayInfer({
      messages: [
        { role: "system", content: `${domainPersona}\n\nKeep responses brief (2-4 sentences) for voice delivery. Be conversational and clear.` },
        ...shortMemory.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
        { role: "user", content: params.transcript },
      ],
      maxTokens: 300,
      strategy: "fastest",
    });

    agentResponse = response.content;
  }

  const ttsText = optimizeForTTS(agentResponse);

  const followUpResponse = await gatewayInfer({
    messages: [
      {
        role: "system",
        content: "Generate 2-3 short follow-up questions the user might ask next, based on the conversation. Return JSON array of strings.",
      },
      {
        role: "user",
        content: `User asked: "${params.transcript}"\nAgent responded: "${agentResponse.slice(0, 200)}"\n\nSuggest follow-up questions:`,
      },
    ],
    maxTokens: 150,
    strategy: "fastest",
  }).catch(() => null);

  let suggestedFollowUps: string[] = [];
  if (followUpResponse) {
    try {
      const match = followUpResponse.content.match(/\[[\s\S]*\]/);
      if (match) suggestedFollowUps = JSON.parse(match[0]);
    } catch { }
  }

  const latencyMs = Date.now() - startTime;

  await pool.query(
    `INSERT INTO voice_agent_turns (turn_id, session_id, transcript, agent_response, tools_used, tts_text, vad_detected, interruption_handled, latency_ms, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
    [
      turnId, params.sessionId, params.transcript, agentResponse, toolsUsed,
      ttsText, false, params.vadInterrupted ?? false, latencyMs,
    ]
  );

  await pool.query(
    "UPDATE voice_agent_sessions SET state = 'idle', turn_count = turn_count + 1, last_activity_at = NOW() WHERE session_id = $1",
    [params.sessionId]
  );

  await storeMessage(threadId, "user", params.transcript);
  await storeMessage(threadId, "assistant", agentResponse, { latencyMs, metadata: { voiceMode: true, turnId } });

  logger.info({ turnId, sessionId: params.sessionId, agentId, latencyMs }, "Voice agent turn processed");

  return {
    turnId,
    sessionId: params.sessionId,
    threadId,
    transcript: params.transcript,
    agentResponse,
    ttsText,
    toolsUsed,
    shouldContinue: true,
    suggestedFollowUps,
    latencyMs,
  };
}

function optimizeForTTS(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/([A-Z]{2,})/g, (match) => match.split("").join(".") + ".")
    .trim()
    .slice(0, 800);
}

export async function getVoiceSession(sessionId: string): Promise<VoiceConversationSession | null> {
  try {
    const result = await pool.query("SELECT * FROM voice_agent_sessions WHERE session_id = $1", [sessionId]);
    const row = result.rows[0];
    if (!row) return null;
    return {
      sessionId: row.session_id,
      agentId: row.agent_id,
      domain: row.domain,
      threadId: row.thread_id,
      userId: row.user_id,
      state: row.state,
      turnCount: row.turn_count,
      createdAt: row.created_at,
      lastActivityAt: row.last_activity_at,
    };
  } catch { return null; }
}

export async function getVoiceSessionTurns(sessionId: string, limit = 20): Promise<VoiceTurn[]> {
  try {
    const result = await pool.query(
      `SELECT turn_id, session_id, transcript, agent_response, tools_used, tts_text, vad_detected, interruption_handled, latency_ms, created_at
       FROM voice_agent_turns WHERE session_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [sessionId, limit]
    );
    return result.rows.map(row => ({
      turnId: row.turn_id,
      sessionId: row.session_id,
      transcript: row.transcript,
      agentResponse: row.agent_response,
      toolsUsed: row.tools_used ?? [],
      ttsReady: true,
      ttsText: row.tts_text ?? row.agent_response,
      vadDetected: row.vad_detected,
      interruptionHandled: row.interruption_handled,
      latencyMs: row.latency_ms,
      timestamp: row.created_at,
    }));
  } catch { return []; }
}

export async function listVoiceSessions(filters?: { domain?: string; userId?: string; limit?: number }): Promise<any[]> {
  try {
    const params: any[] = [];
    let query = `SELECT session_id, agent_id, domain, state, turn_count, created_at, last_activity_at FROM voice_agent_sessions WHERE 1=1`;
    let idx = 1;
    if (filters?.domain) { query += ` AND domain = $${idx}`; params.push(filters.domain); idx++; }
    if (filters?.userId) { query += ` AND user_id = $${idx}`; params.push(filters.userId); idx++; }
    params.push(filters?.limit ?? 20);
    const result = await pool.query(query + ` ORDER BY last_activity_at DESC LIMIT $${idx}`, params);
    return result.rows;
  } catch { return []; }
}

export async function endVoiceSession(sessionId: string): Promise<void> {
  await pool.query(
    "UPDATE voice_agent_sessions SET state = 'idle', last_activity_at = NOW() WHERE session_id = $1",
    [sessionId]
  ).catch(() => {});
}

export { DOMAIN_AGENT_MAP, DOMAIN_VOICE_PERSONAS };
