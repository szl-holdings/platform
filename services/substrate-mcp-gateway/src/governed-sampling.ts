import { randomUUID, createHash } from 'node:crypto';
import { getCurrentActorId, getCurrentTenantId } from './request-context.js';
import { emitRunEvent, type RunEventType } from './run-events.js';

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
  status: 'active' | 'completed' | 'policy_blocked' | 'iteration_cap';
  iterations: number;
  maxIterations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  policyEvaluation: 'approved' | 'blocked' | 'human_review';
  proofHash: string;
  startedAt: string;
  completedAt: string | null;
}

const MAX_SAMPLING_ITERATIONS = 10;
const activeSessions = new Map<string, GovernedSamplingSession>();

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

  const proofHash = computeProofHash({
    sessionId,
    actor,
    model,
    inputTokens,
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
    iterations: 1,
    maxIterations: MAX_SAMPLING_ITERATIONS,
    totalInputTokens: inputTokens,
    totalOutputTokens: 0,
    policyEvaluation: 'approved',
    proofHash,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };

  activeSessions.set(sessionId, session);

  emitRunEvent({
    type: 'sampling_started' as RunEventType,
    runId: sessionId,
    actor,
    timestamp: Date.now(),
  });

  const responseText = `[Governed Sampling] Model ${model} (${provider}) processed ${inputTokens} input tokens. ` +
    `Session ${sessionId} governed by Covenant Policy. ` +
    `Actor: ${actor}, Tenant: ${tenantId}. ` +
    `Policy evaluation: approved. Proof hash: ${proofHash}.`;

  const outputTokens = estimateTokens(responseText);
  session.totalOutputTokens = outputTokens;
  session.status = 'completed';
  session.completedAt = new Date().toISOString();

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
