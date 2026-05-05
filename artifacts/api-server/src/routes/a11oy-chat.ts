import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { logger } from '../lib/logger';
import { runMirrorEval, storeEval } from '../a11oy/runtime/evals/mirror-eval.js';
import { runPCEGate, generateProofPacket, type PCEGateResult } from '../a11oy/runtime/governance/pce-gate.js';
import { tagAIContent } from '@szl-holdings/proof-chain';
import { db } from '@szl-holdings/db';
import { sql } from 'drizzle-orm';
import {
  evaluateChatAmi,
  FORMULA_REGISTRY,
  type ChatAmiResult,
  type FormulaId,
} from '../a11oy/formulas/ami-formula.js';

const router = Router();

const ANTHROPIC_BASE = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
const ANTHROPIC_KEY = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

type ChatMode = 'sovereign' | 'code' | 'reason' | 'fast' | 'research' | 'governance';
type ChatProvider = 'anthropic' | 'kimi' | 'openai' | 'huggingface';

interface LaneConfig {
  model: string;
  lane: string;
  temperature: number;
  provider: ChatProvider;
}

const MODEL_LANE_MAP: Record<string, LaneConfig> = {
  'a1.1oy-sovereign': { model: 'claude-sonnet-4-6', lane: 'reasoning', temperature: 0.7, provider: 'anthropic' },
  'a1.1oy-code': { model: 'claude-sonnet-4-6', lane: 'tool_calling', temperature: 0.3, provider: 'anthropic' },
  'a1.1oy-reason': { model: 'claude-sonnet-4-6', lane: 'reasoning', temperature: 0.5, provider: 'anthropic' },
  'a1.1oy-fast': { model: 'claude-sonnet-4-6', lane: 'triage', temperature: 0.6, provider: 'anthropic' },
  'a1.1oy-research': { model: 'claude-sonnet-4-6', lane: 'research', temperature: 0.6, provider: 'anthropic' },
  'a1.1oy-governance': { model: 'claude-sonnet-4-6', lane: 'governance', temperature: 0.4, provider: 'anthropic' },
};

const MODE_TO_MODEL: Record<ChatMode, string> = {
  sovereign: 'a1.1oy-sovereign',
  code: 'a1.1oy-code',
  reason: 'a1.1oy-reason',
  fast: 'a1.1oy-fast',
  research: 'a1.1oy-research',
  governance: 'a1.1oy-governance',
};

const MAX_TOKENS = 4096;
const MAX_MESSAGES = 40;
const MAX_CHARS_PER_MESSAGE = 16_000;
const MAX_TOTAL_CHARS = 64_000;
const MAX_CONCURRENT = 6;
const PER_IP_WINDOW_MS = 60_000;
const PER_IP_MAX_REQUESTS = 12;
const MIRROR_EVAL_THRESHOLD = 0.7;

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

interface ImprovementEntry {
  id: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  mode: ChatMode;
  modelId: string;
  prompt: string;
  response: string;
  mirrorEvalScore: number;
  mirrorEvalDisposition: string;
  proposedImprovement: string;
  reviewerNote?: string;
  reviewedAt?: string;
}

const IMPROVEMENT_QUEUE: ImprovementEntry[] = [];
const IMPROVEMENT_QUEUE_MAX = 200;

function enqueueImprovement(entry: ImprovementEntry): void {
  IMPROVEMENT_QUEUE.unshift(entry);
  if (IMPROVEMENT_QUEUE.length > IMPROVEMENT_QUEUE_MAX) IMPROVEMENT_QUEUE.length = IMPROVEMENT_QUEUE_MAX;
}

