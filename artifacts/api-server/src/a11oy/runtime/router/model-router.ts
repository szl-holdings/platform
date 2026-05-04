import type { ModelProvider } from '../types.js';
import { checkHfLiveRoutingGate } from '../model-registry.js';

export interface ModelRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ModelResponse {
  content: string;
  tokensUsed: number;
  model: string;
  provider: ModelProvider;
  latencyMs: number;
  isDemo: boolean;
}

export interface ProviderStatus {
  provider: ModelProvider;
  available: boolean;
  model: string;
  reason?: string;
}

export interface GateCheckResult {
  allowed: boolean;
  model: string;
  failedGates: string[];
  gates: Record<string, boolean>;
}

export function checkInferenceGates(modelId: string): GateCheckResult {
  const registryGate = checkHfLiveRoutingGate(modelId);

  const gates: Record<string, boolean> = {
    registry_exists: registryGate.conditions.registry_record_exists,
    license_approved: registryGate.conditions.license_approved,
    sensitivity_match: registryGate.conditions.sensitivity_match,
    live_inference_enabled: registryGate.conditions.hf_live_inference_enabled,
    production_approved: registryGate.conditions.hf_production_approved,
  };

  const failedGates = Object.entries(gates)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return {
    allowed: failedGates.length === 0,
    model: modelId,
    failedGates,
    gates,
  };
}

export function getGateSummary(): {
  liveInferenceEnabled: boolean;
  productionApproved: boolean;
  hfTokenConfigured: boolean;
} {
  return {
    liveInferenceEnabled: process.env.HF_ENABLE_LIVE_INFERENCE === '1',
    productionApproved: process.env.HF_PRODUCTION_APPROVED === '1',
    hfTokenConfigured: !!(process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY),
  };
}

function resolveProvider(): ModelProvider {
  if (process.env.MODEL_PROVIDER) {
    return process.env.MODEL_PROVIDER as ModelProvider;
  }
  // Substrate GPU inference takes priority when configured — local GPU beats cloud.
  // Gate mirrors model_router.py check_substrate_gate(): both SUBSTRATE_INFERENCE_URL
  // and SUBSTRATE_API_KEY must be set. Python remains source-of-truth for selection
  // logic; this TS gate only decides whether to hand off to the substrate path.
  if (process.env.SUBSTRATE_INFERENCE_URL && process.env.SUBSTRATE_API_KEY) return 'substrate';
  if (process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY) return 'openai';
  if (process.env.DEEPSEEK_API_KEY) return 'deepseek';
  if (process.env.NVIDIA_API_KEY) return 'nvidia';
  if (
    (process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY) &&
    process.env.HF_ENABLE_LIVE_INFERENCE === '1'
  ) {
    return 'huggingface';
  }
  if (process.env.LOCAL_MODEL_URL) return 'local';
  return 'mock';
}

function getDefaultModel(role: 'reasoning' | 'fast' | 'long_context'): string {
  const map: Record<string, string | undefined> = {
    reasoning: process.env.DEFAULT_REASONING_MODEL,
    fast: process.env.DEFAULT_FAST_MODEL,
    long_context: process.env.DEFAULT_LONG_CONTEXT_MODEL,
  };
  return map[role] ?? 'mock-v1';
}

async function callOpenAI(req: ModelRequest): Promise<ModelResponse> {
  const key = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) throw new Error('openai_key_missing');
  const model = req.model ?? getDefaultModel('reasoning');
  const t = Date.now();
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.3,
      messages: [
        ...(req.systemPrompt ? [{ role: 'system', content: req.systemPrompt }] : []),
        { role: 'user', content: req.prompt },
      ],
    }),
  });
  if (!resp.ok) throw new Error(`openai_api_error:${resp.status}`);
  const json = (await resp.json()) as { choices: { message: { content: string } }[]; usage: { total_tokens: number } };
  return {
    content: json.choices[0]?.message?.content ?? '',
    tokensUsed: json.usage?.total_tokens ?? 0,
    model,
    provider: 'openai',
    latencyMs: Date.now() - t,
    isDemo: false,
  };
}

async function callDeepseek(req: ModelRequest): Promise<ModelResponse> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('deepseek_key_missing');
  const model = req.model ?? getDefaultModel('reasoning');
  const t = Date.now();
  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        ...(req.systemPrompt ? [{ role: 'system', content: req.systemPrompt }] : []),
        { role: 'user', content: req.prompt },
      ],
      max_tokens: req.maxTokens ?? 1024,
    }),
  });
  if (!resp.ok) throw new Error(`deepseek_api_error:${resp.status}`);
  const json = (await resp.json()) as { choices: { message: { content: string } }[]; usage: { total_tokens: number } };
  return {
    content: json.choices[0]?.message?.content ?? '',
    tokensUsed: json.usage?.total_tokens ?? 0,
    model,
    provider: 'deepseek',
    latencyMs: Date.now() - t,
    isDemo: false,
  };
}

