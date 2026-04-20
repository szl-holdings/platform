import type { MetricCollector } from './collector.js';
import type { CognitiveMetric } from './metrics.js';

export interface OtelMetricExporter {
  export(metrics: CognitiveMetric[]): Promise<void>;
  shutdown(): Promise<void>;
}

export interface OtelResourceAttributes {
  'service.name': string;
  'service.version'?: string;
  'deployment.environment'?: string;
  [key: string]: string | undefined;
}

export interface OtelExporterOptions {
  endpoint?: string;
  resource?: OtelResourceAttributes;
  headers?: Record<string, string>;
  batchIntervalMs?: number;
}

export type OtelDataPoint = {
  value: number;
  labels: Record<string, string>;
  timestamp: string;
};

export type OtelMetricData = {
  name: string;
  type: string;
  unit?: string;
  description: string;
  dataPoints: OtelDataPoint[];
};

function toOtelFormat(metrics: CognitiveMetric[]): OtelMetricData[] {
  const grouped = new Map<string, CognitiveMetric[]>();
  for (const m of metrics) {
    const list = grouped.get(m.name) ?? [];
    list.push(m);
    grouped.set(m.name, list);
  }

  const result: OtelMetricData[] = [];
  for (const [name, group] of grouped) {
    const first = group[0]!;
    result.push({
      name,
      type: first.type,
      unit: first.unit,
      description: first.description,
      dataPoints: group.map((m) => ({
        value: m.value,
        labels: m.labels,
        timestamp: m.timestamp,
      })),
    });
  }
  return result;
}

export class ConsoleOtelExporter implements OtelMetricExporter {
  private readonly resource: OtelResourceAttributes;

  constructor(opts: OtelExporterOptions = {}) {
    this.resource = opts.resource ?? { 'service.name': 'szl-cognitive-platform' };
  }

  async export(metrics: CognitiveMetric[]): Promise<void> {
    const payload = {
      resource: this.resource,
      metrics: toOtelFormat(metrics),
      exportedAt: new Date().toISOString(),
    };
    console.log('[CognitiveObservability] OTel export:', JSON.stringify(payload, null, 2));
  }

  async shutdown(): Promise<void> {}
}

export class HttpOtelExporter implements OtelMetricExporter {
  private readonly endpoint: string;
  private readonly headers: Record<string, string>;
  private readonly resource: OtelResourceAttributes;

  constructor(opts: OtelExporterOptions & { endpoint: string }) {
    this.endpoint = opts.endpoint;
    this.headers = opts.headers ?? {};
    this.resource = opts.resource ?? { 'service.name': 'szl-cognitive-platform' };
  }

  async export(metrics: CognitiveMetric[]): Promise<void> {
    const payload = {
      resource: this.resource,
      metrics: toOtelFormat(metrics),
      exportedAt: new Date().toISOString(),
    };

    await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.headers },
      body: JSON.stringify(payload),
    });
  }

  async shutdown(): Promise<void> {}
}

export class BatchingExporter implements OtelMetricExporter {
  private readonly inner: OtelMetricExporter;
  private readonly collector: MetricCollector;
  private readonly intervalMs: number;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(inner: OtelMetricExporter, collector: MetricCollector, intervalMs = 60000) {
    this.inner = inner;
    this.collector = collector;
    this.intervalMs = intervalMs;
  }

  start(): void {
    this.intervalHandle = setInterval(() => {
      const metrics = this.collector.flush();
      if (metrics.length > 0) {
        void this.inner.export(metrics);
      }
    }, this.intervalMs);
  }

  async export(metrics: CognitiveMetric[]): Promise<void> {
    await this.inner.export(metrics);
  }

  async shutdown(): Promise<void> {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    const remaining = this.collector.flush();
    if (remaining.length > 0) {
      await this.inner.export(remaining);
    }
    await this.inner.shutdown();
  }
}

export function toOtelPayload(
  metrics: CognitiveMetric[],
  resource: OtelResourceAttributes,
): unknown {
  return {
    resource,
    metrics: toOtelFormat(metrics),
    exportedAt: new Date().toISOString(),
  };
}
