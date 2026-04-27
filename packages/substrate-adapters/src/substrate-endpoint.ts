import { createLogger } from './logger.js';
import { SUBSTRATE_MODEL_CATALOG, type SubstrateModelSpec } from './substrate-models.js';

const logger = createLogger('substrate-adapters:endpoint');

export interface SubstrateEndpointConfig {
  id: string;
  name: string;
  modelId: string;
  baseUrl: string;
  maxTokens?: number;
  contextLength?: number;
  gpuRequired: boolean;
  modalities: ('text' | 'image' | 'audio')[];
  ssdOffload: boolean;
  tags: string[];
  enabled: boolean;
}

export interface SubstrateChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | SubstrateMultimodalContent[];
  tool_call_id?: string;
}

export interface SubstrateMultimodalContent {
  type: 'text' | 'image_url' | 'audio_url';
  text?: string;
  image_url?: { url: string };
  audio_url?: { url: string };
}

export interface SubstrateCompletionRequest {
  endpointId: string;
  messages: SubstrateChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  tools?: Array<{ type: string; function: { name: string; description?: string; parameters?: Record<string, unknown> } }>;
  responseFormat?: { type: 'json_object' } | { type: 'text' };
}

export interface SubstrateCompletionResult {
  content: string;
  model: string;
  provider: 'substrate';
  endpointId: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs: number;
  finishReason?: string;
}

export interface SubstrateHealthStatus {
  status: 'ok' | 'idle' | 'initializing' | 'degraded' | 'offline';
  loadedModels: string[];
  gpuInfo?: {
    name: string;
    vramTotalMb: number;
    vramUsedMb: number;
    vramFreeMb: number;
    temperature?: number | null;
  };
  queueDepth: number;
  avgLatencyMs: number;
  uptime: number;
  engine?: string;
}

interface SubstrateHealthApiResponse {
  status: string;
  loaded_models: string[];
  gpu_info: {
    name: string;
    vram_total_mb: number;
    vram_used_mb: number;
    vram_free_mb: number;
    temperature: number | null;
  } | null;
  queue_depth: number;
  avg_latency_ms: number;
  uptime: number;
  engine: string;
}

function mapHealthResponse(raw: SubstrateHealthApiResponse): SubstrateHealthStatus {
  const statusMap: Record<string, SubstrateHealthStatus['status']> = {
    ok: 'ok',
    idle: 'idle',
    initializing: 'initializing',
    degraded: 'degraded',
  };
  return {
    status: statusMap[raw.status] ?? 'offline',
    loadedModels: raw.loaded_models ?? [],
    gpuInfo: raw.gpu_info
      ? {
          name: raw.gpu_info.name,
          vramTotalMb: raw.gpu_info.vram_total_mb,
          vramUsedMb: raw.gpu_info.vram_used_mb,
          vramFreeMb: raw.gpu_info.vram_free_mb,
          temperature: raw.gpu_info.temperature,
        }
      : undefined,
    queueDepth: raw.queue_depth ?? 0,
    avgLatencyMs: raw.avg_latency_ms ?? 0,
    uptime: raw.uptime ?? 0,
    engine: raw.engine,
  };
}

const DEFAULT_SUBSTRATE_URL = 'http://localhost:8070/v1';

function resolveBaseUrl(): string {
  return process.env.SUBSTRATE_INFERENCE_URL ?? DEFAULT_SUBSTRATE_URL;
}

const PREDEFINED_SUBSTRATE_ENDPOINTS: SubstrateEndpointConfig[] = SUBSTRATE_MODEL_CATALOG.map(
  (model: SubstrateModelSpec) => ({
    id: `substrate-${model.id}`,
    name: `Substrate — ${model.name}`,
    modelId: model.id,
    baseUrl: resolveBaseUrl(),
    maxTokens: 4096,
    contextLength: model.contextLength,
    gpuRequired: true,
    modalities: model.modalities,
    ssdOffload: model.supportsSsdOffload,
    tags: model.tags,
    enabled: true,
  }),
);

class SubstrateEndpointManager {
  private endpoints: Map<string, SubstrateEndpointConfig> = new Map();

  constructor(endpoints: SubstrateEndpointConfig[] = PREDEFINED_SUBSTRATE_ENDPOINTS) {
    for (const e of endpoints) {
      this.endpoints.set(e.id, e);
    }
  }

  register(config: SubstrateEndpointConfig): void {
    this.endpoints.set(config.id, config);
    logger.info(
      { id: config.id, model: config.modelId, gpuRequired: config.gpuRequired },
      'Substrate endpoint registered',
    );
  }

  get(id: string): SubstrateEndpointConfig | undefined {
    return this.endpoints.get(id);
  }

