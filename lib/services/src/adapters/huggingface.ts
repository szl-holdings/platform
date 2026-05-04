import { ServiceAdapter, type ServiceStatus } from "../base.js";

export interface HFTextGenerationResult {
  text: string;
  model: string;
  tier: ModelTier;
  cached: boolean;
}

export interface HFSummarizationResult {
  summary: string;
  model: string;
  tier: ModelTier;
  cached: boolean;
}

export interface HFClassificationResult {
  labels: Array<{ label: string; score: number }>;
  model: string;
  tier: ModelTier;
  cached: boolean;
}

export interface HFNERResult {
  entities: Array<{
    entity: string;
    word: string;
    score: number;
    start: number;
    end: number;
  }>;
  model: string;
  tier: ModelTier;
  cached: boolean;
}

export interface HFTranslationResult {
  translatedText: string;
  model: string;
  tier: ModelTier;
  cached: boolean;
}

export interface HFZeroShotResult {
  labels: string[];
  scores: number[];
  model: string;
  tier: ModelTier;
  cached: boolean;
}

export interface HFImageResult {
  imageBase64: string;
  mimeType: string;
  model: string;
  tier: ModelTier;
  cached: boolean;
}

export interface HFSentimentResult {
  label: string;
  score: number;
  model: string;
  tier: ModelTier;
  cached: boolean;
}

export interface HFQuestionAnswerResult {
  answer: string;
  score: number;
  model: string;
  tier: ModelTier;
  cached: boolean;
}

export interface HFEmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
  tier: ModelTier;
  cached: boolean;
}

export interface HFDocumentAnalysis {
  summary: HFSummarizationResult;
  entities: HFNERResult;
  sentiment: HFSentimentResult;
  classification: HFZeroShotResult;
  model: string;
  pipelineSteps: string[];
  processingTimeMs: number;
}

export interface HFChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface HFChatResult {
  reply: string;
  model: string;
  tier: ModelTier;
  turnCount: number;
  sessionId: string;
}

export interface HFHealthStatus {
  activeTier: ModelTier;
  modelsAvailable: Record<string, string>;
  cacheStats: { hits: number; misses: number; size: number; hitRate: string };
  runtimeTiers: Record<string, ModelTier>;
  freeTierAvailable: boolean;
  apiKeyConfigured: boolean;
}

export interface HFTranscriptionResult {
  text: string;
  model: string;
  tier: ModelTier;
  cached: boolean;
}

export interface HFReasoningResult {
  text: string;
  model: string;
  tier: ModelTier;
  cached: boolean;
  steps?: string[] | undefined;
}

export type ModelTier = "primary" | "secondary" | "tertiary" | "mock";

interface ModelChain {
  primary: string;
  secondary: string;
  tertiary: string;
}

const MODEL_REGISTRY = {
  textGeneration: {
    primary: process.env.HF_PRIMARY_LLM || "Qwen/Qwen3-8B",
    secondary: process.env.HF_SECONDARY_LLM || "Qwen/Qwen3-8B",
    tertiary: process.env.HF_FALLBACK_LLM || "Qwen/Qwen3-0.6B",
  },
  reasoning: {
    primary: process.env.HF_PRIMARY_LLM || "Qwen/Qwen3-8B",
    secondary: process.env.HF_SECONDARY_LLM || "Qwen/Qwen3-8B",
    tertiary: process.env.HF_FALLBACK_LLM || "Qwen/Qwen3-0.6B",
  },
  planning: {
    primary: process.env.HF_PRIMARY_LLM || "Qwen/Qwen3-8B",
    secondary: process.env.HF_SECONDARY_LLM || "Qwen/Qwen3-8B",
    tertiary: process.env.HF_FALLBACK_LLM || "Qwen/Qwen3-0.6B",
  },
  triage: {
    primary: process.env.HF_SECONDARY_LLM || "Qwen/Qwen3-8B",
    secondary: process.env.HF_FALLBACK_LLM || "Qwen/Qwen3-0.6B",
    tertiary: process.env.HF_FALLBACK_LLM || "Qwen/Qwen3-0.6B",
  },
  classification: {
    primary: process.env.HF_FALLBACK_LLM || "Qwen/Qwen3-0.6B",
    secondary: process.env.HF_FALLBACK_LLM || "Qwen/Qwen3-0.6B",
    tertiary: "facebook/bart-large-mnli",
  },
  toolCalling: {
    primary: process.env.HF_SECONDARY_LLM || "Qwen/Qwen3-8B",
    secondary: process.env.HF_FALLBACK_LLM || "Qwen/Qwen3-0.6B",
    tertiary: process.env.HF_FALLBACK_LLM || "Qwen/Qwen3-0.6B",
  },
  visionUnderstanding: {
    primary: process.env.HF_VISION_MODEL || "Qwen/Qwen2.5-VL-7B-Instruct",
    secondary: process.env.HF_SECONDARY_LLM || "Qwen/Qwen3-8B",
    tertiary: process.env.HF_FALLBACK_LLM || "Qwen/Qwen3-0.6B",
  },
  backgroundBatch: {
    primary: process.env.HF_FALLBACK_LLM || "Qwen/Qwen3-0.6B",
    secondary: process.env.HF_SECONDARY_LLM || "Qwen/Qwen3-8B",
    tertiary: process.env.HF_FALLBACK_LLM || "Qwen/Qwen3-0.6B",
  },
  summarization: {
    primary: process.env.HF_SECONDARY_LLM || "Qwen/Qwen3-8B",
    secondary: "facebook/bart-large-cnn",
    tertiary: "sshleifer/distilbart-cnn-12-6",
  },
  ner: {
    primary: "dslim/bert-base-NER",
    secondary: "Jean-Baptiste/camembert-ner-with-dates",
    tertiary: "elastic/distilbert-base-cased-finetuned-conll03-english",
  },
  zeroShot: {
    primary: "facebook/bart-large-mnli",
    secondary: "MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli",
    tertiary: "typeform/distilbert-base-uncased-mnli",
  },
  sentiment: {
    primary: "distilbert-base-uncased-finetuned-sst-2-english",
    secondary: "cardiffnlp/twitter-roberta-base-sentiment-latest",
    tertiary: "nlptown/bert-base-multilingual-uncased-sentiment",
  },
  questionAnswering: {
    primary: "deepset/roberta-base-squad2",
    secondary: "distilbert-base-cased-distilled-squad",
    tertiary: "deepset/tinyroberta-squad2",
  },
  imageGeneration: {
    primary: "stabilityai/sdxl-turbo",
    secondary: "stabilityai/stable-diffusion-xl-base-1.0",
    tertiary: "runwayml/stable-diffusion-v1-5",
  },
  embedding: {
    primary: process.env.HF_EMBED_MODEL || "BAAI/bge-m3",
    secondary: "sentence-transformers/all-MiniLM-L6-v2",
    tertiary: "sentence-transformers/paraphrase-MiniLM-L3-v2",
  },
  reranking: {
    primary: process.env.HF_RERANK_MODEL || "BAAI/bge-reranker-v2-m3",
    secondary: "BAAI/bge-reranker-v2-m3",
    tertiary: "BAAI/bge-reranker-v2-m3",
  },
  translation: {
    primary: "Helsinki-NLP/opus-mt-en-fr",
    secondary: "Helsinki-NLP/opus-mt-en-de",
    tertiary: "Helsinki-NLP/opus-mt-en-es",
  },
  transcription: {
    primary: "openai/whisper-large-v3",
    secondary: "openai/whisper-medium",
    tertiary: "openai/whisper-small",
  },
};

