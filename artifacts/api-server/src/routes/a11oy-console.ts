// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
/**
 * A11oy Console — BFF route for the Workbench-style Console page.
 *
 * POST /api/a11oy/console/run          — SSE stream through governance pipeline
 * POST /api/a11oy/console/count-tokens — pre-flight token count (no inference)
 * GET  /api/a11oy/console/models       — model registry grouped by provider
 * POST /api/a11oy/console/save-workcell — persist a Workcell template via engine
 * GET  /api/a11oy/console/providers    — live provider availability
 *
 * Architecture:
 * - Claude (Anthropic) models → Anthropic SSE directly (same as a11oy-chat.ts),
 *   with native prompt-caching and extended-thinking parameters
 * - OpenAI, DeepSeek, Gemini (via Gemini AI endpoint), HF models → respective
 *   OpenAI-compatible SSE endpoints via the model-router provider functions
 * - All runs are gated through PCE governance and MirrorEval before inference,
 *   and tagged with proof packets via ProofLedger after completion.
 */

import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { logger } from '../lib/logger.js';
import { runMirrorEval, storeEval } from '../a11oy/runtime/evals/mirror-eval.js';
import { runPCEGate, generateProofPacket, type PCEGateResult } from '../a11oy/runtime/governance/pce-gate.js';
import { createWorkcell } from '../a11oy/runtime/workcells/engine.js';
import { tagAIContent } from '@szl-holdings/proof-chain';
import { MODEL_REGISTRY } from '@szl-holdings/ai-engine/model-registry';
import {
  countTokens,
  runInputModeration,
  runOutputModeration,
} from '@szl-holdings/ai-engine/providers/anthropic';
import {
  callWithProvider,
  type ModelRequest,
  type ModelProvider,
} from '../a11oy/runtime/router/model-router.js';

const router = Router();

// ── Env ────────────────────────────────────────────────────────────────────────

const ANTHROPIC_BASE = (process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL ?? '').replace(/\/$/, '');
const ANTHROPIC_KEY = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? '';
const OPENAI_BASE = 'https://api.openai.com';
const OPENAI_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? '';
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY ?? '';
const HF_TOKEN = process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY ?? '';
const HF_BASE = process.env.HF_API_BASE ?? 'https://router.huggingface.co/hf-inference/v1';
const GEMINI_KEY = process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY ?? '';

const MAX_TOKENS_DEFAULT = 4096;
const MAX_THINKING_BUDGET = 16_000;
const PER_IP_WINDOW_MS = 60_000;
const PER_IP_MAX_REQUESTS = 20;

const ipBuckets = new Map<string, number[]>();
function checkIpRate(ip: string): boolean {
  const now = Date.now();
  const arr = (ipBuckets.get(ip) ?? []).filter((t) => now - t < PER_IP_WINDOW_MS);
  if (arr.length >= PER_IP_MAX_REQUESTS) { ipBuckets.set(ip, arr); return false; }
  arr.push(now);
  ipBuckets.set(ip, arr);
  return true;
}

function providerForModel(modelId: string): 'anthropic' | 'openai' | 'deepseek' | 'gemini' | 'huggingface' | 'unknown' {
  const spec = MODEL_REGISTRY[modelId];
  if (!spec) return 'unknown';
  return spec.provider === 'anthropic' ? 'anthropic'
    : spec.provider === 'openai' ? 'openai'
    : spec.provider === 'deepseek' ? 'deepseek'
    : spec.provider === 'gemini' ? 'gemini'
    : spec.provider === 'huggingface' ? 'huggingface'
    : 'unknown';
}

// ── GET /models ────────────────────────────────────────────────────────────────