async function callNvidia(req: ModelRequest): Promise<ModelResponse> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error('nvidia_key_missing');
  const model = req.model ?? getDefaultModel('reasoning');
  const t = Date.now();
  const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        ...(req.systemPrompt ? [{ role: 'system', content: req.systemPrompt }] : []),
        { role: 'user', content: req.prompt },
      ],
      max_tokens: req.maxTokens ?? 1024,
    }),
  });
  if (!resp.ok) throw new Error(`nvidia_api_error:${resp.status}`);
  const json = (await resp.json()) as { choices: { message: { content: string } }[]; usage: { total_tokens: number } };
  return {
    content: json.choices[0]?.message?.content ?? '',
    tokensUsed: json.usage?.total_tokens ?? 0,
    model,
    provider: 'nvidia',
    latencyMs: Date.now() - t,
    isDemo: false,
  };
}

async function callHuggingFace(req: ModelRequest): Promise<ModelResponse> {
  const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
  if (!token) throw new Error('hf_token_missing');

  const model = req.model ?? (process.env.HF_PRIMARY_LLM || 'Qwen/Qwen3-8B');

  const gateResult = checkInferenceGates(model);
  if (!gateResult.allowed) {
    throw new Error(
      `governance_gate_blocked:${model}:${gateResult.failedGates.join(',')}`,
    );
  }

  const apiBase = process.env.HF_API_BASE || 'https://router.huggingface.co/hf-inference/v1';
  const t = Date.now();
  const resp = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      model,
      messages: [
        ...(req.systemPrompt ? [{ role: 'system', content: req.systemPrompt }] : []),
        { role: 'user', content: req.prompt },
      ],
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.3,
    }),
  });
  if (!resp.ok) throw new Error(`hf_api_error:${resp.status}`);
  const json = (await resp.json()) as {
    choices: { message: { content: string } }[];
    usage?: { total_tokens: number };
  };
  return {
    content: json.choices[0]?.message?.content ?? '',
    tokensUsed: json.usage?.total_tokens ?? 0,
    model,
    provider: 'huggingface',
    latencyMs: Date.now() - t,
    isDemo: false,
  };
}

/**
 * callSubstrate — delegates to the on-prem GPU inference engine.
 *
 * The inference app exposes an OpenAI-compatible /v1/chat/completions endpoint,
 * so this function is structurally identical to callOpenAI/callDeepseek but
 * targets SUBSTRATE_INFERENCE_URL and authenticates with SUBSTRATE_API_KEY.
 *
 * Model selection within the substrate fleet is governed by Python
 * model_router.py (called via the bridge); the default here is only used when
 * the bridge is unavailable (dry-run / test contexts).
 */
async function callSubstrate(req: ModelRequest): Promise<ModelResponse> {
  const url = process.env.SUBSTRATE_INFERENCE_URL;
  const key = process.env.SUBSTRATE_API_KEY;
  if (!url || !key) throw new Error('substrate_not_configured');
  const model = req.model ?? process.env.SUBSTRATE_DEFAULT_MODEL ?? 'llama-3.3-70b-instruct';
  const t = Date.now();
  const resp = await fetch(`${url}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(req.systemPrompt ? [{ role: 'system', content: req.systemPrompt }] : []),
        { role: 'user', content: req.prompt },
      ],
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.3,
    }),
  });
  if (!resp.ok) throw new Error(`substrate_api_error:${resp.status}`);
  const json = (await resp.json()) as {
    choices: { message: { content: string } }[];
    usage: { total_tokens: number };
  };
  return {
    content: json.choices[0]?.message?.content ?? '',
    tokensUsed: json.usage?.total_tokens ?? 0,
    model,
    provider: 'substrate',
    latencyMs: Date.now() - t,
    isDemo: false,
  };
}

async function callLocal(req: ModelRequest): Promise<ModelResponse> {
  const url = process.env.LOCAL_MODEL_URL;
  if (!url) throw new Error('local_model_url_missing');
  const model = req.model ?? getDefaultModel('fast');
  const t = Date.now();
  const resp = await fetch(`${url}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        ...(req.systemPrompt ? [{ role: 'system', content: req.systemPrompt }] : []),
        { role: 'user', content: req.prompt },
      ],
      max_tokens: req.maxTokens ?? 1024,
    }),
  });
  if (!resp.ok) throw new Error(`local_model_error:${resp.status}`);
  const json = (await resp.json()) as { choices: { message: { content: string } }[] };
  return {
    content: json.choices[0]?.message?.content ?? '',
    tokensUsed: 0,
    model,
    provider: 'local',
    latencyMs: Date.now() - t,
    isDemo: false,
  };
}

