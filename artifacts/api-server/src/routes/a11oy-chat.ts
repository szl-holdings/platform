import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { logger } from '../lib/logger';
import { runMirrorEval, storeEval } from '../a11oy/runtime/evals/mirror-eval.js';
import { runPCEGate, generateProofPacket, type PCEGateResult } from '../a11oy/runtime/governance/pce-gate.js';
import { tagAIContent } from '@szl-holdings/proof-chain';
import { db } from '@szl-holdings/db';
import { sql } from 'drizzle-orm';

const router = Router();

const ANTHROPIC_BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const ANTHROPIC_KEY = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

const MODEL_LANE_MAP: Record<string, { model: string; lane: string; temperature: number }> = {
  'a1.1oy-sovereign': { model: 'claude-sonnet-4-6', lane: 'reasoning', temperature: 0.7 },
  'a1.1oy-code': { model: 'claude-sonnet-4-6', lane: 'tool_calling', temperature: 0.3 },
  'a1.1oy-reason': { model: 'claude-sonnet-4-6', lane: 'reasoning', temperature: 0.5 },
  'a1.1oy-fast': { model: 'claude-sonnet-4-6', lane: 'triage', temperature: 0.6 },
};

const MAX_TOKENS = 4096;
const MAX_MESSAGES = 40;
const MAX_CHARS_PER_MESSAGE = 16_000;
const MAX_TOTAL_CHARS = 64_000;
const MAX_CONCURRENT = 6;
const PER_IP_WINDOW_MS = 60_000;
const PER_IP_MAX_REQUESTS = 12;

let inflight = 0;
const ipBuckets = new Map<string, number[]>();
function checkIpRate(ip: string): boolean {
  const now = Date.now();
  const arr = (ipBuckets.get(ip) || []).filter((t) => now - t < PER_IP_WINDOW_MS);
  if (arr.length >= PER_IP_MAX_REQUESTS) {
    ipBuckets.set(ip, arr);
    return false;
  }
  arr.push(now);
  ipBuckets.set(ip, arr);
  if (ipBuckets.size > 5_000) {
    for (const [k, v] of ipBuckets) {
      if (v.length === 0 || now - v[v.length - 1] > PER_IP_WINDOW_MS) ipBuckets.delete(k);
    }
  }
  return true;
}

const SYSTEM_PROMPT = `You are A11oy — the Orchestration and Decision Intelligence layer of the SZL Holdings governed platform.

You are real, you stream from Claude (claude-sonnet-4-6) via the Replit AI Integrations proxy. You do not invent capabilities. You answer technical, operational, and product-strategy questions about the SZL Holdings platform truthfully.

When asked what you can do, describe these things accurately:
- Multi-turn conversation
- Code generation, code review, code explanation in any major language
- Document analysis (when text is pasted into the conversation)
- Reasoning, planning, architectural advice
- Markdown formatting including fenced code blocks

When asked about SZL Holdings facts, defer to the SOURCE_OF_TRUTH.md numbers:
- 7 customer-facing product surfaces orchestrated by A11oy
- 6 platform primitives (Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, Event Fabric)
- 848 provisioned database tables, 5,524 API endpoints, 126 monorepo packages
- Public proof: github.com/szl-holdings/ouroboros (v6.2.0, 172/172 tests passing); github.com/szl-holdings/ouroboros-thesis (paper-v3-2.0.0, concept DOI 10.5281/zenodo.19944926 — always resolves to latest version; v3 record at https://zenodo.org/records/19983066)

If you don't know something, say so. Never fabricate metrics, contracts, certifications, or partnerships.

Available tools you can reference when users ask about platform capabilities:
- workcell.inspect: Inspect workcell execution state
- signal_mesh.query: Query the signal mesh for anomalies
- covenant.check: Validate covenant compliance
- proof.create: Generate proof packets
- fabric.query: Query the A11oy Fabric
- mirror_eval.score: Run MirrorEval assessment
- connector_hub.discover: Discover connected tools`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    configured: Boolean(ANTHROPIC_BASE && ANTHROPIC_KEY),
    model: 'claude-sonnet-4-6',
    provider: 'anthropic-via-replit-ai-integrations',
    lanes: Object.keys(MODEL_LANE_MAP),
  });
});

router.get('/conversations', async (_req: Request, res: Response) => {
  try {
    const rows = await db.execute(
      sql`SELECT id, title, created_at AS "createdAt" FROM conversations ORDER BY created_at DESC LIMIT 50`
    );
    res.json({ ok: true, data: rows.rows ?? rows });
  } catch (err) {
    logger.warn({ err }, 'Failed to list conversations');
    res.json({ ok: true, data: [] });
  }
});

