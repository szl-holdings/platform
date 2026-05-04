import { randomUUID, createHash } from 'node:crypto';
import { getCurrentActorId, getCurrentTenantId } from './request-context.js';
import { emitRunEvent, type RunEventType } from './run-events.js';
import { recordProof, type ProofRecord } from './nexus-fabric.js';

export interface SamplingModelPreferences {
  hints?: Array<{ name?: string }>;
  costPriority?: number;
  speedPriority?: number;
  intelligencePriority?: number;
}

export interface SamplingMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  };
}

export interface SamplingCreateRequest {
  messages: SamplingMessage[];
  modelPreferences?: SamplingModelPreferences;
  systemPrompt?: string;
  includeContext?: 'none' | 'thisServer' | 'allServers';
  maxTokens: number;
  metadata?: Record<string, unknown>;
}

export interface SamplingResult {
  role: 'assistant';
  content: { type: 'text'; text: string };
  model: string;
  stopReason: 'endTurn' | 'maxTokens' | 'stopSequence' | 'toolUse';
}

export interface GovernedSamplingSession {
  id: string;
  requestId: string;
  actor: string;
  tenantId: string;
  model: string;
  provider: string;
  status: 'active' | 'completed' | 'policy_blocked' | 'iteration_cap' | 'client_unavailable';
  iterations: number;
  maxIterations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  policyEvaluation: 'approved' | 'blocked' | 'human_review';
  covenantResult: {
    allowed: boolean;
    policyResult: 'allow' | 'deny' | 'passthrough';
    reason: string;
    matchedPolicies: string[];
  };
  proofHash: string;
  proofPersistedToWal: boolean;
  startedAt: string;
  completedAt: string | null;
}

const MAX_SAMPLING_ITERATIONS = 10;
const activeSessions = new Map<string, GovernedSamplingSession>();

let _samplingBridge: SamplingBridge | null = null;

export interface SamplingBridge {
  requestSampling: (params: {
    messages: Array<{ role: 'user' | 'assistant'; content: { type: 'text'; text: string } }>;
    modelPreferences?: SamplingModelPreferences;
    systemPrompt?: string;
    maxTokens: number;
    metadata?: Record<string, unknown>;
  }) => Promise<{
    role: 'assistant';
    content: { type: 'text'; text: string };
    model: string;
    stopReason?: string;
  }>;
}

export function setSamplingBridge(bridge: SamplingBridge): void {
  _samplingBridge = bridge;
}

function resolveRouteClass(prefs?: SamplingModelPreferences): string {
  if (!prefs) return 'generation';
  const { intelligencePriority = 0.5, costPriority = 0.5 } = prefs;
  if (intelligencePriority > 0.7) return 'reasoning';
  if (costPriority > 0.7) return 'summarization';
  return 'generation';
}

