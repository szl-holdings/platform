/**
 * Alloy Meridian — Provider-Abstracted Model Router
 *
 * Routes inference requests across eight model lanes without hardcoding
 * any API keys. Keys are read from environment variables at request time.
 * Each lane has an ordered fallback list; the router tries models in order
 * and returns the first that is available given the current key config.
 */

export type ModelLane =
  | 'strategy'
  | 'fast-ops'
  | 'coding'
  | 'forecasting'
  | 'retrieval'
  | 'speech'
  | 'vision'
  | 'creative';

export type ModelProvider =
  | 'deepseek'
  | 'zhipu'
  | 'moonshot'
  | 'google'
  | 'alibaba'
  | 'amazon-hf'
  | 'huggingface'
  | 'openai'
  | 'fal-ai'
  | 'baidu';

export interface ModelEntry {
  id: string;
  name: string;
  provider: ModelProvider;
  contextWindow: number;
  maxOutputTokens: number;
  supportsTools: boolean;
  supportsStreaming: boolean;
  supportsVision?: boolean;
  costTier: 'low' | 'medium' | 'high';
  envKey: string;
  baseUrl?: string;
  notes?: string;
}

export interface LaneDefinition {
  lane: ModelLane;
  description: string;
  primaryModel: string;
  fallbackOrder: string[];
  models: ModelEntry[];
}

export interface ModelRouterConfig {
  lanes: LaneDefinition[];
  defaultProvider: string;
  requireHumanApproval: boolean;
  auditLog: boolean;
}

export interface RoutingDecision {
  lane: ModelLane;
  selectedModel: ModelEntry;
  fallbacksAttempted: string[];
  reason: string;
  envKeyPresent: boolean;
  routedAt: string;
}

const STRATEGY_LANE: LaneDefinition = {
  lane: 'strategy',
  description: 'Deep reasoning and multi-step strategic analysis',
  primaryModel: 'deepseek-r1',
  fallbackOrder: ['deepseek-r1', 'deepseek-v4-pro', 'glm-5-1', 'kimi-k2-6'],
  models: [
    {
      id: 'deepseek-r1',
      name: 'DeepSeek-R1',
      provider: 'deepseek',
      contextWindow: 128_000,
      maxOutputTokens: 32_768,
      supportsTools: true,
      supportsStreaming: true,
      costTier: 'high',
      envKey: 'DEEPSEEK_API_KEY',
      baseUrl: 'https://api.deepseek.com/v1',
      notes: 'Chain-of-thought reasoning flagship',
    },
    {
      id: 'deepseek-v4-pro',
      name: 'DeepSeek-V4-Pro',
      provider: 'deepseek',
      contextWindow: 200_000,
      maxOutputTokens: 65_536,
      supportsTools: true,
      supportsStreaming: true,
      costTier: 'high',
      envKey: 'DEEPSEEK_API_KEY',
      baseUrl: 'https://api.deepseek.com/v1',
    },
    {
      id: 'glm-5-1',
      name: 'GLM-5.1',
      provider: 'zhipu',
      contextWindow: 128_000,
      maxOutputTokens: 32_768,
      supportsTools: true,
      supportsStreaming: true,
      costTier: 'medium',
      envKey: 'ZHIPU_API_KEY',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    },
    {
      id: 'kimi-k2-6',
      name: 'Kimi-K2.6',
      provider: 'moonshot',
      contextWindow: 200_000,
      maxOutputTokens: 32_768,
      supportsTools: true,
      supportsStreaming: true,
      costTier: 'medium',
      envKey: 'MOONSHOT_API_KEY',
      baseUrl: 'https://api.moonshot.cn/v1',
    },
  ],
};

