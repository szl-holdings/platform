import { approvalRequestsTable, dailyBriefingsTable, db } from "@szl-holdings/db";
import { desc, eq } from "drizzle-orm";
import {
  ApprovalAccessDeniedError,
  reviewApproval,
} from "@szl-holdings/covenant-policy";
import { Router } from "express";
import { z } from "zod";
import { logger } from "../../lib/logger";
import { authMiddleware } from "../../middlewares/auth";
import { callModel } from "../../services/ai/call-model";
import {
  persistSessionToFabric,
  recoverSessionFromFabric,
  type ConversationSession,
} from "../../lib/conversation-fabric.js";

// ---------------------------------------------------------------------------
// Lazy-init guards for OpenAI integration modules.
// Both the base client and the audio subpath throw during module evaluation if
// AI_INTEGRATIONS_OPENAI_BASE_URL / AI_INTEGRATIONS_OPENAI_API_KEY are unset.
// Deferring require() to the first route call keeps API server startup safe even
// when the OpenAI integration is not yet provisioned in the environment.
// ---------------------------------------------------------------------------

/** Typed alias for the audio library — avoids any escape hatches. */
type AudioLib = typeof import("@workspace/integrations-openai-ai-server/audio");
let _audioLib: AudioLib | undefined;

function getAudio(): AudioLib {
  if (!_audioLib) {
    // require() is used for synchronous lazy init. The module shape is verified
    // at compile time via the AudioLib type alias above.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _audioLib = require("@workspace/integrations-openai-ai-server/audio") as AudioLib;
  }
  return _audioLib;
}

/** Typed alias for the OpenAI client instance. */
type OpenAIClient = import("openai").default;
let _openai: OpenAIClient | undefined;

function getOpenAI(): OpenAIClient {
  if (!_openai) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@workspace/integrations-openai-ai-server") as { openai: OpenAIClient };
    _openai = mod.openai;
  }
  return _openai;
}

const router = Router();

router.use(authMiddleware);

// ---------------------------------------------------------------------------
// In-memory conversation session store (per-process, 30-min TTL)
// Persistence and recovery are handled by lib/conversation-fabric.ts via
// defaultMemoryStore (Postgres-backed when DATABASE_URL is set at boot).
// ---------------------------------------------------------------------------

const sessions = new Map<string, ConversationSession>();

// Evict sessions idle for >30 minutes every 5 minutes
setInterval(
  () => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [id, session] of sessions.entries()) {
      if (session.lastActiveAt < cutoff) sessions.delete(id);
    }
  },
  5 * 60 * 1000,
);

function createSession(id: string, ownerId: number): ConversationSession {
  const session: ConversationSession = {
    id,
    ownerId,
    title: "Voice Session",
    createdAt: new Date().toISOString(),
    lastActiveAt: Date.now(),
    messages: [],
  };
  sessions.set(id, session);
  return session;
}

/**
 * Retrieve a session and verify the requesting user owns it.
 *
 * Primary lookup: process-local sessions Map (fast, zero-copy).
 * Fallback lookup: recoverSessionFromFabric() — reads from defaultMemoryStore,
 * which is Postgres-backed at boot. Enables recovery after the 30-min idle
 * TTL evicts the session from the Map and after process restarts.
 *
 * Returns null if not found or if the caller is not the owner.
 */
function getOwnedSession(id: string, requesterId: number): ConversationSession | null {
  const session = sessions.get(id);
  if (session) {
    if (session.ownerId !== requesterId) return null;
    return session;
  }

  const recovered = recoverSessionFromFabric(id, requesterId);
  if (recovered) sessions.set(id, recovered);
  return recovered;
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const VoiceMessageBody = z.object({
  audio: z.string().min(1),
});

const BriefingAudioBody = z.object({
  text: z.string().max(8000),
  briefId: z.string().optional(),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).default("nova"),
});

const SimpleVoiceQueryBody = z.object({
  audio: z.string().min(1),
  systemPrompt: z.string().optional(),
  conversationId: z.string().optional(),
});