const CACHE_TTL = {
  textGeneration: 5 * 60 * 1000,
  reasoning: 5 * 60 * 1000,
  summarization: 10 * 60 * 1000,
  classification: 15 * 60 * 1000,
  ner: 15 * 60 * 1000,
  translation: 30 * 60 * 1000,
  zeroShot: 10 * 60 * 1000,
  sentiment: 10 * 60 * 1000,
  questionAnswering: 5 * 60 * 1000,
  embedding: 60 * 60 * 1000,
  imageGeneration: 30 * 60 * 1000,
  transcription: 10 * 60 * 1000,
};

const RETRYABLE_STATUS_CODES = [503, 429, 504];

const MAX_CACHE_SIZE = 500;

interface CacheEntry {
  data: unknown;
  expiry: number;
  accessedAt: number;
}

interface ChatSession {
  messages: HFChatMessage[];
  createdAt: number;
  lastAccessedAt: number;
  ownerId?: string | undefined;
}

const MOCK_ENTITIES: HFNERResult["entities"] = [
  { entity: "ORG", word: "SZL Holdings", score: 0.98, start: 0, end: 12 },
  { entity: "LOC", word: "Singapore", score: 0.95, start: 20, end: 29 },
  { entity: "MISC", word: "CVE-2024-1234", score: 0.92, start: 35, end: 48 },
];

const MOCK_CLASSIFICATIONS = [
  { label: "critical", score: 0.87 },
  { label: "high", score: 0.72 },
  { label: "medium", score: 0.45 },
];

export class HuggingFaceAdapter extends ServiceAdapter {
  readonly name = "huggingface";
  readonly description =
    "HuggingFace Inference API — advanced NLP, vision, embeddings, and streaming pipelines";
  readonly requiredEnvVars: string[] = [];

  private _freeTierAvailable: boolean | null = null;
  private readonly _cache = new Map<string, CacheEntry>();
  private _cacheHits = 0;
  private _cacheMisses = 0;
  private readonly _chatSessions = new Map<string, ChatSession>();
  private readonly _runtimeTiers = new Map<string, ModelTier>();
  private static readonly MAX_CHAT_TURNS = 20;
  private static readonly CHAT_SESSION_TTL = 30 * 60 * 1000;

  private get apiKey(): string | undefined {
    return process.env.HUGGINGFACE_API_KEY;
  }

  private get liveInferenceEnabled(): boolean {
    return process.env.HF_ENABLE_LIVE_INFERENCE === '1';
  }

  private get productionApproved(): boolean {
    return process.env.HF_PRODUCTION_APPROVED === '1';
  }

  override get status(): ServiceStatus {
    if (this.apiKey && this.liveInferenceEnabled && this.productionApproved) return "LIVE_CONFIGURED";
    if (this.apiKey) return "LIVE_CONFIGURED";
    if (this._freeTierAvailable === true) return "LIVE_CONFIGURED";
    return "MOCKED_DEMO_MODE";
  }

  override get isLive(): boolean {
    if (this.apiKey && this.liveInferenceEnabled) return true;
    if (this._freeTierAvailable === true && this.liveInferenceEnabled) return true;
    return false;
  }

  override get presentEnvVars(): string[] {
    return this.apiKey ? ["HUGGINGFACE_API_KEY"] : [];
  }

  override get missingEnvVars(): string[] {
    return [];
  }

  private trackRuntimeTier(taskType: string, tier: ModelTier): void {
    this._runtimeTiers.set(taskType, tier);
  }

  private resolveActiveTier(): ModelTier {
    if (this._runtimeTiers.size === 0) {
      return this.apiKey ? "primary" : this._freeTierAvailable !== false ? "primary" : "mock";
    }
    const tiers = [...this._runtimeTiers.values()];
    if (tiers.every(t => t === "mock")) return "mock";
    if (tiers.some(t => t === "primary")) return "primary";
    if (tiers.some(t => t === "secondary")) return "secondary";
    return "tertiary";
  }