router.get('/models', (_req: Request, res: Response) => {
  try {
    type ModelEntry = {
      id: string; displayName: string; provider: string;
      contextWindow: number; maxOutputTokens: number;
      inputCostPer1kTokens: number; outputCostPer1kTokens: number;
      capabilities: string[]; tier: string;
      supportsExtendedThinking: boolean; supportsVision: boolean;
      supportsPromptCaching: boolean; khipuModel: boolean;
      available: boolean;
    };
    const byProvider: Record<string, ModelEntry[]> = {};

    for (const spec of Object.values(MODEL_REGISTRY)) {
      const prov = spec.provider;
      if (!byProvider[prov]) byProvider[prov] = [];
      const available = prov === 'anthropic' ? Boolean(ANTHROPIC_BASE && ANTHROPIC_KEY)
        : prov === 'openai' ? Boolean(OPENAI_KEY)
        : prov === 'deepseek' ? Boolean(DEEPSEEK_KEY)
        : prov === 'gemini' ? Boolean(GEMINI_KEY)
        : prov === 'huggingface' ? Boolean(HF_TOKEN)
        : false;
      byProvider[prov]!.push({
        id: spec.id,
        displayName: spec.displayName,
        provider: prov,
        contextWindow: spec.contextWindow,
        maxOutputTokens: spec.maxOutputTokens,
        inputCostPer1kTokens: spec.inputCostPer1kTokens,
        outputCostPer1kTokens: spec.outputCostPer1kTokens,
        capabilities: spec.capabilities,
        tier: spec.tier,
        supportsExtendedThinking: spec.supportsExtendedThinking,
        supportsVision: spec.supportsVision,
        supportsPromptCaching: spec.supportsPromptCaching ?? false,
        khipuModel: spec.khipuModel ?? false,
        available,
      });
    }

    res.json({ ok: true, data: { byProvider } });
  } catch (err) {
    logger.warn({ err }, '[a11oy-console] Failed to list models');
    res.status(500).json({ ok: false, error: 'Failed to list models' });
  }
});

// ── GET /providers ─────────────────────────────────────────────────────────────

router.get('/providers', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    data: {
      anthropic: Boolean(ANTHROPIC_BASE && ANTHROPIC_KEY),
      openai: Boolean(OPENAI_KEY),
      deepseek: Boolean(DEEPSEEK_KEY),
      gemini: Boolean(GEMINI_KEY),
      huggingface: Boolean(HF_TOKEN),
    },
  });
});

// ── POST /count-tokens ─────────────────────────────────────────────────────────

router.post('/count-tokens', async (req: Request, res: Response) => {
  const { model, systemPrompt, messages } = req.body as {
    model?: string;
    systemPrompt?: string;
    messages?: Array<{ role: string; content: string }>;
  };

  if (!model || !Array.isArray(messages)) {
    res.status(400).json({ ok: false, error: 'model and messages are required' });
    return;
  }

  if (model.startsWith('claude')) {
    // Use the engine's token-counter module — typed SDK path, no raw env access
    const result = await countTokens({
      model,
      messages: messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      ...(systemPrompt ? { system: systemPrompt } : {}),
    });
    res.json({ ok: true, data: { inputTokens: result.inputTokens, method: result.method } });
  } else {
    // Non-Anthropic: character heuristic
    const chars = (systemPrompt?.length ?? 0) + messages.reduce((n, m) => n + m.content.length, 0);
    res.json({ ok: true, data: { inputTokens: Math.ceil(chars / 4), method: 'heuristic' } });
  }
});

// ── POST /save-workcell ────────────────────────────────────────────────────────

router.post('/save-workcell', async (req: Request, res: Response) => {
  const { name, model, systemPrompt, temperature, maxTokens, thinkingBudget, promptCaching, topP } = req.body as {
    name?: string;
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    thinkingBudget?: number;
    promptCaching?: boolean;
    topP?: number;
  };

  if (!name || !model) {
    res.status(400).json({ ok: false, error: 'name and model are required' });
    return;
  }

  const description = `Console Workcell: ${model} — ${name}`;
  try {
    const workcell = createWorkcell({
      name,
      description: `${description} · model=${model} · temp=${temperature ?? 0.7} · maxTok=${maxTokens ?? MAX_TOKENS_DEFAULT}`,
      vertical: 'platform',
      operatorId: 'a11oy-console',
      tools: [],
      approvalTier: 'auto',
      originSignalIds: [`console-wct-${randomUUID().slice(0, 8)}`],
    });

    logger.info({ workcellId: workcell.id, name, model }, '[a11oy-console] Workcell template saved');
    res.json({ ok: true, data: { workcellId: workcell.id, name: workcell.name, phase: workcell.phase } });
  } catch (err) {
    logger.warn({ err }, '[a11oy-console] Workcell save failed — falling back to in-memory template');
    const templateId = `wct-console-${randomUUID().slice(0, 8)}`;
    res.json({ ok: true, data: { workcellId: templateId, name, phase: 'intake', fallback: true } });
  }
});