const FAST_OPS_LANE: LaneDefinition = {
  lane: 'fast-ops',
  description: 'High-throughput, low-latency operational tasks',
  primaryModel: 'deepseek-v4-flash',
  fallbackOrder: ['deepseek-v4-flash', 'gemma-4', 'qwen3-5-9b'],
  models: [
    {
      id: 'deepseek-v4-flash',
      name: 'DeepSeek-V4-Flash',
      provider: 'deepseek',
      contextWindow: 64_000,
      maxOutputTokens: 8_192,
      supportsTools: true,
      supportsStreaming: true,
      costTier: 'low',
      envKey: 'DEEPSEEK_API_KEY',
      baseUrl: 'https://api.deepseek.com/v1',
      notes: 'Optimised for sub-200ms latency',
    },
    {
      id: 'gemma-4',
      name: 'Gemma-4',
      provider: 'google',
      contextWindow: 128_000,
      maxOutputTokens: 16_384,
      supportsTools: true,
      supportsStreaming: true,
      costTier: 'low',
      envKey: 'GOOGLE_AI_API_KEY',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    },
    {
      id: 'qwen3-5-9b',
      name: 'Qwen3.5-9B',
      provider: 'alibaba',
      contextWindow: 32_768,
      maxOutputTokens: 8_192,
      supportsTools: true,
      supportsStreaming: true,
      costTier: 'low',
      envKey: 'DASHSCOPE_API_KEY',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    },
  ],
};

const CODING_LANE: LaneDefinition = {
  lane: 'coding',
  description: 'Code generation, review, and engineering automation',
  primaryModel: 'qwen3-coder-next',
  fallbackOrder: ['qwen3-coder-next', 'deepseek-v4-pro'],
  models: [
    {
      id: 'qwen3-coder-next',
      name: 'Qwen3-Coder-Next',
      provider: 'alibaba',
      contextWindow: 131_072,
      maxOutputTokens: 32_768,
      supportsTools: true,
      supportsStreaming: true,
      costTier: 'medium',
      envKey: 'DASHSCOPE_API_KEY',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      notes: 'Best-in-class code generation with repo context',
    },
    {
      id: 'deepseek-v4-pro',
      name: 'DeepSeek-V4-Pro (coding fallback)',
      provider: 'deepseek',
      contextWindow: 200_000,
      maxOutputTokens: 65_536,
      supportsTools: true,
      supportsStreaming: true,
      costTier: 'high',
      envKey: 'DEEPSEEK_API_KEY',
      baseUrl: 'https://api.deepseek.com/v1',
    },
  ],
};

const FORECASTING_LANE: LaneDefinition = {
  lane: 'forecasting',
  description: 'Time-series forecasting for business metrics',
  primaryModel: 'chronos-2',
  fallbackOrder: ['chronos-2', 'timesfm', 'kronos', 'timer', 'lag-llama'],
  models: [
    {
      id: 'chronos-2',
      name: 'Chronos-2',
      provider: 'amazon-hf',
      contextWindow: 4_096,
      maxOutputTokens: 512,
      supportsTools: false,
      supportsStreaming: false,
      costTier: 'medium',
      envKey: 'HF_TOKEN',
      baseUrl: 'https://api-inference.huggingface.co/models/amazon/chronos-t5-large',
      notes: 'Amazon probabilistic time-series foundation model',
    },
    {
      id: 'timesfm',
      name: 'TimesFM',
      provider: 'huggingface',
      contextWindow: 512,
      maxOutputTokens: 512,
      supportsTools: false,
      supportsStreaming: false,
      costTier: 'low',
      envKey: 'HF_TOKEN',
      baseUrl: 'https://api-inference.huggingface.co/models/google/timesfm-1.0-200m',
      notes: 'Google zero-shot forecasting model',
    },
    {
      id: 'kronos',
      name: 'Kronos',
      provider: 'huggingface',
      contextWindow: 1_024,
      maxOutputTokens: 512,
      supportsTools: false,
      supportsStreaming: false,
      costTier: 'low',
      envKey: 'HF_TOKEN',
      baseUrl: 'https://api-inference.huggingface.co/models/Salesforce/moirai-1.0-R-large',
      notes: 'Unified time-series model (Salesforce Moirai family)',
    },
    {
      id: 'timer',
      name: 'Timer',
      provider: 'huggingface',
      contextWindow: 2_048,
      maxOutputTokens: 256,
      supportsTools: false,
      supportsStreaming: false,
      costTier: 'low',
      envKey: 'HF_TOKEN',
      baseUrl: 'https://api-inference.huggingface.co/models/thuml/timer-base-84m',
      notes: 'General-purpose time-series forecaster',
    },
    {
      id: 'lag-llama',
      name: 'Lag-Llama',
      provider: 'huggingface',
      contextWindow: 256,
      maxOutputTokens: 128,
      supportsTools: false,
      supportsStreaming: false,
      costTier: 'low',
      envKey: 'HF_TOKEN',
      baseUrl: 'https://api-inference.huggingface.co/models/time-series-foundation-models/Lag-Llama',
      notes: 'Probabilistic lag-based LLM forecaster',
    },
  ],
};