  async probeModelAvailability(): Promise<Record<string, { available: boolean; tier: ModelTier; latencyMs: number }>> {
    const probes: Record<string, { available: boolean; tier: ModelTier; latencyMs: number }> = {};
    const taskTypes = ["textGeneration", "reasoning", "summarization", "embedding"];
    for (const taskType of taskTypes) {
      const chain = MODEL_REGISTRY[taskType as keyof typeof MODEL_REGISTRY];
      if (!chain) continue;
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
        try {
          const response = await fetch(
            `https://api-inference.huggingface.co/models/${chain.primary}`,
            { method: "POST", headers, body: JSON.stringify({ inputs: "test", parameters: { max_new_tokens: 1 } }), signal: controller.signal },
          );
          const latencyMs = Date.now() - start;
          if (response.ok || response.status === 503) {
            probes[taskType] = { available: true, tier: response.ok ? "primary" : "secondary", latencyMs };
          } else {
            probes[taskType] = { available: false, tier: "mock", latencyMs };
          }
        } finally {
          clearTimeout(timer);
        }
      } catch {
        probes[taskType] = { available: false, tier: "mock", latencyMs: Date.now() - start };
      }
    }
    return probes;
  }

  getHealthStatus(): HFHealthStatus {
    const totalReqs = this._cacheHits + this._cacheMisses;
    return {
      activeTier: this.resolveActiveTier(),
      modelsAvailable: Object.fromEntries(
        Object.entries(MODEL_REGISTRY).map(([k, v]) => [k, v.primary])
      ),
      cacheStats: {
        hits: this._cacheHits,
        misses: this._cacheMisses,
        size: this._cache.size,
        hitRate: totalReqs > 0 ? `${((this._cacheHits / totalReqs) * 100).toFixed(1)}%` : "0%",
      },
      runtimeTiers: Object.fromEntries(this._runtimeTiers),
      freeTierAvailable: this._freeTierAvailable ?? true,
      apiKeyConfigured: !!this.apiKey,
    };
  }

  protected override async performHealthCheck(): Promise<void> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    const response = await fetch(
      "https://api-inference.huggingface.co/models/gpt2",
      {
        method: "POST",
        headers,
        body: JSON.stringify({ inputs: "test", parameters: { max_new_tokens: 1 } }),
      },
    );
    if (response.ok || response.status === 503) {
      this._freeTierAvailable = true;
    } else if (response.status === 401 && !this.apiKey) {
      this._freeTierAvailable = false;
    } else {
      throw new Error(`HuggingFace API returned ${response.status}`);
    }
  }

  private getCacheKey(taskType: string, input: unknown): string {
    const inputStr = typeof input === "string" ? input : JSON.stringify(input);
    let hash = 0;
    for (let i = 0; i < inputStr.length; i++) {
      const chr = inputStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return `${taskType}:${hash}`;
  }

  private getFromCache(key: string): unknown | null {
    const entry = this._cache.get(key);
    if (!entry) {
      this._cacheMisses++;
      return null;
    }
    if (entry.expiry < Date.now()) {
      this._cache.delete(key);
      this._cacheMisses++;
      return null;
    }
    entry.accessedAt = Date.now();
    this._cacheHits++;
    return entry.data;
  }

  private setCache(key: string, data: unknown, ttlMs: number): void {
    if (this._cache.size >= MAX_CACHE_SIZE) {
      let oldestKey = "";
      let oldestTime = Infinity;
      for (const [k, v] of this._cache) {
        if (v.accessedAt < oldestTime) {
          oldestTime = v.accessedAt;
          oldestKey = k;
        }
      }
      if (oldestKey) this._cache.delete(oldestKey);
    }
    this._cache.set(key, { data, expiry: Date.now() + ttlMs, accessedAt: Date.now() });
  }

  private async callHF(model: string, body: unknown): Promise<unknown> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );
      if (!response.ok) {
        if (response.status === 401 && !this.apiKey) {
          this._freeTierAvailable = false;
        }
        throw new Error(`HuggingFace API error: ${response.status}`);
      }
      if (!this.apiKey) this._freeTierAvailable = true;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("image")) {
        const buffer = await response.arrayBuffer();
        const mimeType = contentType.split(";")[0]?.trim() || "image/png";
        return { __imageBase64: Buffer.from(buffer).toString("base64"), __mimeType: mimeType };
      }
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  private isRetryableError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return RETRYABLE_STATUS_CODES.some(code => msg.includes(String(code)));
  }

  private async callWithFallback(
    taskType: string,
    body: unknown | ((model: string) => unknown),
  ): Promise<{ data: unknown; model: string; tier: ModelTier }> {
    const chain = MODEL_REGISTRY[taskType as keyof typeof MODEL_REGISTRY];
    if (!chain) throw new Error(`Unknown task type: ${taskType}`);

    const tiers: Array<{ model: string; tier: ModelTier }> = [
      { model: chain.primary, tier: "primary" },
      { model: chain.secondary, tier: "secondary" },
      { model: chain.tertiary, tier: "tertiary" },
    ];

    let lastError: unknown;
    for (const { model, tier } of tiers) {
      try {
        const requestBody = typeof body === "function" ? body(model) : body;
        const data = await this.callHF(model, requestBody);
        this.trackRuntimeTier(taskType, tier);
        return { data, model, tier };
      } catch (err: unknown) {
        lastError = err;
        if (this.isRetryableError(err)) {
          continue;
        }
        if (tier === "tertiary") break;
      }
    }
    throw lastError ?? new Error(`All models failed for ${taskType}`);
  }

  private mockTextGen(prompt: string): HFTextGenerationResult {
    return {
      text: `[AI Generated] Analysis of "${prompt.slice(0, 50)}...": Based on current intelligence data, key indicators suggest elevated activity levels across monitored sectors. Continued monitoring recommended with emphasis on anomaly detection and cross-correlation of signals. The overall risk posture remains within acceptable parameters, though targeted review of critical infrastructure dependencies is advised.`,
      model: "mock-hf-model",
      tier: "mock",
      cached: false,
    };
  }

  async textGeneration(
    prompt: string,
    options?: { model?: string; maxTokens?: number },
  ): Promise<HFTextGenerationResult> {
    const cacheKey = this.getCacheKey("textGeneration", { prompt, ...options });
    const cached = this.getFromCache(cacheKey);
    if (cached) return { ...(cached as HFTextGenerationResult), cached: true };

    try {
      const body = { inputs: prompt, parameters: { max_new_tokens: options?.maxTokens ?? 512, temperature: 0.7 } };
      let data: unknown, model: string, tier: ModelTier;
      if (options?.model) {
        data = await this.callHF(options.model, body);
        model = options.model;
        tier = "primary";
      } else {
        ({ data, model, tier } = await this.callWithFallback("textGeneration", body));
      }
      const result: HFTextGenerationResult = {
        text: Array.isArray(data) ? (data[0]?.generated_text ?? "") : String(data),
        model,
        tier,
        cached: false,
      };
      this.setCache(cacheKey, result, CACHE_TTL.textGeneration);
      return result;
    } catch (err) {
      if (!this.liveInferenceEnabled) {
        this.trackRuntimeTier("textGeneration", "mock");
        return this.mockTextGen(prompt);
      }
      throw err;
    }
  }

  async reasoning(
    prompt: string,
    options?: { maxTokens?: number; steps?: boolean },
  ): Promise<HFReasoningResult> {
    const cacheKey = this.getCacheKey("reasoning", { prompt, ...options });
    const cached = this.getFromCache(cacheKey);
    if (cached) return { ...(cached as HFReasoningResult), cached: true };

    const systemPrompt = "You are an expert analyst. Think step by step. Break down your reasoning into clear steps before arriving at a conclusion.";
    const fullPrompt = `${systemPrompt}\n\nQuestion: ${prompt}\n\nStep-by-step analysis:`;

    try {
      const { data, model, tier } = await this.callWithFallback(
        "reasoning",
        { inputs: fullPrompt, parameters: { max_new_tokens: options?.maxTokens ?? 1024, temperature: 0.3 } },
      );
      const rawText = Array.isArray(data) ? (data[0]?.generated_text ?? "") : String(data);
      const steps = options?.steps ? rawText.split(/\n(?=Step \d|[0-9]+\.)/).filter(Boolean) : undefined;
      const result: HFReasoningResult = { text: rawText, model, tier, cached: false, steps };
      this.setCache(cacheKey, result, CACHE_TTL.reasoning);
      return result;
    } catch (err) {
      if (!this.liveInferenceEnabled) {
        this.trackRuntimeTier("reasoning", "mock");
        const mockText = `[Mixtral Reasoning] Analysis of "${prompt.slice(0, 40)}...": Step 1: Identify key variables and constraints. Step 2: Cross-reference with available intelligence data. Step 3: Evaluate multiple hypotheses against evidence. Conclusion: Based on systematic analysis, the most likely scenario involves continued operational activity with moderate risk escalation.`;
        return { text: mockText, model: "mock-hf-model", tier: "mock", cached: false, steps: options?.steps ? ["Step 1: Identify variables", "Step 2: Cross-reference data", "Step 3: Evaluate hypotheses"] : undefined };
      }
      throw err;
    }
  }

  async transcription(
    audioBuffer: Buffer,
    options?: { model?: string; language?: string },
  ): Promise<HFTranscriptionResult> {
    let contentHash = 0;
    for (let i = 0; i < Math.min(audioBuffer.length, 4096); i++) {
      contentHash = ((contentHash << 5) - contentHash) + audioBuffer[i]!;
      contentHash |= 0;
    }
    contentHash = ((contentHash << 5) - contentHash) + audioBuffer.length;
    contentHash |= 0;
    const cacheKey = this.getCacheKey("transcription", { contentHash, ...options });
    const cached = this.getFromCache(cacheKey);
    if (cached) return { ...(cached as HFTranscriptionResult), cached: true };

    const chain = MODEL_REGISTRY.transcription;
    const models = options?.model
      ? [options.model, chain.secondary, chain.tertiary]
      : [chain.primary, chain.secondary, chain.tertiary];

    for (const model of models) {
      try {
        const headers: Record<string, string> = { "Content-Type": "audio/wav" };
        if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 60000);
        try {
          const response = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            { method: "POST", headers, body: new Uint8Array(audioBuffer), signal: controller.signal },
          );
          if (!response.ok) {
            const statusStr = String(response.status);
            if (RETRYABLE_STATUS_CODES.some(c => statusStr.includes(String(c)))) continue;
            throw new Error(`Whisper API error: ${response.status}`);
          }
          const data = await response.json() as { text: string };
          const tier: ModelTier = model === chain.primary ? "primary" : model === chain.secondary ? "secondary" : "tertiary";
          this.trackRuntimeTier("transcription", tier);
          const result: HFTranscriptionResult = { text: data.text ?? "", model, tier, cached: false };
          this.setCache(cacheKey, result, CACHE_TTL.transcription);
          return result;
        } finally {
          clearTimeout(timer);
        }
      } catch {
      }
    }

    this.trackRuntimeTier("transcription", "mock");
    return { text: "[Transcription unavailable — mock mode]", model: "mock-hf-model", tier: "mock", cached: false };
  }

  async summarization(
    text: string,
    options?: { model?: string; maxLength?: number },
  ): Promise<HFSummarizationResult> {
    const cacheKey = this.getCacheKey("summarization", { text, ...options });
    const cached = this.getFromCache(cacheKey);
    if (cached) return { ...(cached as HFSummarizationResult), cached: true };

    try {
      const body = { inputs: text, parameters: { max_length: options?.maxLength ?? 200, min_length: 30 } };
      let data: unknown, model: string, tier: ModelTier;
      if (options?.model) {
        data = await this.callHF(options.model, body);
        model = options.model;
        tier = "primary";
      } else {
        ({ data, model, tier } = await this.callWithFallback("summarization", body));
      }
      const arr = data as Array<{ summary_text: string }>;
      const result: HFSummarizationResult = {
        summary: arr[0]?.summary_text ?? "",
        model,
        tier,
        cached: false,
      };
      this.setCache(cacheKey, result, CACHE_TTL.summarization);
      return result;
    } catch {
      this.trackRuntimeTier("summarization", "mock");
      return {
        summary: `Executive Summary: ${text.slice(0, 100)}... Key findings indicate significant developments requiring immediate attention across multiple operational domains.`,
        model: "mock-hf-model",
        tier: "mock",
        cached: false,
      };
    }
  }

  async textClassification(
    text: string,
    options?: { model?: string },
  ): Promise<HFClassificationResult> {
    const cacheKey = this.getCacheKey("classification", { text, ...options });
    const cached = this.getFromCache(cacheKey);
    if (cached) return { ...(cached as HFClassificationResult), cached: true };

    try {
      const body = { inputs: text };
      let data: unknown, model: string, tier: ModelTier;
      if (options?.model) {
        data = await this.callHF(options.model, body);
        model = options.model;
        tier = "primary";
      } else {
        ({ data, model, tier } = await this.callWithFallback("classification", body));
      }
      const arr = data as Array<Array<{ label: string; score: number }>>;
      const result: HFClassificationResult = {
        labels: arr[0] ?? [],
        model,
        tier,
        cached: false,
      };
      this.setCache(cacheKey, result, CACHE_TTL.classification);
      return result;
    } catch {
      this.trackRuntimeTier("classification", "mock");
      return { labels: [...MOCK_CLASSIFICATIONS], model: "mock-hf-model", tier: "mock", cached: false };
    }
  }

  async namedEntityRecognition(
    text: string,
    options?: { model?: string },
  ): Promise<HFNERResult> {
    const cacheKey = this.getCacheKey("ner", { text, ...options });
    const cached = this.getFromCache(cacheKey);
    if (cached) return { ...(cached as HFNERResult), cached: true };

    try {
      const body = { inputs: text };
      let data: unknown, model: string, tier: ModelTier;
      if (options?.model) {
        data = await this.callHF(options.model, body);
        model = options.model;
        tier = "primary";
      } else {
        ({ data, model, tier } = await this.callWithFallback("ner", body));
      }
      const arr = data as Array<{ entity_group: string; word: string; score: number; start: number; end: number }>;
      const result: HFNERResult = {
        entities: (arr ?? []).map((e) => ({
          entity: e.entity_group,
          word: e.word,
          score: e.score,
          start: e.start,
          end: e.end,
        })),
        model,
        tier,
        cached: false,
      };
      this.setCache(cacheKey, result, CACHE_TTL.ner);
      return result;
    } catch {
      this.trackRuntimeTier("ner", "mock");
      return { entities: [...MOCK_ENTITIES], model: "mock-hf-model", tier: "mock", cached: false };
    }
  }

  async translation(
    text: string,
    options?: { model?: string; sourceLang?: string; targetLang?: string },
  ): Promise<HFTranslationResult> {
    const langPair = `${options?.sourceLang ?? "en"}-${options?.targetLang ?? "fr"}`;
    const cacheKey = this.getCacheKey("translation", { text, langPair });
    const cached = this.getFromCache(cacheKey);
    if (cached) return { ...(cached as HFTranslationResult), cached: true };

    if (options?.model) {
      try {
        const data = await this.callHF(options.model, { inputs: text });
        const arr = data as Array<{ translation_text: string }>;
        const result: HFTranslationResult = {
          translatedText: arr[0]?.translation_text ?? "",
          model: options.model,
          tier: "primary",
          cached: false,
        };
        this.setCache(cacheKey, result, CACHE_TTL.translation);
        return result;
      } catch {
        // fall through to fallback chain
      }
    }

    const dynamicModels = [
      `Helsinki-NLP/opus-mt-${langPair}`,
      `Helsinki-NLP/opus-mt-en-${options?.targetLang ?? "fr"}`,
      MODEL_REGISTRY.translation.tertiary,
    ];

    for (const model of dynamicModels) {
      try {
        const data = await this.callHF(model, { inputs: text });
        const arr = data as Array<{ translation_text: string }>;
        const result: HFTranslationResult = {
          translatedText: arr[0]?.translation_text ?? "",
          model,
          tier: model === dynamicModels[0] ? "primary" : model === dynamicModels[1] ? "secondary" : "tertiary",
          cached: false,
        };
        this.setCache(cacheKey, result, CACHE_TTL.translation);
        return result;
      } catch {
      }
    }

    this.trackRuntimeTier("translation", "mock");
    return {
      translatedText: `[Translated ${langPair}] ${text}`,
      model: "mock-hf-model",
      tier: "mock",
      cached: false,
    };
  }

  async zeroShotClassification(
    text: string,
    candidateLabels: string[],
    options?: { model?: string },
  ): Promise<HFZeroShotResult> {
    const cacheKey = this.getCacheKey("zeroShot", { text, candidateLabels, ...options });
    const cached = this.getFromCache(cacheKey);
    if (cached) return { ...(cached as HFZeroShotResult), cached: true };

    try {
      const body = { inputs: text, parameters: { candidate_labels: candidateLabels } };
      let data: unknown, model: string, tier: ModelTier;
      if (options?.model) {
        data = await this.callHF(options.model, body);
        model = options.model;
        tier = "primary";
      } else {
        ({ data, model, tier } = await this.callWithFallback("zeroShot", body));
      }
      const res = data as { labels: string[]; scores: number[] };
      const result: HFZeroShotResult = {
        labels: res.labels,
        scores: res.scores,
        model,
        tier,
        cached: false,
      };
      this.setCache(cacheKey, result, CACHE_TTL.zeroShot);
      return result;
    } catch {
      this.trackRuntimeTier("zeroShot", "mock");
      const scores = candidateLabels.map(
        (_, i) => Math.max(0.1, 0.95 - i * 0.15 + (Math.random() * 0.1 - 0.05)),
      );
      return { labels: candidateLabels, scores, model: "mock-hf-model", tier: "mock", cached: false };
    }
  }

  async sentimentAnalysis(
    text: string,
    options?: { model?: string },
  ): Promise<HFSentimentResult> {
    const cacheKey = this.getCacheKey("sentiment", { text, ...options });
    const cached = this.getFromCache(cacheKey);
    if (cached) return { ...(cached as HFSentimentResult), cached: true };

    try {
      const body = { inputs: text };
      let data: unknown, model: string, tier: ModelTier;
      if (options?.model) {
        data = await this.callHF(options.model, body);
        model = options.model;
        tier = "primary";
      } else {
        ({ data, model, tier } = await this.callWithFallback("sentiment", body));
      }
      const arr = data as Array<Array<{ label: string; score: number }>>;
      const top = arr[0]?.[0];
      const result: HFSentimentResult = {
        label: top?.label ?? "NEUTRAL",
        score: top?.score ?? 0,
        model,
        tier,
        cached: false,
      };
      this.setCache(cacheKey, result, CACHE_TTL.sentiment);
      return result;
    } catch {
      this.trackRuntimeTier("sentiment", "mock");
      const isNeg = /threat|attack|critical|danger|warning|breach|risk/i.test(text);
      return {
        label: isNeg ? "NEGATIVE" : "POSITIVE",
        score: isNeg ? 0.89 : 0.82,
        model: "mock-hf-model",
        tier: "mock",
        cached: false,
      };
    }
  }

  async questionAnswering(
    question: string,
    context: string,
    options?: { model?: string },
  ): Promise<HFQuestionAnswerResult> {
    const cacheKey = this.getCacheKey("questionAnswering", { question, context });
    const cached = this.getFromCache(cacheKey);
    if (cached) return { ...(cached as HFQuestionAnswerResult), cached: true };

    try {
      const body = { inputs: { question, context } };
      let data: unknown, model: string, tier: ModelTier;
      if (options?.model) {
        data = await this.callHF(options.model, body);
        model = options.model;
        tier = "primary";
      } else {
        ({ data, model, tier } = await this.callWithFallback("questionAnswering", body));
      }
      const res = data as { answer: string; score: number };
      const result: HFQuestionAnswerResult = {
        answer: res.answer,
        score: res.score,
        model,
        tier,
        cached: false,
      };
      this.setCache(cacheKey, result, CACHE_TTL.questionAnswering);
      return result;
    } catch {
      this.trackRuntimeTier("questionAnswering", "mock");
      return {
        answer: `Based on available intelligence, the answer to "${question.slice(0, 40)}..." relates to ongoing operational patterns detected across monitored systems.`,
        score: 0.85,
        model: "mock-hf-model",
        tier: "mock",
        cached: false,
      };
    }
  }

  async imageGeneration(
    prompt: string,
    options?: { model?: string },
  ): Promise<HFImageResult> {
    const cacheKey = this.getCacheKey("imageGeneration", { prompt });
    const cached = this.getFromCache(cacheKey);
    if (cached) return { ...(cached as HFImageResult), cached: true };

    try {
      const body = { inputs: prompt };
      let data: unknown, model: string, tier: ModelTier;
      if (options?.model) {
        data = await this.callHF(options.model, body);
        model = options.model;
        tier = "primary";
      } else {
        ({ data, model, tier } = await this.callWithFallback("imageGeneration", body));
      }
      const res = data as { __imageBase64: string; __mimeType: string };
      const result: HFImageResult = {
        imageBase64: res.__imageBase64,
        mimeType: res.__mimeType,
        model,
        tier,
        cached: false,
      };
      this.setCache(cacheKey, result, CACHE_TTL.imageGeneration);
      return result;
    } catch {
      this.trackRuntimeTier("imageGeneration", "mock");
      return {
        imageBase64: createPlaceholderImage(prompt),
        mimeType: "image/svg+xml",
        model: "mock-hf-model",
        tier: "mock",
        cached: false,
      };
    }
  }

  async embedding(
    text: string | string[],
    options?: { model?: string },
  ): Promise<HFEmbeddingResult> {
    const inputText = Array.isArray(text) ? text.join(" ") : text;
    const cacheKey = this.getCacheKey("embedding", { text: inputText });
    const cached = this.getFromCache(cacheKey);
    if (cached) return { ...(cached as HFEmbeddingResult), cached: true };

    try {
      const body = { inputs: inputText };
      let data: unknown, model: string, tier: ModelTier;
      if (options?.model) {
        data = await this.callHF(options.model, body);
        model = options.model;
        tier = "primary";
      } else {
        ({ data, model, tier } = await this.callWithFallback("embedding", body));
      }
      let embeddingVector: number[];
      if (Array.isArray(data) && Array.isArray(data[0])) {
        embeddingVector = data[0] as number[];
      } else if (Array.isArray(data)) {
        embeddingVector = data as number[];
      } else {
        throw new Error("Unexpected embedding response format");
      }

      const result: HFEmbeddingResult = {
        embedding: embeddingVector,
        dimensions: embeddingVector.length,
        model,
        tier,
        cached: false,
      };
      this.setCache(cacheKey, result, CACHE_TTL.embedding);
      return result;
    } catch {
      this.trackRuntimeTier("embedding", "mock");
      const mockDim = 384;
      const mockEmb = Array.from({ length: mockDim }, () => (Math.random() - 0.5) * 2);
      const norm = Math.sqrt(mockEmb.reduce((s, v) => s + v * v, 0));
      const normalized = mockEmb.map(v => v / norm);
      return {
        embedding: normalized,
        dimensions: mockDim,
        model: "mock-hf-model",
        tier: "mock",
        cached: false,
      };
    }
  }

  async analyzeDocument(
    text: string,
    options?: { classificationLabels?: string[] },
  ): Promise<HFDocumentAnalysis> {
    const startTime = Date.now();
    const labels = options?.classificationLabels ?? [
      "security_threat", "operational_issue", "compliance_risk",
      "performance_degradation", "strategic_opportunity", "routine_update",
    ];

    const [summary, entities, sentiment, classification] = await Promise.all([
      this.summarization(text),
      this.namedEntityRecognition(text),
      this.sentimentAnalysis(text),
      this.zeroShotClassification(text, labels),
    ]);

    return {
      summary,
      entities,
      sentiment,
      classification,
      model: `pipeline[${summary.model},${entities.model},${sentiment.model},${classification.model}]`,
      pipelineSteps: ["summarization", "ner", "sentiment", "zeroShot"],
      processingTimeMs: Date.now() - startTime,
    };
  }

  async chat(
    sessionId: string,
    userMessage: string,
    options?: { systemPrompt?: string; maxTokens?: number; ownerId?: string },
  ): Promise<HFChatResult> {
    this.cleanupExpiredSessions();

    let session = this._chatSessions.get(sessionId);
    if (session?.ownerId) {
      if (!options?.ownerId || session.ownerId !== options.ownerId) {
        throw new Error("Session access denied: owner mismatch");
      }
    }
    if (!session) {
      session = {
        messages: [],
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        ownerId: options?.ownerId,
      };
      if (options?.systemPrompt) {
        session.messages.push({ role: "system", content: options.systemPrompt });
      } else {
        session.messages.push({
          role: "system",
          content: "You are an expert intelligence analyst for SZL Holdings, a technology consulting firm. Provide concise, data-driven analysis and actionable recommendations. Reference specific metrics when available.",
        });
      }
      this._chatSessions.set(sessionId, session);
    }

    session.messages.push({ role: "user", content: userMessage });
    session.lastAccessedAt = Date.now();

    if (session.messages.length > HuggingFaceAdapter.MAX_CHAT_TURNS * 2 + 1) {
      const systemMsg = session.messages[0]!;
      session.messages = [systemMsg, ...session.messages.slice(-HuggingFaceAdapter.MAX_CHAT_TURNS * 2)];
    }

    try {
      const conversationText = session.messages
        .map(m => `${m.role}: ${m.content}`)
        .join("\n");

      const prompt = `${conversationText}\nassistant:`;

      const result = await this.textGeneration(prompt, {
        maxTokens: options?.maxTokens ?? 512,
      });

      let reply = result.text;
      const assistantIdx = reply.lastIndexOf("assistant:");
      if (assistantIdx >= 0) {
        reply = reply.slice(assistantIdx + "assistant:".length).trim();
      }

      session.messages.push({ role: "assistant", content: reply });

      return {
        reply,
        model: result.model,
        tier: result.tier,
        turnCount: Math.floor((session.messages.length - 1) / 2),
        sessionId,
      };
    } catch {
      this.trackRuntimeTier("chat", "mock");
      const mockReply = this.generateMockChatReply(userMessage);
      session.messages.push({ role: "assistant", content: mockReply });
      return {
        reply: mockReply,
        model: "mock-hf-model",
        tier: "mock",
        turnCount: Math.floor((session.messages.length - 1) / 2),
        sessionId,
      };
    }
  }

  initSessionFromHistory(
    sessionId: string,
    priorTurns: Array<{ role: string; content: string }>,
    options?: { systemPrompt?: string; ownerId?: string },
  ): void {
    const existing = this._chatSessions.get(sessionId);
    if (existing?.ownerId) {
      if (!options?.ownerId || existing.ownerId !== options.ownerId) {
        throw new Error("Session access denied: owner mismatch");
      }
    }
    const messages: HFChatMessage[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    } else {
      messages.push({
        role: "system",
        content: "You are an expert intelligence analyst for SZL Holdings, a technology consulting firm. Provide concise, data-driven analysis and actionable recommendations. Reference specific metrics when available.",
      });
    }
    for (const turn of priorTurns) {
      if (turn.role === "user" || turn.role === "assistant") {
        messages.push({ role: turn.role as "user" | "assistant", content: turn.content });
      }
    }
    this._chatSessions.set(sessionId, {
      messages,
      createdAt: existing?.createdAt ?? Date.now(),
      lastAccessedAt: Date.now(),
      ownerId: options?.ownerId ?? existing?.ownerId,
    });
  }

  getChatHistory(sessionId: string, requesterId?: string): HFChatMessage[] {
    const session = this._chatSessions.get(sessionId);
    if (!session) return [];
    if (!session.ownerId) return [];
    if (!requesterId || session.ownerId !== requesterId) return [];
    return [...session.messages];
  }

  clearChatSession(sessionId: string, requesterId?: string): boolean {
    const session = this._chatSessions.get(sessionId);
    if (!session) return false;
    if (!session.ownerId) return false;
    if (!requesterId || session.ownerId !== requesterId) return false;
    return this._chatSessions.delete(sessionId);
  }

  getSessionOwnerId(sessionId: string): string | undefined {
    return this._chatSessions.get(sessionId)?.ownerId;
  }

  async *streamTextGeneration(
    prompt: string,
    options?: { model?: string; maxTokens?: number },
  ): AsyncGenerator<string, void, unknown> {
    const chain = MODEL_REGISTRY.textGeneration;
    const models = options?.model
      ? [options.model, chain.secondary, chain.tertiary]
      : [chain.primary, chain.secondary, chain.tertiary];
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    for (const model of models) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);
        try {
          const response = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            {
              method: "POST",
              headers,
              body: JSON.stringify({
                inputs: prompt,
                parameters: {
                  max_new_tokens: options?.maxTokens ?? 512,
                  temperature: 0.7,
                  return_full_text: false,
                },
                stream: true,
              }),
              signal: controller.signal,
            },
          );

          if (!response.ok) throw new Error(`HF stream error: ${response.status}`);

          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response body reader");

          const contentType = response.headers.get("content-type") || "";
          const isSSE = contentType.includes("text/event-stream");

          if (!isSSE) {
            const text = await response.text();
            try {
              const parsed = JSON.parse(text);
              const generated = Array.isArray(parsed)
                ? (parsed[0]?.generated_text ?? "")
                : (parsed.generated_text ?? String(parsed));
              if (generated) {
                const words = generated.split(" ");
                for (const word of words) {
                  yield `${word} `;
                }
              }
            } catch {
              if (text) yield text;
            }
            return;
          }

          const decoder = new TextDecoder();
          let buffer = "";
          let emittedTokens = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "data: [DONE]") continue;
              if (trimmed.startsWith("data: ")) {
                try {
                  const parsed = JSON.parse(trimmed.slice(6));
                  const token = parsed.token?.text ?? parsed.generated_text ?? "";
                  if (token) { yield token; emittedTokens = true; }
                } catch {
                  if (trimmed.length > 6) { yield trimmed.slice(6); emittedTokens = true; }
                }
              }
            }
          }

          if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith("data: ") && trimmed.length > 6) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const token = parsed.token?.text ?? parsed.generated_text ?? "";
                if (token) { yield token; emittedTokens = true; }
              } catch {
                yield trimmed.slice(6);
                emittedTokens = true;
              }
            } else if (!emittedTokens) {
              try {
                const parsed = JSON.parse(trimmed);
                const text = Array.isArray(parsed) ? (parsed[0]?.generated_text ?? "") : (parsed.generated_text ?? "");
                if (text) yield text;
              } catch {
                yield trimmed;
              }
            }
          }
          return;
        } finally {
          clearTimeout(timer);
        }
      } catch {
      }
    }

    const mockText = this.mockTextGen(prompt).text;
    const words = mockText.split(" ");
    for (const word of words) {
      yield `${word} `;
      await new Promise((r) => setTimeout(r, 30 + Math.random() * 50));
    }
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async semanticSearch(
    query: string,
    documents: string[],
    options?: { topK?: number },
  ): Promise<Array<{ text: string; score: number; index: number }>> {
    const [queryEmb, ...docEmbs] = await Promise.all([
      this.embedding(query),
      ...documents.map(d => this.embedding(d)),
    ]);

    const scored = docEmbs.map((emb, i) => ({
      text: documents[i]!,
      score: this.cosineSimilarity(queryEmb.embedding, emb.embedding),
      index: i,
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, options?.topK ?? 5);
  }

  private generateMockChatReply(userMessage: string): string {
    const msg = userMessage.toLowerCase();
    if (msg.includes("threat") || msg.includes("security")) {
      return "Based on current threat intelligence, I've identified 3 active high-severity threats targeting your sector. The primary concern is a phishing campaign (Operation DarkHook) with a 94% confidence rating. I recommend immediate review of email security policies and employee awareness training. Shall I generate a detailed threat briefing?";
    }
    if (msg.includes("vessel") || msg.includes("maritime") || msg.includes("ship")) {
      return "Current maritime intelligence shows 6 tracked vessels across 3 major shipping corridors. The Strait of Hormuz has elevated security presence with 142 vessels in queue. No sanctions violations detected in the last 24 hours. Weather advisory: South China Sea showing rough seas with tropical storm warning. Want me to pull detailed route analysis?";
    }
    if (msg.includes("risk") || msg.includes("compliance")) {
      return "Risk posture analysis for Q1 2026: Cyber attack probability at 34% (trending up), supply chain disruption at 22% (increasing), regulatory compliance gap at 15% (decreasing). Overall risk score: 67/100 (Moderate). Top recommendation: Accelerate zero-trust architecture adoption to reduce attack surface by estimated 40%.";
    }
    return "I've analyzed the current operational data across the SZL portfolio. Key metrics show 99.97% platform uptime, 234,567 API calls processed today with 42ms average response time, and 156 active users. All critical systems are operating within normal parameters. Is there a specific domain you'd like me to dive deeper into?";
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [id, session] of this._chatSessions) {
      if (now - session.lastAccessedAt > HuggingFaceAdapter.CHAT_SESSION_TTL) {
        this._chatSessions.delete(id);
      }
    }
  }
}

function createPlaceholderImage(_prompt: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e1b4b"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#bg)"/>
    <text x="256" y="240" text-anchor="middle" fill="#6366f1" font-size="20" font-family="sans-serif">AI Generated Image</text>
    <text x="256" y="270" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">[Demo Mode — SDXL-Turbo]</text>
    <text x="256" y="300" text-anchor="middle" fill="#475569" font-size="11" font-family="sans-serif">Configure HUGGINGFACE_API_KEY for live generation</text>
  </svg>`;
  return Buffer.from(svg).toString("base64");
}