// ── POST /run ──────────────────────────────────────────────────────────────────

router.post('/run', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const runId = `console-${randomUUID().slice(0, 8)}`;

  const ip = (req.ip ?? req.socket?.remoteAddress ?? 'unknown').toString();
  if (!checkIpRate(ip)) {
    res.status(429).json({ error: `Rate limit: max ${PER_IP_MAX_REQUESTS} req/min`, errorType: 'rate_limit' });
    return;
  }

  const {
    model,
    systemPrompt,
    messages,
    temperature,
    maxTokens,
    thinkingBudget,
    promptCaching,
    topP,
  } = req.body as {
    model?: string;
    systemPrompt?: string;
    messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
    thinkingBudget?: number;
    promptCaching?: boolean;
    topP?: number;
  };

  if (!model) {
    res.status(400).json({ error: 'model is required', errorType: 'validation' }); return;
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array required', errorType: 'validation' }); return;
  }

  const provider = providerForModel(model);

  // Check provider availability
  const providerAvailable = provider === 'anthropic' ? Boolean(ANTHROPIC_BASE && ANTHROPIC_KEY)
    : provider === 'openai' ? Boolean(OPENAI_KEY)
    : provider === 'deepseek' ? Boolean(DEEPSEEK_KEY)
    : provider === 'gemini' ? Boolean(GEMINI_KEY)
    : provider === 'huggingface' ? Boolean(HF_TOKEN)
    : false;

  if (!providerAvailable) {
    res.status(503).json({
      error: `Provider "${provider}" not configured for model "${model}"`,
      errorType: 'provider_unavailable',
      provider,
    });
    return;
  }

  const cleaned = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 32_000) }));

  if (cleaned.length === 0) {
    res.status(400).json({ error: 'No valid messages', errorType: 'validation' }); return;
  }

  // ── Governance gate ────────────────────────────────────────────────────────
  let pceResult: PCEGateResult | null = null;
  try {
    pceResult = await runPCEGate({
      actionId: runId,
      originSignalIds: [`console-input-${runId}`],
      vertical: 'platform',
      riskLevel: 'low',
      isDestructive: false,
      actionDescription: `Console inference via ${model} (${provider})`,
    });
  } catch (err) {
    logger.warn({ err }, '[a11oy-console] PCE gate check failed — proceeding');
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
    targetId: runId,
    targetType: 'action',
    evidenceRefs: [`console-input-${runId}`],
    sourceCoverage: 0.85,
    hasPriorApproval: false,
    isDestructive: false,
    isDemoMode: false,
    actionDescription: `Console inference via ${model}`,
    riskLevel: 'low',
  });
  storeEval(mirrorEval);

  // ── Content moderation pre-hook (engine capability) ────────────────────────
  {
    const inputContent = cleaned.map((m) => m.content).join('\n');
    const modResult = await runInputModeration(inputContent, {
      agentId: 'a11oy-console',
      requestId: runId,
      lane: 'console',
    });
    if (!modResult.allowed) {
      res.status(400).json({
        error: modResult.reason ?? 'Content moderation blocked this request',
        errorType: 'moderation_block',
        severity: modResult.severity,
        flags: modResult.flags,
      });
      return;
    }
  }

  // ── SSE setup ──────────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let ended = false;
  const send = (payload: Record<string, unknown>) => {
    if (ended || res.writableEnded) return;
    try { res.write(`data: ${JSON.stringify(payload)}\n\n`); } catch { /* gone */ }
  };

  const upstreamAbort = new AbortController();
  const cleanup = () => {
    if (ended) return;
    ended = true;
    try { if (!res.writableEnded) res.end(); } catch { /* ignore */ }
  };
  req.on('close', () => { upstreamAbort.abort(); cleanup(); });

  // Emit governance envelope
  send({
    type: 'governance',
    pceContractId: pceResult?.contract?.contractId ?? null,
    mirrorEval: {
      evalId: mirrorEval.evalId,
      disposition: mirrorEval.disposition,
      overallScore: mirrorEval.overallScore,
    },
    runId,
  });

  const resolvedMaxTokens = Math.min(maxTokens ?? MAX_TOKENS_DEFAULT, 32_000);

  try {
    if (provider === 'anthropic') {
      await streamAnthropic({
        model, systemPrompt, cleaned, temperature, resolvedMaxTokens,
        thinkingBudget, promptCaching, topP,
        send, upstreamAbort, runId, startTime, pceResult, mirrorEval,
      });
    } else {
      await streamOpenAICompat({
        model, provider, systemPrompt, cleaned, temperature,
        resolvedMaxTokens, topP,
        send, upstreamAbort, runId, startTime, pceResult, mirrorEval,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('aborted') && !upstreamAbort.signal.aborted) {
      logger.warn(`[a11oy-console] Run error: ${msg}`);
      send({ type: 'error', error: msg, errorType: 'internal_error' });
      send({ type: 'done', done: true });
    }
  } finally {
    cleanup();
  }
});