router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  const convId = parseInt(req.params.id, 10);
  if (isNaN(convId)) {
    res.status(400).json({ error: 'invalid conversation id' });
    return;
  }
  try {
    const rows = await db.execute(
      sql`SELECT id, conversation_id AS "conversationId", role, content, created_at AS "createdAt" FROM messages WHERE conversation_id = ${convId} ORDER BY created_at ASC LIMIT 200`
    );
    res.json({ ok: true, data: rows.rows ?? rows });
  } catch (err) {
    logger.warn({ err }, 'Failed to load messages');
    res.json({ ok: true, data: [] });
  }
});

router.post('/chat', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const actionId = `chat-${randomUUID().slice(0, 8)}`;

  if (!ANTHROPIC_BASE || !ANTHROPIC_KEY) {
    res.status(503).json({ error: 'AI integration not configured', errorType: 'provider_unavailable' });
    return;
  }

  const ip = (req.ip || req.socket?.remoteAddress || 'unknown').toString();
  if (!checkIpRate(ip)) {
    res.status(429).json({ error: `Rate limit: max ${PER_IP_MAX_REQUESTS} requests per minute`, errorType: 'rate_limit' });
    return;
  }
  if (inflight >= MAX_CONCURRENT) {
    res.status(503).json({ error: 'Server busy — too many concurrent streams', errorType: 'server_busy' });
    return;
  }

  const rawMessages = req.body?.messages as ChatMessage[] | undefined;
  const modelId = (req.body?.model as string) || 'a1.1oy-sovereign';
  const conversationId = req.body?.conversationId as number | undefined;

  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    res.status(400).json({ error: 'messages array required', errorType: 'validation' });
    return;
  }
  if (rawMessages.length > MAX_MESSAGES) {
    res.status(400).json({ error: `Too many messages: max ${MAX_MESSAGES}`, errorType: 'validation' });
    return;
  }

  const cleaned = rawMessages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS_PER_MESSAGE) }));

  if (cleaned.length === 0) {
    res.status(400).json({ error: 'No valid messages', errorType: 'validation' });
    return;
  }

  const totalChars = cleaned.reduce((n, m) => n + m.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    res.status(413).json({ error: `Conversation too large: ${totalChars} chars exceeds limit`, errorType: 'payload_too_large' });
    return;
  }

  const laneConfig = MODEL_LANE_MAP[modelId] ?? MODEL_LANE_MAP['a1.1oy-sovereign']!;

  let pceResult: PCEGateResult | null = null;
  try {
    pceResult = await runPCEGate({
      actionId,
      originSignalIds: [`chat-input-${actionId}`],
      vertical: 'platform',
      riskLevel: 'low',
      isDestructive: false,
      actionDescription: `Chat inference via ${modelId}`,
    });
  } catch (err) {
    logger.warn({ err }, 'PCE gate check failed — proceeding with chat');
  }

  if (pceResult && !pceResult.allowed && pceResult.errorType === 'approval_required') {
    res.status(403).json({
      error: `Policy requires approval: ${pceResult.blockedReason}`,
      errorType: 'policy_block',
      approvalTier: pceResult.approvalTier,
    });
    return;
  }

  const mirrorEval = runMirrorEval({
    targetId: actionId,
    targetType: 'action',
    evidenceRefs: [`chat-input-${actionId}`],
    sourceCoverage: 0.85,
    hasPriorApproval: false,
    isDestructive: false,
    isDemoMode: false,
    actionDescription: `Chat inference via ${modelId}`,
    riskLevel: 'low',
  });
  storeEval(mirrorEval);

  inflight += 1;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let ended = false;
  const send = (payload: Record<string, unknown>) => {
    if (ended || res.writableEnded) return;
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch { /* connection gone */ }
  };

  const upstreamAbort = new AbortController();
  let inflightDecremented = false;
  const cleanup = () => {
    if (ended) return;
    ended = true;
    if (!inflightDecremented) {
      inflight = Math.max(0, inflight - 1);
      inflightDecremented = true;
    }
    try { upstreamAbort.abort(); } catch { /* noop */ }
    try { if (!res.writableEnded) res.end(); } catch { /* noop */ }
  };

  req.on('close', cleanup);
  req.on('aborted', cleanup);

  send({
    type: 'governance',
    pceContractId: pceResult?.contract?.contractId ?? null,
    mirrorEval: {
      evalId: mirrorEval.evalId,
      disposition: mirrorEval.disposition,
      overallScore: mirrorEval.overallScore,
      scores: mirrorEval.scores.map((s) => ({
        dimension: s.dimension,
        score: s.score,
      })),
    },
  });

  if (pceResult?.contract) {
    send({
      type: 'tools',
      tools: [
        { name: 'pce_gate.evaluate', status: 'complete', duration: Date.now() - startTime },
        { name: 'mirror_eval.score', status: 'complete', duration: Date.now() - startTime },
      ],
    });
  }

  try {
    const upstream = await fetch(`${ANTHROPIC_BASE.replace(/\/$/, '')}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: laneConfig.model,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: cleaned,
        stream: true,
        temperature: laneConfig.temperature,
      }),
      signal: upstreamAbort.signal,
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      logger.warn(`a11oy-chat upstream failed status=${upstream.status}: ${text.slice(0, 300)}`);

      const errorType = upstream.status === 429 ? 'rate_limit'
        : upstream.status === 503 ? 'model_unavailable'
        : 'upstream_error';

      send({ type: 'error', error: `upstream status ${upstream.status}`, errorType, detail: text.slice(0, 300) });
      send({ type: 'done', done: true });
      cleanup();
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let totalCharsOut = 0;
    let fullContent = '';

    while (!ended) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line || !line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            const t = ev.delta.text as string;
            totalCharsOut += t.length;
            fullContent += t;
            send({ type: 'content', content: t });
          } else if (ev.type === 'message_start' && ev.message?.usage) {
            send({ type: 'usage_start', inputTokens: ev.message.usage.input_tokens ?? 0 });
          } else if (ev.type === 'message_delta' && ev.usage) {
            send({ type: 'usage_delta', outputTokens: ev.usage.output_tokens ?? 0 });
          } else if (ev.type === 'message_stop') {
            // handled after loop
          } else if (ev.type === 'error') {
            send({ type: 'error', error: ev.error?.message || 'upstream error', errorType: 'upstream_error' });
          }
        } catch { /* ignore partial event parse errors */ }
      }
    }

    const latencyMs = Date.now() - startTime;
    const estimatedInputTokens = Math.ceil(totalChars / 4);
    const estimatedOutputTokens = Math.ceil(totalCharsOut / 4);
    const estimatedCostUsd = (estimatedInputTokens * 0.000003) + (estimatedOutputTokens * 0.000015);

    let proofId: string | null = null;
    if (pceResult?.contract) {
      try {
        const packet = generateProofPacket(pceResult.contract);
        proofId = packet.packetId;
      } catch { /* non-fatal */ }
    }

    try {
      await tagAIContent({
        contentId: actionId,
        contentType: 'a11oy-chat-response',
        sourceClass: 'llm_generated',
        confidenceScore: mirrorEval.overallScore,
        modelLane: laneConfig.lane,
        modelId: laneConfig.model,
        modelProvider: 'anthropic',
        correlationId: actionId,
        serviceAttribution: 'a11oy-chat',
      });
    } catch { /* non-fatal */ }

    let savedConversationId = conversationId ?? null;
    const lastUserMsg = cleaned[cleaned.length - 1];
    try {
      if (!savedConversationId) {
        const title = (lastUserMsg?.content ?? 'New conversation').slice(0, 100);
        const result = await db.execute(
          sql`INSERT INTO conversations (title) VALUES (${title}) RETURNING id`
        );
        const row = (result.rows ?? result)?.[0] as { id: number } | undefined;
        savedConversationId = row?.id ?? null;
      }

      if (savedConversationId && lastUserMsg) {
        await db.execute(
          sql`INSERT INTO messages (conversation_id, role, content) VALUES (${savedConversationId}, ${lastUserMsg.role}, ${lastUserMsg.content})`
        );
      }

      if (savedConversationId && fullContent) {
        await db.execute(
          sql`INSERT INTO messages (conversation_id, role, content) VALUES (${savedConversationId}, ${'assistant'}, ${fullContent})`
        );
      }
    } catch (err) {
      logger.warn({ err }, 'Failed to persist conversation');
    }

    send({
      type: 'provenance',
      provenance: {
        model: laneConfig.model,
        modelLane: modelId,
        lane: laneConfig.lane,
        provider: 'anthropic',
        latencyMs,
        estimatedCostUsd: Math.round(estimatedCostUsd * 1_000_000) / 1_000_000,
        tokens: { input: estimatedInputTokens, output: estimatedOutputTokens },
        trustScore: mirrorEval.overallScore,
        proofId,
        pceContractId: pceResult?.contract?.contractId ?? null,
        mirrorEvalId: mirrorEval.evalId,
        conversationId: savedConversationId,
      },
    });

    send({ type: 'done', done: true, chars: totalCharsOut });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('aborted') || upstreamAbort.signal.aborted) {
      // client disconnected; quiet exit
    } else {
      logger.warn(`a11oy-chat error: ${msg}`);
      send({ type: 'error', error: msg, errorType: 'internal_error' });
      send({ type: 'done', done: true });
    }
  } finally {
    cleanup();
  }
});

export default router;