const RETRIEVAL_LANE: LaneDefinition = {
  lane: 'retrieval',
  description: 'Embedding and semantic retrieval',
  primaryModel: 'bge-m3',
  fallbackOrder: ['bge-m3', 'minilm'],
  models: [
    {
      id: 'bge-m3',
      name: 'BGE-M3',
      provider: 'huggingface',
      contextWindow: 8_192,
      maxOutputTokens: 0,
      supportsTools: false,
      supportsStreaming: false,
      costTier: 'low',
      envKey: 'HF_TOKEN',
      baseUrl: 'https://api-inference.huggingface.co/models/BAAI/bge-m3',
      notes: 'Multi-lingual, multi-granularity embedding',
    },
    {
      id: 'minilm',
      name: 'MiniLM-L6-v2',
      provider: 'huggingface',
      contextWindow: 512,
      maxOutputTokens: 0,
      supportsTools: false,
      supportsStreaming: false,
      costTier: 'low',
      envKey: 'HF_TOKEN',
      baseUrl: 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
    },
  ],
};

const SPEECH_LANE: LaneDefinition = {
  lane: 'speech',
  description: 'Speech-to-text and text-to-speech',
  primaryModel: 'whisper-large-v3',
  fallbackOrder: ['whisper-large-v3', 'kokoro'],
  models: [
    {
      id: 'whisper-large-v3',
      name: 'Whisper Large v3',
      provider: 'huggingface',
      contextWindow: 448,
      maxOutputTokens: 1_024,
      supportsTools: false,
      supportsStreaming: false,
      costTier: 'medium',
      envKey: 'HF_TOKEN',
      baseUrl: 'https://api-inference.huggingface.co/models/openai/whisper-large-v3',
      notes: 'OpenAI Whisper — state-of-the-art ASR',
    },
    {
      id: 'kokoro',
      name: 'Kokoro-82M',
      provider: 'huggingface',
      contextWindow: 0,
      maxOutputTokens: 0,
      supportsTools: false,
      supportsStreaming: true,
      costTier: 'low',
      envKey: 'HF_TOKEN',
      baseUrl: 'https://api-inference.huggingface.co/models/hexgrad/Kokoro-82M',
      notes: 'High-quality TTS with natural prosody',
    },
  ],
};

const VISION_LANE: LaneDefinition = {
  lane: 'vision',
  description: 'Document OCR and visual understanding',
  primaryModel: 'glm-ocr',
  fallbackOrder: ['glm-ocr', 'gemma-4-31b'],
  models: [
    {
      id: 'glm-ocr',
      name: 'GLM-OCR',
      provider: 'zhipu',
      contextWindow: 32_768,
      maxOutputTokens: 8_192,
      supportsTools: false,
      supportsStreaming: false,
      supportsVision: true,
      costTier: 'medium',
      envKey: 'ZHIPU_API_KEY',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      notes: 'Document and handwriting OCR specialist',
    },
    {
      id: 'gemma-4-31b',
      name: 'Gemma-4-31B (Vision)',
      provider: 'google',
      contextWindow: 128_000,
      maxOutputTokens: 8_192,
      supportsTools: true,
      supportsStreaming: true,
      supportsVision: true,
      costTier: 'high',
      envKey: 'GOOGLE_AI_API_KEY',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    },
  ],
};