  list(
    filters: {
      gpuRequired?: boolean;
      tags?: string[];
      enabledOnly?: boolean;
      modalities?: ('text' | 'image' | 'audio')[];
    } = {},
  ): SubstrateEndpointConfig[] {
    let results = Array.from(this.endpoints.values());
    if (filters.enabledOnly !== false) results = results.filter((e) => e.enabled);
    if (filters.gpuRequired !== undefined)
      results = results.filter((e) => e.gpuRequired === filters.gpuRequired);
    if (filters.tags?.length)
      results = results.filter((e) => filters.tags?.some((t) => e.tags.includes(t)));
    if (filters.modalities?.length)
      results = results.filter((e) =>
        filters.modalities?.some((m) => e.modalities.includes(m)),
      );
    return results;
  }

  isAvailable(endpointId: string): { available: boolean; reason?: string } {
    const ep = this.endpoints.get(endpointId);
    if (!ep) return { available: false, reason: 'Endpoint not found' };
    if (!ep.enabled) return { available: false, reason: 'Endpoint disabled' };
    return { available: true };
  }

  async checkHealth(): Promise<SubstrateHealthStatus> {
    const baseUrl = resolveBaseUrl().replace(/\/v1\/?$/, '');
    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: { 'User-Agent': 'szl-holdings-substrate-adapters/1.0' },
        signal: AbortSignal.timeout(5_000),
      });

      if (!response.ok) {
        return {
          status: 'offline',
          loadedModels: [],
          queueDepth: 0,
          avgLatencyMs: 0,
          uptime: 0,
        };
      }

      const raw = (await response.json()) as SubstrateHealthApiResponse;
      return mapHealthResponse(raw);
    } catch {
      return {
        status: 'offline',
        loadedModels: [],
        queueDepth: 0,
        avgLatencyMs: 0,
        uptime: 0,
      };
    }
  }

  async complete(req: SubstrateCompletionRequest): Promise<SubstrateCompletionResult> {
    const ep = this.endpoints.get(req.endpointId);
    if (!ep) throw new Error(`Substrate endpoint '${req.endpointId}' not found`);

    const availability = this.isAvailable(req.endpointId);
    if (!availability.available)
      throw new Error(`Substrate endpoint unavailable: ${availability.reason}`);

    const start = Date.now();

    const body: Record<string, unknown> = {
      model: ep.modelId,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? ep.maxTokens ?? 4096,
      top_p: req.topP ?? 1.0,
      stream: false,
    };
    if (req.tools?.length) body.tools = req.tools;
    if (req.responseFormat) body.response_format = req.responseFormat;

    try {
      const response = await fetch(`${ep.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'szl-holdings-substrate-adapters/1.0',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(300_000),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Substrate API error ${response.status}: ${errText.slice(0, 300)}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string }; finish_reason: string }>;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        model?: string;
      };

      const latencyMs = Date.now() - start;
      const choice = data.choices[0];

      logger.debug(
        { endpointId: req.endpointId, model: ep.modelId, latencyMs },
        'Substrate completion successful',
      );

      return {
        content: choice?.message?.content ?? '',
        model: data.model ?? ep.modelId,
        provider: 'substrate',
        endpointId: req.endpointId,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
        latencyMs,
        finishReason: choice?.finish_reason,
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      logger.error(
        { endpointId: req.endpointId, error: String(err), latencyMs },
        'Substrate completion failed',
      );
      throw err;
    }
  }

  async loadModel(modelId: string): Promise<{ success: boolean; message: string }> {
    const baseUrl = resolveBaseUrl().replace(/\/v1\/?$/, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'szl-holdings-substrate-adapters/1.0',
    };
    const apiKey = typeof process !== 'undefined' ? process.env?.SUBSTRATE_API_KEY : undefined;
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    try {
      const response = await fetch(`${baseUrl}/v1/models/load`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model_id: modelId }),
        signal: AbortSignal.timeout(600_000),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, message: `Load failed: ${errText.slice(0, 300)}` };
      }

      const result = (await response.json()) as { status: string; message?: string };
      logger.info({ modelId, status: result.status }, 'Model load requested');
      return { success: true, message: result.message ?? 'Model loading' };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }

  async unloadModel(modelId: string): Promise<{ success: boolean; message: string }> {
    const baseUrl = resolveBaseUrl().replace(/\/v1\/?$/, '');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'szl-holdings-substrate-adapters/1.0',
    };
    const apiKey = typeof process !== 'undefined' ? process.env?.SUBSTRATE_API_KEY : undefined;
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    try {
      const response = await fetch(`${baseUrl}/v1/models/unload`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model_id: modelId }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, message: `Unload failed: ${errText.slice(0, 300)}` };
      }

      logger.info({ modelId }, 'Model unloaded');
      return { success: true, message: 'Model unloaded' };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  }
}

export const substrateEndpointManager = new SubstrateEndpointManager();
export { SubstrateEndpointManager, PREDEFINED_SUBSTRATE_ENDPOINTS };