function resolveModel(prefs?: SamplingModelPreferences): { provider: string; model: string } {
  if (prefs?.hints && prefs.hints.length > 0) {
    const hint = prefs.hints[0]?.name ?? '';
    if (hint.includes('claude')) return { provider: 'anthropic', model: 'claude-opus-4-5' };
    if (hint.includes('gpt-4o-mini')) return { provider: 'openai', model: 'gpt-4o-mini' };
    if (hint.includes('gpt-4')) return { provider: 'openai', model: 'gpt-4o' };
    if (hint.includes('llama')) return { provider: 'substrate', model: 'llama-3.3-70b-instruct' };
  }
  const routeClass = resolveRouteClass(prefs);
  if (routeClass === 'reasoning') return { provider: 'anthropic', model: 'claude-opus-4-5' };
  if (routeClass === 'summarization') return { provider: 'openai', model: 'gpt-4o-mini' };
  return { provider: 'openai', model: 'gpt-4o' };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function computeProofHash(data: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
}

function evaluateCovenantPolicy(
  actor: string,
  tenantId: string,
  model: string,
  maxTokens: number,
): GovernedSamplingSession['covenantResult'] {
  const blockedModels = new Set<string>();
  if (blockedModels.has(model)) {
    return {
      allowed: false,
      policyResult: 'deny',
      reason: `Model '${model}' is blocked by Covenant Policy for tenant '${tenantId}'.`,
      matchedPolicies: ['model_blocklist'],
    };
  }

  if (maxTokens > 32768) {
    return {
      allowed: false,
      policyResult: 'deny',
      reason: `maxTokens ${maxTokens} exceeds tenant limit of 32768.`,
      matchedPolicies: ['token_budget_limit'],
    };
  }

  return {
    allowed: true,
    policyResult: 'allow',
    reason: `Sampling approved for actor '${actor}' on tenant '${tenantId}' with model '${model}'.`,
    matchedPolicies: ['default_allow', 'tenant_sampling_policy'],
  };
}

function persistProofRecord(
  sessionId: string,
  actor: string,
  model: string,
  proofHash: string,
  inputTokens: number,
  outputTokens: number,
  isError: boolean,
): void {
  const record: ProofRecord = {
    proofHash,
    toolName: `sampling:${model}`,
    actor,
    issuedAt: new Date().toISOString(),
    confidence: isError ? 0.1 : 0.85,
    covenantAllowed: !isError,
    covenantReason: isError ? 'Sampling session failed' : 'Covenant policy approved sampling request',
    responseDigest: createHash('sha256')
      .update(`${sessionId}:${inputTokens}:${outputTokens}`)
      .digest('hex')
      .slice(0, 32),
  };
  recordProof(record);
}

export async function handleSamplingCreate(
  request: SamplingCreateRequest,
): Promise<SamplingResult> {
  const sessionId = randomUUID();
  const actor = getCurrentActorId();
  const tenantId = getCurrentTenantId() ?? 'substrate-gateway';
  const { provider, model } = resolveModel(request.modelPreferences);

  const inputText = request.messages
    .map((m) => m.content.text ?? '')
    .join('\n');
  const inputTokens = estimateTokens(inputText);

  const covenantResult = evaluateCovenantPolicy(actor, tenantId, model, request.maxTokens);

  const proofHash = computeProofHash({
    sessionId,
    actor,
    model,
    inputTokens,
    covenantAllowed: covenantResult.allowed,
    timestamp: Date.now(),
  });

  const session: GovernedSamplingSession = {
    id: sessionId,
    requestId: randomUUID(),
    actor,
    tenantId,
    model,
    provider,
    status: 'active',
    iterations: 0,
    maxIterations: MAX_SAMPLING_ITERATIONS,
    totalInputTokens: inputTokens,
    totalOutputTokens: 0,
    policyEvaluation: covenantResult.allowed ? 'approved' : 'blocked',
    covenantResult,
    proofHash,
    proofPersistedToWal: false,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };

  activeSessions.set(sessionId, session);

  if (!covenantResult.allowed) {
    session.status = 'policy_blocked';
    session.completedAt = new Date().toISOString();
    persistProofRecord(sessionId, actor, model, proofHash, inputTokens, 0, true);
    session.proofPersistedToWal = true;

    emitRunEvent({
      type: 'sampling_completed' as RunEventType,
      runId: sessionId,
      actor,
      status: 'policy_blocked',
      timestamp: Date.now(),
    });

    return {
      role: 'assistant',
      content: {
        type: 'text',
        text: `[Governed Sampling] Request blocked by Covenant Policy. ` +
          `Reason: ${covenantResult.reason} ` +
          `Matched policies: ${covenantResult.matchedPolicies.join(', ')}. ` +
          `Session: ${sessionId}. Proof: ${proofHash}.`,
      },
      model,
      stopReason: 'endTurn',
    };
  }

  emitRunEvent({
    type: 'sampling_started' as RunEventType,
    runId: sessionId,
    actor,
    timestamp: Date.now(),
  });

  if (_samplingBridge) {
    try {
      const textMessages = request.messages
        .filter((m) => m.content.type === 'text' && m.content.text)
        .map((m) => ({
          role: m.role,
          content: { type: 'text' as const, text: m.content.text! },
        }));

      session.iterations = 1;
      const bridgeResult = await _samplingBridge.requestSampling({
        messages: textMessages,
        modelPreferences: request.modelPreferences,
        systemPrompt: request.systemPrompt,
        maxTokens: request.maxTokens,
        metadata: request.metadata,
      });

      const outputTokens = estimateTokens(bridgeResult.content.text);
      session.totalOutputTokens = outputTokens;
      session.model = bridgeResult.model || model;
      session.status = 'completed';
      session.completedAt = new Date().toISOString();

      persistProofRecord(sessionId, actor, session.model, proofHash, inputTokens, outputTokens, false);
      session.proofPersistedToWal = true;

      emitRunEvent({
        type: 'sampling_completed' as RunEventType,
        runId: sessionId,
        actor,
        timestamp: Date.now(),
      });

      return {
        role: 'assistant',
        content: bridgeResult.content,
        model: session.model,
        stopReason: (bridgeResult.stopReason as SamplingResult['stopReason']) ?? 'endTurn',
      };
    } catch (e) {
      session.status = 'client_unavailable';
      session.completedAt = new Date().toISOString();
      persistProofRecord(sessionId, actor, model, proofHash, inputTokens, 0, true);
      session.proofPersistedToWal = true;

      emitRunEvent({
        type: 'sampling_completed' as RunEventType,
        runId: sessionId,
        actor,
        status: 'client_unavailable',
        error: e instanceof Error ? e.message : String(e),
        timestamp: Date.now(),
      });

      const errorMsg = e instanceof Error ? e.message : String(e);
      const responseText =
        `[Governed Sampling] Client sampling unavailable (${errorMsg}). ` +
        `Model ${model} (${provider}) routed via AI Control Plane. ` +
        `Input: ${inputTokens} tokens. Session: ${sessionId}. ` +
        `Covenant: ${covenantResult.policyResult} (${covenantResult.matchedPolicies.join(', ')}). ` +
        `Proof: ${proofHash} (persisted to WAL).`;

      const outputTokens = estimateTokens(responseText);
      session.totalOutputTokens = outputTokens;

      return {
        role: 'assistant',
        content: { type: 'text', text: responseText },
        model,
        stopReason: 'endTurn',
      };
    }
  }

  session.iterations = 1;
  const responseText =
    `[Governed Sampling] Model ${model} (${provider}) routed via AI Control Plane. ` +
    `Input: ${inputTokens} tokens. Session: ${sessionId}. ` +
    `Covenant: ${covenantResult.policyResult} (${covenantResult.matchedPolicies.join(', ')}). ` +
    `Proof: ${proofHash} (persisted to WAL). ` +
    `No MCP sampling client connected — response is a governed routing receipt. ` +
    `Connect a sampling-capable client (Claude Desktop, Cursor) to receive live LLM completions.`;

  const outputTokens = estimateTokens(responseText);
  session.totalOutputTokens = outputTokens;
  session.status = 'completed';
  session.completedAt = new Date().toISOString();

  persistProofRecord(sessionId, actor, model, proofHash, inputTokens, outputTokens, false);
  session.proofPersistedToWal = true;

  emitRunEvent({
    type: 'sampling_completed' as RunEventType,
    runId: sessionId,
    actor,
    timestamp: Date.now(),
  });

  return {
    role: 'assistant',
    content: { type: 'text', text: responseText },
    model,
    stopReason: 'endTurn',
  };
}

export function getActiveSamplingSessions(): GovernedSamplingSession[] {
  return Array.from(activeSessions.values())
    .filter((s) => s.status === 'active')
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function getAllSamplingSessions(limit = 50, tenantId?: string): GovernedSamplingSession[] {
  const effectiveTenant = tenantId ?? getCurrentTenantId();
  return Array.from(activeSessions.values())
    .filter((s) => !effectiveTenant || effectiveTenant === 'substrate-gateway' || s.tenantId === effectiveTenant)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
}

export function getSamplingSession(sessionId: string, tenantId?: string): GovernedSamplingSession | undefined {
  const session = activeSessions.get(sessionId);
  if (!session) return undefined;
  const effectiveTenant = tenantId ?? getCurrentTenantId();
  if (effectiveTenant && effectiveTenant !== 'substrate-gateway' && session.tenantId !== effectiveTenant) {
    return undefined;
  }
  return session;
}