const TextQueryBody = z.object({
  query: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Session management endpoints
// ---------------------------------------------------------------------------

router.post("/conversations", (req, res) => {
  const ownerId = req.user!.id;
  const id = `${ownerId}-${String(Math.floor(Math.random() * 1e9))}`;
  const session = createSession(id, ownerId);
  persistSessionToFabric(session);
  res.json({ id: session.id, title: session.title, createdAt: session.createdAt });
});

router.get("/conversations/:id/messages", (req, res) => {
  const session = getOwnedSession(req.params.id, req.user!.id);
  if (!session) return res.json([]);
  res.json(
    session.messages.map((m, i) => ({
      id: `msg-${i}`,
      role: m.role,
      content: m.content,
    })),
  );
});

// ---------------------------------------------------------------------------
// SSE streaming voice endpoint (per-session and top-level aliases)
// ---------------------------------------------------------------------------

/**
 * SSE streaming voice endpoint for Command web portal.
 * Streams PCM16 audio chunks via Server-Sent Events for real-time playback.
 */
async function streamVoiceMessages(
  audio: string,
  res: import("express").Response,
  session?: ConversationSession,
) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (data: unknown) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {
      /* ignore write errors on closed connections */
    }
  };

  try {
    const audioBuffer = Buffer.from(audio, "base64");
    const { buffer, format } = await getAudio().ensureCompatibleFormat(audioBuffer);

    // Transcribe the user's audio first (Whisper STT) so we can persist the user turn
    let userTranscript = "";
    try {
      userTranscript = await getAudio().speechToText(buffer, format === "wav" ? "wav" : "mp3");
    } catch {
      /* STT failure is non-fatal — streaming can still continue */
    }

    const stream = await getAudio().voiceChatStream(buffer, "alloy", format);

    let assistantTranscript = "";

    for await (const event of stream) {
      if (event.type === "transcript") {
        sendEvent({ type: "transcript", data: event.data });
        if (typeof event.data === "string") assistantTranscript += event.data;
      } else if (event.type === "audio") {
        sendEvent({ type: "audio", data: event.data });
      }
    }

    // Persist exchange to session history
    if (session && assistantTranscript) {
      if (userTranscript) session.messages.push({ role: "user", content: userTranscript });
      session.messages.push({ role: "assistant", content: assistantTranscript });
      session.lastActiveAt = Date.now();
      persistSessionToFabric(session);
    }

    sendEvent({
      done: true,
      provenance: {
        model: "gpt-audio",
        voice: "alloy",
        format: "pcm16",
        generatedAt: new Date().toISOString(),
      },
    });
    res.end();
  } catch (err) {
    logger.error({ err }, "Voice message stream failed");
    sendEvent({ type: "error", error: "Voice processing failed" });
    res.end();
  }
}

router.post("/conversations/:id/voice-messages", async (req, res) => {
  const parsed = VoiceMessageBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Missing audio field (base64)" });
  }
  const session = getOwnedSession(req.params.id, req.user!.id);
  if (!session) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  await streamVoiceMessages(parsed.data.audio, res, session);
});

router.post("/voice-messages", async (req, res) => {
  const parsed = VoiceMessageBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Missing audio field (base64)" });
  }
  await streamVoiceMessages(parsed.data.audio, res);
});

// ---------------------------------------------------------------------------
// Non-streaming voice query (JSON response, supports conversation history)
// ---------------------------------------------------------------------------

/**
 * Non-streaming voice query endpoint.
 * Accepts base64-encoded audio, returns JSON with transcripts and MP3 audio.
 * Optionally uses session history from conversationId for contextual responses.
 */
