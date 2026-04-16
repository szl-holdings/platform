import type { CognitiveMetric, KnownMetricName } from "./metrics.js";
import { makeMetric } from "./metrics.js";

export interface MetricCollector {
  record(metric: CognitiveMetric): void;
  recordKnown(name: KnownMetricName, value: number, labels?: Record<string, string>): void;
  flush(): CognitiveMetric[];
  snapshot(): CognitiveMetric[];
}

export class InMemoryMetricCollector implements MetricCollector {
  private buffer: CognitiveMetric[] = [];

  record(metric: CognitiveMetric): void {
    this.buffer.push(metric);
  }

  recordKnown(name: KnownMetricName, value: number, labels: Record<string, string> = {}): void {
    this.record(makeMetric(name, value, labels));
  }

  flush(): CognitiveMetric[] {
    const metrics = [...this.buffer];
    this.buffer = [];
    return metrics;
  }

  snapshot(): CognitiveMetric[] {
    return [...this.buffer];
  }
}

export const globalCollector = new InMemoryMetricCollector();
