import { type ChatCompletionResult, type ChatMessage, services } from '@szl-holdings/services';
import { estimateCost, type InferenceProvider, inferenceTelemetry } from './inference-telemetry';
import { logger } from './logger';
import { providerHealth } from './provider-health';
import { redisGet, redisSet } from './redis-client';

export type RoutingStrategy = 'fastest' | 'cheapest' | 'preferred' | 'fallback';

const VALID_STRATEGIES = new Set<RoutingStrategy>(['fastest', 'cheapest', 'preferred', 'fallback']);
const VALID_PROVIDERS = new Set<InferenceProvider>([
  'openai',
  'anthropic',
  'replit-proxy',
  'gemini',
  'huggingface',
  'qclaw',
  'mock',
]);

export interface GatewayRequest {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  agentId?: string;
  domain?: string;
  orgId?: string;
  preferredProvider?: InferenceProvider;
  allowedProviders?: InferenceProvider[];
  strategy?: RoutingStrategy;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface GatewayResponse {
  content: string;
  model: string;
  provider: InferenceProvider;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  estimatedCostUsd: number;
  confidence: number | null;
  routing: {
    strategy: RoutingStrategy;
    selectedProvider: InferenceProvider;
    attemptedProviders: InferenceProvider[];
    retryCount: number;
    totalLatencyMs: number;
    cached: boolean;
  };
  telemetryId: string;
}

interface ProviderCandidate {
  provider: InferenceProvider;
  model: string;
  score: number;
  reason: string;
}

type TargetableProvider = 'replit-proxy' | 'openai' | 'anthropic' | 'gemini' | 'huggingface' | 'qclaw';

const PROVIDER_MODELS: Record<string, { provider: InferenceProvider; model: string }[]> = {
  reasoning: [
    { provider: 'replit-proxy', model: 'gpt-5.2' },
    { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    { provider: 'gemini', model: 'gemini-2.0-flash' },
    { provider: 'openai', model: 'gpt-5.2' },
  ],
  analysis: [
    { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    { provider: 'gemini', model: 'gemini-2.0-flash' },
    { provider: 'replit-proxy', model: 'gpt-4o-mini' },
    { provider: 'openai', model: 'gpt-4o' },
  ],
  generation: [
    { provider: 'replit-proxy', model: 'gpt-5.2' },
    { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    { provider: 'gemini', model: 'gemini-2.0-flash' },
    { provider: 'huggingface', model: 'Qwen/Qwen3-8B' },
  ],
  fast: [
    { provider: 'qclaw', model: 'LakoMoor/QClaw-4B' },
    { provider: 'replit-proxy', model: 'gpt-4o-mini' },
    { provider: 'gemini', model: 'gemini-2.0-flash' },
    { provider: 'anthropic', model: 'claude-3-haiku-20240307' },
    { provider: 'huggingface', model: 'Qwen/Qwen3-8B' },
  ],
  agentic: [
    { provider: 'qclaw', model: 'LakoMoor/QClaw-4B' },
    { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    { provider: 'replit-proxy', model: 'gpt-5.2' },
    { provider: 'openai', model: 'gpt-5.2' },
  ],
  'tool-use': [
    { provider: 'qclaw', model: 'LakoMoor/QClaw-4B' },
    { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    { provider: 'openai', model: 'gpt-5.2' },
    { provider: 'gemini', model: 'gemini-2.0-flash' },
  ],
  default: [
    { provider: 'replit-proxy', model: 'gpt-5.2' },
    { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    { provider: 'gemini', model: 'gemini-2.0-flash' },
    { provider: 'openai', model: 'gpt-5.2' },
    { provider: 'qclaw', model: 'LakoMoor/QClaw-4B' },
    { provider: 'huggingface', model: 'Qwen/Qwen3-8B' },
  ],
};

// ---------------------------------------------------------------------------
// Circuit Breaker
// ---------------------------------------------------------------------------

type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerStatus {
  provider: InferenceProvider;
  state: CircuitState;
  consecutiveFailures: number;
  openedAt: number | null;
  lastTestedAt: number | null;
  totalTripped: number;
}

const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_RECOVERY_MS = 60_000;
const CIRCUIT_REDIS_KEY_PREFIX = 'cb:';
const CIRCUIT_REDIS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CircuitEntry {
  state: CircuitState;
  consecutiveFailures: number;
  openedAt: number | null;
  lastTestedAt: number | null;
  totalTripped: number;
  probing: boolean;
}

class ProviderCircuitBreaker {
  private circuits: Map<InferenceProvider, CircuitEntry> = new Map();

  private getOrCreate(provider: InferenceProvider): CircuitEntry {
    let circuit = this.circuits.get(provider);
    if (!circuit) {
      circuit = {
        state: 'closed',
        consecutiveFailures: 0,
        openedAt: null,
        lastTestedAt: null,
        totalTripped: 0,
        probing: false,
      };
      this.circuits.set(provider, circuit);
    }
    return circuit;
  }

  private _persist(provider: InferenceProvider): void {
    const circuit = this.circuits.get(provider);
    if (!circuit) return;
    const { probing: _probing, ...persisted } = circuit;
    void redisSet(`${CIRCUIT_REDIS_KEY_PREFIX}${provider}`, persisted, CIRCUIT_REDIS_TTL_MS);
  }

  async initialize(): Promise<void> {
    const providers: InferenceProvider[] = [
      'replit-proxy',
      'openai',
      'anthropic',
      'gemini',
      'huggingface',
      'qclaw',
    ];
    await Promise.all(
      providers.map(async (provider) => {
        try {
          const saved = await redisGet<Omit<CircuitEntry, 'probing'>>(
            `${CIRCUIT_REDIS_KEY_PREFIX}${provider}`,
          );
          if (saved) {
            this.circuits.set(provider, { ...saved, probing: false });
            logger.info(
              { provider, state: saved.state, consecutiveFailures: saved.consecutiveFailures },
              '[circuit-breaker] Restored state from Redis',
            );
          }
        } catch (err) {
          logger.warn({ provider, err }, '[circuit-breaker] Failed to restore state from Redis');
        }
      }),
    );
  }

  isOpen(provider: InferenceProvider): boolean {
    const circuit = this.getOrCreate(provider);

    if (circuit.state === 'closed') return false;

    if (circuit.state === 'open') {
      const elapsed = Date.now() - (circuit.openedAt ?? 0);
      if (elapsed >= CIRCUIT_RECOVERY_MS) {
        if (!circuit.probing) {
          circuit.state = 'half-open';
          circuit.probing = true;
          circuit.lastTestedAt = Date.now();
          this._persist(provider);
          logger.info(
            { provider, elapsedMs: elapsed },
            'Circuit breaker half-opening — allowing single probe request',
          );
          return false;
        }
        return true;
      }
      return true;
    }

    if (circuit.state === 'half-open') {
      return circuit.probing;
    }

    return false;
  }

  recordSuccess(provider: InferenceProvider): void {
    const circuit = this.getOrCreate(provider);
    const wasHalfOpen = circuit.state === 'half-open';
    circuit.state = 'closed';
    circuit.consecutiveFailures = 0;
    circuit.probing = false;
    this._persist(provider);
    if (wasHalfOpen) {
      logger.info({ provider }, 'Circuit breaker closed after successful probe');
    }
  }

  recordFailure(provider: InferenceProvider): void {
    const circuit = this.getOrCreate(provider);
    circuit.consecutiveFailures++;
    circuit.probing = false;

    if (circuit.state === 'half-open') {
      circuit.state = 'open';
      circuit.openedAt = Date.now();
      this._persist(provider);
      logger.warn({ provider }, 'Circuit breaker re-opened after failed probe');
      return;
    }

    if (circuit.state === 'closed' && circuit.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
      circuit.state = 'open';
      circuit.openedAt = Date.now();
      circuit.totalTripped++;
      this._persist(provider);
      logger.error(
        {
          provider,
          consecutiveFailures: circuit.consecutiveFailures,
          totalTripped: circuit.totalTripped,
        },
        'Circuit breaker opened — provider will receive no traffic until recovery window expires',
      );
      return;
    }

    this._persist(provider);
  }

  getStatus(provider: InferenceProvider): CircuitBreakerStatus {
    const circuit = this.getOrCreate(provider);
    return {
      provider,
      state: circuit.state,
      consecutiveFailures: circuit.consecutiveFailures,
      openedAt: circuit.openedAt,
      lastTestedAt: circuit.lastTestedAt,
      totalTripped: circuit.totalTripped,
    };
  }

  getAllStatuses(): CircuitBreakerStatus[] {
    const providers: InferenceProvider[] = [
      'replit-proxy',
      'openai',
      'anthropic',
      'gemini',
      'huggingface',
      'qclaw',
    ];
    return providers.map((p) => this.getStatus(p));
  }
}

export const providerCircuitBreaker = new ProviderCircuitBreaker();

// ---------------------------------------------------------------------------

function isTargetableProvider(provider: InferenceProvider): provider is TargetableProvider {
  return provider !== 'mock';
}

function isProviderAvailable(provider: InferenceProvider): boolean {
  if (provider === 'mock') return false;
  if (!isTargetableProvider(provider)) return false;
  if (provider === 'qclaw') {
    return !!(process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN);
  }
  return services.ai.isProviderConfigured(provider);
}

function selectCandidates(request: GatewayRequest): ProviderCandidate[] {
  const strategy = request.strategy ?? 'fastest';
  const candidates: ProviderCandidate[] = [];
  const taskType = detectTaskType(request.messages);
  const modelList = PROVIDER_MODELS[taskType] ?? PROVIDER_MODELS.default!;

  if (strategy === 'preferred' && request.preferredProvider) {
    const preferred = request.preferredProvider;
    const providerAllowed = !request.allowedProviders || request.allowedProviders.length === 0 || request.allowedProviders.includes(preferred);
    if (isProviderAvailable(preferred) && providerAllowed) {
      const preferredEntry = modelList.find((e) => e.provider === preferred);
      const model = request.model ?? preferredEntry?.model ?? modelList[0]?.model ?? 'gpt-5.2';
      const health = providerHealth.getStatus(preferred);

      if (health.status !== 'down' && !providerCircuitBreaker.isOpen(preferred)) {
        candidates.push({
          provider: preferred,
          model,
          score: 200,
          reason: `preferred: provider=${preferred}, health=${health.status}`,
        });
      }
    }
  }

  for (const { provider, model } of modelList) {
    if (candidates.some((c) => c.provider === provider)) continue;
    if (!isProviderAvailable(provider)) continue;
    if (request.allowedProviders && request.allowedProviders.length > 0 && !request.allowedProviders.includes(provider)) continue;

    const health = providerHealth.getStatus(provider);
    if (health.status === 'down') continue;

    if (providerCircuitBreaker.isOpen(provider)) {
      logger.debug({ provider }, 'Circuit breaker open — skipping provider in candidate selection');
      continue;
    }

    let score = 100;

    if (strategy === 'fastest') {
      const avgLatency = inferenceTelemetry.getProviderLatencyForModel(provider, model);
      score -= Math.min(avgLatency / 10, 80);
    } else if (strategy === 'cheapest') {
      if (
        model.includes('mini') ||
        model.includes('haiku') ||
        model.includes('flash') ||
        model.includes('Qwen3-8B') ||
        model.includes('Qwen3-0.6B')
      )
        score += 40;
    }

    if (health.status === 'degraded') score -= 30;

    const errorRate = inferenceTelemetry.getProviderErrorRate(provider);
    score -= errorRate * 100;

    candidates.push({
      provider,
      model: request.model ?? model,
      score,
      reason: `${strategy}: score=${Math.round(score)}, health=${health.status}`,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function detectTaskType(messages: ChatMessage[]): string {
  const content = messages
    .map((m) => m.content)
    .join(' ')
    .toLowerCase();
  const analysisKeywords = [
    'analyze',
    'analysis',
    'explain',
    'why',
    'how does',
    'debug',
    'diagnose',
    'review',
    'assess',
    'compare',
    'evaluate',
  ];
  const generationKeywords = ['generate', 'create', 'write', 'compose', 'draft', 'design', 'build'];
  const fastKeywords = ['quick', 'brief', 'short', 'summarize', 'classify', 'tag', 'label'];
  const agenticKeywords = [
    'execute',
    'run agent',
    'agentic',
    'autonomous',
    'multi-step',
    'plan and execute',
    'orchestrate',
    'coordinate',
    'take action',
    'sentinel',
    'helmsman',
    'warden',
    'scout',
  ];
  const toolUseKeywords = [
    'call tool',
    'use tool',
    'invoke',
    'tool call',
    'function call',
    'threat scan',
    'fleet lookup',
    'property search',
    'legal check',
    'compliance check',
    'sanctions check',
    'ais lookup',
  ];

  if (agenticKeywords.some((k) => content.includes(k))) return 'agentic';
  if (toolUseKeywords.some((k) => content.includes(k))) return 'tool-use';
  if (fastKeywords.some((k) => content.includes(k))) return 'fast';
  if (analysisKeywords.some((k) => content.includes(k))) return 'analysis';
  if (generationKeywords.some((k) => content.includes(k))) return 'generation';
  return 'default';
}

async function executeProviderInference(
  provider: InferenceProvider,
  messages: ChatMessage[],
  model: string,
  maxTokens: number,
  timeoutMs: number,
): Promise<ChatCompletionResult> {
  if (!isTargetableProvider(provider)) {
    throw new Error(`Provider "${provider}" cannot be targeted for inference`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error(`Inference timeout after ${timeoutMs}ms`));
  }, timeoutMs);

  try {
    if (provider === 'qclaw') {
      const hfToken = process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN;
      if (!hfToken) throw new Error('QClaw-4B requires HUGGINGFACE_API_KEY or HF_TOKEN');
      const endpointUrl =
        process.env.QCLAW_ENDPOINT ??
        `https://api-inference.huggingface.co/models/${model}`;

      const prompt = messages
        .map((m) => `${m.role === 'user' ? 'User' : m.role === 'assistant' ? 'Assistant' : 'System'}: ${m.content}`)
        .join('\n') + '\nAssistant:';

      const resp = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: maxTokens,
            return_full_text: false,
            temperature: 0.7,
            do_sample: true,
          },
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        throw new Error(`QClaw inference returned HTTP ${resp.status}`);
      }

      const data = (await resp.json()) as unknown;
      const content: string = Array.isArray(data)
        ? ((data[0] as Record<string, string>)?.generated_text ?? '')
        : ((data as Record<string, string>)?.generated_text ?? '');

      const promptTokens = Math.ceil(prompt.length / 4);
      const completionTokens = Math.ceil(content.length / 4);

      return {
        content,
        model,
        provider: 'qclaw',
        usage: { promptTokens, completionTokens },
      };
    }

    if (provider === 'openai' || provider === 'replit-proxy') {
      try {
        return await services.ai.responsesForProvider(provider, messages, {
          model,
          maxOutputTokens: maxTokens,
          signal: controller.signal,
        });
      } catch {
        return await services.ai.chatCompletionForProvider(provider, messages, {
          model,
          maxTokens,
          signal: controller.signal,
        });
      }
    }
    return await services.ai.chatCompletionForProvider(provider, messages, {
      model,
      maxTokens,
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(`Inference timeout after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export class AiProviderUnavailableError extends Error {
  readonly code = 'AI_PROVIDER_UNAVAILABLE';
  readonly provider: InferenceProvider;
  readonly statusCode = 503;

  constructor(provider: InferenceProvider) {
    super(`AI provider "${provider}" is temporarily unavailable — circuit breaker is open`);
    this.name = 'AiProviderUnavailableError';
    this.provider = provider;
  }
}

export async function gatewayInfer(request: GatewayRequest): Promise<GatewayResponse> {
  const startTime = Date.now();
  const strategy = request.strategy ?? 'fastest';
  const maxRetries = request.maxRetries ?? 2;
  const timeoutMs = request.timeoutMs ?? 30000;
  const agentId = request.agentId ?? 'anonymous';
  const domain = request.domain ?? 'general';
  const orgId = request.orgId;

  const candidates = selectCandidates(request);
  if (candidates.length === 0) {
    const targetable: TargetableProvider[] = [
      'replit-proxy',
      'openai',
      'anthropic',
      'gemini',
      'huggingface',
      'qclaw',
    ];
    const openCircuitProvider = targetable.find(
      (p) => isProviderAvailable(p) && providerCircuitBreaker.getStatus(p).state !== 'closed',
    );
    if (openCircuitProvider) {
      throw new AiProviderUnavailableError(openCircuitProvider);
    }
    throw new Error('No healthy providers available for inference');
  }

  const attemptedProviders: InferenceProvider[] = [];
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    if (providerCircuitBreaker.isOpen(candidate.provider)) {
      logger.warn(
        { provider: candidate.provider },
        'Circuit breaker open at inference time — fast-failing provider',
      );
      lastError = new AiProviderUnavailableError(candidate.provider);
      continue;
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      attemptedProviders.push(candidate.provider);
      const attemptStart = Date.now();

      try {
        const result = await executeProviderInference(
          candidate.provider,
          request.messages,
          candidate.model,
          request.maxTokens ?? 1024,
          timeoutMs,
        );

        const latencyMs = Date.now() - attemptStart;

        if (result.provider !== candidate.provider) {
          logger.warn(
            {
              expected: candidate.provider,
              actual: result.provider,
              model: result.model,
            },
            'Provider mismatch — recording against actual provider',
          );
        }

        const actualProvider = result.provider as InferenceProvider;

        providerCircuitBreaker.recordSuccess(actualProvider);

        const telemetryRecord = inferenceTelemetry.record({
          provider: actualProvider,
          model: result.model,
          agentId,
          domain,
          orgId,
          latencyMs,
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          success: true,
          routingStrategy: strategy,
          retryCount: attempt,
          cached: false,
        });

        providerHealth.recordSuccess(actualProvider, latencyMs);

        const totalTokens = result.usage.promptTokens + result.usage.completionTokens;
        const costUsd = estimateCost(
          result.model,
          result.usage.promptTokens,
          result.usage.completionTokens,
        );

        return {
          content: result.content,
          model: result.model,
          provider: actualProvider,
          usage: {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens,
          },
          estimatedCostUsd: costUsd,
          confidence: null,
          routing: {
            strategy,
            selectedProvider: candidate.provider,
            attemptedProviders,
            retryCount: attempt,
            totalLatencyMs: Date.now() - startTime,
            cached: false,
          },
          telemetryId: telemetryRecord.id,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const latencyMs = Date.now() - attemptStart;

        providerCircuitBreaker.recordFailure(candidate.provider);

        inferenceTelemetry.record({
          provider: candidate.provider,
          model: candidate.model,
          agentId,
          domain,
          orgId,
          latencyMs,
          promptTokens: 0,
          completionTokens: 0,
          success: false,
          errorType: lastError.message.slice(0, 100),
          routingStrategy: strategy,
          retryCount: attempt,
          cached: false,
        });

        providerHealth.recordFailure(candidate.provider, lastError.message);

        if (providerCircuitBreaker.isOpen(candidate.provider)) {
          logger.warn(
            { provider: candidate.provider, attempt },
            'Circuit breaker opened mid-retry — aborting retries for this provider',
          );
          break;
        }

        if (attempt < maxRetries) {
          const backoffMs = 2 ** attempt * 500;
          logger.warn(
            {
              provider: candidate.provider,
              model: candidate.model,
              attempt,
              backoffMs,
              error: lastError.message,
            },
            'Gateway inference attempt failed, retrying',
          );
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }
  }

  logger.error(
    { agentId, domain, attemptedProviders, error: lastError?.message },
    'All gateway inference attempts exhausted',
  );

  if (lastError instanceof AiProviderUnavailableError) {
    throw lastError;
  }

  throw new Error(
    `All providers exhausted after ${attemptedProviders.length} attempts: ${lastError?.message ?? 'unknown error'}`,
  );
}

export function getGatewayStatus(): {
  availableProviders: Array<{
    provider: InferenceProvider;
    status: string;
    configured: boolean;
    avgLatencyMs: number;
    circuitState: string;
  }>;
  defaultStrategy: RoutingStrategy;
  supportedStrategies: RoutingStrategy[];
  taskTypes: string[];
} {
  const providers: TargetableProvider[] = [
    'replit-proxy',
    'openai',
    'anthropic',
    'gemini',
    'huggingface',
    'qclaw',
  ];
  const availableProviders = providers.map((p) => {
    const health = providerHealth.getStatus(p);
    const stats = inferenceTelemetry.getProviderStats(300000).find((s) => s.provider === p);
    const circuit = providerCircuitBreaker.getStatus(p);
    const configured =
      p === 'qclaw'
        ? !!(process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN)
        : services.ai.isProviderConfigured(p);
    return {
      provider: p as InferenceProvider,
      status: health.status,
      configured,
      avgLatencyMs: stats?.avgLatencyMs ?? 0,
      circuitState: circuit.state,
    };
  });

  return {
    availableProviders,
    defaultStrategy: 'fastest',
    supportedStrategies: ['fastest', 'cheapest', 'preferred', 'fallback'],
    taskTypes: Object.keys(PROVIDER_MODELS),
  };
}

export function isValidStrategy(s: string): s is RoutingStrategy {
  return VALID_STRATEGIES.has(s as RoutingStrategy);
}

export function isValidProvider(p: string): p is InferenceProvider {
  return VALID_PROVIDERS.has(p as InferenceProvider);
}