router.post("/voice-query", async (req, res) => {
  const parsed = SimpleVoiceQueryBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Missing audio field (base64)" });
  }

  const { audio, conversationId } = parsed.data;
  const session = conversationId ? getOwnedSession(conversationId, req.user!.id) : null;

  try {
    const audioBuffer = Buffer.from(audio, "base64");
    const { buffer, format } = await getAudio().ensureCompatibleFormat(audioBuffer);

    // Step 1: Transcribe the user's spoken audio to text (Whisper STT)
    const userTranscript = await getAudio().speechToText(buffer, format === "wav" ? "wav" : "mp3");

    // Build system context with conversation history + navigation instructions
    const historyContext =
      session && session.messages.length > 0
        ? "\n\nRecent conversation:\n" +
          session.messages
            .slice(-6)
            .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
            .join("\n")
        : "";

    const systemPrompt =
      parsed.data.systemPrompt ??
      "You are OMNIA, the AI voice intelligence layer for the SZL Holdings Unified Command portal. " +
        "You have visibility across all portfolio domains: maritime fleet (Vessels), real estate (Terra), " +
        "cybersecurity (Aegis/Sentra), legal matters (Counsel), brand orchestration (A11oy), and executive briefings (Pulse). " +
        "When the user asks to navigate, open, or go to an app or section, begin your spoken response with " +
        "'Navigating to [name]' so the client can route automatically. " +
        "Keep voice responses concise — under 4 sentences. Be decisive and executive in tone." +
        historyContext;

    // Step 2: Generate AI response with TTS audio output
    const { transcript: assistantTranscript, audioResponse } = await getAudio().voiceChat(
      buffer,
      "nova",
      format,
      "mp3",
      systemPrompt,
    );

    // Step 3: Persist both user and assistant turns to session history
    if (session) {
      if (userTranscript) session.messages.push({ role: "user", content: userTranscript });
      if (assistantTranscript) session.messages.push({ role: "assistant", content: assistantTranscript });
      session.lastActiveAt = Date.now();
      persistSessionToFabric(session);
    }

    const provenance = {
      model: "gpt-4o-audio-preview",
      sttModel: "whisper-1",
      voice: "nova",
      format: "mp3",
      generatedAt: new Date().toISOString(),
      ...(conversationId ? { conversationId } : {}),
    };

    // Estimated cost: gpt-4o-audio-preview ~$0.10/1K audio-in-tokens; text output ~$0.20/1K
    // Approximate: 4 chars ≈ 1 token for text components
    const estInputTokens = Math.round((userTranscript.length + (session?.messages.length ?? 0) * 40) / 4);
    const estOutputTokens = Math.round(assistantTranscript.length / 4);
    const estCostUsd =
      Math.round((estInputTokens * 0.0001 + estOutputTokens * 0.0002) * 100000) / 100000;

    logger.info(
      {
        conversationId,
        userTranscriptChars: userTranscript.length,
        assistantTranscriptChars: assistantTranscript.length,
        audioBytesEstimate: audioResponse.byteLength,
        historyTurns: session?.messages.length ?? 0,
        model: provenance.model,
        estInputTokens,
        estOutputTokens,
        estCostUsd,
      },
      "[voice-telemetry] Voice query processed",
    );

    res.json({
      userTranscript,
      assistantTranscript,
      audioBase64: audioResponse.toString("base64"),
      provenance,
    });
  } catch (err) {
    logger.error({ err }, "Voice query failed");
    res.status(500).json({ error: "Voice query failed" });
  }
});

// ---------------------------------------------------------------------------
// Text query (supports conversation history)
// ---------------------------------------------------------------------------

/**
 * Text query endpoint — plain text in, AI text response out.
 * Optionally threads conversation history from a session.
 */
router.post("/text-query", async (req, res) => {
  const parsed = TextQueryBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Missing query field" });
  }

  const { query, conversationId } = parsed.data;
  const session = conversationId ? getOwnedSession(conversationId, req.user!.id) : null;

  try {
    const systemMessage =
      "You are OMNIA, the AI portfolio intelligence system for SZL Holdings. " +
      "You have visibility across all domains: maritime fleet, real estate, cybersecurity, legal matters, " +
      "and the broader portfolio. Give concise, executive-level answers. " +
      "Reference specific entities, metrics, and actions when relevant. " +
      "Keep responses under 3 sentences unless more detail is necessary.";

    const historyMessages: Array<{ role: "user" | "assistant"; content: string }> =
      session?.messages.slice(-6) ?? [];

    const { content: response } = await callModel({
      provider: 'openai',
      model: 'gpt-4o-mini',
      surface: 'omnia-chat',
      fn: async () => {
        const completion = await getOpenAI().chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemMessage },
            ...historyMessages,
            { role: "user", content: query },
          ],
          max_tokens: 400,
        });
        const text = completion.choices[0]?.message?.content?.trim() ?? "Unable to retrieve portfolio data at this time.";
        return { promptTokens: completion.usage?.prompt_tokens ?? 0, completionTokens: completion.usage?.completion_tokens ?? 0, content: text };
      },
    });

    // Persist to session history
    if (session) {
      session.messages.push({ role: "user", content: query });
      session.messages.push({ role: "assistant", content: response });
      session.lastActiveAt = Date.now();
      persistSessionToFabric(session);
    }

    logger.info(
      {
        conversationId,
        queryChars: query.length,
        responseChars: response.length,
        historyTurns: session?.messages.length ?? 0,
        model: "gpt-4o-mini",
      },
      "[voice-telemetry] Text query processed",
    );

    res.json({ response });
  } catch (err) {
    logger.error({ err }, "Text query failed");
    res.status(500).json({ error: "Text query failed" });
  }
});

