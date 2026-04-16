import { createLogger } from "./logger.js";
import type { ModelEndpoint, RouteClass } from "./router.js";

const logger = createLogger("ai-control-plane:eval-selector");

export interface EvalResult {
  endpointKey: string;
  provider: string;
  model: string;
  routeClass: RouteClass;
  score: number;
  passRate: number;
  avgLatencyMs: number;
  sampleCount: number;
  evaluatedAt: string;
  tags: string[];
}

export interface EvalCriteria {
  minScore?: number;
  minPassRate?: number;
  maxLatencyMs?: number;
  requiredTags?: string[];
}

class EvalRegistry {
  private results: Map<string, EvalResult> = new Map();

  record(result: EvalResult): void {
    const key = `${result.provider}:${result.model}:${result.routeClass}`;
    const existing = this.results.get(key);
    if (existing) {
      const totalSamples = existing.sampleCount + result.sampleCount;
      const mergedScore = (existing.score * existing.sampleCount + result.score * result.sampleCount) / totalSamples;
      const mergedPassRate = (existing.passRate * existing.sampleCount + result.passRate * result.sampleCount) / totalSamples;
      const mergedLatency = (existing.avgLatencyMs * existing.sampleCount + result.avgLatencyMs * result.sampleCount) / totalSamples;
      this.results.set(key, {
        ...result,
        score: mergedScore,
        passRate: mergedPassRate,
        avgLatencyMs: mergedLatency,
        sampleCount: totalSamples,
        evaluatedAt: new Date().toISOString(),
      });
    } else {
      this.results.set(key, { ...result, evaluatedAt: result.evaluatedAt ?? new Date().toISOString() });
    }
    logger.debug({ key, score: result.score, passRate: result.passRate }, "Eval result recorded");
  }

  get(provider: string, model: string, routeClass: RouteClass): EvalResult | undefined {
    return this.results.get(`${provider}:${model}:${routeClass}`);
  }

  list(): EvalResult[] {
    return Array.from(this.results.values());
  }

  selectBest(endpoints: ModelEndpoint[], routeClass: RouteClass, criteria: EvalCriteria = {}): ModelEndpoint | undefined {
    const scored = endpoints
      .map(e => {
        const evalResult = this.get(e.provider, e.model, routeClass);
        return { endpoint: e, eval: evalResult };
      })
      .filter(({ eval: ev }) => {
        if (!ev) return false;
        if (criteria.minScore !== undefined && ev.score < criteria.minScore) return false;
        if (criteria.minPassRate !== undefined && ev.passRate < criteria.minPassRate) return false;
        if (criteria.maxLatencyMs !== undefined && ev.avgLatencyMs > criteria.maxLatencyMs) return false;
        if (criteria.requiredTags?.length) {
          if (!criteria.requiredTags.every(t => ev.tags.includes(t))) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const scoreA = (a.eval?.score ?? 0) * 0.6 + (a.eval?.passRate ?? 0) * 0.4;
        const scoreB = (b.eval?.score ?? 0) * 0.6 + (b.eval?.passRate ?? 0) * 0.4;
        return scoreB - scoreA;
      });

    return scored[0]?.endpoint;
  }

  clear(): void {
    this.results.clear();
  }
}

export const evalRegistry = new EvalRegistry();

export function recordEvalResult(result: EvalResult): void {
  evalRegistry.record(result);
}

export function selectEvalAwareEndpoint(
  endpoints: ModelEndpoint[],
  routeClass: RouteClass,
  criteria?: EvalCriteria,
): ModelEndpoint | undefined {
  return evalRegistry.selectBest(endpoints, routeClass, criteria);
}

export { EvalRegistry };
