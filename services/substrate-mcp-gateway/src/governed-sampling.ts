import { randomUUID, createHash } from 'node:crypto';
import { getCurrentActorId, getCurrentTenantId } from './request-context.js';
import { emitRunEvent, type RunEventType } from './run-events.js';
import { recordProof, type ProofRecord } from './nexus-fabric.js';
import { submitPendingApprovalRequest } from '@workspace/approvals-inbox';

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
  status: 'active' | 'completed' | 'policy_blocked' | 'pending_approval' | 'iteration_cap' | 'client_unavailable';
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

export type SamplingContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };

export interface SamplingBridgeMessage {
  role: 'user' | 'assistant';
  content: SamplingContentBlock[];
}

export interface SamplingBridgeResult {
  role: 'assistant';
  content: { type: 'text'; text: string };
  model: string;
  stopReason?: string;
  toolUse?: { id: string; name: string; input: Record<string, unknown> };
}

export interface SamplingBridge {
  requestSampling: (params: {
    messages: Array<{ role: 'user' | 'assistant'; content: { type: 'text'; text: string } }>;
    modelPreferences?: SamplingModelPreferences;
    systemPrompt?: string;
    maxTokens: number;
    metadata?: Record<string, unknown>;
  }) => Promise<SamplingBridgeResult>;

  executeToolCall?: (params: {
    toolName: string;
    arguments: Record<string, unknown>;
  }) => Promise<{ type: 'text'; text: string }>;
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

const HIGH_RISK_TOKEN_THRESHOLD = 16384;
const HIGH_RISK_MODELS = new Set(['claude-opus-4-5', 'gpt-4o']);

function evaluateCovenantPolicy(
  actor: string,
  tenantId: string,
  model: string,
  maxTokens: number,
  sessionId: string,
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

  const isHighRisk =
    (maxTokens > HIGH_RISK_TOKEN_THRESHOLD && HIGH_RISK_MODELS.has(model)) ||
    tenantId === 'substrate-gateway';

  if (isHighRisk) {
    submitPendingApprovalRequest({
      runId: sessionId,
      stepId: `sampling-covenant-${sessionId}`,
      stepName: 'Governed Sampling — Covenant High-Risk Review',
      toolId: `sampling:${model}`,
      action: `High-risk sampling: model=${model}, maxTokens=${maxTokens}`,
      justification: `Actor '${actor}' requested sampling with high-risk model '${model}' at ${maxTokens} tokens on tenant '${tenantId}'.`,
      projectedImpact: `Token budget consumption up to ${maxTokens} tokens on ${model}.`,
      projectedRisk: 'Elevated cost and resource usage from high-capability model invocation.',
      requestedBy: actor,
      domain: tenantId,
      surface: 'mcp-sampling',
      timeoutMs: 5 * 60_000,
    });

    return {
      allowed: false,
      policyResult: 'deny',
      reason: `High-risk sampling request held for human approval in Approvals Inbox. ` +
        `Actor '${actor}', model '${model}', ${maxTokens} tokens. ` +
        `Execution blocked until operator grants approval via Approvals Inbox.`,
      matchedPolicies: ['high_risk_escalation', 'approvals_inbox_review'],
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

  const covenantResult = evaluateCovenantPolicy(actor, tenantId, model, request.maxTokens, sessionId);

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
    const isPendingApproval = covenantResult.matchedPolicies.includes('high_risk_escalation');
    session.status = isPendingApproval ? 'pending_approval' : 'policy_blocked';
    session.policyEvaluation = isPendingApproval ? 'human_review' : 'blocked';
    session.completedAt = isPendingApproval ? null : new Date().toISOString();
    persistProofRecord(sessionId, actor, model, proofHash, inputTokens, 0, true);
    session.proofPersistedToWal = true;

    emitRunEvent({
      type: 'sampling_completed' as RunEventType,
      runId: sessionId,
      actor,
      status: session.status,
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
      const conversationMessages: Array<{ role: 'user' | 'assistant'; content: { type: 'text'; text: string } }> =
        request.messages
          .filter((m) => m.content.type === 'text' && m.content.text)
          .map((m) => ({
            role: m.role,
            content: { type: 'text' as const, text: m.content.text! },
          }));

      let lastResult: SamplingBridgeResult | null = null;

      for (let iteration = 1; iteration <= MAX_SAMPLING_ITERATIONS; iteration++) {
        session.iterations = iteration;

        const bridgeResult = await _samplingBridge.requestSampling({
          messages: conversationMessages,
          modelPreferences: request.modelPreferences,
          systemPrompt: request.systemPrompt,
          maxTokens: request.maxTokens,
          metadata: { ...request.metadata, iteration, sessionId },
        });

        const iterOutputTokens = estimateTokens(bridgeResult.content.text);
        session.totalOutputTokens += iterOutputTokens;
        session.model = bridgeResult.model || model;
        lastResult = bridgeResult;

        const toolCall = bridgeResult.toolUse;
        if (bridgeResult.stopReason !== 'toolUse' || !_samplingBridge.executeToolCall || !toolCall) {
          break;
        }

        const toolResult = await _samplingBridge.executeToolCall({
          toolName: toolCall.name,
          arguments: toolCall.input,
        });

        const toolUseBlock: SamplingContentBlock = {
          type: 'tool_use',
          id: toolCall.id,
          name: toolCall.name,
          input: toolCall.input,
        };
        const toolResultBlock: SamplingContentBlock = {
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: toolResult.text,
        };

        conversationMessages.push({
          role: 'assistant',
          content: { type: 'text', text: JSON.stringify(toolUseBlock) },
        });
        conversationMessages.push({
          role: 'user',
          content: { type: 'text', text: JSON.stringify(toolResultBlock) },
        });

        session.totalInputTokens += estimateTokens(toolResult.text);

        if (iteration === MAX_SAMPLING_ITERATIONS) {
          session.status = 'iteration_cap';
          session.completedAt = new Date().toISOString();
          persistProofRecord(sessionId, actor, session.model, proofHash, session.totalInputTokens, session.totalOutputTokens, false);
          session.proofPersistedToWal = true;

          emitRunEvent({
            type: 'sampling_completed' as RunEventType,
            runId: sessionId,
            actor,
            status: 'iteration_cap',
            timestamp: Date.now(),
          });

          return {
            role: 'assistant',
            content: lastResult!.content,
            model: session.model,
            stopReason: 'endTurn',
          };
        }
      }

      session.status = 'completed';
      session.completedAt = new Date().toISOString();

      persistProofRecord(sessionId, actor, session.model, proofHash, session.totalInputTokens, session.totalOutputTokens, false);
      session.proofPersistedToWal = true;

      emitRunEvent({
        type: 'sampling_completed' as RunEventType,
        runId: sessionId,
        actor,
        timestamp: Date.now(),
      });

      return {
        role: 'assistant',
        content: lastResult!.content,
        model: session.model,
        stopReason: (lastResult!.stopReason as SamplingResult['stopReason']) ?? 'endTurn',
      };
    } catch (e) {
      session.status = 'client_unavailable';
      session.completedAt = new Date().toISOString();
      persistProofRecord(sessionId, actor, model, proofHash, session.totalInputTokens, 0, true);
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