// ---------------------------------------------------------------------------
// Voice Approval — auditable voice-driven HITL action approvals
// ---------------------------------------------------------------------------

const VoiceApprovalBody = z.object({
  /**
   * Numeric ID of a real approval_requests row. The client should obtain this
   * from GET /approvals?status=pending before presenting the approval to the user.
   */
  pendingActionId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  transcript: z.string().min(1),
  conversationId: z.string().optional(),
});

/**
 * Explicit approval intent phrases that constitute a confirmed voice approval.
 * The transcript (lowercased) must contain at least one of these phrases.
 */
const APPROVAL_PHRASES = [
  "approve",
  "approved",
  "confirm",
  "confirmed",
  "yes, proceed",
  "proceed",
  "authorise",
  "authorize",
  "i approve",
  "i confirm",
  "go ahead",
];

/**
 * Voice approval endpoint — auditable HITL action approval via voice command.
 *
 * 1. Validates the approval exists in the DB and is in a reviewable state.
 * 2. Verifies the caller's org matches the approval's orgId (tenant guard).
 * 3. Scores the user's transcript against explicit approval phrases.
 * 4. Only persists the approval decision if intent confidence is high enough.
 * 5. Writes an audit trail entry via reviewApproval() (covenant-policy service).
 *
 * POST /api/openai/voice-approval
 * Body: { pendingActionId (numeric), transcript, conversationId? }
 * Returns: { approved, actionId, reason, approval (DB record), provenance }
 */
