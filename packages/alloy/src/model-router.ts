import type { ModelRouter, ModelRouterOptions } from "./types.js";

const MODEL_CATALOG: Array<{ id: string; costPerToken: number; avgLatencyMs: number; capabilities: string[] }> = [
  { id: "gpt-4o", costPerToken: 0.000015, avgLatencyMs: 800, capabilities: ["reasoning", "coding", "analysis"] },
  { id: "gpt-4o-mini", costPerToken: 0.0000015, avgLatencyMs: 300, capabilities: ["summarization", "classification"] },
  { id: "claude-3-5-sonnet", costPerToken: 0.000018, avgLatencyMs: 900, capabilities: ["reasoning", "writing", "analysis"] },
  { id: "claude-3-haiku", costPerToken: 0.0000004, avgLatencyMs: 200, capabilities: ["classification", "summarization"] },
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

    return candidates.sort((a, b) => a.costPerToken - b.costPerToken)[0]?.id ?? "gpt-4o-mini";
  }
}

export const defaultModelRouter = new DefaultModelRouter();
