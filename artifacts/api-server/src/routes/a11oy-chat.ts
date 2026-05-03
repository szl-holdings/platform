import { Router, type Request, type Response } from 'express';
import { logger } from '../lib/logger';

const router = Router();

const ANTHROPIC_BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const ANTHROPIC_KEY = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-6';
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

If you don't know something, say so. Never fabricate metrics, contracts, certifications, or partnerships.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    configured: Boolean(ANTHROPIC_BASE && ANTHROPIC_KEY),
    model: MODEL,
    provider: 'anthropic-via-replit-ai-integrations',
  });
});

router.post('/chat', async (req: Request, res: Response) => {
  if (!ANTHROPIC_BASE || !ANTHROPIC_KEY) {
    res.status(503).json({ error: 'Anthropic AI integration not configured' });
    return;
  }

  const ip = (req.ip || req.socket?.remoteAddress || 'unknown').toString();
  if (!checkIpRate(ip)) {
    res.status(429).json({ error: `rate limit: max ${PER_IP_MAX_REQUESTS} requests per minute per IP` });
    return;
  }
  if (inflight >= MAX_CONCURRENT) {
    res.status(503).json({ error: `server busy: ${MAX_CONCURRENT} concurrent streams active` });
    return;
  }


  const messages = req.body?.messages as ChatMessage[] | undefined;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array required' });
    return;
  }
  if (messages.length > MAX_MESSAGES) {
    res.status(400).json({ error: `too many messages: max ${MAX_MESSAGES}` });
    return;
  }

  const cleaned = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS_PER_MESSAGE) }));

  if (cleaned.length === 0) {
    res.status(400).json({ error: 'no valid messages' });
    return;
  }

  const totalChars = cleaned.reduce((n, m) => n + m.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    res.status(413).json({ error: `conversation too large: ${totalChars} chars > limit ${MAX_TOTAL_CHARS}` });
    return;
  }

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
    } catch {
      /* connection went away mid-write */
    }
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
    try {
      upstreamAbort.abort();
    } catch {
      /* noop */
    }
    try {
      if (!res.writableEnded) res.end();
    } catch {
      /* noop */
    }
  };

  req.on('close', cleanup);
  req.on('aborted', cleanup);

  try {
    const upstream = await fetch(`${ANTHROPIC_BASE.replace(/\/$/, '')}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: cleaned,
        stream: true,
      }),
      signal: upstreamAbort.signal,
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      logger.warn(`a11oy-chat upstream failed status=${upstream.status}: ${text.slice(0, 300)}`);
      send({ error: `upstream status ${upstream.status}`, detail: text.slice(0, 300) });
      send({ done: true });
      cleanup();
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let totalCharsOut = 0;

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
            send({ content: t });
          } else if (ev.type === 'message_stop') {
            send({ done: true, chars: totalCharsOut });
          } else if (ev.type === 'error') {
            send({ error: ev.error?.message || 'upstream error' });
          }
        } catch {
          /* ignore parse errors on partial events */
        }
      }
    }

    send({ done: true, chars: totalCharsOut });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('aborted') || upstreamAbort.signal.aborted) {
      // client disconnected; quiet exit
    } else {
      logger.warn(`a11oy-chat error: ${msg}`);
      send({ error: msg });
      send({ done: true });
    }
  } finally {
    cleanup();
  }
});

export default router;