router.post("/voice-approval", async (req, res) => {
  const parsed = VoiceApprovalBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "pendingActionId (numeric) and transcript are required" });
  }

  const { transcript, conversationId } = parsed.data;
  const approvalId = Number(parsed.data.pendingActionId);
  const userId = req.user!.id;
  // Derive orgId the same way as the main approvals route tenant guard
  const isAdmin = req.user!.roles?.some((r: string) => r === "super_admin" || r === "admin");
  const userOrgId = isAdmin ? null : (req.user!.orgs?.[0]?.orgId ?? null);

  // 1. Load the approval from the DB — verify it exists and is pending/escalated
  const [existing] = await db
    .select()
    .from(approvalRequestsTable)
    .where(eq(approvalRequestsTable.id, approvalId));

  if (!existing) {
    return res.status(404).json({ error: `Approval ${approvalId} not found` });
  }

  if (existing.status !== "pending" && existing.status !== "escalated") {
    return res.status(409).json({
      error: `Approval ${approvalId} is already in status '${existing.status}' — cannot review`,
    });
  }

  // 2. Score intent from the voice transcript
  const lowerTranscript = transcript.toLowerCase();
  const matchedPhrases = APPROVAL_PHRASES.filter((p) => lowerTranscript.includes(p));
  const intentScore =
    Math.round((Math.min(matchedPhrases.length / 3 + 0.1, 1.0)) * 100) / 100;
  const hasApprovalIntent = matchedPhrases.length > 0;

  if (!hasApprovalIntent) {
    logger.info(
      { userId, approvalId, conversationId, intentScore, matchedPhrases },
      "[voice-approval] Approval intent not confirmed — no state change",
    );
    return res.json({
      approved: false,
      actionId: approvalId,
      reason: "No explicit approval phrase found in voice transcript",
      approval: null,
      provenance: {
        userId,
        approvalId,
        conversationId: conversationId ?? null,
        transcript,
        matchedPhrases,
        intentScore,
        approved: false,
        model: "intent-pattern-v1",
        decidedAt: new Date().toISOString(),
        source: "voice-approval",
      },
    });
  }

  // 3. Persist the approval decision via the covenant-policy service
  let updatedApproval;
  try {
    updatedApproval = await reviewApproval({
      approvalId,
      actorId: userId,
      actorRole: req.user!.roles?.[0],
      decision: "approved",
      note: `Voice-approved via OMNIA. Transcript: "${transcript.slice(0, 200)}"`,
      correlationId: conversationId,
      serviceAttribution: "omnia-voice",
      expectedOrgId: userOrgId,
    });
  } catch (err) {
    if (err instanceof ApprovalAccessDeniedError) {
      return res.status(403).json({ error: err.message });
    }
    throw err;
  }

  const provenance = {
    userId,
    approvalId,
    conversationId: conversationId ?? null,
    transcript,
    matchedPhrases,
    intentScore,
    approved: true,
    decision: "approved",
    model: "intent-pattern-v1",
    decidedAt: updatedApproval.approvedAt?.toISOString() ?? new Date().toISOString(),
    source: "voice-approval",
    serviceAttribution: "omnia-voice",
  };

  logger.info(
    {
      userId,
      approvalId,
      conversationId,
      intentScore,
      matchedPhrases,
      transcriptChars: transcript.length,
      approvalTitle: existing.title,
    },
    "[voice-approval] Approval persisted via voice command",
  );

  res.json({
    approved: true,
    actionId: approvalId,
    reason: `Approval persisted — intent confirmed (${matchedPhrases[0]})`,
    approval: updatedApproval,
    provenance,
  });
});

// ---------------------------------------------------------------------------
// Briefing audio (TTS) with in-process cache
// ---------------------------------------------------------------------------

interface CachedBriefingAudio {
  audioBase64: string;
  mimeType: string;
  provenance: object;
  cachedAt: number;
}

// Keyed by `${briefId}:${voice}` — 1-hour TTL, max 50 entries
const briefingAudioCache = new Map<string, CachedBriefingAudio>();
const BRIEFING_CACHE_TTL_MS = 60 * 60 * 1000;

setInterval(() => {
  const cutoff = Date.now() - BRIEFING_CACHE_TTL_MS;
  for (const [k, v] of briefingAudioCache.entries()) {
    if (v.cachedAt < cutoff) briefingAudioCache.delete(k);
  }
  // Trim to 50 most-recent entries
  if (briefingAudioCache.size > 50) {
    const oldest = [...briefingAudioCache.entries()]
      .sort((a, b) => a[1].cachedAt - b[1].cachedAt)
      .slice(0, briefingAudioCache.size - 50);
    for (const [k] of oldest) briefingAudioCache.delete(k);
  }
}, 10 * 60 * 1000);

/**
 * Briefing audio endpoint.
 * Accepts text, returns JSON with MP3 audio as base64 and provenance envelope.
 * Cache-hits return immediately; misses call OpenAI TTS and populate the cache.
 */
