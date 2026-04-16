import { createLogger } from "./logger.js";

const logger = createLogger("nvidia-adapters:nim");

export interface NimEndpointConfig {
  id: string;
  name: string;
  modelId: string;
  baseUrl: string;
  apiKeyEnvVar: string;
  maxTokens?: number;
  contextLength?: number;
  gpuRequired: boolean;
  nimVersion?: string;
  tags: string[];
  enabled: boolean;
}

export interface NimChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface NimCompletionRequest {
  endpointId: string;
  messages: NimChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface NimCompletionResult {
  content: string;
  model: string;
  provider: "nim";
  endpointId: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs: number;
  finishReason?: string;
}

const PREDEFINED_NIM_ENDPOINTS: NimEndpointConfig[] = [
  {
    id: "nim-llama-3-1-70b",
    name: "NVIDIA NIM — Llama 3.1 70B Instruct",
    modelId: "meta/llama-3.1-70b-instruct",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKeyEnvVar: "NVIDIA_API_KEY",
    maxTokens: 4096,
    contextLength: 131072,
    gpuRequired: false,
    nimVersion: "1.0",
    tags: ["reasoning", "generation", "triage"],
    enabled: true,
  },
  {
    id: "nim-llama-3-1-8b",
    name: "NVIDIA NIM — Llama 3.1 8B Instruct",
    modelId: "meta/llama-3.1-8b-instruct",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKeyEnvVar: "NVIDIA_API_KEY",
    maxTokens: 4096,
    contextLength: 131072,
    gpuRequired: false,
    nimVersion: "1.0",
    tags: ["triage", "classification", "summarization"],
    enabled: true,
  },
  {
    id: "nim-mixtral-8x7b",
    name: "NVIDIA NIM — Mixtral 8x7B Instruct",
    modelId: "mistralai/mixtral-8x7b-instruct-v0.1",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKeyEnvVar: "NVIDIA_API_KEY",
    maxTokens: 32768,
    contextLength: 32768,
    gpuRequired: false,
    nimVersion: "1.0",
    tags: ["reasoning", "generation"],
    enabled: true,
  },
  {
    id: "nim-local-llama",
    name: "NVIDIA NIM — Local Llama (On-Prem GPU)",
    modelId: "meta/llama-3.1-70b-instruct",
    baseUrl: "http://localhost:8000/v1",
    apiKeyEnvVar: "NIM_LOCAL_API_KEY",
    maxTokens: 4096,
    contextLength: 131072,
    gpuRequired: true,
    nimVersion: "1.0",
    tags: ["reasoning", "generation"],
    enabled: false,
  },
];

class NimEndpointManager {
  private endpoints: Map<string, NimEndpointConfig> = new Map();

  constructor(endpoints: NimEndpointConfig[] = PREDEFINED_NIM_ENDPOINTS) {
    for (const e of endpoints) {
      this.endpoints.set(e.id, e);
    }
  }

  register(config: NimEndpointConfig): void {
    this.endpoints.set(config.id, config);
    logger.info({ id: config.id, model: config.modelId, gpuRequired: config.gpuRequired }, "NIM endpoint registered");
  }

  get(id: string): NimEndpointConfig | undefined {
    return this.endpoints.get(id);
  }

  list(filters: { gpuRequired?: boolean; tags?: string[]; enabledOnly?: boolean } = {}): NimEndpointConfig[] {
    let results = Array.from(this.endpoints.values());
    if (filters.enabledOnly !== false) results = results.filter(e => e.enabled);
    if (filters.gpuRequired !== undefined) results = results.filter(e => e.gpuRequired === filters.gpuRequired);
    if (filters.tags?.length) results = results.filter(e => filters.tags!.some(t => e.tags.includes(t)));
    return results;
  }

  isAvailable(endpointId: string): { available: boolean; reason?: string } {
    const ep = this.endpoints.get(endpointId);
    if (!ep) return { available: false, reason: "Endpoint not found" };
    if (!ep.enabled) return { available: false, reason: "Endpoint disabled" };
    const apiKey = process.env[ep.apiKeyEnvVar];
    if (!apiKey && !ep.baseUrl.startsWith("http://localhost")) {
      return { available: false, reason: `API key env var '${ep.apiKeyEnvVar}' not configured` };
    }
    return { available: true };
  }

  async complete(req: NimCompletionRequest): Promise<NimCompletionResult> {
    const ep = this.endpoints.get(req.endpointId);
    if (!ep) throw new Error(`NIM endpoint '${req.endpointId}' not found`);

    const availability = this.isAvailable(req.endpointId);
    if (!availability.available) throw new Error(`NIM endpoint unavailable: ${availability.reason}`);

    const apiKey = process.env[ep.apiKeyEnvVar] ?? "nim-local";
    const start = Date.now();

    const body = {
      model: ep.modelId,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? ep.maxTokens ?? 1024,
      top_p: req.topP ?? 1.0,
      stream: false,
    };

    try {
      const response = await fetch(`${ep.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "User-Agent": "szl-holdings-ai-control-plane/1.0",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`NIM API error ${response.status}: ${errText.slice(0, 300)}`);
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string }; finish_reason: string }>;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        model?: string;
      };

      const latencyMs = Date.now() - start;
      const choice = data.choices[0];

      logger.debug({ endpointId: req.endpointId, model: ep.modelId, latencyMs }, "NIM completion successful");

      return {
        content: choice?.message?.content ?? "",
        model: data.model ?? ep.modelId,
        provider: "nim",
        endpointId: req.endpointId,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
        latencyMs,
        finishReason: choice?.finish_reason,
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      logger.error({ endpointId: req.endpointId, error: String(err), latencyMs }, "NIM completion failed");
      throw err;
    }
  }
}

export const nimEndpointManager = new NimEndpointManager();
export { NimEndpointManager };
export { PREDEFINED_NIM_ENDPOINTS };