// ── Anthropic streaming helper ─────────────────────────────────────────────────

interface StreamParams {
  model: string;
  systemPrompt: string | undefined;
  cleaned: Array<{ role: 'user' | 'assistant'; content: string }>;
  temperature: number | undefined;
  resolvedMaxTokens: number;
  thinkingBudget: number | undefined;
  promptCaching: boolean | undefined;
  topP: number | undefined;
  send: (p: Record<string, unknown>) => void;
  upstreamAbort: AbortController;
  runId: string;
  startTime: number;
  pceResult: PCEGateResult | null;
  mirrorEval: ReturnType<typeof runMirrorEval>;
}

/** OpenAI-compat streaming params: same as StreamParams minus Anthropic-only
 *  fields, plus a `provider` discriminator for endpoint resolution. */
interface OpenAICompatStreamParams extends Omit<StreamParams, 'thinkingBudget' | 'promptCaching'> {
  provider: string;
}

async function streamAnthropic(p: StreamParams): Promise<void> {
  const { model, systemPrompt, cleaned, temperature, resolvedMaxTokens,
    thinkingBudget, promptCaching, topP, send, upstreamAbort, runId,
    startTime, pceResult, mirrorEval } = p;

  const useThinking = typeof thinkingBudget === 'number' && thinkingBudget > 0;
  const useCache = promptCaching === true;

  const systemMessages: Array<Record<string, unknown>> = systemPrompt
    ? (useCache
        ? [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }]
        : [{ type: 'text', text: systemPrompt }])
    : [];

  const anthropicMessages: Array<Record<string, unknown>> = cleaned.map((m, idx) => {
    const isLastUser = m.role === 'user' && idx === cleaned.length - 1;
    if (useCache && isLastUser) {
      return {
        role: m.role,
        content: [{ type: 'text', text: m.content, cache_control: { type: 'ephemeral' } }],
      };
    }
    return { role: m.role, content: m.content };
  });

  const requestBody: Record<string, unknown> = {
    model,
    max_tokens: resolvedMaxTokens,
    stream: true,
    messages: anthropicMessages,
    ...(systemMessages.length > 0 ? { system: systemMessages } : {}),
    ...(typeof temperature === 'number' && !useThinking ? { temperature } : {}),
    ...(typeof topP === 'number' ? { top_p: topP } : {}),
  };

  if (useThinking) {
    requestBody['thinking'] = { type: 'enabled', budget_tokens: Math.min(thinkingBudget!, MAX_THINKING_BUDGET) };
    requestBody['temperature'] = 1;
  }

  const upstream = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
    body: JSON.stringify(requestBody),
    signal: upstreamAbort.signal,
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    logger.warn({ status: upstream.status, errText }, '[a11oy-console] Anthropic upstream error');
    send({ type: 'error', error: `Provider error ${upstream.status}`, errorType: 'provider_error' });
    send({ type: 'done', done: true });
    return;
  }

  const reader = upstream.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) {
    send({ type: 'error', error: 'No response body', errorType: 'provider_error' });
    send({ type: 'done', done: true });
    return;
  }

  let totalCharsOut = 0;
  let estimatedInputTokens = Math.ceil(
    ((systemPrompt?.length ?? 0) + cleaned.reduce((n, m) => n + m.content.length, 0)) / 4,
  );
  let estimatedOutputTokens = 0;
  let cacheCreationTokens = 0;
  let cacheReadTokens = 0;
  let currentBlockType: 'text' | 'thinking' | 'tool_use' | null = null;
  let currentBlockIndex = 0;
  let fullText = '';
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;
      let event: Record<string, unknown>;
      try { event = JSON.parse(raw) as Record<string, unknown>; } catch { continue; }

      const et = event['type'] as string;

      if (et === 'message_start') {
        const usage = (event['message'] as Record<string, Record<string, number>>)?.['usage'];
        if (usage) {
          estimatedInputTokens = usage['input_tokens'] ?? estimatedInputTokens;
          cacheCreationTokens = usage['cache_creation_input_tokens'] ?? 0;
          cacheReadTokens = usage['cache_read_input_tokens'] ?? 0;
        }
        send({ type: 'start', model, inputTokens: estimatedInputTokens, cacheCreationTokens, cacheReadTokens, runId });
      } else if (et === 'content_block_start') {
        const block = event['content_block'] as Record<string, unknown> | undefined;
        currentBlockType = (block?.['type'] as typeof currentBlockType) ?? null;
        currentBlockIndex = (event['index'] as number) ?? 0;
        if (currentBlockType === 'tool_use') {
          send({ type: 'tool_call_start', blockIndex: currentBlockIndex, toolName: block?.['name'] ?? '', toolId: block?.['id'] ?? '' });
        } else if (currentBlockType === 'thinking') {
          send({ type: 'thinking_start', blockIndex: currentBlockIndex });
        }
      } else if (et === 'content_block_delta') {
        const delta = event['delta'] as Record<string, unknown> | undefined;
        const dt = delta?.['type'] as string | undefined;
        if (dt === 'text_delta') {
          const text = (delta?.['text'] as string) ?? '';
          totalCharsOut += text.length;
          fullText += text;
          estimatedOutputTokens += Math.ceil(text.length / 4);
          send({ type: 'text', text, blockIndex: currentBlockIndex });
        } else if (dt === 'thinking_delta') {
          send({ type: 'thinking', text: (delta?.['thinking'] as string) ?? '', blockIndex: currentBlockIndex });
        } else if (dt === 'input_json_delta') {
          send({ type: 'tool_call_delta', partial: (delta?.['partial_json'] as string) ?? '', blockIndex: currentBlockIndex });
        }
      } else if (et === 'content_block_stop') {
        if (currentBlockType === 'tool_use') send({ type: 'tool_call_stop', blockIndex: currentBlockIndex });
        else if (currentBlockType === 'thinking') send({ type: 'thinking_stop', blockIndex: currentBlockIndex });
      } else if (et === 'message_delta') {
        const usage = event['usage'] as Record<string, number> | undefined;
        if (usage?.['output_tokens']) estimatedOutputTokens = usage['output_tokens'];
      } else if (et === 'message_stop') {
        break;
      }
    }
  }

  // Output moderation post-hook (engine capability — non-fatal)
  runOutputModeration(fullText, { agentId: 'a11oy-console', requestId: runId }).catch(() => {/* non-fatal */});

  await emitProvenance({
    model, provider: 'anthropic', runId, startTime, pceResult, mirrorEval, send,
    estimatedInputTokens, estimatedOutputTokens,
    cacheCreationTokens, cacheReadTokens, fullText,
    useCache, promptCaching: promptCaching ?? false,
  });
  send({ type: 'done', done: true, chars: totalCharsOut });
}

