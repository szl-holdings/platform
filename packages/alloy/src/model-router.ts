import type { ModelRouter, ModelRouterOptions } from './types.js';

const MODEL_CATALOG: Array<{
  id: string;
  costPerToken: number;
  avgLatencyMs: number;
  capabilities: string[];
}> = [
  {
    id: 'gpt-5.5',
    costPerToken: 0.000015,
    avgLatencyMs: 1800,
    capabilities: ['reasoning', 'coding', 'analysis', 'tool_calling'],
  },
  {
    id: 'gpt-5.2',
    costPerToken: 0.000010,
    avgLatencyMs: 1400,
    capabilities: ['reasoning', 'coding', 'analysis', 'tool_calling'],
  },
  {
    id: 'gpt-4o',
    costPerToken: 0.000005,
    avgLatencyMs: 900,
    capabilities: ['reasoning', 'coding', 'analysis', 'vision'],
  },
  {
    id: 'gpt-4o-mini',
    costPerToken: 0.00000015,
    avgLatencyMs: 350,
    capabilities: ['summarization', 'classification', 'extraction'],
  },
  {
    id: 'claude-opus-4-7',
    costPerToken: 0.000015,
    avgLatencyMs: 2200,
    capabilities: ['reasoning', 'writing', 'analysis', 'long_context'],
  },
  {
    id: 'claude-sonnet-4-6',
    costPerToken: 0.000003,
    avgLatencyMs: 1200,
    capabilities: ['reasoning', 'writing', 'analysis', 'tool_calling'],
  },
  {
    id: 'deepseek-r1',
    costPerToken: 0.00000055,
    avgLatencyMs: 1600,
    capabilities: ['reasoning', 'coding'],
  },
  {
    id: 'deepseek-v3',
    costPerToken: 0.00000027,
    avgLatencyMs: 700,
    capabilities: ['coding', 'extraction', 'summarization'],
  },
  {
    id: 'gemini-3.1-pro-preview',
    costPerToken: 0.00000125,
    avgLatencyMs: 1100,
    capabilities: ['reasoning', 'creative', 'vision', 'long_context'],
  },
  {
    id: 'gemini-3-flash-preview',
    costPerToken: 0.000000075,
    avgLatencyMs: 300,
    capabilities: ['summarization', 'creative'],
  },
];

export class DefaultModelRouter implements ModelRouter {
  selectModel(opts: ModelRouterOptions): string {
    if (opts.preferredModel) return opts.preferredModel;

    let candidates = [...MODEL_CATALOG];

    if (opts.latencyBudgetMs) {
      candidates = candidates.filter((m) => m.avgLatencyMs <= opts.latencyBudgetMs!);
    }

    if (opts.maxCostUsd) {
      const maxCostPerToken = opts.maxCostUsd / 1000;
      candidates = candidates.filter((m) => m.costPerToken <= maxCostPerToken);
    }

    if (candidates.length === 0) candidates = MODEL_CATALOG;

    return candidates.sort((a, b) => a.costPerToken - b.costPerToken)[0]?.id ?? 'gpt-4o-mini';
  }
}

export const defaultModelRouter = new DefaultModelRouter();