router.post("/briefing-audio", async (req, res) => {
  const parsed = BriefingAudioBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Missing text field" });
  }

  const { text, voice, briefId } = parsed.data;
  const cacheKey = briefId ? `${briefId}:${voice}` : null;

  // Return cached audio if available and fresh
  if (cacheKey) {
    const cached = briefingAudioCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < BRIEFING_CACHE_TTL_MS) {
      logger.info({ cacheKey, source: "cache" }, "[briefing-audio] Cache hit");
      return res.json({ ...cached, source: "cache" });
    }
  }

  try {
    const startMs = Date.now();
    const audioBuffer = await getAudio().textToSpeech(text, voice, "mp3");
    const durationMs = Date.now() - startMs;

    const provenance = {
      model: "tts-1",
      voice,
      format: "mp3",
      generatedAt: new Date().toISOString(),
      ...(briefId ? { briefId } : {}),
    };

    // Estimated cost: tts-1 $15/1M characters = $0.000015/char
    const estCostUsdTts = Math.round(text.length * 0.000015 * 100000) / 100000;

    logger.info(
      {
        briefId,
        voice,
        textChars: text.length,
        audioBytesEstimate: audioBuffer.byteLength,
        durationMs,
        model: provenance.model,
        estCostUsd: estCostUsdTts,
      },
      "[voice-telemetry] Briefing audio generated",
    );

    const payload: CachedBriefingAudio = {
      audioBase64: audioBuffer.toString("base64"),
      mimeType: "audio/mpeg",
      provenance,
      cachedAt: Date.now(),
    };

    if (cacheKey) briefingAudioCache.set(cacheKey, payload);

    res.json({ ...payload, source: "generated" });
  } catch (err) {
    logger.error({ err }, "Briefing audio generation failed");
    res.status(500).json({ error: "Audio generation failed" });
  }
});

// ---------------------------------------------------------------------------
// Daily briefing audio — generated from the daily_briefings DB record
// ---------------------------------------------------------------------------

/**
 * GET /openai/daily-briefing/today
 *
 * Fetches the most recent published daily briefing from the DB, generates TTS audio
 * (or returns a cached copy), and returns the audio + provenance envelope.
 * Mobile and web clients use this for the "push/pull" daily brief playback flow.
 */
router.get("/daily-briefing/today", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Query DB for most recent published briefing (today or earlier)
    const rows = await db
      .select()
      .from(dailyBriefingsTable)
      .where(eq(dailyBriefingsTable.isPublished, true))
      .orderBy(desc(dailyBriefingsTable.generatedAt))
      .limit(1);

    const row = rows[0];
    const cacheKey = row ? `daily:${row.briefingDate}:nova` : `daily:${today}:nova`;

    // Return from cache if available
    const cached = briefingAudioCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < BRIEFING_CACHE_TTL_MS) {
      logger.info({ cacheKey, briefingDate: row?.briefingDate }, "[briefing-audio] Daily briefing cache hit");
      return res.json({
        briefingDate: row?.briefingDate ?? today,
        headline: row?.headline,
        ...cached,
        source: "cache",
      });
    }

    // Build narration text from DB briefing or a default template
    let narrationText: string;
    let headline = "Daily Executive Intelligence Briefing";

    if (row) {
      headline = row.headline;
      narrationText = [
        `Daily Executive Intelligence Briefing — ${row.briefingDate}.`,
        row.headline,
        row.executiveSummary,
      ].join("\n\n");
    } else {
      narrationText =
        `Daily Executive Intelligence Briefing — ${today}. ` +
        "No briefing has been generated for today yet. " +
        "The intelligence aggregation system is collecting signals across all domains. " +
        "Please check back shortly.";
    }

    // Generate TTS audio
    const startMs = Date.now();
    const audioBuffer = await getAudio().textToSpeech(narrationText, "nova", "mp3");
    const durationMs = Date.now() - startMs;

    const provenance = {
      model: "tts-1",
      voice: "nova",
      format: "mp3",
      generatedAt: new Date().toISOString(),
      briefingDate: row?.briefingDate ?? today,
      source: "generated",
    };

    logger.info(
      {
        briefingDate: row?.briefingDate ?? today,
        textChars: narrationText.length,
        audioBytesEstimate: audioBuffer.byteLength,
        durationMs,
        cached: false,
      },
      "[voice-telemetry] Daily briefing audio generated",
    );

    const payload: CachedBriefingAudio = {
      audioBase64: audioBuffer.toString("base64"),
      mimeType: "audio/mpeg",
      provenance,
      cachedAt: Date.now(),
    };

    briefingAudioCache.set(cacheKey, payload);

    res.json({
      briefingDate: row?.briefingDate ?? today,
      headline,
      ...payload,
      source: "generated",
    });
  } catch (err) {
    logger.error({ err }, "Daily briefing audio fetch failed");
    res.status(500).json({ error: "Daily briefing audio unavailable" });
  }
});

export default router;