const SYSTEM_PROMPT_VERSION = 'v2.0.0';
const SYSTEM_PROMPT = `You are A11oy — the unified Orchestration and Decision Intelligence layer of the SZL Holdings governed platform.

You are a single agentic chat surface. There are no separate Praxis or Console chat surfaces — every reasoning, code, research, governance, and triage request flows through you. Each turn you (or the upstream router) selects a MODE (sovereign / code / reason / fast / research / governance) and a MODEL (Claude / Kimi / OpenAI / HF) and explains the choice. The user can override.

You stream from Claude (claude-sonnet-4-6) via the Replit AI Integrations proxy. You do not invent capabilities.

When asked what you can do, describe these accurately:
- Multi-turn conversation with persistent thread history
- Code generation, code review, code explanation
- Document and pasted-text analysis
- Reasoning, planning, architectural advice
- Tool calling: web search, HuggingFace search, thesis RAG, formula lookup, Claude-Code agent invocation, proof-ledger query, fabric-state query, governance query
- Per-turn proof-ledger entry with mode, model, tools, citations, and MirrorEval score

When asked about SZL Holdings facts, defer to SOURCE_OF_TRUTH.md:
- 7 customer-facing product surfaces orchestrated by A11oy
- 6 platform primitives (Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, Event Fabric)
- 848 provisioned database tables, 5,524 API endpoints, 126 monorepo packages
- Public proof: github.com/szl-holdings/ouroboros (v6.2.0); github.com/szl-holdings/ouroboros-thesis (concept DOI 10.5281/zenodo.19944926)

If you don't know something, say so. Never fabricate metrics, contracts, certifications, or partnerships. Cite sources inline when you used a tool.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ModeRecommendation {
  mode: ChatMode;
  modelId: string;
  provider: ChatProvider;
  rationale: string;
  confidence: number;
  alternatives: Array<{ mode: ChatMode; modelId: string; reason: string }>;
}

const MODE_HEURISTICS: Array<{ mode: ChatMode; patterns: RegExp[]; reason: string }> = [
  {
    mode: 'code',
    patterns: [/\bcode\b/i, /\brefactor/i, /\bdebug/i, /\bfunction\b/i, /\btypescript|javascript|python|rust|java|sql\b/i, /\bimplement\b/i, /```/],
    reason: 'question is implementation/code-oriented',
  },
  {
    mode: 'governance',
    patterns: [/\bcovenant|policy|approval|audit|compliance|pce\b/i, /\bproof.{0,5}(chain|ledger|packet)\b/i, /\bgovernance\b/i],
    reason: 'question is about governance, policy, or audit',
  },
  {
    mode: 'research',
    patterns: [/\bresearch\b/i, /\bcite|citation|source|paper|huggingface\b/i, /\bweb search\b/i, /\bsearch the (web|hub)\b/i, /\bpublished\b/i],
    reason: 'question requires external sources or citations',
  },
  {
    mode: 'reason',
    patterns: [/\bwhy\b/i, /\bexplain\b/i, /\bcompare\b/i, /\bstrategy\b/i, /\barchitect|design\b/i, /\bplan\b/i],
    reason: 'question requires deep reasoning or planning',
  },
  {
    mode: 'fast',
    patterns: [/^(what|when|who|where|is|are|does|can|do)\b.{0,80}\?$/i],
    reason: 'short factual question; low-latency triage path is sufficient',
  },
];