function callMock(req: ModelRequest): ModelResponse {
  const t = Date.now();
  const responses: Record<string, string> = {
    default: 'Demo response: analysis complete. Evidence is sufficient for the requested operation. Recommendation: proceed with operator review.',
    planner: 'Planning complete. Identified 3 phases: context gathering, risk analysis, action brief creation.',
    analyst: 'Analysis complete. Signal strength: high. Business impact: significant revenue risk. Confidence: 0.87.',
    risk: 'Risk assessment complete. Risk class: financial. Approval required: yes. Tier: executive.',
    proof: 'Proof packet constructed. Hash verified. Evidence chain: 4 citations. Coverage: 0.92.',
    action: 'Action brief created. Priority: urgent. Estimated impact: $2.4M ARR at risk.',
    verification: 'Verification complete. Execution trace matches expected outcome. Status: proven.',
  };
  const key = Object.keys(responses).find((k) => req.prompt.toLowerCase().includes(k)) ?? 'default';
  return {
    content: responses[key] ?? responses.default,
    tokensUsed: Math.floor(Math.random() * 200) + 100,
    model: 'mock-v1',
    provider: 'mock',
    latencyMs: Date.now() - t + Math.floor(Math.random() * 50) + 10,
    isDemo: true,
  };
}

export async function routeModelCall(req: ModelRequest): Promise<ModelResponse> {
  const provider = resolveProvider();
  try {
    switch (provider) {
      case 'substrate': return await callSubstrate(req);
      case 'openai': return await callOpenAI(req);
      case 'deepseek': return await callDeepseek(req);
      case 'nvidia': return await callNvidia(req);
      case 'huggingface': return await callHuggingFace(req);
      case 'local': return await callLocal(req);
      default: return callMock(req);
    }
  } catch {
    return callMock(req);
  }
}

export async function routeModelCallWithFailover(req: ModelRequest, fallbackModels: string[]): Promise<ModelResponse> {
  const provider = resolveProvider();

  const tryCall = async (model: string): Promise<ModelResponse> => {
    const modifiedReq = { ...req, model };
    switch (provider) {
      case 'substrate': return await callSubstrate(modifiedReq);
      case 'openai': return await callOpenAI(modifiedReq);
      case 'deepseek': return await callDeepseek(modifiedReq);
      case 'nvidia': return await callNvidia(modifiedReq);
      case 'huggingface': return await callHuggingFace(modifiedReq);
      case 'local': return await callLocal(modifiedReq);
      default: throw new Error('no_live_provider');
    }
  };

  const primaryModel = req.model ?? getDefaultModel('reasoning');
  const modelsToTry = [primaryModel, ...fallbackModels.filter(m => m !== primaryModel)];

  let lastError: Error | null = null;
  for (const model of modelsToTry) {
    try {
      return await tryCall(model);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  return callMock(req);
}

export function getProviderStatuses(): ProviderStatus[] {
  const active = resolveProvider();
  const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
  const hfGates = checkInferenceGates(process.env.HF_PRIMARY_LLM || 'Qwen/Qwen3-8B');
  const substrateConfigured = !!(process.env.SUBSTRATE_INFERENCE_URL && process.env.SUBSTRATE_API_KEY);

  const statuses: ProviderStatus[] = [
    {
      provider: 'substrate',
      available: substrateConfigured,
      model: process.env.SUBSTRATE_DEFAULT_MODEL ?? 'llama-3.3-70b-instruct',
      reason: substrateConfigured ? undefined : 'SUBSTRATE_INFERENCE_URL or SUBSTRATE_API_KEY not configured',
    },
    {
      provider: 'openai',
      available: !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY),
      model: process.env.DEFAULT_REASONING_MODEL ?? 'gpt-4o',
      reason: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY ? undefined : 'key_not_configured',
    },
    {
      provider: 'deepseek',
      available: !!process.env.DEEPSEEK_API_KEY,
      model: 'deepseek-reasoner',
      reason: process.env.DEEPSEEK_API_KEY ? undefined : 'key_not_configured',
    },
    {
      provider: 'nvidia',
      available: !!process.env.NVIDIA_API_KEY,
      model: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
      reason: process.env.NVIDIA_API_KEY ? undefined : 'key_not_configured',
    },
    {
      provider: 'huggingface',
      available: !!hfToken && hfGates.allowed,
      model: process.env.HF_PRIMARY_LLM || 'Qwen/Qwen3-8B',
      reason: !hfToken
        ? 'token_not_configured'
        : !hfGates.allowed
          ? `gates_blocked:${hfGates.failedGates.join(',')}`
          : undefined,
    },
    {
      provider: 'local',
      available: !!process.env.LOCAL_MODEL_URL,
      model: 'local-model',
      reason: process.env.LOCAL_MODEL_URL ? undefined : 'url_not_configured',
    },
    {
      provider: 'mock',
      available: true,
      model: 'mock-v1',
      reason: active !== 'mock' ? 'fallback_available' : 'active_provider',
    },
  ];
  return statuses;
}

export function getActiveProvider(): { provider: ModelProvider; model: string; isDemo: boolean } {
  const provider = resolveProvider();
  const modelMap: Record<ModelProvider, string> = {
    substrate: process.env.SUBSTRATE_DEFAULT_MODEL ?? 'llama-3.3-70b-instruct',
    openai: process.env.DEFAULT_REASONING_MODEL ?? 'gpt-4o',
    deepseek: 'deepseek-reasoner',
    nvidia: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
    huggingface: process.env.HF_PRIMARY_LLM || 'Qwen/Qwen3-8B',
    local: 'local-model',
    mock: 'mock-v1',
  };
  return { provider, model: modelMap[provider], isDemo: provider === 'mock' };
}