const CREATIVE_LANE: LaneDefinition = {
  lane: 'creative',
  description: 'Image and media generation',
  primaryModel: 'flux-1',
  fallbackOrder: ['flux-1', 'flux-2', 'ernie-image'],
  models: [
    {
      id: 'flux-1',
      name: 'FLUX.1',
      provider: 'fal-ai',
      contextWindow: 0,
      maxOutputTokens: 0,
      supportsTools: false,
      supportsStreaming: false,
      costTier: 'medium',
      envKey: 'FAL_KEY',
      baseUrl: 'https://fal.run/fal-ai/flux',
      notes: 'Black Forest Labs FLUX.1 — best open image generation',
    },
    {
      id: 'flux-2',
      name: 'FLUX.2',
      provider: 'fal-ai',
      contextWindow: 0,
      maxOutputTokens: 0,
      supportsTools: false,
      supportsStreaming: false,
      costTier: 'high',
      envKey: 'FAL_KEY',
      baseUrl: 'https://fal.run/fal-ai/flux-2',
    },
    {
      id: 'ernie-image',
      name: 'ERNIE-Image',
      provider: 'baidu',
      contextWindow: 0,
      maxOutputTokens: 0,
      supportsTools: false,
      supportsStreaming: false,
      costTier: 'low',
      envKey: 'BAIDU_API_KEY',
      baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/text2image',
    },
  ],
};

export const LANE_DEFINITIONS: LaneDefinition[] = [
  STRATEGY_LANE,
  FAST_OPS_LANE,
  CODING_LANE,
  FORECASTING_LANE,
  RETRIEVAL_LANE,
  SPEECH_LANE,
  VISION_LANE,
  CREATIVE_LANE,
];

export class ModelRouter {
  private readonly lanes: Map<ModelLane, LaneDefinition>;
  private readonly defaultProvider: string;

  constructor() {
    this.lanes = new Map(LANE_DEFINITIONS.map((l) => [l.lane, l]));
    this.defaultProvider = process.env.MODEL_ROUTER_DEFAULT_PROVIDER ?? 'deepseek';
  }

  getLane(lane: ModelLane): LaneDefinition | undefined {
    return this.lanes.get(lane);
  }

  getAllLanes(): LaneDefinition[] {
    return LANE_DEFINITIONS;
  }

  /**
   * Route a request to the best available model in the specified lane.
   * Returns the first model whose env key is present, or the primary
   * model with a flag indicating the key is missing (for mock mode).
   */
  route(lane: ModelLane, preferredModelId?: string): RoutingDecision {
    const laneDef = this.lanes.get(lane);
    if (!laneDef) {
      throw new Error(`Unknown model lane: ${lane}`);
    }

    const modelMap = new Map(laneDef.models.map((m) => [m.id, m]));
    const order = preferredModelId
      ? [preferredModelId, ...laneDef.fallbackOrder.filter((id) => id !== preferredModelId)]
      : laneDef.fallbackOrder;

    const attempted: string[] = [];
    for (const modelId of order) {
      const model = modelMap.get(modelId);
      if (!model) continue;
      const keyPresent = !!process.env[model.envKey];
      attempted.push(modelId);
      if (keyPresent) {
        return {
          lane,
          selectedModel: model,
          fallbacksAttempted: attempted.slice(0, -1),
          reason: attempted.length === 1 ? 'primary' : 'fallback',
          envKeyPresent: true,
          routedAt: new Date().toISOString(),
        };
      }
    }

    // No key found — return primary in mock mode
    const primary = modelMap.get(laneDef.primaryModel) ?? laneDef.models[0];
    return {
      lane,
      selectedModel: primary,
      fallbacksAttempted: attempted,
      reason: 'mock_no_key',
      envKeyPresent: false,
      routedAt: new Date().toISOString(),
    };
  }

  /**
   * Status snapshot: each lane + which model would be selected + whether
   * the key is present.
   */
  status(): Array<{
    lane: ModelLane;
    selectedModel: string;
    provider: string;
    envKey: string;
    keyPresent: boolean;
    mode: 'live' | 'mock';
  }> {
    return LANE_DEFINITIONS.map((laneDef) => {
      const decision = this.route(laneDef.lane);
      return {
        lane: laneDef.lane,
        selectedModel: decision.selectedModel.id,
        provider: decision.selectedModel.provider,
        envKey: decision.selectedModel.envKey,
        keyPresent: decision.envKeyPresent,
        mode: decision.envKeyPresent ? 'live' : 'mock',
      };
    });
  }
}

export const modelRouter = new ModelRouter();