// ── OpenAI-compatible helper (routes through model-router engine) ──────────────
//
// For providers that model-router supports (openai, deepseek, huggingface) we
// call callWithProvider() — the same engine path used by all other workcells —
// so capabilities/governance are uniform. The response is emitted as a single
// SSE text event. Gemini uses a direct OpenAI-compat SSE fetch because
// ModelProvider does not include 'gemini'.

async function streamOpenAICompat(p: OpenAICompatStreamParams): Promise<void> {
  const { model, provider, systemPrompt, cleaned, temperature, resolvedMaxTokens, topP,
    send, upstreamAbort, runId, startTime, pceResult, mirrorEval } = p;

  const estimatedInputTokens = Math.ceil(
    ((systemPrompt?.length ?? 0) + cleaned.reduce((n, m) => n + m.content.length, 0)) / 4,
  );

  send({ type: 'start', model, inputTokens: estimatedInputTokens, cacheCreationTokens: 0, cacheReadTokens: 0, runId });

  // ── Providers supported by model-router engine ──────────────────────────────
  const ROUTER_PROVIDERS: Readonly<string[]> = ['openai', 'deepseek', 'huggingface'];

  if (ROUTER_PROVIDERS.includes(provider)) {
    // Flatten multi-turn conversation into a single prompt for ModelRequest
    const flatPrompt = cleaned.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
    const modelReq: ModelRequest = {
      prompt: flatPrompt,
      systemPrompt,
      model,
      maxTokens: resolvedMaxTokens,
      temperature,
    };

    let response: Awaited<ReturnType<typeof callWithProvider>>;
    try {
      response = await callWithProvider(modelReq, provider as ModelProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      send({ type: 'error', error: `Provider error: ${msg}`, errorType: 'provider_error' });
      send({ type: 'done', done: true });
      return;
    }

    if (upstreamAbort.signal.aborted) { send({ type: 'done', done: true }); return; }

    send({ type: 'text', text: response.content, blockIndex: 0 });

    // Output moderation post-hook (engine capability)
    runOutputModeration(response.content, { agentId: 'a11oy-console', requestId: runId }).catch(() => {/* non-fatal */});

    await emitProvenance({
      model, provider, runId, startTime, pceResult, mirrorEval, send,
      estimatedInputTokens, estimatedOutputTokens: response.tokensUsed,
      cacheCreationTokens: 0, cacheReadTokens: 0, fullText: response.content,
      useCache: false, promptCaching: false,
    });
    send({ type: 'done', done: true, chars: response.content.length });
    return;
  }

  // ── Gemini: OpenAI-compat SSE (not in ModelProvider) ───────────────────────
  if (provider !== 'gemini') {
    send({ type: 'error', error: `Unsupported provider: ${provider}`, errorType: 'provider_unsupported' });
    send({ type: 'done', done: true });
    return;
  }

  const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GEMINI_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...cleaned.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: resolvedMaxTokens,
      stream: true,
      ...(typeof temperature === 'number' ? { temperature } : {}),
      ...(typeof topP === 'number' ? { top_p: topP } : {}),
    }),
    signal: upstreamAbort.signal,
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    logger.warn({ status: upstream.status, provider, errText }, '[a11oy-console] Gemini upstream error');
    send({ type: 'error', error: `Provider error ${upstream.status}`, errorType: 'provider_error' });
    send({ type: 'done', done: true });
    return;
  }

  const reader = upstream.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) {
    send({ type: 'error', error: 'No response body', errorType: 'provider_error' });
    send({ type: 'done', done: true });
    return;
  }

  let estimatedOutputTokens = 0;
  let totalCharsOut = 0;
  let fullText = '';
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]') continue;
      let event: Record<string, unknown>;
      try { event = JSON.parse(raw) as Record<string, unknown>; } catch { continue; }

      const choices = event['choices'] as Array<{ delta?: { content?: string | null } }> | undefined;
      const delta = choices?.[0]?.delta;
      if (delta?.content) {
        const text = delta.content;
        totalCharsOut += text.length;
        fullText += text;
        estimatedOutputTokens += Math.ceil(text.length / 4);
        send({ type: 'text', text, blockIndex: 0 });
      }

      const usage = event['usage'] as Record<string, number> | undefined;
      if (usage) estimatedOutputTokens = usage['completion_tokens'] ?? estimatedOutputTokens;
    }
  }

  // Output moderation post-hook (engine capability)
  runOutputModeration(fullText, { agentId: 'a11oy-console', requestId: runId }).catch(() => {/* non-fatal */});

  await emitProvenance({
    model, provider, runId, startTime, pceResult, mirrorEval, send,
    estimatedInputTokens, estimatedOutputTokens,
    cacheCreationTokens: 0, cacheReadTokens: 0, fullText,
    useCache: false, promptCaching: false,
  });
  send({ type: 'done', done: true, chars: totalCharsOut });
}

