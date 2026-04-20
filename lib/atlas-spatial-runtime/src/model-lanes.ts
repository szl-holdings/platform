import type { ModelLaneMetadata, ModelLaneType } from './types.js';

/** Maps ATLAS ModelLaneType to the model-router RouteClass. */
export type ModelRouterRouteClass =
  | 'reasoning'
  | 'planning'
  | 'vision_understanding'
  | 'summarization'
  | 'extraction';

export const LANE_TO_ROUTE_CLASS: Record<ModelLaneType, ModelRouterRouteClass> = {
  reasoning: 'reasoning',
  multimodal: 'vision_understanding',
  simulation: 'planning',
  summarization: 'summarization',
  rendering: 'vision_understanding',
};

/** Returns the model-router RouteClass for a given ATLAS lane type. */
export function mapLaneToRouteClass(laneType: ModelLaneType): ModelRouterRouteClass {
  return LANE_TO_ROUTE_CLASS[laneType];
}

export type { ModelLaneType };

export interface LaneRoute {
  laneType: ModelLaneType;
  modelId: string;
  provider: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LaneResult<T = string> {
  laneType: ModelLaneType;
  modelId: string;
  provider: string;
  content: T;
  latencyMs: number;
  confidenceContribution: number;
  costEstimateUsd: number;
  proofChainTraceable: boolean;
  promptHash?: string;
}

const LANE_DEFAULTS: Record<
  ModelLaneType,
  { modelId: string; provider: string; temperature: number; maxTokens: number }
> = {
  reasoning: {
    modelId: 'Qwen/Qwen3-8B',
    provider: 'huggingface',
    temperature: 0.3,
    maxTokens: 4096,
  },
  multimodal: {
    modelId: 'Qwen/Qwen2.5-VL-7B-Instruct',
    provider: 'huggingface',
    temperature: 0.4,
    maxTokens: 2048,
  },
  simulation: {
    modelId: 'Qwen/Qwen3-8B',
    provider: 'huggingface',
    temperature: 0.1,
    maxTokens: 8192,
  },
  summarization: {
    modelId: 'Qwen/Qwen3-0.6B',
    provider: 'huggingface',
    temperature: 0.5,
    maxTokens: 1024,
  },
  rendering: {
    modelId: 'Qwen/Qwen2.5-VL-7B-Instruct',
    provider: 'huggingface',
    temperature: 0.6,
    maxTokens: 2048,
  },
};

const LANE_LATENCY_ESTIMATES_MS: Record<ModelLaneType, number> = {
  reasoning: 2400,
  multimodal: 3200,
  simulation: 4800,
  summarization: 800,
  rendering: 2800,
};

const LANE_COST_PER_TOKEN: Record<ModelLaneType, number> = {
  reasoning: 0.0000002,
  multimodal: 0.0000003,
  simulation: 0.0000002,
  summarization: 0.00000005,
  rendering: 0.0000003,
};

const LANE_CONFIDENCE_CONTRIBUTION: Record<ModelLaneType, number> = {
  reasoning: 0.85,
  multimodal: 0.75,
  simulation: 0.8,
  summarization: 0.7,
  rendering: 0.65,
};

export function getLaneMetadata(
  laneType: ModelLaneType,
  overrides?: Partial<LaneRoute>,
): ModelLaneMetadata {
  const defaults = LANE_DEFAULTS[laneType];
  const modelId = overrides?.modelId ?? defaults.modelId;
  const provider = overrides?.provider ?? defaults.provider;

  return {
    laneType,
    modelId,
    provider,
    latencyMs: LANE_LATENCY_ESTIMATES_MS[laneType],
    confidenceContribution: LANE_CONFIDENCE_CONTRIBUTION[laneType],
    costEstimateUsd: LANE_COST_PER_TOKEN[laneType] * 2000,
    proofChainTraceable: true,
    nimAdapterAvailable: false,
  };
}

export function routeLane(laneType: ModelLaneType, overrides?: Partial<LaneRoute>): LaneRoute {
  const defaults = LANE_DEFAULTS[laneType];
  return {
    laneType,
    modelId: overrides?.modelId ?? defaults.modelId,
    provider: overrides?.provider ?? defaults.provider,
    maxTokens: overrides?.maxTokens ?? defaults.maxTokens,
    temperature: overrides?.temperature ?? defaults.temperature,
  };
}

export function estimateLaneCost(laneType: ModelLaneType, estimatedTokens: number): number {
  return LANE_COST_PER_TOKEN[laneType] * estimatedTokens;
}

export interface NimAdapterStub {
  isAvailable: boolean;
  endpoint?: string;
  modelId?: string;
  authenticate(): Promise<{ token: string; expiresAt: string }>;
  invoke(laneType: ModelLaneType, prompt: string): Promise<{ content: string; latencyMs: number }>;
}

export function createNimAdapterStub(endpoint?: string): NimAdapterStub {
  return {
    isAvailable: false,
    endpoint,
    modelId: undefined,
    async authenticate() {
      throw new Error(
        'NIM adapter not configured — stub only. Set NIM_ENDPOINT and NIM_API_KEY to enable.',
      );
    },
    async invoke() {
      throw new Error('NIM adapter not available — falling back to default lane routing.');
    },
  };
}

export function allLaneMetadata(): ModelLaneMetadata[] {
  const lanes: ModelLaneType[] = [
    'reasoning',
    'multimodal',
    'simulation',
    'summarization',
    'rendering',
  ];
  return lanes.map((lt) => getLaneMetadata(lt));
}

export class ModelLaneRouter {
  private overrides: Partial<Record<ModelLaneType, Partial<LaneRoute>>> = {};
  private nimAdapter?: NimAdapterStub;

  configure(overrides: Partial<Record<ModelLaneType, Partial<LaneRoute>>>): void {
    this.overrides = { ...this.overrides, ...overrides };
  }

  attachNimAdapter(adapter: NimAdapterStub): void {
    this.nimAdapter = adapter;
  }

  route(laneType: ModelLaneType): LaneRoute {
    return routeLane(laneType, this.overrides[laneType]);
  }

  getMetadata(laneType: ModelLaneType): ModelLaneMetadata {
    const meta = getLaneMetadata(laneType, this.overrides[laneType]);
    return {
      ...meta,
      nimAdapterAvailable: this.nimAdapter?.isAvailable ?? false,
    };
  }

  allMetadata(): ModelLaneMetadata[] {
    return allLaneMetadata().map((m) => ({
      ...m,
      nimAdapterAvailable: this.nimAdapter?.isAvailable ?? false,
    }));
  }

  costEstimate(laneType: ModelLaneType, estimatedTokens: number): number {
    return estimateLaneCost(laneType, estimatedTokens);
  }
}

export const modelLaneRouter = new ModelLaneRouter();