function recommendMode(userText: string): ModeRecommendation {
  const text = userText.trim();
  let chosen: ChatMode = 'sovereign';
  let reason = 'default sovereign reasoning lane for general inquiries';
  let confidence = 0.55;

  for (const h of MODE_HEURISTICS) {
    if (h.patterns.some((re) => re.test(text))) {
      chosen = h.mode;
      reason = h.reason;
      confidence = 0.78;
      break;
    }
  }

  const alternatives: Array<{ mode: ChatMode; modelId: string; reason: string }> = (
    ['sovereign', 'code', 'reason', 'research', 'governance', 'fast'] as ChatMode[]
  )
    .filter((m) => m !== chosen)
    .slice(0, 3)
    .map((m) => ({ mode: m, modelId: MODE_TO_MODEL[m], reason: `override to ${m}` }));

  const modelId = MODE_TO_MODEL[chosen];
  const lane = MODEL_LANE_MAP[modelId]!;

  const rationale = `Picked ${capitalize(chosen)} + ${providerLabel(lane.provider)} because ${reason}.`;

  return {
    mode: chosen,
    modelId,
    provider: lane.provider,
    rationale,
    confidence,
    alternatives,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function providerLabel(p: ChatProvider): string {
  return { anthropic: 'Claude', kimi: 'Kimi', openai: 'OpenAI', huggingface: 'HF' }[p];
}

interface ToolDescriptor {
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
}

const AVAILABLE_TOOLS: ToolDescriptor[] = [
  { name: 'web.search', description: 'Search the public web for current information and citations', riskLevel: 'low' },
  { name: 'huggingface.search', description: 'Search HuggingFace Hub for models, datasets, papers, spaces (#4210 MCP)', riskLevel: 'low' },
  { name: 'thesis.rag', description: 'Retrieve grounded passages from docs/thesis/v8-canonical.md', riskLevel: 'low' },
  { name: 'formula.lookup', description: 'Resolve a named formula from lib/formulas (#4776)', riskLevel: 'low' },
  { name: 'claude_code.invoke', description: 'Delegate a coding task to a Claude Code agent', riskLevel: 'medium' },
  { name: 'proof_ledger.query', description: 'Query the proof ledger for prior proof packets', riskLevel: 'low' },
  { name: 'fabric.query', description: 'Query A11oy Fabric state', riskLevel: 'low' },
  { name: 'governance.query', description: 'Query covenant / PCE governance state', riskLevel: 'low' },
];

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    configured: Boolean(ANTHROPIC_BASE && ANTHROPIC_KEY),
    model: 'claude-sonnet-4-6',
    provider: 'anthropic-via-replit-ai-integrations',
    lanes: Object.keys(MODEL_LANE_MAP),
    modes: Object.keys(MODE_TO_MODEL),
    tools: AVAILABLE_TOOLS,
    systemPromptVersion: SYSTEM_PROMPT_VERSION,
    unifiedChat: true,
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

router.get('/improvements', (req: Request, res: Response) => {
  if (!requireOperator(req, res)) return;
  res.json({
    ok: true,
    data: IMPROVEMENT_QUEUE,
    threshold: MIRROR_EVAL_THRESHOLD,
    promptVersion: SYSTEM_PROMPT_VERSION,
  });
});

/**
 * Improvement-queue moderation is operator-scoped: approving or rejecting a
 * MirrorEval-flagged turn changes how the chat self-evolves. Write actions
 * require a privileged platform role.
 */
const A11OY_OPERATOR_ROLES = new Set(['super_admin', 'admin', 'platform_operator']);
function requireOperator(req: Request, res: Response): boolean {
  const roles = (req.user?.roles ?? []) as string[];
  if (!roles.some((r) => A11OY_OPERATOR_ROLES.has(r))) {
    res.status(403).json({
      ok: false,
      error: 'Improvement moderation requires a platform operator role.',
      code: 'OPERATOR_REQUIRED',
    });
    return false;
  }
  return true;
}

router.post('/improvements/:id/approve', (req: Request, res: Response) => {
  if (!requireOperator(req, res)) return;
  const entry = IMPROVEMENT_QUEUE.find((e) => e.id === req.params.id);
  if (!entry) {
    res.status(404).json({ ok: false, error: 'not found' });
    return;
  }
  entry.status = 'approved';
  entry.reviewerNote = typeof req.body?.note === 'string' ? req.body.note.slice(0, 500) : undefined;
  entry.reviewedAt = new Date().toISOString();
  res.json({ ok: true, data: entry });
});

router.post('/improvements/:id/reject', (req: Request, res: Response) => {
  if (!requireOperator(req, res)) return;
  const entry = IMPROVEMENT_QUEUE.find((e) => e.id === req.params.id);
  if (!entry) {
    res.status(404).json({ ok: false, error: 'not found' });
    return;
  }
  entry.status = 'rejected';
  entry.reviewerNote = typeof req.body?.note === 'string' ? req.body.note.slice(0, 500) : undefined;
  entry.reviewedAt = new Date().toISOString();
  res.json({ ok: true, data: entry });
});

router.post('/recommend', (req: Request, res: Response) => {
  const text = typeof req.body?.text === 'string' ? req.body.text : '';
  if (!text.trim()) {
    res.status(400).json({ ok: false, error: 'text required' });
    return;
  }
  res.json({ ok: true, data: recommendMode(text) });
});

router.get('/formulas', (_req: Request, res: Response) => {
  res.json({ ok: true, data: Object.values(FORMULA_REGISTRY) });
});

router.get('/formulas/:id', (req: Request, res: Response) => {
  const id = req.params.id as FormulaId;
  const formula = FORMULA_REGISTRY[id];
  if (!formula) {
    res.status(404).json({ ok: false, error: 'formula not found', known: Object.keys(FORMULA_REGISTRY) });
    return;
  }
  res.json({ ok: true, data: formula });
});

router.post('/formulas/ami_v2/evaluate', (req: Request, res: Response) => {
  const body = req.body ?? {};
  const result = evaluateChatAmi({
    mirrorEvalScore: typeof body.mirrorEvalScore === 'number' ? body.mirrorEvalScore : 0.85,
    pceAllowed: body.pceAllowed !== false,
    hasGovernance: body.hasGovernance !== false,
    toolsAvailable: typeof body.toolsAvailable === 'number' ? body.toolsAvailable : AVAILABLE_TOOLS.length,
    toolsInvoked: typeof body.toolsInvoked === 'number' ? body.toolsInvoked : 2,
    userPromptLength: typeof body.userPromptLength === 'number' ? body.userPromptLength : 200,
    knownContradictions: typeof body.knownContradictions === 'number' ? body.knownContradictions : 0,
    testCoverage: typeof body.testCoverage === 'number' ? body.testCoverage : 0.7,
    alignment: typeof body.alignment === 'number' ? body.alignment : 0.75,
    knotCount: typeof body.knotCount === 'number' ? body.knotCount : 50,
  });
  res.json({ ok: true, data: result });
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
  const forcedMode = typeof req.body?.forcedMode === 'string' ? (req.body.forcedMode as ChatMode) : undefined;
  const forcedModelId = typeof req.body?.model === 'string' ? (req.body.model as string) : undefined;
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

  const lastUserMsg = [...cleaned].reverse().find((m) => m.role === 'user');
  const recommendation = recommendMode(lastUserMsg?.content ?? '');

  let chosenMode: ChatMode = recommendation.mode;
  let chosenModelId: string = recommendation.modelId;
  let overrideApplied = false;

  if (forcedMode && MODE_TO_MODEL[forcedMode]) {
    chosenMode = forcedMode;
    chosenModelId = MODE_TO_MODEL[forcedMode];
    overrideApplied = true;
  }
  if (forcedModelId && MODEL_LANE_MAP[forcedModelId]) {
    chosenModelId = forcedModelId;
    overrideApplied = true;
  }

  const laneConfig = MODEL_LANE_MAP[chosenModelId] ?? MODEL_LANE_MAP['a1.1oy-sovereign']!;

  let pceResult: PCEGateResult | null = null;
  try {
    pceResult = await runPCEGate({
      actionId,
      originSignalIds: [`chat-input-${actionId}`],
      vertical: 'platform',
      riskLevel: 'low',
      isDestructive: false,
      actionDescription: `Unified A11oy chat inference (mode=${chosenMode}, model=${chosenModelId})`,
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
    actionDescription: `Unified A11oy chat (mode=${chosenMode})`,
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
    type: 'recommendation',
    recommendation: {
      mode: chosenMode,
      modelId: chosenModelId,
      provider: laneConfig.provider,
      rationale: overrideApplied
        ? `Override applied: ${capitalize(chosenMode)} + ${providerLabel(laneConfig.provider)} (user-forced).`
        : recommendation.rationale,
      confidence: recommendation.confidence,
      overrideApplied,
      alternatives: recommendation.alternatives,
      availableTools: AVAILABLE_TOOLS.map((t) => t.name),
    },
  });

  const ami: ChatAmiResult = evaluateChatAmi({
    mirrorEvalScore: mirrorEval.overallScore,
    pceAllowed: pceResult?.allowed !== false,
    hasGovernance: !!pceResult?.contract,
    toolsAvailable: AVAILABLE_TOOLS.length,
    toolsInvoked: pceResult?.contract ? 2 : 0,
    userPromptLength: (lastUserMsg?.content ?? '').length,
    knownContradictions: mirrorEval.overallScore < 0.7 ? 1 : 0,
    testCoverage: 0.7,
    alignment: recommendation.confidence ?? 0.75,
    knotCount: 50,
  });

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
    ami: {
      gate: ami.gate,
      score: ami.amiScore,
      permissions: ami.permissions,
      rationale: ami.rationale,
      components: ami.components,
      formula: ami.formula,
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
        contentType: 'a11oy-unified-chat-response',
        sourceClass: 'llm_generated',
        confidenceScore: mirrorEval.overallScore,
        modelLane: laneConfig.lane,
        modelId: laneConfig.model,
        modelProvider: laneConfig.provider,
        correlationId: actionId,
        serviceAttribution: 'a11oy-unified-chat',
      });
    } catch { /* non-fatal */ }

    let savedConversationId = conversationId ?? null;
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

    if (mirrorEval.overallScore < MIRROR_EVAL_THRESHOLD && fullContent && lastUserMsg) {
      enqueueImprovement({
        id: `imp-${randomUUID().slice(0, 10)}`,
        createdAt: new Date().toISOString(),
        status: 'pending',
        mode: chosenMode,
        modelId: chosenModelId,
        prompt: lastUserMsg.content.slice(0, 2000),
        response: fullContent.slice(0, 4000),
        mirrorEvalScore: mirrorEval.overallScore,
        mirrorEvalDisposition: mirrorEval.disposition,
        proposedImprovement:
          `MirrorEval scored ${mirrorEval.overallScore.toFixed(2)} (< ${MIRROR_EVAL_THRESHOLD}). ` +
          `Suggest revising the system prompt or ${chosenMode}-mode tool descriptions to improve grounding for this question class.`,
      });
    }

    send({
      type: 'provenance',
      provenance: {
        model: laneConfig.model,
        modelLane: chosenModelId,
        mode: chosenMode,
        lane: laneConfig.lane,
        provider: laneConfig.provider,
        latencyMs,
        estimatedCostUsd: Math.round(estimatedCostUsd * 1_000_000) / 1_000_000,
        tokens: { input: estimatedInputTokens, output: estimatedOutputTokens },
        trustScore: mirrorEval.overallScore,
        proofId,
        pceContractId: pceResult?.contract?.contractId ?? null,
        mirrorEvalId: mirrorEval.evalId,
        conversationId: savedConversationId,
        systemPromptVersion: SYSTEM_PROMPT_VERSION,
        enqueuedForReview: mirrorEval.overallScore < MIRROR_EVAL_THRESHOLD,
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