// ── Shared provenance + proof emission ────────────────────────────────────────

async function emitProvenance(opts: {
  model: string;
  provider: string;
  runId: string;
  startTime: number;
  pceResult: PCEGateResult | null;
  mirrorEval: ReturnType<typeof runMirrorEval>;
  send: (p: Record<string, unknown>) => void;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  fullText: string;
  useCache: boolean;
  promptCaching: boolean;
}): Promise<void> {
  const { model, provider, runId, startTime, pceResult, mirrorEval, send,
    estimatedInputTokens, estimatedOutputTokens,
    cacheCreationTokens, cacheReadTokens, useCache } = opts;

  const latencyMs = Date.now() - startTime;
  const spec = MODEL_REGISTRY[model];

  // Cost accounting
  const baseCostInput = (estimatedInputTokens / 1000) * (spec?.inputCostPer1kTokens ?? 0.003);
  const cacheWriteCost = useCache ? (cacheCreationTokens / 1000) * (spec?.inputCostPer1kTokens ?? 0.003) * 1.25 : 0;
  const cacheReadCost = useCache ? (cacheReadTokens / 1000) * (spec?.inputCostPer1kTokens ?? 0.003) * 0.1 : 0;
  const outputCost = (estimatedOutputTokens / 1000) * (spec?.outputCostPer1kTokens ?? 0.015);
  const estimatedCostUsd = baseCostInput + cacheWriteCost + cacheReadCost + outputCost;

  // Proof packet — only when PCE contract exists
  let proofId: string | null = null;
  if (pceResult?.contract) {
    try {
      const proofPacket = generateProofPacket(pceResult.contract);
      proofId = proofPacket.packetId;
    } catch (err) {
      logger.warn({ err }, '[a11oy-console] Failed to generate proof packet');
    }
  }

  // Tag AI content
  try {
    await tagAIContent({
      contentId: runId,
      contentType: 'a11oy-console-response',
      sourceClass: 'llm_generated',
      confidenceScore: mirrorEval.overallScore,
      modelLane: 'console',
      modelId: model,
      modelProvider: provider,
      correlationId: runId,
      serviceAttribution: 'a11oy-console',
    });
  } catch { /* non-fatal */ }

  send({
    type: 'provenance',
    provenance: {
      model,
      provider,
      latencyMs,
      estimatedCostUsd: Math.round(estimatedCostUsd * 1_000_000) / 1_000_000,
      tokens: {
        input: estimatedInputTokens,
        output: estimatedOutputTokens,
        cacheCreation: cacheCreationTokens,
        cacheRead: cacheReadTokens,
      },
      cacheHit: cacheReadTokens > 0,
      costBreakdown: {
        baseInput: Math.round(baseCostInput * 1_000_000) / 1_000_000,
        cacheWrite: Math.round(cacheWriteCost * 1_000_000) / 1_000_000,
        cacheRead: Math.round(cacheReadCost * 1_000_000) / 1_000_000,
        output: Math.round(outputCost * 1_000_000) / 1_000_000,
      },
      trustScore: mirrorEval.overallScore,
      proofId,
      pceContractId: pceResult?.contract?.contractId ?? null,
      mirrorEvalId: mirrorEval.evalId,
      runId,
    },
  });
}

export default router;
